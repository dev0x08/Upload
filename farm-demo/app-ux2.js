(function(){
  function panel(){return document.querySelector('#modal .panel')}
  function setView(name){const p=panel();if(p)p.dataset.view=name||''}
  function sectionize(){
    const mb=document.getElementById('mb');if(!mb)return;
    mb.querySelectorAll(':scope > h3').forEach(h=>h.classList.add('uxSectionTitle'));
  }
  function quickNav(items){
    const mb=document.getElementById('mb');if(!mb||mb.querySelector('.uxQuickNav'))return;
    const nav=document.createElement('div');nav.className='uxQuickNav';
    items.forEach(([label,needle])=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{const h=[...mb.querySelectorAll('h3')].find(x=>x.textContent.includes(needle));h?.scrollIntoView({behavior:'smooth',block:'start'})};nav.appendChild(b)});
    mb.prepend(nav)
  }
  function hint(icon,title,sub){
    const mb=document.getElementById('mb');if(!mb||mb.querySelector('.uxScreenHint'))return;
    const el=document.createElement('div');el.className='uxScreenHint';el.innerHTML=`<span>${icon}</span><div><b>${title}</b><small>${sub}</small></div>`;mb.prepend(el)
  }
  function decorate(name){
    setView(name);sectionize();
    if(name==='shop'){hint('🏪','Cửa hàng nông trại','Mua hạt giống, vật tư và mở rộng nông trại.');quickNav([['🌱 Hạt thường','Hạt giống thường'],['💎 Hạt hiếm','Hạt giống hiếm'],['🧰 Vật tư','Vật tư']])}
    else if(name==='inv'){hint('🎒','Kho nông trại','Bán nông sản theo giá chợ hiện tại hoặc quản lý vật tư.');quickNav([['🌰 Hạt giống','Hạt giống'],['🧺 Nông sản','Nông sản'],['🧰 Vật tư','Vật tư']])}
    else if(name==='orders')hint('📦','Đơn hàng','Chuẩn bị đủ nông sản trước khi hết thời gian giao hàng.');
    else if(name==='missions')hint('📋','Mục tiêu nông trại','Hoàn thành nhiệm vụ ngày và tuần để nhận thêm tiền.');
    else if(name==='management')hint('📊','Tổng quan trang trại','Theo dõi toàn bộ khu đất, kho và nhu cầu chăm sóc.');
    else if(name==='market')hint('📈','Chợ nông sản','Theo dõi biến động giá trước khi quyết định bán.');
  }

  const baseOpen=window.openModal;
  if(typeof baseOpen==='function')window.openModal=function(t){const r=baseOpen.apply(this,arguments);requestAnimationFrame(()=>decorate(t==='quests'?'missions':t));return r};

  const map={openSeasonMissions:'missions',openTitles:'titles',openFarmManagement:'management',openProduceMarket:'market',openAchievements:'achievements',openGuide:'guide',openFarmEvent:'event'};
  for(const [fn,name] of Object.entries(map)){
    const base=window[fn];if(typeof base!=='function')continue;
    window[fn]=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>decorate(name));return r}
  }

  const baseClose=window.closeModal;
  if(typeof baseClose==='function')window.closeModal=function(){const p=panel();if(p)delete p.dataset.view;return baseClose.apply(this,arguments)};
})();