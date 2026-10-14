/**
 * CONFIGURAÇÃO CENTRAL DA LOJA
 * ------------------------------------------------------------
 * Todas as informações de contato e comportamento do site ficam aqui.
 * Altere este arquivo para trocar WhatsApp, Instagram, textos padrão etc.
 * Nada aqui depende de servidor: o site é 100% estático.
 */
export const STORE_CONFIG = {
  name: "Fanny Acessórios",
  shortName: "Fanny",
  tagline: "Acessórios personalizados",

  // WhatsApp comercial no formato internacional (55 + DDD + número), só dígitos.
  whatsapp: "5531992919133",
  whatsappDisplay: "(31) 99291-9133",

  instagram: {
    handle: "@fanny_oiapoque",
    url: "https://www.instagram.com/fanny_oiapoque/",
  },

  // Endereço público do site (usado em sitemap, robots e Open Graph).
  // Troque pelo endereço real do GitHub Pages ou domínio próprio, sem barra final.
  siteUrl: "https://SEU-USUARIO.github.io/fanny-acessorios",

  currency: "BRL",
  locale: "pt-BR",

  cartStorageKey: "fanny_acessorios_cart",
  cartSchemaVersion: 1,
  maxQuantityPerItem: 99,

  /**
   * "demonstracao": mostra o aviso de catálogo em montagem e o selo "Exemplo"
   *                 nos produtos marcados com demo: true.
   * "oficial":      esconde o aviso (use quando o catálogo real estiver cadastrado).
   */
  catalogStatus: "demonstracao",

  // Faixa de aviso no topo. Use enabled: false para desligar.
  announcement: {
    enabled: true,
    text: "Monte o carrinho e envie o pedido pelo WhatsApp.",
    linkLabel: "Como funciona",
    linkHref: "carrinho/#como-funciona",
  },

  // Personagem da loja. Para trocar, substitua os arquivos ou altere os caminhos.
  mascot: {
    enabled: true,
    src: "assets/img/brand/fanny-char.webp",
    fallback: "assets/img/brand/fanny-char.png",
    avatar: "assets/img/brand/fanny-avatar.webp",
    avatarFallback: "assets/img/brand/fanny-avatar.png",
    alt: "Personagem da Fanny Acessórios acenando",
    width: 900,
    height: 1312,
  },

  // Vídeo do hero (arquivos em assets/video/). O original fica preservado.
  hero: {
    desktop: [
      { src: "assets/video/fanny-hero-clean.webm", type: "video/webm" },
      { src: "assets/video/fanny-hero-clean-1080.mp4", type: "video/mp4" },
    ],
    mobile: [
      { src: "assets/video/fanny-hero-clean-720.webm", type: "video/webm" },
      { src: "assets/video/fanny-hero-clean-720.mp4", type: "video/mp4" },
    ],
    poster: "assets/img/hero/hero-poster.webp",
    posterMobile: "assets/img/hero/hero-poster-1280.webp",
    mobileBreakpoint: 768,
  },

  whatsappMessage: {
    greeting: "Olá, Fanny! Gostaria de fazer o seguinte pedido:",
    title: "PEDIDO — FANNY ACESSÓRIOS",
    closing: "Poderiam confirmar a disponibilidade e as condições para finalizar o pedido?",
    pendingNote: "Itens com valor a confirmar dependem de avaliação da loja.",
    deliveryNote: "Entrega e forma de pagamento: a combinar no atendimento.",
    generalContact: "Olá, Fanny! Vim pelo site e gostaria de mais informações.",
  },

  contactPreferences: ["Mensagem no WhatsApp", "Ligação", "Tanto faz"],

  // Dados comerciais ainda não confirmados ficam null e NÃO aparecem no site.
  business: {
    address: null,        // ex.: "Rua Exemplo, 123 — Bairro, Cidade/UF"
    hours: null,          // ex.: "Seg. a sáb., 9h às 18h"
    exchangePolicy: null, // texto da política de trocas
    deliveryInfo: null,   // texto sobre entregas/retirada
  },

  // Frete não é calculado pelo site. Só configure se a loja fornecer regras reais.
  shipping: null,

  catalog: {
    pageSize: 12,
    priceOnRequestLabel: "Preço sob consulta",
  },
};

/** Monta o link do WhatsApp sempre a partir da configuração central. */
export function whatsappUrl(text = "") {
  const base = `https://wa.me/${STORE_CONFIG.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
