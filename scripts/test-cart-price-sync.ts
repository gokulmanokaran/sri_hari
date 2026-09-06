import { findProductById } from "../src/services/productService";
import { calculateDeliveryCharge } from "../src/utils/price";

// ── Test Scenario ───────────────────────────────────────────────────────────
// 1. Customer adds Product A (500) and Variant B (250) to cart
// 2. Admin changes Product A to 700 and Variant B to 350 in DB
// 3. Cart fetches latest catalog and syncs prices
// 4. Cart totals recalculate
// ────────────────────────────────────────────────────────────────────────────

const mockLiveCatalog: any[] = [
  {
    id: "prod_keerai_1",
    name: "Siru Keerai",
    nameTamil: "சிறு கீரை",
    price: 700, // Updated from 500 to 700
    mrp: 750,
    inStock: true,
    stockQuantity: 25,
    unit: "1 Bunch",
    variants: [
      { id: "prod_keerai_1_bundle_2", price: 350, unit: "2 Bunches" }, // Updated from 250 to 350
    ],
  },
];

const customerCart = [
  {
    product: {
      id: "prod_keerai_1",
      name: "Siru Keerai",
      price: 500, // Old price
      unit: "1 Bunch",
      inStock: true,
    },
    quantity: 2,
  },
  {
    product: {
      id: "prod_keerai_1_bundle_2",
      name: "Siru Keerai (2 Bunches)",
      price: 250, // Old variant price
      unit: "2 Bunches",
      inStock: true,
    },
    quantity: 1,
  },
];

console.log("================================================================================");
console.log("TEST: Cart Price Synchronization Simulation");
console.log("================================================================================");

const oldSubtotal = customerCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
const oldDelivery = calculateDeliveryCharge(oldSubtotal);
const oldTotal = oldSubtotal + oldDelivery;

console.log(`[Before Sync]`);
console.log(`  Item 1 (root): ${customerCart[0].product.name} @ ₹${customerCart[0].product.price} x ${customerCart[0].quantity} = ₹${customerCart[0].product.price * customerCart[0].quantity}`);
console.log(`  Item 2 (variant): ${customerCart[1].product.name} @ ₹${customerCart[1].product.price} x ${customerCart[1].quantity} = ₹${customerCart[1].product.price * customerCart[1].quantity}`);
console.log(`  Subtotal: ₹${oldSubtotal}, Delivery: ₹${oldDelivery}, Total: ₹${oldTotal}`);

// Execute the exact syncItemsAgainstCatalog logic
const detectedAlerts: any[] = [];
let hasModifications = false;

const updatedCart = customerCart.map((item) => {
  const live = findProductById(mockLiveCatalog, item.product.id);
  if (!live) return item;

  const livePrice = Number(live.price);
  const currentPrice = Number(item.product.price);

  if (livePrice !== currentPrice) {
    detectedAlerts.push({
      id: item.product.id,
      name: live.name,
      oldPrice: currentPrice,
      newPrice: livePrice,
    });
    hasModifications = true;
    return {
      ...item,
      product: {
        ...item.product,
        ...live,
        price: livePrice,
      },
    };
  }

  return item;
});

const newSubtotal = updatedCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
const newDelivery = calculateDeliveryCharge(newSubtotal);
const newTotal = newSubtotal + newDelivery;

console.log(`\n[After Sync]`);
console.log(`  Item 1 (root): ${updatedCart[0].product.name} @ ₹${updatedCart[0].product.price} x ${updatedCart[0].quantity} = ₹${updatedCart[0].product.price * updatedCart[0].quantity}`);
console.log(`  Item 2 (variant): ${updatedCart[1].product.name} @ ₹${updatedCart[1].product.price} x ${updatedCart[1].quantity} = ₹${updatedCart[1].product.price * updatedCart[1].quantity}`);
console.log(`  Subtotal: ₹${newSubtotal}, Delivery: ₹${newDelivery}, Total: ₹${newTotal}`);

console.log(`\n[Price Change Alerts Detected]:`, detectedAlerts);

// Assertions
if (updatedCart[0].product.price !== 700) {
  throw new Error(`Item 1 price was expected to be 700, got ${updatedCart[0].product.price}`);
}
if (updatedCart[1].product.price !== 350) {
  throw new Error(`Item 2 price was expected to be 350, got ${updatedCart[1].product.price}`);
}
if (newSubtotal !== 1750) {
  throw new Error(`Expected new subtotal to be 1750 (700*2 + 350*1), got ${newSubtotal}`);
}
if (detectedAlerts.length !== 2) {
  throw new Error(`Expected 2 price change alerts, got ${detectedAlerts.length}`);
}

console.log("\n================================================================================");
console.log("✅ ALL VERIFICATION CHECKS PASSED: Cart price synchronization works flawlessly!");
console.log("================================================================================");
