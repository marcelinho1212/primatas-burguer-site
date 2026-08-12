const WHATSAPP_NUMBER = "553188415568";
const MENU = {
  burgers: [
    {id:"primatas", name:"Primatas Burguer", tagline:"O mais pedido!", price:35.90, img:"images/primatas-burguer.jpeg",
      ing:"Pão extremamente fofo selado na manteiga, blend 150g, fatia de cheddar, fatias de bacon, cebola caramelada da casa, maionese dos primórdios."},
    {id:"caesar", name:"Caesar Burguer", tagline:"", price:45.50, img:"images/caesar-burguer.jpeg",
      ing:"Pão de brioche selado na manteiga, fraldinha desfiada e blend 150g, catupiry cremoso, fatia de bacon, maionese dos primórdios."},
    {id:"simples", name:"Simples Monkey", tagline:"", price:34.50, img:"images/simples-monkey.jpeg",
      ing:"Pão de brioche selado na manteiga, blend 150g, fatia de cheddar, alface, tomate e cebola roxa, maionese dos primórdios."},
    {id:"kingkong", name:"Kingkong Burguer", tagline:"O 2X", price:50.90, img:"images/kingkong-burguer.jpeg",
      ing:"Pão de brioche selado na manteiga, 2x blend 150g, 2x fatias de cheddar e cheddar cremoso, 2x fatias de bacon, cebola caramelizada, maionese dos primórdios."},
    {id:"tropical", name:"Selva Tropical", tagline:"", price:39.90, img:"images/selva-tropical.jpeg",
      ing:"Pão de brioche selado na manteiga, blend 150g, fatia de cheddar, fatias de bacon, rúcula, geleia de abacaxi com pimenta."},
    {id:"louca", name:"Selva Louca", tagline:"", price:38.50, img:"images/selva-louca.jpeg",
      ing:"Pão de brioche selado na manteiga, blend 150g, fatia de cheddar, fatias de bacon, rúcula e geleia de tomate."},
  ],
  fritas: [
    {id:"fritas", name:"Fritas da Selva", tagline:"", price:12.90, img:"images/fritas.png",
      ing:"Batatas fritas crocantes, servidas na cesta com maionese da casa."},
  ],
  bebidas: [
    {id:"guarana350", name:"Guaraná 350ml", tagline:"", price:7.00, img:"", ing:"Lata gelada.", emoji:"🥤"},
    {id:"coca350", name:"Coca-Cola 350ml", tagline:"", price:7.00, img:"", ing:"Lata gelada.", emoji:"🥤"},
    {id:"cocazero350", name:"Coca-Cola Zero 350ml", tagline:"", price:7.00, img:"", ing:"Lata gelada.", emoji:"🥤"},
    {id:"coca600", name:"Coca-Cola 600ml", tagline:"", price:9.00, img:"", ing:"Garrafa gelada.", emoji:"🥤"},
    {id:"cocazero600", name:"Coca-Cola Zero 600ml", tagline:"", price:9.00, img:"", ing:"Garrafa gelada.", emoji:"🥤"},
    {id:"agua", name:"Água com gás", tagline:"", price:5.00, img:"", ing:"Geladinha.", emoji:"💧"},
  ]
};

let cart = [];
let lineSeq = 1;
let lockY = 0;
let openSheet = null;
const qtyState = {};
let sheetQty = 1;
let ticketMetaCollapsed = false;

function brl(v){ return "R$ " + v.toFixed(2).replace(".", ","); }

function findItem(cat, id){
  return MENU[cat].find(i => i.id === id);
}

function peekLabel(cat){
  if(cat === "burgers") return "Toque pra ver os ingredientes";
  if(cat === "fritas") return "Toque pra ver detalhes";
  return "Toque pra ver";
}

function buildCards(){
  Object.keys(MENU).forEach(cat => {
    const grid = document.getElementById("grid-"+cat);
    grid.innerHTML = "";
    MENU[cat].forEach(item => {
      qtyState[item.id] = 1;
      const compact = cat === "bebidas";
      const card = document.createElement("article");
      card.className = compact ? "card card-row" : "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${item.name}. ${peekLabel(cat)}`);
      card.dataset.cat = cat;
      card.dataset.id = item.id;
      const photo = item.img
        ? `<div class="photo"><img src="${item.img}" alt="${item.name}">${item.tagline?`<span class="badge">${item.tagline}</span>`:""}</div>`
        : `<div class="photo">${item.emoji||""}</div>`;
      card.innerHTML = `
        ${photo}
        <div class="card-body">
          <div class="card-top">
            <h3>${item.name}</h3>
            <span class="price">${brl(item.price)}</span>
          </div>
          <p class="ingredients">${item.ing}</p>
          <p class="card-peek">${peekLabel(cat)} →</p>
          <div class="card-actions">
            <div class="stepper">
              <button type="button" data-qty="-1" aria-label="Diminuir">–</button>
              <span id="qty-${item.id}">1</span>
              <button type="button" data-qty="1" aria-label="Aumentar">+</button>
            </div>
            <button type="button" class="add-btn" id="add-${item.id}" data-add="1">Adicionar</button>
          </div>
        </div>`;
      grid.appendChild(card);
    });
  });
}

function changeQty(id, delta){
  qtyState[id] = Math.max(1, (qtyState[id]||1) + delta);
  const el = document.getElementById("qty-"+id);
  if(el) el.textContent = qtyState[id];
}

function flashAdd(id){
  const btn = document.getElementById("add-"+id);
  if(!btn) return;
  btn.textContent = "Adicionado ✓";
  btn.classList.add("added");
  setTimeout(()=>{ btn.textContent = "Adicionar"; btn.classList.remove("added"); }, 1100);
}

function addToCart(cat, id, qtyOverride, obsOverride){
  const item = findItem(cat, id);
  const qty = qtyOverride || qtyState[id] || 1;
  const obs = (obsOverride || "").trim();
  const existing = cart.find(i => i.id === id && i.obs === obs);
  if(existing){
    existing.qty += qty;
  } else {
    cart.push({ lineId: lineSeq++, id, cat, name:item.name, price:item.price, qty, obs });
  }
  qtyState[id] = 1;
  const qtyEl = document.getElementById("qty-"+id);
  if(qtyEl) qtyEl.textContent = 1;
  flashAdd(id);
  renderCart();
  pulseCart();
}

function quickAdd(cat, id){
  addToCart(cat, id, 1, "");
}

function removeFromCart(lineId){
  cart = cart.filter(i => i.lineId !== lineId);
  renderCart();
}

function changeCartQty(lineId, delta){
  const item = cart.find(i => i.lineId === lineId);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(i => i.lineId !== lineId);
  renderCart();
}

function updateObs(lineId, value){
  const item = cart.find(i => i.lineId === lineId);
  if(item) item.obs = value.trim();
}

function cartTotal(){
  return cart.reduce((s,i)=> s + i.price*i.qty, 0);
}

function cartHasCat(cat){
  return cart.some(i => i.cat === cat);
}

function pulseCart(){
  const bar = document.getElementById("cartBar");
  bar.classList.add("pop");
  setTimeout(()=> bar.classList.remove("pop"), 220);
}

function renderUpsells(){
  const wrap = document.getElementById("ticketUpsells");
  if(cart.length === 0){
    wrap.innerHTML = "";
    return;
  }
  let html = "";
  if(!cartHasCat("fritas")){
    const f = MENU.fritas[0];
    html += `
      <div class="upsell">
        <p class="upsell-q">Adicionar fritas? <span>completa o pedido</span></p>
        <button type="button" class="upsell-add" data-quick-cat="fritas" data-quick-id="${f.id}">
          <img src="${f.img}" alt="">
          <span class="info"><strong>${f.name}</strong><small>${brl(f.price)}</small></span>
          <span class="upsell-cta">Adicionar</span>
        </button>
      </div>`;
  }
  if(!cartHasCat("bebidas")){
    html += `
      <div class="upsell">
        <p class="upsell-q">Adicionar bebida? <span>escolhe uma gelada</span></p>
        <div class="upsell-drinks">
          ${MENU.bebidas.map(d => `
            <button type="button" class="upsell-drink" data-quick-cat="bebidas" data-quick-id="${d.id}">
              <span class="info"><strong>${d.emoji||""} ${d.name}</strong><small>${brl(d.price)}</small></span>
              <span class="upsell-cta">Adicionar</span>
            </button>
          `).join("")}
        </div>
      </div>`;
  }
  wrap.innerHTML = html;
}

function renderCart(){
  const totalItems = cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById("cartCount").textContent = totalItems;
  document.getElementById("cartTotal").textContent = brl(cartTotal());
  document.getElementById("cartBar").classList.toggle("show", cart.length>0);
  document.body.classList.toggle("has-cart", cart.length>0);

  const wrap = document.getElementById("ticketItems");
  if(cart.length===0){
    wrap.innerHTML = `
      <div class="ticket-empty">
        Sua ficha está vazia.<br>Escolhe um burger pra começar.
        <br>
        <button type="button" data-go-menu="1">Ver cardápio</button>
      </div>`;
  } else {
    wrap.innerHTML = cart.map(i => `
      <div class="t-item">
        <div class="t-item-top">
          <span class="t-item-name">${i.name}</span>
          <span>${brl(i.price*i.qty)}</span>
        </div>
        <input class="t-item-obs" type="text" value="${i.obs.replace(/"/g,"&quot;")}"
          placeholder="${i.cat==="burgers" ? "Observação: sem cebola, ponto da carne..." : "Observação (opcional)"}"
          data-obs="${i.lineId}">
        <div class="t-item-row">
          <div class="t-stepper">
            <button type="button" data-cart-qty="${i.lineId}" data-delta="-1" aria-label="Diminuir">–</button>
            <span>${i.qty}</span>
            <button type="button" data-cart-qty="${i.lineId}" data-delta="1" aria-label="Aumentar">+</button>
          </div>
          <button type="button" class="t-item-remove" data-remove="${i.lineId}">remover</button>
        </div>
      </div>`).join("");
  }
  renderUpsells();
  document.getElementById("ticketTotal").textContent = brl(cartTotal());
  document.getElementById("sendBtn").disabled = cart.length===0;
  requestAnimationFrame(measureChrome);
}

function measureChrome(){
  const nav = document.querySelector(".topnav");
  const bar = document.getElementById("cartBar");
  if(nav) document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
  if(bar && bar.classList.contains("show")){
    document.documentElement.style.setProperty("--cart-h", bar.offsetHeight + "px");
  }
}

function syncOverlay(){
  const overlays = [document.getElementById("overlay"), document.getElementById("itemOverlay")];
  const vv = window.visualViewport;
  overlays.forEach(overlay => {
    if(!overlay) return;
    if(overlay.classList.contains("show") && vv){
      overlay.style.top = vv.offsetTop + "px";
      overlay.style.height = vv.height + "px";
      overlay.style.bottom = "auto";
    } else {
      overlay.style.top = "";
      overlay.style.height = "";
      overlay.style.bottom = "";
    }
  });
}

function lockPage(){
  if(!document.body.classList.contains("locked")){
    lockY = window.scrollY;
    document.body.style.top = `-${lockY}px`;
    document.body.classList.add("locked");
  }
  syncOverlay();
}

function unlockPage(){
  const ticketOpen = document.getElementById("overlay").classList.contains("show");
  const sheetIsOpen = document.getElementById("itemOverlay").classList.contains("show");
  if(ticketOpen || sheetIsOpen) return;
  document.body.classList.remove("locked");
  document.body.style.top = "";
  window.scrollTo(0, lockY);
  syncOverlay();
}

function openTicket(){
  closeMenu();
  closeItem(true);
  document.getElementById("overlay").classList.add("show");
  lockPage();
}

function closeTicket(){
  document.getElementById("overlay").classList.remove("show");
  unlockPage();
}

function setTicketMetaCollapsed(collapsed){
  ticketMetaCollapsed = collapsed;
  const footer = document.querySelector(".ticket-footer");
  const toggle = document.getElementById("ticketMetaToggle");
  if(!footer || !toggle) return;
  footer.classList.toggle("collapsed", collapsed);
  toggle.setAttribute("aria-expanded", String(!collapsed));
}

function toggleTicketMeta(){
  setTicketMetaCollapsed(!ticketMetaCollapsed);
}

function openItem(cat, id){
  const item = findItem(cat, id);
  if(!item) return;
  openSheet = {cat, id};
  sheetQty = qtyState[id] || 1;
  const photo = document.getElementById("itemPhoto");
  if(item.img){
    photo.innerHTML = `<img src="${item.img}" alt="${item.name}">${item.tagline?`<span class="badge">${item.tagline}</span>`:""}<button type="button" class="item-close" data-close-item="1" aria-label="Fechar">✕</button>`;
  } else {
    photo.innerHTML = `<div class="emoji-fallback">${item.emoji||""}</div><button type="button" class="item-close" data-close-item="1" aria-label="Fechar">✕</button>`;
  }
  document.getElementById("itemName").textContent = item.name;
  document.getElementById("itemPrice").textContent = brl(item.price);
  document.getElementById("itemIng").textContent = item.ing;
  document.getElementById("itemQty").textContent = sheetQty;
  const obsWrap = document.getElementById("itemObsWrap");
  const obsInput = document.getElementById("itemObs");
  obsInput.value = "";
  obsWrap.hidden = cat === "bebidas";
  document.getElementById("itemOverlay").classList.add("show");
  lockPage();
}

function closeItem(keepLock){
  document.getElementById("itemOverlay").classList.remove("show");
  openSheet = null;
  if(!keepLock) unlockPage();
}

function addFromSheet(){
  if(!openSheet) return;
  const obs = document.getElementById("itemObs").value;
  addToCart(openSheet.cat, openSheet.id, sheetQty, obs);
  closeItem();
}

function sendOrder(){
  if(cart.length===0) return;
  const nameInput = document.getElementById("custName");
  const name = nameInput.value.trim();
  if(!name){
    nameInput.classList.add("error");
    nameInput.focus();
    return;
  }
  nameInput.classList.remove("error");
  const payMethodEl = document.getElementById("payMethod");
  const payMethod = payMethodEl.value.trim();
  if(!payMethod){
    payMethodEl.classList.add("error");
    payMethodEl.focus();
    return;
  }
  payMethodEl.classList.remove("error");
  let msg = "🦍🔥 *Pedido — Primatas Burguer*\n\n";
  msg += `*Nome:* ${name}\n\n`;
  msg += `*Forma de pagamento:* ${payMethod}\n\n`;
  cart.forEach(i=>{
    msg += `• ${i.qty}x ${i.name} — ${brl(i.price*i.qty)}\n`;
    if(i.obs) msg += `   Obs: ${i.obs}\n`;
  });
  msg += `\n*Total: ${brl(cartTotal())}*`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

function showView(view){
  document.getElementById("view-inicio").classList.toggle("active", view==="inicio");
  document.getElementById("view-cardapio").classList.toggle("active", view==="cardapio");
  document.querySelectorAll(".nav-link[data-view]").forEach(el => {
    el.classList.toggle("active", el.dataset.view === view);
  });
  closeMenu();
  window.scrollTo({top:0, behavior:"smooth"});
}

function openMenu(){
  document.body.classList.add("menu-open");
  const btn = document.getElementById("menuToggle");
  btn.setAttribute("aria-expanded", "true");
  btn.setAttribute("aria-label", "Fechar menu");
}
function closeMenu(){
  document.body.classList.remove("menu-open");
  const btn = document.getElementById("menuToggle");
  if(!btn) return;
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-label", "Abrir menu");
}
function toggleMenu(){
  document.body.classList.contains("menu-open") ? closeMenu() : openMenu();
}

function scrollToCat(cat){
  showView("cardapio");
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.toggle("active", b.dataset.cat === cat));
  const el = document.getElementById("cat-"+cat);
  requestAnimationFrame(() => {
    el.scrollIntoView({behavior:"smooth", block:"start"});
  });
}

function setupScrollSpy(){
  const blocks = document.querySelectorAll(".cat-block");
  const observer = new IntersectionObserver((entries) => {
    if(!document.getElementById("view-cardapio").classList.contains("active")) return;
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if(!visible) return;
    const cat = visible.target.id.replace("cat-","");
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.toggle("active", b.dataset.cat === cat));
  }, { rootMargin: "-30% 0px -55% 0px", threshold: 0.1 });
  blocks.forEach(b => observer.observe(b));
}

function bindUI(){
  document.getElementById("menuToggle").addEventListener("click", toggleMenu);
  document.getElementById("menuBackdrop").addEventListener("click", closeMenu);
  document.querySelectorAll("[data-view]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showView(el.dataset.view);
    });
  });
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => scrollToCat(btn.dataset.cat));
  });
  document.getElementById("cartBar").addEventListener("click", openTicket);
  document.getElementById("cartBar").addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " ") { e.preventDefault(); openTicket(); }
  });
  document.getElementById("overlay").addEventListener("click", (e) => {
    if(e.target.id === "overlay") closeTicket();
  });
  document.getElementById("itemOverlay").addEventListener("click", (e) => {
    if(e.target.id === "itemOverlay") closeItem();
  });
  document.getElementById("closeTicket").addEventListener("click", closeTicket);
  document.getElementById("ticketMetaToggle").addEventListener("click", toggleTicketMeta);
  document.getElementById("sendBtn").addEventListener("click", sendOrder);
  document.getElementById("itemAdd").addEventListener("click", addFromSheet);
  document.getElementById("itemQtyMinus").addEventListener("click", () => {
    sheetQty = Math.max(1, sheetQty - 1);
    document.getElementById("itemQty").textContent = sheetQty;
  });
  document.getElementById("itemQtyPlus").addEventListener("click", () => {
    sheetQty += 1;
    document.getElementById("itemQty").textContent = sheetQty;
  });

  document.getElementById("view-cardapio").addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if(!card) return;
    if(e.target.closest("[data-add]")){
      addToCart(card.dataset.cat, card.dataset.id);
      return;
    }
    if(e.target.closest("[data-qty]")){
      changeQty(card.dataset.id, Number(e.target.closest("[data-qty]").dataset.qty));
      return;
    }
    if(e.target.closest(".card-actions")) return;
    openItem(card.dataset.cat, card.dataset.id);
  });
  document.getElementById("view-cardapio").addEventListener("keydown", (e) => {
    if(e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if(!card || e.target.closest(".card-actions")) return;
    e.preventDefault();
    openItem(card.dataset.cat, card.dataset.id);
  });

  document.getElementById("overlay").addEventListener("click", (e) => {
    if(e.target.dataset.goMenu){
      closeTicket();
      showView("cardapio");
    }
    if(e.target.dataset.remove){
      removeFromCart(Number(e.target.dataset.remove));
    }
    const cartQty = e.target.closest("[data-cart-qty]");
    if(cartQty){
      changeCartQty(Number(cartQty.dataset.cartQty), Number(cartQty.dataset.delta));
    }
    const quick = e.target.closest("[data-quick-cat]");
    if(quick){
      quickAdd(quick.dataset.quickCat, quick.dataset.quickId);
    }
  });
  document.getElementById("overlay").addEventListener("input", (e) => {
    if(e.target.dataset.obs){
      updateObs(Number(e.target.dataset.obs), e.target.value);
    }
  });
  document.getElementById("itemOverlay").addEventListener("click", (e) => {
    if(e.target.dataset.closeItem) closeItem();
  });

  const nameInput = document.getElementById("custName");
  nameInput.value = localStorage.getItem("pb-name") || "";
  nameInput.addEventListener("input", () => {
    nameInput.classList.remove("error");
    localStorage.setItem("pb-name", nameInput.value);
  });
  const payMethodEl = document.getElementById("payMethod");
  if(payMethodEl){
    payMethodEl.addEventListener("change", () => payMethodEl.classList.remove("error"));
  }

  window.addEventListener("resize", () => { measureChrome(); syncOverlay(); });
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize", syncOverlay);
    window.visualViewport.addEventListener("scroll", syncOverlay);
  }
  document.addEventListener("keydown", (e) => {
    if(e.key !== "Escape") return;
    if(document.body.classList.contains("menu-open")) closeMenu();
    else if(document.getElementById("overlay").classList.contains("show")) closeTicket();
    else if(document.getElementById("itemOverlay").classList.contains("show")) closeItem();
  });
}

buildCards();
bindUI();
renderCart();
setTicketMetaCollapsed(false);
setupScrollSpy();
measureChrome();
