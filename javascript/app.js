let activeCategory = "All";
let visibleLimit = 12;
let cartCount = 0;

const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const resultCount = document.getElementById("resultCount");

function money(value){return "Rs. " + value.toLocaleString("en-PK");}

function getFilteredProducts(){
  const term = searchInput.value.trim().toLowerCase();
  let items = PRODUCTS.filter(p =>
    (activeCategory === "All" || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
  );
  if(sortSelect.value === "low") items.sort((a,b)=>a.price-b.price);
  if(sortSelect.value === "high") items.sort((a,b)=>b.price-a.price);
  if(sortSelect.value === "az") items.sort((a,b)=>a.name.localeCompare(b.name));
  return items;
}

function renderProducts(){
  const items = getFilteredProducts();
  const shown = items.slice(0, visibleLimit);
  resultCount.textContent = `${items.length} products found`;
  grid.innerHTML = shown.map(p => `
    <div class="col-6 col-md-4 col-lg-3">
      <article class="product-card">
        <div class="product-image">
          <img class="product-photo" src="${p.image}" alt="${p.name}" loading="lazy">
          <div class="brand-stamp"><img src="images/warda-glow-logo.png" alt="Warda Glow"></div>
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-cart" data-add="${p.id}">＋ Add</button></div>
        </div>
      </article>
    </div>`).join("");
  document.getElementById("showAllBtn").style.display = items.length > visibleLimit ? "inline-block" : "none";
}

document.querySelectorAll(".category-tile").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".category-tile").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    // Clicking the skin tile starts with skin care; the logo/home category button below restores all.
    visibleLimit = 20;
    renderProducts();
  });
});
// The heading/logo and Home link return the complete catalogue.
document.querySelectorAll(".navbar-brand,.nav-link[href='#']").forEach(el=>el.addEventListener("click",()=>{
  activeCategory="All"; visibleLimit=12;
  document.querySelectorAll(".category-tile").forEach(b=>b.classList.remove("active"));
  renderProducts();
}));
searchInput.addEventListener("input",()=>{visibleLimit=120;renderProducts();});
sortSelect.addEventListener("change",renderProducts);
document.getElementById("showAllBtn").addEventListener("click",()=>{visibleLimit=120;renderProducts();});
grid.addEventListener("click",e=>{
  const btn=e.target.closest("[data-add]");
  if(!btn)return;
  cartCount++;
  document.getElementById("cartCount").textContent=cartCount;
  const toastEl=document.getElementById("siteToast");
  toastEl.querySelector(".toast-body").textContent="Added to your bag. Your bag has "+cartCount+" item(s).";
  bootstrap.Toast.getOrCreateInstance(toastEl,{delay:1800}).show();
});
document.getElementById("searchToggle").addEventListener("click",()=>{
  searchInput.focus();
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
});
document.getElementById("newsletterForm").addEventListener("submit",e=>{
  e.preventDefault();
  e.currentTarget.reset();
  const toastEl=document.getElementById("siteToast");
  toastEl.querySelector(".toast-body").textContent="Thank you for subscribing to Warda Glow!";
  bootstrap.Toast.getOrCreateInstance(toastEl,{delay:2200}).show();
});

// Start with all 120 items represented; first 12 are shown for a quick page load.
renderProducts();


/* ===== Image zoom lightbox ===== */
(function(){
  const modal=document.getElementById("zoomModal");
  const stage=document.getElementById("zoomStage");
  const img=document.getElementById("zoomImg");
  const caption=document.getElementById("zoomCaption");
  const levelEl=document.getElementById("zoomLevel");
  const MIN=1, MAX=5;
  let scale=1, tx=0, ty=0, list=[], index=0, lastFocus=null;

  function apply(){
    if(scale<=1){tx=0;ty=0;}
    else{
      const r=stage.getBoundingClientRect();
      const maxX=(r.width*scale-r.width)/2, maxY=(r.height*scale-r.height)/2;
      tx=Math.max(-maxX,Math.min(maxX,tx));
      ty=Math.max(-maxY,Math.min(maxY,ty));
    }
    img.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;
    levelEl.textContent=Math.round(scale*100)+"%";
    stage.classList.toggle("zoomed",scale>1);
  }
  function setScale(v,cx,cy){
    const old=scale;
    scale=Math.max(MIN,Math.min(MAX,v));
    if(cx!==undefined&&scale!==old){
      const r=stage.getBoundingClientRect();
      const dx=cx-(r.left+r.width/2), dy=cy-(r.top+r.height/2);
      tx=dx-(dx-tx)*(scale/old);
      ty=dy-(dy-ty)*(scale/old);
    }
    apply();
  }
  function show(i){
    index=(i+list.length)%list.length;
    const p=list[index];
    img.src=p.image; img.alt=p.name; caption.textContent=p.name;
    scale=1;tx=0;ty=0;apply();
    const multi=list.length>1;
    document.getElementById("zoomPrev").style.display=multi?"":"none";
    document.getElementById("zoomNext").style.display=multi?"":"none";
  }
  function open(i){
    list=getFilteredProducts().slice(0,visibleLimit);
    lastFocus=document.activeElement;
    modal.hidden=false;
    document.body.classList.add("zoom-open");
    show(i);
    modal.querySelector(".zoom-close").focus();
  }
  function close(){
    modal.hidden=true;
    document.body.classList.remove("zoom-open");
    img.src="";
    if(lastFocus)lastFocus.focus();
  }

  // Open on click of a product image
  grid.addEventListener("click",e=>{
    const box=e.target.closest(".product-image");
    if(!box)return;
    const src=box.querySelector(".product-photo").getAttribute("src");
    const i=getFilteredProducts().slice(0,visibleLimit).findIndex(p=>p.image===src);
    open(Math.max(i,0));
  });

  modal.addEventListener("click",e=>{if(e.target.closest("[data-zoom-close]"))close();});
  document.getElementById("zoomIn").addEventListener("click",()=>setScale(scale+0.5));
  document.getElementById("zoomOut").addEventListener("click",()=>setScale(scale-0.5));
  document.getElementById("zoomReset").addEventListener("click",()=>setScale(1));
  document.getElementById("zoomPrev").addEventListener("click",()=>show(index-1));
  document.getElementById("zoomNext").addEventListener("click",()=>show(index+1));

  // Mouse wheel zoom
  stage.addEventListener("wheel",e=>{
    e.preventDefault();
    setScale(scale+(e.deltaY<0?0.25:-0.25),e.clientX,e.clientY);
  },{passive:false});

  // Double click / double tap toggles zoom
  stage.addEventListener("dblclick",e=>{
    scale>1?setScale(1):setScale(2.5,e.clientX,e.clientY);
  });
  // Single click on unzoomed image zooms in a step
  let moved=false;

  // Pointer events: drag to pan, pinch to zoom
  const pointers=new Map();
  let startDist=0,startScale=1,startX=0,startY=0,startTx=0,startTy=0;
  stage.addEventListener("pointerdown",e=>{
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    moved=false;
    if(pointers.size===2){
      const [a,b]=[...pointers.values()];
      startDist=Math.hypot(a.x-b.x,a.y-b.y);startScale=scale;
    }else{
      startX=e.clientX;startY=e.clientY;startTx=tx;startTy=ty;
      if(scale>1)stage.classList.add("dragging");
    }
  });
  stage.addEventListener("pointermove",e=>{
    if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){
      const [a,b]=[...pointers.values()];
      setScale(startScale*Math.hypot(a.x-b.x,a.y-b.y)/startDist,(a.x+b.x)/2,(a.y+b.y)/2);
      moved=true;
    }else if(scale>1){
      tx=startTx+(e.clientX-startX);ty=startTy+(e.clientY-startY);
      if(Math.abs(e.clientX-startX)+Math.abs(e.clientY-startY)>4)moved=true;
      apply();
    }
  });
  function end(e){
    pointers.delete(e.pointerId);
    stage.classList.remove("dragging");
    if(pointers.size===1){const p=[...pointers.values()][0];startX=p.x;startY=p.y;startTx=tx;startTy=ty;}
  }
  stage.addEventListener("pointerup",e=>{
    const wasSingle=pointers.size===1;
    end(e);
    if(wasSingle&&!moved&&scale===1)setScale(2,e.clientX,e.clientY); // tap to zoom in
  });
  stage.addEventListener("pointercancel",end);

  // Keyboard
  document.addEventListener("keydown",e=>{
    if(modal.hidden)return;
    if(e.key==="Escape")close();
    else if(e.key==="ArrowLeft")show(index-1);
    else if(e.key==="ArrowRight")show(index+1);
    else if(e.key==="+"||e.key==="=")setScale(scale+0.5);
    else if(e.key==="-")setScale(scale-0.5);
    else if(e.key==="0")setScale(1);
  });
  window.addEventListener("resize",()=>{if(!modal.hidden)apply();});
})();
