(function(){
  const TOOLS={
    watering:{icon:'🪣',name:'Bình tưới',desc:'Có cơ hội hoàn lại năng lượng khi tưới',cost:[0,180,420],rate:[0,.25,.5]},
    hoe:{icon:'⛏️',name:'Cuốc làm đất',desc:'Có cơ hội hoàn lại năng lượng khi gieo hạt',cost:[0,220,480],rate:[0,.25,.5]},
    sprayer:{icon:'🧴',name:'Bình phun',desc:'Có cơ hội không tốn thuốc khi xử lý sâu bệnh',cost:[0,200,450],rate:[0,.25,.5]}
  };
  function ensureTools(){
    if(!S.tools||typeof S.tools!=='object')S.tools={watering:1,hoe:1,sprayer:1};
    for(const k of Object.keys(TOOLS)){
      let lv=Number(S.tools[k])||1;
      S.tools[k]=Math.max(1,Math.min(3,lv));
    }
  }
  function toolRate(k){ensureTools();return TOOLS[k].rate[S.tools[k]-1]||0}
  function maybeRefundEnergy(k){
    const r=toolRate(k);if(r>0&&Math.random()<r){S.en=Math.min(S.max,S.en+1);msg('⚡ '+TOOLS[k].name+' tiết kiệm 1 năng lượng')}
  }
  window.openTools=function(){
    ensureTools();$('#modal').classList.add('open');$('#mt').textContent='🛠️ Nâng cấp dụng cụ';
    $('#mb').innerHTML=`<div class="toolUpgradeIntro">Nâng cấp vĩnh viễn. Cấp càng cao càng tiết kiệm tài nguyên khi chăm ruộng.</div><div class="toolUpgradeList">${Object.entries(TOOLS).map(([k,t])=>{
      const lv=S.tools[k],max=lv>=3,next=max?0:t.cost[lv],pct=Math.round(t.rate[lv-1]*100);
      return `<div class="toolUpgradeCard"><div class="toolUpgradeIcon">${t.icon}</div><div class="toolUpgradeBody"><div class="toolUpgradeTop"><b>${t.name}</b><span>LV ${lv}/3</span></div><small>${t.desc}</small><div class="toolUpgradeEffect">Hiện tại: <b>${pct?pct+'% cơ hội tiết kiệm':'Hiệu quả cơ bản'}</b></div>${!max?`<div class="toolUpgradeNext">Cấp ${lv+1}: ${Math.round(t.rate[lv]*100)}% • ${next}🌿</div>`:'<div class="toolUpgradeMax">✓ Đã nâng tối đa</div>'}</div><button class="primary" onclick="upgradeTool('${k}')" ${max?'disabled':''}>${max?'Tối đa':`Nâng<br>${next}🌿`}</button></div>`
    }).join('')}</div>`;
  };
  window.upgradeTool=function(k){
    ensureTools();const t=TOOLS[k];if(!t)return;const lv=S.tools[k];if(lv>=3)return;const cost=t.cost[lv];
    if(S.coin<cost)return msg('Không đủ tiền');S.coin-=cost;S.tools[k]=lv+1;save();render();openTools();msg('🛠️ '+t.name+' lên cấp '+(lv+1));
  };

  const baseWater=window.water;
  window.water=function(i){
    ensureTools();const p=S.plots?.[i],st=p?si(prog(p)):4,before=p&&p.water?.includes(st);
    const enBefore=S.en;const r=baseWater(i);
    if(p&&!before&&p.water?.includes(st)&&S.en<enBefore)maybeRefundEnergy('watering');save();render();return r
  };
  const baseSpray=window.spray;
  window.spray=function(i){
    ensureTools();const p=S.plots?.[i];if(!p||!p.prob)return baseSpray(i);
    const beforeProb=p.prob,beforeMed=S.inv.pesticide||0,enBefore=S.en;
    const r=baseSpray(i);
    if(beforeProb&&!p.prob&&beforeMed>(S.inv.pesticide||0)&&toolRate('sprayer')>0&&Math.random()<toolRate('sprayer')){
      S.inv.pesticide++;msg('🧴 Bình phun đã tiết kiệm 1 thuốc sâu')
    }
    save();render();return r
  };
  const baseClick=window.clickPlot;
  window.clickPlot=function(i){
    ensureTools();const p=S.plots?.[i],wasEmpty=!!p&&p.unlocked&&!p.crop,enBefore=S.en;
    const r=baseClick(i);
    const nowCrop=S.plots?.[i]?.crop;
    if(wasEmpty&&nowCrop&&S.en<enBefore){maybeRefundEnergy('hoe');save();render()}
    return r
  };

  const baseOpenModal=window.openModal;
  window.openModal=function(t){
    if(t==='tools')return openTools();
    const r=baseOpenModal(t);
    if(t==='shop'){
      const b=$('#mb');if(b&&!b.querySelector('.toolShopEntry'))b.insertAdjacentHTML('afterbegin',`<div class="toolShopEntry"><div><b>🛠️ Dụng cụ nông trại</b><small>Nâng cấp bình tưới, cuốc và bình phun</small></div><button class="primary" onclick="openTools()">Nâng cấp</button></div>`)
    }
    return r
  };
  ensureTools();save();
})();