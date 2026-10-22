/**
 * logic.js - 核心推薦與過濾純邏輯模組
 * 不涉及 DOM 操作，純以資料運算為主，便於測試與維護。
 */

/**
 * 依據使用者選取條件過濾商品清單
 * @param {Array} products 原始商品陣列
 * @param {Object} filters 篩選條件
 * @param {string} [filters.tag] 選中的標籤或分類（'ALL' 代表不限）
 * @param {number} [filters.maxBudget] 預算上限 (含邊界 <= )
 * @param {string} [filters.query] 關鍵字搜尋字串
 * @returns {Array} 符合條件的商品陣列
 */
export function filterProducts(products, { tag = 'ALL', maxBudget = Infinity, query = '' } = {}) {
  if (!Array.isArray(products)) return [];

  const cleanQuery = query.trim().toLowerCase();

  return products.filter((item) => {
    // 1. 情境標籤篩選：比對 category 或 tags
    if (tag && tag !== 'ALL') {
      const matchCategory = item.category === tag;
      const matchTags = Array.isArray(item.tags) && item.tags.includes(tag);
      if (!matchCategory && !matchTags) {
        return false;
      }
    }

    // 2. 預算上限篩選 (價格需小於等於預算上限，包含邊界)
    if (typeof maxBudget === 'number' && !isNaN(maxBudget)) {
      if (item.price > maxBudget) {
        return false;
      }
    }

    // 3. 關鍵字搜尋：搜尋商品名稱、分類、標籤或推薦理由
    if (cleanQuery) {
      const inName = item.name && item.name.toLowerCase().includes(cleanQuery);
      const inCategory = item.category && item.category.toLowerCase().includes(cleanQuery);
      const inReason = item.reason && item.reason.toLowerCase().includes(cleanQuery);
      const inPainPoint = item.painPoint && item.painPoint.toLowerCase().includes(cleanQuery);
      const inTags = Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(cleanQuery));

      if (!inName && !inCategory && !inReason && !inPainPoint && !inTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 依推薦優先度排序（有庫存優先，其次按價格由低至高）
 * @param {Array} products 待排序商品陣列
 * @returns {Array} 排序後的商品陣列
 */
export function sortProducts(products) {
  return [...products].sort((a, b) => {
    // 缺貨項目稍微後置，但仍保留推薦
    const aStock = a.stock > 0 ? 1 : 0;
    const bStock = b.stock > 0 ? 1 : 0;
    if (aStock !== bStock) {
      return bStock - aStock;
    }
    return a.price - b.price;
  });
}

/**
 * 從商品清單中抽取所有可用情境標籤與分類
 * @param {Array} products
 * @returns {Array<string>} 標籤清單
 */
export function extractFilterTags(products) {
  if (!Array.isArray(products)) return [];
  const tagSet = new Set();
  
  products.forEach((item) => {
    if (item.category) tagSet.add(item.category);
    if (Array.isArray(item.tags)) {
      item.tags.forEach((t) => tagSet.add(t));
    }
  });

  return Array.from(tagSet);
}

/**
 * 計算統計資訊
 * @param {Array} products
 * @returns {Object} { count, minPrice, maxPrice, inStockCount, outOfStockCount }
 */
export function calculateStats(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return { count: 0, minPrice: 0, maxPrice: 0, inStockCount: 0, outOfStockCount: 0 };
  }

  const prices = products.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const inStockCount = products.filter((p) => p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  return {
    count: products.length,
    minPrice,
    maxPrice,
    inStockCount,
    outOfStockCount,
  };
}
