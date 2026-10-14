/**
 * Componentes de interface compartilhados: cards de produto, gaveta do
 * carrinho, contador, avisos (toasts), menu móvel, mega menu e busca do topo.
 */
import { STORE_CONFIG } from "./config.js";
import { getCategory } from "./products.js";
import { cart } from "./cart.js";
import { searchProducts } from "./search.js";
import { ICON } from "./icons.js";
import { $, $$, esc, url, productUrl, formatPrice, pluralize, debounce } from "./utils.js";

/* ---------------- Renderização de produtos ---------------- */

export function mainImage(product) {
  const img = (product.images || [])[0];
  if (img) return { src: url(img.src), alt: img.alt || product.name, credit: img.credit, placeholder: false };
  const cat = getCategory(product.category);
  const ph = `assets/img/categories/icon-${cat?.icon || "sparkle"}.svg`;
  return { src: url(ph), alt: "", credit: "placeholder", placeholder: true };
}

export function priceHTML(product) {
  const promo = typeof product.promoPrice === "number" && typeof product.price === "number" && product.promoPrice < product.price;
  if (promo) {
    return `<span class="price"><span class="price__now">${formatPrice(product.promoPrice)}</span> <s class="price__old">${formatPrice(product.price)}</s></span>`;
  }
  if (typeof product.price === "number") {
    const hasAddons = (product.options || []).some((o) => (o.values || []).some((v) => typeof v.price === "number" && v.price > 0));
    return `<span class="price"><span class="price__now">${hasAddons ? "a partir de " : ""}${formatPrice(product.price)}</span></span>`;
  }
  return `<span class="price price--quote">${esc(STORE_CONFIG.catalog.priceOnRequestLabel)}</span>`;
}

export function tagsHTML(product) {
  const tags = [];
  if (product.personalizable) tags.push(`<span class="tag tag--custom">${ICON.sparkle}Personalizável</span>`);
  if (product.availability === "indisponivel") tags.push(`<span class="tag tag--out">Indisponível</span>`);
  if (product.isNew) tags.push(`<span class="tag">Novidade</span>`);
  if (product.demo && STORE_CONFIG.catalogStatus === "demonstracao") tags.push(`<span class="tag tag--demo" title="Produto de exemplo: nome, opções e disponibilidade ainda serão confirmados pela loja">Exemplo</span>`);
  return tags.join("");
}

function swatchesHTML(product) {
  const color = (product.options || []).find((o) => o.type === "color");
  if (!color || color.values.length < 2) return "";
  const shown = color.values.slice(0, 6);
  const more = color.values.length - shown.length;
  return `<span class="mini-swatches" aria-label="${color.values.length} cores">${shown
    .map((v) => `<span style="--sw:${esc(v.hex)}" title="${esc(v.label)}"></span>`)
    .join("")}${more > 0 ? `<em>+${more}</em>` : ""}</span>`;
}

export function productCardHTML(product, { eager = false } = {}) {
  const img = mainImage(product);
  const href = productUrl(product.id);
  return `<article class="card${img.placeholder ? " card--ph" : ""}">
  <a class="card__media" href="${href}" tabindex="-1" aria-hidden="true">
    <img src="${img.src}" alt="" width="600" height="600" loading="${eager ? "eager" : "lazy"}" decoding="async">
    ${img.placeholder ? `<span class="card__ph-note">Foto em breve</span>` : ""}
  </a>
  <div class="card__body">
    <p class="card__type">${esc(product.type || "")}</p>
    <h3 class="card__title"><a href="${href}">${esc(product.name)}</a></h3>
    ${swatchesHTML(product)}
    <div class="card__foot">${priceHTML(product)}</div>
    <div class="card__tags">${tagsHTML(product)}</div>
  </div>
</article>`;
}

/* ---------------- Avisos (toasts) ---------------- */

let toastRegion;
export function toast(message, { action, href, tone = "ok" } = {}) {
  if (!toastRegion) {
    toastRegion = document.createElement("div");
    toastRegion.className = "toasts";
    toastRegion.setAttribute("role", "status");
    toastRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(toastRegion);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${tone}`;
  el.innerHTML = `<span>${tone === "ok" ? ICON.check : ICON.info}</span><p>${esc(message)}</p>${
    action ? `<a href="${href}" class="toast__action">${esc(action)}</a>` : ""
  }`;
  toastRegion.appendChild(el);
  setTimeout(() => el.classList.add("is-leaving"), 4200);
  setTimeout(() => el.remove(), 4700);
}

/* ---------------- Itens do carrinho (gaveta e página) ---------------- */

export function cartItemsHTML(summary, { editable = true } = {}) {
  return summary.items
    .map((item) => {
      const img = mainImage(item.product);
      const editHref = `${productUrl(item.product.id)}&editar=${encodeURIComponent(item.key)}`;
      return `<li class="line" data-key="${esc(item.key)}">
  <a class="line__thumb${img.placeholder ? " is-ph" : ""}" href="${productUrl(item.product.id)}" tabindex="-1" aria-hidden="true"><img src="${img.src}" alt="" width="96" height="96" loading="lazy"></a>
  <div class="line__info">
    <h3 class="line__name"><a href="${productUrl(item.product.id)}">${esc(item.product.name)}</a></h3>
    ${item.details.length ? `<dl class="line__opts">${item.details.map((d) => `<div><dt>${esc(d.label)}</dt><dd>${esc(d.value)}</dd></div>`).join("")}</dl>` : ""}
    ${item.pending ? "" : `<p class="line__unit">${formatPrice(item.unit)} cada</p>`}
    ${editable ? `<div class="line__actions">
      <div class="stepper" role="group" aria-label="Quantidade de ${esc(item.product.name)}">
        <button type="button" class="stepper__btn" data-act="dec" aria-label="Diminuir quantidade" ${item.qty <= 1 ? "disabled" : ""}>${ICON.minus}</button>
        <input class="stepper__input" type="number" inputmode="numeric" min="1" max="${STORE_CONFIG.maxQuantityPerItem}" step="1" value="${item.qty}" aria-label="Quantidade" data-act="qty">
        <button type="button" class="stepper__btn" data-act="inc" aria-label="Aumentar quantidade" ${item.qty >= STORE_CONFIG.maxQuantityPerItem ? "disabled" : ""}>${ICON.plus}</button>
      </div>
      ${(item.product.options || []).length ? `<a class="link-btn" href="${editHref}">${ICON.edit}<span>Editar</span></a>` : ""}
      <button type="button" class="link-btn link-btn--danger" data-act="remove">${ICON.trash}<span>Remover</span></button>
    </div>` : `<p class="line__qty">Quantidade: ${item.qty}</p>`}
  </div>
  <p class="line__total">${item.pending ? `<span class="pending">A confirmar</span>` : formatPrice(item.subtotal)}</p>
</li>`;
    })
    .join("");
}

export function totalsHTML(summary) {
  const rows = [`<div class="totals__row"><span>Unidades</span><span>${summary.units}</span></div>`];
  if (summary.allPriced) {
    rows.push(`<div class="totals__row totals__row--main"><span>Total dos produtos</span><strong>${formatPrice(summary.knownSubtotal)}</strong></div>`);
  } else if (summary.pricedCount > 0) {
    rows.push(`<div class="totals__row totals__row--main"><span>Subtotal com preço definido</span><strong>${formatPrice(summary.knownSubtotal)}</strong></div>`);
    rows.push(`<p class="totals__note">${pluralize(summary.pendingCount, "item tem", "itens têm")} valor a confirmar pela loja, por isso não mostramos um total final.</p>`);
  } else {
    rows.push(`<div class="totals__row totals__row--main"><span>Total</span><strong class="pending">A confirmar</strong></div>`);
    rows.push(`<p class="totals__note">Os itens do carrinho têm preço sob consulta. A Fanny responde com os valores pelo WhatsApp.</p>`);
  }
  rows.push(`<p class="totals__note">Entrega e pagamento são combinados no atendimento.</p>`);
  return rows.join("");
}

/** Liga os botões de quantidade/remover de uma lista de itens. */
export function bindCartList(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    const li = e.target.closest(".line");
    if (!btn || !li || btn.tagName === "INPUT") return;
    const key = li.dataset.key;
    if (btn.dataset.act === "inc") cart.increment(key, 1);
    if (btn.dataset.act === "dec") cart.increment(key, -1);
    if (btn.dataset.act === "remove") {
      const name = li.querySelector(".line__name")?.textContent || "Item";
      cart.remove(key);
      toast(`${name} saiu do carrinho.`, { tone: "info" });
    }
  });
  root.addEventListener("change", (e) => {
    const input = e.target.closest('input[data-act="qty"]');
    if (!input) return;
    cart.setQty(input.closest(".line").dataset.key, input.value);
  });
}

/* ---------------- Gaveta do carrinho ---------------- */

let drawer, lastFocus;

function buildDrawer() {
  drawer = document.createElement("div");
  drawer.className = "drawer";
  drawer.id = "cart-drawer";
  drawer.hidden = true;
  drawer.innerHTML = `<div class="drawer__scrim" data-close></div>
<section class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1">
  <header class="drawer__head">
    <h2 id="drawer-title">Seu carrinho</h2>
    <button type="button" class="icon-btn" data-close aria-label="Fechar carrinho">${ICON.close}</button>
  </header>
  <div class="drawer__body"><ul class="lines" data-lines></ul><div data-empty></div></div>
  <footer class="drawer__foot" data-foot>
    <div class="totals" data-totals></div>
    <a class="btn btn--primary btn--block" href="${url("carrinho/")}">Revisar e enviar pedido</a>
    <button type="button" class="btn btn--ghost btn--block" data-close>Continuar comprando</button>
  </footer>
</section>`;
  document.body.appendChild(drawer);
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeCart();
  });
  drawer.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
    if (e.key === "Tab") trapFocus(e, drawer.querySelector(".drawer__panel"));
  });
  bindCartList(drawer.querySelector("[data-lines]"));
  renderDrawer();
}

function renderDrawer() {
  if (!drawer) return;
  const summary = cart.summary();
  drawer.querySelector("[data-lines]").innerHTML = cartItemsHTML(summary);
  drawer.querySelector("[data-totals]").innerHTML = summary.isEmpty ? "" : totalsHTML(summary);
  drawer.querySelector("[data-foot]").hidden = summary.isEmpty;
  drawer.querySelector("[data-empty]").innerHTML = summary.isEmpty ? emptyCartHTML() : "";
}

export function emptyCartHTML() {
  const m = STORE_CONFIG.mascot;
  return `<div class="empty">
  ${m.enabled ? `<img class="empty__mascot" src="${url(m.src)}" alt="" width="140" height="204" loading="lazy">` : ""}
  <h3>Seu carrinho está vazio</h3>
  <p>Escolha produtos no catálogo e eles aparecem aqui, com as opções que você selecionar.</p>
  <a class="btn btn--primary" href="${url("catalogo/")}">Ver catálogo</a>
</div>`;
}

export function openCart() {
  if (!drawer) buildDrawer();
  if (document.body.dataset.page === "cart") {
    document.getElementById("pedido")?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  lastFocus = document.activeElement;
  renderDrawer();
  drawer.hidden = false;
  document.documentElement.classList.add("is-locked");
  requestAnimationFrame(() => {
    drawer.classList.add("is-open");
    drawer.querySelector(".drawer__panel").focus();
  });
}

export function closeCart() {
  if (!drawer || drawer.hidden) return;
  drawer.classList.remove("is-open");
  document.documentElement.classList.remove("is-locked");
  setTimeout(() => (drawer.hidden = true), 250);
  lastFocus?.focus?.();
}

function trapFocus(e, container) {
  const f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', container).filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ---------------- Cabeçalho ---------------- */

function updateCount() {
  const n = cart.count();
  $$("[data-cart-count]").forEach((el) => {
    el.textContent = n > 99 ? "99+" : String(n);
    el.hidden = n === 0;
  });
  $$("[data-cart-label]").forEach((el) => el.setAttribute("aria-label", `Carrinho, ${pluralize(n, "item", "itens")}`));
}

function bindMobileNav() {
  const toggle = $("[data-nav-toggle]");
  const panel = $("#mobile-nav");
  if (!toggle || !panel) return;
  const set = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    document.documentElement.classList.toggle("is-locked", open);
    if (open) panel.querySelector("a, button")?.focus();
    else toggle.focus();
  };
  $$("[data-nav-toggle]").forEach((t) => t.addEventListener("click", () => set(panel.hidden)));
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-nav-close]")) set(false);
  });
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
    if (e.key === "Tab") trapFocus(e, panel);
  });
}

function bindMegaMenu() {
  $$("[data-menu]").forEach((wrap) => {
    const btn = wrap.querySelector("[data-menu-btn]");
    const panel = wrap.querySelector("[data-menu-panel]");
    const set = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    };
    btn.addEventListener("click", () => set(panel.hidden));
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) {
        set(false);
        btn.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) set(false);
    });
    wrap.addEventListener("focusout", (e) => {
      if (!wrap.contains(e.relatedTarget)) set(false);
    });
  });
}

function bindHeaderSearch() {
  $$("[data-search-form]").forEach((form) => {
    const input = form.querySelector("input[type=search]");
    const list = form.querySelector("[data-suggest]");
    if (!input || !list) return;
    let active = -1;
    const close = () => {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      active = -1;
    };
    const render = () => {
      const q = input.value.trim();
      if (q.length < 2) return close();
      const res = searchProducts(q).slice(0, 5);
      list.innerHTML =
        res
          .map(
            (p, i) => `<li role="option" id="${list.id}-${i}"><a href="${productUrl(p.id)}"><img src="${mainImage(p).src}" alt="" width="40" height="40"><span><strong>${esc(p.name)}</strong><small>${esc(p.type || "")}</small></span></a></li>`
          )
          .join("") +
        `<li role="option" id="${list.id}-all" class="suggest__all"><a href="${url("busca/")}?q=${encodeURIComponent(q)}">${res.length ? "Ver todos os resultados" : "Nenhum produto com esse termo. Ver busca completa"}</a></li>`;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      active = -1;
    };
    input.addEventListener("input", debounce(render, 120));
    input.addEventListener("keydown", (e) => {
      const items = $$("li a", list);
      if (list.hidden || !items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach((a, i) => a.parentElement.classList.toggle("is-active", i === active));
        input.setAttribute("aria-activedescendant", items[active].parentElement.id);
      } else if (e.key === "Enter" && active >= 0) {
        e.preventDefault();
        items[active].click();
      } else if (e.key === "Escape") close();
    });
    document.addEventListener("click", (e) => {
      if (!form.contains(e.target)) close();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = `${url("busca/")}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
    });
  });
}

export function initChrome() {
  updateCount();
  cart.subscribe(() => {
    updateCount();
    renderDrawer();
  });
  $$("[data-open-cart]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      openCart();
    })
  );
  bindMobileNav();
  bindMegaMenu();
  bindHeaderSearch();
  const ann = $("[data-announcement-close]");
  ann?.addEventListener("click", () => ann.closest(".announce")?.remove());
}
