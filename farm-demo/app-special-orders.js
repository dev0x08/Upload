(function(){
  const BASE_ORDER=window.order;
  const BASE_DONE=window.doneOrder;
  const BASE_OPEN=window.openModal;
  const SPECIAL_CHANCE=.30;
  const MIN=60*1000;

  function eligibleNormal(){return Object.keys(C).filter(id=>C[id][11]==='normal'&&C[id][5]<=S.lv)}
  function eligibleRare(){return Object.keys(C).filter(id=>C[id][11]==='rare'&&C[id][5]<=S.lv&&(!window.cropDiscovered||cropDiscovered(id)))}
  function eligibleMutants(){return Object.keys(C).filter(id=>C[id][5]<=S.lv&&window.mutantDiscovered&&mutantDiscovered(id))}
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function itemInfo(k){
    const mut=k.startsWith('m_'),id=mut?k.slice(2):k,c=C[id];
    return {id,mut,c,name:mut?c[8]:c[0],icon:mut?'🧬':c[1],price:mut?c[9]:c[3],key:k}
  }
  function baseValue(need){return Object.entries(need).reduce((sum,[k,n])=>sum+itemInfo(k).price*n,0)}
  function makeVip(){
    const rares=eligibleRare(),pool=rares.length?rares:eligibleNormal();if(!pool.length)return BASE_ORDER();
    const id=pick(pool),q=1+Math.floor(Math.random()*2),need={[id]:q},base=baseValue(need);
    return {name:'Khách VIP',special:'vip',label:'💎 VIP',need,reward:Math.max(120,Math.round(base*2.8)),exp:now()+(8+Math.random()*4)*MIN}
  }
  function makeFestival(){
    let pool=[...eligibleNormal(),...eligibleRare()];if(pool.length<2)return makeVip();
    pool=pool.sort(()=>Math.random()-.5);const need={};for(const id of pool.slice(0,2))need[id]=2+Math.floor(Math.random()*3);
    const base=baseValue(need);return {name:'Lễ hội làng',special:'festival',label:'🎉 LỄ HỘI',need,reward:Math.max(180,Math.round(base*2.35)),exp:now()+(10+Math.random()*5)*MIN}
  }
  function makeMutant(){
    const muts=eligibleMutants();if(!muts.length)return makeVip();const id=pick(muts),need={['m_'+id]:1},base=baseValue(need);
    return {name:'Nhà sưu tầm',special:'mutant',label:'🧬 ĐỘT BIẾN',need,reward:Math.max(300,Math.round(base*3.5)),exp:now()+(12+Math.random()*6)*MIN}
  }
  function specialOrder(){
    const options=['vip','festival'];if(eligibleMutants().length)options.push('mutant');
    const t=pick(options);return t==='mutant'?makeMutant():t==='festival'?makeFestival():makeVip()
  }
  window.order=function(){return Math.random()<SPECIAL_CHANCE?specialOrder():BASE_ORDER()};

  function hasNeed(o){return Object.entries(o.need||{}).every(([k,n])=>(S.inv.prod?.[k]||0)>=n)}
  function needText(o){return Object.entries(o.need||{}).map(([k,n])=>{const x=itemInfo(k),have=S.inv.prod?.[k]||0;return `${x.icon} ${x.name} ${n} (có ${have})`}).join(' • ')}
  function renderOrders(){
    $('#modal').classList.add('open');$('#mt').textContent='Đơn hàng';
    $('#mb').innerHTML=`<div class="orderLegend">Đơn đặc biệt xuất hiện ngẫu nhiên, thời gian dài hơn và thưởng cao hơn đơn thường.</div>${S.orders.map((o,i)=>`<div class="row orderCard ${o.special?'special '+o.special:''}"><div><div class="orderHead"><b>${o.name}</b>${o.special?`<span class="orderBadge">${o.label||'⭐ ĐẶC BIỆT'}</span>`:''}</div><div class="tiny">${needText(o)}</div><div class="orderTime">⏱ ${fmt(o.exp-now())}</div></div><button class="primary" onclick="doneOrder(${i})" ${hasNeed(o)?'':'disabled'}>Giao<br>${o.reward}🌿</button></div>`).join('')}`;
  }

  window.doneOrder=function(i){
    const o=S.orders?.[i];if(!o)return;
    if(!o.special)return BASE_DONE(i);
    if(!hasNeed(o))return;
    for(const [k,n] of Object.entries(o.need))S.inv.prod[k]-=n;
    S.coin+=o.reward;S.stats=S.stats||{};S.stats.ordersDone=(S.stats.ordersDone||0)+1;
    S.stats.specialOrders=(S.stats.specialOrders||0)+1;
    S.orders[i]=window.order();save();renderOrders();render();msg('⭐ Hoàn thành đơn đặc biệt +'+o.reward+'🌿')
  };

  window.openModal=function(t){if(t==='orders')return renderOrders();return BASE_OPEN(t)};

  S.stats=S.stats||{};if(!Number.isFinite(Number(S.stats.specialOrders)))S.stats.specialOrders=0;
  save();
})();