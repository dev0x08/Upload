(function(){
  const START=20,COUNT=12,REQ_LV=5,COST=1800;
  let view='main';
  function ensureExpansion(){
    if(!S.expansion||typeof S.expansion!=='object')S.expansion={unlocked:false,boughtAt:0};
    if(!Array.isArray(S.expansionPlots))S.expansionPlots=[];
    while(S.expansionPlots.length<COUNT)S.expansionPlots.push(empty(!!S.expansion.unlocked));
    S.expansionPlots=S.expansionPlots.slice(0,COUNT).map(p=>({...empty(!!S.expansion.unlocked),...p,unlocked:!!S.expansion.unlocked,last:now()}));
    if(S.plots.length<START+COUNT)S.plots.push(...S.expansionPlots.slice(0,START+COUNT-S.plots.length));
    for(let i=0;i<COUNT;i++)S.plots[START+i]=S.expansionPlots[i];
  }
  function canBuy(){return S.lv>=REQ_LV&&S.coin>=COST}
  function syncExpansion(){for(let i=0;i<COUNT;i++)S.expansionPlots[i]=S.plots[START+i]}
  function isExpansionPlot(p){const i=S.plots.indexOf(p);return i>=START&&i<START+COUNT}
  const baseSave=window.save;
  window.save=function(){ensureExpansion();syncExpansion();return baseSave()};

  function ensureSwitch(){
    const island=document.querySelector('.island');if(!island)return;
    if(!island.querySelector('.areaSwitch'))island.insertAdjacentHTML('afterbegin',`<div class="areaSwitch"><button id="areaMainBtn" onclick="switchFarmArea('main')">🏡 Khu chính</button><button id="areaExpBtn" onclick="switchFarmArea('exp')">🌄 Khu mở rộng</button></div>`)
  }
  window.switchFarmArea=function(v){view=v==='exp'?'exp':'main';render()};
  window.buyExpansion=function(){
    ensureExpansion();
    if(S.expansion.unlocked)return switchFarmArea('exp');
    if(S.lv<REQ_LV)return msg('🔒 Cần LV '+REQ_LV);
    if(S.coin<COST)return msg('Không đủ tiền');
    S.coin-=COST;S.expansion.unlocked=true;S.expansion.boughtAt=now();
    for(let i=0;i<COUNT;i++){S.expansionPlots[i].unlocked=true;S.plots[START+i]=S.expansionPlots[i]}
    save();msg('🌄 Đã mở Khu đất phía Đông');view='exp';render()
  };

  const baseTick=window.tick;
  window.tick=function(p){
    if(!isExpansionPlot(p))return baseTick(p);
    const before=p.g||0,st=si(prog(p)),c=C[p.crop];const r=baseTick(p),delta=(p.g||0)-before;
    if(delta>0&&st<4&&c)p.g=Math.min(before+delta/1.10,ENDS[st]*c[4]*1000);
    return r
  };
  const baseRisk=window.risk;
  window.risk=function(p,q){
    if(!isExpansionPlot(p))return baseRisk(p,q);
    const st=si(q);if(!p?.crop||st<1||st>3||p.check.includes(st))return;
    p.check.push(st);const c=C[p.crop],protect=p.fert==='protect'?.35:1;
    if(Math.random()<.08*W[S.weather][3]*(S.weather===c[6]?.75:1)*protect)p.prob=Math.random()<.65?'pest':'disease'
  };

  const baseClick=window.clickPlot;
  window.clickPlot=function(i){
    ensureExpansion();
    if(i>=START&&!S.expansion.unlocked){view='exp';render();return}
    return baseClick(i)
  };

  const baseRenderPlots=window.renderPlots;
  window.renderPlots=function(){
    ensureExpansion();ensureSwitch();
    const island=document.querySelector('.island');
    const mainBtn=$('#areaMainBtn'),expBtn=$('#areaExpBtn');
    mainBtn?.classList.toggle('active',view==='main');expBtn?.classList.toggle('active',view==='exp');
    island?.classList.toggle('expansionView',view==='exp');
    if(view==='exp'&&!S.expansion.unlocked){
      $('#plots').innerHTML=`<div class="expansionLock"><div class="expansionIcon">🌄</div><h3>Khu đất phía Đông</h3><p>Mở thêm <b>${COUNT} ô đất</b> mới để mở rộng nông trại.</p><div class="expReq"><span class="${S.lv>=REQ_LV?'ok':''}">LV ${REQ_LV} ${S.lv>=REQ_LV?'✓':'• hiện LV '+S.lv}</span><span class="${S.coin>=COST?'ok':''}">${COST}🌿 ${S.coin>=COST?'✓':'• hiện '+S.coin+'🌿'}</span></div><button class="primary expansionBuy" onclick="buyExpansion()" ${canBuy()?'':'disabled'}>Mua khu đất • ${COST}🌿</button></div>`;
      return
    }
    const r=baseRenderPlots();
    document.querySelectorAll('#plots .plot').forEach((el,idx)=>{
      const show=view==='main'?idx<START:idx>=START&&idx<START+COUNT;
      el.style.display=show?'':'none';
      if(show&&view==='exp'){
        el.classList.add('expPlot');
        el.querySelector('.zoneMark')?.remove();
        el.removeAttribute('data-zone');el.removeAttribute('title')
      }
    });
    return r
  };

  const baseOpenModal=window.openModal;
  window.openModal=function(t){
    if(t==='expansion'){view='exp';closeModal();render();return}
    const r=baseOpenModal(t);
    if(t==='shop'){
      const b=$('#mb');if(b&&!b.querySelector('.expansionShopEntry'))b.insertAdjacentHTML('afterbegin',`<div class="expansionShopEntry"><div><b>🌄 Mở rộng nông trại</b><small>${S.expansion?.unlocked?'Đã sở hữu Khu đất phía Đông':`Yêu cầu LV ${REQ_LV} • ${COST}🌿`}</small></div><button class="primary" onclick="switchFarmArea('exp');closeModal();render()">${S.expansion?.unlocked?'Đi tới':'Xem'}</button></div>`)
    }
    return r
  };

  ensureExpansion();save();setTimeout(()=>{ensureSwitch();render()},300);
})();