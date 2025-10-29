/* =========================
   AUTH FRONTEND ACADÉMICO
   =========================
   - Guarda usuarios en localStorage
   - Admin "quemado" (seed)
   - Redirige a dashboard si es admin
   - Cierra modal si es user normal
*/

(() => {
  // --- Selectores base ---
  const btnAuth = document.getElementById('btn-auth');
  const modal = document.getElementById('auth-modal');
  const btnClose = document.getElementById('auth-close');
  const tabs = document.querySelectorAll('.auth-tab');
  const panels = document.querySelectorAll('.auth-panel');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const msg = document.getElementById('auth-msg');

  // === Helpers de storage ===
  const getUsers = () => JSON.parse(localStorage.getItem('users') || '[]');
  const setUsers = (arr) => localStorage.setItem('users', JSON.stringify(arr));
  const setSession = (obj) => localStorage.setItem('sessionUser', JSON.stringify(obj));
  const getSession = () => JSON.parse(localStorage.getItem('sessionUser') || 'null');

  // === Seed admin si no existe ===
  function seedAdmin() {
    const users = getUsers();
    const exists = users.some(u => u.email === 'admin@site.com');
    if (!exists) {
      users.push({
        name: 'Administrador',
        email: 'admin@site.com',
        pass: 'Admin123*',   // solo académico
        role: 'admin'
      });
      setUsers(users);
    }
  }
  seedAdmin();

  // === Modal show/hide ===
  function openModal() {
    modal.classList.remove('auth-hidden');
    msg.textContent = '';
    msg.className = 'auth-msg';
    switchTab('login');
  }
  function closeModal() {
    modal.classList.add('auth-hidden');
  }

  btnAuth?.addEventListener('click', openModal);
  btnClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target.classList.contains('auth-backdrop')) closeModal();
  });

  // === Tabs ===
  function switchTab(name) {
    tabs.forEach(t => t.classList.toggle('auth-active', t.dataset.tab === name));
    panels.forEach(p => p.classList.toggle('auth-hidden', p.dataset.panel !== name));
  }
  tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // === Registro ===
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pass = document.getElementById('reg-pass').value;

    if (pass.length < 6) {
      feedback('La contraseña debe tener mínimo 6 caracteres.', true);
      return;
    }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
      feedback('Ese email ya está registrado.', true);
      return;
    }

    users.push({ name, email, pass, role: 'user' });
    setUsers(users);
    feedback('¡Cuenta creada! Ahora inicia sesión.', false);
    switchTab('login');
  });

  // === Login ===
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.pass === pass);
    if (!user) {
      feedback('Credenciales incorrectas.', true);
      return;
    }

    setSession({ name: user.name, email: user.email, role: user.role });
    feedback('¡Bienvenido!', false);

    // Redirección por rol:
    if (user.role === 'admin') {
      // lleva al dashboard del admin
      window.location.href = 'admin.html';
    } else {
      // usuario normal: cerrar modal
      setTimeout(() => closeModal(), 400);
    }
  });

  function feedback(text, error = false) {
    msg.textContent = text;
    msg.className = 'auth-msg ' + (error ? 'err' : 'ok');
  }

  // Optional: si ya hay sesión y es admin, podrías mostrar un botón "Dashboard"
  const session = getSession();
  if (session?.role === 'admin' && btnAuth) {
    btnAuth.textContent = 'Dashboard';
    btnAuth.onclick = () => (window.location.href = 'admin.html');
  }
})();



/// =====================
// UI dinámico del botón
// =====================

// Espera a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  const btnAuth = document.getElementById("btn-auth");

  // Si no existe el botón, no hacemos nada
  if (!btnAuth) return;

  const session = JSON.parse(localStorage.getItem("sessionUser") || "null");

  if (session) {
    // Cambiamos el texto del botón
    btnAuth.textContent = `Hola, ${session.name.split(" ")[0] || "usuario"}`;
    btnAuth.style.fontWeight = "600";

    // Creamos el menú flotante
    const menu = document.createElement("div");
    menu.className = "auth-menu hidden";
    menu.innerHTML = `
      <ul>
        ${session.role === "admin"
          ? `<li id="go-dashboard">Dashboard</li>`
          : ""}
        <li id="logout">Cerrar sesión</li>
      </ul>
    `;
    document.body.appendChild(menu);

   

    document.head.appendChild(style);

    // Mostrar/ocultar menú
    btnAuth.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    });
    document.addEventListener("click", () => {
      menu.classList.add("hidden");
    });

    // Funcionalidades del menú
    const logoutBtn = menu.querySelector("#logout");
    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("sessionUser");
      window.location.reload();
    });

    const dashBtn = menu.querySelector("#go-dashboard");
    dashBtn?.addEventListener("click", () => {
      window.location.href = "admin.html";
    });
  }
});

/* ===== Carrito simple con localStorage + WhatsApp ===== */
(() => {
  const cartKey = 'cartMozzafiato';
  const phone = '573502789083'; // tu número de WhatsApp con indicativo

  // Helpers
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
  const money = (n) => n.toLocaleString('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 });

  const getCart = () => JSON.parse(localStorage.getItem(cartKey) || '[]');
  const setCart = (arr) => localStorage.setItem(cartKey, JSON.stringify(arr));

  // UI refs
  const cartToggle = $('#cart-toggle');
  const cartPanel  = $('#cart-panel');
  const cartClose  = $('#cart-close');
  const cartCount  = $('#cart-count');
  const cartItemsC = $('#cart-items');
  const cartTotal  = $('#cart-total');
  const cartWA     = $('#cart-whatsapp');

  // Inicializar “Añadir al carrito” en las tarjetas
  $$('.prod-card .btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const card  = btn.closest('.prod-card');
      const name  = card.dataset.name;
      const price = Number(card.dataset.price || 0);

      let cart = getCart();
      const found = cart.find(i => i.name === name);
      if (found) {
        found.qty += 1;
      } else {
        cart.push({ name, price, qty: 1 });
      }
      setCart(cart);
      renderCart();
      // Abre el panel al agregar
      cartPanel.classList.remove('hidden');
    });
  });

  // Render del carrito
  function renderCart() {
    const cart = getCart();
    // contador
    const totalQty = cart.reduce((a,b)=>a+b.qty, 0);
    cartCount.textContent = totalQty;

    // items
    cartItemsC.innerHTML = cart.length ? '' : '<p style="color:#6b5c86;margin:8px 0">Tu carrito está vacío.</p>';

    cart.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div>
          <div class="item-name">${item.name}</div>
          <div class="item-price">${money(item.price)} c/u</div>
        </div>
        <div class="item-controls">
          <button class="qty-btn" data-act="dec" data-idx="${idx}">−</button>
          <span class="item-qty">${item.qty}</span>
          <button class="qty-btn" data-act="inc" data-idx="${idx}">+</button>
          <button class="qty-btn" data-act="del" data-idx="${idx}" title="Quitar">×</button>
        </div>
      `;
      cartItemsC.appendChild(row);
    });

    // total
    const total = cart.reduce((a,b)=> a + (b.price * b.qty), 0);
    cartTotal.textContent = money(total);
  }

  // Controles del panel
  cartToggle?.addEventListener('click', () => cartPanel.classList.toggle('hidden'));
  cartClose?.addEventListener('click', () => cartPanel.classList.add('hidden'));

  // Delegación de eventos para +, − y eliminar
  cartItemsC?.addEventListener('click', (e) => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const act = btn.dataset.act;

    let cart = getCart();
    if (!cart[idx]) return;

    if (act === 'inc') cart[idx].qty += 1;
    if (act === 'dec') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
    if (act === 'del') cart.splice(idx, 1);

    setCart(cart);
    renderCart();
  });

  // WhatsApp final
  cartWA?.addEventListener('click', () => {
    const cart = getCart();
    if (!cart.length) {
      alert('Tu carrito está vacío.');
      return;
    }
    const total = cart.reduce((a,b)=> a + (b.price * b.qty), 0);
    const lines = cart.map(i => `• ${i.name} x${i.qty} — ${money(i.price*i.qty)}`).join('\n');
    const text = `Hola, quiero hacer este pedido:\n${lines}\n\nTotal: ${money(total)}\nGracias.`;
    const url  = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });

  // Render inicial
  renderCart();
})();
