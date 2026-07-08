/* ============================================================
   RUAY THAI NOODLE — Cart & Order Logic
   ============================================================ */

(function () {
  'use strict';

  /* ─── Opening hours (for time slots) ─── */
  const HOURS = {
    0: null, // Sunday – closed
    1: [{ s: '11:00', e: '14:30' }, { s: '17:30', e: '22:00' }],
    2: [{ s: '11:00', e: '14:30' }, { s: '17:30', e: '22:00' }],
    3: [{ s: '11:00', e: '14:30' }, { s: '17:30', e: '22:00' }],
    4: [{ s: '11:00', e: '14:30' }, { s: '17:30', e: '22:00' }],
    5: [{ s: '11:00', e: '14:30' }, { s: '17:30', e: '22:00' }],
    6: [{ s: '12:00', e: '20:30' }],
  };

  const LEAD_MINUTES = 30; // minimum lead time in minutes

  /* ─── Cart state ─── */
  let cart = []; // [{ uid, id, name, variant, price, qty }]
  let uidCounter = 0;

  /* ─── DOM refs ─── */
  const cartBody          = document.getElementById('cartBody');
  const cartBodyDrawer    = document.getElementById('cartBodyDrawer');
  const cartEmpty         = document.getElementById('cartEmpty');
  const cartCount         = document.getElementById('cartCount');
  const cartCountMobile   = document.getElementById('cartCountMobile');
  const cartCountDrawer   = document.getElementById('cartCountDrawer');
  const cartTotalRow      = document.getElementById('cartTotalRow');
  const cartTotal         = document.getElementById('cartTotal');
  const cartTotalDrawer   = document.getElementById('cartTotalDrawer');
  const cartTotalAmtDrwr  = document.getElementById('cartTotalAmountDrawer');
  const cartCheckout      = document.getElementById('cartCheckout');
  const cartCheckoutDrawer= document.getElementById('cartCheckoutDrawer');
  const cartBarMobile     = document.getElementById('cartBarMobile');
  const cartBarTotal      = document.getElementById('cartBarTotal');
  const hiddenOrder       = document.getElementById('hiddenOrder');
  const hiddenTotal       = document.getElementById('hiddenTotal');
  const checkoutForm      = document.getElementById('checkoutForm');
  const btnCheckout       = document.getElementById('btnCheckout');
  const submitBtn         = document.getElementById('submitBtn');
  const formSuccess       = document.getElementById('formSuccess');
  const pickupDate        = document.getElementById('pickupDate');
  const pickupTime        = document.getElementById('pickupTime');
  const drawerBackdrop    = document.getElementById('drawerBackdrop');
  const cartDrawer        = document.getElementById('cartDrawer');

  /* ─── Variant modal refs ─── */
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle   = document.getElementById('modalTitle');
  const modalDesc    = document.getElementById('modalDesc');
  const modalOptions = document.getElementById('modalOptions');
  const modalCancel  = document.getElementById('modalCancel');
  const modalConfirm = document.getElementById('modalConfirm');

  let pendingItem = null;
  let selectedVariant = null;

  /* ─── Helper: format price ─── */
  const fmt = n => 'CHF ' + n.toFixed(2);

  /* ─── Helper: to-minutes ─── */
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  /* ─── Generate time slots for a date ─── */
  function getSlots(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const dow = d.getDay();
    const ranges = HOURS[dow];
    if (!ranges) return [];

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() + LEAD_MINUTES : 0;

    const slots = [];
    ranges.forEach(({ s, e }) => {
      let cur = toMin(s);
      const end = toMin(e) - 30; // last slot 30 min before close
      while (cur <= end) {
        const h = String(Math.floor(cur / 60)).padStart(2, '0');
        const m = String(cur % 60).padStart(2, '0');
        if (cur > nowMin) slots.push(`${h}:${m}`);
        cur += 30;
      }
    });
    return slots;
  }

  /* ─── Set min date on date picker ─── */
  function initDatePicker() {
    if (!pickupDate) return;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    pickupDate.min = todayStr;

    // Disable Sundays via JS (input[type=date] doesn't support disabling days natively)
    pickupDate.addEventListener('change', () => {
      const d = new Date(pickupDate.value + 'T00:00:00');
      if (d.getDay() === 0) {
        pickupDate.setCustomValidity('Sonntag ist das Restaurant geschlossen. Bitte einen anderen Tag wählen.');
        pickupDate.reportValidity();
        pickupTime.innerHTML = '<option value="">Sonntag: Geschlossen</option>';
        return;
      }
      pickupDate.setCustomValidity('');
      updateTimeSlots();
    });
  }

  function updateTimeSlots() {
    if (!pickupDate || !pickupTime) return;
    const slots = getSlots(pickupDate.value);
    if (!slots.length) {
      pickupTime.innerHTML = '<option value="">Keine Slots verfügbar</option>';
      return;
    }
    pickupTime.innerHTML = '<option value="">Bitte wählen</option>' +
      slots.map(s => `<option value="${s}">${s} Uhr</option>`).join('');
  }

  /* ─── Render cart ─── */
  function renderCart() {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const totalAmt = cart.reduce((s, i) => s + i.price * i.qty, 0);

    // Counts
    [cartCount, cartCountMobile, cartCountDrawer].forEach(el => { if (el) el.textContent = totalQty; });

    // Bar
    if (cartBarMobile) {
      cartBarMobile.classList.toggle('visible', totalQty > 0);
      if (cartBarTotal) cartBarTotal.textContent = fmt(totalAmt);
    }

    // Hidden fields
    if (hiddenOrder) hiddenOrder.value = cart.map(i =>
      `${i.qty}x ${i.name}${i.variant ? ' (' + i.variant + ')' : ''} – ${fmt(i.price)}`
    ).join('\n');
    if (hiddenTotal) hiddenTotal.value = fmt(totalAmt);

    const emptyHTML = '<p class="cart-empty">Noch nichts im Warenkorb.</p>';

    if (!cart.length) {
      if (cartBody)   cartBody.innerHTML = emptyHTML;
      if (cartBodyDrawer) cartBodyDrawer.innerHTML = emptyHTML;
      if (cartTotalRow) cartTotalRow.style.display = 'none';
      if (cartTotalDrawer) cartTotalDrawer.style.display = 'none';
      if (cartCheckout) cartCheckout.style.display = 'none';
      if (cartCheckoutDrawer) cartCheckoutDrawer.style.display = 'none';
      if (checkoutForm) checkoutForm.classList.add('hidden');
      return;
    }

    const itemsHTML = cart.map(item => `
      <div class="cart-item" data-uid="${item.uid}">
        <div class="cart-qty">
          <button class="qty-minus" data-uid="${item.uid}" aria-label="Weniger">−</button>
          <span>${item.qty}</span>
          <button class="qty-plus"  data-uid="${item.uid}" aria-label="Mehr">+</button>
        </div>
        <div style="flex:1">
          <div class="cart-item-name">${item.name}</div>
          ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ''}
        </div>
        <div class="cart-item-price">${fmt(item.price * item.qty)}</div>
        <button class="cart-item-remove" data-uid="${item.uid}" aria-label="Entfernen">&times;</button>
      </div>
    `).join('');

    if (cartBody)        cartBody.innerHTML  = itemsHTML;
    if (cartBodyDrawer)  cartBodyDrawer.innerHTML = itemsHTML;

    [cartTotal, cartTotalAmtDrwr].forEach(el => { if (el) el.textContent = fmt(totalAmt); });
    if (cartTotalRow)    cartTotalRow.style.display    = 'flex';
    if (cartTotalDrawer) cartTotalDrawer.style.display = 'flex';
    if (cartCheckout)    cartCheckout.style.display    = 'block';
    if (cartCheckoutDrawer) cartCheckoutDrawer.style.display = 'block';

    // Bind item buttons
    [cartBody, cartBodyDrawer].forEach(body => {
      if (!body) return;
      body.querySelectorAll('.qty-minus').forEach(btn => btn.addEventListener('click', () => adjustQty(btn.dataset.uid, -1)));
      body.querySelectorAll('.qty-plus').forEach(btn  => btn.addEventListener('click', () => adjustQty(btn.dataset.uid, +1)));
      body.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', () => removeItem(btn.dataset.uid)));
    });
  }

  function adjustQty(uid, delta) {
    const item = cart.find(i => i.uid === String(uid));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.uid !== String(uid));
    renderCart();
  }

  function removeItem(uid) {
    cart = cart.filter(i => i.uid !== String(uid));
    renderCart();
  }

  function addToCart(name, price, variant) {
    const key = name + (variant || '');
    const existing = cart.find(i => i.name + (i.variant || '') === key);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ uid: String(++uidCounter), id: uidCounter, name, variant: variant || '', price, qty: 1 });
    }
    renderCart();
    flashAddBtn();
  }

  function flashAddBtn() {
    if (cartBarMobile) {
      cartBarMobile.style.transform = 'scale(1.04)';
      setTimeout(() => { cartBarMobile.style.transform = ''; }, 200);
    }
  }

  /* ─── Variant modal ─── */
  function openModal(item) {
    pendingItem = item;
    selectedVariant = null;
    const variants = item.dataset.variants ? JSON.parse(item.dataset.variants) : null;
    if (!variants) return;

    modalTitle.textContent = item.dataset.name;
    modalDesc.textContent  = 'Bitte Variante auswählen:';
    modalOptions.innerHTML = variants.map((v, i) => `
      <div class="modal-option" data-idx="${i}" data-label="${v.label}" data-price="${v.price}">
        <span>${v.label}</span>
        <span class="opt-price">${fmt(v.price)}</span>
      </div>
    `).join('');

    modalOptions.querySelectorAll('.modal-option').forEach(opt => {
      opt.addEventListener('click', () => {
        modalOptions.querySelectorAll('.modal-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedVariant = { label: opt.dataset.label, price: parseFloat(opt.dataset.price) };
      });
    });

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    pendingItem = null;
    selectedVariant = null;
  }

  /* ─── Checkout toggle ─── */
  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      if (checkoutForm) {
        checkoutForm.classList.remove('hidden');
        checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        btnCheckout.style.display = 'none';
      }
    });
  }

  /* ─── Form submit (Web3Forms) ─── */
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!cart.length) { alert('Bitte zuerst Gerichte in den Warenkorb legen.'); return; }

      const d = new Date(pickupDate.value + 'T00:00:00');
      if (d.getDay() === 0) { pickupDate.setCustomValidity('Sonntag geschlossen.'); pickupDate.reportValidity(); return; }
      if (!pickupTime.value) { pickupTime.setCustomValidity('Bitte eine Abholzeit wählen.'); pickupTime.reportValidity(); return; }
      pickupTime.setCustomValidity('');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet…';

      try {
        const data = new FormData(checkoutForm);
        const res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
        const json = await res.json();

        if (json.success) {
          checkoutForm.classList.add('hidden');
          if (btnCheckout) btnCheckout.style.display = 'none';
          if (formSuccess) formSuccess.style.display = 'block';
          cart = [];
          renderCart();
        } else {
          throw new Error(json.message || 'Fehler beim Absenden.');
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bestellung absenden';
        alert('Fehler: ' + err.message + '\nBitte per Telefon bestellen: 079 848 15 22');
      }
    });
  }

  /* ─── Mobile drawer ─── */
  if (cartBarMobile) {
    const openDrawer = () => {
      cartDrawer && cartDrawer.classList.add('open');
      drawerBackdrop && drawerBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    cartBarMobile.addEventListener('click', openDrawer);
    cartBarMobile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openDrawer(); });
  }
  const closeDrawer = () => {
    cartDrawer && cartDrawer.classList.remove('open');
    drawerBackdrop && drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  };
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  /* ─── Add buttons ─── */
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.dish-row');
      if (!row) return;
      const hasVariants = row.dataset.variants;
      if (hasVariants) {
        openModal(row);
      } else {
        addToCart(row.dataset.name, parseFloat(row.dataset.price));
      }
    });
  });

  /* ─── Modal buttons ─── */
  if (modalCancel)  modalCancel.addEventListener('click', closeModal);
  if (modalConfirm) {
    modalConfirm.addEventListener('click', () => {
      if (!selectedVariant) { alert('Bitte eine Variante auswählen.'); return; }
      addToCart(pendingItem.dataset.name, selectedVariant.price, selectedVariant.label);
      closeModal();
    });
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  }

  /* ─── Init ─── */
  initDatePicker();
  renderCart();

})();
