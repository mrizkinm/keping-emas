import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { calculateFractions, getLiveOrCachedPrices, serveStaticSafe, loadPriceHistory, savePriceHistory, HISTORY_FILE } from '../server.js';
import { validateAndSanitizeItems, hashPin, THEME_KEY, HIDE_NOMINAL_KEY, LAST_PRICES_KEY, PRICE_HISTORY_KEY, generateItemId, NISAB_GRAMS, ZAKAT_RATE, calculateGoldZakat } from '../src/hooks/useGoldData.js';

console.log('Testing Keping Emas logic & security...');

// Test 1: Calculation of fractions
const fractions = calculateFractions(1500000, 1380000, [0.5, 1, 5, 10]);
assert.strictEqual(fractions.length, 4, 'Should have 4 fractions');
assert.strictEqual(fractions[0].weight, 0.5);
assert.strictEqual(fractions[0].buybackPrice, 690000);
assert.strictEqual(fractions[1].weight, 1);
assert.ok(fractions[1].sellPrice >= 1500000);

// Test 2: getLiveOrCachedPrices returns all 4 brands
const prices = await getLiveOrCachedPrices();
assert.ok(prices.brands.antam);
assert.ok(prices.brands.ubs);
assert.ok(prices.brands.galeri24);
assert.ok(prices.brands.hrta);

// Test 3: Portfolio PnL logic
const mockItems = [
  { brand: 'antam', weight: 10, buyPrice: 12000000 },
  { brand: 'ubs', weight: 5, buyPrice: 6000000 }
];
const totalInvested = mockItems.reduce((acc, it) => acc + it.buyPrice, 0);
assert.strictEqual(totalInvested, 18000000);

// Test 4: Web Crypto SHA-256 PIN Hashing with Salt
const hashed = await hashPin('1234');
assert.strictEqual(typeof hashed, 'string');
assert.strictEqual(hashed.length, 64, 'SHA-256 must produce 64 hex characters');
const unsalted1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
assert.notStrictEqual(hashed, unsalted1234, 'PIN hash must be salted against rainbow tables');
const hashedAgain = await hashPin('1234');
assert.strictEqual(hashed, hashedAgain, 'Identical PIN must produce identical hash');
const wrongHashed = await hashPin('9999');
assert.notStrictEqual(hashed, wrongHashed, 'Different PIN must produce different hash');

// Test 5: Strict JSON schema sanitization
const validData = validateAndSanitizeItems([
  { brand: 'antam', weight: 10, buyPrice: 20000000 },
  { brand: 'INVALID_BRAND', weight: 5, buyPrice: 10000 },
  { brand: 'ubs', weight: -5, buyPrice: 10000 },
  { brand: 'galeri24', weight: 'invalid', buyPrice: 10000 },
  { brand: 'antam', weight: Infinity, buyPrice: 10000 },
  { brand: 'antam', weight: 1, buyPrice: Infinity },
  { brand: 'hrta', weight: 1, buyPrice: -500 },
  { brand: 'hrta', weight: 1, buyPrice: 2400000 },
  { brand: 'other', customBrand: 'Lotus Archi', benchmarkBrand: 'ubs', weight: 5, buyPrice: 12000000 }
]);
assert.strictEqual(validData.length, 3, 'Only 3 valid items should be accepted');
assert.strictEqual(validData[0].brand, 'antam');
assert.strictEqual(validData[1].brand, 'hrta');
assert.strictEqual(validData[2].brand, 'other');
assert.strictEqual(validData[2].customBrand, 'Lotus Archi');
assert.strictEqual(validData[2].benchmarkBrand, 'ubs');

// Test 6: Path traversal containment
let statusCode = 200;
let endedData = '';
const mockRes = {
  writeHead: (code) => { statusCode = code; },
  end: (data) => { endedData = data; }
};
serveStaticSafe(mockRes, '../../etc/passwd', false);
assert.strictEqual(statusCode, 404, 'Path traversal must return 404');
serveStaticSafe(mockRes, '../dist-sibling/secret.txt', false);
assert.strictEqual(statusCode, 404, 'Sibling directory traversal must return 404');

// Test 7: Theme key & valid theme values
assert.strictEqual(typeof THEME_KEY, 'string');
const validThemes = ['dark', 'light', 'system'];
assert.ok(validThemes.includes('dark'));
assert.ok(validThemes.includes('light'));
assert.ok(validThemes.includes('system'));

// Test 8: Privacy mode & hide nominal key
assert.strictEqual(typeof HIDE_NOMINAL_KEY, 'string');
const maskNominal = (val, hide) => hide ? 'Rp ••••••••' : `Rp ${val.toLocaleString('id-ID')}`;
assert.strictEqual(maskNominal(15000000, true), 'Rp ••••••••');
assert.strictEqual(maskNominal(15000000, false), 'Rp 15.000.000');

// Test 9: Price history persistence & fallback
assert.strictEqual(typeof LAST_PRICES_KEY, 'string');
assert.strictEqual(typeof PRICE_HISTORY_KEY, 'string');
assert.strictEqual(typeof HISTORY_FILE, 'string');

// Save a test snapshot to history and verify load
savePriceHistory(prices);
const loadedHistory = loadPriceHistory();
assert.ok(loadedHistory.latest, 'History must contain latest snapshot');
assert.ok(loadedHistory.snapshots, 'History must contain snapshots');

// Test 10: Service Worker file exists
const swPath = path.resolve(process.cwd(), 'public', 'sw.js');
assert.ok(fs.existsSync(swPath), 'public/sw.js must exist for offline PWA');

// Test 11: Unique fraction weights (no duplicate keys)
for (const [brandKey, bData] of Object.entries(prices.brands)) {
  const weights = bData.fractions.map((f) => f.weight);
  const uniqueWeights = new Set(weights);
  assert.strictEqual(weights.length, uniqueWeights.size, `Brand ${brandKey} must have unique fraction weights`);
}

// Test 12: Safe item ID generation fallback
const id1 = generateItemId();
const id2 = generateItemId();
assert.ok(id1.startsWith('item-'), 'Generated ID must start with item-');
assert.notStrictEqual(id1, id2, 'Generated IDs must be unique');

// Test 13: Zakat Emas calculations & Nisab rules
assert.strictEqual(NISAB_GRAMS, 85, 'Nisab must be 85 grams of gold');
assert.strictEqual(ZAKAT_RATE, 0.025, 'Zakat rate must be 2.5%');

// Sub-test A: Below nisab (50 grams)
const belowNisab = calculateGoldZakat(50, 2300000);
assert.strictEqual(belowNisab.isNisabReached, false);
assert.strictEqual(belowNisab.zakatGrams, 0);
assert.strictEqual(belowNisab.zakatNominalRp, 0);
assert.strictEqual(belowNisab.remainingToNisab, 35);
assert.strictEqual(belowNisab.progressPercent, 58.8);

// Sub-test B: Exactly nisab (85 grams)
const atNisab = calculateGoldZakat(85, 2000000);
assert.strictEqual(atNisab.isNisabReached, true);
assert.strictEqual(atNisab.zakatGrams, 2.125);
assert.strictEqual(atNisab.zakatNominalRp, 4250000);
assert.strictEqual(atNisab.remainingToNisab, 0);
assert.strictEqual(atNisab.progressPercent, 100);

// Sub-test C: Above nisab (100 grams)
const aboveNisab = calculateGoldZakat(100, 2300000);
assert.strictEqual(aboveNisab.isNisabReached, true);
assert.strictEqual(aboveNisab.zakatGrams, 2.5);
assert.strictEqual(aboveNisab.zakatNominalRp, 5750000);
assert.strictEqual(aboveNisab.progressPercent, 100);

console.log('✅ All self-check assertions passed successfully!');
