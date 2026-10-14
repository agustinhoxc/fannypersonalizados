/**
 * CATÁLOGO DA FANNY ACESSÓRIOS
 * ------------------------------------------------------------
 * Fonte única de categorias e produtos. Todas as páginas leem daqui.
 *
 * ATENÇÃO: os produtos abaixo são EXEMPLOS DE DEMONSTRAÇÃO (demo: true).
 * Eles usam fotos reais da vitrine da loja (extraídas do vídeo) ou imagens
 * ilustrativas, mas nomes, opções e disponibilidade ainda NÃO foram
 * confirmados pela loja. Nenhum preço foi inventado: price: null significa
 * "preço sob consulta". Substitua pelos produtos reais (veja o README).
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
    image: "assets/img/categories/icon-mug.svg",
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
const deviceBrand = {
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
};

const deviceModel = {
  id: "modelo",
  label: "Modelo exato do celular",
  type: "text",
  required: true,
  maxLength: 60,
  placeholder: "Ex.: iPhone 13, Galaxy A15, Moto G54",
  help: "Confira o nome exato nas configurações do celular. A loja confirma a compatibilidade antes de fechar o pedido.",
};

const wantsPersonalization = {
  id: "personalizar",
  label: "Deseja personalizar?",
  type: "choice",
  required: true,
  values: [
    { value: "Sim", label: "Sim" },
    { value: "Não", label: "Não" },
  ],
};

const personalizationStyle = (extra = [], showIf) => ({
  id: "estilo",
  label: "Tipo de personalização",
  type: "choice",
  required: true,
  showIf,
  values: [
    { value: "Nome", label: "Nome" },
    { value: "Iniciais", label: "Iniciais" },
    { value: "Frase", label: "Frase" },
    { value: "Foto ou arte própria", label: "Foto ou arte própria", quote: true },
    ...extra,
  ],
});

const personalizationText = {
  id: "texto",
  label: "Nome, iniciais ou frase",
  type: "text",
  maxLength: 40,
  placeholder: "Como deve aparecer no produto",
  showIf: { option: "estilo", in: ["Nome", "Iniciais", "Frase"] },
  required: true,
};

const artNote = {
  id: "referencia",
  label: "Descreva a arte ou referência",
  type: "textarea",
  maxLength: 400,
  placeholder: "Conte como imagina o resultado. A imagem é enviada depois, pelo WhatsApp.",
  showIf: { option: "estilo", in: ["Foto ou arte própria", "Ilustração"] },
  required: true,
  help: "O site não recebe arquivos. Envie a foto ou a arte na conversa do WhatsApp.",
};

const notes = {
  id: "observacoes",
  label: "Observações",
  type: "textarea",
  maxLength: 300,
  placeholder: "Algum detalhe que a loja precisa saber?",
};

const caseColors = [
  { value: "Rosa-chiclete", label: "Rosa-chiclete", hex: "#E2457A" },
  { value: "Vermelho", label: "Vermelho", hex: "#D23A33" },
  { value: "Amarelo", label: "Amarelo", hex: "#F1D04B" },
  { value: "Verde-água", label: "Verde-água", hex: "#7DD3C0" },
  { value: "Verde", label: "Verde", hex: "#3E7A4A" },
  { value: "Azul-marinho", label: "Azul-marinho", hex: "#22305C" },
  { value: "Lilás", label: "Lilás", hex: "#B9A3D9" },
  { value: "Bege", label: "Bege", hex: "#E8DCC6" },
  { value: "Preto", label: "Preto", hex: "#1D1D1F" },
];

/* ---------- Produtos (exemplos de demonstração) ---------- */
export const PRODUCTS = [
  /* COPOS */
  {
    id: "copo-termico-com-tampa",
    name: "Copo térmico com tampa",
    category: "copos",
    type: "Copos térmicos",
    description:
      "Copo com tampa, da vitrine de copos da loja. Use liso ou com nome, iniciais ou frase. Consulte cores, capacidades e tampas disponíveis.",
    details: [],
    price: null,
    images: [{ src: "assets/img/products/copo-termico-preto.webp", alt: "Copos térmicos pretos com tampa prateada na vitrine da loja", credit: "loja" }],
    keywords: ["copo", "térmico", "tampa", "tumbler", "café", "personalizado", "nome"],
    personalizable: true,
    availability: "consulta",
    featured: true,
    demo: true,
    options: [
      { id: "cor", label: "Cor", type: "color", required: true, values: [{ value: "Preto", label: "Preto", hex: "#1D1D1F" }], help: "Outras cores sob consulta." },
      wantsPersonalization,
      personalizationStyle([], { option: "personalizar", in: ["Sim"] }),
      personalizationText,
      artNote,
      notes,
    ],
  },
  {
    id: "copo-com-canudo",
    name: "Copo com canudo",
    category: "copos",
    type: "Copos com canudo",
    description: "Copo com tampa e canudo, liso ou personalizado. Consulte cores e capacidades disponíveis.",
    details: [],
    price: null,
    images: [],
    keywords: ["copo", "canudo", "tampa", "personalizado"],
    personalizable: true,
    availability: "consulta",
    featured: true,
    demo: true,
    options: [
      { id: "cor", label: "Cor preferida", type: "text", maxLength: 40, placeholder: "Ex.: rosa, lilás, transparente" },
      wantsPersonalization,
      personalizationStyle([], { option: "personalizar", in: ["Sim"] }),
      personalizationText,
      artNote,
      notes,
    ],
  },

  /* CANECAS */
  {
    id: "caneca-personalizada",
    name: "Caneca personalizada",
    category: "canecas",
    type: "Canecas personalizadas",
    description:
      "Caneca com nome, frase, foto ou arte. Descreva a ideia e envie a imagem pelo WhatsApp; a loja confirma o resultado antes de produzir.",
    details: [],
    price: null,
    images: [],
    keywords: ["caneca", "personalizada", "foto", "presente", "nome", "frase"],
    personalizable: true,
    availability: "consulta",
    featured: true,
    demo: true,
    options: [
      personalizationStyle([{ value: "Ilustração", label: "Ilustração", quote: true }]),
      personalizationText,
      artNote,
      notes,
    ],
  },
  {
    id: "caneca-colorida",
    name: "Caneca colorida",
    category: "canecas",
    type: "Canecas lisas",
    description: "Caneca lisa para o dia a dia. Consulte cores e modelos disponíveis.",
    details: [],
    price: null,
    images: [],
    keywords: ["caneca", "colorida", "lisa", "café"],
    personalizable: false,
    availability: "consulta",
    demo: true,
    options: [
      { id: "cor", label: "Cor preferida", type: "text", maxLength: 40, placeholder: "Ex.: branca, preta, rosa" },
      notes,
    ],
  },

  /* GARRAFAS */
  {
    id: "garrafa-colorida-com-alca",
    name: "Garrafa colorida com alça",
    category: "garrafas",
    type: "Garrafas com alça",
    description:
      "Garrafa com tampa e alça para levar no dia a dia. Os tons abaixo aparecem na vitrine da loja; a disponibilidade é confirmada no atendimento.",
    details: [],
    price: null,
    images: [
      { src: "assets/img/products/garrafa-alca.webp", alt: "Garrafas verde-água e menta com alça na prateleira", credit: "loja" },
      { src: "assets/img/products/garrafas-vermelha-rosa.webp", alt: "Garrafas vermelha e rosa-claro lado a lado", credit: "loja" },
    ],
    keywords: ["garrafa", "squeeze", "alça", "academia", "água"],
    personalizable: false,
    availability: "consulta",
    featured: true,
    demo: true,
    options: [
      {
        id: "cor",
        label: "Cor",
        type: "color",
        required: true,
        values: [
          { value: "Verde-água", label: "Verde-água", hex: "#7DD3C0" },
          { value: "Menta", label: "Menta", hex: "#A8DCC1" },
          { value: "Vermelho", label: "Vermelho", hex: "#D23A33" },
          { value: "Rosa-claro", label: "Rosa-claro", hex: "#F3B7C3" },
        ],
      },
      notes,
    ],
  },
  {
    id: "garrafa-termica-rosa",
    name: "Garrafa térmica de tampa rosqueável",
    category: "garrafas",
    type: "Garrafas térmicas",
    description: "Garrafa alta com tampa rosqueável. Consulte capacidades e cores disponíveis.",
    details: [],
    price: null,
    images: [
      { src: "assets/img/products/garrafa-rosa.webp", alt: "Garrafa rosa-pink em destaque na vitrine de vidro", credit: "loja" },
      { src: "assets/img/products/garrafa-lilas.webp", alt: "Garrafas lilás e verde-água na prateleira", credit: "loja" },
    ],
    keywords: ["garrafa", "térmica", "inox", "rosa", "pink"],
    personalizable: false,
    availability: "consulta",
    featured: true,
    demo: true,
    options: [
      {
        id: "cor",
        label: "Cor",
        type: "color",
        required: true,
        values: [
          { value: "Pink", label: "Pink", hex: "#E8418A" },
          { value: "Lilás", label: "Lilás", hex: "#8E5BC9" },
          { value: "Verde-água", label: "Verde-água", hex: "#7DD3C0" },
        ],
      },
      notes,
    ],
  },
  {
    id: "garrafa-termica-preta",
    name: "Garrafa térmica preta",
    category: "garrafas",
    type: "Garrafas térmicas",
    description: "Garrafa térmica de linha sóbria. Consulte modelos e funções disponíveis na loja.",
    details: [],
    price: null,
    images: [{ src: "assets/img/products/garrafa-preta.webp", alt: "Garrafas térmicas pretas e suas caixas na prateleira", credit: "loja" }],
    keywords: ["garrafa", "térmica", "preta", "escritório"],
    personalizable: false,
    availability: "consulta",
    demo: true,
    options: [notes],
  },
  {
    id: "garrafa-personalizada",
    name: "Garrafa personalizada",
    category: "garrafas",
    type: "Garrafas personalizadas",
    description:
      "Garrafa branca pronta para receber nome, iniciais, frase ou a sua arte. Descreva a ideia e a loja confirma o resultado antes de produzir.",
    details: [],
    price: null,
    images: [{ src: "assets/img/products/garrafas-brancas.webp", alt: "Fileira de garrafas brancas lisas na vitrine", credit: "loja" }],
    keywords: ["garrafa", "personalizada", "nome", "presente", "branca", "sublimação"],
    personalizable: true,
    availability: "consulta",
    featured: true,
    demo: true,
    options: [
      { id: "cor", label: "Cor da garrafa", type: "color", required: true, values: [{ value: "Branca", label: "Branca", hex: "#F4F4F2" }] },
      personalizationStyle(),
      personalizationText,
      artNote,
      {
        id: "cor-arte",
        label: "Cor da personalização",
        type: "text",
        maxLength: 40,
        placeholder: "Ex.: preto, rosa, dourado",
        showIf: { option: "estilo", in: ["Nome", "Iniciais", "Frase"] },
      },
      notes,
    ],
  },

  /* CAPAS PERSONALIZADAS */
  {
    id: "capa-personalizada",
    name: "Capa personalizada com nome ou frase",
    category: "capas-personalizadas",
    type: "Nome, iniciais ou frase",
    description:
      "Capa transparente ou colorida com o nome, as iniciais ou a frase que você escolher. Informe o modelo exato do seu celular.",
    details: [],
    price: null,
    images: [{ src: "assets/img/products/capinhas-vitrine.webp", alt: "Capinhas em rosa, prata e vermelho penduradas no painel da loja", credit: "loja" }],
    keywords: ["capa", "capinha", "personalizada", "nome", "iniciais", "frase", "celular"],
    personalizable: true,
    availability: "consulta",
    featured: true,
    demo: true,
    options: [
      deviceBrand,
      deviceModel,
      {
        id: "base",
        label: "Base da capa",
        type: "choice",
        required: true,
        values: [
          { value: "Transparente", label: "Transparente" },
          { value: "Colorida", label: "Colorida" },
        ],
      },
      { id: "cor", label: "Cor da base", type: "color", required: true, values: caseColors, showIf: { option: "base", in: ["Colorida"] } },
      {
        id: "estilo",
        label: "Tipo de personalização",
        type: "choice",
        required: true,
        values: [
          { value: "Nome", label: "Nome" },
          { value: "Iniciais", label: "Iniciais" },
          { value: "Frase", label: "Frase" },
        ],
      },
      personalizationText,
      notes,
    ],
  },
  {
    id: "capa-com-foto-ou-arte",
    name: "Capa personalizada com foto ou arte",
    category: "capas-personalizadas",
    type: "Foto ou arte",
    description:
      "Capa com a sua foto, ilustração ou arte. Descreva a ideia aqui e envie a imagem pela conversa do WhatsApp. Valor sob orçamento.",
    details: [],
    price: null,
    images: [{ src: "assets/img/products/capinhas-coloridas.webp", alt: "Capinhas coloridas penduradas no painel da loja", credit: "loja" }],
    keywords: ["capa", "capinha", "personalizada", "foto", "arte", "ilustração", "celular"],
    personalizable: true,
    availability: "consulta",
    featured: true,
    demo: true,
    options: [
      deviceBrand,
      deviceModel,
      {
        id: "base",
        label: "Base da capa",
        type: "choice",
        required: true,
        values: [
          { value: "Transparente", label: "Transparente" },
          { value: "Colorida", label: "Colorida" },
        ],
      },
      { id: "cor", label: "Cor da base", type: "color", required: true, values: caseColors, showIf: { option: "base", in: ["Colorida"] } },
      {
        id: "estilo",
        label: "O que vai na capa?",
        type: "choice",
        required: true,
        values: [
          { value: "Foto ou arte própria", label: "Foto ou arte própria", quote: true },
          { value: "Ilustração", label: "Ilustração", quote: true },
        ],
      },
      artNote,
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
