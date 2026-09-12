(function(){
  const ACH=[
    {id:'discover5',icon:'📖',title:'Nhà nông tập sự',desc:'Khám phá 5 giống cây',target:5,get:()=>discoveryCounts().crops,reward:{coin:80}},
    {id:'discover10',icon:'📚',title:'Người sưu tầm giống',desc:'Khám phá 10 giống cây',target:10,get:()=>discoveryCounts().crops,reward:{coin:150,fertilizer:2}},
    {id:'discoverAll',icon:'🌿',title:'Bách khoa nông trại',desc:'Khám phá toàn bộ giống cây',target:Object.keys(C).length,get:()=>discoveryCounts().crops,reward:{coin:400,pesticide:3}},
    {id:'mut1',icon:'🧬',title:'Dấu hiệu lạ',desc:'Tìm thấy 1 cây đột biến',target:1,get:()=>discoveryCounts().mutants,reward:{coin:120}},
    {id:'mut3',icon:'✨',title:'Thợ săn đột biến',desc:'Tìm thấy 3 cây đột biến',target:3,get:()=>discoveryCounts().mutants,reward:{coin:250,fertilizer:3}},
    {id:'mut5',icon:'💜',title:'Nhà nghiên cứu',desc:'Tìm thấy 5 cây đột biến',target:5,get:()=>discoveryCounts().mutants,reward:{coin:420,pesticide:4}},
    {id:'harvest25',icon:'🧺',title:'Mùa vụ đầu tiên',desc:'Thu hoạch 25 nông sản',target:25,get:()=>S.stats?.harvest||0,reward:{coin:180}},
    {id:'harvest100',icon:'🏅',title:'Nông dân chăm chỉ',desc:'Thu hoạch 100 nông sản',target:100,get:()=>S.stats?.harvest||0,reward:{coin:500,fertilizer:5,pesticide:5}},
    {id:'orders10',icon:'📦',title:'Bạn hàng quen thuộc',desc:'Hoàn thành 10 đơn hàng',target:10,get:()=>S.stats?.ordersDone||0,reward:{coin:300}},
    {id:'orders50',icon:'🤝',title:'Thương lái tin cậy',desc:'Hoàn thành 50 đơn hàng',target:50,get:()=>S.stats?.ordersDone||0,reward:{coin:900,fertilizer:8,pesticide:8}}
  ];
  function ensureAchievements(){
    S.stats=S.stats||{};
    if(!Number.isFinite(Number(S.stats.ordersDone)))S.stats.ordersDone=0;
    if(!S.achievements||typeof S.achievements!=='object')S.achievements={claimed:{}};
    if(!S.achievements.claimed||typeof S.achievements.claimed!=='object')S.achievements.claimed={};
  }
  function rewardText(r){
    const a=[];
    if(r.coin)a.push(r.coin+'🌿');
    if(r.fertilizer)a.push(r.fertilizer+' ✨ phân');
    if(r.pesticide)a.push(r.pesticide+' 🧴 thuốc');
    return a.join(' + ');
  }
  function applyReward(r){
    if(r.coin)S.coin+=r.coin;
    if(r.fertilizer)S.inv.fertilizer=(S.inv.fertilizer||0)+r.fertilizer;
    if(r.pesticide)S.inv.pesticide=(S.inv.pesticide||0)+r.pesticide;
  }
  function progress(a){return Math.max(0,Number(a.get())||0)}
  window.openAchievements=function(){
    ensureAchievements();
    $('#modal').classList.add('open');
    $('#mt').textContent='🏆 Thành tựu';
    const done=ACH.filter(a=>S.achievements.claimed[a.id]).length;
    $('#mb').innerHTML=`<div class="achSummary"><b>${done}/${ACH.length}</b><span>thành tựu đã nhận thưởng</span></div><div class="achList">${ACH.map(a=>{
      const p=progress(a),ready=p>=a.target,claimed=!!S.achievements.claimed[a.id],pct=Math.min(100,p/a.target*100);
      return `<div class="achCard ${claimed?'claimed':ready?'ready':''}"><div class="achIcon">${a.icon}</div><div class="achBody"><div class="achTop"><b>${a.title}</b><span>${Math.min(p,a.target)}/${a.target}</span></div><small>${a.desc}</small><div class="achBar"><i style="width:${pct}%"></i></div><div class="achReward">🎁 ${rewardText(a.reward)}</div></div><button class="primary achClaim" onclick="claimAchievement('${a.id}')" ${!ready||claimed?'disabled':''}>${claimed?'Đã nhận':'Nhận'}</button></div>`;
    }).join('')}</div><button class="ghost guideBack" onclick="openGuide('all')">← Quay lại cẩm nang</button>`;
  };
  window.claimAchievement=function(id){
    ensureAchievements();
    const a=ACH.find(x=>x.id===id);if(!a||S.achievements.claimed[id]||progress(a)<a.target)return;
    applyReward(a.reward);S.achievements.claimed[id]=1;save();render();openAchievements();msg('🏆 Đã nhận thưởng thành tựu');
  };
  const baseDoneOrder=window.doneOrder;
  window.doneOrder=function(i){
    ensureAchievements();
    const o=S.orders?.[i];
    const ok=!!o&&Object.entries(o.need||{}).every(([id,n])=>(S.inv.prod[id]||0)>=n);
    const r=baseDoneOrder(i);
    if(ok){S.stats.ordersDone=(S.stats.ordersDone||0)+1;save()}
    return r;
  };
  const baseOpenGuide=window.openGuide;
  window.openGuide=function(filter='all'){
    const r=baseOpenGuide(filter);
    const tabs=document.querySelector('.guideTabs');
    if(tabs&&!tabs.querySelector('.achTab'))tabs.insertAdjacentHTML('beforeend','<button class="achTab" onclick="openAchievements()">🏆 Thành tựu</button>');
    return r;
  };
  ensureAchievements();save();
})();