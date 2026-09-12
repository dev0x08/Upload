(function(){
  const BASE_OPEN=window.openModal;
  const BASE_RENDER=window.render;
  const BASE_ROW_PROD=window.rowProd;
  const CYCLE=10*60*1000;

  function ensureMarket(){
    S.market=S.market||{};
    if(!S.market.mult||typeof S.market.mult!=='object'||!Number.isFinite(Number(S.market.nextAt))||now()>=S.market.nextAt){
      rollMarket();
    }
  }

  function rollMarket(){
    const ids=Object.keys(C);
    const shuffled=[...ids].sort(()=>Math.random()-.5);
    const mult={};ids.forEach(id=>mult[id]=1);
    shuffled.slice(0,3).forEach((id,i)=>{mult[id]=[1.35,1.25,1.15][i]});
    shuffled.slice(3,5).forEach((id,i)=>{mult[id]=[.85,.8][i]});
    S.market={mult,nextAt:now()+CYCLE,updatedAt:now()};
    save();
  }

  function marketMult(id){ensureMarket();return Number(S.market.mult?.[id])||1}
  function marketPrice(id,mut=false){const c=C[id],base=mut?c[9]:c[3];return Math.max(1,Math.round(base*marketMult(id)))}
  function trend(id){const m=marketMult(id);return m>1?['📈','up','+'+Math.round((m-1)*100)+'%']:m<1?['📉','down','-'+Math.round((1-m)*100)+'%']:['➖','flat','0%']}
  function fmtLeft(ms){let s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60);return `${m}:${String(s%60).padStart(2,'0')}`}

  window.openProduceMarket=function(){
    ensureMarket();
    $('#modal').classList.add('open');$('#mt').textContent='📈 Chợ nông sản';
    const rows=Object.entries(C).filter(([,c])=>c[5]<=S.lv).sort((a,b)=>marketMult(b[0])-marketMult(a[0])).map(([id,c])=>{
      const t=trend(id),p=marketPrice(id,false),base=c[3];
      return `<div class="marketRow ${t[1]}"><div class="marketCrop"><span>${c[1]}</span><div><b>${c[0]}</b><small>Giá gốc ${base}🌿</small></div></div><div class="marketPrice"><b>${p}🌿</b><span>${t[0]} ${t[2]}</span></div></div>`;
    }).join('');
    $('#mb').innerHTML=`<div class="marketHero"><div><b>Giá thị trường đang biến động</b><small>Giá bán trong Kho tự áp dụng theo bảng này.</small></div><strong id="marketCountdown">${fmtLeft(S.market.nextAt-now())}</strong></div><div class="marketLegend"><span class="up">📈 Tăng giá</span><span class="flat">➖ Bình thường</span><span class="down">📉 Giảm giá</span></div><div class="marketList">${rows}</div>`;
  };

  window.rowProd=function(id,c,m){
    ensureMarket();
    const k=m?'m_'+id:id,n=S.inv.prod[k],p=marketPrice(id,m),base=m?c[9]:c[3],t=trend(id),changed=p!==base;
    return `<div class="row marketInventoryRow"><span>${m?'🧬 ':c[1]+' '}${m?c[8]:c[0]}<br><small>${changed?`<s>${base}🌿</s> `:''}<b class="marketSellPrice ${t[1]}">${p}🌿/cái</b> ${t[0]} ${t[2]}</small></span><span><b>${n}</b> <input class="qty" id="sp_${k}" value="1" type="number"><button class="primary" onclick="sellProd('${id}',${m},${p})">Bán</button></span></div>`;
  };

  function injectMarketEntry(t){
    if(t!=='shop'&&t!=='inv')return;
    const mb=$('#mb');if(!mb||mb.querySelector('.marketEntry'))return;
    mb.insertAdjacentHTML('afterbegin',`<button class="marketEntry" onclick="openProduceMarket()"><span>📈</span><div><b>Chợ nông sản</b><small>Giá thay đổi sau <strong>${fmtLeft(S.market.nextAt-now())}</strong></small></div><em>Xem giá ›</em></button>`);
  }

  window.openModal=function(t){
    ensureMarket();
    const r=BASE_OPEN(t);
    injectMarketEntry(t);
    return r;
  };

  window.render=function(){
    ensureMarket();
    const r=BASE_RENDER();
    const cd=document.getElementById('marketCountdown');if(cd)cd.textContent=fmtLeft(S.market.nextAt-now());
    return r;
  };

  window.marketPrice=marketPrice;
  window.marketMult=marketMult;
  ensureMarket();save();
})();