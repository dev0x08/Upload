(function(){
  function areas(){return Object.values(window.FARM_AREAS||{main:{id:'main',icon:'🏡',name:'Khu chính',start:0,count:20}})}
  function areaUnlocked(a){return a.id==='main'||!!S.expansion?.areas?.[a.id]?.unlocked}
  function areaStats(a){
    let unlocked=0,planted=0,water=0,problem=0,ready=0,empty=0;
    for(let i=a.start;i<a.start+a.count;i++){
      const p=S.plots?.[i];if(!p?.unlocked)continue;unlocked++;
      if(!p.crop){empty++;continue}planted++;tick(p);const q=prog(p),st=si(q);if(st<4&&!p.water.includes(st))water++;if(p.prob)problem++;if(q>=1&&!p.prob)ready++
    }
    return{unlocked,planted,water,problem,ready,empty}
  }
  function workerAreaSummary(a){
    const names=[];for(const [k,w] of Object.entries(window.WORKER_TYPES||{})){const x=S.workers?.[k];if(x&&x.until>now()&&(x.area||'main')===a.id)names.push(w.icon)}return names.join(' ')||'—'
  }
  window.openFarmManagement=function(){
    $('#modal').classList.add('open');$('#mt').textContent='📊 Quản lý nông trại';
    const used=typeof storageUsed==='function'?storageUsed():0,cap=typeof storageCap==='function'?storageCap():0;
    const rows=areas().map(a=>{
      const on=areaUnlocked(a),s=on?areaStats(a):null;
      return `<div class="farmManageCard ${on?'':'lockedManage'}"><div class="farmManageIcon">${a.icon||'🌾'}</div><div class="farmManageBody"><div class="farmManageTop"><b>${a.name||a.short||a.id}</b><span>${on?`${s.unlocked}/${a.count} ô`:'🔒 Chưa mở'}</span></div>${on?`<div class="farmManageChips"><span>🌱 ${s.planted} cây</span><span>💧 ${s.water} cần tưới</span><span>🐛 ${s.problem} vấn đề</span><span>🧺 ${s.ready} chờ thu</span></div><small>Nhân công: ${workerAreaSummary(a)}</small>`:`<small>Yêu cầu LV ${a.lv||'-'} • ${a.cost||0}🌿</small>`}</div><button class="primary" onclick="switchFarmArea('${a.id}');closeModal();render()">${on?'Đi tới':'Xem'}</button></div>`
    }).join('');
    $('#mb').innerHTML=`<div class="farmManageSummary"><div><b>LV ${S.lv}</b><span>Cấp nông trại</span></div><div><b>${S.coin}🌿</b><span>Tài chính</span></div><div><b>${used}/${cap||'∞'}</b><span>Kho</span></div></div><div class="farmManageList">${rows}</div><div class="farmManageTip">Bảng này chỉ tổng hợp trạng thái. Mọi thao tác trồng, tưới, chăm và thu hoạch vẫn thực hiện ở từng ô đất hoặc qua nhân công đã thuê.</div>`
  };
  const baseOpenModal=window.openModal;
  window.openModal=function(t){if(t==='management')return openFarmManagement();const r=baseOpenModal(t);if(t==='shop'){const b=$('#mb');if(b&&!b.querySelector('.farmManageEntry'))b.insertAdjacentHTML('afterbegin',`<div class="farmManageEntry"><div><b>📊 Quản lý nông trại</b><small>Xem nhanh tất cả khu đất, cây cần chăm và kho</small></div><button class="primary" onclick="openFarmManagement()">Mở</button></div>`)}return r};
})();