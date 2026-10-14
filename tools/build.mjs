#!/usr/bin/env node
/**
 * GERADOR DE PÁGINAS — Fanny Acessórios
 * ------------------------------------------------------------
 * Gera os arquivos HTML estáticos (cabeçalho, rodapé, menus, SEO),
 * sitemap.xml e robots.txt a partir de assets/js/config.js e products.js.
 *
 * Quando rodar:  depois de criar/remover categorias, mudar textos do
 * cabeçalho/rodapé ou alterar config.js (siteUrl, Instagram, WhatsApp).
 * Produtos novos em categorias existentes aparecem SEM precisar rodar.
 *
 * Como rodar:    node tools/build.mjs     (Node 18 ou superior)
 */
import { writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_CONFIG as C, whatsappUrl } from "../assets/js/config.js";
import { CATEGORIES, PRODUCTS, activeCategories, productsInCategory, hasOffers, getCategory } from "../assets/js/products.js";
import { ICON } from "../assets/js/icons.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const YEAR = new Date().getFullYear();
const CSS = ["fonts", "tokens", "base", "layout", "components", "catalog", "cart", "responsive"];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const siteUrlReady = C.siteUrl && !C.siteUrl.includes("SEU-USUARIO");
const abs = (path) => `${C.siteUrl.replace(/\/$/, "")}/${path}`;
const isDemo = C.catalogStatus === "demonstracao";

const cats = activeCategories();
const navCats = cats.filter((c) => !c.group);
const otherCats = cats.filter((c) => c.group === "outros");
const catIcon = (rel, name) => `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><use href="${rel}assets/icons/categorias.svg#i-${name}" width="24" height="24"/></svg>`;
const waGeneral = whatsappUrl(C.whatsappMessage.generalContact);

/* ------------------------------------------------------------ */
function head({ rel, title, description, path, ogImage, extraHead = "" }) {
  const fullTitle = title === C.name ? `${C.name} | ${C.tagline}` : `${title} | ${C.name}`;
  const img = ogImage || "assets/img/brand/og-image.jpg";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#1E5468">
${siteUrlReady ? `<link rel="canonical" href="${abs(path)}">` : ""}
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(C.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${siteUrlReady ? abs(img) : rel + img}">
${siteUrlReady ? `<meta property="og:url" content="${abs(path)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${rel}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${rel}assets/img/brand/apple-touch-icon.png">
<link rel="preload" href="${rel}assets/fonts/poppins-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${rel}assets/fonts/noto-serif-display-latin-600-italic.woff2" as="font" type="font/woff2" crossorigin>
${CSS.map((c) => `<link rel="stylesheet" href="${rel}assets/css/${c}.css">`).join("\n")}
<script type="module" src="${rel}assets/js/main.js"></script>
${extraHead}
</head>`;
}

function header(rel, current) {
  const cur = (id) => (current === id ? ' aria-current="page"' : "");
  const ann = C.announcement?.enabled
    ? `<div class="announce"><div class="container"><p>${esc(C.announcement.text)}${C.announcement.linkHref ? ` <a href="${rel}${C.announcement.linkHref}">${esc(C.announcement.linkLabel)}</a>` : ""}</p><button type="button" data-announcement-close aria-label="Fechar aviso">${ICON.close}</button></div></div>`
    : "";
  const m = C.mascot;
  const avatar = m.enabled
    ? `<picture><source srcset="${rel}${m.avatar}" type="image/webp"><img class="brand__avatar" src="${rel}${m.avatarFallback}" alt="" width="42" height="42"></picture>`
    : "";
  return `${ann}
<header class="site-header">
  <div class="container header__row">
    <button type="button" class="icon-btn header__menu" data-nav-toggle aria-controls="mobile-nav" aria-expanded="false" aria-label="Abrir menu">${ICON.menu}</button>
    <a class="brand" href="${rel || "./"}" aria-label="${esc(C.name)}, página inicial">${avatar}<span class="brand__text"><span class="brand__word">Fanny</span><span class="brand__sub">acessórios</span></span></a>
    <form class="search" role="search" action="${rel}busca/" data-search-form>
      <label class="sr-only" for="q-top">Buscar produtos</label>
      <input id="q-top" type="search" name="q" placeholder="Buscar copos, canecas, garrafas, capas…" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="suggest-top" aria-expanded="false">
      <button class="search__btn" type="submit" aria-label="Buscar">${ICON.search}</button>
      <ul class="suggest" id="suggest-top" role="listbox" aria-label="Sugestões" data-suggest hidden></ul>
    </form>
    <div class="header__actions">
      <a class="icon-btn header__search-link" href="${rel}busca/" aria-label="Buscar produtos">${ICON.search}</a>
      <a class="btn btn--wa btn--sm header__wa" href="${waGeneral}" target="_blank" rel="noopener">${ICON.whatsapp}<span>WhatsApp</span></a>
      <a class="icon-btn cart-btn" href="${rel}carrinho/" data-open-cart data-cart-label aria-label="Carrinho">${ICON.bag}<span class="count" data-cart-count hidden>0</span></a>
    </div>
  </div>
  <nav class="mainnav" aria-label="Categorias">
    <ul class="container mainnav__list">
      <li><a href="${rel || "./"}"${cur("home")}>Início</a></li>
      ${navCats.map((c) => `<li><a href="${rel}categorias/${c.id}/"${cur(c.id)}>${esc(c.navLabel)}</a></li>`).join("\n      ")}
      ${otherCats.length ? `<li data-menu><button type="button" data-menu-btn aria-expanded="false" aria-controls="menu-outros">Outros acessórios${ICON.chevronDown}</button>
        <div class="mega" id="menu-outros" data-menu-panel hidden>
          ${otherCats.map((c) => `<a href="${rel}categorias/${c.id}/"><span class="mega__icon">${catIcon(rel, c.icon)}</span><strong>${esc(c.navLabel)}</strong><small>${productsInCategory(c.id).length} produtos</small></a>`).join("\n          ")}
        </div></li>` : ""}
      ${hasOffers() ? `<li><a href="${rel}ofertas/"${cur("ofertas")}>Ofertas</a></li>` : ""}
      <li class="mainnav__all"><a href="${rel}categorias/"${cur("categorias")}>Todas as categorias</a></li>
    </ul>
  </nav>
</header>
<div class="mobile-nav" id="mobile-nav" hidden>
  <div class="mobile-nav__scrim" data-nav-close></div>
  <nav class="mobile-nav__panel" aria-label="Menu">
    <div class="mobile-nav__head"><span class="brand__word">Fanny</span><button type="button" class="icon-btn" data-nav-close aria-label="Fechar menu">${ICON.close}</button></div>
    <div class="mobile-nav__body">
      <ul>
        <li><a href="${rel || "./"}"><span class="mega__icon">${ICON.home}</span>Início</a></li>
        <li><a href="${rel}catalogo/"><span class="mega__icon">${ICON.grid}</span>Catálogo completo</a></li>
        <li><a href="${rel}busca/"><span class="mega__icon">${ICON.search}</span>Buscar produtos</a></li>
      </ul>
      <h2>Categorias</h2>
      <ul>
        ${cats.map((c) => `<li><a href="${rel}categorias/${c.id}/"><span class="mega__icon">${catIcon(rel, c.icon)}</span>${esc(c.navLabel)}</a></li>`).join("\n        ")}
        ${hasOffers() ? `<li><a href="${rel}ofertas/"><span class="mega__icon">${ICON.sparkle}</span>Ofertas</a></li>` : ""}
      </ul>
      <h2>A loja</h2>
      <ul>
        <li><a href="${rel}sobre/"><span class="mega__icon">${ICON.info}</span>Sobre a Fanny</a></li>
        <li><a href="${rel}contato/"><span class="mega__icon">${ICON.whatsapp}</span>Contato</a></li>
        <li><a href="${C.instagram.url}" target="_blank" rel="noopener"><span class="mega__icon">${ICON.instagram}</span>${esc(C.instagram.handle)}</a></li>
      </ul>
    </div>
  </nav>
</div>`;
}

function tabbar(rel, current) {
  const cur = (id) => (current === id ? ' aria-current="page"' : "");
  return `<nav class="tabbar" aria-label="Atalhos">
  <a href="${rel || "./"}"${cur("home")}>${ICON.home}<span>Início</span></a>
  <button type="button" data-nav-toggle aria-controls="mobile-nav" aria-expanded="false">${ICON.grid}<span>Categorias</span></button>
  <a href="${rel}busca/"${cur("busca")}>${ICON.search}<span>Buscar</span></a>
  <a href="${rel}carrinho/" data-open-cart data-cart-label${cur("carrinho")}>${ICON.bag}<span>Carrinho</span><span class="count" data-cart-count hidden>0</span></a>
  <a class="tabbar__wa" href="${waGeneral}" target="_blank" rel="noopener">${ICON.whatsapp}<span>WhatsApp</span></a>
</nav>`;
}

function footer(rel) {
  const b = C.business;
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <span class="brand__text"><span class="brand__word">Fanny</span><span class="brand__sub">acessórios</span></span>
        <span class="footer__rule"></span>
        <p>Copos, canecas, garrafas e capas personalizadas. Monte o pedido no site e finalize com a loja pelo WhatsApp.</p>
      </div>
      <div>
        <h2>Categorias</h2>
        <ul>${cats.slice(0, 8).map((c) => `<li><a href="${rel}categorias/${c.id}/">${esc(c.navLabel)}</a></li>`).join("")}<li><a href="${rel}categorias/">Todas as categorias</a></li></ul>
      </div>
      <div>
        <h2>A loja</h2>
        <ul>
          <li><a href="${rel}catalogo/">Catálogo</a></li>
          <li><a href="${rel}sobre/">Sobre a Fanny</a></li>
          <li><a href="${rel}contato/">Contato</a></li>
          <li><a href="${rel}carrinho/">Carrinho</a></li>
          <li><a href="${rel}carrinho/#como-funciona">Como fazer o pedido</a></li>
        </ul>
      </div>
      <div>
        <h2>Atendimento</h2>
        <ul>
          <li><a href="${waGeneral}" target="_blank" rel="noopener">${ICON.whatsapp}${esc(C.whatsappDisplay)}</a></li>
          <li><a href="${C.instagram.url}" target="_blank" rel="noopener">${ICON.instagram}${esc(C.instagram.handle)}</a></li>
          ${b.address ? `<li>${esc(b.address)}</li>` : ""}
          ${b.hours ? `<li>${esc(b.hours)}</li>` : ""}
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <span>© ${YEAR} ${esc(C.name)}</span>
      <span>Preços, disponibilidade, entrega e pagamento são confirmados no atendimento pelo WhatsApp.</span>
    </div>
  </div>
</footer>`;
}

const demoNote = (rel) =>
  isDemo
    ? `<p class="demo-note">${ICON.info}<span>Catálogo em montagem: os produtos são exemplos baseados na vitrine da loja. Preço e disponibilidade são confirmados pelo WhatsApp.</span></p>`
    : "";

const noscriptList = (rel, products) =>
  `<noscript><div class="container"><p class="notice">Ative o JavaScript para filtrar produtos e usar o carrinho. Você também pode pedir pelo <a href="${waGeneral}">WhatsApp</a>.</p><ul>${products
    .map((p) => `<li><a href="${rel}produto/?id=${p.id}">${esc(p.name)}</a></li>`)
    .join("")}</ul></div></noscript>`;

const jsError = `<p class="notice container" data-js-error hidden>Não foi possível carregar esta parte da página. Recarregue ou fale com a loja pelo WhatsApp.</p>`;

function page({ path, pageType, current, title, description, body, extraHead, ogImage, bodyAttrs = "" }) {
  const depth = path.split("/").length - 1;
  const rel = "../".repeat(depth);
  const html = `${head({ rel, title, description, path: path.replace(/index\.html$/, ""), ogImage, extraHead })}
<body data-page="${pageType}"${bodyAttrs}>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
${header(rel, current)}
<main id="conteudo">
${typeof body === "function" ? body(rel) : body}
</main>
${footer(rel)}
${tabbar(rel, current)}
</body>
</html>
`;
  const file = join(ROOT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html.replace(/\n\s*\n\s*\n/g, "\n\n"));
  return path;
}

/* ============================ PÁGINAS ============================ */
const written = [];
const m = C.mascot;
const mascotImg = (rel, cls, w, h, alt = "") =>
  m.enabled ? `<picture><source srcset="${rel}${m.src}" type="image/webp"><img class="${cls}" src="${rel}${m.fallback}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async"></picture>` : "";

/* ---------- Home ---------- */
written.push(
  page({
    path: "index.html",
    pageType: "home",
    current: "home",
    title: C.name,
    description: "Copos, canecas, garrafas e capas de celular personalizadas. Escolha, personalize e envie seu pedido para a Fanny pelo WhatsApp.",
    extraHead: `<link rel="preload" as="image" href="assets/img/hero/hero-poster.webp" media="(min-width: 768px)">
<link rel="preload" as="image" href="assets/img/hero/hero-poster-1280.webp" media="(max-width: 767px)">
<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Store",
      name: C.name,
      description: "Copos, canecas, garrafas e capas personalizadas.",
      telephone: "+" + C.whatsapp,
      sameAs: [C.instagram.url],
      ...(siteUrlReady ? { url: C.siteUrl + "/", image: abs("assets/img/brand/og-image.jpg") } : {}),
      ...(C.business.address ? { address: C.business.address } : {}),
    })}</script>`,
    body: (rel) => {
      const big = cats.slice(0, 4);
      const small = cats.slice(4, 9);
      const hang = (c, isBig) => {
        const n = productsInCategory(c.id).length;
        if (isBig)
          return `<a class="hang hang--big" href="${rel}categorias/${c.id}/"><img class="hang__img" src="${rel}${c.image}" alt="" width="960" height="720" loading="lazy" decoding="async"><span class="hang__body"><span class="hang__name">${esc(c.navLabel)}</span><span class="hang__meta">${n} ${n === 1 ? "produto" : "produtos"}</span></span></a>`;
        return `<a class="hang hang--icon" href="${rel}categorias/${c.id}/"><span class="hang__body"><span class="mega__icon">${catIcon(rel, c.icon)}</span><span class="hang__text"><span class="hang__name">${esc(c.navLabel)}</span><span class="hang__meta">${n} ${n === 1 ? "produto" : "produtos"}</span></span></span></a>`;
      };
      const kinds = cats.filter((c) => productsInCategory(c.id).some((p) => p.personalizable)).map((c) => [c.navLabel, c.id]);
      return `
<section class="hero" aria-labelledby="hero-title">
  <div class="hero__media">
    <picture>
      <source media="(max-width: 767px)" srcset="${C.hero.posterMobile}">
      <img src="${C.hero.poster}" alt="" width="1920" height="1080" fetchpriority="high">
    </picture>
    <video class="hero__video" data-hero-video muted playsinline loop preload="none" aria-hidden="true" tabindex="-1" disablepictureinpicture></video>
    <div class="hero__shade"></div>
  </div>
  <div class="container hero__content">
    <h1 class="hero__title" id="hero-title">Acessórios que combinam com você.</h1>
    <span class="hero__rule" aria-hidden="true"></span>
    <p class="hero__lead">Encontre seus favoritos, personalize seus produtos e monte uma combinação do seu jeito.</p>
    <div class="btn-row">
      <a class="btn btn--light btn--lg" href="catalogo/">Explorar catálogo</a>
      <a class="btn btn--outline-light btn--lg" href="catalogo/?pers=1">Ver personalizados</a>
    </div>
  </div>
  <a class="hero__handle" href="${C.instagram.url}" target="_blank" rel="noopener">${esc(C.instagram.handle)}</a>
  <button type="button" class="hero__toggle" data-hero-toggle aria-label="Reproduzir vídeo da loja" aria-pressed="true">${ICON.play}</button>
</section>

<div class="steps-band">
  <div class="container">
    <h2 class="sr-only">Como fazer o pedido</h2>
    <ol class="steps">
      <li><strong>Escolha e personalize</strong><span>Selecione cor, modelo e, se quiser, o nome ou a arte.</span></li>
      <li><strong>Monte o carrinho</strong><span>Junte produtos de categorias diferentes em um só pedido.</span></li>
      <li><strong>Envie pelo WhatsApp</strong><span>A mensagem sai pronta e a Fanny confirma valores e disponibilidade.</span></li>
    </ol>
  </div>
</div>

<section class="wall" aria-labelledby="cat-title">
  <div class="container">
    <div class="section-head">
      <div>
        <h2 class="section-title" id="cat-title">Escolha pela vitrine</h2>
        <p class="section-lead">As categorias da loja, organizadas como o painel da Fanny.</p>
      </div>
      <a class="text-link" style="color:#fff" href="categorias/">Todas as categorias</a>
    </div>
    <div class="wall__grid">
      ${big.map((c) => hang(c, true)).join("\n      ")}
      ${small.map((c) => hang(c, false)).join("\n      ")}
      ${cats.length > 4 ? `<a class="hang hang--icon hang--all" href="categorias/"><span class="hang__body"><span class="mega__icon">${ICON.grid}</span><span class="hang__text"><span class="hang__name">Ver tudo</span><span class="hang__meta">${cats.length} categorias</span></span></span></a>` : ""}
    </div>
  </div>
</section>

<section class="section" data-home-featured aria-labelledby="feat-title">
  <div class="container">
    <div class="section-head">
      <div><h2 class="section-title" id="feat-title">Produtos em destaque</h2></div>
      <a class="text-link" href="catalogo/">Ver catálogo completo</a>
    </div>
    ${demoNote(rel) ? `<div style="margin-bottom:var(--space-5)">${demoNote(rel)}</div>` : ""}
    <div class="grid" data-grid></div>
  </div>
</section>

<section class="section section--tight" aria-labelledby="custom-title">
  <div class="container custom">
    <div class="custom__media">
      <img src="assets/img/editorial/vitrine-garrafas.webp" alt="Vitrine da Fanny com garrafas coloridas, copos com tampa e garrafas brancas" width="1600" height="900" loading="lazy">
      <span class="custom__label">Vitrine da loja</span>
    </div>
    <div>
      <h2 class="custom__title" id="custom-title">Sua ideia. Seu estilo. Seu produto.</h2>
      <p class="custom__text">Escolha o acessório, defina os detalhes e conte para nós como você imagina o resultado. Fotos e artes são enviadas na conversa do WhatsApp, e a loja confirma tudo antes de produzir.</p>
      ${kinds.length ? `<ul class="custom__kinds">${kinds.map(([l, id]) => `<li><a href="categorias/${id}/?pers=1">${esc(l)}</a></li>`).join("")}</ul>` : ""}
      <div class="btn-row" style="margin-top:var(--space-6)"><a class="btn btn--primary btn--lg" href="catalogo/?pers=1">Descobrir personalizados</a></div>
    </div>
  </div>
</section>

<section class="section section--tight" data-home-new hidden aria-labelledby="new-title">
  <div class="container"><div class="section-head"><h2 class="section-title" id="new-title">Novidades</h2></div><div class="grid" data-grid></div></div>
</section>
${hasOffers() ? `<section class="section section--tight" data-home-offers hidden aria-labelledby="off-title">
  <div class="container"><div class="section-head"><h2 class="section-title" id="off-title">Ofertas</h2><a class="text-link" href="ofertas/">Ver ofertas</a></div><div class="grid" data-grid></div></div>
</section>` : ""}
<section class="section section--tight" aria-labelledby="insta-title">
  <div class="container insta">
    <div class="insta__photo"><img src="assets/img/categories/capas-personalizadas.webp" alt="Painel azul da loja com capinhas coloridas penduradas" width="960" height="720" loading="lazy"></div>
    <div class="insta__photo"><img src="assets/img/categories/garrafas.webp" alt="Prateleira com garrafas coloridas e garrafas brancas" width="960" height="720" loading="lazy"></div>
    <div class="insta__card">
      <h2 class="section-title" id="insta-title">Acompanhe a Fanny no Instagram</h2>
      <p class="section-lead" style="margin:0">Veja a vitrine, as novidades e ideias de personalização no perfil da loja.</p>
      <a class="insta__handle" href="${C.instagram.url}" target="_blank" rel="noopener">${ICON.instagram}${esc(C.instagram.handle)}</a>
      <a class="btn btn--primary" href="${C.instagram.url}" target="_blank" rel="noopener">Acompanhe a Fanny no Instagram</a>
    </div>
  </div>
</section>

<section class="section section--tight" aria-labelledby="final-title">
  <div class="container">
    <div class="final">
      <div class="final__text">
        <h2 id="final-title">Encontrou seus favoritos?</h2>
        <p>Monte seu carrinho, escolha suas opções e envie seu pedido para a Fanny pelo WhatsApp.</p>
        <a class="btn btn--primary btn--lg" href="carrinho/">Ir para o carrinho</a>
      </div>
      ${mascotImg(rel, "final__mascot", 230, 335, m.alt)}
    </div>
  </div>
</section>
${noscriptList(rel, PRODUCTS.filter((p) => p.featured))}
${jsError}`;
    },
  })
);

/* ---------- Catálogo ---------- */
written.push(
  page({
    path: "catalogo/index.html",
    pageType: "catalog",
    current: "catalogo",
    title: "Catálogo",
    description: "Todos os produtos da Fanny: copos, canecas, garrafas e capas personalizadas para celular.",
    body: (rel) => `<div class="container">
  <header class="page-head">
    <nav class="crumbs" aria-label="Você está em"><ol><li><a href="${rel}">Início</a></li><li aria-current="page">Catálogo</li></ol></nav>
    <h1>Catálogo</h1>
    <p>Todos os produtos em um só lugar. Use os filtros para encontrar o que combina com você.</p>
  </header>
  ${demoNote(rel)}
  <section class="listing" data-listing data-scope="all" aria-label="Produtos" style="margin-top:var(--space-5)"></section>
</div>
${noscriptList(rel, PRODUCTS)}
${jsError}`,
  })
);

/* ---------- Busca ---------- */
written.push(
  page({
    path: "busca/index.html",
    pageType: "search",
    current: "busca",
    title: "Buscar produtos",
    description: "Busque copos, canecas, garrafas e capas personalizadas na Fanny Acessórios.",
    extraHead: `<meta name="robots" content="noindex, follow">`,
    body: (rel) => `<div class="container">
  <header class="page-head">
    <nav class="crumbs" aria-label="Você está em"><ol><li><a href="${rel}">Início</a></li><li aria-current="page">Busca</li></ol></nav>
    <h1>Buscar produtos</h1>
    <form class="page-search" role="search" data-page-search action="./">
      <label class="sr-only" for="q-page">O que você procura?</label>
      <input id="q-page" type="search" name="q" placeholder="Ex.: caneca, garrafa térmica, capa com foto" autocomplete="off" autofocus>
      <button type="button" class="icon-btn page-search__clear" data-clear-search aria-label="Limpar busca">${ICON.close}</button>
      <button type="submit" class="btn btn--primary">Buscar</button>
    </form>
  </header>
  <section class="listing" data-listing data-scope="search" aria-label="Resultados"></section>
</div>
${jsError}`,
  })
);

/* ---------- Índice de categorias ---------- */
written.push(
  page({
    path: "categorias/index.html",
    pageType: "categories",
    current: "categorias",
    title: "Categorias",
    description: "Categorias da Fanny Acessórios: copos, canecas, garrafas e capas personalizadas.",
    body: (rel) => `<div class="container">
  <header class="page-head">
    <nav class="crumbs" aria-label="Você está em"><ol><li><a href="${rel}">Início</a></li><li aria-current="page">Categorias</li></ol></nav>
    <h1>Categorias</h1>
    <p>Escolha por onde começar.</p>
  </header>
  <div class="cat-grid">
    ${cats
      .map((c) => {
        const n = productsInCategory(c.id).length;
        return `<a class="cat-card" href="${rel}categorias/${c.id}/"><img src="${rel}${c.image.endsWith(".svg") ? c.image : c.image}" alt="" width="96" height="96" loading="lazy"><span><strong>${esc(c.name)}</strong><span>${n} ${n === 1 ? "produto" : "produtos"}</span></span></a>`;
      })
      .join("\n    ")}
  </div>
</div>`,
  })
);

/* ---------- Cada categoria ---------- */
// remove pastas de categorias que ficaram sem produtos
const catDir = join(ROOT, "categorias");
if (existsSync(catDir)) {
  for (const d of readdirSync(catDir, { withFileTypes: true })) {
    if (d.isDirectory() && !cats.some((c) => c.id === d.name)) rmSync(join(catDir, d.name), { recursive: true });
  }
}
for (const c of cats) {
  const prods = productsInCategory(c.id);
  written.push(
    page({
      path: `categorias/${c.id}/index.html`,
      pageType: "category",
      current: c.id,
      title: c.title,
      description: c.description.slice(0, 158),
      ogImage: c.image.endsWith(".webp") ? c.image : undefined,
      bodyAttrs: ` data-category="${c.id}"`,
      body: (rel) => `<div class="container">
  <header class="page-head${c.image.endsWith(".webp") ? " page-head--split" : ""}">
    <div>
      <nav class="crumbs" aria-label="Você está em"><ol><li><a href="${rel}">Início</a></li><li><a href="${rel}categorias/">Categorias</a></li><li aria-current="page">${esc(c.navLabel)}</li></ol></nav>
      <h1>${esc(c.title)}</h1>
      <p>${esc(c.description)}</p>
    </div>
    ${c.image.endsWith(".webp") ? `<img class="page-head__img" src="${rel}${c.image}" alt="" width="960" height="720">` : ""}
  </header>
  ${demoNote(rel)}
  <section class="listing" data-listing data-scope="category" data-category="${c.id}" aria-label="Produtos de ${esc(c.navLabel)}" style="margin-top:var(--space-5)"></section>
</div>
${noscriptList(rel, prods)}
${jsError}`,
    })
  );
}

/* ---------- Ofertas (só existe se houver promoção real) ---------- */
const offersDir = join(ROOT, "ofertas");
if (hasOffers()) {
  written.push(
    page({
      path: "ofertas/index.html",
      pageType: "catalog",
      current: "ofertas",
      title: "Ofertas",
      description: "Produtos com preço promocional na Fanny Acessórios.",
      body: (rel) => `<div class="container"><header class="page-head"><h1>Ofertas</h1></header><section class="listing" data-listing data-scope="all" aria-label="Ofertas"></section></div>${jsError}`,
    })
  );
} else if (existsSync(offersDir)) rmSync(offersDir, { recursive: true });

/* ---------- Produto ---------- */
written.push(
  page({
    path: "produto/index.html",
    pageType: "product",
    current: "produto",
    title: "Produto",
    description: "Escolha as opções do produto, adicione ao carrinho e envie o pedido para a Fanny pelo WhatsApp.",
    body: (rel) => `<div data-product-root class="pdp-skeleton"><div class="container"><p class="page-head">Carregando produto…</p></div></div>
<noscript><div class="container"><p class="notice">Ative o JavaScript para ver o produto ou fale com a loja pelo <a href="${waGeneral}">WhatsApp</a>.</p></div></noscript>
${jsError}`,
  })
);

/* ---------- Carrinho ---------- */
written.push(
  page({
    path: "carrinho/index.html",
    pageType: "cart",
    current: "carrinho",
    title: "Carrinho",
    description: "Revise os produtos, as opções e as quantidades e envie seu pedido para a Fanny pelo WhatsApp.",
    extraHead: `<meta name="robots" content="noindex, follow">`,
    body: (rel) => `<div class="container">
  <header class="page-head">
    <nav class="crumbs" aria-label="Você está em"><ol><li><a href="${rel}">Início</a></li><li aria-current="page">Carrinho</li></ol></nav>
    <h1>Seu carrinho</h1>
  </header>
  <div data-cart-root></div>
  <section class="how" id="como-funciona" aria-labelledby="how-title">
    <h2 id="how-title">Como funciona o pedido</h2>
    <ol class="steps">
      <li><strong>Revise o carrinho</strong><span>Confira produtos, opções e quantidades. Dá para editar cada item.</span></li>
      <li><strong>Envie pelo WhatsApp</strong><span>O botão abre a conversa com a Fanny e a mensagem do pedido já escrita. Toque em enviar.</span></li>
      <li><strong>A loja confirma</strong><span>A Fanny responde com disponibilidade, valores, entrega e pagamento. O pedido é fechado na conversa.</span></li>
    </ol>
  </section>
</div>
<noscript><div class="container"><p class="notice">O carrinho precisa de JavaScript. Você pode fazer o pedido direto pelo <a href="${waGeneral}">WhatsApp</a>.</p></div></noscript>
${jsError}`,
  })
);

/* ---------- Sobre ---------- */
written.push(
  page({
    path: "sobre/index.html",
    pageType: "about",
    current: "sobre",
    title: "Sobre a loja",
    description: "Conheça a Fanny Acessórios: acessórios para o dia a dia, produtos personalizados e atendimento pelo WhatsApp.",
    body: (rel) => `<div class="container">
  <header class="page-head">
    <nav class="crumbs" aria-label="Você está em"><ol><li><a href="${rel}">Início</a></li><li aria-current="page">Sobre</li></ol></nav>
    <h1>Sobre a Fanny</h1>
  </header>
  <div class="about">
    <div class="prose">
      <p>A Fanny Acessórios reúne estilo, praticidade e personalização. Na vitrine você encontra copos, canecas, garrafas e capas para celular, lisos ou feitos com o seu nome, a sua frase ou a sua arte.</p>
      <p>A ideia é simples: você escolhe com calma no site, monta um carrinho com tudo o que quer e manda o pedido pronto pelo WhatsApp. A loja confirma disponibilidade, valores e detalhes da personalização na conversa.</p>
      <h2>O que você encontra aqui</h2>
      <ul class="values">
        <li><span class="mega__icon">${catIcon(rel, "phone")}</span><strong>Variedade organizada</strong><span>Categorias claras para achar rápido o que procura.</span></li>
        <li><span class="mega__icon">${catIcon(rel, "sparkle")}</span><strong>Personalização</strong><span>Nome, iniciais, frases, fotos e ilustrações em vários produtos.</span></li>
        <li><span class="mega__icon">${ICON.whatsapp}</span><strong>Atendimento direto</strong><span>Pedido e dúvidas resolvidos com a loja pelo WhatsApp.</span></li>
      </ul>
      <div class="btn-row" style="margin-top:var(--space-6)">
        <a class="btn btn--primary" href="${rel}catalogo/">Ver catálogo</a>
        <a class="btn btn--ghost" href="${C.instagram.url}" target="_blank" rel="noopener">${ICON.instagram}<span>${esc(C.instagram.handle)}</span></a>
      </div>
    </div>
    <div class="about__photos">
      <img src="${rel}assets/img/editorial/vitrine-capinhas.webp" alt="Painel da loja com dezenas de capinhas coloridas" width="1600" height="900" loading="lazy">
      <img src="${rel}assets/img/products/garrafa-rosa.webp" alt="Garrafa rosa em destaque na vitrine de vidro" width="800" height="800" loading="lazy">
      <img src="${rel}assets/img/products/capinhas-coloridas.webp" alt="Capinhas coloridas penduradas no painel azul" width="800" height="800" loading="lazy">
    </div>
  </div>
</div>`,
  })
);

/* ---------- Contato ---------- */
const b = C.business;
written.push(
  page({
    path: "contato/index.html",
    pageType: "contact",
    current: "contato",
    title: "Contato",
    description: `Fale com a Fanny Acessórios pelo WhatsApp ${C.whatsappDisplay} ou pelo Instagram ${C.instagram.handle}.`,
    body: (rel) => `<div class="container">
  <header class="page-head">
    <nav class="crumbs" aria-label="Você está em"><ol><li><a href="${rel}">Início</a></li><li aria-current="page">Contato</li></ol></nav>
    <h1>Fale com a Fanny</h1>
    <p>Dúvidas sobre produtos, personalização ou pedidos? O atendimento é pelo WhatsApp.</p>
  </header>
  <div class="contact-grid">
    <section class="contact-card" aria-labelledby="ct-wa">
      <h2 id="ct-wa">WhatsApp</h2>
      <p class="contact-card__big">${esc(C.whatsappDisplay)}</p>
      <p>Para pedidos, orçamentos de personalização e dúvidas sobre compatibilidade.</p>
      <a class="btn btn--wa" href="${waGeneral}" target="_blank" rel="noopener">${ICON.whatsapp}<span>Conversar no WhatsApp</span></a>
    </section>
    <section class="contact-card" aria-labelledby="ct-ig">
      <h2 id="ct-ig">Instagram</h2>
      <p class="contact-card__big">${esc(C.instagram.handle)}</p>
      <p>Vitrine, novidades e ideias de personalização.</p>
      <a class="btn btn--ghost" href="${C.instagram.url}" target="_blank" rel="noopener">${ICON.instagram}<span>Abrir o perfil</span></a>
    </section>
    ${b.address || b.hours ? `<section class="contact-card" aria-labelledby="ct-loja"><h2 id="ct-loja">Loja</h2>${b.address ? `<p>${esc(b.address)}</p>` : ""}${b.hours ? `<p>${esc(b.hours)}</p>` : ""}</section>` : ""}
  </div>
  <div class="contact-aside">
    ${mascotImg(rel, "", 96, 140)}
    <p>Já sabe o que quer? Monte o carrinho no site: a mensagem do pedido chega organizada, com cada produto, opção e quantidade.</p>
    <a class="btn btn--primary" href="${rel}catalogo/">Montar meu pedido</a>
  </div>
</div>`,
  })
);

/* ---------- 404 (GitHub Pages serve /404.html para qualquer caminho inexistente) ---------- */
{
  // Base dinâmica: em usuario.github.io/repositorio/ a raiz é /repositorio/.
  const baseScript = `<script>(function(){var p=location.pathname.split('/').filter(Boolean);var b=location.hostname.endsWith('github.io')&&p.length?'/'+p[0]+'/':'/';document.write('<base href="'+b+'">');})();</script>`;
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${baseScript}
<title>Página não encontrada | ${esc(C.name)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
${CSS.map((c) => `<link rel="stylesheet" href="assets/css/${c}.css">`).join("\n")}
</head>
<body data-page="404">
<main id="conteudo" class="container">
  <div class="empty empty--page">
    ${m.enabled ? `<img class="empty__mascot" src="${m.src}" alt="" width="140" height="204">` : ""}
    <h1>Página não encontrada</h1>
    <p>O endereço pode ter mudado ou o produto saiu do catálogo. Procure pelo nome ou volte para o início.</p>
    <form class="page-search" action="busca/" role="search" style="width:100%;max-width:480px">
      <label class="sr-only" for="q404">Buscar produtos</label>
      <input id="q404" type="search" name="q" placeholder="Buscar produtos">
      <button class="btn btn--primary" type="submit">Buscar</button>
    </form>
    <div class="btn-row" style="justify-content:center;margin-top:var(--space-4)">
      <a class="btn btn--ghost" href="./">Ir para o início</a>
      <a class="btn btn--wa" href="${waGeneral}" target="_blank" rel="noopener">${ICON.whatsapp}<span>Falar com a loja</span></a>
    </div>
  </div>
</main>
</body>
</html>
`;
  writeFileSync(join(ROOT, "404.html"), html);
  written.push("404.html");
}

/* ---------- sitemap e robots ---------- */
const base = C.siteUrl.replace(/\/$/, "");
const urls = [
  "",
  "catalogo/",
  "categorias/",
  ...cats.map((c) => `categorias/${c.id}/`),
  ...(hasOffers() ? ["ofertas/"] : []),
  ...PRODUCTS.map((p) => `produto/?id=${p.id}`),
  "sobre/",
  "contato/",
];
writeFileSync(
  join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!-- Gerado por tools/build.mjs. Ajuste siteUrl em assets/js/config.js e rode o gerador de novo. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(`${base}/${u}`)}</loc></url>`).join("\n")}
</urlset>
`
);
writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /carrinho/\n\nSitemap: ${base}/sitemap.xml\n`);
writeFileSync(join(ROOT, ".nojekyll"), "");

console.log(`Páginas geradas (${written.length}):\n  ${written.join("\n  ")}`);
console.log(`Categorias ativas: ${cats.map((c) => c.id).join(", ")}`);
const empty = CATEGORIES.filter((c) => !cats.includes(c)).map((c) => c.id);
if (empty.length) console.log(`Categorias sem produtos (ocultas): ${empty.join(", ")}`);
if (!siteUrlReady) console.log("Aviso: siteUrl ainda é o exemplo. Atualize em assets/js/config.js para sitemap/canonical corretos.");
