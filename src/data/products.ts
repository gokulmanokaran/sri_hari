export type ProductCategory =
  | "keerai"
  | "microgreens"
  | "vegetables"
  | "ready-to-cook"
  | "dry-fruits"
  | "seeds"
  | "healthy-choices"
  | "premium-products";

export interface Product {
  id: string;
  name: string;          // English name
  nameTamil?: string;    // Tamil name (optional)
  price: number;
  unit: string;
  category: ProductCategory;
  description?: string;
  note?: string;
  image?: string;
  inStock: boolean;
}

/** Returns display label: "English / Tamil" if Tamil name is set, else just English */
export function getProductDisplayName(product: Product): string {
  if (product.nameTamil) {
    return `${product.name} / ${product.nameTamil}`;
  }
  return product.name;
}

export const PRODUCTS: Product[] = [
  // ── Greens / Keerai (Fresh Cleaned Packs) ───────────────────────────────
  {
    id: "ponnangani-keerai",
    name: "Ponnangani Keerai",
    nameTamil: "பொன்னாங்கண்ணி கீரை",
    price: 49,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Fresh cleaned Ponnangani Keerai (Sessile Joyweed). Rich in iron and vitamins. Ready to cook straight from the pack.",
    image: "/product-images/ponnangani-keerai.jpg",
    inStock: true,
  },
  {
    id: "palak-leaves",
    name: "Palak Leaves",
    nameTamil: "பாலக்கீரை",
    price: 53,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Freshly cleaned Palak (Spinach) leaves. Naturally rich in iron, calcium and vitamins. Ready to cook.",
    image: "/product-images/palak-leaves.jpg",
    inStock: true,
  },
  {
    id: "araikeerai",
    name: "Araikeerai",
    nameTamil: "அரைக்கீரை",
    price: 47,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Tender Araikeerai (Amaranthus dubius) leaves, carefully cleaned and packed fresh. Great for kootu and poriyal.",
    image: "/product-images/araikeerai.jpg",
    inStock: true,
  },
  {
    id: "thandukeerai",
    name: "Thandukeerai",
    nameTamil: "தண்டுக்கீரை",
    price: 45,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Fresh Thandukeerai with juicy stems and bright green leaves. Packed with nutrients and perfect for South Indian recipes.",
    image: "/product-images/thandukeerai.jpg",
    inStock: true,
  },
  {
    id: "senkeerai",
    name: "Senkeerai",
    nameTamil: "செங்கீரை",
    price: 45,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Vibrant Senkeerai (Red Amaranth) with distinctive red-purple veins. Highly nutritious and full of natural colour.",
    image: "/product-images/senkeerai.jpg",
    inStock: true,
  },
  {
    id: "murungaikeerai",
    name: "Murungaikeerai",
    nameTamil: "முருங்கைக்கீரை",
    price: 77,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Premium Murungaikeerai (Moringa / Drumstick Leaves). A superfood packed with protein, vitamins and minerals.",
    image: "/product-images/murungaikeerai.jpg",
    inStock: true,
  },
  {
    id: "manathakkaali-keerai",
    name: "Manathakkaali Keerai",
    nameTamil: "மணத்தக்காளி கீரை",
    price: 49,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Fresh Manathakkaali (Black Nightshade) leaves. Traditionally used for its cooling properties and digestive benefits.",
    image: "/product-images/manathakkaali-keerai.jpg",
    inStock: true,
  },
  {
    id: "paruppukeerai",
    name: "Paruppukeerai",
    nameTamil: "பருப்புக்கீரை",
    price: 49,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Tender Paruppukeerai (Tropical Amaranth) with delicate pale green leaves. Excellent for dal-based dishes.",
    image: "/product-images/paruppukeerai.jpg",
    inStock: true,
  },
  {
    id: "sirukeerai",
    name: "Sirukeerai",
    nameTamil: "சிறுகீரை",
    price: 49,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Fresh Sirukeerai (Tropical Amaranth / Slender Amaranth) leaves. Mild in taste and rich in nutrients.",
    image: "/product-images/sirukeerai.jpg",
    inStock: true,
  },
  {
    id: "venthayakeerai",
    name: "Venthayakeerai",
    nameTamil: "வெந்தயக்கீரை",
    price: 59,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Fresh Venthayakeerai (Fenugreek Leaves / Methi). Distinctively aromatic with a slight bitterness. Excellent for health.",
    image: "/product-images/venthayakeerai.jpg",
    inStock: true,
  },
  {
    id: "puthina",
    name: "Puthina",
    nameTamil: "புதினா",
    price: 43,
    unit: "100g Pack",
    category: "keerai",
    description:
      "Fresh Puthina (Mint Leaves). Aromatic and refreshing. Perfect for chutneys, biriyani, juices and teas.",
    image: "/product-images/puthina.jpg",
    inStock: true,
  },
  {
    id: "karuveppillai",
    name: "Karuveppillai",
    nameTamil: "கருவேப்பிலை",
    price: 23,
    unit: "100g Pack",
    category: "keerai",
    description:
      "Fresh Karuveppillai (Curry Leaves). An essential ingredient in South Indian cooking — aromatic and flavourful.",
    image: "/product-images/karuveppillai.jpg",
    inStock: true,
  },
  {
    id: "coriander-leaves",
    name: "Coriander Leaves",
    nameTamil: "கொத்தமல்லி",
    price: 27,
    unit: "100g Pack",
    category: "keerai",
    description:
      "Fresh Coriander (Kothamalli) Leaves. Fragrant and versatile — perfect for garnishing, chutneys and cooking.",
    image: "/product-images/coriander-leaves.jpg",
    inStock: true,
  },
  {
    id: "dwarf-copper-leaves",
    name: "Dwarf Copper Leaves",
    nameTamil: "சிவப்பு பொன்னாங்கண்ணிக்கீரை",
    price: 59,
    unit: "250g Cleaned Pack",
    category: "keerai",
    description:
      "Fresh cleaned Dwarf Copper Leaves (Sivappu Ponnanganni Keerai). Deep copper-red leaves rich in antioxidants and iron. Ready to cook.",
    image: "/product-images/dwarf-copper-leaves.jpg",
    inStock: true,
  },

  // ── Microgreens (40g Packs) ──────────────────────────────────────────────
  {
    id: "methi-microgreens",
    name: "Methi",
    nameTamil: "வெந்தயக் கீரை",
    price: 79,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Fresh tender Methi (Fenugreek) microgreens packed in a 40g container. Loaded with vital enzymes, minerals, and rich aroma.",
    image: "/product-images/methi-microgreens.jpg",
    inStock: true,
  },
  {
    id: "alfalfa-microgreens",
    name: "Alfalfa",
    nameTamil: "குதிரை மசால்",
    price: 99,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Nutrient-rich delicate Alfalfa microgreens. Crisp, nutty, and exceptionally rich in vitamins A, C, E, and K.",
    image: "/product-images/alfalfa-microgreens.jpg",
    inStock: true,
  },
  {
    id: "mustard-microgreens",
    name: "Mustard",
    nameTamil: "கடுகு",
    price: 99,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Fresh zesty Mustard microgreens with a pleasant peppery kick. Excellent for salads, sandwiches, and garnishing.",
    image: "/product-images/mustard-microgreens.jpg",
    inStock: true,
  },
  {
    id: "radish-china-rose-microgreens",
    name: "Radish (China Rose)",
    nameTamil: "சீனா ரோஸ் முள்ளங்கி",
    price: 99,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Vibrant pink-stemmed China Rose Radish microgreens. Crunchy, mildly spicy, and rich in immune-boosting antioxidants.",
    image: "/product-images/radish-china-rose-microgreens.jpg",
    inStock: true,
  },
  {
    id: "radish-white-microgreens",
    name: "Radish (White)",
    nameTamil: "வெள்ளை முள்ளங்கி",
    price: 99,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Crisp white-stemmed Radish microgreens with a refreshing spicy tang. Packed with digestive enzymes and vitamin C.",
    image: "/product-images/radish-white-microgreens.jpg",
    inStock: true,
  },
  {
    id: "spinach-microgreens",
    name: "Spinach",
    nameTamil: "பாலக்",
    price: 99,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Tender Spinach microgreens with soft baby leaves. Mild, buttery flavor packed with bioavailable iron and folate.",
    image: "/product-images/spinach-microgreens.jpg",
    inStock: true,
  },
  {
    id: "sunflower-microgreens",
    name: "Sunflower",
    nameTamil: "சூரியகாந்தி",
    price: 99,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Plump, crunchy Sunflower microgreens with a delicious nutty flavor. Rich in complete plant protein and essential amino acids.",
    image: "/product-images/sunflower-microgreens.jpg",
    inStock: true,
  },
  {
    id: "amaranthus-pink-microgreens",
    name: "Amaranthus (Pink)",
    nameTamil: "இளஞ்சிவப்பு தண்டுக்கீரை",
    price: 109,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Stunning magenta-pink Amaranthus microgreens. Adds vibrant color, subtle earthy sweetness, and high concentrations of betalains.",
    image: "/product-images/amaranthus-pink-microgreens.jpg",
    inStock: true,
  },
  {
    id: "beetroot-microgreens",
    name: "Beetroot",
    nameTamil: "பீட்ரூட்",
    price: 109,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Gorgeous ruby-stemmed Beetroot microgreens with deep purple-green leaves. Sweet, earthy flavor rich in dietary nitrates and iron.",
    image: "/product-images/beetroot-microgreens.jpg",
    inStock: true,
  },
  {
    id: "broccoli-microgreens",
    name: "Broccoli",
    nameTamil: "ப்ரோக்கோலி",
    price: 109,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Powerhouse Broccoli microgreens celebrated for immense sulforaphane content. Mild, fresh cabbage-like flavor.",
    image: "/product-images/broccoli-microgreens.jpg",
    inStock: true,
  },
  {
    id: "khol-rabi-microgreens",
    name: "Khol Rabi",
    nameTamil: "நூல் கோல்",
    price: 109,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Tender purple and green Kohlrabi microgreens with a sweet, mild turnip-like crunch. Rich in vitamin C and glucosinolates.",
    image: "/product-images/khol-rabi-microgreens.jpg",
    inStock: true,
  },
  {
    id: "pak-choi-microgreens",
    name: "Pak Choi",
    nameTamil: "பாக் சோய்",
    price: 109,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Juicy, tender Pak Choi (Bok Choy) microgreens with mild brassica sweetness. High in vitamins A, C, and dietary minerals.",
    image: "/product-images/pak-choi-microgreens.jpg",
    inStock: true,
  },
  {
    id: "radish-purple-sango-microgreens",
    name: "Radish (Purple Sango)",
    nameTamil: "பர்பிள் சாங்கோ முள்ளங்கி",
    price: 109,
    unit: "40g Pack",
    category: "microgreens",
    description:
      "Intense deep purple Radish Sango microgreens. Striking visual appeal with a crisp, spicy radish punch and anthocyanins.",
    image: "/product-images/radish-purple-sango-microgreens.jpg",
    inStock: true,
  },

  // ── Fresh / Cleaned Vegetables ──────────────────────────────────────────
  {
    id: "small-onion",
    name: "Small Onion",
    nameTamil: "சின்ன வெங்காயம்",
    price: 70,
    unit: "500g",
    category: "vegetables",
    note: "Peeled",
    description:
      "Small onions peeled and ready to use. Saves time in the kitchen while delivering authentic flavour.",
    inStock: true,
  },
  {
    id: "garlic",
    name: "Garlic",
    nameTamil: "பூண்டு",
    price: 120,
    unit: "250g",
    category: "vegetables",
    note: "Peeled",
    description:
      "Premium garlic cloves, peeled and ready to use. Fresh, pungent and full of natural goodness.",
    inStock: true,
  },
  {
    id: "pomegranate",
    name: "Pomegranate",
    nameTamil: "மாதுளை",
    price: 200,
    unit: "500g",
    category: "vegetables",
    note: "Peeled",
    description:
      "Fresh pomegranate seeds, peeled and ready to eat or use in recipes. Ruby-red and bursting with flavour.",
    inStock: true,
  },

  // ── Premium Quality Dry Fruits ───────────────────────────────────────────
  {
    id: "black-dates",
    name: "Black Dates",
    nameTamil: "கருப்பு பேரீச்சை",
    price: 200,
    unit: "500g",
    category: "dry-fruits",
    description:
      "Naturally sweet and rich black dates. A wholesome snack or natural sweetener for your recipes.",
    inStock: true,
  },
  {
    id: "almond",
    name: "Almond",
    nameTamil: "பாதாம்",
    price: 275,
    unit: "250g",
    category: "dry-fruits",
    description:
      "Premium quality almonds, carefully selected. Crunchy, nutritious and perfect for snacking.",
    inStock: true,
  },
  {
    id: "pista-unsalted",
    name: "Pista Unsalted",
    nameTamil: "உப்பில்லா பிஸ்தா",
    price: 830,
    unit: "250g",
    category: "dry-fruits",
    description:
      "Premium unsalted pistachios. Rich, buttery flavour with no added salt — pure natural goodness.",
    inStock: true,
  },
  {
    id: "walnut",
    name: "Walnut",
    nameTamil: "வால்நட்",
    price: 420,
    unit: "250g",
    category: "dry-fruits",
    description:
      "Whole walnuts with a rich, earthy taste. Versatile for snacking, baking or adding to salads.",
    inStock: true,
  },
  {
    id: "fig",
    name: "Fig",
    nameTamil: "அத்திப்பழம்",
    price: 300,
    unit: "250g",
    category: "dry-fruits",
    description:
      "Soft, naturally sweet dried figs. A wholesome treat packed with natural flavour.",
    inStock: true,
  },
  {
    id: "yellow-raisins",
    name: "Yellow Raisins",
    nameTamil: "மஞ்சள் திராட்சை",
    price: 160,
    unit: "250g",
    category: "dry-fruits",
    description:
      "Golden yellow raisins, naturally sweet and tender. Great for snacking, cooking or baking.",
    inStock: true,
  },
  {
    id: "black-raisins",
    name: "Black Raisins",
    nameTamil: "கருப்பு திராட்சை",
    price: 185,
    unit: "250g",
    category: "dry-fruits",
    description:
      "Rich black raisins with intense natural sweetness. A classic nutritious addition to any meal.",
    inStock: true,
  },
  {
    id: "cashew",
    name: "Cashew",
    nameTamil: "முந்திரி",
    price: 265,
    unit: "250g",
    category: "dry-fruits",
    description:
      "Creamy, premium whole cashews. Perfect for snacking or cooking rich, flavourful dishes.",
    inStock: true,
  },

  // ── Healthy Seeds ────────────────────────────────────────────────────────
  {
    id: "chia-seeds",
    name: "Chia Seeds",
    nameTamil: "சியா விதைகள்",
    price: 115,
    unit: "250g",
    category: "seeds",
    description:
      "Tiny but mighty chia seeds. Mix into drinks, smoothies, puddings or sprinkle on meals.",
    inStock: true,
  },
  {
    id: "pumpkin-seeds",
    name: "Pumpkin Seeds",
    nameTamil: "பூசணி விதைகள்",
    price: 175,
    unit: "250g",
    category: "seeds",
    description:
      "Crunchy pumpkin seeds, naturally nutritious. Great for snacking or adding texture to dishes.",
    inStock: true,
  },
  {
    id: "sabja-seeds",
    name: "Sabja Seeds",
    nameTamil: "சப்ஜா விதைகள்",
    price: 100,
    unit: "250g",
    category: "seeds",
    description:
      "Sabja (basil) seeds that bloom beautifully in water. A refreshing addition to drinks and desserts.",
    inStock: true,
  },
  {
    id: "flax-seeds",
    name: "Flax Seeds",
    nameTamil: "ஆளி விதைகள்",
    price: 80,
    unit: "250g",
    category: "seeds",
    description:
      "Earthy flax seeds packed with natural goodness. Sprinkle on yogurt, salads or add to smoothies.",
    inStock: true,
  },
  {
    id: "sunflower-seeds",
    name: "Sunflower Seeds",
    nameTamil: "சூரியகாந்தி விதைகள்",
    price: 95,
    unit: "250g",
    category: "seeds",
    description:
      "Light and crunchy sunflower seeds. A satisfying natural snack or salad topping.",
    inStock: true,
  },
  {
    id: "melon-seeds",
    name: "Melon Seeds",
    nameTamil: "முலாம்பழ விதைகள்",
    price: 230,
    unit: "250g",
    category: "seeds",
    description:
      "Delicate melon seeds with a mild, nutty taste. Versatile for snacking or adding to recipes.",
    inStock: true,
  },

  // ── Healthy Choices & Herbal ─────────────────────────────────────────────
  {
    id: "badam-gum",
    name: "Badam Gum",
    nameTamil: "பாதாம் பிசின்",
    price: 160,
    unit: "250g",
    category: "healthy-choices",
    description:
      "Natural badam gum, traditionally used in refreshing drinks and desserts. A unique premium product.",
    inStock: true,
  },
  {
    id: "arappu-powder",
    name: "Arappu Powder",
    nameTamil: "அரப்பு பொடி",
    price: 90,
    unit: "250g",
    category: "healthy-choices",
    description:
      "Traditional pure arappu powder for natural hair wash and cooling. 100% herbal and chemical-free.",
    inStock: true,
  },
];

export function getProductsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.nameTamil && p.nameTamil.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q) ||
      (p.note && p.note.toLowerCase().includes(q))
  );
}
