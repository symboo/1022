/**
 * test-acceptance.js - 驗收測試驗證腳本
 * 直接以 ACCEPTANCE.md 中的六個測試案例比對 products.json 與 logic.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { filterProducts, sortProducts, calculateStats } from './src/logic.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/products.json'), 'utf8'));

console.log('=== 開始執行 ACCEPTANCE.md 驗收案例檢查 ===\n');

let allPassed = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ 測試失敗: ${message}`);
    allPassed = false;
  } else {
    console.log(`✅ 通過: ${message}`);
  }
}

// 案例一：依情境標籤篩選「寢具」
console.log('--- [案例一] 標籤篩選：寢具 ---');
const case1 = filterProducts(products, { tag: '寢具' });
assert(case1.length === 2, `應找到 2 件商品，實際找到 ${case1.length} 件`);
const case1Ids = case1.map((p) => p.id);
assert(case1Ids.includes('dorm-001') && case1Ids.includes('dorm-010'), '商品應包含 dorm-001 與 dorm-010');

// 案例二：複合條件（標籤 收納清潔 + 預算 160）
console.log('\n--- [案例二] 複合篩選：收納清潔 + 預算 160 ---');
const case2 = filterProducts(products, { tag: '收納清潔', maxBudget: 160 });
assert(case2.length === 2, `應找到 2 件商品，實際找到 ${case2.length} 件`);
const case2Ids = case2.map((p) => p.id);
assert(case2Ids.includes('dorm-003') && case2Ids.includes('dorm-009'), '應包含 dorm-003 ($149) 與 dorm-009 ($89)');
assert(!case2Ids.includes('dorm-002'), '超過 160 元的 dorm-002 ($180) 應被排除');

// 案例三：邊界價格篩選（預算恰好等於 499）
console.log('\n--- [案例三] 邊界測試：預算恰好 499 ---');
const case3 = filterProducts(products, { tag: 'ALL', maxBudget: 499 });
const case3Lamp = case3.find((p) => p.id === 'dorm-004');
assert(case3Lamp !== undefined, '售價恰為 499 元的 dorm-004 必須包含在結果中 (<= 499)');
const over499 = case3.filter((p) => p.price > 499);
assert(over499.length === 0, `不應包含大於 499 元之商品，超出數量: ${over499.length}`);

// 案例四：空白或重設輸入（預設狀態）
console.log('\n--- [案例四] 空白或重設狀態 ---');
const case4 = filterProducts(products, { tag: 'ALL', maxBudget: 1500, query: '' });
assert(case4.length === 10, `應完整返回全量 10 件商品，實際返回: ${case4.length}`);

// 案例五：無匹配結果輸入（搜尋電吉他 或 預算 20）
console.log('\n--- [案例五] 無匹配結果：電吉他 與 預算 20 ---');
const case5A = filterProducts(products, { query: '電吉他' });
assert(case5A.length === 0, `搜尋「電吉他」應查無商品，實際返回: ${case5A.length}`);
const case5B = filterProducts(products, { maxBudget: 20 });
assert(case5B.length === 0, `預算 20 元應查無商品，實際返回: ${case5B.length}`);

// 案例六：缺貨商品特殊呈現
console.log('\n--- [案例六] 缺貨商品檢查 (stock === 0) ---');
const outOfStockItems = products.filter((p) => p.stock === 0);
assert(outOfStockItems.length >= 1, `應至少有一件 stock 為 0 的商品，實際有 ${outOfStockItems.length} 件`);
const stats = calculateStats(products);
assert(stats.outOfStockCount >= 1, `統計數字應正確計算出缺貨件數，目前為: ${stats.outOfStockCount}`);

console.log('\n=======================================');
if (allPassed) {
  console.log('🎉 恭喜！ACCEPTANCE.md 中全部 6 個測試案例皆 100% 通過！');
} else {
  console.error('❌ 有部分測試未通過，請檢查邏輯！');
  process.exit(1);
}
