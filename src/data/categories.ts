import { ProductCategory } from "./products";

export interface Category {
  id: ProductCategory;
  name: string;
  emoji: string;
  description: string;
  color: string;
  sortOrder?: number;
  active?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    id: "keerai",
    name: "Greens (Keerai)",
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
    name: "Cut Vegetables",
    emoji: "🧅",
    description: "Ready-to-use cut vegetables",
    color: "#FFF8E7",
  },
  {
    id: "cut-fruits",
    name: "Cut Fruits",
    emoji: "🍓",
    description: "Fresh cut fruits",
    color: "#FFF0F5",
  },
  {
    id: "sprouts",
    name: "Sprouts",
    emoji: "🫘",
    description: "Fresh & nutritious sprouts",
    color: "#F0FFF4",
  },
  {
    id: "fresh-juices",
    name: "Fresh Juices",
    emoji: "🥤",
    description: "Freshly squeezed juices",
    color: "#FFFBE6",
  },
  {
    id: "premium-products",
    name: "Natural Powders",
    emoji: "✨",
    description: "Pure natural herbal powders",
    color: "#FAF0FF",
  },
  {
    id: "nuts-seeds",
    name: "Nuts & Seeds",
    emoji: "🥜",
    description: "Nutritious nuts & seeds",
    color: "#FFF5E6",
  },
  {
    id: "healthy-snacks",
    name: "Healthy Snacks",
    emoji: "🍿",
    description: "Guilt-free healthy snacks",
    color: "#F5FCF8",
  },
  {
    id: "seasonal-exotic-fruits",
    name: "Seasonal & Exotic Fruits",
    emoji: "🍍",
    description: "Seasonal & exotic fruits",
    color: "#FFF8EE",
  },
  {
    id: "mushrooms",
    name: "Mushrooms",
    emoji: "🍄",
    description: "Fresh & dried mushrooms",
    color: "#F5F0FF",
  },
  {
    id: "cold-pressed-oil",
    name: "Cold Pressed Oil",
    emoji: "🫙",
    description: "Pure cold pressed oils",
    color: "#FFFAEB",
  },
];
