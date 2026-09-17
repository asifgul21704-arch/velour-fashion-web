import { db } from './db.js';

function seedProducts() {
  console.log('[Seed Products] Checking products catalogue...');
  const result = db.getProducts({ includeInactive: true });
  const products = result.products;
  console.log(`[Seed Products] Currently ${products.length} products in database.`);
  console.log('Sample products:');
  products.slice(0, 3).forEach(p => {
    console.log(` - [${p.sku}] ${p.name} ($${p.price}) [${p.gender}]`);
  });
}

seedProducts();
