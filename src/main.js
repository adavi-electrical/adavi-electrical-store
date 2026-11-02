import './style.css'
import { supabase } from './supabase.js'

let products = []
let categories = ['همه محصولات']
const state = {
  category: 'همه محصولات',
  search: '',
  cart: loadCart()
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('adavi-cart') || '[]')
    if (!Array.isArray(saved)) return []
    return saved
      .filter(item => item && item.id !== undefined && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0)
      .map(item => ({ id: String(item.id), quantity: Number(item.quantity) }))
  } catch {
    return []
  }
}

function saveCart() {
  try {
    localStorage.setItem('adavi-cart', JSON.stringify(state.cart))
  } catch (error) {
    console.error('ذخیره سبد خرید انجام نشد:', error)
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char])
}

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="#" aria-label="صفحه اصلی فروشگاه اداوی">
        <span class="brand-mark">⚡</span>
        <span><strong>فروشگاه برق اداوی</strong><small>تجهیزات و کالای برق</small></span>
      </a>
      <nav class="main-nav" aria-label="منوی اصلی">
        <a href="#products">محصولات</a>
        <a href="#portfolio">نمونه‌کارها</a>
        <a href="#services">خدمات</a>
        <a href="#about">درباره ما</a>
        <a href="#contact">ارتباط با ما</a>
      </nav>
      <button class="cart-button" id="cartButton" type="button">
        <span aria-hidden="true">🛒</span> سبد خرید <b id="cartCount">۰</b>
      </button>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container hero-content">
        <div class="hero-copy">
          <span class="eyebrow"><i></i> فروشگاه تخصصی تجهیزات برق</span>
          <h1>انتخاب مطمئن برای<br><em>روشنایی و برق ساختمان</em></h1>
          <p>تأمین تجهیزات برق و روشنایی، همراه با خدمات فنی و مهندسی.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#products">مشاهده محصولات <span>←</span></a>
            <a class="button button-ghost" href="#contact">تماس با فروشگاه</a>
          </div>
          <div class="hero-note"><span>✓</span> مشاوره و راهنمایی برای انتخاب تجهیزات</div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="glow"></div><div class="orb orb-one">⚡</div>
          <div class="orb orb-two">💡</div><div class="orb orb-three">🔌</div>
          <div class="art-caption"><b>ADAVI</b><small>ELECTRICAL STORE</small></div>
        </div>
      </div>
    </section>

    <section class="benefits">
      <div class="container benefit-grid">
        <div><span>01</span><p><b>تجهیزات روشنایی</b><small>لامپ، پنل و ریسه</small></p></div>
        <div><span>02</span><p><b>لوازم برق ساختمان</b><small>سیم، کابل و ملزومات</small></p></div>
        <div><span>03</span><p><b>خدمات تخصصی</b><small>اجرا و مشاوره فنی</small></p></div>
      </div>
    </section>

    <section class="section products-section" id="products">
      <div class="container">
        <div class="section-top">
          <div><span class="section-kicker">کاتالوگ فروشگاه</span><h2>محصولات ما</h2><p>محصول موردنظرتان را جست‌وجو یا دسته‌بندی کنید.</p></div>
          <label class="search-box"><span>⌕</span><input id="search" type="search" placeholder="جست‌وجوی محصول..." autocomplete="off"><kbd>جست‌وجو</kbd></label>
        </div>
        <div class="categories" id="categories" aria-label="دسته‌بندی محصولات"></div>
        <div class="product-grid" id="productGrid" aria-live="polite"><div class="empty-state">در حال دریافت محصولات...</div></div>
        <p class="catalog-note">برای اطلاع از قیمت و موجودی روز، با فروشگاه تماس بگیرید.</p>
      </div>
    </section>
<section class="section portfolio-section" id="portfolio">
  <div class="container">
    <div class="section-top">
      <div>
        <span class="section-kicker">تجربه و اجرا</span>
        <h2>نمونه‌کارهای ما</h2>
        <p>بخشی از پروژه‌ها و خدمات اجرایی فروشگاه اداوی</p>
      </div>
    </div>
    <div class="portfolio-grid" id="portfolioGrid">
      <div class="empty-state">در حال دریافت نمونه‌کارها...</div>
    </div>
  </div>
</section>
    <section class="services-section section" id="services">
      <div class="container services-layout">
        <div class="services-heading"><span class="section-kicker">خدمات فنی و مهندسی</span><h2>فراتر از فروش تجهیزات برق</h2><p>در کنار تأمین کالا، برای اجرای پروژه‌های برقی نیز همراه شما هستیم.</p></div>
        <div class="service-list">
          <article><span>⌁</span><div><h3>اجرای برق ساختمان</h3><p>اجرای تأسیسات و سیم‌کشی برق ساختمان</p></div></article>
          <article><span>▦</span><div><h3>طراحی و مونتاژ تابلو برق</h3><p>خدمات فنی در زمینه تابلوهای برق صنعتی</p></div></article>
          <article><span>⌂</span><div><h3>هوشمندسازی ساختمان</h3><p>راهکارهای هوشمند برای کنترل و مدیریت ساختمان</p></div></article>
        </div>
      </div>
    </section>

    <section class="about-section section" id="about">
      <div class="container about-card">
        <div class="about-symbol">⚡</div>
        <div><span class="section-kicker">درباره فروشگاه</span><h2>فروشگاه تجهیزات و کالای برق اداوی</h2><p>تلاش ما ارائه تجهیزات برق و روشنایی در کنار مشاوره و خدمات فنی و مهندسی است.</p></div>
      </div>
    </section>
  </main>

  <footer id="contact">
    <div class="container footer-grid">
      <div><a class="brand footer-brand" href="#"><span class="brand-mark">⚡</span><span><strong>فروشگاه برق اداوی</strong><small>تجهیزات و کالای برق</small></span></a><p class="footer-desc">مجری و کارشناس: مهندس اداوی</p></div>
      <div><h3>ارتباط با ما</h3><a href="tel:09904230726">محسن اداوی: 09904230726</a><a href="tel:09229836047">احسان اداوی: 09229836047</a></div>
      <div><h3>نشانی فروشگاه</h3><p>اصفهان، نجف‌آباد، بلوار حجتی، کوچه شفیعی، نبش کوچه</p></div>
    </div>
    <div class="container copyright">تمام حقوق متعلق به فروشگاه تجهیزات و کالای برق اداوی است.</div>
  </footer>

  <div class="modal-backdrop" id="cartModal" hidden>
    <section class="cart-modal" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
      <div class="modal-head"><h2 id="cartTitle">سبد خرید شما</h2><button id="closeCart" aria-label="بستن" type="button">×</button></div>
      <div id="cartItems"></div>
     <div class="order-customer-info">
  <h3>اطلاعات مشتری</h3>
  <input id="customerName" type="text" placeholder="نام و نام خانوادگی">
  <input id="customerPhone" type="tel" placeholder="شماره تماس">
  <textarea id="customerAddress" placeholder="نشانی کامل برای تحویل یا هماهنگی"></textarea>
</div>
      <div class="modal-actions"><button class="button button-ghost" id="continueShopping" type="button">ادامه خرید</button><button class="button button-primary" id="sendOrder" type="button">ارسال درخواست سفارش</button></div>
      <p class="modal-hint">ثبت نهایی سفارش و تأیید قیمت با هماهنگی فروشگاه انجام می‌شود.</p>
    </section>
  </div>
`

const grid = document.querySelector('#productGrid')
const cartCount = document.querySelector('#cartCount')
const cartModal = document.querySelector('#cartModal')
const cartItemsContainer = document.querySelector('#cartItems')
async function loadPortfolio() {
  const container = document.querySelector('#portfolioGrid')
  if (!container) return

  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('خطا در دریافت نمونه‌کارها:', error)
    container.innerHTML = '<div class="empty-state">دریافت نمونه‌کارها با خطا روبه‌رو شد.</div>'
    return
  }

  const items = data || []

  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state">نمونه‌کاری برای نمایش ثبت نشده است.</div>'
    return
  }

  container.innerHTML = items.map(item => {
    const image = item.image_url
      ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">`
      : '<div class="portfolio-placeholder">⚡</div>'

    return `
      <article class="portfolio-card">
        <div class="portfolio-image">${image}</div>
        <div class="portfolio-info">
          <h3>${escapeHtml(item.title || 'پروژه اجرایی')}</h3>
          <p>${escapeHtml(item.description || '')}</p>
        </div>
      </article>
    `
  }).join('')
}
function renderCategories() {
  const container = document.querySelector('#categories')
  container.innerHTML = categories.map(category => `
    <button type="button" class="category-button ${state.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join('')
}

function renderProducts() {
  const normalizedSearch = state.search.trim().toLocaleLowerCase('fa')
  const filtered = products.filter(product => {
    const categoryMatch = state.category === 'همه محصولات' || product.category === state.category
    const searchableText = `${product.name} ${product.detail} ${product.category}`.toLocaleLowerCase('fa')
    return categoryMatch && searchableText.includes(normalizedSearch)
  })

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">محصولی با این مشخصات پیدا نشد.</div>'
    return
  }

  grid.innerHTML = filtered.map(product => {
    const visual = product.imageUrl
      ? `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" style="width:100%;height:100%;object-fit:contain;padding:12px">`
      : `<span class="product-icon" aria-hidden="true">💡</span>`

    return `
      <article class="product-card">
        <div class="product-visual"><span class="product-badge">${escapeHtml(product.badge)}</span>${visual}</div>
        <div class="product-info">
          <span class="product-category">${escapeHtml(product.category)}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.detail)}</p>
          <div class="product-bottom"><strong>${escapeHtml(product.priceLabel)}</strong><button type="button" class="add-button" data-add="${escapeHtml(product.id)}">افزودن به سبد <span>＋</span></button></div>
        </div>
      </article>
    `
  }).join('')
}

function renderCart() {
  cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('fa')

  const validItems = state.cart.filter(item => products.some(product => product.id === item.id))
  if (validItems.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-state">سبد خرید شما هنوز خالی است.</div>'
    return
  }

  cartItemsContainer.innerHTML = validItems.map(item => {
    const product = products.find(entry => entry.id === item.id)
    return `<div class="cart-row"><div><b>${escapeHtml(product.name)}</b><small>${escapeHtml(product.priceLabel)}</small></div><div class="quantity-control"><button type="button" data-decrease="${escapeHtml(item.id)}" aria-label="کم کردن">−</button><span>${item.quantity.toLocaleString('fa')}</span><button type="button" data-increase="${escapeHtml(item.id)}" aria-label="زیاد کردن">＋</button><button type="button" class="remove-item" data-remove="${escapeHtml(item.id)}">حذف</button></div></div>`
  }).join('')
}

function addToCart(id) {
  const existing = state.cart.find(item => item.id === id)
  if (existing) existing.quantity += 1
  else state.cart.push({ id, quantity: 1 })
  saveCart()
  renderCart()
}

function changeQuantity(id, amount) {
  const item = state.cart.find(entry => entry.id === id)
  if (!item) return
  item.quantity += amount
  state.cart = state.cart.filter(entry => entry.quantity > 0)
  saveCart()
  renderCart()
}

async function loadProducts() {
  grid.innerHTML = '<div class="empty-state">در حال دریافت محصولات...</div>'

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('خطا در دریافت محصولات از Supabase:', error)
    grid.innerHTML = '<div class="empty-state">دریافت محصولات با خطا روبه‌رو شد. تنظیمات اتصال و دسترسی جدول products را بررسی کنید.</div>'
    return
  }

  products = (data || []).map(row => {
    const numericPrice = Number(row.price)
    const hasPrice = Number.isFinite(numericPrice) && numericPrice > 0
    return {
      id: String(row.id),
      name: row.name || 'محصول بدون نام',
      category: row.category || 'سایر محصولات',
      detail: row.description || '',
      priceLabel: hasPrice ? `${numericPrice.toLocaleString('fa-IR')} تومان` : 'تماس بگیرید',
      badge: row.category || 'محصول',
      imageUrl: row.image_url || ''
    }
  })

  categories = ['همه محصولات', ...new Set(products.map(product => product.category).filter(Boolean))]
  if (!categories.includes(state.category)) state.category = 'همه محصولات'

  const availableIds = new Set(products.map(product => product.id))
  state.cart = state.cart.filter(item => availableIds.has(item.id))
  saveCart()

  renderCategories()
  renderProducts()
  renderCart()
}
document.querySelector('#sendOrder').addEventListener('click', async () => {
  if (state.cart.length === 0) {
    alert('سبد خرید شما خالی است.')
    return
  }

  const customerName = document.querySelector('#customerName').value.trim()
  const customerPhone = document.querySelector('#customerPhone').value.trim()
  const customerAddress = document.querySelector('#customerAddress').value.trim()

  if (customerName.length < 2) {
    alert('لطفاً نام و نام خانوادگی را وارد کنید.')
    return
  }

  if (customerPhone.length < 8 || customerPhone.length > 20) {
    alert('لطفاً شماره تماس معتبر وارد کنید.')
    return
  }

  if (customerAddress.length < 5) {
    alert('لطفاً نشانی کامل خود را وارد کنید.')
    return
  }

  const orderItems = state.cart.map(item => {
    const product = products.find(entry => entry.id === item.id)

    if (!product) return null

    return {
      product_id: product.id,
      name: product.name,
      quantity: item.quantity
    }
  }).filter(Boolean)

  if (orderItems.length === 0) {
    alert('محصول معتبری برای ثبت سفارش وجود ندارد.')
    return
  }

  const sendButton = document.querySelector('#sendOrder')
  sendButton.disabled = true
  sendButton.textContent = 'در حال ثبت سفارش...'

  try {
    const { error } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items: orderItems,
        total: 0
      })

    if (error) throw error

    state.cart = []
    saveCart()
    renderCart()

    document.querySelector('#customerName').value = ''
    document.querySelector('#customerPhone').value = ''
    document.querySelector('#customerAddress').value = ''

    closeCart()
    alert('درخواست سفارش شما با موفقیت ثبت شد. برای هماهنگی با شما تماس خواهیم گرفت.')

  } catch (error) {
    console.error('خطا در ثبت سفارش:', error)
    alert('ثبت سفارش انجام نشد. لطفاً اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.')
  } finally {
    sendButton.disabled = false
    sendButton.textContent = 'ارسال درخواست سفارش'
  }
})

document.querySelector('#search').addEventListener('input', event => {
  state.search = event.target.value
  renderProducts()
})

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-add]')
  if (!button) return
  addToCart(button.dataset.add)
  const originalText = 'افزودن به سبد <span>＋</span>'
  button.textContent = 'اضافه شد ✓'
  window.setTimeout(() => {
    if (button.isConnected) button.innerHTML = originalText
  }, 900)
})

document.querySelector('#cartButton').addEventListener('click', () => {
  renderCart()
  cartModal.hidden = false
})

function closeCart() {
  cartModal.hidden = true
}

document.querySelector('#closeCart').addEventListener('click', closeCart)
document.querySelector('#continueShopping').addEventListener('click', closeCart)
cartModal.addEventListener('click', event => {
  if (event.target === cartModal) closeCart()
})

document.querySelector('#cartItems').addEventListener('click', event => {
  const increase = event.target.closest('[data-increase]')
  const decrease = event.target.closest('[data-decrease]')
  const remove = event.target.closest('[data-remove]')

  if (increase) changeQuantity(increase.dataset.increase, 1)
  if (decrease) changeQuantity(decrease.dataset.decrease, -1)
  if (remove) {
    state.cart = state.cart.filter(item => item.id !== remove.dataset.remove)
    saveCart()
    renderCart()
  }
})

document.querySelector('#sendOrder').addEventListener('click', () => {
  if (state.cart.length === 0) {
    alert('سبد خرید شما خالی است.')
    return
  }

  const lines = state.cart.map(item => {
    const product = products.find(entry => entry.id === item.id)
    return product ? `- ${product.name}، تعداد: ${item.quantity}` : null
  }).filter(Boolean)

  if (lines.length === 0) {
    alert('محصولی برای ارسال در سبد خرید وجود ندارد.')
    return
  }

  const message = `سلام، برای محصولات زیر درخواست استعلام قیمت و سفارش دارم:\n${lines.join('\n')}`
  const whatsappUrl = `https://wa.me/989904230726?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
})

renderCategories()
renderCart()
loadProducts()
loadPortfolio()