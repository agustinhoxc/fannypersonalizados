/**
 * Utilitários compartilhados.
 * A raiz do site é calculada a partir deste arquivo, então os links funcionam
 * tanto em usuario.github.io/fanny-acessorios/ quanto em domínio próprio.
 */
import { STORE_CONFIG } from "./config.js";

export const ROOT = new URL("../../", import.meta.url);

/** URL absoluta para uma página ou arquivo a partir da raiz do site. */
export function url(path = "") {
  return new URL(path.replace(/^\//, ""), ROOT).href;
}

export const productUrl = (id) => url(`produto/?id=${encodeURIComponent(id)}`);
export const categoryUrl = (id) => url(`categorias/${id}/`);

const money = new Intl.NumberFormat(STORE_CONFIG.locale, {
  style: "currency",
  currency: STORE_CONFIG.currency,
});

/** Formata valores em reais. Retorna string com espaço comum (seguro para WhatsApp). */
export function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return money.format(value).replace(/ /g, " ");
}

/** Arredonda para centavos evitando erros de ponto flutuante. */
export function roundMoney(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Remove acentos e caixa para comparação de busca. */
export function normalize(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function pluralize(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

export const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
