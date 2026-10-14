/**
 * LISTAGENS: catálogo completo, categorias e resultados de busca.
 * Filtros e ordenação são gerados a partir dos dados cadastrados:
 * um filtro só aparece se ajudar a separar os produtos daquela listagem.
 * O estado fica na URL (?cor=Rosa&ordem=menor-preco), então dá para compartilhar.
 */
import { PRODUCTS, CATEGORIES, getCategory, productsInCategory } from "./products.js";
import { STORE_CONFIG, whatsappUrl } from "./config.js";
import { searchProducts } from "./search.js";
import { productCardHTML } from "./ui.js";
import { ICON } from "./icons.js";
import { $, $$, esc, pluralize, debounce } from "./utils.js";

const AVAIL = { disponivel: "Disponível", consulta: "Sob consulta", indisponivel: "Indisponível" };
const effPrice = (p) => (typeof p.promoPrice === "number" ? p.promoPrice : typeof p.price === "number" ? p.price : null);
const colorsOf = (p) => (p.options || []).filter((o) => o.type === "color").flatMap((o) => o.values);

function readState() {
  const sp = new URLSearchParams(location.search);
  const list = (k) => (sp.get(k) ? sp.get(k).split(",").filter(Boolean) : []);
  const num = (k) => (sp.get(k) !== null && sp.get(k) !== "" && Number.isFinite(+sp.get(k)) ? +sp.get(k) : null);
  return {
    q: sp.get("q") || "",
    cat: list("cat"),
    tipo: list("tipo"),
    cor: list("cor"),
    compat: list("compat"),
    disp: list("disp"),
    pers: sp.get("pers") === "1",
    min: num("min"),
    max: num("max"),
    ordem: sp.get("ordem") || "relevancia",
  };
}

function writeState(s) {
  const sp = new URLSearchParams();
  if (s.q) sp.set("q", s.q);
  for (const k of ["cat", "tipo", "cor", "compat", "disp"]) if (s[k].length) sp.set(k, s[k].join(","));
  if (s.pers) sp.set("pers", "1");
  if (s.min !== null) sp.set("min", s.min);
  if (s.max !== null) sp.set("max", s.max);
  if (s.ordem !== "relevancia") sp.set("ordem", s.ordem);
  const qs = sp.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

/** Facetas possíveis para um conjunto de produtos. */
function buildFacets(products, scope) {
  const count = (fn) => {
    const m = new Map();
    for (const p of products) for (const v of new Set(fn(p))) m.set(v, (m.get(v) || 0) + 1);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  };
  const f = {};
  if (scope !== "category") {
    const cats = count((p) => [p.category, ...(p.alsoIn || [])]).filter(([id]) => getCategory(id) && !getCategory(id).virtual);
    if (cats.length > 1) f.cat = cats.map(([id, n]) => ({ value: id, label: getCategory(id).navLabel, n })).sort((a, b) => getCategory(a.value).order - getCategory(b.value).order);
  }
  const tipos = count((p) => (p.type ? [p.type] : []));
  if (tipos.length > 1) f.tipo = tipos.map(([v, n]) => ({ value: v, label: v, n }));
  const hex = new Map();
  const cores = count((p) => colorsOf(p).map((c) => (hex.set(c.label, c.hex), c.label)));
  if (cores.length > 1) f.cor = cores.map(([v, n]) => ({ value: v, label: v, n, hex: hex.get(v) }));
  const compat = count((p) => p.compatibility || []);
  if (compat.length > 1) f.compat = compat.map(([v, n]) => ({ value: v, label: v, n }));
  const disp = count((p) => [p.availability || "consulta"]);
  if (disp.length > 1) f.disp = disp.map(([v, n]) => ({ value: v, label: AVAIL[v] || v, n }));
  const pers = products.filter((p) => p.personalizable).length;
  if (pers > 0 && pers < products.length) f.pers = pers;
  const prices = products.map(effPrice).filter((x) => x !== null);
  if (prices.length > 1) f.price = { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  return f;
}

function applyFilters(products, s) {
  return products.filter((p) => {
    if (s.cat.length && ![p.category, ...(p.alsoIn || [])].some((c) => s.cat.includes(c))) return false;
    if (s.tipo.length && !s.tipo.includes(p.type)) return false;
    if (s.cor.length && !colorsOf(p).some((c) => s.cor.includes(c.label))) return false;
    if (s.compat.length && !(p.compatibility || []).some((c) => s.compat.includes(c))) return false;
    if (s.disp.length && !s.disp.includes(p.availability || "consulta")) return false;
    if (s.pers && !p.personalizable) return false;
    if (s.min !== null || s.max !== null) {
      const v = effPrice(p);
      if (v === null) return false;
      if (s.min !== null && v < s.min) return false;
      if (s.max !== null && v > s.max) return false;
    }
    return true;
  });
}

function sortProducts(list, ordem, baseOrder) {
  const out = [...list];
  const pos = new Map(baseOrder.map((p, i) => [p.id, i]));
  const byPrice = (dir) => (a, b) => {
    const pa = effPrice(a);
    const pb = effPrice(b);
    if (pa === null && pb === null) return pos.get(a.id) - pos.get(b.id);
    if (pa === null) return 1; // sem preço sempre no fim
    if (pb === null) return -1;
    return dir * (pa - pb);
  };
  if (ordem === "menor-preco") out.sort(byPrice(1));
  else if (ordem === "maior-preco") out.sort(byPrice(-1));
  else if (ordem === "az") out.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  else out.sort((a, b) => pos.get(a.id) - pos.get(b.id));
  return out;
}

function checkboxGroup(key, legend, items, s) {
  return `<fieldset class="facet"><legend>${legend}</legend>${items
    .map(
      (it) => `<label class="check${key === "cor" ? " check--swatch" : ""}">
  <input type="checkbox" name="${key}" value="${esc(it.value)}" ${s[key].includes(it.value) ? "checked" : ""}>
  ${key === "cor" ? `<span class="swatch-dot" style="--sw:${esc(it.hex || "#ccc")}"></span>` : `<span class="check__box"></span>`}
  <span class="check__label">${esc(it.label)}</span><span class="check__n">${it.n}</span>
</label>`
    )
    .join("")}</fieldset>`;
}

export function initListing(root) {
  const scope = root.dataset.scope; // "category" | "all" | "search"
  const catId = root.dataset.category;
  let state = readState();
  let visible = STORE_CONFIG.catalog.pageSize;

  const scopeProducts = () => {
    if (scope === "category") return productsInCategory(catId);
    if (scope === "search") return state.q ? searchProducts(state.q) : [];
    if (scope === "offers") return PRODUCTS.filter((p) => typeof p.promoPrice === "number" && typeof p.price === "number" && p.promoPrice < p.price);
    // catálogo: ordem por categoria, destaques primeiro dentro de cada uma
    const order = new Map(CATEGORIES.map((c) => [c.id, c.order]));
    return [...PRODUCTS].sort((a, b) => (order.get(a.category) - order.get(b.category)) || (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  };

  root.innerHTML = `
<div class="listing__bar">
  <p class="listing__count" data-count aria-live="polite"></p>
  <div class="listing__tools">
    <button type="button" class="btn btn--ghost btn--sm listing__filter-btn" data-open-filters aria-controls="filters-${scope}" aria-expanded="false">${ICON.filter}<span>Filtrar</span><b data-active-n hidden></b></button>
    <label class="sort"><span>Ordenar</span><select data-sort></select></label>
  </div>
</div>
<div class="listing__chips" data-chips></div>
<div class="listing__layout">
  <aside class="filters" id="filters-${scope}" data-filters aria-label="Filtros">
    <div class="filters__head"><h2>Filtros</h2><button type="button" class="icon-btn" data-close-filters aria-label="Fechar filtros">${ICON.close}</button></div>
    <form data-filter-form></form>
    <div class="filters__foot"><button type="button" class="btn btn--ghost" data-clear>Limpar filtros</button><button type="button" class="btn btn--primary" data-close-filters data-apply-label>Ver resultados</button></div>
  </aside>
  <div class="listing__main">
    <div class="grid" data-grid></div>
    <div class="listing__more"><button type="button" class="btn btn--ghost" data-more hidden>Mostrar mais produtos</button></div>
  </div>
</div>`;

  const form = $("[data-filter-form]", root);
  const grid = $("[data-grid]", root);
  const filtersEl = $("[data-filters]", root);
  const sortSel = $("[data-sort]", root);
  const filterBtn = $("[data-open-filters]", root);

  function renderFilters(base) {
    const f = buildFacets(base, scope);
    let html = "";
    if (f.cat) html += checkboxGroup("cat", "Categoria", f.cat, state);
    if (f.pers) html += `<fieldset class="facet"><legend>Personalização</legend><label class="check"><input type="checkbox" name="pers" value="1" ${state.pers ? "checked" : ""}><span class="check__box"></span><span class="check__label">Só personalizáveis</span><span class="check__n">${f.pers}</span></label></fieldset>`;
    if (f.tipo) html += checkboxGroup("tipo", "Tipo", f.tipo, state);
    if (f.cor) html += checkboxGroup("cor", "Cor", f.cor, state);
    if (f.compat) html += checkboxGroup("compat", "Compatibilidade", f.compat, state);
    if (f.disp) html += checkboxGroup("disp", "Disponibilidade", f.disp, state);
    if (f.price)
      html += `<fieldset class="facet facet--price"><legend>Faixa de preço (R$)</legend>
<label><span>Mín.</span><input type="number" name="min" min="0" step="1" inputmode="numeric" placeholder="${f.price.min}" value="${state.min ?? ""}"></label>
<label><span>Máx.</span><input type="number" name="max" min="0" step="1" inputmode="numeric" placeholder="${f.price.max}" value="${state.max ?? ""}"></label></fieldset>`;
    form.innerHTML = html || `<p class="facet__none">Não há filtros para esta seleção.</p>`;
    root.classList.toggle("has-filters", Boolean(html));

    const sorts = [["relevancia", scope === "search" ? "Relevância" : "Destaques"], ["az", "Ordem alfabética"]];
    if (f.price) sorts.splice(1, 0, ["menor-preco", "Menor preço"], ["maior-preco", "Maior preço"]);
    if (!sorts.some(([v]) => v === state.ordem)) state.ordem = "relevancia";
    sortSel.innerHTML = sorts.map(([v, l]) => `<option value="${v}" ${v === state.ordem ? "selected" : ""}>${l}</option>`).join("");
  }

  function chipsHTML() {
    const chips = [];
    const add = (key, value, label) => chips.push(`<button type="button" class="chip" data-chip="${key}" data-value="${esc(value)}">${esc(label)}${ICON.close}</button>`);
    state.cat.forEach((v) => add("cat", v, getCategory(v)?.navLabel || v));
    state.tipo.forEach((v) => add("tipo", v, v));
    state.cor.forEach((v) => add("cor", v, `Cor: ${v}`));
    state.compat.forEach((v) => add("compat", v, v));
    state.disp.forEach((v) => add("disp", v, AVAIL[v] || v));
    if (state.pers) add("pers", "1", "Personalizáveis");
    if (state.min !== null) add("min", "", `A partir de R$ ${state.min}`);
    if (state.max !== null) add("max", "", `Até R$ ${state.max}`);
    return { html: chips.length ? chips.join("") + `<button type="button" class="chip chip--clear" data-clear>Limpar tudo</button>` : "", n: chips.length };
  }

  function render({ refilter = true } = {}) {
    const base = scopeProducts();
    if (refilter) renderFilters(base);
    const filtered = sortProducts(applyFilters(base, state), state.ordem, base);
    const { html, n } = chipsHTML();
    $("[data-chips]", root).innerHTML = html;
    const badge = $("[data-active-n]", root);
    badge.textContent = n;
    badge.hidden = n === 0;
    $("[data-apply-label]", root).textContent = `Ver ${pluralize(filtered.length, "resultado", "resultados")}`;

    const countEl = $("[data-count]", root);
    if (scope === "search" && !state.q) {
      countEl.textContent = "Digite o que você procura.";
    } else {
      countEl.textContent = pluralize(filtered.length, "produto", "produtos") + (scope === "search" ? ` para “${state.q}”` : "");
    }

    if (!filtered.length) {
      grid.innerHTML = emptyHTML(scope, state, n);
      $("[data-more]", root).hidden = true;
    } else {
      grid.innerHTML = filtered.slice(0, visible).map((p, i) => productCardHTML(p, { eager: i < 4 })).join("");
      const more = $("[data-more]", root);
      more.hidden = filtered.length <= visible;
      more.textContent = `Mostrar mais produtos (${filtered.length - visible} restantes)`;
    }
    root.toggleAttribute("data-empty", !filtered.length);
    writeState(state);
  }

  function emptyHTML(scope, s, nFilters) {
    if (scope === "search" && !s.q) {
      return `<div class="empty empty--wide"><h3>O que você está procurando?</h3><p>Tente “caneca”, “garrafa”, “capa” ou “personalizado”.</p></div>`;
    }
    const msg = nFilters
      ? `<p>Nenhum produto combina com todos os filtros escolhidos. Tire algum filtro para ver mais opções.</p><button type="button" class="btn btn--ghost" data-clear>Limpar filtros</button>`
      : `<p>Não encontramos “${esc(s.q)}” no catálogo. A loja pode ter o que você procura: pergunte pelo WhatsApp.</p>
         <a class="btn btn--wa" target="_blank" rel="noopener" href="${whatsappUrl(`Olá, Fanny! Procurei por “${s.q}” no site e não encontrei. Vocês têm?`)}">${ICON.whatsapp}<span>Perguntar no WhatsApp</span></a>`;
    return `<div class="empty empty--wide"><h3>Nada por aqui</h3>${msg}</div>`;
  }

  form.addEventListener("change", (e) => {
    const t = e.target;
    if (t.type === "checkbox") {
      if (t.name === "pers") state.pers = t.checked;
      else state[t.name] = $$(`input[name="${t.name}"]:checked`, form).map((i) => i.value);
    }
    if (t.name === "min" || t.name === "max") {
      const v = t.value === "" ? null : Math.max(0, +t.value);
      state[t.name] = Number.isFinite(v) ? v : null;
    }
    visible = STORE_CONFIG.catalog.pageSize;
    render({ refilter: false });
  });
  form.addEventListener("input", debounce((e) => {
    if (e.target.name === "min" || e.target.name === "max") form.dispatchEvent(new Event("change", { bubbles: true }));
  }, 500));

  sortSel.addEventListener("change", () => {
    state.ordem = sortSel.value;
    render({ refilter: false });
  });

  root.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-chip]");
    if (chip) {
      const { chip: key, value } = chip.dataset;
      if (key === "pers") state.pers = false;
      else if (key === "min" || key === "max") state[key] = null;
      else state[key] = state[key].filter((v) => v !== value);
      render();
      return;
    }
    if (e.target.closest("[data-clear]")) {
      state = { ...readState(), cat: [], tipo: [], cor: [], compat: [], disp: [], pers: false, min: null, max: null, q: state.q, ordem: state.ordem };
      render();
      return;
    }
    if (e.target.closest("[data-more]")) {
      visible += STORE_CONFIG.catalog.pageSize;
      render({ refilter: false });
      grid.children[visible - STORE_CONFIG.catalog.pageSize]?.querySelector("a:not([tabindex])")?.focus();
    }
    if (e.target.closest("[data-open-filters]")) {
      filtersEl.classList.add("is-open");
      filterBtn.setAttribute("aria-expanded", "true");
      document.documentElement.classList.add("is-locked");
      filtersEl.querySelector("input, button")?.focus();
    }
    if (e.target.closest("[data-close-filters]")) {
      filtersEl.classList.remove("is-open");
      filterBtn.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("is-locked");
      filterBtn.focus();
    }
  });
  filtersEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && filtersEl.classList.contains("is-open")) $("[data-close-filters]", filtersEl).click();
  });

  // Busca da própria página de resultados
  const pageSearch = $("[data-page-search]");
  if (scope === "search" && pageSearch) {
    const input = pageSearch.querySelector("input");
    input.value = state.q;
    const run = () => {
      state.q = input.value.trim();
      visible = STORE_CONFIG.catalog.pageSize;
      render();
      document.title = state.q ? `Busca: ${state.q} | ${STORE_CONFIG.name}` : `Buscar produtos | ${STORE_CONFIG.name}`;
    };
    input.addEventListener("input", debounce(run, 180));
    pageSearch.addEventListener("submit", (e) => {
      e.preventDefault();
      run();
    });
    pageSearch.querySelector("[data-clear-search]")?.addEventListener("click", () => {
      input.value = "";
      run();
      input.focus();
    });
    if (state.q) document.title = `Busca: ${state.q} | ${STORE_CONFIG.name}`;
  }

  render();
}

/** Grade simples (home, relacionados). */
export function renderGrid(el, products, opts = {}) {
  el.innerHTML = products.map((p, i) => productCardHTML(p, { eager: opts.eager && i < 4 })).join("");
}

