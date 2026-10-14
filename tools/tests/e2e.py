"""
Testes de ponta a ponta da Fanny Acessórios (Playwright + Python).

Como rodar (na pasta acima do projeto, para simular o GitHub Pages em /fanny-acessorios/):
    python3 -m http.server 8766        # em /caminho/para/a/pasta-pai
    python3 fanny-acessorios/tools/tests/e2e.py

Os testes de preço usam uma cópia do catálogo com preços FICTÍCIOS injetada
apenas no navegador de teste (page.route). Nenhum preço é gravado no site.
"""
import asyncio, re, sys, json
from urllib.parse import urlparse, parse_qs, unquote
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8766/fanny-acessorios/"
ROOT = Path(__file__).resolve().parents[2]
PRODUCTS_SRC = (ROOT / "assets/js/products.js").read_text(encoding="utf-8")

# Preços fictícios só para validar a matemática do carrinho
TEST_PRICES = {"garrafa-colorida-com-alca": 49.9, "copo-termico-com-tampa": 59.9, "caneca-colorida": 29.9, "capa-personalizada": 39.9}

def priced_catalog():
    src = PRODUCTS_SRC
    for pid, price in TEST_PRICES.items():
        pattern = re.compile(r'(id: "%s",[\s\S]*?price: )null' % re.escape(pid))
        src, n = pattern.subn(lambda m: m.group(1) + str(price), src, count=1)
        assert n == 1, pid
    return src

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("  ✔ " if cond else "  ✘ ") + name + (f"  [{detail}]" if detail and not cond else ""))

def wa_text(url):
    q = parse_qs(urlparse(url).query)
    return q.get("text", [""])[0]

async def new_ctx(browser, mobile=False, priced=True):
    ctx = await browser.new_context(
        viewport={"width": 390, "height": 844} if mobile else {"width": 1366, "height": 900},
        is_mobile=mobile, has_touch=mobile,
    )
    if priced:
        body = priced_catalog()
        await ctx.route("**/assets/js/products.js", lambda r: r.fulfill(status=200, content_type="text/javascript", body=body))
    await ctx.route("https://wa.me/**", lambda r: r.fulfill(status=200, content_type="text/html", body="<p>wa.me (teste)</p>"))
    return ctx

async def add(page, pid, choose, qty=None):
    """Abre o produto, preenche opções e adiciona. choose: lista de (tipo, nome, valor)."""
    await page.goto(BASE + f"produto/?id={pid}")
    await page.wait_for_selector("[data-form]")
    for kind, name, value in choose:
        if kind == "radio":
            await page.locator(f'input[name="{name}"][value="{value}"]').check(force=True)
        elif kind == "select":
            await page.select_option(f'select[name="{name}"]', value)
        else:
            await page.fill(f'[name="{name}"]', value)
    if qty is not None:
        await page.fill("#qty", str(qty))
        await page.locator("#qty").dispatch_event("change")
    await page.click(".pdp__add")
    await page.wait_for_timeout(250)

async def cart_lines(page):
    return await page.evaluate("JSON.parse(localStorage.getItem('fanny_acessorios_cart')||'{}').lines||[]")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # ---------------- Desktop, catálogo com preços de teste ----------------
        ctx = await new_ctx(browser)
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        print("Validação de campos obrigatórios")
        await page.goto(BASE + "produto/?id=capa-personalizada")
        await page.click(".pdp__add")
        alert = page.locator("[data-form-alert]")
        await expect(alert).to_be_visible()
        check("Formulário vazio mostra erros e não adiciona", (await cart_lines(page)) == [] and await page.locator(".field__error:visible").count() >= 3)

        print("Teste A — compra simples")
        await add(page, "garrafa-colorida-com-alca", [("radio", "cor", "Verde-água")])
        drawer = page.locator("#cart-drawer")
        await expect(drawer).to_be_visible()
        txt = await drawer.inner_text()
        check("Gaveta abre após adicionar", "Garrafa colorida com alça" in txt)
        check("Subtotal correto (1 × R$ 49,90)", "R$ 49,90" in txt and "Total dos produtos" in txt, txt[-200:])
        await page.keyboard.press("Escape")

        print("Teste B/C — várias categorias e personalização")
        await add(page, "copo-termico-com-tampa", [("radio", "cor", "Preto"), ("radio", "personalizar", "Não")])
        await add(page, "caneca-colorida", [("text", "cor", "Branca")], qty=2)
        await add(page, "capa-personalizada", [
            ("select", "marca", "Samsung"), ("text", "modelo", "Galaxy A15"), ("radio", "base", "Colorida"),
            ("radio", "cor", "Rosa-chiclete"), ("radio", "estilo", "Nome"), ("text", "texto", "Maria")])
        lines = await cart_lines(page)
        cats = {l["id"] for l in lines}
        check("4 produtos de categorias diferentes no carrinho", len(lines) == 4 and {"garrafa-colorida-com-alca", "copo-termico-com-tampa", "caneca-colorida", "capa-personalizada"} <= cats)
        await page.goto(BASE + "carrinho/")
        await page.wait_for_selector(".line")
        body = await page.locator("[data-lines]").inner_text()
        check("Personalização preservada (modelo, cor, texto)", all(s in body for s in ["Galaxy A15", "Rosa-chiclete", "Maria", "Samsung", "Colorida"]))
        check("Opção oculta não vai para o carrinho (copo sem personalização)", "Tipo de personalização" not in body.split("Copo térmico com tampa")[1].split("Caneca colorida")[0])

        print("Teste D — mesmo produto, personalizações diferentes")
        await add(page, "capa-personalizada", [
            ("select", "marca", "Samsung"), ("text", "modelo", "Galaxy A15"), ("radio", "base", "Colorida"),
            ("radio", "cor", "Rosa-chiclete"), ("radio", "estilo", "Nome"), ("text", "texto", "João")])
        await add(page, "capa-personalizada", [
            ("select", "marca", "Samsung"), ("text", "modelo", "Galaxy A15"), ("radio", "base", "Colorida"),
            ("radio", "cor", "Rosa-chiclete"), ("radio", "estilo", "Nome"), ("text", "texto", "Maria")])
        lines = await cart_lines(page)
        capas = [l for l in lines if l["id"] == "capa-personalizada"]
        check("Duas configurações distintas viram duas linhas", len(capas) == 2, str(capas))
        maria = [l for l in capas if l["options"].get("texto") == "Maria"]
        check("Configuração idêntica soma quantidade (Maria = 2)", maria and maria[0]["qty"] == 2)

        print("Teste E — quantidade")
        await page.goto(BASE + "carrinho/")
        line = page.locator(".lines--page .line", has_text="Garrafa colorida com alça")
        await line.locator('[data-act="inc"]').click()
        await line.locator('[data-act="inc"]').click()
        line = page.locator(".lines--page .line", has_text="Garrafa colorida com alça")
        check("Aumentar para 3 → subtotal R$ 149,70", "R$ 149,70" in await line.inner_text())
        await line.locator('[data-act="dec"]').click()
        line = page.locator(".lines--page .line", has_text="Garrafa colorida com alça")
        check("Diminuir para 2 → subtotal R$ 99,80", "R$ 99,80" in await line.inner_text())
        qty = line.locator('input[data-act="qty"]')
        await qty.fill("-5"); await qty.dispatch_event("change")
        line = page.locator(".lines--page .line", has_text="Garrafa colorida com alça")
        v1 = await line.locator('input[data-act="qty"]').input_value()
        await line.locator('input[data-act="qty"]').fill("2.7"); await line.locator('input[data-act="qty"]').dispatch_event("change")
        line = page.locator(".lines--page .line", has_text="Garrafa colorida com alça")
        v2 = await line.locator('input[data-act="qty"]').input_value()
        check("Quantidade inválida é corrigida (-5 → 1, 2.7 → 2)", v1 == "1" and v2 == "2", f"{v1},{v2}")
        dec_disabled = await page.locator(".lines--page .line", has_text="Copo térmico").locator('[data-act="dec"]').is_disabled()
        check("Não permite quantidade abaixo de 1", dec_disabled)

        # total esperado: garrafa 2×49,90 + copo 59,90 + caneca 2×29,90 + capa Maria 2×39,90 + capa João 39,90
        expected = round(2*49.9 + 59.9 + 2*29.9 + 2*39.9 + 39.9, 2)
        exp_str = f"R$ {expected:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        totals = await page.locator("[data-totals]").inner_text()
        check(f"Total geral correto ({exp_str})", exp_str in totals, totals)

        print("Teste F — persistência")
        await page.reload()
        await page.wait_for_selector(".line")
        check("Carrinho mantém itens após recarregar", await page.locator(".lines--page .line").count() == 5)
        await page.goto(BASE + "catalogo/")
        check("Contador do cabeçalho reflete as unidades", (await page.locator(".site-header [data-cart-count]").inner_text()).strip() == "8")

        print("Teste G — remoção")
        await page.goto(BASE + "carrinho/")
        await page.locator(".lines--page .line", has_text="Caneca colorida").locator('[data-act="remove"]').click()
        expected2 = round(expected - 2*29.9, 2)
        exp2 = f"R$ {expected2:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        totals = await page.locator("[data-totals]").inner_text()
        check(f"Total recalculado após remover ({exp2})", exp2 in totals and await page.locator(".lines--page .line").count() == 4, totals)

        print("Teste H — produto sob orçamento misturado")
        await add(page, "caneca-personalizada", [("radio", "estilo", "Foto ou arte própria"), ("text", "referencia", "Foto do meu gato")])
        await page.goto(BASE + "carrinho/")
        totals = await page.locator("[data-totals]").inner_text()
        check("Mostra subtotal conhecido e aviso de valor a confirmar, sem total final", "Subtotal com preço definido" in totals and "a confirmar" in totals.lower() and "Total dos produtos" not in totals, totals)
        # editar item a partir do carrinho
        await page.locator(".lines--page .line", has_text="Copo térmico").locator("a.link-btn", has_text="Editar").click()
        await page.wait_for_selector(".notice--edit")
        await page.locator('input[name="personalizar"][value="Sim"]').check(force=True)
        await page.locator('input[name="estilo"][value="Iniciais"]').check(force=True)
        await page.fill('[name="texto"]', "L.M.")
        await page.click(".pdp__add")
        await page.wait_for_url("**/carrinho/")
        copo = await page.locator(".lines--page .line", has_text="Copo térmico").inner_text()
        check("Editar opções a partir do carrinho substitui o item", "L.M." in copo and await page.locator(".lines--page .line").count() == 5)

        print("Teste I — mensagem e link do WhatsApp")
        await page.fill("#c-name", "Maria Teste")
        await page.locator('input[name="contact"][value="Ligação"]').check(force=True)
        await page.fill("#c-notes", "É para presente")
        await page.wait_for_timeout(300)
        async with page.expect_popup() as pop:
            await page.click("[data-send]")
        popup = await pop.value
        url = popup.url
        msg = wa_text(url)
        check("Link usa o número 5531992919133", url.startswith("https://wa.me/5531992919133?text="), url[:60])
        must = ["Olá, Fanny!", "*PEDIDO — FANNY ACESSÓRIOS*", "*Cliente:* Maria Teste", "Ligação", "Garrafa colorida com alça", "Capa personalizada com nome ou frase",
                "Galaxy A15", "Maria", "João", "Caneca personalizada", "Valor: a confirmar", "Subtotal dos itens com preço definido", "É para presente", "L.M."]
        missing = [m for m in must if m not in msg]
        check("Mensagem contém itens, opções, quantidades e observações", not missing, str(missing))
        check("Mensagem não inventa frete/desconto", not re.search(r"frete grátis|desconto", msg, re.I))
        enc = urlparse(url).query
        check("Texto codificado (sem espaços/quebras crus na URL)", " " not in enc and "\n" not in enc)

        print("Teste J — integridade após abrir o WhatsApp")
        await popup.close()
        sent = page.locator("[data-sent]")
        await expect(sent).to_be_visible()
        stxt = await sent.inner_text()
        check("Mostra que o pedido foi PREPARADO e precisa ser enviado", "preparado" in stxt.lower() and "enviar" in stxt.lower())
        check("Não afirma que a loja recebeu/confirmou", not re.search(r"recebid|pedido enviado|compra conclu|confirmad[oa] com sucesso", (await page.content()).lower()))
        check("Carrinho NÃO é limpo automaticamente", len(await cart_lines(page)) == 5)

        print("Busca e filtros")
        await page.goto(BASE + "catalogo/")
        await page.fill("#q-top", "garrafa")
        await page.wait_for_selector("#suggest-top li")
        check("Sugestões aparecem no cabeçalho", await page.locator("#suggest-top li").count() >= 2)
        await page.press("#q-top", "Enter")
        await page.wait_for_url("**/busca/?q=garrafa")
        await page.wait_for_selector(".card")
        n = await page.locator(".card").count()
        check("Página de busca lista resultados para 'garrafa'", n >= 3, str(n))
        await page.fill("#q-page", "xyzabc")
        await page.wait_for_timeout(400)
        check("Estado sem resultados com saída para o WhatsApp", await page.locator(".empty .btn--wa").count() == 1)
        await page.fill("#q-page", "garrafa termica")
        await page.wait_for_timeout(400)
        names = await page.locator(".card__title").all_inner_texts()
        check("Busca ignora acentos ('termica' encontra 'térmica')", any("térmica" in x.lower() for x in names), str(names))
        await page.goto(BASE + "categorias/garrafas/")
        await page.wait_for_selector(".card")
        before = await page.locator(".card").count()
        await page.locator('.facet input[name="tipo"][value="Garrafas térmicas"]').check(force=True)
        after = await page.locator(".card").count()
        check("Filtro por tipo altera resultados", after == 2 and before > after, f"{before}->{after}")
        check("Filtro fica na URL", "tipo=" in page.url)
        await page.locator("[data-chip]").first.click()
        check("Chip remove o filtro", await page.locator(".card").count() == before)
        await page.goto(BASE + "categorias/garrafas/")
        await page.locator('.facet input[name="cor"][value="Pink"]').check(force=True)
        names = await page.locator(".card__title").all_inner_texts()
        check("Filtro por cor", names == ["Garrafa térmica de tampa rosqueável"], str(names))
        await page.goto(BASE + "catalogo/")
        await page.select_option("[data-sort]", "az")
        names = await page.locator(".card__title").all_inner_texts()
        check("Ordenação alfabética", names == sorted(names, key=lambda s: s.lower()) or names[0].startswith("A"), str(names[:3]))
        await page.goto(BASE + "catalogo/")
        await page.wait_for_selector(".card")
        c1 = await page.locator(".card").count()
        more_hidden = await page.locator("[data-more]").is_hidden()
        check("Catálogo lista os 10 produtos sem botão 'Mostrar mais' desnecessário", c1 == 10 and more_hidden, f"{c1} {more_hidden}")
        await page.goto(BASE + "catalogo/?pers=1")
        await page.wait_for_selector(".card")
        names = await page.locator(".card__title").all_inner_texts()
        check("Link 'Ver personalizados' filtra só personalizáveis", len(names) == 6 and "Caneca colorida" not in names, str(names))

        check("Sem erros de JavaScript no desktop", not errors, str(errors[:3]))
        await ctx.close()

        # ---------------- Catálogo real (sem preços): tudo sob consulta ----------------
        print("Catálogo de demonstração (preços nulos)")
        ctx = await new_ctx(browser, priced=False)
        page = await ctx.new_page()
        await add(page, "garrafa-termica-preta", [])
        await page.goto(BASE + "carrinho/")
        totals = await page.locator("[data-totals]").inner_text()
        check("Sem preços: total 'A confirmar', sem R$ inventado", "A confirmar" in totals and "R$" not in totals, totals)
        await page.locator("details.preview summary").click()
        prev = await page.locator("[data-preview]").inner_text()
        check("Prévia da mensagem diz 'Valores: a confirmar'", "a confirmar" in prev.lower() and "R$" not in prev)
        await page.goto(BASE + "produto/?id=nao-existe")
        await page.wait_for_selector("text=Produto não encontrado")
        check("Produto inexistente mostra página amigável", "Produto não encontrado" in await page.inner_text("main"))
        await ctx.close()

        # ---------------- Teste K — celular ----------------
        print("Teste K — fluxo no celular (390 px)")
        ctx = await new_ctx(browser, mobile=True)
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(BASE)
        check("Barra inferior visível no celular", await page.locator(".tabbar").is_visible())
        await page.locator(".tabbar button", has_text="Categorias").click()
        await expect(page.locator("#mobile-nav")).to_be_visible()
        await page.locator("#mobile-nav a", has_text="Capas Personalizadas").click()
        await page.wait_for_url("**/categorias/capas-personalizadas/")
        await page.click("[data-open-filters]")
        await expect(page.locator(".filters.is-open")).to_be_visible()
        await page.locator('.filters input[name="tipo"][value="Foto ou arte"]').check(force=True)
        await page.locator(".filters__foot [data-close-filters]").click()
        check("Filtros em painel no celular funcionam", await page.locator(".card").count() == 1)
        await add(page, "capa-personalizada", [("select", "marca", "Apple (iPhone)"), ("text", "modelo", "iPhone 13"), ("radio", "base", "Colorida"), ("radio", "cor", "Verde-água"), ("radio", "estilo", "Iniciais"), ("text", "texto", "A.B.")])
        await expect(page.locator("#cart-drawer")).to_be_visible()
        await page.locator("#cart-drawer a", has_text="Revisar e enviar pedido").click()
        await page.wait_for_url("**/carrinho/")
        send = page.locator("[data-send]")
        await send.scroll_into_view_if_needed()
        box = await send.bounding_box()
        tab = await page.locator(".tabbar").bounding_box()
        check("Botão de envio não fica coberto pela barra inferior", box["y"] + box["height"] <= tab["y"] + 1, f"{box} {tab}")
        async with page.expect_popup() as pop:
            await send.click()
        msg = wa_text((await pop.value).url)
        check("Mensagem no celular inclui modelo e cor", "iPhone 13" in msg and "Verde-água" in msg)
        sw = await page.evaluate("document.documentElement.scrollWidth")
        check("Sem rolagem horizontal no carrinho (390 px)", sw <= 390, str(sw))
        check("Sem erros de JavaScript no celular", not errors, str(errors[:3]))
        await ctx.close()

        # ---------------- Teste L — publicação (links e arquivos) ----------------
        print("Teste L — caminhos em subpasta (GitHub Pages)")
        ctx = await browser.new_context()
        page = await ctx.new_page()
        pages = ["", "catalogo/", "busca/", "categorias/", "produto/?id=capa-personalizada", "carrinho/", "sobre/", "contato/"]
        pages += [l for l in re.findall(r"<loc>[^<]*?/(categorias/[a-z-]+/)</loc>", (ROOT / "sitemap.xml").read_text())]
        bad, seen = [], set()
        for pth in pages:
            resp = await page.goto(BASE + pth)
            if not resp or resp.status != 200:
                bad.append((pth, resp.status if resp else None)); continue
            await page.wait_for_load_state("networkidle")
            refs = await page.evaluate("""() => [...document.querySelectorAll('a[href],link[href],script[src],img[src],source[srcset],use')]
                .map(e => e.href?.baseVal ? new URL(e.href.baseVal, location.href).href : (e.href || e.src || (e.srcset ? new URL(e.srcset, location.href).href : '')))
                .filter(u => u && u.startsWith(location.origin))""")
            for r in refs:
                u = r.split("#")[0]
                if u in seen: continue
                seen.add(u)
                rr = await page.request.get(u)
                if rr.status != 200: bad.append((pth, u, rr.status))
        check(f"Todas as páginas, links internos e arquivos respondem 200 ({len(seen)} URLs)", not bad, str(bad[:5]))
        r404 = await page.goto(BASE + "pagina-que-nao-existe/")
        check("404.html existe (GitHub Pages usa automaticamente)", (ROOT / "404.html").exists())
        await ctx.close()
        await browser.close()

    ok = sum(1 for r in results if r[1])
    print(f"\n{ok}/{len(results)} verificações passaram.")
    (ROOT / "tools/tests/ultimo-resultado.json").write_text(json.dumps([{"teste": n, "ok": o, "detalhe": d} for n, o, d in results], ensure_ascii=False, indent=1))
    sys.exit(0 if ok == len(results) else 1)

asyncio.run(main())
