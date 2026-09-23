const sharedHeader = `
  <div class="topbar">
    <div class="container topbar-inner">
      <div class="topbar-left">
        <a href="index.html">Seller Centre</a>
        <a href="index.html">Download</a>
        <a href="index.html">Follow us</a>
      </div>
      <div class="topbar-right">
        <a href="index.html">Login</a>
        <a href="signup.html">Sign Up</a>
      </div>
    </div>
  </div>

  <header class="header">
    <div class="container header-inner">
      <a class="logo" href="index.html">
        <div class="logo-mark">R</div>
        <div class="brand-copy">
          <strong>R手交易平台</strong>
        </div>
      </a>

      <nav class="main-nav" aria-label="Main navigation">
        <a href="index.html">熱門</a>
        <a href="index.html">手機</a>
        <a href="index.html">電器</a>
        <a href="index.html">收藏</a>
        <a href="index.html">拍賣</a>
      </nav>

      <div class="header-actions">
        <div class="notification-wrap">
          <button class="notification-bell" type="button" aria-label="通知" title="通知" aria-expanded="false">🔔</button>
          <div class="notification-panel" hidden>
            <strong>目前通知</strong>
            <ul>
              <li>你的商品已有人收藏</li>
              <li>有新的推薦商品上架</li>
              <li>購物車內有商品即將售罄</li>
            </ul>
          </div>
        </div>
        <div class="chat-bubble-wrap">
          <button class="chat-bubble" type="button" aria-label="聊天" title="聊天" aria-expanded="false">💬</button>
          <span class="chat-badge">3</span>
          <div class="action-panel" hidden>
            <strong>聊天</strong>
            <p>目前沒有新的聊天訊息。</p>
          </div>
        </div>
        <div class="cart-wrap">
          <button class="cart" type="button" aria-label="購物車" title="購物車" aria-expanded="false">🛒</button>
          <div class="action-panel" hidden>
            <strong>購物車</strong>
            <p>目前購物車是空的。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container header-search-row">
      <div class="search-box">
        <form class="search-bar" action="search.html" method="get">
          <input name="q" type="search" placeholder="搜尋商品、拍賣品、品牌" />
          <button class="search-btn">搜尋</button>
        </form>
        <div class="hot-search" id="recent-searches" aria-label="最近搜尋"></div>
      </div>
    </div>
  </header>`;

const sharedFooter = `
  <footer class="footer">
    <div class="container footer-inner">
      <span>© 2026 Shop Demo</span>
      <span>Free shipping over $50</span>
      <span>Customer support 24/7</span>
    </div>
  </footer>`;

document.querySelector('[data-component="header"]').outerHTML = sharedHeader;
document.querySelector('[data-component="footer"]').outerHTML = sharedFooter;

const recentSearchesKey = 'recentSearches';
const recentSearches = document.querySelector('#recent-searches');
const searchForm = document.querySelector('.search-bar');
const searchInput = searchForm.querySelector('input[name="q"]');

const readRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(recentSearchesKey)) || [];
  } catch {
    return [];
  }
};

const renderRecentSearches = () => {
  recentSearches.replaceChildren();
  readRecentSearches().forEach((term) => {
    const link = document.createElement('a');
    link.href = `search.html?q=${encodeURIComponent(term)}`;
    link.textContent = term;
    recentSearches.appendChild(link);
  });
};

searchForm.addEventListener('submit', () => {
  const term = searchInput.value.trim();
  if (!term) return;
  const searches = readRecentSearches().filter((item) => item.toLowerCase() !== term.toLowerCase());
  searches.unshift(term);
  localStorage.setItem(recentSearchesKey, JSON.stringify(searches.slice(0, 12)));
});

renderRecentSearches();

const notificationButton = document.querySelector('.notification-bell');
const notificationPanel = document.querySelector('.notification-panel');
const actionButtons = document.querySelectorAll('.chat-bubble, .cart');
const actionPanels = document.querySelectorAll('.notification-panel, .action-panel');
const panelButtons = [notificationButton, ...actionButtons];

const closeAllPanels = () => {
  actionPanels.forEach((panel) => panel.hidden = true);
  panelButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
};

notificationButton.addEventListener('click', () => {
  const isOpen = !notificationPanel.hidden;
  closeAllPanels();
  notificationPanel.hidden = isOpen;
  notificationButton.setAttribute('aria-expanded', String(!isOpen));
});

actionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.parentElement.querySelector('.action-panel');
    const isOpen = !panel.hidden;
    closeAllPanels();
    panel.hidden = isOpen;
    button.setAttribute('aria-expanded', String(!isOpen));
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.notification-wrap, .chat-bubble-wrap, .cart-wrap')) {
    closeAllPanels();
  }
});
