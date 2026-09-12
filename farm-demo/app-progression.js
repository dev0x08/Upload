(function(){
  const BASE_OPEN=window.openModal;
  const BASE_RENDER=window.render;
  const BASE_TICK=window.tick;
  const BASE_RISK=window.risk;
  const BASE_SPEND=window.spend;
  const BASE_DONE=window.doneOrder;

  const DAY_POOL=[
    {id:'plant',icon:'🌱',name:'Gieo hạt',targets:[6,10,14],rewards:[70,100,140]},
    {id:'harvest',icon:'🧺',name:'Thu hoạch',targets:[5,8,12],rewards:[80,120,170]},
    {id:'water',icon:'💧',name:'Tưới cây',targets:[8,12,18],rewards:[70,105,150]},
    {id:'fert',icon:'✨',name:'Bón phân',targets:[2,4,6],rewards:[90,130,180]},
    {id:'spray',icon:'🧴',name:'Xử lý sâu bệnh',targets:[1,2,3],rewards:[100,145,200]},
    {id:'ordersDone',icon:'📦',name:'Hoàn thành đơn',targets:[2,3,4],rewards:[120,170,230]}
  ];
  const WEEK_POOL=[
    {id:'plant',icon:'🌾',name:'Gieo hạt',targets:[35,50,70],rewards:[320,450,620]},
    {id:'harvest',icon:'🧺',name:'Thu hoạch',targets:[30,45,65],rewards:[380,520,720]},
    {id:'water',icon:'💦',name:'Tưới cây',targets:[45,65,90],rewards:[300,430,600]},
    {id:'ordersDone',icon:'🚚',name:'Hoàn thành đơn',targets:[10,15,20],rewards:[500,700,950]},
    {id:'specialOrders',icon:'⭐',name:'Đơn đặc biệt',targets:[2,4,6],rewards:[550,760,1000]},
    {id:'mutant',icon:'🧬',name:'Tìm cây đột biến',targets:[1,2,3],rewards:[450,650,900]}
  ];
  const TITLES=[
    {id:'new',icon:'🌱',name:'Nông dân mới',desc:'Khởi đầu hành trình',check:()=>true,bonus:0},
    {id:'grower',icon:'🌿',name:'Người gieo trồng',desc:'LV3 và thu hoạch 10 lần',check:()=>S.lv>=3&&(S.stats.harvest||0)>=10,bonus:.02},
    {id:'owner',icon:'🏡',name:'Chủ trang trại',desc:'LV5 và thu hoạch 50 lần',check:()=>S.lv>=5&&(S.stats.harvest||0)>=50,bonus:.04},
    {id:'landlord',icon:'🌾',name:'Điền chủ',desc:'LV8, 150 thu hoạch và 10 đơn',check:()=>S.lv>=8&&(S.stats.harvest||0)>=150&&(S.stats.ordersDone||0)>=10,bonus:.06},
    {id:'grand',icon:'👑',name:'Đại điền chủ',desc:'LV12, 350 thu hoạch và 30 đơn',check:()=>S.lv>=12&&(S.stats.harvest||0)>=350&&(S.stats.ordersDone||0)>=30,bonus:.08}
  ];
  const EVENTS=[
    {id:'growth',icon:'🌤️',name:'Thời tiết thuận lợi',desc:'Cây sinh trưởng nhanh hơn 20%',duration:3*60*1000},
    {id:'market',icon:'💰',name:'Ngày hội thương lái',desc:'Đơn hàng thưởng thêm 20%',duration:3*60*1000},
    {id:'energy',icon:'⚡',name:'Tinh thần hăng hái',desc:'25% cơ hội hoàn lại năng lượng khi thao tác',duration:3*60*1000},
    {id:'pest',icon:'🐛',name:'Sâu bệnh bùng phát',desc:'Nguy cơ sâu bệnh tăng nhẹ',duration:2*60*1000}
  ];
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const cloneStats=()=>Object.fromEntries(['plant','harvest','water','fert','spray','mutant','ordersDone','specialOrders'].map(k=>[k,Number(S.stats?.[k])||0]));
  function dayKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function weekKey(d=new Date()){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return dayKey(x)}
  function makeMissions(pool,count){return [...pool].sort(()=>Math.random()-.5).slice(0,count).map((m,i)=>{const tier=Math.min(2,Math.floor(Math.max(1,S.lv)/4));return {key:m.id+'_'+i,stat:m.id,icon:m.icon,name:m.name,target:m.targets[tier],reward:m.rewards[tier],claimed:false}})}
  function ensureProgression(){
    S.stats=S.stats||{};
    for(const k of ['plant','harvest','water','fert','spray','mutant','ordersDone','specialOrders'])if(!Number.isFinite(Number(S.stats[k])))S.stats[k]=0;
    S.progression=S.progression||{};
    const p=S.progression;
    const dk=dayKey(),wk=weekKey();
    if(!p.daily||p.daily.key!==dk)p.daily={key:dk,base:cloneStats(),missions:makeMissions(DAY_POOL,3)};
    if(!p.weekly||p.weekly.key!==wk)p.weekly={key:wk,base:cloneStats(),missions:makeMissions(WEEK_POOL,4)};
    p.titles=p.titles||{active:'new',unlocked:{new:true}};
    p.titles.unlocked=p.titles.unlocked||{new:true};
    TITLES.forEach(t=>{if(t.check())p.titles.unlocked[t.id]=true});
    if(!TITLES.some(t=>t.id===p.titles.active&&p.titles.unlocked[t.id]))p.titles.active='new';
    p.events=p.events||{};
    if(!Number.isFinite(Number(p.events.nextAt)))p.events.nextAt=now()+5*60*1000;
    if(p.events.current&&now()>=Number(p.events.current.endAt||0)){
      p.events.current=null;p.events.nextAt=now()+(8+Math.random()*5)*60*1000;
    }
    if(!p.events.current&&now()>=p.events.nextAt){
      const e=pick(EVENTS);p.events.current={id:e.id,startAt:now(),endAt:now()+e.duration};
      msg(e.icon+' '+e.name+' bắt đầu!');
    }
  }
  function missionProgress(group,m){return Math.max(0,(Number(S.stats[m.stat])||0)-(Number(group.base?.[m.stat])||0))}
  function missionCard(group,m){const n=missionProgress(group,m),pct=Math.min(100,n/m.target*100),ready=n>=m.target;return `<div class="seasonMission ${m.claimed?'claimed':ready?'ready':''}"><div class="seasonMissionIcon">${m.icon}</div><div class="seasonMissionBody"><div><b>${m.name}</b><span>${Math.min(n,m.target)}/${m.target}</span></div><div class="seasonMissionBar"><i style="width:${pct}%"></i></div><small>🎁 ${m.reward}🌿</small></div><button class="primary" onclick="claimSeasonMission('${group===S.progression.daily?'daily':'weekly'}','${m.key}')" ${!ready||m.claimed?'disabled':''}>${m.claimed?'Đã nhận':'Nhận'}</button></div>`}
  window.openSeasonMissions=function(tab='daily'){
    ensureProgression();
    const g=tab==='weekly'?S.progression.weekly:S.progression.daily;
    $('#modal').classList.add('open');$('#mt').textContent='📋 Nhiệm vụ';
    $('#mb').innerHTML=`<div class="seasonTabs"><button class="${tab==='daily'?'active':''}" onclick="openSeasonMissions('daily')">Hôm nay</button><button class="${tab==='weekly'?'active':''}" onclick="openSeasonMissions('weekly')">Tuần này</button><button onclick="openTitles()">🏅 Danh hiệu</button></div><div class="missionHint">${tab==='daily'?'Làm mới mỗi ngày':'Làm mới vào đầu tuần'} • chỉ tính tiến độ từ lúc bộ nhiệm vụ được tạo.</div>${g.missions.map(m=>missionCard(g,m)).join('')}<h3 class="legacyTitle">🎯 Thành tích cơ bản</h3><button class="ghost fullBtn" onclick="openLegacyQuests()">Xem nhiệm vụ cơ bản</button>`;
  };
  window.claimSeasonMission=function(type,key){ensureProgression();const g=S.progression[type],m=g?.missions?.find(x=>x.key===key);if(!m||m.claimed||missionProgress(g,m)<m.target)return;m.claimed=true;S.coin+=m.reward;save();render();openSeasonMissions(type);msg('🎁 Nhận '+m.reward+'🌿')};
  window.openLegacyQuests=function(){BASE_OPEN('quests')};

  function activeTitle(){ensureProgression();return TITLES.find(t=>t.id===S.progression.titles.active)||TITLES[0]}
  window.openTitles=function(){ensureProgression();$('#modal').classList.add('open');$('#mt').textContent='🏅 Danh hiệu nông trại';const active=activeTitle();$('#mb').innerHTML=`<div class="titleHero"><span>${active.icon}</span><div><small>Đang sử dụng</small><b>${active.name}</b><em>+${Math.round(active.bonus*100)}% thưởng tiền từ đơn hàng</em></div></div><div class="titleList">${TITLES.map(t=>{const u=!!S.progression.titles.unlocked[t.id],a=t.id===active.id;return `<button class="titleCard ${a?'active':''} ${u?'':'locked'}" ${u?`onclick="selectFarmTitle('${t.id}')"`:''}><span>${u?t.icon:'🔒'}</span><div><b>${u?t.name:'Chưa mở khóa'}</b><small>${t.desc}</small><em>${u?'+'+Math.round(t.bonus*100)+'% thưởng đơn':'Hoàn thành điều kiện để mở'}</em></div>${a?'<strong>Đang dùng</strong>':''}</button>`}).join('')}</div>`};
  window.selectFarmTitle=function(id){ensureProgression();if(!S.progression.titles.unlocked[id])return;S.progression.titles.active=id;save();render();openTitles()};

  function eventInfo(){ensureProgression();const c=S.progression.events.current;if(!c)return null;return EVENTS.find(e=>e.id===c.id)||null}
  window.openFarmEvent=function(){ensureProgression();const c=S.progression.events.current,e=eventInfo();$('#modal').classList.add('open');$('#mt').textContent='🎪 Sự kiện nông trại';if(!c||!e){const left=Math.max(0,S.progression.events.nextAt-now());$('#mb').innerHTML=`<div class="eventEmpty"><span>🌤️</span><b>Hiện chưa có sự kiện</b><small>Sự kiện tiếp theo dự kiến sau ${fmtLong(left)}.</small></div>`;return}$('#mb').innerHTML=`<div class="eventHero"><span>${e.icon}</span><div><b>${e.name}</b><small>${e.desc}</small><em>Còn ${fmtLong(c.endAt-now())}</em></div></div><div class="eventNote">Sự kiện tự kết thúc, không cần nhận thưởng hay bấm kích hoạt.</div>`};
  function fmtLong(ms){let s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60);return m+'p '+String(s%60).padStart(2,'0')+'s'}
  function paintProgression(){
    ensureProgression();
    const name=document.querySelector('.profile .name');if(name){let badge=name.parentElement?.querySelector('.farmTitleBadge');const t=activeTitle();if(!badge){badge=document.createElement('button');badge.className='farmTitleBadge';badge.onclick=()=>openTitles();name.insertAdjacentElement('afterend',badge)}badge.textContent=t.icon+' '+t.name}
    let chip=document.getElementById('farmEventChip');const c=S.progression.events.current,e=eventInfo();if(!chip){chip=document.createElement('button');chip.id='farmEventChip';chip.className='farmEventChip card';chip.onclick=()=>openFarmEvent();document.querySelector('.tw')?.appendChild(chip)}if(chip){chip.innerHTML=c&&e?`${e.icon} ${fmtLong(c.endAt-now())}`:'🎪 Sự kiện';chip.classList.toggle('active',!!c)}
  }

  window.openModal=function(t){if(t==='quests')return openSeasonMissions('daily');return BASE_OPEN(t)};
  window.tick=function(p){const before=p?.g||0,st=p?.crop?si(prog(p)):0,r=BASE_TICK(p);const e=eventInfo();if(e?.id==='growth'&&p?.crop&&st<4&&p.g>before){const cap=ENDS[st]*C[p.crop][4]*1000;p.g=Math.min(cap,p.g+(p.g-before)*.20)}return r};
  window.spend=function(){const ok=BASE_SPEND();if(ok&&eventInfo()?.id==='energy'&&Math.random()<.25){S.en=Math.min(S.max,S.en+1);msg('⚡ Sự kiện hoàn lại 1 năng lượng')}return ok};
  window.risk=function(p,q){const before=p?.prob,r=BASE_RISK(p,q);if(eventInfo()?.id==='pest'&&p?.crop&&!before&&!p.prob){const st=si(q);if(st>=1&&st<=3&&Math.random()<.035)p.prob=Math.random()<.7?'pest':'disease'}return r};
  window.doneOrder=function(i){ensureProgression();const before=S.coin||0,market=eventInfo()?.id==='market',title=activeTitle(),r=BASE_DONE(i),gain=Math.max(0,(S.coin||0)-before);if(gain>0){const bonus=Math.floor(gain*((market?.id==='market'?0:.0)+(market?0.20:0)+title.bonus));if(bonus>0){S.coin+=bonus;save();render();msg('💰 Thưởng thêm '+bonus+'🌿')}}return r};
  window.render=function(){ensureProgression();const r=BASE_RENDER();paintProgression();return r};

  ensureProgression();save();setTimeout(()=>{try{render()}catch(e){console.error(e)}},0);
})();