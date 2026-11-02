import './style.css'
import { supabase } from './supabase.js'
import './admin.css'

const ADMIN_UID = 'd9254d7d-6639-488d-83d6-ed1c508c495e'
const app = document.querySelector('#admin-app')
let activeTab = 'products'
let products = []
let projects = []

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const notify = (message, error=false) => {
  const el = document.querySelector('#notice')
  if (el) { el.textContent = message; el.className = `admin-notice ${error?'error':''}`; }
  else alert(message)
}
function shell() {
 app.innerHTML = `<main class="admin-wrap">
  <header class="admin-head"><div><span class="section-kicker">پنل اختصاصی</span><h1>مدیریت فروشگاه اداوی</h1><p>مدیریت محصولات و نمونه‌کارها</p></div><a class="admin-back" href="/">مشاهده فروشگاه ↗</a></header>
  <div id="notice" class="admin-notice" aria-live="polite"></div>
 <nav class="admin-tabs">
  <button data-tab="products" class="${activeTab==='products'?'active':''}">محصولات</button>
  <button data-tab="portfolio" class="${activeTab==='portfolio'?'active':''}">نمونه‌کارها</button>
  <button data-tab="orders" class="${activeTab==='orders'?'active':''}">سفارش‌ها</button>
  <button id="logout">خروج از حساب</button>
</nav>
  <section id="admin-content"></section></main>`
 app.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tab;renderPanel()}))
 document.querySelector('#logout').addEventListener('click',async()=>{await supabase.auth.signOut();loginScreen()})
 renderPanel()
}
function loginScreen() {
 app.innerHTML = `<main class="login-wrap"><form id="loginForm" class="login-card"><div class="brand-mark">⚡</div><span class="section-kicker">ورود مدیر</span><h1>پنل مدیریت فروشگاه</h1><p>برای ورود از حساب مدیر فروشگاه استفاده کنید.</p><label>ایمیل<input name="email" type="email" required autocomplete="username"></label><label>رمز عبور<input name="password" type="password" required autocomplete="current-password"></label><button class="admin-primary" type="submit">ورود به پنل</button><p id="loginError" class="admin-error" aria-live="polite"></p><a href="/">بازگشت به فروشگاه</a></form></main>`
 document.querySelector('#loginForm').addEventListener('submit', async e=>{
  e.preventDefault()
  const form=e.currentTarget, button=form.querySelector('button'), errorEl=document.querySelector('#loginError')
  button.disabled=true; button.textContent='در حال بررسی...'; errorEl.textContent=''
  const {data,error}=await supabase.auth.signInWithPassword({email:form.email.value.trim(),password:form.password.value})
  if(error){errorEl.textContent='ورود انجام نشد؛ ایمیل و رمز عبور را بررسی کنید.';button.disabled=false;button.textContent='ورود به پنل';return}
  if(data.user?.id!==ADMIN_UID){await supabase.auth.signOut();errorEl.textContent='این حساب اجازه دسترسی به پنل مدیریت را ندارد.';button.disabled=false;button.textContent='ورود به پنل';return}
  shell()
 })
}
async function verifySession() {
 const {data,error}=await supabase.auth.getSession()
 if(error || !data.session){loginScreen();return}
 if(data.session.user.id!==ADMIN_UID){await supabase.auth.signOut();loginScreen();return}
 shell()
}
async function renderPanel(){
  shellContentLoading()

  if(activeTab === 'products') {
    await renderProducts()
  } else if(activeTab === 'portfolio') {
    await renderPortfolio()
  } else if(activeTab === 'orders') {
    await renderOrders()
  }
}
function shellContentLoading(){const el=document.querySelector('#admin-content');if(el)el.innerHTML='<div class="admin-loading">در حال دریافت اطلاعات...</div>'}
function productForm(row={}) {
 return `<form id="productForm" class="editor-form">
 <input type="hidden" name="id" value="${esc(row.id||'')}">
 <h2>${row.id?'ویرایش محصول':'افزودن محصول'}</h2>
 <div class="form-grid">
 <label>نام محصول<input name="name" required maxlength="150" value="${esc(row.name||'')}"></label>
 <label>دسته‌بندی
  <select name="category" required>
    <option value="">انتخاب دسته‌بندی</option>
    ${['سیم و کابل','روشنایی و لامپ','کلید و پریز','تجهیزات حفاظتی و فیوز','تجهیزات تابلو برق','تجهیزات تلفن، آنتن و آیفون','تجهیزات روشنایی تزئینی و ریسه','ابزار و لوازم جانبی برق','تجهیزات هوشمندسازی'].map(category => `
      <option value="${esc(category)}" ${row.category===category?'selected':''}>${esc(category)}</option>
    `).join('')}
  </select>
</label>
 <label>قیمت (تومان)<input name="price" type="number" min="0" step="1" value="${esc(row.price??0)}"></label>
 <label>موجودی<input name="stock" type="number" min="0" step="1" value="${esc(row.stock??0)}"></label>
 <label class="wide">توضیحات<textarea name="description" rows="3">${esc(row.description||'')}</textarea></label>
 <label class="wide">تصویر محصول<input name="image" type="file" accept="image/*"><small>در صورت انتخاب تصویر جدید، تصویر قبلی جایگزین می‌شود.</small></label>
 <label class="check-label"><input name="is_active" type="checkbox" ${row.is_active===false?'':'checked'}> نمایش در فروشگاه</label>
 </div><div class="form-actions"><button class="admin-primary" type="submit">ذخیره محصول</button><button class="admin-secondary" type="button" id="cancelEdit">پاک کردن فرم</button></div>
 </form>`
}
async function renderProducts(){
 const {data,error}=await supabase.from('products').select('*').order('created_at',{ascending:false})
 if(error){document.querySelector('#admin-content').innerHTML='<p class="admin-error">دریافت محصولات ناموفق بود. دسترسی RLS جدول products را بررسی کنید.</p>';return}
 products=data||[]
 const el=document.querySelector('#admin-content')
 el.innerHTML=productForm()+`<div class="admin-list-head"><h2>فهرست محصولات</h2><span>${products.length.toLocaleString('fa-IR')} محصول</span></div>
 <div class="admin-table-wrap"><table><thead><tr><th>نام</th><th>دسته‌بندی</th><th>قیمت</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>${products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${Number(p.price||0).toLocaleString('fa-IR')} تومان</td><td>${p.is_active?'فعال':'مخفی'}</td><td><button class="table-action" data-edit="${esc(p.id)}">ویرایش</button><button class="table-action danger" data-delete="${esc(p.id)}">حذف</button></td></tr>`).join('')||'<tr><td colspan="5">محصولی ثبت نشده است.</td></tr>'}</tbody></table></div>`
 bindProductForm()
 el.querySelector('#cancelEdit').addEventListener('click',()=>renderProducts())
 el.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{const p=products.find(x=>String(x.id)===b.dataset.edit);el.querySelector('.editor-form').outerHTML=productForm(p);bindProductForm()}))
 el.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{const p=products.find(x=>String(x.id)===b.dataset.delete);if(!confirm(`محصول «${p.name}» حذف شود؟`))return;const {error}=await supabase.from('products').delete().eq('id',p.id);if(error)notify('حذف انجام نشد؛ دسترسی مدیر را بررسی کنید.',true);else{notify('محصول حذف شد.');await renderProducts()}}))
}
function bindProductForm(){
 const form=document.querySelector('#productForm');if(!form)return
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;button.textContent='در حال ذخیره...'
  const fd=new FormData(form), id=fd.get('id')
  const payload={name:String(fd.get('name')).trim(),category:String(fd.get('category')).trim(),description:String(fd.get('description')||'').trim(),price:Number(fd.get('price')||0),stock:Number(fd.get('stock')||0),is_active:fd.get('is_active')==='on',updated_at:new Date().toISOString()}
  try{
   const file=fd.get('image')
   if(file && file.size){
    if(!file.type.startsWith('image/'))throw new Error('فایل انتخاب‌شده تصویر نیست.')
    if(file.size>5*1024*1024)throw new Error('حجم تصویر باید کمتر از ۵ مگابایت باشد.')
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg'
    const path=`products/${crypto.randomUUID()}.${ext}`
    const upload=await supabase.storage.from('store-images').upload(path,file,{upsert:false,contentType:file.type})
    if(upload.error)throw upload.error
    const publicResult=supabase.storage.from('store-images').getPublicUrl(path)
    payload.image_url=publicResult.data.publicUrl
   }
   const result=id?await supabase.from('products').update(payload).eq('id',id):await supabase.from('products').insert(payload)
   if(result.error)throw result.error
   notify('محصول با موفقیت ذخیره شد.');await renderProducts()
  }catch(err){notify(`ذخیره انجام نشد: ${err.message||'خطای نامشخص'}`,true);button.disabled=false;button.textContent='ذخیره محصول'}
 })
}
function portfolioForm(row={}){
 return `<form id="portfolioForm" class="editor-form"><input type="hidden" name="id" value="${esc(row.id||'')}"><h2>${row.id?'ویرایش نمونه‌کار':'افزودن نمونه‌کار'}</h2>
 <div class="form-grid"><label>عنوان پروژه<input name="title" required maxlength="150" value="${esc(row.title||'')}"></label><label>تاریخ پروژه<input name="project_date" type="date" value="${esc(row.project_date||'')}"></label><label class="wide">توضیحات<textarea name="description" rows="3">${esc(row.description||'')}</textarea></label><label class="wide">تصویر پروژه<input name="image" type="file" accept="image/*"></label><label class="check-label"><input name="is_active" type="checkbox" ${row.is_active===false?'':'checked'}> نمایش عمومی</label></div><div class="form-actions"><button class="admin-primary" type="submit">ذخیره نمونه‌کار</button><button class="admin-secondary" type="button" id="cancelEdit">پاک کردن فرم</button></div></form>`
}
async function renderPortfolio(){
 const {data,error}=await supabase.from('portfolio').select('*').order('created_at',{ascending:false})
 if(error){document.querySelector('#admin-content').innerHTML='<p class="admin-error">دریافت نمونه‌کارها ناموفق بود. دسترسی RLS جدول portfolio را بررسی کنید.</p>';return}
 projects=data||[]
 const el=document.querySelector('#admin-content')
 el.innerHTML=portfolioForm()+`<div class="admin-list-head"><h2>فهرست نمونه‌کارها</h2><span>${projects.length.toLocaleString('fa-IR')} پروژه</span></div><div class="admin-table-wrap"><table><thead><tr><th>عنوان</th><th>تاریخ</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>${projects.map(p=>`<tr><td>${esc(p.title)}</td><td>${esc(p.project_date||'—')}</td><td>${p.is_active?'فعال':'مخفی'}</td><td><button class="table-action" data-edit="${esc(p.id)}">ویرایش</button><button class="table-action danger" data-delete="${esc(p.id)}">حذف</button></td></tr>`).join('')||'<tr><td colspan="4">نمونه‌کاری ثبت نشده است.</td></tr>'}</tbody></table></div>`
 const form=el.querySelector('#portfolioForm')
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true
  const fd=new FormData(form),id=fd.get('id'),payload={title:String(fd.get('title')).trim(),description:String(fd.get('description')||'').trim(),project_date:fd.get('project_date')||null,is_active:fd.get('is_active')==='on'}
  try{
   const file=fd.get('image')
   if(file&&file.size){if(!file.type.startsWith('image/')||file.size>5*1024*1024)throw new Error('تصویر معتبر با حجم کمتر از ۵ مگابایت انتخاب کنید.');const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';const path=`portfolio/${crypto.randomUUID()}.${ext}`;const up=await supabase.storage.from('store-images').upload(path,file,{contentType:file.type});if(up.error)throw up.error;payload.image_url=supabase.storage.from('store-images').getPublicUrl(path).data.publicUrl}
   const result=id?await supabase.from('portfolio').update(payload).eq('id',id):await supabase.from('portfolio').insert(payload)
   if(result.error)throw result.error;notify('نمونه‌کار ذخیره شد.');await renderPortfolio()
  }catch(err){notify(`ذخیره انجام نشد: ${err.message||'خطا'}`,true);button.disabled=false}
 })
 el.querySelector('#cancelEdit').addEventListener('click',()=>renderPortfolio())
 el.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{const p=projects.find(x=>String(x.id)===b.dataset.edit);el.querySelector('.editor-form').outerHTML=portfolioForm(p);renderPortfolioFormBinding()}))
 el.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{const p=projects.find(x=>String(x.id)===b.dataset.delete);if(!confirm(`نمونه‌کار «${p.title}» حذف شود؟`))return;const {error}=await supabase.from('portfolio').delete().eq('id',p.id);if(error)notify('حذف انجام نشد؛ دسترسی مدیر را بررسی کنید.',true);else{notify('نمونه‌کار حذف شد.');await renderPortfolio()}}))
}
function renderPortfolioFormBinding(){
 const form=document.querySelector('#portfolioForm');if(!form)return
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true
  const fd=new FormData(form),id=fd.get('id'),payload={title:String(fd.get('title')).trim(),description:String(fd.get('description')||'').trim(),project_date:fd.get('project_date')||null,is_active:fd.get('is_active')==='on'}
  try{
   const file=fd.get('image')
   if(file&&file.size){if(!file.type.startsWith('image/')||file.size>5*1024*1024)throw new Error('تصویر معتبر با حجم کمتر از ۵ مگابایت انتخاب کنید.');const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';const path=`portfolio/${crypto.randomUUID()}.${ext}`;const up=await supabase.storage.from('store-images').upload(path,file,{contentType:file.type});if(up.error)throw up.error;payload.image_url=supabase.storage.from('store-images').getPublicUrl(path).data.publicUrl}
   const result=id?await supabase.from('portfolio').update(payload).eq('id',id):await supabase.from('portfolio').insert(payload)
   if(result.error)throw result.error;notify('نمونه‌کار ذخیره شد.');await renderPortfolio()
  }catch(err){notify(`ذخیره انجام نشد: ${err.message||'خطا'}`,true);button.disabled=false}
 })
 form.querySelector('#cancelEdit').addEventListener('click',()=>renderPortfolio())
}
async function renderOrders(){
  const el = document.querySelector('#admin-content')

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if(error){
    el.innerHTML = '<p class="admin-error">دریافت سفارش‌ها ناموفق بود. دسترسی RLS جدول orders را بررسی کنید.</p>'
    return
  }

  const orders = data || []
  const statuses = ['جدید', 'در حال پیگیری', 'تأیید شده', 'تکمیل شده', 'لغو شده']

  el.innerHTML = `
    <div class="admin-list-head">
      <h2>فهرست سفارش‌ها</h2>
      <span>${orders.length.toLocaleString('fa-IR')} سفارش</span>
    </div>

    <div class="orders-list">
      ${orders.map(order => {
        const items = Array.isArray(order.items) ? order.items : []

        return `
          <article class="editor-form order-card">
            <div class="admin-list-head">
              <h3>سفارش شماره ${esc(order.id)}</h3>
              <span>${esc(new Date(order.created_at).toLocaleString('fa-IR'))}</span>
            </div>

            <p><strong>نام مشتری:</strong> ${esc(order.customer_name)}</p>
            <p><strong>شماره تماس:</strong> <a href="tel:${esc(order.customer_phone)}">${esc(order.customer_phone)}</a></p>
            <p><strong>نشانی:</strong> ${esc(order.customer_address)}</p>

            <h4>محصولات سفارش</h4>
            <ul>
              ${items.map(item => `
                <li>
                  ${esc(item.name || item.title || item.product_name || 'محصول')}
                  — تعداد: ${esc(item.quantity ?? item.qty ?? 1)}
                </li>
              `).join('') || '<li>اطلاعات محصول ثبت نشده است.</li>'}
            </ul>

            <p><strong>مبلغ ثبت‌شده:</strong> ${Number(order.total || 0).toLocaleString('fa-IR')} تومان</p>

            <label>
              وضعیت سفارش
              <select class="order-status" data-order-id="${esc(order.id)}">
                ${statuses.map(status => `
                  <option value="${esc(status)}" ${order.status === status ? 'selected' : ''}>
                    ${esc(status)}
                  </option>
                `).join('')}
              </select>
            </label>
          </article>
        `
      }).join('') || '<p>هنوز سفارشی ثبت نشده است.</p>'}
    </div>
  `

  el.querySelectorAll('.order-status').forEach(select => {
    select.addEventListener('change', async () => {
      const orderId = select.dataset.orderId
      const newStatus = select.value

      select.disabled = true

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if(error){
        notify('تغییر وضعیت سفارش انجام نشد.', true)
        await renderOrders()
        return
      }

      notify('وضعیت سفارش با موفقیت تغییر کرد.')
      select.disabled = false
    })
  })
}
verifySession()
