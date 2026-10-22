/**
 * main.js - 應用程式進入點與狀態管理協調者
 * 連接 logic.js (商業邏輯) 與 ui.js (DOM 呈現)
 */

import { filterProducts, sortProducts, extractFilterTags, calculateStats } from './logic.js';
import {
  renderHero,
  renderFilterPanel,
  renderCardGrid,
  renderStatsText,
} from './ui.js';

// 應用程式狀態 (State)
const state = {
  rawProducts: [],
  currentTag: 'ALL',
  currentBudget: 1500,
  currentQuery: '',
  maxPrice: 1500,
  availableTags: [],
};

const appElement = document.getElementById('app');

/**
 * 重新計算並局部刷新商品清單與統計列
 */
function updateProductView() {
  const filtered = filterProducts(state.rawProducts, {
    tag: state.currentTag,
    maxBudget: state.currentBudget,
    query: state.currentQuery,
  });

  const sorted = sortProducts(filtered);
  const stats = calculateStats(sorted);

  // 1. 更新卡片清單或空狀態
  const gridContainer = document.getElementById('grid-container');
  if (gridContainer) {
    gridContainer.innerHTML = renderCardGrid(sorted);
  }

  // 2. 更新統計數字
  const statsInfo = document.getElementById('stats-info');
  if (statsInfo) {
    statsInfo.innerHTML = renderStatsText(stats);
  }

  // 3. 綁定空狀態的重設按鈕（如果出現空狀態）
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', handleReset);
  }
}

/**
 * 重設所有條件回初始狀態
 */
function handleReset() {
  state.currentTag = 'ALL';
  state.currentBudget = state.maxPrice;
  state.currentQuery = '';

  // 更新控制項的顯示
  const slider = document.getElementById('budget-slider');
  if (slider) slider.value = state.maxPrice;

  const budgetDisplay = document.getElementById('budget-display');
  if (budgetDisplay) budgetDisplay.textContent = `NT$ ${state.maxPrice.toLocaleString()} 以內`;

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  // 移除清除按鈕
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.remove();

  // 更新標籤按鈕高亮
  const tagButtons = document.querySelectorAll('.tag-btn');
  tagButtons.forEach((btn) => {
    const isAll = btn.getAttribute('data-tag') === 'ALL';
    btn.classList.toggle('active', isAll);
    btn.setAttribute('aria-pressed', isAll ? 'true' : 'false');
  });

  updateProductView();
}

/**
 * 綁定控制面板事件監聽
 */
function setupEventListeners() {
  // 1. 標籤點擊切換
  const tagGroup = document.getElementById('tag-group');
  if (tagGroup) {
    tagGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.tag-btn');
      if (!btn) return;

      const selectedTag = btn.getAttribute('data-tag');
      if (state.currentTag === selectedTag) return;

      state.currentTag = selectedTag;

      document.querySelectorAll('.tag-btn').forEach((b) => {
        const isActive = b.getAttribute('data-tag') === selectedTag;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      updateProductView();
    });
  }

  // 2. 預算滑桿輸入
  const slider = document.getElementById('budget-slider');
  const budgetDisplay = document.getElementById('budget-display');
  if (slider && budgetDisplay) {
    slider.addEventListener('input', (e) => {
      const value = Number(e.target.value);
      state.currentBudget = value;
      budgetDisplay.textContent = `NT$ ${value.toLocaleString()} 以內`;
      updateProductView();
    });
  }

  // 3. 關鍵字搜尋輸入（即時過濾）
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.currentQuery = e.target.value;

      // 動態更新清除按鈕
      const searchWrapper = searchInput.parentElement;
      let clearBtn = document.getElementById('clear-search-btn');
      if (state.currentQuery && !clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.id = 'clear-search-btn';
        clearBtn.type = 'button';
        clearBtn.className = 'clear-search-btn';
        clearBtn.title = '清除關鍵字';
        clearBtn.textContent = '✕';
        clearBtn.addEventListener('click', () => {
          state.currentQuery = '';
          searchInput.value = '';
          clearBtn.remove();
          updateProductView();
        });
        searchWrapper.appendChild(clearBtn);
      } else if (!state.currentQuery && clearBtn) {
        clearBtn.remove();
      }

      updateProductView();
    });
  }

  // 4. 重設按鈕點擊
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }
}

/**
 * 完整初始頁面渲染
 */
function renderApp() {
  appElement.innerHTML = `
    ${renderHero()}
    ${renderFilterPanel({
      tags: state.availableTags,
      currentTag: state.currentTag,
      currentBudget: state.currentBudget,
      currentQuery: state.currentQuery,
      maxAvailablePrice: state.maxPrice,
    })}
    <main id="grid-container" class="main-content">
      <!-- 卡片列表動態注入 -->
    </main>
  `;

  setupEventListeners();
  updateProductView();
}

/**
 * 啟動與載入商品資料
 */
async function initApp() {
  try {
    const response = await fetch('/products.json');
    if (!response.ok) {
      throw new Error(`無法取得商品資料（HTTP ${response.status}）`);
    }

    const data = await response.json();
    state.rawProducts = data;

    // 依資料動態計算標籤與最高價格
    state.availableTags = extractFilterTags(data);
    const maxItemPrice = Math.max(...data.map((p) => p.price), 1000);
    state.maxPrice = maxItemPrice;
    state.currentBudget = maxItemPrice;

    renderApp();
  } catch (err) {
    console.error('初始化失敗:', err);
    appElement.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: #dc2626;">
        <h2>⚠️ 商品資料載入失敗</h2>
        <p style="margin-top: 8px; color: #64748b;">請確認 <code>public/products.json</code> 檔案存在且格式正確。</p>
        <p style="margin-top: 4px; font-size: 0.9rem; color: #94a3b8;">錯誤訊息: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// 啟動應用
initApp();
