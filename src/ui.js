/**
 * ui.js - 畫面渲染與 DOM 呈現模組 (進階深色質感護眼版)
 * 沉浸式暗色美學、玻璃擬態質感、大學生活趣味痛點與生動推薦。
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
      <div class="hero-badge">⛺ 大一新生避坑指南・深色護眼版</div>
      <h1 class="hero-title">校園宿舍生活用品推薦</h1>
      <p class="hero-subtitle">
        「開學不迷茫，室友不打架」—— 告別腰酸背痛與發霉地獄！<br />
        學長姐血淚親測的必備神物清單，讓你的大學宿舍生活舒適度直接拉滿。
      </p>
      <div class="hero-tips-ticker">
        <span>💡 友善提醒：點擊下方標籤或拉動預算上限，立刻為你找出宿舍生存最佳解！</span>
      </div>
    </header>
  `;
}

/**
 * 標籤友善圖示對照
 */
const TAG_ICONS = {
  ALL: '✨ 全部好物',
  寢具: '🛏️ 寢具睡眠',
  收納清潔: '🧺 收納清潔',
  個人盥洗: '🧴 個人盥洗',
  書桌自習: '💡 書桌自習',
  生活雜物: '🎧 生活雜物',
  電器烹飪: '🍲 電器煮食',
  必備: '🔥 開學必備',
  收納: '📦 空間收納',
  清潔: '🧹 打掃除塵',
  衛浴: '🚿 衛浴快乾',
  銅板價: '🪙 銅板好物',
  高CP值: '💯 高CP值',
  舒適睡眠: '😴 舒適好眠',
  熱銷: '👑 熱賣排行',
  護眼: '👀 護眼省電',
  省電: '⚡ 低功耗',
  省空間: '📐 空間魔法',
  上鋪救星: '🧗 上鋪神器',
  防打呼: '🛡️ 隔絕打呼',
  煮食: '🍜 宵夜救星',
  省錢: '💵 省錢首選',
  快乾: '💨 速乾防霉',
  隱私: '🔒 個人隱私',
  避光: '🌑 遮光阻眠',
  缺貨熱賣: '🔥 狂銷補貨中',
};

/**
 * 渲染篩選控制面板
 */
export function renderFilterPanel({ tags, currentTag, currentBudget, currentQuery, maxAvailablePrice }) {
  const allTags = ['ALL', ...tags];

  const tagButtons = allTags
    .map((tag) => {
      const isActive = tag === currentTag;
      const label = TAG_ICONS[tag] || `#${tag}`;
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
        <div class="filter-title-row">
          <label class="filter-label">🎯 生活情境與痛點標籤：</label>
          <span class="filter-subhint">點選快速鎖定需求</span>
        </div>
        <div class="tag-group" id="tag-group">
          ${tagButtons}
        </div>
      </div>

      <div class="filter-controls-row">
        <div class="budget-control">
          <div class="budget-header">
            <label for="budget-slider" class="filter-label">💰 荷包預算上限：</label>
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
            <span>NT$ 50 (銅板省錢)</span>
            <span>NT$ ${(maxAvailablePrice || 1500).toLocaleString()} (無拘預算)</span>
          </div>
        </div>

        <div class="search-control">
          <label for="search-input" class="filter-label">🔍 關鍵字搜尋：</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              id="search-input" 
              placeholder="搜尋品名、標籤或避雷痛點 (例: 耳塞、打呼、快煮鍋)..." 
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
          🔄 一鍵還原預設
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
    ? `<span class="badge badge-out-of-stock">⚡ 搶購一空 / 補貨中</span>`
    : `<span class="badge badge-in-stock">現貨充裕 (${item.stock} 件)</span>`;

  const tagsList = Array.isArray(item.tags)
    ? item.tags.map((t) => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')
    : '';

  const accentColor = item.color || '#818cf8';

  return `
    <article 
      class="product-card ${isOutOfStock ? 'is-out-of-stock' : ''}" 
      data-id="${escapeHtml(item.id)}"
      style="--item-accent: ${escapeHtml(accentColor)};"
    >
      <div class="card-glow-halo"></div>

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

        ${
          item.painPoint
            ? `
          <div class="pain-point-box">
            <span class="pain-icon">🚨 宿民痛點：</span>
            <span class="pain-text">${escapeHtml(item.painPoint)}</span>
          </div>
        `
            : ''
        }

        <div class="reason-box">
          <div class="reason-header">
            <span class="reason-icon">🌟</span>
            <span class="reason-title">學長姐推薦理由</span>
          </div>
          <p class="reason-content">${escapeHtml(item.reason || '適合宿舍實用生活場景。')}</p>
        </div>

        <div class="product-tags">
          ${tagsList}
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
      <div class="empty-icon">🛸🎒</div>
      <h3 class="empty-title">哎呀！條件比舍監查房還嚴苛～</h3>
      <p class="empty-desc">
        目前沒有同時滿足這些條件的宿舍神器。<br />
        試著放寬預算上限、清除關鍵字，或是換一個情境標籤看看！
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
export function renderStatsText({ count, outOfStockCount }) {
  if (count === 0) {
    return `<span class="stats-count">共找到 <strong>0</strong> 件符合條件的好物</span>`;
  }

  let extraText = '';
  if (outOfStockCount > 0) {
    extraText = ` <span class="stats-outofstock-hint">(含 ${outOfStockCount} 件瘋搶補貨中)</span>`;
  }

  return `
    <span class="stats-count">
      共找到 <strong>${count}</strong> 件符合推薦的宿舍神器${extraText}
    </span>
  `;
}
