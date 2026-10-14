/**
 * PÁGINA DE PRODUTO (produto/?id=...)
 * Galeria, opções/personalização com validação, quantidade, carrinho
 * e consulta pelo WhatsApp. Com &editar=<chave> edita um item do carrinho.
 */
import { STORE_CONFIG, whatsappUrl } from "./config.js";
import { getProduct, getCategory, productsInCategory } from "./products.js";
import { cart, isOptionVisible, validateSelections, unitPrice, sanitizeQty } from "./cart.js";
import { buildProductInquiry } from "./whatsapp.js";
import { productCardHTML, priceHTML, tagsHTML, mainImage, toast, openCart } from "./ui.js";
import { ICON } from "./icons.js";
import { $, $$, esc, url, categoryUrl, productUrl, formatPrice } from "./utils.js";

const OTHER = "__outro__";

function fieldHTML(opt) {
  const req = opt.required ? `<span class="req" aria-hidden="true">*</span>` : `<span class="opt-tag">opcional</span>`;
  const help = opt.help ? `<p class="field__help" id="h-${opt.id}">${esc(opt.help)}</p>` : "";
  const err = `<p class="field__error" id="e-${opt.id}" hidden></p>`;
  const describedby = `${opt.help ? `h-${opt.id} ` : ""}e-${opt.id}`;

  if (opt.type === "color" || opt.type === "choice") {
    const items = opt.values
      .map(
        (v) => `<label class="${opt.type === "color" ? "swatch" : "pill"}">
  <input type="radio" name="${opt.id}" value="${esc(v.value)}" ${opt.required ? "required" : ""}>
  ${opt.type === "color" ? `<span class="swatch__dot" style="--sw:${esc(v.hex)}"></span><span class="sr-only">${esc(v.label)}</span>` : `<span>${esc(v.label)}${v.quote ? ` <small>sob orçamento</small>` : typeof v.price === "number" && v.price > 0 ? ` <small>+ ${formatPrice(v.price)}</small>` : ""}</span>`}
</label>`
      )
      .join("");
    return `<fieldset class="field" data-option="${opt.id}" aria-describedby="${describedby}">
  <legend class="field__label">${esc(opt.label)} ${req}${opt.type === "color" ? ` <span class="field__value" data-color-name></span>` : ""}</legend>
  <div class="${opt.type === "color" ? "swatches" : "pills"}">${items}</div>${help}${err}
</fieldset>`;
  }
  if (opt.type === "select") {
    return `<div class="field" data-option="${opt.id}">
  <label class="field__label" for="f-${opt.id}">${esc(opt.label)} ${req}</label>
  <div class="select-wrap"><select id="f-${opt.id}" name="${opt.id}" aria-describedby="${describedby}" ${opt.required ? "required" : ""}>
    <option value="">Selecione</option>
    ${opt.values.map((v) => `<option value="${esc(v.value)}">${esc(v.label)}</option>`).join("")}
    ${opt.allowOther ? `<option value="${OTHER}">Outra</option>` : ""}
  </select>${ICON.chevronDown}</div>
  ${opt.allowOther ? `<div class="field__other" hidden><label class="sr-only" for="f-${opt.id}-outro">${esc(opt.allowOther)}</label><input id="f-${opt.id}-outro" type="text" maxlength="60" placeholder="${esc(opt.allowOther)}" data-other-for="${opt.id}"></div>` : ""}
  ${help}${err}
</div>`;
  }
  const max = opt.maxLength ? `maxlength="${opt.maxLength}"` : "";
  const ph = opt.placeholder ? `placeholder="${esc(opt.placeholder)}"` : "";
  const input =
    opt.type === "textarea"
      ? `<textarea id="f-${opt.id}" name="${opt.id}" rows="3" ${max} ${ph} aria-describedby="${describedby}" ${opt.required ? "required" : ""}></textarea>`
      : `<input id="f-${opt.id}" name="${opt.id}" type="text" ${max} ${ph} aria-describedby="${describedby}" ${opt.required ? "required" : ""} autocomplete="off">`;
  return `<div class="field" data-option="${opt.id}">
  <label class="field__label" for="f-${opt.id}">${esc(opt.label)} ${req}</label>
  ${input}
  ${opt.maxLength ? `<p class="field__count" aria-hidden="true"><span data-count-for="${opt.id}">0</span>/${opt.maxLength}</p>` : ""}
  ${help}${err}
</div>`;
}

function galleryHTML(product) {
  const imgs = product.images?.length ? product.images : [];
  if (!imgs.length) {
    const ph = mainImage(product);
    return `<div class="gallery gallery--ph"><div class="gallery__track"><figure class="gallery__slide"><img src="${ph.src}" alt="" width="600" height="600"></figure></div>
      <p class="gallery__credit">Foto em breve. Peça imagens do produto pelo WhatsApp.</p></div>`;
  }
  const credit = (c) => (c === "loja" ? "Foto da vitrine da loja" : c === "ilustrativa" ? "Imagem ilustrativa" : "");
  return `<div class="gallery" data-gallery>
  <div class="gallery__track" data-track tabindex="0" aria-label="Fotos do produto. Use as setas para navegar.">
    ${imgs
      .map(
        (im, i) => `<figure class="gallery__slide" data-slide="${i}"><div class="zoom" data-zoom><img src="${url(im.src)}" alt="${esc(im.alt)}" width="800" height="800" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></div></figure>`
      )
      .join("")}
  </div>
  ${imgs.length > 1 ? `<div class="gallery__thumbs" role="tablist" aria-label="Escolher foto">${imgs
    .map((im, i) => `<button type="button" role="tab" class="gallery__thumb" data-go="${i}" aria-selected="${i === 0}" aria-label="Foto ${i + 1} de ${imgs.length}"><img src="${url(im.src)}" alt="" width="80" height="80" loading="lazy"></button>`)
    .join("")}</div>` : ""}
  <p class="gallery__credit" data-credit>${credit(imgs[0].credit)}</p>
</div>`;
}

function bindGallery(root, product) {
  const g = $("[data-gallery]", root);
  if (!g) return;
  const track = $("[data-track]", g);
  const thumbs = $$("[data-go]", g);
  const creditEl = $("[data-credit]", g);
  const credit = (c) => (c === "loja" ? "Foto da vitrine da loja" : c === "ilustrativa" ? "Imagem ilustrativa" : "");
  let current = 0;
  const go = (i, smooth = true) => {
    current = Math.max(0, Math.min(i, product.images.length - 1));
    track.scrollTo({ left: track.clientWidth * current, behavior: smooth ? "smooth" : "auto" });
    mark();
  };
  const mark = () => {
    thumbs.forEach((t, i) => t.setAttribute("aria-selected", String(i === current)));
    creditEl.textContent = credit(product.images[current].credit);
  };
  thumbs.forEach((t) => t.addEventListener("click", () => go(+t.dataset.go)));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(current + 1);
    if (e.key === "ArrowLeft") go(current - 1);
  });
  track.addEventListener("scroll", () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== current) {
      current = i;
      mark();
    }
  }, { passive: true });
  // zoom simples ao passar o mouse (apenas dispositivos com mouse)
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$("[data-zoom]", g).forEach((z) => {
      const img = z.querySelector("img");
      z.addEventListener("mousemove", (e) => {
        const r = z.getBoundingClientRect();
        img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        z.classList.add("is-zoomed");
      });
      z.addEventListener("mouseleave", () => z.classList.remove("is-zoomed"));
    });
  }
}

function serviceHTML(product) {
  const b = STORE_CONFIG.business || {};
  const items = [b.pickup, b.deliveryInfo, b.payment ? `Pagamento: ${b.payment}` : null, product.personalizable ? b.customLeadTime : null].filter(Boolean);
  if (!items.length) return "";
  return `<ul class="pdp__service" aria-label="Retirada, entrega e pagamento">${items.map((t) => `<li>${ICON.check}<span>${esc(t)}</span></li>`).join("")}</ul>`;
}

function notFound(root) {
  document.title = `Produto não encontrado | ${STORE_CONFIG.name}`;
  root.innerHTML = `<div class="container"><div class="empty empty--wide empty--page">
  ${STORE_CONFIG.mascot.enabled ? `<img class="empty__mascot" src="${url(STORE_CONFIG.mascot.src)}" alt="" width="140" height="204">` : ""}
  <h1>Produto não encontrado</h1>
  <p>Este link pode estar desatualizado ou o produto saiu do catálogo.</p>
  <div class="btn-row"><a class="btn btn--primary" href="${url("catalogo/")}">Ver catálogo</a><a class="btn btn--ghost" href="${url("busca/")}">Buscar produto</a></div>
</div></div>`;
}

function setMeta(product, img) {
  const desc = product.description.slice(0, 155);
  document.title = `${product.name} | ${STORE_CONFIG.name}`;
  $('meta[name="description"]')?.setAttribute("content", desc);
  $('meta[property="og:title"]')?.setAttribute("content", `${product.name} | ${STORE_CONFIG.name}`);
  $('meta[property="og:description"]')?.setAttribute("content", desc);
  if (!img.placeholder) $('meta[property="og:image"]')?.setAttribute("content", img.src);
}

export function initProduct(root) {
  const sp = new URLSearchParams(location.search);
  const product = getProduct(sp.get("id") || "");
  if (!product) return notFound(root);

  const editKey = sp.get("editar");
  const editing = editKey ? cart.find(editKey) : null;
  const cat = getCategory(product.category);
  const img = mainImage(product);
  setMeta(product, img);
  const unavailable = product.availability === "indisponivel";
  const allValues = (product.options || []).flatMap((o) => o.values || []);
  const hasArt = allValues.some((v) => /foto|arte|ilustra/i.test(v.value));
  const hasQuote = product.price === null || allValues.some((v) => v.quote);

  root.innerHTML = `<div class="container">
  <nav class="crumbs" aria-label="Você está em"><ol>
    <li><a href="${url("")}">Início</a></li>
    ${cat ? `<li><a href="${categoryUrl(cat.id)}">${esc(cat.navLabel)}</a></li>` : ""}
    <li aria-current="page">${esc(product.name)}</li>
  </ol></nav>
  <div class="pdp">
    <div class="pdp__gallery">${galleryHTML(product)}</div>
    <div class="pdp__info">
      <p class="pdp__type">${esc(product.type || cat?.navLabel || "")}</p>
      <h1 class="pdp__title">${esc(product.name)}</h1>
      <div class="pdp__tags">${tagsHTML(product)}</div>
      <p class="pdp__price" data-price>${priceHTML(product)}</p>
      <p class="pdp__desc">${esc(product.description)}</p>
      ${product.demo && STORE_CONFIG.catalogStatus === "demonstracao" ? `<p class="notice">${ICON.info}<span>Produto de exemplo. Nome, opções, preço e disponibilidade são confirmados pela loja no atendimento.</span></p>` : ""}
      ${editing ? `<p class="notice notice--edit">${ICON.edit}<span>Você está editando um item do carrinho. Altere as opções e salve.</span></p>` : ""}
      <form class="pdp__form" data-form novalidate>
        ${(product.options || []).map(fieldHTML).join("")}
        <div class="pdp__buy">
          <div class="field field--qty">
            <label class="field__label" for="qty">Quantidade</label>
            <div class="stepper stepper--lg">
              <button type="button" class="stepper__btn" data-qty="-1" aria-label="Diminuir quantidade">${ICON.minus}</button>
              <input class="stepper__input" id="qty" name="qty" type="number" inputmode="numeric" min="1" max="${STORE_CONFIG.maxQuantityPerItem}" step="1" value="1">
              <button type="button" class="stepper__btn" data-qty="1" aria-label="Aumentar quantidade">${ICON.plus}</button>
            </div>
          </div>
          <button type="submit" class="btn btn--primary btn--lg pdp__add" ${unavailable ? "disabled" : ""}>${ICON.bag}<span>${unavailable ? "Indisponível" : editing ? "Salvar alterações" : "Adicionar ao carrinho"}</span></button>
        </div>
        <p class="form-alert" data-form-alert role="alert" hidden></p>
        <a class="btn btn--wa btn--block" data-wa target="_blank" rel="noopener" href="#">${ICON.whatsapp}<span>Consultar pelo WhatsApp</span></a>
      </form>
      ${serviceHTML(product)}
      ${product.details?.length ? `<section class="pdp__details"><h2>Características</h2><ul>${product.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></section>` : ""}
      ${product.compatibility?.length ? `<section class="pdp__details"><h2>Compatibilidade confirmada</h2><ul>${product.compatibility.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></section>` : ""}
      ${product.personalizable ? `<section class="pdp__details pdp__details--custom"><h2>Como funciona a personalização</h2><ol>
        <li>Escolha as opções e escreva o nome, as iniciais ou a frase.</li>
        <li>Envie o pedido pelo WhatsApp.${hasArt ? " Fotos e artes são enviadas na própria conversa." : ""}</li>
        <li>A loja confirma ${hasQuote ? "o resultado, o prazo e o valor" : "o resultado e o prazo"} antes de produzir.</li></ol></section>` : ""}
    </div>
  </div>
  <section class="related" data-related hidden><h2 class="section-title">Mais em ${esc(cat?.navLabel || "acessórios")}</h2><div class="grid grid--row" data-related-grid></div></section>
</div>`;

  bindGallery(root, product);

  const form = $("[data-form]", root);
  const qtyInput = $("#qty", form);
  const alertEl = $("[data-form-alert]", form);
  const waLink = $("[data-wa]", form);

  const collect = () => {
    const sel = {};
    for (const opt of product.options || []) {
      if (opt.type === "color" || opt.type === "choice") {
        const c = form.querySelector(`input[name="${opt.id}"]:checked`);
        if (c) sel[opt.id] = c.value;
      } else if (opt.type === "select") {
        const v = form.elements[opt.id].value;
        sel[opt.id] = v === OTHER ? form.querySelector(`[data-other-for="${opt.id}"]`).value.trim() : v;
      } else {
        sel[opt.id] = form.elements[opt.id].value;
      }
    }
    return sel;
  };

  const refresh = () => {
    const sel = collect();
    for (const opt of product.options || []) {
      const wrap = form.querySelector(`[data-option="${opt.id}"]`);
      const vis = isOptionVisible(product, opt, sel);
      wrap.hidden = !vis;
      wrap.querySelectorAll("input, select, textarea").forEach((el) => (el.disabled = !vis));
      if (opt.type === "color") {
        const v = opt.values.find((x) => x.value === sel[opt.id]);
        wrap.querySelector("[data-color-name]").textContent = v ? v.label : "";
      }
      if (opt.type === "select" && opt.allowOther) {
        const other = wrap.querySelector(".field__other");
        other.hidden = form.elements[opt.id].value !== OTHER;
      }
    }
    // preço com acréscimos
    const { unit, pending } = unitPrice(product, sel);
    const priceEl = $("[data-price]", root);
    if (!pending && typeof product.price === "number") {
      const base = typeof product.promoPrice === "number" ? product.promoPrice : product.price;
      const addons = unit - base;
      priceEl.innerHTML = `<span class="price"><span class="price__now">${formatPrice(unit)}</span>${typeof product.promoPrice === "number" && product.promoPrice < product.price ? ` <s class="price__old">${formatPrice(product.price + addons)}</s>` : ""}</span>${addons > 0 ? ` <span class="price__note">com personalização</span>` : ""}`;
    } else if (pending && typeof product.price === "number") {
      priceEl.innerHTML = `${priceHTML(product)} <span class="pending">+ personalização sob orçamento</span>`;
    }
    waLink.href = whatsappUrl(buildProductInquiry(product, sel, qtyInput.value, productUrl(product.id)));
    $$("[data-count-for]", form).forEach((c) => (c.textContent = (form.elements[c.dataset.countFor]?.value || "").length));
  };

  const showErrors = (errors) => {
    $$(".field__error", form).forEach((e) => (e.hidden = true));
    $$("[aria-invalid]", form).forEach((e) => e.removeAttribute("aria-invalid"));
    const ids = Object.keys(errors);
    for (const id of ids) {
      const e = $(`#e-${id}`, form);
      e.textContent = errors[id];
      e.hidden = false;
      const wrap = form.querySelector(`[data-option="${id}"]`);
      wrap.querySelectorAll("input, select, textarea").forEach((el) => el.setAttribute("aria-invalid", "true"));
    }
    if (ids.length) {
      alertEl.textContent = ids.length === 1 ? "Falta 1 informação para continuar." : `Faltam ${ids.length} informações para continuar.`;
      alertEl.hidden = false;
      const first = form.querySelector(`[data-option="${ids[0]}"]`);
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      first.querySelector("input:not([type=radio]), select, textarea, input[type=radio]")?.focus({ preventScroll: true });
    } else alertEl.hidden = true;
  };

  // pré-preenche ao editar
  if (editing) {
    for (const opt of product.options || []) {
      const v = editing.options[opt.id];
      if (v === undefined) continue;
      if (opt.type === "color" || opt.type === "choice") {
        const r = [...form.querySelectorAll(`input[name="${opt.id}"]`)].find((i) => i.value === v);
        if (r) r.checked = true;
      } else if (opt.type === "select") {
        const known = opt.values.some((x) => x.value === v);
        form.elements[opt.id].value = known ? v : OTHER;
        if (!known) form.querySelector(`[data-other-for="${opt.id}"]`).value = v;
      } else form.elements[opt.id].value = v;
    }
    qtyInput.value = editing.qty;
  }

  form.addEventListener("input", refresh);
  form.addEventListener("change", (e) => {
    refresh();
    const wrap = e.target.closest("[data-option]");
    if (wrap) {
      const err = wrap.querySelector(".field__error");
      if (err && !err.hidden) {
        err.hidden = true;
        wrap.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
      }
    }
  });
  qtyInput.addEventListener("change", () => (qtyInput.value = sanitizeQty(qtyInput.value)));
  $$("[data-qty]", form).forEach((b) =>
    b.addEventListener("click", () => {
      qtyInput.value = sanitizeQty(sanitizeQty(qtyInput.value) + +b.dataset.qty);
      refresh();
    })
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (unavailable) return;
    const sel = collect();
    const { valid, errors } = validateSelections(product, sel);
    if (!valid) return showErrors(errors);
    showErrors({});
    const qty = sanitizeQty(qtyInput.value);
    const res = editing ? cart.replace(editKey, sel, qty) : cart.add(product.id, sel, qty);
    if (!res.ok) {
      if (res.errors) return showErrors(res.errors);
      alertEl.textContent = res.error;
      alertEl.hidden = false;
      return;
    }
    if (editing) {
      window.location.href = url("carrinho/");
      return;
    }
    toast(res.merged ? `Quantidade de ${product.name} atualizada no carrinho.` : `${product.name} foi para o carrinho.`, { action: "Ver carrinho", href: url("carrinho/") });
    openCart();
  });

  refresh();

  // relacionados
  if (cat) {
    const rel = productsInCategory(cat.id).filter((p) => p.id !== product.id).slice(0, 4);
    if (rel.length) {
      $("[data-related]", root).hidden = false;
      $("[data-related-grid]", root).innerHTML = rel.map((p) => productCardHTML(p)).join("");
    }
  }
}
