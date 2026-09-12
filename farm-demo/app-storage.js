(function(){
  const LEVELS=[
    {cap:80,cost:0},
    {cap:120,cost:600},
    {cap:180,cost:1400},
    {cap:260,cost:3000},
    {cap:360,cost:6000}
  ];
  function ensureStorage(){
    if(!S.storage||typeof S.storage!=='object')S.storage={level:1};
    let lv=Math.max(1,Math.min(LEVELS.length,Number(S.storage.level)||1));S.storage.level=lv
  }
  function sumObj(o){return Object.values(o||{}).reduce((a,n)=>a+(Number(n)||0),0)}
  window.storageUsed=function(){
    ensureStorage();let total=0;
    total+=sumObj(S.inv?.seeds);total+=sumObj(S.inv?.prod);total+=Number(S.inv?.pesticide)||0;total+=Number(S.inv?.fertilizer)||0;total+=sumObj(S.inv?.fertilizers);
    return Math.max(0,Math.floor(total))
  };
  window.storageCap=function(){ensureStorage();return LEVELS[S.storage.level-1].cap};
  window.canStore=function(q=1){return storageUsed()+Math.max(0,Number(q)||0)<=storageCap()};
  function fullMsg(){msg('🎒 Kho đã đầy, hãy bán đồ hoặc nâng cấp kho')}

  window.openStorage=function(){
    ensureStorage();const used=storageUsed(),cap=storageCap(),lv=S.storage.level,max=lv>=LEVELS.length,next=max?null:LEVELS[lv],pct=Math.min(100,used/cap*100);
    $('#modal').classList.add('open');$('#mt').textContent='🏚️ Kho nông trại';
    $('#mb').innerHTML=`<div class="storageHero"><div><b>Kho LV ${lv}/${LEVELS.length}</b><span>${used}/${cap} ô chứa</span></div><div class="storageBar"><i style="width:${pct}%"></i></div></div>${max?'<div class="storageMax">✓ Kho đã nâng tối đa</div>':`<div class="storageUpgrade"><div><b>Nâng lên ${next.cap} ô chứa</b><small>Tăng thêm ${next.cap-cap} sức chứa</small></div><button class="primary" onclick="upgradeStorage()">Nâng<br>${next.cost}🌿</button></div>`}<div class="storageNote">Kho tính hạt giống, nông sản, thuốc sâu và các loại phân bón. Trồng cây, bán hàng hoặc giao đơn sẽ giải phóng chỗ trống.</div><button class="ghost" style="width:100%;margin-top:10px" onclick="openModal('inv')">← Quay lại kho đồ</button>`
  };
  window.upgradeStorage=function(){
    ensureStorage();const lv=S.storage.level;if(lv>=LEVELS.length)return;const next=LEVELS[lv];
    if(S.coin<next.cost)return msg('Không đủ tiền');S.coin-=next.cost;S.storage.level++;save();render();openStorage();msg('🏚️ Kho đã được nâng cấp')
  };

  const baseBuy=window.buy;
  window.buy=function(id,q){if(!canStore(q))return fullMsg();return baseBuy(id,q)};
  const baseBuyMat=window.buyMat;
  window.buyMat=function(k,q,p){if(!canStore(q))return fullMsg();return baseBuyMat(k,q,p)};
  if(typeof window.buyFert==='function'){
    const baseBuyFert=window.buyFert;window.buyFert=function(k,q){if(!canStore(q))return fullMsg();return baseBuyFert(k,q)}
  }
  const baseHarvest=window.harvest;
  window.harvest=function(i){const p=S.plots?.[i];if(p?.crop&&prog(p)>=1&&!p.prob&&!canStore(1))return fullMsg();return baseHarvest(i)};

  const baseOpenModal=window.openModal;
  window.openModal=function(t){
    if(t==='storage')return openStorage();
    const r=baseOpenModal(t);
    if(t==='inv'){
      const b=$('#mb');if(b&&!b.querySelector('.storageEntry')){
        const used=storageUsed(),cap=storageCap();b.insertAdjacentHTML('afterbegin',`<div class="storageEntry"><div><b>🏚️ Kho LV ${S.storage.level}</b><small>Đang dùng ${used}/${cap} ô chứa</small></div><button class="primary" onclick="openStorage()">Nâng kho</button></div>`)
      }
    }
    return r
  };
  ensureStorage();save();
})();