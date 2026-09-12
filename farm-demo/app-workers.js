(function(){
  const DAY=24*60*60*1000,MONTH=30*DAY,LIMIT=12;
  const WORKERS={
    watering:{icon:'💧',name:'Người tưới',desc:'Tự tưới cây đang cần nước',day:120,month:2400},
    care:{icon:'🧴',name:'Người chăm cây',desc:'Tự xử lý sâu bệnh nếu kho còn thuốc',day:160,month:3200},
    harvest:{icon:'🧺',name:'Người thu hoạch',desc:'Tự thu hoạch cây đã chín',day:200,month:4000}
  };
  function areaList(){
    const A=window.FARM_AREAS||{main:{id:'main',icon:'🏡',name:'Khu chính',start:0,count:20}};
    return Object.values(A).filter(a=>a.id==='main'||S.expansion?.areas?.[a.id]?.unlocked)
  }
  function areaById(id){return areaList().find(a=>a.id===id)||areaList()[0]}
  function ensureWorkers(){
    if(!S.workers||typeof S.workers!=='object')S.workers={};
    for(const k of Object.keys(WORKERS)){
      if(!S.workers[k]||typeof S.workers[k]!=='object')S.workers[k]={until:0,area:'main'};
      if(!Number.isFinite(Number(S.workers[k].until)))S.workers[k].until=0;
      if(!areaList().some(a=>a.id===S.workers[k].area))S.workers[k].area='main';
    }
  }
  function active(k){ensureWorkers();return Number(S.workers[k].until)>now()}
  function leftText(ms){
    if(ms<=0)return'Đã hết hạn';
    const d=Math.floor(ms/DAY),h=Math.floor((ms%DAY)/3600000),m=Math.floor((ms%3600000)/60000);
    if(d>0)return d+' ngày '+h+' giờ';if(h>0)return h+' giờ '+m+' phút';return Math.max(1,m)+' phút'
  }
  function expiryText(ts){if(!ts||ts<=now())return'Chưa thuê';return new Date(ts).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
  function managedPlots(k){
    ensureWorkers();const a=areaById(S.workers[k]?.area||'main'),start=a.start||0,count=a.count||20;
    return (S.plots||[]).map((p,i)=>({p,i})).filter(x=>x.i>=start&&x.i<start+count&&x.p&&x.p.unlocked).slice(0,LIMIT)
  }
  function areaOptions(selected){return areaList().map(a=>`<option value="${a.id}" ${a.id===selected?'selected':''}>${a.icon||'🌾'} ${a.name||a.short||a.id}</option>`).join('')}

  window.openWorkers=function(){
    ensureWorkers();$('#modal').classList.add('open');$('#mt').textContent='👨‍🌾 Thuê nhân công';
    $('#mb').innerHTML=`<div class="workerIntro">Nhân công làm việc theo thời hạn, không có cấp độ. Mỗi người phụ trách tối đa <b>${LIMIT} ô đã mở</b> trong <b>một khu được phân công</b>.</div><div class="workerList">${Object.entries(WORKERS).map(([k,w])=>{
      const on=active(k),until=S.workers[k].until,a=areaById(S.workers[k].area);
      return `<div class="workerCard ${on?'active':''}"><div class="workerIcon">${w.icon}</div><div class="workerBody"><div class="workerTop"><b>${w.name}</b><span>${on?'ĐANG LÀM':'CHƯA THUÊ'}</span></div><small>${w.desc}</small><div class="workerMeta">${on?`Còn <b>${leftText(until-now())}</b> • hết ${expiryText(until)}`:'Thuê bằng 🌿 trong game'}</div><label class="workerAssign"><span>Phụ trách</span><select onchange="assignWorkerArea('${k}',this.value)">${areaOptions(a.id)}</select></label><div class="workerPrices"><button class="primary" onclick="askHireWorker('${k}','day')">1 ngày<br><b>${w.day}🌿</b></button><button class="primary" onclick="askHireWorker('${k}','month')">30 ngày<br><b>${w.month}🌿</b></button></div></div></div>`
    }).join('')}</div><div class="workerNote">Có thể đổi khu phụ trách bất cứ lúc nào. Nhân công không gieo hạt và chỉ hoạt động khi game đang mở ở bản local hiện tại.</div>`;
  };
  window.assignWorkerArea=function(k,id){ensureWorkers();if(!WORKERS[k]||!areaList().some(a=>a.id===id))return;S.workers[k].area=id;save();msg('👨‍🌾 Đã đổi khu phụ trách')};
  window.askHireWorker=function(k,plan){const w=WORKERS[k];if(!w)return;const isMonth=plan==='month',days=isMonth?30:1,price=isMonth?w.month:w.day;confirmBox('Xác nhận thuê',confirmRows(w.name,days+' ngày',price,price),`hireWorker('${k}','${plan}')`)};
  window.hireWorker=function(k,plan){
    ensureWorkers();const w=WORKERS[k];if(!w)return;const isMonth=plan==='month',price=isMonth?w.month:w.day,dur=isMonth?MONTH:DAY;
    if(S.coin<price)return msg('Không đủ tiền');S.coin-=price;S.workers[k].until=Math.max(now(),Number(S.workers[k].until)||0)+dur;save();render();openWorkers();msg('👨‍🌾 Đã thuê '+w.name)
  };

  function autoWater(){if(!active('watering'))return false;for(const {p} of managedPlots('watering')){if(!p.crop)continue;tick(p);const st=si(prog(p));if(st<4&&!p.water.includes(st)){p.water.push(st);p.last=now();S.stats.water=(S.stats.water||0)+1;return true}}return false}
  function autoCare(){if(!active('care')||(S.inv.pesticide||0)<1)return false;for(const {p} of managedPlots('care')){if(!p.crop)continue;tick(p);risk(p,prog(p));if(p.prob){S.inv.pesticide--;p.prob=null;S.stats.spray=(S.stats.spray||0)+1;return true}}return false}
  function autoHarvest(){
    if(!active('harvest'))return false;
    for(const {p} of managedPlots('harvest')){
      if(!p.crop)continue;tick(p);let q=prog(p);mutate(p,q);risk(p,q);if(q<1||p.prob)continue;if(typeof canStore==='function'&&!canStore(1))return false;
      const id=p.crop,c=C[id],k=p.mut?'m_'+id:id;S.inv.prod[k]=(S.inv.prod[k]||0)+1;S.stats.harvest=(S.stats.harvest||0)+1;addXP(c[5]*5);
      if(typeof cropDiscovered==='function'){S.discovery=S.discovery||{};S.discovery.crops=S.discovery.crops||{};S.discovery.crops[id]=1}
      if(p.mut&&typeof mutantDiscovered==='function'){S.discovery=S.discovery||{};S.discovery.mutants=S.discovery.mutants||{};S.discovery.mutants[id]=1}
      const left=c[7]-(p.h+1);if(left>0){const soil=p.soil;p.h++;p.g=.72*c[4]*1000;p.water=[0,1,2];p.fert=false;p.prob=null;p.check=[];p.mut=false;p.mutCheck=false;p.last=now();p.soil=soil}else{const soil=p.soil;Object.assign(p,empty(true),{soil})}return true
    }
    return false
  }
  function workerTick(){ensureWorkers();let changed=false;try{changed=autoCare()||changed;changed=autoWater()||changed;changed=autoHarvest()||changed}catch(e){console.error('workerTick',e)}if(changed){save();render()}}

  const baseOpenModal=window.openModal;
  window.openModal=function(t){if(t==='workers')return openWorkers();const r=baseOpenModal(t);if(t==='shop'){const b=$('#mb');if(b&&!b.querySelector('.workerShopEntry'))b.insertAdjacentHTML('afterbegin',`<div class="workerShopEntry"><div><b>👨‍🌾 Nhân công</b><small>Thuê theo ngày/tháng và phân công theo khu</small></div><button class="primary" onclick="openWorkers()">Thuê</button></div>`)}return r};
  ensureWorkers();save();setTimeout(workerTick,1200);setInterval(workerTick,5000);window.WORKER_TYPES=WORKERS;
})();