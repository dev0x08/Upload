(function(){
  function currentArea(){
    const id=document.querySelector('.island')?.dataset.area||'main';
    return (window.FARM_AREAS&&window.FARM_AREAS[id])||{id:'main',icon:'🏡',name:'Khu chính',start:0,count:20};
  }
  function areaStats(a){
    let unlocked=0,planted=0,water=0,problem=0,ready=0;
    for(let i=a.start;i<a.start+a.count;i++){
      const p=S.plots?.[i];if(!p?.unlocked)continue;unlocked++;
      if(!p.crop)continue;planted++;
      const q=prog(p),st=si(q);if(st<4&&!p.water.includes(st))water++;if(p.prob)problem++;if(q>=1&&!p.prob)ready++;
    }
    return{unlocked,planted,water,problem,ready}
  }
  function paintAreaHud(){
    const island=document.querySelector('.island');if(!island)return;
    const a=currentArea(),s=areaStats(a);
    let el=island.querySelector('.farmAreaBanner');
    if(!el){el=document.createElement('div');el.className='farmAreaBanner';island.appendChild(el)}
    el.innerHTML=`<span class="areaIcon">${a.icon||'🌾'}</span><div class="areaText"><b>${a.name||a.short||'Nông trại'}</b><small>${s.unlocked}/${a.count} ô • ${s.planted} cây</small></div><div class="farmCareBadges"><span class="needWater">💧 ${s.water}</span><span class="hasProblem">🐛 ${s.problem}</span><span class="readyCrop">🧺 ${s.ready}</span></div>`;
  }
  function paintSeedLabel(){
    let el=document.querySelector('.seedSelectionLabel');
    const c=C[S.sel],count=S.inv?.seeds?.[S.sel]||0;
    if(!c){el?.remove();return}
    if(!el){el=document.createElement('div');el.className='seedSelectionLabel';document.querySelector('.game')?.appendChild(el)}
    el.innerHTML=`<span>${c[1]}</span><div><b>${c[0]}</b><small>Đang chọn • còn ${count} hạt</small></div>`;
  }
  function decorate(){try{paintAreaHud();paintSeedLabel()}catch(e){console.error(e)}}
  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){const r=baseRender.apply(this,arguments);decorate();return r};
  const baseSwitch=window.switchFarmArea;
  if(typeof baseSwitch==='function')window.switchFarmArea=function(){const r=baseSwitch.apply(this,arguments);requestAnimationFrame(decorate);return r};
  setTimeout(decorate,100);
})();