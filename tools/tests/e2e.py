"""
Testes de ponta a ponta da Fanny Acessórios (Playwright + Python), com o catálogo real.

Como rodar (na pasta acima do projeto, para simular o GitHub Pages em /fanny-acessorios/):
    python3 -m http.server 8766        # em /caminho/para/a/pasta-pai
    python3 fanny-acessorios/tools/tests/e2e.py
"""
import asyncio, re, sys, json
from urllib.parse import urlparse, parse_qs
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8766/fanny-acessorios/"
ROOT = Path(__file__).resolve().parents[2]
WA = "5531992919133"

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("  ✔ " if cond else "  ✘ ") + name + (f"  [{detail}]" if detail and not cond else ""))

def brl(v):
    return "R$ " + f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def wa_text(url):
    return parse_qs(urlparse(url).query).get("text", [""])[0]

async def new_ctx(browser, mobile=False):
    ctx = await browser.new_context(
        viewport={"width": 390, "height": 844} if mobile else {"width": 1366, "height": 900},
        is_mobile=mobile, has_touch=mobile,
    )
    await ctx.route("https://wa.me/**", lambda r: r.fulfill(status=200, content_type="text/html", body="<p>wa.me (teste)</p>"))
    return ctx

async def add(page, pid, choose, qty=None):
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

PERS = lambda txt: [("radio", "personalizar", "Sim"), ("radio", "estilo", "Nome"), ("text", "texto", txt)]
LISO = [("radio", "personalizar", "Não")]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await new_ctx(browser)
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        print("Catálogo oficial")
        await page.goto(BASE + "catalogo/")
        await page.wait_for_selector(".card")
        check("Catálogo lista os 12 produtos da planilha", await page.locator(".card").count() == 12)
        body = await page.inner_text("main")
        check("Sem aviso de demonstração nem selo 'Exemplo'", "Catálogo em montagem" not in body and "Exemplo" not in body)
        card = page.locator(".card", has_text="Copo Térmico Lagoinha com Tampa 360 ml")
        ctext = await card.inner_text()
        check("Card mostra preço promocional e preço anterior (R$ 20,00 / R$ 25,00) com selo Oferta", "R$ 20,00" in ctext and "R$ 25,00" in ctext and "Oferta" in ctext, ctext)
        await page.goto(BASE + "ofertas/")
        await page.wait_for_selector(".card")
        names = await page.locator(".card__title").all_inner_texts()
        check("Página Ofertas mostra só os 8 produtos com promoção", len(names) == 8 and "Garrafa 350 ml" not in names and "Xícara Térmica com Tampa 360 ml" not in names, str(names))
        await page.goto(BASE)
        feat = await page.locator("[data-home-featured] .card__title").all_inner_texts()
        check("Destaques da home = produtos marcados 'Sim' na planilha (7)", len(feat) == 7 and "Cuia Térmica com Tampa 360 ml" not in feat, str(feat))
        check("Seção de ofertas aparece na home", await page.locator("[data-home-offers]").is_visible())

        print("Validação")
        await page.goto(BASE + "produto/?id=copo-termico-lagoinha-360ml")
        await page.click(".pdp__add")
        await expect(page.locator("[data-form-alert]")).to_be_visible()
        check("Sem escolher 'Deseja personalizar?' não adiciona", (await cart_lines(page)) == [])
        await page.locator('input[name="personalizar"][value="Sim"]').check(force=True)
        price = await page.locator("[data-price]").inner_text()
        check("Preço na página soma a personalização (R$ 25,99, riscado R$ 30,99)", "R$ 25,99" in price and "R$ 30,99" in price, price)

        print("Teste A — compra simples com promoção")
        await add(page, "copo-termico-lagoinha-360ml", LISO)
        txt = await page.locator("#cart-drawer").inner_text()
        check("Copo liso entra pelo preço promocional R$ 20,00", "R$ 20,00" in txt and "Total dos produtos" in txt, txt[-200:])
        await page.keyboard.press("Escape")

        print("Teste B/C/D — categorias, personalização e configurações diferentes")
        await add(page, "copo-termico-lagoinha-360ml", PERS("Ana"), qty=2)        # 2 × 25,99
        await add(page, "xicara-termica-360ml", PERS("Bia"))                       # 35 + 5,99 = 40,99
        await add(page, "caneca-termica-360ml", LISO)                              # 35 (promo)
        await add(page, "copo-termico-lagoinha-260ml", LISO, qty=3)               # 3 × 20
        lines = await cart_lines(page)
        lag = [l for l in lines if l["id"] == "copo-termico-lagoinha-360ml"]
        check("Mesmo copo liso e personalizado viram linhas separadas", len(lag) == 2, str(lag))
        await page.goto(BASE + "carrinho/")
        await page.wait_for_selector(".line")
        expected = round(20 + 2 * 25.99 + 40.99 + 35 + 3 * 20, 2)
        totals = await page.locator("[data-totals]").inner_text()
        check(f"Total correto com promoções e acréscimos ({brl(expected)})", brl(expected) in totals, totals)
        body = await page.locator("[data-lines]").inner_text()
        check("Personalização preservada no carrinho (Ana, Bia)", "Ana" in body and "Bia" in body)

        print("Teste E/F/G — quantidade, persistência, remoção")
        line = page.locator(".lines--page .line", has_text="260 ml")
        await line.locator('[data-act="dec"]').click()
        expected -= 20
        check(f"Diminuir quantidade recalcula ({brl(expected)})", brl(expected) in await page.locator("[data-totals]").inner_text())
        await page.reload(); await page.wait_for_selector(".line")
        check("Carrinho mantém os itens após recarregar", await page.locator(".lines--page .line").count() == 5)
        await page.locator(".lines--page .line", has_text="Caneca Térmica").locator('[data-act="remove"]').click()
        expected -= 35
        check(f"Remover recalcula ({brl(expected)})", brl(expected) in await page.locator("[data-totals]").inner_text())

        print("Teste H — personalização sob orçamento e capinha sob consulta")
        await add(page, "garrafa-600ml", PERS("Léo"))
        await add(page, "capinha-personalizada", [("select", "marca", "Samsung"), ("text", "modelo", "Galaxy A15"), ("radio", "estilo", "Foto ou arte"), ("text", "referencia", "Foto da família")])
        await page.goto(BASE + "carrinho/")
        totals = await page.locator("[data-totals]").inner_text()
        check("Mostra subtotal conhecido e itens a confirmar, sem total final", "Subtotal com preço definido" in totals and brl(expected) in totals and "Total dos produtos" not in totals, totals)
        g = await page.locator(".lines--page .line", has_text="Garrafa 600 ml").inner_text()
        check("Garrafa mostra R$ 50,00 + personalização a confirmar", "R$ 50,00" in g and "personalização a confirmar" in g, g)

        print("Teste I — mensagem do WhatsApp")
        await page.fill("#c-name", "Maria Teste")
        await page.locator('input[name="receive"][value="Retirar na loja"]').check(force=True)
        await page.locator('input[name="payment"][value="Pix"]').check(force=True)
        await page.fill("#c-notes", "É para presente")
        await page.wait_for_timeout(300)
        async with page.expect_popup() as pop:
            await page.click("[data-send]")
        popup = await pop.value
        url = popup.url
        msg = wa_text(url)
        check(f"Link usa o número {WA}", url.startswith(f"https://wa.me/{WA}?text="), url[:60])
        must = ["*Cliente:* Maria Teste", "*Recebimento:* Retirar na loja", "*Pagamento:* Pix", "Copo Térmico Lagoinha com Tampa 360 ml",
                "Valor unitário: R$ 25,99", "Subtotal: R$ 51,98", "Xícara Térmica", "R$ 40,99", "Garrafa 600 ml", "R$ 50,00 + personalização (a confirmar)",
                "Capinha Personalizada para Celular", "Galaxy A15", "Valor: a confirmar (preço sob consulta)", "É para presente", f"Subtotal dos itens com preço definido:* {brl(expected)}"]
        missing = [m for m in must if m not in msg]
        check("Mensagem completa (itens, opções, preços, recebimento, pagamento)", not missing, str(missing))
        check("Retirada na loja não pede frete", "Frete" not in msg)
        await popup.close()

        print("Teste J — integridade")
        sent = page.locator("[data-sent]")
        await expect(sent).to_be_visible()
        check("Mostra 'pedido preparado' e mantém o carrinho", "preparado" in (await sent.inner_text()).lower() and len(await cart_lines(page)) == 6)
        check("Não afirma que a loja recebeu", not re.search(r"recebid|pedido enviado|compra conclu", (await page.content()).lower()))

        print("Informações da loja")
        await page.goto(BASE + "contato/")
        c = await page.inner_text("main")
        check("Contato mostra endereço, horário, entrega, pagamento e trocas", all(s in c for s in ["Shopping Oiapoque", "Box M19/20", "8h às 20h", "todo o Brasil", "Pix", "Código de Defesa do Consumidor", "15 unidades"]))
        f = await page.inner_text("footer")
        check("Rodapé mostra endereço e WhatsApp novo", "Shopping Oiapoque" in f and "(31) 99291-9133" in f)
        await page.goto(BASE + "produto/?id=garrafa-350ml")
        s = await page.inner_text(".pdp__service")
        check("Página de produto mostra retirada, entrega e pagamento", "Shopping Oiapoque" in s and "todo o Brasil" in s)
        head = await page.goto(BASE); html = await page.content()
        check("SEO: canonical no domínio fannypersonalizados.com.br", 'rel="canonical" href="https://fannypersonalizados.com.br/' in html)

        print("Busca e filtros")
        await page.goto(BASE + "busca/?q=caneca")
        await page.wait_for_selector(".card")
        n = await page.locator(".card").count()
        check("Busca 'caneca' encontra xícara, caneca e canecão", n >= 3, str(n))
        await page.goto(BASE + "busca/?q=termica")
        await page.wait_for_selector(".card")
        tn = await page.locator(".card__title").all_inner_texts()
        check("Busca sem acento ('termica' encontra 'Xícara Térmica')", "Xícara Térmica com Tampa 360 ml" in tn, str(tn))
        await page.goto(BASE + "categorias/garrafas/")
        await page.wait_for_selector(".card")
        await page.locator('.facet input[name="tipo"][value="Garrafas com temperatura"]').check(force=True)
        check("Filtro por tipo nas garrafas", await page.locator(".card").count() == 1)
        await page.goto(BASE + "catalogo/")
        await page.wait_for_selector(".card")
        await page.select_option("[data-sort]", "menor-preco")
        names = await page.locator(".card__title").all_inner_texts()
        first = await page.locator(".card .price__now").first.inner_text()
        check("Ordenar por menor preço (R$ 20,00 primeiro, capinha sob consulta por último)", "R$ 20,00" in first and names[-1] == "Capinha Personalizada para Celular", f"{first} {names[-1]}")
        check("Sem erros de JavaScript no desktop", not errors, str(errors[:3]))
        await ctx.close()

        print("Teste K — celular (390 px)")
        ctx = await new_ctx(browser, mobile=True)
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(BASE)
        await page.locator(".tabbar button", has_text="Categorias").click()
        await page.locator("#mobile-nav a", has_text="Capas Personalizadas").click()
        await page.wait_for_url("**/categorias/capas-personalizadas/")
        await add(page, "capinha-personalizada", [("select", "marca", "Apple (iPhone)"), ("text", "modelo", "iPhone 13"), ("radio", "estilo", "Nome"), ("text", "texto", "Lu")])
        await expect(page.locator("#cart-drawer")).to_be_visible()
        await page.locator("#cart-drawer a", has_text="Revisar e enviar pedido").click()
        await page.wait_for_url("**/carrinho/")
        send = page.locator("[data-send]")
        await send.scroll_into_view_if_needed()
        box = await send.bounding_box(); tab = await page.locator(".tabbar").bounding_box()
        check("Botão de envio não fica coberto pela barra inferior", box["y"] + box["height"] <= tab["y"] + 1)
        async with page.expect_popup() as pop:
            await send.click()
        msg = wa_text((await pop.value).url)
        check("Mensagem no celular inclui modelo e texto", "iPhone 13" in msg and "Lu" in msg)
        check("Sem rolagem horizontal (390 px)", await page.evaluate("document.documentElement.scrollWidth") <= 390)
        check("Sem erros de JavaScript no celular", not errors, str(errors[:3]))
        await ctx.close()

        print("Teste L — publicação em subpasta")
        ctx = await browser.new_context()
        page = await ctx.new_page()
        pages = ["", "catalogo/", "busca/", "categorias/", "ofertas/", "produto/?id=capinha-personalizada", "carrinho/", "sobre/", "contato/"]
        pages += re.findall(r"<loc>[^<]*?/(categorias/[a-z-]+/)</loc>", (ROOT / "sitemap.xml").read_text())
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
        # todas as fotos de produto
        from subprocess import run
        prods = run(["node", "--input-type=module", "-e", "import('./assets/js/products.js').then(m=>console.log(JSON.stringify(m.PRODUCTS.flatMap(p=>p.images.map(i=>i.src)))))"], cwd=ROOT, capture_output=True, text=True).stdout
        for src in json.loads(prods):
            rr = await page.request.get(BASE + src)
            if rr.status != 200: bad.append(("foto", src, rr.status))
        check(f"Páginas, links, arquivos e 12 fotos respondem 200 ({len(seen)} URLs)", not bad, str(bad[:5]))
        await ctx.close()
        await browser.close()

    ok = sum(1 for r in results if r[1])
    print(f"\n{ok}/{len(results)} verificações passaram.")
    (ROOT / "tools/tests/ultimo-resultado.json").write_text(json.dumps([{"teste": n, "ok": o, "detalhe": d} for n, o, d in results], ensure_ascii=False, indent=1))
    sys.exit(0 if ok == len(results) else 1)

asyncio.run(main())
