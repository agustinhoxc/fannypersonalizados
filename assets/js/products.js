/**
 * CATÁLOGO DA FANNY ACESSÓRIOS
 * ------------------------------------------------------------
 * Fonte única de categorias e produtos. Todas as páginas leem daqui.
 *
 * Catálogo oficial cadastrado a partir da planilha enviada pela loja
 * (fanny-planilha-produtos.xlsx, outubro de 2026). price: null significa
 * "preço sob consulta". Para incluir produtos, siga o README.
 *
 * Campos do produto:
 *  id            identificador único e estável (também usado na URL)
 *  name          nome exibido
 *  category      id da categoria principal (ver CATEGORIES)
 *  alsoIn        outras categorias onde o produto também aparece (opcional)
 *  type          tipo/subcategoria (vira filtro "Tipo")
 *  description   texto curto
 *  details       lista de características CONFIRMADAS (deixe [] se não houver)
 *  price         número em reais (ex.: 49.9) ou null para "sob consulta"
 *  promoPrice    preço promocional real, ou null
 *  images        [{ src, alt, credit }]  credit: "loja" (foto real) | "ilustrativa"
 *  brand         marca do produto, se aplicável (null para genéricos)
 *  compatibility lista de compatibilidades CONFIRMADAS (ex.: ["iPhone 15"]) — vira filtro
 *  keywords      termos extras para a busca
 *  personalizable true se aceita personalização
 *  availability  "disponivel" | "consulta" | "indisponivel"
 *  featured      true para aparecer em "Produtos em destaque" na home
 *  isNew         true para aparecer em "Novidades"
 *  demo          true enquanto for um exemplo de desenvolvimento
 *  options       campos de escolha/personalização (ver tipos abaixo)
 *
 * Tipos de opção:
 *  "color"    amostras de cor   values: [{ value, label, hex }]
 *  "choice"   botões/pílulas    values: [{ value, label, price?, quote? }]
 *  "select"   lista suspensa    values: [...]  allowOther: "Rótulo do campo livre"
 *  "text"     texto curto       maxLength, placeholder
 *  "textarea" texto longo       maxLength, placeholder
 *  Comuns: id, label, required, help, showIf: { option: "id", in: ["valor"] }
 *  price em um valor = acréscimo em reais; quote: true = valor a confirmar.
 */

/* ---------- Categorias ---------- */
export const CATEGORIES = [
  {
    id: "copos",
    name: "Copos",
    navLabel: "Copos",
    title: "Copos",
    description:
      "Copos térmicos, com tampa e com canudo, lisos ou personalizados com nome, iniciais ou frase. Escolha a cor e conte como quer o seu.",
    image: "assets/img/categories/copos.webp",
    icon: "cup",
    order: 1,
  },
  {
    id: "canecas",
    name: "Canecas",
    navLabel: "Canecas",
    title: "Canecas",
    description:
      "Canecas lisas e personalizadas para o dia a dia ou para presentear. Envie a foto ou a arte pelo WhatsApp e a loja confirma o resultado.",
    image: "assets/img/categories/canecas.webp",
    icon: "mug",
    order: 2,
  },
  {
    id: "garrafas",
    name: "Garrafas",
    navLabel: "Garrafas",
    title: "Garrafas",
    description:
      "Garrafas coloridas, térmicas e prontas para personalizar. Escolha a cor e o modelo que acompanham a sua rotina.",
    image: "assets/img/categories/garrafas.webp",
    icon: "bottle",
    order: 3,
  },
  {
    id: "capas-personalizadas",
    name: "Capas Personalizadas",
    navLabel: "Capas Personalizadas",
    title: "Capas personalizadas para celular",
    description:
      "Capas com nome, iniciais, frase, foto ou ilustração. Informe o modelo exato do seu celular e a loja confirma a compatibilidade.",
    image: "assets/img/categories/capas-personalizadas.webp",
    icon: "phone",
    order: 4,
  },
];

/* ---------- Blocos de opções reutilizáveis ---------- */

/** Cor: a loja informou "consultar", então o cliente indica a preferência e a loja confirma. */
const colorWish = {
  id: "cor",
  label: "Cor desejada",
  type: "text",
  maxLength: 40,
  placeholder: "Ex.: preto, rosa, azul",
  help: "As cores dependem do estoque. A loja confirma pelo WhatsApp.",
};

/** Texto da personalização (nome, iniciais ou frase). */
const personalizationText = {
  id: "texto",
  label: "Nome, iniciais ou frase",
  summaryLabel: "Texto",
  type: "text",
  maxLength: 40,
  placeholder: "Como deve aparecer no produto",
  required: true,
  showIf: { option: "estilo", in: ["Nome", "Iniciais", "Frase"] },
};

const notes = {
  id: "observacoes",
  label: "Observações",
  type: "textarea",
  maxLength: 300,
  placeholder: "Algum detalhe que a loja precisa saber?",
};

/**
 * Personalização opcional com nome, iniciais ou frase.
 * addon: número (acréscimo em reais por unidade) ou "orcamento" (valor combinado pelo WhatsApp).
 */
function optionalPersonalization(addon) {
  const yes = addon === "orcamento"
    ? { value: "Sim", label: "Sim, personalizar", quote: true }
    : { value: "Sim", label: "Sim, personalizar", price: addon };
  return [
    {
      id: "personalizar",
      label: "Deseja personalizar?",
      summaryLabel: "Personalização",
      type: "choice",
      required: true,
      values: [{ value: "Não", label: "Não, quero liso", summary: "Não (liso)" }, { ...yes, summary: "Sim" }],
    },
    {
      id: "estilo",
      label: "Tipo de personalização",
      type: "choice",
      required: true,
      showIf: { option: "personalizar", in: ["Sim"] },
      values: [
        { value: "Nome", label: "Nome" },
        { value: "Iniciais", label: "Iniciais" },
        { value: "Frase", label: "Frase" },
      ],
    },
    personalizationText,
  ];
}

/** Opções padrão dos copos, canecas e garrafas. */
const drinkwareOptions = (addon) => [colorWish, ...optionalPersonalization(addon), notes];

const addonText = (addon) =>
  addon === "orcamento"
    ? "Personalização com nome, iniciais ou frase: valor combinado pelo WhatsApp"
    : `Personalização com nome, iniciais ou frase: + R$ ${addon.toFixed(2).replace(".", ",")} por unidade`;

/* ---------- Produtos ---------- */
export const PRODUCTS = [
  /* COPOS */
  {
    id: "copo-termico-lagoinha-360ml",
    name: "Copo Térmico Lagoinha com Tampa 360 ml",
    category: "copos",
    type: "Copos térmicos",
    description: "Copo térmico com tampa, de 360 ml. Leve liso ou personalize com nome, iniciais ou frase por mais R$ 5,99.",
    details: ["Capacidade: 360 ml", "Com tampa", addonText(5.99)],
    price: 25,
    promoPrice: 20,
    images: [{ src: "assets/img/products/copo-termico-lagoinha-360ml.webp", alt: "Três copos térmicos com tampa nas cores rosa, amarelo e azul-marinho", credit: "produto" }],
    brand: null,
    keywords: ["copo", "térmico", "lagoinha", "tampa", "360", "personalizado"],
    personalizable: true,
    availability: "disponivel",
    featured: true,
    options: drinkwareOptions(5.99),
  },
  {
    id: "cuia-termica-360ml",
    name: "Cuia Térmica com Tampa 360 ml",
    category: "copos",
    type: "Copos térmicos",
    description: "Cuia térmica com tampa, de 360 ml. Lisa ou personalizada com nome, iniciais ou frase por mais R$ 5,99.",
    details: ["Capacidade: 360 ml", "Com tampa", addonText(5.99)],
    price: 25,
    promoPrice: 20,
    images: [{ src: "assets/img/products/cuia-termica-360ml.webp", alt: "Cuia térmica branca com borda de inox e tampa transparente", credit: "produto" }],
    brand: null,
    keywords: ["cuia", "copo", "térmico", "tampa", "360", "personalizado"],
    personalizable: true,
    availability: "disponivel",
    featured: false,
    options: drinkwareOptions(5.99),
  },
  {
    id: "copo-termico-lagoinha-260ml",
    name: "Copo Térmico Lagoinha com Tampa 260 ml",
    category: "copos",
    type: "Copos térmicos",
    description: "Copo térmico com tampa, de 260 ml. Liso ou personalizado com nome, iniciais ou frase por mais R$ 5,99.",
    details: ["Capacidade: 260 ml", "Com tampa", addonText(5.99)],
    price: 20,
    promoPrice: null,
    images: [{ src: "assets/img/products/copo-termico-lagoinha-260ml.webp", alt: "Copo térmico preto com borda de inox", credit: "produto" }],
    brand: null,
    keywords: ["copo", "térmico", "lagoinha", "tampa", "260", "personalizado"],
    personalizable: true,
    availability: "disponivel",
    featured: false,
    options: drinkwareOptions(5.99),
  },

  /* CANECAS */
  {
    id: "xicara-termica-360ml",
    name: "Xícara Térmica com Tampa 360 ml",
    category: "canecas",
    type: "Canecas personalizadas",
    description: "Xícara térmica com alça e tampa, de 360 ml. Lisa ou personalizada com nome, iniciais ou frase por mais R$ 5,99.",
    details: ["Capacidade: 360 ml", "Com tampa", addonText(5.99)],
    price: 35,
    promoPrice: null,
    images: [{ src: "assets/img/products/xicara-termica-360ml.webp", alt: "Xícara térmica preta com alça e tampa transparente", credit: "produto" }],
    brand: null,
    keywords: ["xícara", "xicara", "caneca", "térmica", "tampa", "café", "360", "personalizada"],
    personalizable: true,
    availability: "disponivel",
    featured: true,
    options: drinkwareOptions(5.99),
  },
  {
    id: "caneca-termica-360ml",
    name: "Caneca Térmica com Tampa 360 ml",
    category: "canecas",
    type: "Canecas personalizadas",
    description: "Caneca térmica com alça e tampa, de 360 ml. Lisa ou personalizada com nome, iniciais ou frase por mais R$ 5,99.",
    details: ["Capacidade: 360 ml", "Com alça e tampa", addonText(5.99)],
    price: 39,
    promoPrice: 35,
    images: [{ src: "assets/img/products/caneca-termica-360ml.webp", alt: "Caneca térmica vermelha com alça e tampa transparente", credit: "produto" }],
    brand: null,
    keywords: ["caneca", "térmica", "tampa", "alça", "café", "360", "personalizada"],
    personalizable: true,
    availability: "disponivel",
    featured: true,
    options: drinkwareOptions(5.99),
  },
  {
    id: "canecao-termico-720ml",
    name: "Canecão Térmico 720 ml",
    category: "canecas",
    type: "Canecas personalizadas",
    description: "Canecão térmico de 720 ml, com alça. Pode ser personalizado com nome, iniciais ou frase; o valor da personalização é combinado pelo WhatsApp.",
    details: ["Capacidade: 720 ml", addonText("orcamento")],
    price: 55,
    promoPrice: 45,
    images: [{ src: "assets/img/products/canecao-termico-720ml.webp", alt: "Canecão térmico rosa com alça preta", credit: "produto" }],
    brand: null,
    keywords: ["canecão", "canecao", "caneca", "chopp", "cerveja", "térmico", "720", "personalizado"],
    personalizable: true,
    availability: "disponivel",
    featured: false,
    options: drinkwareOptions("orcamento"),
  },

  /* GARRAFAS */
  {
    id: "garrafa-500ml-com-temperatura",
    name: "Garrafa 500 ml com Temperatura",
    category: "garrafas",
    type: "Garrafas com temperatura",
    description: "Garrafa de 500 ml com tampa e medidor de temperatura. Pode ser personalizada com nome, iniciais ou frase (valor combinado pelo WhatsApp).",
    details: ["Capacidade: 500 ml", "Tampa com medidor de temperatura", addonText("orcamento")],
    price: 22,
    promoPrice: 20,
    images: [{ src: "assets/img/products/garrafa-500ml-com-temperatura.webp", alt: "Garrafa preta com visor digital de temperatura na tampa", credit: "produto" }],
    brand: null,
    keywords: ["garrafa", "temperatura", "digital", "termômetro", "térmica", "500", "personalizada"],
    personalizable: true,
    availability: "disponivel",
    featured: true,
    options: drinkwareOptions("orcamento"),
  },
  {
    id: "garrafa-800ml-com-protetor",
    name: "Garrafa 800 ml com Protetor de Borracha",
    category: "garrafas",
    type: "Garrafas com alça",
    description: "Garrafa de 800 ml com alça e protetor de borracha na base, para o dia a dia. Personalização com nome, iniciais ou frase sob orçamento.",
    details: ["Capacidade: 800 ml", "Protetor de borracha", addonText("orcamento")],
    price: 70,
    promoPrice: 50,
    images: [{ src: "assets/img/products/garrafa-800ml-com-protetor.webp", alt: "Garrafa preta com alça na tampa e protetor de borracha na base", credit: "produto" }],
    brand: null,
    keywords: ["garrafa", "800", "protetor", "borracha", "alça", "academia", "personalizada"],
    personalizable: true,
    availability: "disponivel",
    featured: true,
    options: drinkwareOptions("orcamento"),
  },
  {
    id: "garrafa-800ml",
    name: "Garrafa 800 ml",
    category: "garrafas",
    type: "Garrafas com alça",
    description: "Garrafa de 800 ml com alça, para o dia a dia. Personalização com nome, iniciais ou frase sob orçamento.",
    details: ["Capacidade: 800 ml", addonText("orcamento")],
    price: 60,
    promoPrice: 55,
    images: [{ src: "assets/img/products/garrafa-800ml.webp", alt: "Garrafa escura com alça na tampa", credit: "produto" }],
    brand: null,
    keywords: ["garrafa", "800", "alça", "academia", "personalizada"],
    personalizable: true,
    availability: "disponivel",
    featured: false,
    options: drinkwareOptions("orcamento"),
  },
  {
    id: "garrafa-600ml",
    name: "Garrafa 600 ml",
    category: "garrafas",
    type: "Garrafas com alça",
    description: "Garrafa de 600 ml com alça, para o dia a dia. Personalização com nome, iniciais ou frase sob orçamento.",
    details: ["Capacidade: 600 ml", addonText("orcamento")],
    price: 55,
    promoPrice: 50,
    images: [{ src: "assets/img/products/garrafa-600ml.webp", alt: "Três garrafas com alça nas cores branca, preta e azul", credit: "produto" }],
    brand: null,
    keywords: ["garrafa", "600", "alça", "academia", "personalizada"],
    personalizable: true,
    availability: "disponivel",
    featured: false,
    options: drinkwareOptions("orcamento"),
  },
  {
    id: "garrafa-350ml",
    name: "Garrafa 350 ml",
    category: "garrafas",
    type: "Garrafas com alça",
    description: "Garrafa de 350 ml com alça, para o dia a dia. Personalização com nome, iniciais ou frase sob orçamento.",
    details: ["Capacidade: 350 ml", addonText("orcamento")],
    price: 45,
    promoPrice: null,
    images: [{ src: "assets/img/products/garrafa-350ml.webp", alt: "Garrafa azul com alça de silicone na tampa", credit: "produto" }],
    brand: null,
    keywords: ["garrafa", "350", "alça", "infantil", "escola", "personalizada"],
    personalizable: true,
    availability: "disponivel",
    featured: true,
    options: drinkwareOptions("orcamento"),
  },

  /* CAPAS PERSONALIZADAS */
  {
    id: "capinha-personalizada",
    name: "Capinha Personalizada para Celular",
    category: "capas-personalizadas",
    type: "Capas personalizadas",
    description: "Capinha personalizada para qualquer modelo de celular, com nome, frase, foto ou arte. Informe o modelo do aparelho e a loja passa o valor pelo WhatsApp.",
    details: ["Atende todos os modelos de celular", "Personalização: nome, frase, foto ou arte", "Valor sob consulta"],
    price: null,
    promoPrice: null,
    images: [{ src: "assets/img/products/capinha-personalizada.webp", alt: "Exemplos de capinhas transparentes com fotos de família e de pet", credit: "produto" }],
    brand: null,
    compatibility: [],
    keywords: ["capa", "capinha", "celular", "telefone", "personalizada", "foto", "nome", "frase", "iphone", "samsung", "motorola", "xiaomi"],
    personalizable: true,
    availability: "disponivel",
    featured: true,
    options: [
      {
        id: "marca",
        label: "Marca do celular",
        type: "select",
        required: true,
        values: [
          { value: "Apple (iPhone)", label: "Apple (iPhone)" },
          { value: "Samsung", label: "Samsung" },
          { value: "Motorola", label: "Motorola" },
          { value: "Xiaomi", label: "Xiaomi" },
        ],
        allowOther: "Informe a marca",
      },
      {
        id: "modelo",
        label: "Modelo exato do celular",
        type: "text",
        required: true,
        maxLength: 60,
        placeholder: "Ex.: iPhone 13, Galaxy A15, Moto G54",
        help: "Confira o nome exato nas configurações do celular.",
      },
      {
        id: "estilo",
        label: "O que vai na capinha?",
        type: "choice",
        required: true,
        values: [
          { value: "Nome", label: "Nome" },
          { value: "Frase", label: "Frase" },
          { value: "Foto ou arte", label: "Foto ou arte" },
        ],
      },
      { ...personalizationText, label: "Nome ou frase", showIf: { option: "estilo", in: ["Nome", "Frase"] } },
      {
        id: "referencia",
        label: "Descreva a foto ou a arte",
        type: "textarea",
        required: true,
        maxLength: 400,
        placeholder: "Ex.: foto da família com fundo branco",
        help: "O site não recebe arquivos. Envie a foto ou a arte na conversa do WhatsApp.",
        showIf: { option: "estilo", in: ["Foto ou arte"] },
      },
      notes,
    ],
  },
];

/* ---------- Funções de consulta ---------- */
export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

/** Produtos que pertencem a uma categoria (inclui alsoIn e categorias virtuais). */
export function productsInCategory(categoryId) {
  const cat = getCategory(categoryId);
  if (!cat) return [];
  if (cat.virtual === "personalizable") {
    return PRODUCTS.filter((p) => p.personalizable || p.category === cat.id || (p.alsoIn || []).includes(cat.id));
  }
  return PRODUCTS.filter((p) => p.category === cat.id || (p.alsoIn || []).includes(cat.id));
}

/** Categorias que têm ao menos um produto (as vazias não aparecem no site). */
export function activeCategories() {
  return CATEGORIES.filter((c) => productsInCategory(c.id).length > 0).sort((a, b) => a.order - b.order);
}

export function hasOffers() {
  return PRODUCTS.some((p) => typeof p.promoPrice === "number" && typeof p.price === "number" && p.promoPrice < p.price);
}
