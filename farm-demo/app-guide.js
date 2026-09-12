(function(){
  const baseOpenModal=window.openModal;
  function weatherName(key){return (W[key]?.[1]||'')+' '+(W[key]?.[0]||key)}
  function rarityText(c){return c[11]==='rare'?'HIẾM':'THƯỜNG'}
  function guideCard(id,c){
    const locked=S.lv<c[5];
    return `<button class="guideCard ${c[11]==='rare'?'rare':''} ${locked?'lockedGuide':''}" onclick="showCropGuide('${id}')">
      <div class="guideIcon">${c[1]}</div>
      <div class="guideInfo"><b>${c[0]}</b><span>${rarityText(c)} • LV ${c[5]}</span></div>
      <div class="guideArrow">›</div>
    </button>`
  }
  window.openGuide=function(filter='all'){
    $('#modal').classList.add('open');
    $('#mt').textContent='📖 Cẩm nang cây trồng';
    const entries=Object.entries(C).filter(([,c])=>filter==='all'||c[11]===filter);
    const normalCount=Object.values(C).filter(c=>c[11]==='normal').length;
    const rareCount=Object.values(C).filter(c=>c[11]==='rare').length;
    $('#mb').innerHTML=`<div class="guideSummary">Có <b>${Object.keys(C).length}</b> giống cây • ${normalCount} thường • ${rareCount} hiếm</div>
      <div class="guideTabs">
        <button class="${filter==='all'?'active':''}" onclick="openGuide('all')">Tất cả</button>
        <button class="${filter==='normal'?'active':''}" onclick="openGuide('normal')">Thường</button>
        <button class="${filter==='rare'?'active':''}" onclick="openGuide('rare')">Hiếm</button>
      </div>
      <div class="guideList">${entries.map(([id,c])=>guideCard(id,c)).join('')}</div>`;
  };
  window.showCropGuide=function(id){
    const c=C[id]; if(!c)return;
    $('#modal').classList.add('open');
    $('#mt').textContent='📖 '+c[0];
    $('#mb').innerHTML=`<div class="guideDetailHero"><div class="guideDetailIcon">${c[1]}</div><div><b>${c[0]}</b><div>${badge(c[11])}</div></div></div>
      <div class="confirmCard">
        <div class="confirmLine"><span class="confirmLabel">Mở khóa</span><span class="confirmValue">LV ${c[5]}</span></div>
        <div class="confirmLine"><span class="confirmLabel">Giá hạt</span><span class="confirmValue">${c[2]}🌿</span></div>
        <div class="confirmLine"><span class="confirmLabel">Giá bán</span><span class="confirmValue">${c[3]}🌿</span></div>
        <div class="confirmLine"><span class="confirmLabel">Thời gian</span><span class="confirmValue">${c[4]} giây</span></div>
        <div class="confirmLine"><span class="confirmLabel">Thời tiết ưa thích</span><span class="confirmValue">${weatherName(c[6])}</span></div>
        <div class="confirmLine"><span class="confirmLabel">Số lứa</span><span class="confirmValue">${c[7]}</span></div>
        <div class="confirmLine"><span class="confirmLabel">Đột biến</span><span class="confirmValue">🧬 ${c[8]}</span></div>
        <div class="confirmLine"><span class="confirmLabel">Giá đột biến</span><span class="confirmValue confirmTotal">${c[9]}🌿</span></div>
      </div>
      <button class="ghost guideBack" onclick="openGuide('all')">← Quay lại cẩm nang</button>`;
  };
  window.openModal=function(t){if(t==='guide')return openGuide('all');return baseOpenModal(t)};
})();