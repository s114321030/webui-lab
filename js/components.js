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
        <a href="index.html">Sign Up</a>
        <a href="index.html">Notification</a>
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
        <div class="chat-bubble-wrap">
          <div class="chat-bubble">💬</div>
          <span class="chat-badge">3</span>
        </div>
        <div class="cart">🛒</div>
      </div>
    </div>

    <div class="container header-search-row">
      <div class="search-box">
        <form class="search-bar" action="search.html" method="get">
          <input name="q" type="search" placeholder="搜尋商品、拍賣品、品牌" />
          <button class="search-btn">搜尋</button>
        </form>
        <div class="hot-search">
          <a href="index.html">電腦</a>
          <a href="index.html">手機</a>
          <a href="index.html">包包</a>
          <a href="index.html">書籍</a>
          <a href="index.html">公仔</a>
        </div>
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
