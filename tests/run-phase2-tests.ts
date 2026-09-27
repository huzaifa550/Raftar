import { dataStore } from '../server/src/db/datastore.ts';
import { catalogService } from '../server/src/modules/catalog/catalog.service.ts';
import { calculateDistanceKm, formatPKR, isPointInPolygon } from '../server/src/utils/geo.utils.ts';

async function runPhase2Tests() {
  console.log('🧪 Starting Raftaar Phase 2 Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test Failed: ${testName}`);
    }
  }

  // 1. Spatial & Geofencing Math
  console.log('--- 1. Spatial & Distance Calculations ---');
  // Karachi Do Darya (24.7788, 67.0862) to Clifton Block 7 (24.825, 67.034)
  const dist = calculateDistanceKm(24.7788, 67.0862, 24.825, 67.034);
  assert(dist > 5 && dist < 12, `Haversine distance between Do Darya & Clifton is approx ~${dist} km`);

  // Point in Polygon
  const testPoly = [
    { lat: 24.80, lng: 67.00 },
    { lat: 24.90, lng: 67.00 },
    { lat: 24.90, lng: 67.10 },
    { lat: 24.80, lng: 67.10 },
  ];
  assert(isPointInPolygon({ lat: 24.85, lng: 67.05 }, testPoly), 'Point inside polygon returns true');
  assert(!isPointInPolygon({ lat: 25.10, lng: 67.50 }, testPoly), 'Point far outside polygon returns false');

  // Currency Formatter
  assert(formatPKR(45000) === 'Rs. 450', 'Format 45000 paisas as Rs. 450');

  // 2. Categories Listing
  console.log('\n--- 2. Categories Listing & Classification ---');
  const allCats = dataStore.listCategories();
  const foodCats = dataStore.listCategories('food');
  const groceryCats = dataStore.listCategories('grocery');
  assert(allCats.length >= 15, `Loaded ${allCats.length} seed categories`);
  assert(foodCats.some((c) => c.slug === 'biryani-rice'), 'Food categories include Biryani & Rice');
  assert(groceryCats.some((c) => c.slug === 'dairy-milk-eggs'), 'Grocery categories include Dairy, Milk & Eggs');

  // 3. Merchants Catalog & Filtering
  console.log('\n--- 3. Merchant Discovery & Filters ---');
  const allMerchants = catalogService.getMerchants({});
  assert(allMerchants.length >= 12, `Total ${allMerchants.length} merchants loaded (restaurants + shops)`);

  const restaurantsOnly = catalogService.getMerchants({ type: 'restaurant' });
  const shopsOnly = catalogService.getMerchants({ type: 'shop' });
  assert(restaurantsOnly.length >= 9, `Found ${restaurantsOnly.length} restaurants`);
  assert(shopsOnly.length >= 3, `Found ${shopsOnly.length} grocery shops`);

  const biryaniMerchants = catalogService.getMerchants({ cuisine: 'Biryani' });
  assert(biryaniMerchants.some((m) => m.slug === 'student-biryani'), 'Filter by cuisine "Biryani" returns Student Biryani');

  const freeDeliveryMerchants = catalogService.getMerchants({ freeDeliveryOnly: true });
  assert(freeDeliveryMerchants.length > 0, 'Filter by free delivery returns eligible merchants');

  // 4. Merchant Detail & Categorized Menu
  console.log('\n--- 4. Merchant Details & Menu Catalog ---');
  const studentBiryani = catalogService.getMerchantDetails('student-biryani', 24.825, 67.034);
  assert(Boolean(studentBiryani), 'Found merchant details for Student Biryani');
  assert(studentBiryani!.categories.length > 0, 'Menu contains categorized groups');
  assert(studentBiryani!.totalItemsCount >= 3, 'Contains menu items');

  const biryaniItem = studentBiryani!.categories[0].items[0];
  assert(Boolean(biryaniItem.optionGroups && biryaniItem.optionGroups.length > 0), 'Menu item includes configurable option groups (portion size / add-ons)');

  // 5. Global Cross-Catalog Search
  console.log('\n--- 5. Global Search Across Restaurants, Groceries, and Dishes ---');
  const biryaniSearch = catalogService.globalSearch('biryani');
  assert(biryaniSearch.dishes.length > 0, 'Search for "biryani" finds dishes');
  assert(biryaniSearch.merchants.length > 0, 'Search for "biryani" finds merchants');

  const milkSearch = catalogService.globalSearch('milk');
  assert(milkSearch.products.length > 0, 'Search for "milk" finds grocery products (Olpers / MilkPak)');

  // 6. Delivery Zone Coverage
  console.log('\n--- 6. Delivery Zone Geofencing & Fee Estimation ---');
  const coverage = catalogService.checkCoverage('merch_student_biryani', 24.825, 67.034);
  assert(coverage.distanceKm > 0, `Estimated distance: ${coverage.distanceKm} km`);
  assert(coverage.deliveryFee >= 6000, `Calculated delivery fee: ${formatPKR(coverage.deliveryFee)}`);
  assert(coverage.eta.min > 0 && coverage.eta.max > coverage.eta.min, `Calculated ETA: ${coverage.eta.min}-${coverage.eta.max} mins`);

  // 7. Customer Address Management
  console.log('\n--- 7. Address CRUD & Default Setting ---');
  const newAddr = catalogService.saveAddress('usr_test_phase2', {
    label: 'Home',
    recipientName: 'Bilal Ahmed',
    recipientPhone: '+923009988776',
    streetAddress: 'House 12, Street 4, Block 2, PECHS',
    area: 'PECHS',
    city: 'Karachi',
    latitude: 24.865,
    longitude: 67.058,
    isDefault: true,
  });
  assert(Boolean(newAddr.id), 'Customer address created with ID');

  const userAddrs = catalogService.getUserAddresses('usr_test_phase2');
  assert(userAddrs.length === 1, 'Address retrievable by user ID');
  assert(userAddrs[0].isDefault === true, 'Address marked as default');

  // 8. Inventory & Stock Management
  console.log('\n--- 8. Inventory Management & Low-Stock Alerts ---');
  const updatedProd = catalogService.updateStock('merch_imtiaz', 'prod_olpers_milk_1l', 12);
  assert(updatedProd.stockQuantity === 12, 'Inventory stock quantity updated to 12');
  assert(updatedProd.stockQuantity <= updatedProd.lowStockThreshold, 'Correctly flagged as low stock (<= threshold 20)');

  console.log(`\n🎉 All ${passed}/${total} Phase 2 tests passed successfully!`);
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 Test Suite Failed:', err);
  process.exit(1);
});
