export type ProductCategory =
  | "keerai"
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
  // ── Fresh / Cleaned Products ────────────────────────────────────────────
  {
    id: "dwarf-copper-leaves",
    name: "Dwarf Copper Leaves",
    nameTamil: "சிறு செம்பு கீரை",
    price: 40,
    unit: "Cleaned Pack",
    category: "keerai",
    description:
      "Freshly cleaned dwarf copper leaves, rich in natural goodness. Ready to cook straight from the pack.",
    inStock: true,
  },
  {
    id: "spleen-amaranthus",
    name: "Spleen Amaranthus",
    nameTamil: "முளைக்கீரை",
    price: 40,
    unit: "Cleaned Pack",
    category: "keerai",
    description:
      "Tender spleen amaranthus greens, carefully cleaned and packed fresh for your kitchen.",
    inStock: true,
  },
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

  // ── Premium Quality Products ─────────────────────────────────────────────
  {
    id: "black-dates",
    name: "Black Dates",
    nameTamil: "கருப்பு பேரீட்டை",
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
