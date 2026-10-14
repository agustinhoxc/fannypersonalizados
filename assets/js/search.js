/**
 * Busca simples no navegador: nome, categoria, tipo, descrição, marca,
 * compatibilidade e palavras-chave. Sem acentos e sem diferenciar maiúsculas.
 * Todas as palavras digitadas precisam aparecer em algum campo.
 */
import { PRODUCTS, getCategory } from "./products.js";
import { normalize } from "./utils.js";

const FIELDS = [
  ["name", 6],
  ["keywords", 4],
  ["type", 3],
  ["category", 2],
  ["brand", 3],
  ["compatibility", 3],
  ["options", 1],
  ["description", 1],
];

const indexCache = new Map();

function indexOf(p) {
  if (indexCache.has(p.id)) return indexCache.get(p.id);
  const cats = [p.category, ...(p.alsoIn || [])].map((id) => getCategory(id)).filter(Boolean);
  const idx = {
    name: normalize(p.name),
    keywords: normalize((p.keywords || []).join(" ")),
    type: normalize(p.type),
    category: normalize(cats.map((c) => `${c.name} ${c.navLabel}`).join(" ")),
    brand: normalize(p.brand),
    compatibility: normalize((p.compatibility || []).join(" ")),
    options: normalize((p.options || []).flatMap((o) => (o.values || []).map((v) => v.label)).join(" ")),
    description: normalize(p.description),
  };
  indexCache.set(p.id, idx);
  return idx;
}

export function searchProducts(query, products = PRODUCTS) {
  const terms = normalize(query).split(/\s+/).filter((t) => t.length > 0);
  if (!terms.length) return [];
  const results = [];
  for (const p of products) {
    const idx = indexOf(p);
    let score = 0;
    let all = true;
    for (const t of terms) {
      let hit = 0;
      for (const [field, weight] of FIELDS) {
        const text = idx[field];
        if (!text) continue;
        if (text.includes(t)) {
          // palavra inteira vale mais que pedaço de palavra
          const whole = new RegExp(`(^|\\s|-)${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text);
          hit = Math.max(hit, weight * (whole ? 1.5 : 1));
        }
      }
      if (!hit) {
        all = false;
        break;
      }
      score += hit;
    }
    if (all) results.push({ product: p, score: score + (p.featured ? 0.5 : 0) });
  }
  return results.sort((a, b) => b.score - a.score).map((r) => r.product);
}
