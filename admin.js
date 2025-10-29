// ========= Helpers =========
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const ls = {
  get: (k,def) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def)),
  set: (k,v)    => localStorage.setItem(k, JSON.stringify(v)),
  del: (k)      => localStorage.removeItem(k)
};

// ========= Protección de ruta simple =========
const session = JSON.parse(localStorage.getItem('sessionUser') || 'null');
if (!session || session.role !== 'admin') {
  alert('Acceso restringido. Inicia sesión como administrador.');
  window.location.href = 'index.html';
}

// ========= Datos base =========
const users = ls.get('users', []);
const defaultProducts = [
  {id:crypto.randomUUID(), name:'Pan de masa madre', price:12000, stock:10, sales:3, cat:'Bakery'},
  {id:crypto.randomUUID(), name:'Focaccia romero',   price:15000, stock:6,  sales:5, cat:'Bakery'},
  {id:crypto.randomUUID(), name:'Galleta choco',     price:5000,  stock:24, sales:8, cat:'Dulces'}
];
if (!localStorage.getItem('products')) {
  ls.set('products', defaultProducts);
}

// ========= Analytics (demo) =========
const analytics = ls.get('analytics', {pageViews:0, sessions:0, clicks:0, sessionClicks:0});
// page view
analytics.pageViews++;
// session unique
if (!sessionStorage.getItem('sess-counted')){
  analytics.sessions++;
  sessionStorage.setItem('sess-counted','1');
}
// reset per-session clicks on load
analytics.sessionClicks = 0;
ls.set('analytics', analytics);

// ========= Render Usuarios =========
const tbodyUsers = $('#tbl-users tbody');
$('#kpi-users').textContent   = users.length;
$('#kpi-admins').textContent  = users.filter(u => u.role === 'admin').length;
$('#kpi-commons').textContent = users.filter(u => u.role !== 'admin').length;
tbodyUsers.innerHTML = users.map(u => `
  <tr>
    <td>${u.name || '-'}</td>
    <td>${u.email}</td>
    <td>${u.role}</td>
  </tr>
`).join('');

// ========= Analytics render =========
function renderAnalytics(){
  const a = ls.get('analytics', {pageViews:0,sessions:0,clicks:0,sessionClicks:0});
  $('#kpi-views').textContent = a.pageViews;
  $('#kpi-sessions').textContent = a.sessions;
  $('#kpi-clicks').textContent = a.clicks;
  $('#chip-session-clicks').textContent = a.sessionClicks;

  const prods = ls.get('products', []);
  const top = [...prods].sort((x,y)=>y.sales - x.sales).slice(0,5);
  $('#top-products').innerHTML = top.length
    ? top.map(p=>`<li>${p.name} <span class="pill">${p.sales} ventas</span></li>`).join('')
    : '<li class="mut">(Sin datos)</li>';
}
renderAnalytics();

// ========= Gestión de Productos =========
const tbodyProducts = $('#tbl-products tbody');

function currency(v){
  return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v);
}
function renderProducts(){
  const data = ls.get('products', []);
  tbodyProducts.innerHTML = data.map(p => `
    <tr data-id="${p.id}">
      <td><strong>${p.name}</strong></td>
      <td>${currency(p.price)}</td>
      <td>${p.stock}</td>
      <td>${p.sales}</td>
      <td>${p.cat || '-'}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn ghost act-edit" title="Editar">Editar</button>
          <button class="btn ghost act-sale" title="Registrar venta">+1 venta</button>
          <button class="btn outline act-del" title="Eliminar">Borrar</button>
        </div>
      </td>
    </tr>
  `).join('');
}
renderProducts();

// Add product
$('#form-product').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name  = $('#pname').value.trim();
  const price = +$('#pprice').value;
  const stock = +$('#pstock').value;
  const cat   = $('#pcat').value.trim();
  if(!name || price<0 || stock<0){
    alert('Completa correctamente el formulario.');
    return;
  }
  const list = ls.get('products', []);
  list.push({id:crypto.randomUUID(), name, price, stock, sales:0, cat});
  ls.set('products', list);
  e.target.reset();
  renderProducts();
  renderAnalytics();
});

// Delegación de acciones de tabla
tbodyProducts.addEventListener('click', (e)=>{
  const tr = e.target.closest('tr');
  if(!tr) return;
  const id = tr.dataset.id;

  if(e.target.classList.contains('act-del')){
    if(confirm('¿Eliminar producto?')){
      let list = ls.get('products', []);
      list = list.filter(p=>p.id!==id);
      ls.set('products', list);
      renderProducts();
      renderAnalytics();
    }
  }
  if(e.target.classList.contains('act-edit')){
    const p = ls.get('products', []).find(x=>x.id===id);
    if(!p) return;
    $('#edit-id').value = p.id;
    $('#edit-name').value = p.name;
    $('#edit-price').value = p.price;
    $('#edit-stock').value = p.stock;
    $('#edit-cat').value = p.cat || '';
    openModal('#modal-edit');
  }
  if(e.target.classList.contains('act-sale')){
    const list = ls.get('products', []);
    const idx = list.findIndex(x=>x.id===id);
    if(idx>-1){
      if(list[idx].stock>0){
        list[idx].sales += 1;
        list[idx].stock -= 1;
        ls.set('products', list);
        renderProducts();
        renderAnalytics();
      } else {
        alert('Sin stock disponible');
      }
    }
  }
});

// Edit modal
$('#form-edit').addEventListener('submit', (e)=>{
  e.preventDefault();
  const id    = $('#edit-id').value;
  const name  = $('#edit-name').value.trim();
  const price = +$('#edit-price').value;
  const stock = +$('#edit-stock').value;
  const cat   = $('#edit-cat').value.trim();
  const list  = ls.get('products', []);
  const idx   = list.findIndex(x=>x.id===id);
  if(idx>-1){
    list[idx].name  = name;
    list[idx].price = price;
    list[idx].stock = stock;
    list[idx].cat   = cat;
    ls.set('products', list);
  }
  closeModal('#modal-edit');
  renderProducts();
  renderAnalytics();
});
$('#btn-cancel-edit').addEventListener('click', ()=> closeModal('#modal-edit'));

function openModal(sel){ $(sel).classList.add('open'); }
function closeModal(sel){ $(sel).classList.remove('open'); }

// ========= Conteo de clics global =========
// (Contamos todos los clics de manera homogénea)
function bumpClicks(){
  const a = ls.get('analytics', {pageViews:0,sessions:0,clicks:0,sessionClicks:0});
  a.clicks++; a.sessionClicks++;
  ls.set('analytics', a);
  renderAnalytics();
}
document.addEventListener('click', ()=> bumpClicks(), {capture:true});

// ========= Navegación =========
document.getElementById('btn-logout').onclick = () => {
  localStorage.removeItem('sessionUser');
  window.location.href = 'index.html';
};
document.getElementById('btn-home').onclick = () => {
  window.location.href = 'index.html';
};
