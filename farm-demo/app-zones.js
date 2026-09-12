(function(){
  const ZONES=[
    {id:'sun',icon:'☀️',name:'Đồng nắng',range:'Ô 1–4',desc:'Cây ưa nắng/nóng lớn nhanh hơn 15%',speed:1.15,prefs:['sunny','hot']},
    {id:'wet',icon:'🌧️',name:'Vườn ẩm',range:'Ô 5–8',desc:'Cây ưa mưa/nhiều mây lớn nhanh hơn 15%',speed:1.15,prefs:['rain','cloudy']},
    {id:'safe',icon:'🛡️',name:'Đất khỏe',range:'Ô 9–12',desc:'Giảm 35% nguy cơ sâu bệnh',risk:.65},
    {id:'mut',icon:'🧬',name:'Đất màu',range:'Ô 13–16',desc:'Tăng 25% cơ hội đột biến',mut:1.25},
    {id:'glass',icon:'🌿',name:'Nhà kính',range:'Ô 17–20',desc:'Tăng 10% tốc độ mọi cây, giảm 15% sâu bệnh',speed:1.10,risk:.85}
  ];
  function zoneIndex(i){return Math.max(0,Math.min(ZONES.length-1,Math.floor(i/4)))}
  function zoneOfPlot(p){const i=(S.plots||[]).indexOf(p);return i<0?null:ZONES[zoneIndex(i)]}
  function speedMul(p){const z=zoneOfPlot(p);if(!z||!p.crop)return 1;const c=C[p.crop];if(!c)return 1;if(z.prefs&&!z.prefs.includes(c[6]))return 1;return z.speed||1}
  function riskMul(p){return zoneOfPlot(p)?.risk||1}
  function mutMul(p){return zoneOfPlot(p)?.mut||1}

  const baseTick=window.tick;
  window.tick=function(p){
    if(!p?.crop)return baseTick(p);
    const st=si(prog(p)),before=p.g||0,c=C[p.crop];
    const r=baseTick(p),delta=(p.g||0)-before,m=speedMul(p);
    if(delta>0&&m>1&&st<4&&c){p.g=Math.min((p.g||0)+delta*(m-1),ENDS[st]*c[4]*1000)}
    return r
  };

  window.mutate=function(p,q){
    if(!p?.crop||p.mutCheck||q<.72)return;
    p.mutCheck=true;const c=C[p.crop];if(!c)return;
    const fertMul=p.fert==='mutation'?2.5:1,zMul=mutMul(p);
    if(Math.random()<Math.min(.5,c[10]*fertMul*zMul)){
      p.mut=true;S.stats.mutant=(S.stats.mutant||0)+1;
      S.discovery=S.discovery||{};S.discovery.crops=S.discovery.crops||{};S.discovery.mutants=S.discovery.mutants||{};
      S.discovery.crops[p.crop]=1;S.discovery.mutants[p.crop]=1;msg('🧬 Cây đột biến!')
    }
  };

  window.risk=function(p,q){
    const st=si(q);if(!p?.crop||st<1||st>3||p.check.includes(st))return;
    p.check.push(st);const c=C[p.crop];if(!c)return;
    const protect=p.fert==='protect'?.35:1,zMul=riskMul(p);
    if(Math.random()<.08*W[S.weather][3]*(S.weather===c[6]?.75:1)*protect*zMul)p.prob=Math.random()<.65?'pest':'disease'
  };

  const baseClick=window.clickPlot;
  window.clickPlot=function(i){
    const p=S.plots?.[i];
    if(p&&p.unlocked&&!p.crop){
      const c=C[S.sel];if(!c||c[5]>S.lv||(S.inv.seeds[S.sel]||0)<1)return msg('Không có hạt phù hợp');
      const enBefore=S.en;if(!spend())return;
      S.inv.seeds[S.sel]--;Object.assign(p,empty(true),{crop:S.sel});S.stats.plant=(S.stats.plant||0)+1;
      S.discovery=S.discovery||{};S.discovery.crops=S.discovery.crops||{};S.discovery.crops[S.sel]=1;
      const lv=Math.max(1,Math.min(3,Number(S.tools?.hoe)||1)),rate=[0,.25,.5][lv-1]||0;
      if(S.en<enBefore&&rate&&Math.random()<rate){S.en=Math.min(S.max,S.en+1);msg('⚡ Cuốc làm đất tiết kiệm 1 năng lượng')}
      save();render();return
    }
    return baseClick(i)
  };

  const baseRenderPlots=window.renderPlots;
  window.renderPlots=function(){
    const r=baseRenderPlots();
    document.querySelectorAll('#plots .plot').forEach((el,i)=>{
      const z=ZONES[zoneIndex(i)];el.classList.add('zone-'+z.id);el.dataset.zone=z.name;el.title=z.name+' — '+z.desc;
      if(!el.querySelector('.zoneMark'))el.insertAdjacentHTML('beforeend',`<span class="zoneMark">${z.icon}</span>`)
    });return r
  };

  const baseCare=window.care;
  window.care=function(i){
    const r=baseCare(i),z=ZONES[zoneIndex(i)],b=$('#mb');
    if(b&&!b.querySelector('.zoneCare')){
      const hero=b.querySelector('.careHero');
      hero?.insertAdjacentHTML('afterend',`<div class="zoneCare"><b>${z.icon} ${z.name}</b><span>${z.desc}</span></div>`)
    }
    return r
  };

  window.openZones=function(){
    $('#modal').classList.add('open');$('#mt').textContent='🌾 Khu đất chuyên canh';
    $('#mb').innerHTML=`<div class="zoneIntro">Mỗi 4 ô đất thuộc một khu có lợi thế riêng. Bạn có thể trồng tự do trên bất kỳ ô đã mở; chỉ việc <b>mua ô đất mới</b> vẫn bắt buộc theo thứ tự.</div><div class="zoneList">${ZONES.map((z,i)=>`<div class="zoneCard zone-${z.id}"><div class="zoneIcon">${z.icon}</div><div><b>${z.name}</b><small>${z.range}</small><p>${z.desc}</p></div></div>`).join('')}</div>`
  };

  const baseOpenModal=window.openModal;
  window.openModal=function(t){
    if(t==='zones')return openZones();
    const r=baseOpenModal(t);
    if(t==='shop'){
      const b=$('#mb');if(b&&!b.querySelector('.zoneShopEntry'))b.insertAdjacentHTML('afterbegin',`<div class="zoneShopEntry"><div><b>🌾 Khu đất chuyên canh</b><small>Xem bonus của từng nhóm 4 ô đất</small></div><button class="primary" onclick="openZones()">Xem</button></div>`)
    }
    return r
  };

  window.FARM_ZONES=ZONES;
})();