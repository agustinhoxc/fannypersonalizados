/**
 * Ponto de entrada. Cada página informa seu tipo em <body data-page="...">.
 */
import { initChrome } from "./ui.js";

const page = document.body.dataset.page;

initChrome();

const routes = {
  home: () => import("./home.js").then((m) => m.initHome()),
  category: () => import("./catalog.js").then((m) => m.initListing(document.querySelector("[data-listing]"))),
  catalog: () => import("./catalog.js").then((m) => m.initListing(document.querySelector("[data-listing]"))),
  search: () => import("./catalog.js").then((m) => m.initListing(document.querySelector("[data-listing]"))),
  product: () => import("./product.js").then((m) => m.initProduct(document.querySelector("[data-product-root]"))),
  cart: () => import("./cart-page.js").then((m) => m.initCartPage(document.querySelector("[data-cart-root]"))),
};

routes[page]?.().catch((err) => {
  console.error(err);
  const el = document.querySelector("[data-js-error]");
  if (el) el.hidden = false;
});
