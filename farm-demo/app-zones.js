(function(){
  const SOILS={
    normal:{icon:'🟫',name:'Đất thường',price:0,desc:'Không có hiệu ứng đặc biệt',speed:1,risk:1,mut:1},
    fertile:{icon:'🌱',name:'Đất màu mỡ',price:250,desc:'Tăng 15% tốc độ sinh trưởng',speed:1.15,risk:1,mut:1},
    healthy:{icon:'🛡️',name:'Đất khỏe',price:300,desc:'Giảm 35% nguy cơ sâu bệnh',speed:1,risk:.65,mut:1},
    mutation:{icon:'🧬',name:'Đất đột biến',price:350,desc:'Tăng 25% cơ hội đột biến',speed:1,risk:1,mut:1.25},
    moist:{icon:'💧',name:'Đất giữ ẩm',price:280,desc:'20% cơ hội tự giữ đủ nước khi sang giai đoạn mới',speed:1,risk:1,mut:1,moist:.20}
  };

  function ensureSoils(){
    for(const p of S.plots||[]){if(p&&(!p.soil||!SOILS[p.soil]))p.soil='normal'}
    if(Array.isArray(S.expansionPlots))for(const p of S.expansionPlots){if(p&&(!p.soil||!SOILS[p.soil]))p.soil='normal'}
  }
  function soilOf(p){ensureSoils();return SOILS[p?.soil]||SOILS.normal}
  function plotNo(i){return i<20?'Ô '+(i+1):'Ô Đông '+(i-19)}

  const baseTick=window.tick;
  window.tick=function(p){
    if(!p?.crop)return baseTick(p);
    const st=si(prog(p)),before=p.g||0,c=C[p.crop],soil=soilOf(p);
    const r=baseTick(p),delta=(p.g||0)-before;
    if(delta>0&&soil.speed>1&&st<4&&c)p.g=Math.min((p.g||0)+delta*(soil.speed-1),ENDS[st]*c[4]*1000);
    const after=si(prog(p));
    if(soil.moist&&after>st&&after<4&&!p.water.includes(after)&&Math.random()<soil.moist){p.water.push(after);msg('💧 Đất giữ ẩm đã giữ nước cho cây')}
    return r
  };

  window.mutate=function(p,q){
    if(!p?.crop||p.mutCheck||q<.72)return;
    p.mutCheck=true;const c=C[p.crop];if(!c)return;
    const fertMul=p.fert==='mutation'?2.5:1,soilMul=soilOf(p).mut||1;
    if(Math.random()<Math.min(.5,c[10]*fertMul*soilMul)){
      p.mut=true;S.stats.mutant=(S.stats.mutant||0)+1;
      S.discovery=S.discovery||{};S.discovery.crops=S.discovery.crops||{};S.discovery.mutants=S.discovery.mutants||{};
      S.discovery.crops[p.crop]=1;S.discovery.mutants[p.crop]=1;msg('🧬 Cây đột biến!')
    }
  };

  window.risk=function(p,q){
    const st=si(q);if(!p?.crop||st<1||st>3||p.check.includes(st))return;
    p.check.push(st);const c=C[p.crop];if(!c)return;
    const protect=p.fert==='protect'?.35:1,soilMul=soilOf(p).risk||1;
    if(Math.random()<.08*W[S.weather][3]*(S.weather===c[6]?.75:1)*protect*soilMul)p.prob=Math.random()<.65?'pest':'disease'
  };

  const baseClick=window.clickPlot;
  window.clickPlot=function(i){
    ensureSoils();const p=S.plots?.[i];
    if(p&&p.unlocked&&!p.crop){
      const c=C[S.sel];if(!c||c[5]>S.lv||(S.inv.seeds[S.sel]||0)<1)return msg('Không có hạt phù hợp');
      const oldSoil=p.soil||'normal',enBefore=S.en;if(!spend())return;
      S.inv.seeds[S.sel]--;Object.assign(p,empty(true),{crop:S.sel,soil:oldSoil});S.stats.plant=(S.stats.plant||0)+1;
      S.discovery=S.discovery||{};S.discovery.crops=S.discovery.crops||{};S.discovery.crops[S.sel]=1;
      const lv=Math.max(1,Math.min(3,Number(S.tools?.hoe)||1)),rate=[0,.25,.5][lv-1]||0;
      if(S.en<enBefore&&rate&&Math.random()<rate){S.en=Math.min(S.max,S.en+1);msg('⚡ Cuốc làm đất tiết kiệm 1 năng lượng')}
      save();render();return
    }
    return baseClick(i)
  };

  window.openSoils=function(){
    ensureSoils();$('#modal').classList.add('open');$('#mt').textContent='🌱 Cải tạo đất';
    const rows=(S.plots||[]).map((p,i)=>({p,i})).filter(x=>x.p?.unlocked);
    $('#mb').innerHTML=`<div class="soilIntro">Mỗi ô đất có thể mua một loại đất giàu chất dinh dưỡng riêng. Hiệu ứng tồn tại vĩnh viễn cho ô đó và áp dụng cho mọi vụ cây sau này.</div><div class="soilList">${rows.map(({p,i})=>{const s=soilOf(p);return `<div class="soilRow"><div class="soilPlot"><b>${plotNo(i)}</b><span>${s.icon} ${s.name}</span><small>${s.desc}</small></div><button class="primary" onclick="chooseSoil(${i})">${p.soil==='normal'?'Cải tạo':'Đổi đất'}</button></div>`}).join('')}</div>`
  };

  window.chooseSoil=function(i){
    ensureSoils();const p=S.plots?.[i];if(!p?.unlocked)return;
    $('#modal').classList.add('open');$('#mt').textContent='🌱 '+plotNo(i);
    $('#mb').innerHTML=`<div class="soilIntro">Đất hiện tại: <b>${soilOf(p).icon} ${soilOf(p).name}</b>. Chọn loại mới để cải tạo ô đất này.</div><div class="soilChoices">${Object.entries(SOILS).filter(([k])=>k!=='normal').map(([k,s])=>`<div class="soilChoice ${p.soil===k?'owned':''}"><div class="soilChoiceIcon">${s.icon}</div><div><b>${s.name}</b><small>${s.desc}</small><span>${s.price}🌿</span></div><button class="primary" onclick="askBuySoil(${i},'${k}')" ${p.soil===k?'disabled':''}>${p.soil===k?'Đang dùng':'Mua'}</button></div>`).join('')}</div><button class="ghost" style="width:100%;margin-top:10px" onclick="openSoils()">← Quay lại</button>`
  };

  window.askBuySoil=function(i,k){
    const s=SOILS[k];if(!s)return;confirmBox('Xác nhận cải tạo đất',confirmRows(s.name,1,s.price,s.price),`buySoil(${i},'${k}')`)
  };
  window.buySoil=function(i,k){
    ensureSoils();const p=S.plots?.[i],s=SOILS[k];if(!p?.unlocked||!s||k==='normal')return;
    if(S.coin<s.price)return msg('Không đủ tiền');S.coin-=s.price;p.soil=k;save();render();chooseSoil(i);msg('🌱 Đã cải tạo '+plotNo(i))
  };

  const baseRenderPlots=window.renderPlots;
  window.renderPlots=function(){
    ensureSoils();const r=baseRenderPlots();
    document.querySelectorAll('#plots .plot').forEach((el,i)=>{
      const p=S.plots?.[i];if(!p)return;
      if(p.unlocked&&!p.crop)el.classList.remove('next','wait');
      for(const k of Object.keys(SOILS))el.classList.remove('soil-'+k);
      const s=soilOf(p);el.classList.add('soil-'+(p.soil||'normal'));
      if(p.unlocked&&p.soil!=='normal'&&!el.querySelector('.soilMark'))el.insertAdjacentHTML('beforeend',`<span class="soilMark">${s.icon}</span>`)
    });return r
  };

  const baseCare=window.care;
  window.care=function(i){
    const r=baseCare(i),p=S.plots?.[i],s=soilOf(p),b=$('#mb');
    if(b&&p&&!b.querySelector('.soilCare')){
      const hero=b.querySelector('.careHero');hero?.insertAdjacentHTML('afterend',`<div class="soilCare"><b>${s.icon} ${s.name}</b><span>${s.desc}</span></div>`)
    }
    return r
  };

  const baseOpenModal=window.openModal;
  window.openModal=function(t){
    if(t==='soils'||t==='zones')return openSoils();
    const r=baseOpenModal(t);
    if(t==='shop'){
      const b=$('#mb');if(b&&!b.querySelector('.soilShopEntry'))b.insertAdjacentHTML('afterbegin',`<div class="soilShopEntry"><div><b>🌱 Cải tạo đất</b><small>Mua đất có chất dinh dưỡng riêng cho từng ô</small></div><button class="primary" onclick="openSoils()">Quản lý</button></div>`)
    }
    return r
  };

  ensureSoils();save();window.FARM_SOILS=SOILS;
})();