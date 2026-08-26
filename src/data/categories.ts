import { ProductCategory } from "./products";

export interface Category {
  id: ProductCategory;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "keerai",
    name: "Keerai",
    emoji: "🌿",
    description: "Fresh leafy greens",
    color: "#EAF8F0",
  },
  {
    id: "microgreens",
    name: "Microgreens",
    emoji: "🌱",
    description: "Nutrient-packed microgreens (40g Pack)",
    color: "#E8F5E9",
  },
  {
    id: "vegetables",
    name: "Vegetables",
    emoji: "🧅",
    description: "Ready-to-use vegetables",
    color: "#FFF8E7",
  },
  {
    id: "ready-to-cook",
    name: "Ready to Cook",
    emoji: "🥘",
    description: "Prepped & ready",
    color: "#FFF0F0",
  },
  {
    id: "dry-fruits",
    name: "Dry Fruits",
    emoji: "🫘",
    description: "Premium dry fruits",
    color: "#FFF5E6",
  },
  {
    id: "seeds",
    name: "Seeds",
    emoji: "🌱",
    description: "Nutritious seeds",
    color: "#F0F8FF",
  },
  {
    id: "healthy-choices",
    name: "Healthy Choices",
    emoji: "💚",
    description: "Natural wellness",
    color: "#F5FCF8",
  },
  {
    id: "premium-products",
    name: "Premium Products",
    emoji: "✨",
    description: "Curated selection",
    color: "#FAF0FF",
  },
];
