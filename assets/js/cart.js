/**
 * CARRINHO
 * ------------------------------------------------------------
 * Funções puras (validação, preço, resumo) + um pequeno store reativo
 * persistido no localStorage. O carrinho guarda apenas o id do produto,
 * as escolhas e a quantidade; nome e preço são sempre lidos do catálogo
 * atual, então uma mudança de preço em products.js reflete no carrinho.
 */
import { STORE_CONFIG } from "./config.js";
import { readJSON, writeJSON } from "./storage.js";
import { getProduct } from "./products.js";
import { roundMoney } from "./utils.js";

const MAX_QTY = STORE_CONFIG.maxQuantityPerItem;

/* ================= Funções puras ================= */

export function sanitizeQty(value) {
  const n = typeof value === "number" ? value : parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), MAX_QTY);
}

/** Uma opção está visível se a condição showIf for atendida e a opção-mãe também estiver visível. */
export function isOptionVisible(product, option, selections, depth = 0) {
  if (!option.showIf || depth > 5) return true;
  const parent = product.options.find((o) => o.id === option.showIf.option);
  if (!parent) return true;
  if (!isOptionVisible(product, parent, selections, depth + 1)) return false;
  return option.showIf.in.includes(selections[parent.id]);
}

export function visibleOptions(product, selections = {}) {
  return (product.options || []).filter((o) => isOptionVisible(product, o, selections));
}

/** Mantém só as opções visíveis e preenchidas, com textos aparados. */
export function cleanSelections(product, selections = {}) {
  const out = {};
  for (const opt of visibleOptions(product, selections)) {
    let v = selections[opt.id];
    if (typeof v === "string") v = v.trim();
    if (v === undefined || v === null || v === "") continue;
    if (opt.maxLength && typeof v === "string") v = v.slice(0, opt.maxLength);
    out[opt.id] = v;
  }
  return out;
}

export function validateSelections(product, selections = {}) {
  const errors = {};
  for (const opt of visibleOptions(product, selections)) {
    const v = typeof selections[opt.id] === "string" ? selections[opt.id].trim() : selections[opt.id];
    if (opt.required && (v === undefined || v === null || v === "")) {
      errors[opt.id] =
        opt.type === "color" ? `Escolha uma cor.` :
        opt.type === "choice" || opt.type === "select" ? `Escolha uma opção em “${opt.label}”.` :
        `Preencha “${opt.label}”.`;
      continue;
    }
    if (v && (opt.type === "color" || opt.type === "choice")) {
      if (!opt.values.some((x) => x.value === v)) errors[opt.id] = `Opção inválida em “${opt.label}”.`;
    }
    if (v && opt.type === "select" && !opt.allowOther && !opt.values.some((x) => x.value === v)) {
      errors[opt.id] = `Opção inválida em “${opt.label}”.`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Lista legível das escolhas, na ordem das opções. */
export function describeSelections(product, selections = {}) {
  return visibleOptions(product, selections)
    .filter((o) => selections[o.id] !== undefined && selections[o.id] !== "")
    .map((o) => {
      const v = selections[o.id];
      const match = (o.values || []).find((x) => x.value === v);
      return { id: o.id, label: o.label, value: match ? match.label.replace(/↔/g, "para") : String(v) };
    });
}

/** Preço unitário efetivo. null = valor a confirmar. */
export function unitPrice(product, selections = {}) {
  const base = typeof product.promoPrice === "number" ? product.promoPrice : product.price;
  if (typeof base !== "number") return { unit: null, pending: true, reason: "Preço sob consulta" };
  let unit = base;
  for (const opt of visibleOptions(product, selections)) {
    const v = selections[opt.id];
    const match = (opt.values || []).find((x) => x.value === v);
    if (!match) continue;
    if (match.quote) return { unit: null, pending: true, reason: `${opt.label}: ${match.label} sujeito a orçamento` };
    if (typeof match.price === "number") unit += match.price;
  }
  return { unit: roundMoney(unit), pending: false, reason: "" };
}

export function lineKey(productId, selections = {}) {
  const ordered = Object.keys(selections).sort().map((k) => [k, selections[k]]);
  return `${productId}::${JSON.stringify(ordered)}`;
}

/** Resumo completo do carrinho para interface e mensagem. */
export function summarize(lines, lookup = getProduct) {
  const items = [];
  const missing = [];
  let known = 0;
  let units = 0;
  for (const line of lines) {
    const product = lookup(line.id);
    if (!product) {
      missing.push(line);
      continue;
    }
    const qty = sanitizeQty(line.qty);
    const { unit, pending, reason } = unitPrice(product, line.options);
    const subtotal = unit === null ? null : roundMoney(unit * qty);
    if (subtotal !== null) known = roundMoney(known + subtotal);
    units += qty;
    items.push({
      key: line.key,
      product,
      qty,
      options: line.options,
      details: describeSelections(product, line.options),
      unit,
      subtotal,
      pending,
      pendingReason: reason,
    });
  }
  const pendingItems = items.filter((i) => i.pending);
  return {
    items,
    missing,
    units,
    knownSubtotal: known,
    pendingCount: pendingItems.length,
    pricedCount: items.length - pendingItems.length,
    allPriced: items.length > 0 && pendingItems.length === 0,
    isEmpty: items.length === 0,
  };
}

/* ================= Store persistido ================= */

const KEY = STORE_CONFIG.cartStorageKey;

function emptyState() {
  return { v: STORE_CONFIG.cartSchemaVersion, lines: [], customer: { name: "", contact: "", notes: "" } };
}

function load() {
  const data = readJSON(KEY);
  if (!data || data.v !== STORE_CONFIG.cartSchemaVersion || !Array.isArray(data.lines)) return emptyState();
  const lines = data.lines
    .filter((l) => l && typeof l.id === "string" && typeof l.options === "object")
    .map((l) => ({ id: l.id, options: l.options || {}, qty: sanitizeQty(l.qty), key: lineKey(l.id, l.options || {}), addedAt: l.addedAt || Date.now() }));
  return { ...emptyState(), lines, customer: { ...emptyState().customer, ...(data.customer || {}) } };
}

let state = load();
const listeners = new Set();

function commit() {
  writeJSON(KEY, state);
  listeners.forEach((fn) => fn(state));
}

export const cart = {
  get lines() {
    return state.lines;
  },
  get customer() {
    return state.customer;
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  summary() {
    return summarize(state.lines);
  },
  count() {
    return state.lines.reduce((n, l) => n + l.qty, 0);
  },
  find(key) {
    return state.lines.find((l) => l.key === key) || null;
  },

  /** Adiciona um item. Configurações idênticas somam quantidade; diferentes viram linhas separadas. */
  add(productId, selections, qty = 1) {
    const product = getProduct(productId);
    if (!product) return { ok: false, error: "Produto não encontrado." };
    if (product.availability === "indisponivel") return { ok: false, error: "Este produto está indisponível no momento." };
    const { valid, errors } = validateSelections(product, selections);
    if (!valid) return { ok: false, errors };
    const options = cleanSelections(product, selections);
    const key = lineKey(productId, options);
    const existing = state.lines.find((l) => l.key === key);
    if (existing) existing.qty = sanitizeQty(existing.qty + sanitizeQty(qty));
    else state.lines.push({ id: productId, options, qty: sanitizeQty(qty), key, addedAt: Date.now() });
    commit();
    return { ok: true, key, merged: Boolean(existing) };
  },

  /** Substitui as opções de uma linha existente (edição a partir do carrinho). */
  replace(oldKey, selections, qty) {
    const idx = state.lines.findIndex((l) => l.key === oldKey);
    if (idx === -1) return { ok: false, error: "Este item não está mais no carrinho." };
    const line = state.lines[idx];
    const product = getProduct(line.id);
    const { valid, errors } = validateSelections(product, selections);
    if (!valid) return { ok: false, errors };
    const options = cleanSelections(product, selections);
    const key = lineKey(line.id, options);
    const q = sanitizeQty(qty ?? line.qty);
    const dup = state.lines.findIndex((l, i) => l.key === key && i !== idx);
    if (dup !== -1) {
      state.lines[dup].qty = sanitizeQty(state.lines[dup].qty + q);
      state.lines.splice(idx, 1);
    } else {
      state.lines[idx] = { ...line, options, key, qty: q };
    }
    commit();
    return { ok: true, key };
  },

  setQty(key, qty) {
    const line = state.lines.find((l) => l.key === key);
    if (!line) return;
    line.qty = sanitizeQty(qty);
    commit();
  },

  increment(key, delta) {
    const line = state.lines.find((l) => l.key === key);
    if (!line) return;
    const next = line.qty + delta;
    if (next < 1) return; // diminuir abaixo de 1 não remove; use o botão Remover
    line.qty = sanitizeQty(next);
    commit();
  },

  remove(key) {
    const before = state.lines.length;
    state.lines = state.lines.filter((l) => l.key !== key);
    if (state.lines.length !== before) commit();
  },

  /** Remove linhas de produtos que saíram do catálogo. */
  prune() {
    const before = state.lines.length;
    state.lines = state.lines.filter((l) => getProduct(l.id));
    if (state.lines.length !== before) commit();
  },

  clear() {
    state.lines = [];
    commit();
  },

  setCustomer(patch) {
    state.customer = { ...state.customer, ...patch };
    writeJSON(KEY, state); // sem notificar: evita re-render enquanto a pessoa digita
  },
};

// Mantém abas diferentes sincronizadas.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    state = load();
    listeners.forEach((fn) => fn(state));
  });
}
