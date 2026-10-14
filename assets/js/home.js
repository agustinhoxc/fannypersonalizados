/**
 * HOME: vídeo do hero, vitrines de produtos e seções condicionais.
 * Seções sem conteúdo cadastrado ficam ocultas.
 */
import { STORE_CONFIG } from "./config.js";
import { PRODUCTS, productsInCategory, hasOffers } from "./products.js";
import { productCardHTML } from "./ui.js";
import { ICON } from "./icons.js";
import { $, $$, url, prefersReducedMotion } from "./utils.js";

function initHeroVideo() {
  const video = $("[data-hero-video]");
  const toggle = $("[data-hero-toggle]");
  const media = $(".hero__media");
  if (!video || !media) return;
  const cfg = STORE_CONFIG.hero;
  const saveData = navigator.connection?.saveData === true;
  let loaded = false;

  const setToggle = (playing) => {
    if (!toggle) return;
    toggle.innerHTML = playing ? ICON.pause : ICON.play;
    toggle.setAttribute("aria-label", playing ? "Pausar vídeo da loja" : "Reproduzir vídeo da loja");
    toggle.setAttribute("aria-pressed", String(!playing));
  };

  const load = () => {
    if (loaded) return;
    loaded = true;
    const mobile = window.innerWidth < cfg.mobileBreakpoint;
    for (const s of mobile ? cfg.mobile : cfg.desktop) {
      const el = document.createElement("source");
      el.src = url(s.src);
      el.type = s.type;
      video.appendChild(el);
    }
    video.load();
  };

  const play = () => {
    load();
    const p = video.play();
    if (p?.catch) p.catch(() => setToggle(false));
  };

  video.addEventListener("playing", () => {
    media.classList.add("is-playing");
    setToggle(true);
  });
  video.addEventListener("pause", () => setToggle(false));
  video.addEventListener("error", () => media.classList.remove("is-playing"), true);

  toggle?.addEventListener("click", () => {
    if (video.paused) {
      media.dataset.userPaused = "";
      play();
    } else {
      media.dataset.userPaused = "1";
      video.pause();
    }
  });

  // Movimento reduzido ou economia de dados: fica a imagem de capa; o vídeo só toca se a pessoa pedir.
  if (prefersReducedMotion() || saveData) {
    setToggle(false);
    return;
  }

  const start = () => ("requestIdleCallback" in window ? requestIdleCallback(play, { timeout: 1500 }) : setTimeout(play, 300));
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });

  // pausa quando sai da tela para poupar bateria
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (!loaded || media.dataset.userPaused === "1") return;
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.15 }).observe(media);
  }
}

function fillRow(selector, products, max = 8) {
  const section = $(selector);
  if (!section) return;
  if (!products.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  $("[data-grid]", section).innerHTML = products.slice(0, max).map((p) => productCardHTML(p)).join("");
}

export function initHome() {
  initHeroVideo();
  fillRow("[data-home-featured]", PRODUCTS.filter((p) => p.featured), 8);
  fillRow("[data-home-new]", PRODUCTS.filter((p) => p.isNew));
  fillRow("[data-home-offers]", hasOffers() ? PRODUCTS.filter((p) => typeof p.promoPrice === "number" && !p.featured) : [], 4);
  fillRow("[data-home-kits]", productsInCategory("kits"), 4);
}
