/**
 * Monta as mensagens enviadas ao WhatsApp da loja.
 * O número vem sempre de config.js (whatsappUrl).
 * Nada é enviado automaticamente: o site só abre a conversa com o texto pronto.
 */
import { STORE_CONFIG, whatsappUrl } from "./config.js";
import { formatPrice } from "./utils.js";
import { describeSelections, unitPrice, sanitizeQty } from "./cart.js";

const M = STORE_CONFIG.whatsappMessage;

/** Mensagem completa do pedido a partir de summarize(). */
export function buildOrderMessage(summary, customer = {}) {
  const out = [];
  out.push(M.greeting, "", `*${M.title}*`, "");

  const name = (customer.name || "").trim();
  if (name) out.push(`*Cliente:* ${name}`);
  const contact = (customer.contact || "").trim();
  if (contact) out.push(`*Preferência de contato:* ${contact}`);
  const receive = (customer.receive || "").trim();
  if (receive) out.push(`*Recebimento:* ${receive}`);
  const payment = (customer.payment || "").trim();
  if (payment) out.push(`*Pagamento:* ${payment}`);
  if (name || contact || receive || payment) out.push("");

  summary.items.forEach((item, i) => {
    out.push(`*${i + 1}. ${item.product.name}*`);
    for (const d of item.details) out.push(`- ${d.label}: ${d.value}`);
    out.push(`- Quantidade: ${item.qty}`);
    if (item.pending && item.partialUnit !== null) {
      out.push(`- Valor unitário: ${formatPrice(item.partialUnit)} + ${item.pendingWhat} (a confirmar)`);
    } else if (item.pending) {
      out.push(`- Valor: a confirmar (${item.pendingReason.toLowerCase()})`);
    } else {
      out.push(`- Valor unitário: ${formatPrice(item.unit)}`);
      out.push(`- Subtotal: ${formatPrice(item.subtotal)}`);
    }
    out.push("");
  });

  out.push(`*Total de unidades:* ${summary.units}`);
  if (summary.allPriced) {
    out.push(`*Total dos produtos:* ${formatPrice(summary.knownSubtotal)}`);
  } else if (summary.pricedCount > 0) {
    const pendingIdx = summary.items.map((it, i) => (it.pending ? i + 1 : null)).filter(Boolean);
    out.push(`*Subtotal dos itens com preço definido:* ${formatPrice(summary.knownSubtotal)}`);
    out.push(`*Itens com valor a confirmar:* ${pendingIdx.join(", ")}`);
    out.push(M.pendingNote);
  } else {
    out.push("*Valores:* a confirmar pela loja.");
  }
  if ((customer.receive || "") !== "Retirar na loja") out.push(M.deliveryNote);

  const notes = (customer.notes || "").trim();
  if (notes) out.push("", `*Observações:* ${notes}`);

  out.push("", M.closing);
  return out.join("\n");
}

export function orderWhatsappUrl(summary, customer) {
  return whatsappUrl(buildOrderMessage(summary, customer));
}

/** Consulta rápida sobre um único produto (botão “Consultar pelo WhatsApp”). */
export function buildProductInquiry(product, selections = {}, qty = 1, pageUrl = "") {
  const lines = [`Olá, Fanny! Tenho interesse neste produto:`, "", `*${product.name}*`];
  for (const d of describeSelections(product, selections)) lines.push(`- ${d.label}: ${d.value}`);
  lines.push(`- Quantidade: ${sanitizeQty(qty)}`);
  const { unit } = unitPrice(product, selections);
  if (unit !== null) lines.push(`- Valor no site: ${formatPrice(unit)}`);
  if (pageUrl) lines.push("", pageUrl);
  lines.push("", "Poderiam me informar a disponibilidade e as condições?");
  return lines.join("\n");
}

export function generalWhatsappUrl() {
  return whatsappUrl(M.generalContact);
}
