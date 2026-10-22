/**
 * ui.js - 畫面渲染與 DOM 呈現模組
 * 負責將資料與狀態轉換為乾淨、無障礙且符合 SPEC 的 HTML 元件。
 */

/**
 * 轉義 HTML 特殊字元防止 XSS
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 渲染頂部 Hero 導引
 */
export function renderHero() {
  return `
    <header class="hero-section">
      <div class="hero-badge">🎒 大一新生必看・開學季專屬指南</div>
      <h1 class="hero-title">校園宿舍生活用品推薦</h1>
      <p class="hero-subtitle">
        第一次住校不知道該買什麼？怕花冤枉錢或踩雷？<br />
        依據你的預算與生活情境，為你推薦最實用的宿舍好物清單與挑選理由！
      </p>
    </header>
  `;
}

/**
 * 渲染篩選控制面板
 * @param {Object} options
 * @param {Array<string>} options.tags 可用標籤清單
 * @param {string} options.currentTag 當前選中標籤
 * @param {number} options.currentBudget 當前預算上限
 * @param {string} options.currentQuery 當前搜尋關鍵字
 * @param {number} options.maxAvailablePrice 商品最高價格（用於拉桿最大值）
 */
export function renderFilterPanel({ tags, currentTag, currentBudget, currentQuery, maxAvailablePrice }) {
  const allTags = ['ALL', ...tags];

  const tagButtons = allTags
    .map((tag) => {
      const isActive = tag === currentTag;
      const label = tag === 'ALL' ? '全部推薦' : tag;
      return `
        <button 
          type="button" 
          class="tag-btn ${isActive ? 'active' : ''}" 
          data-tag="${escapeHtml(tag)}"
          aria-pressed="${isActive}"
        >
          ${escapeHtml(label)}
        </button>
      `;
    })
    .join('');

  return `
    <section class="filter-panel" aria-label="篩選條件區">
      <div class="filter-group">
        <label class="filter-label">🎯 生活情境標籤：</label>
        <div class="tag-group" id="tag-group">
          ${tagButtons}
        </div>
      </div>

      <div class="filter-controls-row">
        <div class="budget-control">
          <div class="budget-header">
            <label for="budget-slider" class="filter-label">💰 預算上限：</label>
            <span class="budget-value" id="budget-display">NT$ ${currentBudget.toLocaleString()} 以內</span>
          </div>
          <input 
            type="range" 
            id="budget-slider" 
            min="50" 
            max="${maxAvailablePrice || 1500}" 
            step="10" 
            value="${currentBudget}"
            class="range-slider"
          />
          <div class="budget-hints">
            <span>NT$ 50</span>
            <span>NT$ ${maxAvailablePrice || 1500}</span>
          </div>
        </div>

        <div class="search-control">
          <label for="search-input" class="filter-label">🔍 關鍵字搜尋：</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              id="search-input" 
              placeholder="搜尋品名、標籤或理由 (如: 檯燈、耳塞)..." 
              value="${escapeHtml(currentQuery)}"
              class="search-input"
            />
            ${currentQuery ? '<button type="button" id="clear-search-btn" class="clear-search-btn" title="清除關鍵字">✕</button>' : ''}
          </div>
        </div>
      </div>

      <div class="filter-actions-row">
        <div class="stats-info" id="stats-info" aria-live="polite">
          <!-- 統計數字動態注入 -->
        </div>
        <button type="button" id="reset-btn" class="reset-btn">
          🔄 重設所有條件
        </button>
      </div>
    </section>
  `;
}

/**
 * 渲染單一商品卡片 HTML
 */
export function renderProductCard(item) {
  const isOutOfStock = item.stock <= 0;
  const stockBadge = isOutOfStock
    ? `<span class="badge badge-out-of-stock">⚠️ 補貨中 / 已售罄</span>`
    : `<span class="badge badge-in-stock">現貨充足 (${item.stock} 件)</span>`;

  const tagsList = Array.isArray(item.tags)
    ? item.tags.map((t) => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')
    : '';

  return `
    <article 
      class="product-card ${isOutOfStock ? 'is-out-of-stock' : ''}" 
      data-id="${escapeHtml(item.id)}"
      style="--card-bg-tint: ${escapeHtml(item.color || '#F8FAFC')};"
    >
      <div class="card-header">
        <div class="card-icon" role="img" aria-label="${escapeHtml(item.name)} 圖示">
          ${item.icon || '📦'}
        </div>
        <div class="card-badges">
          <span class="category-pill">${escapeHtml(item.category || '生活用品')}</span>
          ${stockBadge}
        </div>
      </div>

      <div class="card-body">
        <h3 class="product-name">${escapeHtml(item.name)}</h3>
        <div class="product-price">
          <span class="price-currency">NT$</span>
          <span class="price-amount">${item.price.toLocaleString()}</span>
        </div>

        <div class="product-tags">
          ${tagsList}
        </div>

        <div class="reason-box">
          <div class="reason-header">
            <span class="reason-icon">🌟</span>
            <span class="reason-title">大一新生推薦理由</span>
          </div>
          <p class="reason-content">${escapeHtml(item.reason || '適合宿舍實用生活場景。')}</p>
        </div>
      </div>
    </article>
  `;
}

/**
 * 渲染商品卡片清單網格
 */
export function renderCardGrid(products) {
  if (!products || products.length === 0) {
    return renderEmptyState();
  }

  const cardsHtml = products.map((item) => renderProductCard(item)).join('');
  return `
    <section class="product-grid" aria-label="推薦商品列表">
      ${cardsHtml}
    </section>
  `;
}

/**
 * 渲染查無結果的空狀態
 */
export function renderEmptyState() {
  return `
    <div class="empty-state-card" role="region" aria-label="無符合商品">
      <div class="empty-icon">🎒🔍</div>
      <h3 class="empty-title">哎呀！目前沒有找到符合條件的宿舍生活好物</h3>
      <p class="empty-desc">
        可能目前的預算設定較嚴苛，或是關鍵字沒有比對到對應商品。<br />
        不妨試著放寬預算上限，或點擊下方按鈕重新尋找！
      </p>
      <button type="button" id="empty-reset-btn" class="empty-reset-btn">
        一鍵重設所有條件
      </button>
    </div>
  `;
}

/**
 * 渲染統計資訊
 */
export function renderStatsText({ count, inStockCount, outOfStockCount }) {
  if (count === 0) {
    return `<span class="stats-count">共找到 <strong>0</strong> 件符合推薦的宿舍好物</span>`;
  }
  
  let extraText = '';
  if (outOfStockCount > 0) {
    extraText = ` <span class="stats-outofstock-hint">(含 ${outOfStockCount} 件補貨中)</span>`;
  }

  return `
    <span class="stats-count">
      共找到 <strong>${count}</strong> 件符合推薦的宿舍好物${extraText}
    </span>
  `;
}
