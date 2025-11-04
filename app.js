/* =========================================================
   MAMA’s KÜCHE — Weeks Switcher Fixed (JSON + Fallback)
   ========================================================= */

(function () {
  // ---------- Helpers ----------
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const fmt = (n) => Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const log = (...a)=>console.log('[MAMAS]',...a);

  // ---------- State / Config ----------
  let WEEKS = [];
  let DELIVERY_FEE = 2.50;
  const WHATSAPP_E164 = "491749576537";
  let selectedWeekIdx = 0;
  let cart = [];

  // ---------- FALLBACK ----------
  const DEFAULT_WEEKS = [
    {
      label: "۳–۷ نوامبر",
      range: { start: "2025-11-03", end: "2025-11-07" },
      menu: [
        {key:"mo-kabab",    day:"دوشنبه",   title:"کباب دیگی",                 price:12.00, desc:"گوشت گوسفندی تازه با ادویه مخصوص", img:"assets/food/kababdigi.webp"},
        {key:"tu-ghorme",   day:"سه‌شنبه",  title:"قرمه‌سبزی",                 price:11.00, desc:"سبزی تازه، لوبیا و گوشت",          img:"assets/food/ghorme.webp"},
        {key:"we-lobia",    day:"چهارشنبه", title:"لوبیاپلو با گوشت چرخ‌کرده",  price:10.00, desc:"خانگی و خوش‌عطر",                   img:"assets/food/lobia.webp"},
        {key:"th-fesenjan", day:"پنج‌شنبه", title:"فسنجون با گوشت قلقلی",       price:13.00, desc:"مغز گردو و رب انار",                img:"assets/food/fesenjan.webp"},
        {key:"fr-chelo",    day:"جمعه",     title:"چلو گوشت",                   price:13.50, desc:"گوشت نرم و تازه با برنج",           img:"assets/food/chelogosht.webp"},
      ],
      dailyOnlyOn: { "daily-ash": "2025-11-05" }
    },
    {
      label: "۱۰–۱۴ نوامبر",
      range: { start: "2025-11-10", end: "2025-11-14" },
      menu: [
        {key:"mo-fesenjan",  day:"دوشنبه",   title:"فسنجون با گوشت قلقلی",   price:13.00, desc:"مغز گردو و رب انار",                 img:"assets/food/fesenjan.webp"},
        {key:"tu-lasagna",   day:"سه‌شنبه",  title:"لازانیا",                price:10.00, desc:"لازانیا خانگی لایه‌لایه",            img:"assets/food/lasagna.webp"},
        {key:"we-ghorme",    day:"چهارشنبه", title:"قرمه‌سبزی",              price:11.00, desc:"سبزی تازه، لوبیا و گوشت",             img:"assets/food/ghorme.webp"},
        {key:"th-lobia",     day:"پنج‌شنبه", title:"لوبیاپلو با گوشت",       price:10.00, desc:"عطر‌دار و خوشمزه",                    img:"assets/food/lobia.webp"},
        {key:"fr-gheimehN",  day:"جمعه",     title:"قیمه نثار",               price:12.00, desc:"گوشت، خلال بادام و پسته، زرشک",      img:"assets/food/gheimeh-nesar.webp"},
      ],
      dailyOnlyOn: { "daily-ash": "2025-11-12" }
    },
    {
      label: "۱۷–۲۲ نوامبر",
      range: { start: "2025-11-17", end: "2025-11-22" },
      // دوشنبه: ماکارانی | سه‌شنبه: فسنجون قلقلی | چهارشنبه: قرمه‌سبزی | پنج‌شنبه: کباب دیگی | جمعه: چلو گوشت
      menu: [
        {key:"mo-makaroni",  day:"دوشنبه",   title:"ماکارانی",                price:10.00, desc:"ماکارونی خانگی با سس گوشت",          img:"assets/food/makaroni.webp"},
        {key:"tu-fesenjan2", day:"سه‌شنبه",  title:"فسنجون با گوشت قلقلی",    price:13.00, desc:"مغز گردو و رب انار",                 img:"assets/food/fesenjan.webp"},
        {key:"we-ghorme2",   day:"چهارشنبه", title:"قرمه‌سبزی",               price:11.00, desc:"سبزی تازه، لوبیا و گوشت",             img:"assets/food/ghorme.webp"},
        {key:"th-kabab2",    day:"پنج‌شنبه", title:"کباب دیگی",                price:12.00, desc:"گوشت گوسفندی تازه با ادویه مخصوص",   img:"assets/food/kababdigi.webp"},
        {key:"fr-chelo2",    day:"جمعه",     title:"چلو گوشت",                 price:13.50, desc:"گوشت نرم و تازه با برنج",            img:"assets/food/chelogosht.webp"},
      ],
      dailyOnlyOn: { "daily-ash": "2025-11-19" }
    },
  ];

  // ---------- Load Weeks JSON (safe) ----------
  async function loadWeeks() {
    try{
      const res = await fetch('assets/data/weeks.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('weeks.json not found');
      const data = await res.json();

      DELIVERY_FEE = Number(data.delivery_fee ?? DELIVERY_FEE);
      const weeks = (data.weeks || []).map(w => ({
        label: w.label,
        range: w.range,
        menu: (w.menu || []).map((m, i) => ({
          key: m.key || `${w.range.start}-${i}`,
          day: m.day, title: m.title, price: Number(m.price),
          desc: m.desc || '', img: m.img || 'assets/food/placeholder.webp'
        })),
        dailyOnlyOn: w.daily_only_on || {}
      }));
      if (!weeks.length) throw new Error('weeks empty in JSON');
      WEEKS = weeks;
      log('Loaded weeks.json');
    }catch(e){
      log('Falling back to DEFAULT_WEEKS');
      WEEKS = DEFAULT_WEEKS;
    }
  }

  // ---------- Datasets ----------
  const DAILY_ITEMS = [
    { key:"daily-zereshk", title:"زرشک‌پلو با مرغ (هر روز)", price:11.00, desc:"برنج، مرغ تازه، زرشک و زعفران", img:"assets/food/zereshk.webp" },
    { key:"daily-ash",     title:"آش رشته (فقط چهارشنبه)",   price:5.50,  desc:"آش رشتهٔ خانگی",                 img:"assets/food/ash.webp" }
  ];
  const STARTERS = [
    {key:"st-kashk", title:"کشک بادمجان", price:7.00,  img:"assets/food/kashk.webp"},
    {key:"st-soup",  title:"سوپ",          price:3.50,  img:"assets/food/soup.webp"},
    {key:"st-mirza", title:"میرزا قاسمی",  price:7.00,  img:"assets/food/mirza.webp"},
  ];
  const SIDES = [
    {key:"side-zeitoun",       title:"زیتون پرورده",             price:3.50, img:"assets/food/zeitoun.webp"},
    {key:"side-mast",          title:"ماست موسیر",                price:2.50, img:"assets/food/mast.webp"},
    {key:"side-torshi-mix",    title:"ترشی مخلوط خانگی",          price:2.50, img:"assets/food/torshi.webp"},
    {key:"side-sirtorshi",     title:"سیر ترشی ۷ ساله خانگی",     price:3.50, img:"assets/food/sirtorshi.webp"},
    {key:"side-salad-shirazi", title:"سالاد شیرازی",              price:2.50, img:"assets/food/salad-shirazi.webp"},
    {key:"side-salad-season",  title:"سالاد فصل با سس مخصوص",     price:3.00, img:"assets/food/salad-season.webp"},
  ];

  // ---------- Derived ----------
  const currentWeek  = () => WEEKS[selectedWeekIdx];
  const currentMenu  = () => (currentWeek()?.menu) || [];
  const currentRange = () => (currentWeek()?.range) || {start:'',end:''};

  // ---------- Week Switcher ----------
  function autoSelectWeek() {
    const today = new Date().toISOString().slice(0,10);
    const idx = WEEKS.findIndex(w => today >= w.range.start && today <= w.range.end);
    return idx >= 0 ? idx : Math.max(0, WEEKS.length - 1);
  }

  function mountWeekSelect(){
    const sel = $('#weekSelect');
    if (!sel) return; // اگر سوییچر در HTML نباشد، بی‌صدا رد شو
    sel.innerHTML = WEEKS.map((w,i)=>`<option value="${i}">${w.label}</option>`).join('');
    sel.value = String(selectedWeekIdx);
    sel.addEventListener('change', e => setWeek(Number(e.target.value)));
  }

  function updateDynamicTexts(){
    const label = currentWeek()?.label || '';
    const t = $('#weekTitle');        if (t) t.textContent = label;
    const h = $('#heroRangeTxt');     if (h) h.textContent = label.replace('–',' تا ');
    const chip = $('#chipShipFee');   if (chip) chip.textContent = fmt(DELIVERY_FEE);
    const heroFee = $('#heroShipFee');if (heroFee) heroFee.textContent = fmt(DELIVERY_FEE);
  }

  function setWeek(i){
    if (Number.isNaN(i) || i<0 || i>=WEEKS.length) return;
    if (i === selectedWeekIdx) return;
    selectedWeekIdx = i;
    cart = [];
    refreshCart();
    updateDynamicTexts();
    renderDaily();
    renderMenu();
  }

  // ---------- UI helpers ----------
  function renderSkeleton(gridEl, count=5){
    if (!gridEl) return;
    gridEl.innerHTML = '';
    for (let i=0;i<count;i++){
      const sk = document.createElement('article');
      sk.className = 'card skel card--skel';
      sk.innerHTML = `<div class="skel-img"></div><div class="skel-line"></div><div class="skel-line sm"></div>`;
      gridEl.appendChild(sk);
    }
  }
  const imgHTML = (src, alt)=>`<img src="${src||'assets/food/placeholder.webp'}" alt="${alt||''}" class="food-img" loading="lazy">`;
  function cardHTML(item, type, idx, disabled=false, badge=''){
    return `
    <article class="card" role="listitem">
      <div class="card__media">
        ${imgHTML(item.img, item.title)}
        ${badge?`<span class="badge" style="position:absolute;top:10px;inset-inline-start:10px">${badge}</span>`:''}
      </div>
      <div class="card__body">
        <h3 class="card__title">${item.title}</h3>
        ${item.desc?`<p class="card__desc">${item.desc}</p>`:''}
        <div class="card__row">
          <span class="price-pill">${fmt(item.price)}</span>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="qbtn dec" data-type="${type}" data-idx="${idx}" ${disabled?'disabled':''}>-</button>
            <input class="qinput" type="number" min="0" value="0" data-type="${type}" data-idx="${idx}" ${disabled?'disabled':''}>
            <button class="qbtn inc" data-type="${type}" data-idx="${idx}" ${disabled?'disabled':''}>+</button>
          </div>
        </div>
        <div class="card__row">
          <button class="add-btn" data-type="${type}" data-idx="${idx}" ${disabled?'disabled':''}>افزودن به سبد</button>
        </div>
      </div>
    </article>`;
  }
  function hookLazyImages(scope=document){
    $$('img[loading="lazy"]', scope).forEach(img=>{
      if (img.complete) return;
      img.style.opacity = '0';
      img.addEventListener('load', ()=> img.style.opacity = '1', {once:true});
    });
  }

  // ---------- Renderers ----------
  function renderDaily(){
    const grid = $('#dailyGrid');
    if (!grid) return;
    renderSkeleton(grid, 2);
    setTimeout(()=>{
      const onlyOnMap = currentWeek()?.dailyOnlyOn || {};
      grid.innerHTML = DAILY_ITEMS.map((it,i)=>{
        const badge = onlyOnMap[it.key] ? 'ارسال فقط چهارشنبه' : 'هر روز';
        return cardHTML(it,'daily',i,false,badge);
      }).join('');
      hookLazyImages(grid);
    }, 40);
  }
  function renderMenu(){
    const grid = $('#menuGrid'); if (!grid) return;
    renderSkeleton(grid, 5);
    setTimeout(()=>{
      grid.innerHTML = currentMenu().map((m,i)=> cardHTML(m,'menu',i,false,`روزپخت — ${m.day}`)).join('');
      hookLazyImages(grid);
    }, 40);
  }
  function renderStarters(){
    const grid = $('#startersGrid'); if (!grid) return;
    renderSkeleton(grid, 3);
    setTimeout(()=>{
      grid.innerHTML = STARTERS.map((s,i)=> cardHTML(s,'starter',i,false,'پیش‌غذا')).join('');
      hookLazyImages(grid);
    }, 40);
  }
  function renderSides(){
    const grid = $('#sidesGrid'); if (!grid) return;
    renderSkeleton(grid, 6);
    setTimeout(()=>{
      grid.innerHTML = SIDES.map((s,i)=> cardHTML(s,'side',i,false,'موجود')).join('');
      hookLazyImages(grid);
    }, 40);
  }

  // ---------- Cart ----------
  function srcFor(item){
    if(item.type==='menu')    return currentMenu()[item.idx];
    if(item.type==='starter') return STARTERS[item.idx];
    if(item.type==='side')    return SIDES[item.idx];
    if(item.type==='daily')   return DAILY_ITEMS[item.idx];
    return null;
  }
  function refreshCart(){
    const list = $('#cartList'); if (!list) return;
    list.innerHTML = '';
    let total = 0;
    cart.forEach(it=>{
      const d = srcFor(it); if (!d) return;
      const line = d.price*it.qty; total += line;
      const li = document.createElement('li');
      li.className = 'cart__item';
      li.innerHTML = `
        <span>${d.title} × ${it.qty}</span>
        <span>${fmt(line)} <a href="#" data-remove="${it.type}:${it.idx}" style="color:#c0392b;font-size:12px;margin-inline-start:8px">حذف</a></span>
      `;
      list.appendChild(li);
    });
    const grand = total + (cart.length? DELIVERY_FEE : 0);
    $('#cartCount') && ($('#cartCount').textContent = cart.reduce((s,x)=>s+x.qty,0));
    $('#shipFee')   && ($('#shipFee').textContent   = cart.length? fmt(DELIVERY_FEE) : fmt(0));
    $('#cartTotal') && ($('#cartTotal').textContent = fmt(grand));
  }
  function onClickDoc(e){
    const t=e.target;
    if (t.classList.contains('inc') || t.classList.contains('dec')){
      const type=t.dataset.type, idx=+t.dataset.idx;
      const inp = $(`.qinput[data-type="${type}"][data-idx="${idx}"]`);
      if (!inp) return;
      let v = Number(inp.value||0);
      v = t.classList.contains('inc')? v+1 : Math.max(0,v-1);
      inp.value = v;
    }
    if (t.classList.contains('add-btn')){
      const type=t.dataset.type, idx=+t.dataset.idx;
      const inp = $(`.qinput[data-type="${type}"][data-idx="${idx}"]`);
      const q = Number((inp && inp.value) || 0);
      if(q<=0) return;
      const found = cart.find(x=>x.type===type && x.idx===idx);
      if(found) found.qty += q; else cart.push({type,idx,qty:q});
      if (inp) inp.value = 0;
      refreshCart(); toast('به سبد اضافه شد');
    }
    if (t.dataset.remove){
      e.preventDefault();
      const [type,idx] = t.dataset.remove.split(':');
      cart = cart.filter(x=>!(x.type===type && String(x.idx)===String(idx)));
      refreshCart();
    }
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg){
    const el = $('#toast');
    if (!el) { console.log('TOAST:', msg); return; }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> el.style.opacity = '0', 1400);
  }

  // ---------- Hero / Promo (safe) ----------
  function setupHero(){
    if (window.gsap){
      const gif = $('#heroGif');
      if (gif) {
        gif.style.opacity = '0';
        gsap.timeline({defaults:{duration:.8,ease:'power3.out'}})
          .from('.hero__title', {y:30,opacity:0}, 0)
          .from('.hero__desc',  {y:18,opacity:0}, '<0.1')
          .from('.hero__pills .pill', {y:18,opacity:0,stagger:.06}, '<0.05')
          .to(gif,{opacity:1,y:-10,scale:1,duration:.6}, '-=0.2');
      }
      if (window.ScrollTrigger){
        gsap.registerPlugin(ScrollTrigger);
        const v = $('#pvVideo');
        if (v){
          gsap.fromTo(v,{opacity:0,y:24},{opacity:1,y:0,duration:.8,ease:'power2.out',
            scrollTrigger:{ trigger:'#promoVideo', start:'top 70%', toggleActions:'play none none reverse' }
          });
        }
      }
    } else {
      const gif = $('#heroGif'); if (gif) gif.style.opacity = '1';
    }
  }

  // ---------- WhatsApp + Invoice ----------
  function buildOrderMessage(){
    const name = ($('#f_name')?.value || '').trim();
    const phone= ($('#f_phone')?.value|| '').trim();
    const city = ($('#f_city')?.value || '').trim();
    const street= ($('#f_street')?.value|| '').trim();
    const no   = ($('#f_no')?.value    || '').trim();
    const zip  = ($('#f_zip')?.value   || '').trim();
    const time = ($('#f_time')?.value  || '').trim();
    const note = ($('#f_note')?.value  || '').trim();
    const address = [street && (street+' '+no), (zip||'')+' '+(city||'')].filter(Boolean).join(', ');

    let total=0;
    const lines = cart.map(it=>{
      const m = srcFor(it); if(!m) return '';
      const line = m.price*it.qty; total+=line;
      return `- ${m.title} × ${it.qty} = € ${line.toFixed(2)}`;
    }).join('\n');

    if (cart.length) total += DELIVERY_FEE;

    const msg =
`سلام 👋 سفارش جدید (ارسال فقط)
نام: ${name||'—'}
تلفن: ${phone||'—'}
آدرس: ${address||'—'}
زمان: ${time||'—'}
توضیحات: ${note||'—'}

اقلام:
${lines || '—'}
هزینه ارسال: € ${(cart.length?DELIVERY_FEE:0).toFixed(2)}
جمع کل: € ${total.toFixed(2)}
`;
    return {msg,total};
  }
  function openInvoiceWindow(){
    if (cart.length===0){ toast('سبد خالی است'); return; }
    const {total} = buildOrderMessage();
    const w = window.open('', '_blank', 'width=720,height=900');
    const rows = cart.map(it=>{
      const m=srcFor(it); const line=m.price*it.qty;
      return `<tr><td>${m.title}</td><td>${it.qty}</td><td>${m.price.toFixed(2)}</td><td>${line.toFixed(2)}</td></tr>`;
    }).join('');
    const feeRow = cart.length? `<tr><td>هزینه ارسال</td><td>1</td><td>${DELIVERY_FEE.toFixed(2)}</td><td>${DELIVERY_FEE.toFixed(2)}</td></tr>` : '';
    w.document.write(`
      <html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>پیش‌نمایش فاکتور</title>
      <style>body{font-family:Vazirmatn,sans-serif;padding:24px;color:#333}
      h1{margin:0 0 8px;font-size:18px}table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border-bottom:1px solid #eee;padding:8px;text-align:right}
      th{background:#fff7ف0;color:#8b5122}.sum{display:flex;justify-content:flex-end;margin-top:10px;font-weight:700}
      .muted{color:#777;font-size:13px}@media print{.actions{display:none}}.actions{margin-top:14px}
      button{padding:10px 14px;border:1px solid #ddd;border-radius:10px;background:#fff;cursor:pointer}</style></head><body>
      <h1>MAMA’s KÜCHE – مامان‌پز</h1><div class="muted">Hausgemachtes Essen mit Liebe — غذای خانگی با عشق</div>
      <table><thead><tr><th>کالا</th><th>تعداد</th><th>قیمت واحد (€)</th><th>مبلغ (€)</th></tr></thead><tbody>${rows}${feeRow}</tbody></table>
      <div class="sum">جمع کل: € ${total.toFixed(2)}</div><div class="actions"><button onclick="window.print()">چاپ</button></div></body></html>`);
    w.document.close();
  }
  function sendToWhatsApp(){
    if (cart.length===0){ toast('سبد خالی است'); return; }
    const {msg} = buildOrderMessage();
    window.open('https://wa.me/'+WHATSAPP_E164+'?text='+encodeURIComponent(msg),'_blank');
  }

  // ---------- Init ----------
  async function safeInit(){
    try{
      await loadWeeks();                 // JSON → اگر خطا ⇒ Fallback

      // انتخاب پیش‌فرض (خودکار یا دستی)
      selectedWeekIdx = autoSelectWeek();

      // سوییچرِ هفته و متن‌ها
      mountWeekSelect();
      updateDynamicTexts();

      // رندر بخش‌ها
      renderDaily();
      renderMenu();
      renderStarters();
      renderSides();
      setupHero();

      // رویدادها
      document.addEventListener('click', onClickDoc);
      refreshCart();
      $$('input[name="pay"]').forEach(r=>{
        r.addEventListener('change', ()=>{
          if (r.value==='paypal' && r.checked) toast('فعلاً فقط پرداخت نقدی درب منزل فعال است');
        });
      });
      $('#btnWhatsApp')?.addEventListener('click', sendToWhatsApp);
      $('#btnPreview')?.addEventListener('click', openInvoiceWindow);

      log('✅ Initialized (weeks:', WEEKS.length, ', selected:', selectedWeekIdx, ')');
    }catch(e){
      console.error(e);
      toast('خطای اولیه در بارگذاری');
    }
  }
  document.addEventListener('DOMContentLoaded', safeInit);
})();
