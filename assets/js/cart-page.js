/**
 * PÁGINA DO CARRINHO (carrinho/)
 * Revisão dos itens, dados opcionais e envio do pedido ao WhatsApp.
 * Abrir o WhatsApp NÃO conclui a compra: o carrinho é mantido e a página
 * explica que a pessoa ainda precisa enviar a mensagem na conversa.
 */
import { STORE_CONFIG } from "./config.js";
import { cart } from "./cart.js";
import { buildOrderMessage, orderWhatsappUrl } from "./whatsapp.js";
import { cartItemsHTML, totalsHTML, emptyCartHTML, bindCartList, toast } from "./ui.js";
import { ICON } from "./icons.js";
import { $, esc, pluralize, debounce } from "./utils.js";

export function initCartPage(root) {
  const c = cart.customer;
  root.innerHTML = `
<div class="cartpage" data-cartpage>
  <section class="cartpage__items" aria-labelledby="itens-title">
    <div class="cartpage__head">
      <h2 id="itens-title" class="sr-only">Itens</h2>
      <p class="cartpage__count" data-count></p>
      <div class="confirm" data-confirm>
        <button type="button" class="link-btn link-btn--danger" data-ask-clear>${ICON.trash}<span>Limpar carrinho</span></button>
        <span class="confirm__ask" hidden>Remover todos os itens?
          <button type="button" class="link-btn link-btn--danger" data-do-clear>Sim, limpar</button>
          <button type="button" class="link-btn" data-cancel-clear>Cancelar</button></span>
      </div>
    </div>
    <p class="notice" data-missing hidden></p>
    <ul class="lines lines--page" data-lines></ul>
    <div data-empty></div>
  </section>

  <aside class="cartpage__summary" id="pedido" aria-labelledby="resumo-title" data-summary>
    <h2 id="resumo-title">Resumo do pedido</h2>
    <div class="totals" data-totals></div>
    <form class="checkout" data-checkout novalidate>
      <p class="checkout__intro">Estes dados são opcionais e vão junto na mensagem.</p>
      <div class="field">
        <label class="field__label" for="c-name">Seu nome <span class="opt-tag">opcional</span></label>
        <input id="c-name" name="name" type="text" autocomplete="given-name" maxlength="60" value="${esc(c.name)}">
      </div>
      <fieldset class="field">
        <legend class="field__label">Como prefere ser atendido? <span class="opt-tag">opcional</span></legend>
        <div class="pills">${STORE_CONFIG.contactPreferences
          .map((p) => `<label class="pill"><input type="radio" name="contact" value="${esc(p)}" ${c.contact === p ? "checked" : ""}><span>${esc(p)}</span></label>`)
          .join("")}</div>
      </fieldset>
      <div class="field">
        <label class="field__label" for="c-notes">Observações gerais <span class="opt-tag">opcional</span></label>
        <textarea id="c-notes" name="notes" rows="3" maxlength="500" placeholder="Ex.: é para presente, prefiro retirar na loja">${esc(c.notes)}</textarea>
      </div>
      <details class="preview">
        <summary>Ver a mensagem que será enviada</summary>
        <pre data-preview></pre>
        <button type="button" class="link-btn" data-copy>Copiar mensagem</button>
      </details>
      <button type="submit" class="btn btn--wa btn--lg btn--block" data-send>${ICON.whatsapp}<span>Enviar pedido pelo WhatsApp</span></button>
      <p class="checkout__fine">Abre uma conversa com a Fanny no número ${esc(STORE_CONFIG.whatsappDisplay)}, com o pedido já escrito. Nada é cobrado pelo site.</p>
    </form>
    <div class="sent" data-sent hidden tabindex="-1">
      <h3>${ICON.check}Pedido preparado no WhatsApp</h3>
      <p>Para concluir, confira a conversa que abriu e toque em <strong>enviar</strong>. O pedido só está feito quando a Fanny responder confirmando disponibilidade e valores.</p>
      <p>Seu carrinho continua salvo aqui, caso precise ajustar algo.</p>
      <div class="btn-row">
        <a class="btn btn--ghost btn--sm" data-reopen target="_blank" rel="noopener" href="#">Abrir o WhatsApp de novo</a>
      </div>
    </div>
  </aside>
</div>`;

  const lines = $("[data-lines]", root);
  const form = $("[data-checkout]", root);
  const sent = $("[data-sent]", root);
  bindCartList(lines);

  const customer = () => ({
    name: form.elements.name.value,
    contact: form.querySelector('input[name="contact"]:checked')?.value || "",
    notes: form.elements.notes.value,
  });

  function render() {
    const summary = cart.summary();
    lines.innerHTML = cartItemsHTML(summary);
    $("[data-empty]", root).innerHTML = summary.isEmpty ? emptyCartHTML() : "";
    $("[data-summary]", root).hidden = summary.isEmpty;
    $("[data-confirm]", root).hidden = summary.isEmpty;
    root.querySelector("[data-cartpage]").classList.toggle("is-empty", summary.isEmpty);
    $("[data-count]", root).textContent = summary.isEmpty
      ? ""
      : `${pluralize(summary.items.length, "produto", "produtos")}, ${pluralize(summary.units, "unidade", "unidades")}`;
    $("[data-totals]", root).innerHTML = summary.isEmpty ? "" : totalsHTML(summary);
    const missing = $("[data-missing]", root);
    if (summary.missing.length) {
      missing.hidden = false;
      missing.innerHTML = `${ICON.info}<span>${pluralize(summary.missing.length, "item saiu", "itens saíram")} do catálogo e ${summary.missing.length === 1 ? "foi removido" : "foram removidos"} do carrinho.</span>`;
      cart.prune();
    }
    updatePreview();
  }

  function updatePreview() {
    const summary = cart.summary();
    if (summary.isEmpty) return;
    $("[data-preview]", root).textContent = buildOrderMessage(summary, customer());
  }

  form.addEventListener(
    "input",
    debounce(() => {
      cart.setCustomer(customer());
      updatePreview();
    }, 150)
  );
  form.addEventListener("change", () => {
    cart.setCustomer(customer());
    updatePreview();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const summary = cart.summary();
    if (summary.isEmpty) return;
    cart.setCustomer(customer());
    const link = orderWhatsappUrl(summary, customer());
    const win = window.open(link, "_blank");
    if (win) {
      try {
        win.opener = null;
      } catch {
        /* ignora */
      }
    }
    $("[data-reopen]", root).href = link;
    sent.hidden = false;
    sent.focus();
    if (!win) toast("O navegador bloqueou a nova aba. Use o botão “Abrir o WhatsApp de novo”.", { tone: "info" });
  });

  $("[data-copy]", root).addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("[data-preview]", root).textContent);
      toast("Mensagem copiada.");
    } catch {
      toast("Não foi possível copiar. Selecione o texto e copie manualmente.", { tone: "info" });
    }
  });

  const ask = $(".confirm__ask", root);
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-ask-clear]")) {
      ask.hidden = false;
      ask.querySelector("[data-cancel-clear]").focus();
    }
    if (e.target.closest("[data-cancel-clear]")) ask.hidden = true;
    if (e.target.closest("[data-do-clear]")) {
      cart.clear();
      ask.hidden = true;
      sent.hidden = true;
      toast("Carrinho limpo.", { tone: "info" });
    }
  });

  cart.subscribe(() => {
    render();
    // qualquer alteração depois de preparar o pedido exige reenviar
    if (!sent.hidden) sent.hidden = true;
  });
  render();
}
