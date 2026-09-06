import { fetchLiveProducts, findProductById } from "../src/services/productService";

async function main() {
  console.log("Testing live fetchLiveProducts() against Supabase database...");
  const products = await fetchLiveProducts();
  console.log(`Fetched ${products.length} live products from database.`);

  if (!products || products.length === 0) {
    throw new Error("No products fetched!");
  }

  const first = products[0];
  console.log(`First product: [${first.id}] ${first.name} - Price: ₹${first.price}`);

  const lookup = findProductById(products, first.id);
  if (!lookup) {
    throw new Error(`findProductById failed to find ${first.id}`);
  }
  console.log(`findProductById verification: found [${lookup.id}] at ₹${lookup.price}`);

  // If any product has variants, test variant lookup
  const withVariants = products.find(p => p.variants && p.variants.length > 0);
  if (withVariants && withVariants.variants) {
    const v = withVariants.variants[0];
    const variantLookup = findProductById(products, v.id);
    if (!variantLookup) {
      throw new Error(`findProductById failed to find variant ${v.id}`);
    }
    console.log(`Variant lookup test: found [${variantLookup.id}] at ₹${variantLookup.price}`);
  }

  console.log("✅ Live database fetch and lookup verified successfully!");
}

main().catch(err => {
  console.error("❌ Live test error:", err);
  process.exit(1);
});
