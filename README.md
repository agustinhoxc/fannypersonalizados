# Fanny Acessórios — site da loja

Site estático em HTML, CSS e JavaScript puro, sem servidor, sem banco de dados e sem dependências. Ele tem:

- catálogo organizado por categorias;
- busca e filtros;
- página de produto com opções e personalização;
- carrinho salvo no navegador;
- envio do pedido pronto para o WhatsApp da loja.

Ele foi feito para ser publicado no **GitHub Pages**.

> **Status: catálogo oficial.** Os 12 produtos, preços, promoções, fotos e dados da loja vêm da planilha preenchida pela loja (`fanny-planilha-produtos.xlsx`, outubro de 2026). O site está configurado para o domínio **fannypersonalizados.com.br**.

---

## Sumário

1. [Estrutura](#estrutura)
2. [Rodar no computador](#rodar-no-computador)
3. [Publicar no GitHub Pages](#publicar-no-github-pages)
4. [Alterar WhatsApp, Instagram e textos](#alterar-whatsapp-instagram-e-textos)
5. [Cadastrar e editar produtos](#cadastrar-e-editar-produtos)
6. [Opções e personalização](#opções-e-personalização)
7. [Categorias](#categorias)
8. [Fotos, vídeo e personagem](#fotos-vídeo-e-personagem)
9. [Cores e identidade visual](#cores-e-identidade-visual)
10. [Atualizar o catálogo depois](#atualizar-o-catálogo-depois)
11. [Como funciona o pedido pelo WhatsApp](#como-funciona-o-pedido-pelo-whatsapp)
12. [Testes](#testes)
13. [Dados comerciais pendentes](#dados-comerciais-pendentes)

---

## Estrutura

```
fanny-acessorios/
├── index.html                 Home (hero com vídeo, vitrine de categorias, destaques)
├── catalogo/                  Todos os produtos, com filtros e ordenação
├── busca/                     Resultados da busca (?q=termo)
├── categorias/                Índice de categorias
│   └── <categoria>/           Uma pasta por categoria com produtos
├── produto/                   Página de produto (produto/?id=<id-do-produto>)
├── carrinho/                  Revisão do pedido e envio pelo WhatsApp
├── sobre/  contato/           Páginas institucionais
├── 404.html                   Página "não encontrado" (usada pelo GitHub Pages)
├── assets/
│   ├── css/                   fonts, tokens (cores), base, layout, components, catalog, cart, responsive
│   ├── js/
│   │   ├── config.js          ← WhatsApp, Instagram, textos, vídeo, personagem
│   │   ├── products.js        ← CATÁLOGO: categorias e produtos
│   │   ├── cart.js            carrinho (validação, preços, localStorage)
│   │   ├── whatsapp.js        montagem da mensagem do pedido
│   │   ├── catalog.js         listagens, filtros, ordenação
│   │   ├── product.js         página de produto
│   │   ├── search.js          busca
│   │   ├── ui.js              cards, gaveta do carrinho, menus
│   │   ├── home.js, cart-page.js, icons.js, storage.js, utils.js, main.js
│   ├── img/ brand/ hero/ products/ categories/ editorial/
│   ├── video/                 vídeo original + versões otimizadas
│   ├── fonts/                 Poppins e Noto Serif Display (hospedadas no site)
│   └── icons/                 ícones das categorias
├── tools/
│   ├── build.mjs              gerador das páginas HTML, sitemap e robots
│   └── tests/e2e.py           testes automáticos de ponta a ponta
├── sitemap.xml  robots.txt  favicon.svg  .nojekyll
```

**O que é editado à mão:** `assets/js/config.js`, `assets/js/products.js`, as imagens e `assets/css/tokens.css`.

**O que é gerado:** todos os `index.html`, `404.html`, `sitemap.xml` e `robots.txt`. O comando é `node tools/build.mjs`.

---

## Rodar no computador

O site usa módulos JavaScript. Por isso, ele precisa ser aberto por um servidor local, e não com dois cliques no arquivo (`file://`).

```bash
cd fanny-acessorios
python3 -m http.server 8000
# abra http://localhost:8000
```

Também funciona com `npx serve .` ou com a extensão "Live Server" do VS Code.

---

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo, `fanny-acessorios`) e envie todos os arquivos desta pasta para a raiz dele:
   ```bash
   git init
   git add .
   git commit -m "Site Fanny Acessórios"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/fanny-acessorios.git
   git push -u origin main
   ```
2. No GitHub, abra **Settings → Pages**.
3. Em **Source**, escolha **Deploy from a branch**. Em seguida, selecione a branch **main** e a pasta **/ (root)**, e salve.
4. Em um ou dois minutos, o site estará em `https://SEU-USUARIO.github.io/fanny-acessorios/`.
5. Abra `assets/js/config.js` e troque `siteUrl` pelo endereço real, sem a barra no final. Depois rode `node tools/build.mjs` e envie de novo (`git add . && git commit -m "siteUrl" && git push`). Isso corrige o `sitemap.xml`, o `robots.txt` e as tags de compartilhamento.

**Domínio próprio (fannypersonalizados.com.br):** o projeto já inclui o arquivo `CNAME` com o domínio. Falta só apontar o DNS no registro.br (ou onde o domínio foi comprado):

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ (raiz) | 185.199.108.153 |
| A | @ (raiz) | 185.199.109.153 |
| A | @ (raiz) | 185.199.110.153 |
| A | @ (raiz) | 185.199.111.153 |
| CNAME | www | SEU-USUARIO.github.io |

Depois, em **Settings → Pages**, confira se o domínio aparece em *Custom domain* e marque **Enforce HTTPS** quando a opção liberar (pode levar algumas horas). Enquanto o DNS não estiver pronto, o endereço `github.io` redireciona para o domínio e não abre; se quiser testar antes no `github.io`, apague temporariamente o arquivo `CNAME`. **Não apague o `CNAME` nas próximas atualizações.**

Todos os caminhos do site são relativos. Por isso ele funciona tanto em `usuario.github.io/fanny-acessorios/` quanto em um domínio próprio. O arquivo `.nojekyll` evita que o GitHub processe os arquivos.

---

## Alterar WhatsApp, Instagram e textos

Tudo fica em **`assets/js/config.js`**:

```js
whatsapp: "5531992919133",          // 55 + DDD + número, só dígitos
whatsappDisplay: "(31) 99291-9133", // como aparece escrito no site
instagram: {
  handle: "@fanny_oiapoque",
  url: "https://www.instagram.com/fanny_oiapoque/",
},
```

Todos os botões e links de WhatsApp usam a função `whatsappUrl()` desse mesmo arquivo. O número não aparece repetido em nenhum outro lugar do código.

Outros itens que você pode ajustar no mesmo arquivo:

- `announcement`: a faixa de aviso no topo. Use `enabled: false` para desligar.
- `whatsappMessage`: a saudação, o título e o fechamento da mensagem do pedido.
- `contactPreferences`: as opções de "Como prefere ser atendido?".
- `business`: endereço, horário, política de trocas e entrega. Enquanto estiverem como `null`, **não aparecem** no site.

> Depois de alterar o WhatsApp, o Instagram ou o `business`, rode `node tools/build.mjs`. O cabeçalho e o rodapé são gerados com esses dados. O carrinho e as páginas de produto leem o `config.js` direto e atualizam sozinhos.

---

## Cadastrar e editar produtos

Todos os produtos ficam em **`assets/js/products.js`**, na lista `PRODUCTS`. Exemplo completo:

```js
{
  id: "garrafa-termica-500",          // único, sem espaços nem acentos; aparece na URL
  name: "Garrafa térmica 500 ml",
  category: "copos",                   // id de uma categoria em CATEGORIES
  alsoIn: ["personalizados"],          // opcional: aparece também nessas categorias
  type: "Garrafas térmicas",           // vira o filtro "Tipo"
  description: "Texto curto sobre o produto.",
  details: ["Capacidade: 500 ml"],     // só características CONFIRMADAS
  price: 79.9,                         // em reais; use null para "Preço sob consulta"
  promoPrice: null,                    // preço promocional real (ativa "Ofertas")
  images: [
    { src: "assets/img/products/garrafa-500-rosa.webp", alt: "Garrafa térmica rosa", credit: "loja" },
  ],
  brand: null,                         // marca, se for produto de marca
  compatibility: [],                   // ex.: ["iPhone 13", "iPhone 14"] — vira o filtro "Compatibilidade"
  keywords: ["garrafa", "térmica", "inox"],
  personalizable: false,
  availability: "disponivel",          // "disponivel" | "consulta" | "indisponivel"
  featured: true,                      // aparece em "Produtos em destaque" na home
  isNew: false,                        // aparece em "Novidades" na home
  demo: false,                         // false = produto real
  options: [ /* ver próxima seção */ ],
},
```

**Preços**

- Altere `price`. O carrinho recalcula tudo sozinho, inclusive para quem já tinha o item no carrinho, porque o carrinho guarda só o `id` e as escolhas.
- `price: null` aparece como "Preço sob consulta". No pedido, o item vai como "valor a confirmar", e o site **não mostra um total final enganoso**.

**Remover um produto:** apague o bloco. Se alguém tiver esse item no carrinho, o site avisa e remove o item.

**Não é preciso rodar o gerador** para incluir produtos em categorias que já existem. Rode apenas para atualizar o `sitemap.xml`.

**Marcas e compatibilidade:** preencha `brand` e `compatibility` somente com informações confirmadas. Não apresente um produto genérico ou "compatível" como sendo de uma marca, como Stanley ou Apple.

---

## Opções e personalização

Cada produto tem uma lista `options`. Os tipos disponíveis são:

| Tipo       | Aparece como                          | Campos principais |
|------------|---------------------------------------|-------------------|
| `color`    | Bolinhas de cor (vira o filtro "Cor") | `values: [{ value, label, hex }]` |
| `choice`   | Botões lado a lado                    | `values: [{ value, label, price?, quote? }]` |
| `select`   | Lista suspensa                        | `values`, `allowOther: "Rótulo do campo livre"` |
| `text`     | Campo de texto curto                  | `maxLength`, `placeholder` |
| `textarea` | Campo de texto longo                  | `maxLength`, `placeholder` |

Campos comuns a todos os tipos:

- `id` e `label`;
- `required: true`: a pessoa não consegue adicionar ao carrinho sem preencher;
- `help`: texto de ajuda abaixo do campo;
- `showIf: { option: "id-de-outra-opcao", in: ["valor"] }`: o campo só aparece quando a outra opção tem um desses valores. Por exemplo, "Nome ou frase" só aparece se a pessoa escolher personalizar.

Valores com preço:

- `price: 10` em um valor soma R$ 10,00 ao preço unitário. Por exemplo, a opção "Tamanho grande" pode custar R$ 10,00 a mais.
- `quote: true` em um valor deixa o item "sujeito a orçamento". Por exemplo, "Foto ou arte própria".

Exemplo de personalização condicional:

```js
options: [
  { id: "cor", label: "Cor", type: "color", required: true,
    values: [{ value: "Rosa", label: "Rosa", hex: "#E2457A" }] },
  { id: "personalizar", label: "Deseja personalizar?", type: "choice", required: true,
    values: [{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }] },
  { id: "texto", label: "Nome ou frase", type: "text", maxLength: 30, required: true,
    showIf: { option: "personalizar", in: ["Sim"] } },
  { id: "estilo-arte", label: "Arte", type: "choice",
    showIf: { option: "personalizar", in: ["Sim"] },
    values: [{ value: "Fonte padrão", label: "Fonte padrão" },
             { value: "Arte própria", label: "Arte própria", quote: true }] },
]
```

No início de `products.js` há blocos prontos para reaproveitar: `deviceBrand`, `deviceModel`, `personalizationStyle()`, `personalizationText`, `artNote` e `notes`.

**Envio de imagens:** o site **não recebe arquivos**, porque não há servidor. Os campos de arte pedem uma descrição e orientam a pessoa a mandar a foto ou a arte pela conversa do WhatsApp. Não há pré-visualização automática de estampa.

---

## Categorias

As categorias ficam em `CATEGORIES`, dentro de `products.js`:

```js
{ id: "canecas", name: "Canecas", navLabel: "Canecas", title: "Canecas",
  description: "…", image: "assets/img/categories/icon-mug.svg", icon: "mug", order: 2 }
```

- O site tem hoje quatro categorias: **Copos**, **Canecas**, **Garrafas** e **Capas Personalizadas** (`capas-personalizadas`).
- `image` é a foto do card da categoria. Troque `icon-mug.svg` por uma foto real de canecas assim que houver (`assets/img/categories/canecas.webp`, formato 4:3).
- `icon` pode ser um destes: `cup`, `mug`, `bottle`, `phone`, `sparkle` ou `gift`. Ele também vira a imagem provisória dos produtos sem foto.
- Sem `group`, a categoria aparece direto na barra do menu. Com `group: "outros"`, ela vai para um menu "Outros acessórios" (útil se o catálogo crescer).
- **Categorias sem produtos ficam ocultas** e não geram página.
- Os produtos personalizáveis de todas as categorias aparecem juntos em `catalogo/?pers=1`, que é o destino dos botões "Ver personalizados".

**Depois de criar, renomear ou esvaziar uma categoria, rode:**

```bash
node tools/build.mjs
```

---

## Fotos, vídeo e personagem

**Fotos de produto**

- Coloque os arquivos em `assets/img/products/` e aponte o caminho em `images`.
- Use imagens quadradas, de pelo menos 800 × 800 px, no formato `.webp` ou `.jpg`.
- `credit: "loja"` mostra a legenda "Foto da vitrine da loja", e `"ilustrativa"` mostra "Imagem ilustrativa".
- Produtos sem foto usam automaticamente o ícone da categoria, com a etiqueta "Foto em breve".
- As fotos dos produtos vieram do .zip enviado pela loja e foram recortadas em formato quadrado. As fotos das categorias Copos, Garrafas e Capas são do vídeo da loja.

**Vídeo do hero (`assets/video/`)**

- `fanny-hero-clean.webm` é o **original** (1920 × 1080, 15 s, VP9, sem áudio), preservado.
- `fanny-hero-clean-1080.mp4` é a versão H.264 para Safari e iPhone.
- `fanny-hero-clean-720.webm` e `fanny-hero-clean-720.mp4` são versões mais leves, usadas em telas menores que 768 px.
- O vídeo só começa a carregar depois que a página termina de abrir, para não atrasar o restante do site.
- O vídeo pausa quando sai da tela.
- Quem ativou "reduzir movimento" no sistema ou "economia de dados" no navegador vê a imagem de capa. Essa pessoa pode tocar o vídeo pelo botão de reproduzir.
- Capas: `assets/img/hero/hero-poster.webp`, `hero-poster-1280.webp` e `hero-poster.jpg`.

Para trocar o vídeo:

1. Coloque o novo arquivo em `assets/video/`.
2. Gere as versões otimizadas:
   ```bash
   ffmpeg -i novo.webm -an -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart novo-1080.mp4
   ffmpeg -i novo.webm -an -vf scale=1280:-2 -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart novo-720.mp4
   ffmpeg -i novo.webm -an -vf scale=1280:-2 -c:v libvpx-vp9 -b:v 0 -crf 38 novo-720.webm
   ffmpeg -ss 1 -i novo.webm -frames:v 1 -vf scale=1920:-2 assets/img/hero/hero-poster.jpg
   ```
3. Atualize os caminhos em `config.js → hero`.

**Personagem:** os arquivos ficam em `assets/img/brand/`:

- `fanny-char.webp` e `.png`: o personagem inteiro, com fundo transparente;
- `fanny-avatar.*`: o recorte usado no logotipo do cabeçalho;
- `fanny-char-original.jpg`: o arquivo original enviado.

Para trocar o personagem, substitua os arquivos ou ajuste `config.js → mascot`. Para remover o personagem do site inteiro, use `mascot.enabled: false` e rode o gerador.

> **Personagem:** a loja informou na planilha que tem autorização de uso do desenho. A ilustração é assinada por "Thiago S.F. 2018"; mantenha a assinatura visível.

---

## Cores e identidade visual

Todas as cores estão em variáveis no arquivo **`assets/css/tokens.css`**:

| Variável | Uso |
|----------|-----|
| `--color-accent` | Verde da linha do letreiro "Fanny" (detalhes e destaques) |
| `--color-wall` | Azul-petróleo da parede ripada da loja (seção de categorias e rodapé) |
| `--color-primary` | Botões principais |
| `--color-pop` | Rosa das capinhas (contador do carrinho e selo "Personalizável") |

Para mudar a identidade visual, troque os valores. Nenhum componente precisa ser reescrito.

As fontes são a **Noto Serif Display Itálica** (títulos, ecoando o letreiro do vídeo) e a **Poppins** (texto). As duas ficam hospedadas no próprio site, em `assets/fonts`, com licença OFL.

---

## Atualizar o catálogo depois

1. Edite `assets/js/products.js` (preço, promoção, foto, novo produto). Os produtos de copos, canecas e garrafas usam o atalho `drinkwareOptions(5.99)` (acréscimo fixo por unidade) ou `drinkwareOptions("orcamento")` (personalização com valor combinado no WhatsApp).
2. Coloque as fotos novas em `assets/img/products/`, quadradas e com fundo liso.
3. Dados da loja (endereço, horário, entrega, pagamento, trocas) ficam em `config.js → business`.
4. Rode `node tools/build.mjs` se mudou categorias ou dados da loja, e publique.
5. O modo `catalogStatus: "demonstracao"` continua disponível para testes; o site está em `"oficial"`.

---

## Como funciona o pedido pelo WhatsApp

1. A pessoa escolhe as opções e adiciona os produtos. Configurações diferentes do mesmo produto viram itens separados no carrinho; configurações iguais somam a quantidade.
2. No **carrinho**, ela revisa, edita as opções, altera as quantidades (só números inteiros de 1 a 99) e informa os dados opcionais: nome, preferência de contato e observações.
3. O botão **Enviar pedido pelo WhatsApp** abre `https://wa.me/5531992919133?text=…` com a mensagem codificada por `encodeURIComponent`. A mensagem lista cada item com suas opções, quantidade, valor unitário e subtotal, e no final mostra o total ou o subtotal conhecido junto com os itens que têm valor a confirmar.
4. O site **não limpa o carrinho** e **não diz que o pedido foi recebido**. Ele mostra "Pedido preparado no WhatsApp" e explica que a pessoa precisa tocar em enviar na conversa.
5. Não há frete, desconto, taxa ou pagamento online calculados pelo site. A mensagem informa que entrega e pagamento são combinados no atendimento.

O carrinho fica no `localStorage` do navegador, com a chave `fanny_acessorios_cart`. Ele continua salvo depois de recarregar a página e fica sincronizado entre abas. Em janela anônima com o armazenamento bloqueado, o carrinho funciona normalmente, mas é perdido ao recarregar.

---

## Testes

Os testes automáticos estão em `tools/tests/e2e.py` e usam Playwright com Python (`pip install playwright`, depois `playwright install chromium`).

Para rodar, sirva a **pasta acima** do projeto. Assim o site fica em uma subpasta, exatamente como no GitHub Pages:

```bash
cd ..                      # pasta que contém fanny-acessorios/
python3 -m http.server 8766
python3 fanny-acessorios/tools/tests/e2e.py
```

Os testes usam o catálogo real. O resultado da última execução fica em `tools/tests/ultimo-resultado.json`.

### Checklist executado com o catálogo real (36/36 verificações aprovadas)

| Teste | O que foi verificado | Resultado |
|-------|----------------------|-----------|
| Catálogo | 12 produtos da planilha; sem aviso de demonstração; cards com preço promocional, preço riscado e selo "Oferta" | ✔ |
| Ofertas e destaques | Página Ofertas com os 8 produtos em promoção; home com os 7 destaques marcados "Sim" | ✔ |
| Validação | Sem responder "Deseja personalizar?" não adiciona; preço na página soma a personalização (R$ 20,00 + R$ 5,99 = R$ 25,99) | ✔ |
| A — Compra simples | Copo liso entra pelo preço promocional de R$ 20,00 | ✔ |
| B/C/D — Carrinho | Copos e canecas juntos; mesmo produto liso e personalizado em linhas separadas; nomes preservados; total de R$ 207,97 conferido | ✔ |
| E/F/G | Diminuir quantidade, recarregar a página e remover item recalculam corretamente | ✔ |
| H — Sob orçamento | Garrafa mostra "R$ 50,00 + personalização a confirmar"; capinha sob consulta; sem total final enganoso | ✔ |
| I — WhatsApp | Número 5531992919133; mensagem com itens, opções, valores, recebimento, pagamento e observações; retirada na loja não menciona frete | ✔ |
| J — Integridade | Mostra "pedido preparado", mantém o carrinho e não afirma recebimento | ✔ |
| Dados da loja | Endereço, horário, entrega, pagamento, trocas e prazo dos personalizados no contato, no rodapé e na página de produto; canonical no domínio | ✔ |
| Busca e filtros | Busca por "caneca" e sem acento; filtro por tipo; ordenação por menor preço | ✔ |
| K — Celular (390 px) | Menu, compra da capinha e envio; botão não coberto pela barra inferior; sem rolagem horizontal | ✔ |
| L — Publicação | Páginas, links, arquivos e as 12 fotos respondem 200 em subpasta | ✔ |
| Responsivo | Sem rolagem horizontal nas larguras de 320 a 1920 px | ✔ |

-------|----------------------|-----------|
| Validação | Formulário sem campos obrigatórios mostra erros e não adiciona | ✔ |
| A — Compra simples | Gaveta abre; 1 × R$ 49,90 = R$ 49,90 | ✔ |
| B — Várias categorias | Copos, canecas, garrafas e capas no mesmo carrinho | ✔ |
| C — Personalização | Marca, modelo, base, cor e texto preservados até o carrinho; opções ocultas não vão junto | ✔ |
| D — Produtos iguais | "Maria" e "João" viram 2 linhas; a mesma configuração soma a quantidade | ✔ |
| E — Quantidade | 3 → R$ 149,70; 2 → R$ 99,80; "-5" vira 1; "2.7" vira 2; não desce abaixo de 1; total geral correto | ✔ |
| F — Persistência | Itens e contador continuam após recarregar e trocar de página | ✔ |
| G — Remoção | Total recalculado ao remover | ✔ |
| H — Sob orçamento | Mostra o subtotal conhecido e os itens a confirmar, sem total final; editar opções a partir do carrinho | ✔ |
| I — WhatsApp | Número 5531992919133; mensagem com itens, opções, quantidades, nome, preferência e observações; texto codificado; sem frete ou desconto inventado | ✔ |
| J — Integridade | Mostra "pedido preparado", não afirma recebimento e mantém o carrinho | ✔ |
| Busca e filtros | Sugestões no topo; busca sem acentos; estado sem resultado; filtros de tipo e cor; chips; filtros na URL; ordem A–Z; filtro "Ver personalizados" | ✔ |
| Catálogo sem preços | Total "A confirmar" sem nenhum R$ inventado; produto inexistente mostra página amigável | ✔ |
| K — Celular (390 px) | Menu, filtros em painel, compra e envio; botão de envio não fica coberto; sem rolagem horizontal | ✔ |
| L — Publicação | 60 URLs internas (páginas, CSS, JS, imagens, ícones) respondem 200 em subpasta; `404.html` presente | ✔ |
| Responsivo | Sem rolagem horizontal em 10 páginas, nas larguras 320, 375, 390, 414, 768, 1024, 1280, 1440 e 1920 px | ✔ |
| Vídeo | Desktop carrega 1080p; celular carrega 720p; "reduzir movimento" mostra a capa e só toca ao clicar | ✔ |
| Teclado | Foco entra na gaveta do carrinho, fica preso nela e volta ao botão ao fechar com Esc | ✔ |

---

## Dados da loja cadastrados

- Endereço: Shopping Oiapoque, Box M19/20, Belo Horizonte, MG. Horário: das 8h às 20h.
- Retirada na loja e entrega para todo o Brasil, com frete combinado pelo WhatsApp.
- Pagamento: dinheiro, Pix e cartão de débito ou crédito. Trocas de acordo com o CDC.
- Personalizados: até 15 unidades com prazo imediato; sem quantidade mínima.
- Domínio: fannypersonalizados.com.br.

Pontos que ainda podem melhorar:

- [ ] **Fotos próprias.** Algumas fotos enviadas mostram a marca Stanley e uma delas (cuia) tem a marca d'água de outra loja ("IZE TEC"). Troque por fotos tiradas na loja, com o mesmo nome de arquivo, e não é preciso mexer em mais nada.
- [ ] **Dias de funcionamento** junto com o horário (ex.: "Seg. a sáb., das 8h às 20h").
- [ ] **Cores de cada produto**, se quiser que o cliente escolha clicando em vez de digitar.
