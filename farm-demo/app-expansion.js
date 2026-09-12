(function(){
  const AREAS={
    main:{id:'main',icon:'🏡',short:'Chính',name:'Khu chính',start:0,count:20,access:true},
    east:{id:'east',icon:'🌄',short:'Đông',name:'Khu đất phía Đông',start:20,count:12,lv:5,cost:1800,free:4,plotBase:180,plotStep:45},
    north:{id:'north',icon:'⛰️',short:'Bắc',name:'Khu đất phía Bắc',start:32,count:16,lv:8,cost:4200,free:4,plotBase:320,plotStep:60},
    river:{id:'river',icon:'🌊',short:'Ven sông',name:'Khu đất ven sông',start:48,count:20,lv:12,cost:8500,free:4,plotBase:520,plotStep:85}
  };
  let view='main';
  function newPlot(unlocked=false){return {...empty(unlocked),unlocked}}
  function areaState(id){return S.expansion.areas[id]}
  function areaByIndex(i){return Object.values(AREAS).find(a=>i>=a.start&&i<a.start+a.count)||AREAS.main}
  function localIndex(a,i){return i-a.start}
  function plotPrice(a,local){return a.plotBase+Math.max(0,local-a.free)*a.plotStep}
  function ensureProgression(){
    if(!S.expansion||typeof S.expansion!=='object')S.expansion={};
    if(!S.expansion.areas||typeof S.expansion.areas!=='object')S.expansion.areas={};
    const oldEast=Array.isArray(S.expansionPlots)?S.expansionPlots:null;
    const oldEastUnlocked=!!S.expansion.unlocked;
    for(const id of ['east','north','river']){
      const a=AREAS[id];let st=S.expansion.areas[id];
      if(!st||typeof st!=='object')st=S.expansion.areas[id]={unlocked:false,boughtAt:0,plots:[]};
      if(id==='east'&&oldEastUnlocked&&!st.unlocked){st.unlocked=true;st.boughtAt=S.expansion.boughtAt||now()}
      if(!Array.isArray(st.plots))st.plots=[];
      if(id==='east'&&oldEast&&st.plots.length===0)st.plots=oldEast.slice(0,a.count);
      while(st.plots.length<a.count){const n=st.plots.length;st.plots.push(newPlot(!!st.unlocked&&n<a.free))}
      st.plots=st.plots.slice(0,a.count).map((p,n)=>({...newPlot(false),...p,unlocked:!!p.unlocked,last:p.last||now()}));
      if(st.unlocked&&!st.plots.some(p=>p.unlocked))for(let n=0;n<a.free;n++)st.plots[n].unlocked=true;
      while(S.plots.length<a.start+a.count)S.plots.push(newPlot(false));
      for(let n=0;n<a.count;n++)S.plots[a.start+n]=st.plots[n]
    }
  }
  function syncAreas(){
    for(const id of ['east','north','river']){
      const a=AREAS[id],st=areaState(id);if(!st)continue;
      st.plots=[];for(let n=0;n<a.count;n++)st.plots[n]=S.plots[a.start+n]
    }
  }
  const baseSave=window.save;
  window.save=function(){ensureProgression();syncAreas();return baseSave()};

  function ensureSwitch(){
    const island=document.querySelector('.island');if(!island)return;
    let sw=island.querySelector('.areaSwitch');
    const html=Object.values(AREAS).map(a=>`<button id="areaBtn_${a.id}" onclick="switchFarmArea('${a.id}')">${a.icon} ${a.short}</button>`).join('');
    if(!sw)island.insertAdjacentHTML('beforeend',`<div class="areaSwitch">${html}</div>`);
    else if(sw.dataset.multi!=='1'){sw.innerHTML=html;sw.dataset.multi='1'}
  }
  window.switchFarmArea=function(id){if(!AREAS[id])id='main';view=id;render()};
  window.plotDisplayName=function(i){const a=areaByIndex(i),n=localIndex(a,i)+1;return a.id==='main'?'Ô '+n:`${a.icon} ${a.short} ${n}`};

  window.buyFarmArea=function(id){
    ensureProgression();const a=AREAS[id],st=areaState(id);if(!a||id==='main'||!st)return;
    if(st.unlocked)return switchFarmArea(id);
    if(S.lv<a.lv)return msg('🔒 Cần LV '+a.lv);
    if(S.coin<a.cost)return msg('Không đủ tiền');
    S.coin-=a.cost;st.unlocked=true;st.boughtAt=now();
    for(let n=0;n<a.free;n++){st.plots[n].unlocked=true;S.plots[a.start+n]=st.plots[n]}
    save();view=id;render();msg(a.icon+' Đã mở '+a.name)
  };
  window.buyAreaPlot=function(i){
    ensureProgression();const a=areaByIndex(i);if(a.id==='main')return clickPlot(i);
    const st=areaState(a.id),local=localIndex(a,i),p=S.plots[i];if(!st?.unlocked||p?.unlocked)return;
    const next=st.plots.findIndex(p=>!p.unlocked);if(local!==next)return msg('🔒 Mở ô theo thứ tự');
    const cost=plotPrice(a,local);if(S.coin<cost)return msg('Không đủ tiền');
    S.coin-=cost;p.unlocked=true;st.plots[local]=p;save();render();msg('🔓 Đã mở '+plotDisplayName(i))
  };

  const baseClick=window.clickPlot;
  window.clickPlot=function(i){
    ensureProgression();const a=areaByIndex(i);
    if(a.id!=='main'){
      const st=areaState(a.id);if(!st?.unlocked){view=a.id;render();return}
      if(!S.plots[i]?.unlocked)return buyAreaPlot(i)
    }
    return baseClick(i)
  };

  function accessCard(a){
    const st=areaState(a.id),lvOK=S.lv>=a.lv,coinOK=S.coin>=a.cost;
    return `<div class="expansionLock"><div class="expansionIcon">${a.icon}</div><h3>${a.name}</h3><p>Mở quyền sử dụng khu mới với <b>${a.count} ô đất</b>. Sau khi mua khu, ${a.free} ô đầu được mở sẵn; các ô còn lại mua lần lượt.</p><div class="expReq"><span class="${lvOK?'ok':''}">LV ${a.lv} ${lvOK?'✓':'• hiện LV '+S.lv}</span><span class="${coinOK?'ok':''}">${a.cost}🌿 ${coinOK?'✓':'• hiện '+S.coin+'🌿'}</span></div><button class="primary expansionBuy" onclick="buyFarmArea('${a.id}')" ${lvOK&&coinOK?'':'disabled'}>Mua khu • ${a.cost}🌿</button></div>`
  }

  const baseRenderPlots=window.renderPlots;
  window.renderPlots=function(){
    ensureProgression();ensureSwitch();const a=AREAS[view]||AREAS.main,st=a.id==='main'?null:areaState(a.id),island=document.querySelector('.island');
    document.querySelectorAll('.areaSwitch button').forEach(b=>b.classList.remove('active'));$('#areaBtn_'+a.id)?.classList.add('active');
    island?.classList.toggle('expansionView',a.id!=='main');island?.setAttribute('data-area',a.id);
    if(a.id!=='main'&&!st?.unlocked){$('#plots').innerHTML=accessCard(a);return}
    const r=baseRenderPlots();
    document.querySelectorAll('#plots .plot').forEach((el,idx)=>{
      const show=idx>=a.start&&idx<a.start+a.count;el.style.display=show?'':'none';
      if(!show)return;if(a.id!=='main')el.classList.add('expPlot','area-'+a.id);
      const p=S.plots[idx];if(a.id!=='main'&&p&&!p.unlocked){
        const local=localIndex(a,idx),next=st.plots.findIndex(x=>!x.unlocked),tag=el.querySelector('.tag');
        el.classList.toggle('next',local===next);el.classList.toggle('wait',local!==next);
        if(tag)tag.textContent=local===next?'🔓 '+plotPrice(a,local)+' 🌿':'🔒';
        el.setAttribute('onclick',`buyAreaPlot(${idx})`)
      }
    });return r
  };

  window.openExpansion=function(){
    ensureProgression();$('#modal').classList.add('open');$('#mt').textContent='🗺️ Mở rộng nông trại';
    $('#mb').innerHTML=`<div class="expansionOverview">Mua quyền vào khu mới khi đủ LV và tiền. Sau đó mở thêm từng ô đất theo thứ tự trong từng khu.</div><div class="expansionAreaList">${['east','north','river'].map(id=>{const a=AREAS[id],st=areaState(id),opened=st.plots.filter(p=>p.unlocked).length;return `<div class="expansionAreaCard ${st.unlocked?'owned':''}"><div class="expansionAreaIcon">${a.icon}</div><div><b>${a.name}</b><small>${a.count} ô • yêu cầu LV ${a.lv}</small><span>${st.unlocked?`Đã mở ${opened}/${a.count} ô`:`Giá khu ${a.cost}🌿`}</span></div><button class="primary" onclick="switchFarmArea('${id}');closeModal();render()">${st.unlocked?'Đi tới':'Xem'}</button></div>`}).join('')}</div>`
  };

  const baseOpenModal=window.openModal;
  window.openModal=function(t){
    if(t==='expansion')return openExpansion();
    const r=baseOpenModal(t);
    if(t==='shop'){
      const b=$('#mb');if(b&&!b.querySelector('.expansionShopEntry'))b.insertAdjacentHTML('afterbegin',`<div class="expansionShopEntry"><div><b>🗺️ Mở rộng nông trại</b><small>Phía Đông • Phía Bắc • Ven sông</small></div><button class="primary" onclick="openExpansion()">Xem</button></div>`)
    }
    return r
  };

  ensureProgression();save();window.FARM_AREAS=AREAS;setTimeout(()=>{ensureSwitch();render()},300);
})();