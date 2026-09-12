(function(){
  const F={
    growth:{name:'Phân tăng trưởng',icon:'⚡',price:18,resale:11,desc:'Tăng tốc sinh trưởng 20%'},
    mutation:{name:'Phân đột biến',icon:'🧬',price:28,resale:18,desc:'Tăng mạnh cơ hội đột biến'},
    protect:{name:'Phân bảo vệ',icon:'🛡️',price:22,resale:14,desc:'Giảm mạnh nguy cơ sâu bệnh'}
  };
  function ensureFertilizers(){
    S.inv=S.inv||{};
    if(!S.inv.fertilizers||typeof S.inv.fertilizers!=='object')S.inv.fertilizers={growth:0,mutation:0,protect:0};
    for(const k of Object.keys(F))if(!Number.isFinite(Number(S.inv.fertilizers[k])))S.inv.fertilizers[k]=0;
    if(Number(S.inv.fertilizer)>0&&!S._fertMigrated){S.inv.fertilizers.growth+=Number(S.inv.fertilizer)||0;S.inv.fertilizer=0;S._fertMigrated=1}
    for(const p of S.plots||[]){
      if(p.fert===true)p.fert='growth';
      if(p.fert&&!F[p.fert])p.fert=false;
    }
  }
  ensureFertilizers();save();

  window.tick=function(p){
    if(!p.crop)return;let t=now(),dt=Math.min(2000,t-p.last);p.last=t;let q=prog(p),st=si(q);if(st>=4||!p.water.includes(st))return;
    let c=C[p.crop],fertMul=p.fert==='growth'?1.2:1,speed=W[S.weather][2]*(S.weather===c[6]?1.18:1)*fertMul*(p.prob?0.55:1);
    p.g=Math.min(p.g+dt*speed,ENDS[st]*c[4]*1000)
  };
  window.mutate=function(p,q){
    if(!p.crop||p.mutCheck||q<.72)return;p.mutCheck=true;let c=C[p.crop],mul=p.fert==='mutation'?2.5:1;
    if(Math.random()<Math.min(.5,c[10]*mul)){p.mut=true;S.stats.mutant++;if(typeof mutantDiscovered==='function'){S.discovery=S.discovery||{};S.discovery.mutants=S.discovery.mutants||{};S.discovery.mutants[p.crop]=1}msg('🧬 Cây đột biến!')}
  };
  window.risk=function(p,q){
    let st=si(q);if(!p.crop||st<1||st>3||p.check.includes(st))return;p.check.push(st);let c=C[p.crop],protect=p.fert==='protect'?.35:1;
    if(Math.random()<.08*W[S.weather][3]*(S.weather===c[6]?.75:1)*protect)p.prob=Math.random()<.65?'pest':'disease'
  };
  window.fert=function(i,type){
    ensureFertilizers();let p=S.plots[i];if(p.fert||si(prog(p))<1||si(prog(p))>=4)return;type=type||'growth';
    if(!F[type])return;if((S.inv.fertilizers[type]||0)<1)return msg('Hết '+F[type].name.toLowerCase());if(!spend())return;
    S.inv.fertilizers[type]--;p.fert=type;S.stats.fert++;save();care(i);render()
  };
  window.care=function(i){
    ensureFertilizers();let p=S.plots[i],q=prog(p),st=si(q),c=C[p.crop],need=st<4&&!p.water.includes(st),s=sg(q),left=Math.max(0,c[7]-p.h),status=p.prob?[p.prob==='pest'?'🐛 Sâu bệnh':'🦠 Bệnh cây','bad']:need?['💧 Cần tưới','warn']:['✓ Đang lớn','good'];
    let fertBox='';
    if(!p.fert&&st>=1&&st<4){fertBox=`<div class="fertPick"><div class="fertPickTitle">✨ Chọn 1 loại phân cho lứa này</div>${Object.entries(F).map(([k,f])=>`<button class="fertOption" onclick="fert(${i},'${k}')" ${(S.inv.fertilizers[k]||0)<1?'disabled':''}><span>${f.icon}</span><div><b>${f.name}</b><small>${f.desc} • còn ${S.inv.fertilizers[k]||0}</small></div></button>`).join('')}</div>`}
    let fertChip=p.fert&&F[p.fert]?`<span class="chip good">${F[p.fert].icon} ${F[p.fert].name}</span>`:'';
    $('#modal').classList.add('open');$('#mt').textContent='Chăm sóc cây';$('#mb').innerHTML=`<div class="careHero"><div class="careIcon">${p.mut?'🧬':c[1]}</div><div class="careMain"><div class="careName">${p.mut?c[8]:c[0]}</div><div class="chips">${badge(p.mut?'mut':c[11])}<span class="chip ${status[1]}">${status[0]}</span><span class="chip">${s[0]}</span>${fertChip}${c[7]>1?`<span class="chip">Còn ${left} lứa</span>`:''}</div></div></div><div class="progressRow"><span>Tiến độ</span><span>${Math.floor(q*100)}%</span></div><div class="progress"><i style="width:${q*100}%"></i></div><div class="tiny" style="margin:7px 2px 10px">Ưa ${W[c[6]][1]} ${W[c[6]][0]} • phải tưới mỗi giai đoạn</div>${need?`<div class="actions"><div class="act water"><div><b>💧 Tưới nước</b><small>Cho cây tiếp tục lớn</small></div><button class="primary" onclick="water(${i})">Tưới</button></div></div>`:''}${fertBox}${p.prob?`<div class="actions"><div class="act"><div><b>${p.prob==='pest'?'🐛':'🦠'} Xử lý sâu bệnh</b><small>Còn ${S.inv.pesticide} thuốc</small></div><button class="primary" onclick="spray(${i})">Phun</button></div></div>`:''}<button class="danger" style="width:100%;margin-top:10px" onclick="askCut(${i})">🪓 Chặt bỏ cây</button>`
  };

  function matCard(k){let f=F[k];return `<div class="item"><b>${f.icon} ${f.name}</b><div class="tiny">${f.desc}</div><div><b>${f.price}🌿</b></div><input class="qty" id="fertbuy_${k}" value="1" min="1" type="number"><button class="primary" onclick="askFertBuy('${k}')">Mua</button></div>`}
  window.askFertBuy=function(k){let f=F[k],q=qty('#fertbuy_'+k);confirmBox('Xác nhận mua',confirmRows(f.name,q,f.price,q*f.price),`buyFert('${k}',${q})`)};
  window.buyFert=function(k,q){let f=F[k],cost=f.price*q;if(S.coin<cost)return msg('Không đủ tiền');S.coin-=cost;S.inv.fertilizers[k]+=q;save();openModal('shop');render()};
  function fertSellRow(k){let f=F[k],n=S.inv.fertilizers[k]||0;if(!n)return'';return `<div class="row"><span>${f.icon} ${f.name}<br><small>Thu hồi ${f.resale}🌿</small></span><span><b>${n}</b> <input class="qty" id="fertsell_${k}" value="1" type="number"><button class="primary" onclick="askFertSell('${k}')">Bán</button></span></div>`}
  window.askFertSell=function(k){let f=F[k],q=qty('#fertsell_'+k,S.inv.fertilizers[k]);confirmBox('Xác nhận bán',confirmRows(f.name,q,f.resale,q*f.resale),`sellFert('${k}',${q})`)};
  window.sellFert=function(k,q){let f=F[k];S.inv.fertilizers[k]-=q;S.coin+=q*f.resale;save();openModal('inv');render()};

  const baseOpenModal=window.openModal;
  window.openModal=function(t){
    ensureFertilizers();
    const r=baseOpenModal(t);
    if(t==='shop'){
      const b=$('#mb');if(b&&!b.querySelector('.fertShopBlock'))b.insertAdjacentHTML('beforeend',`<div class="fertShopBlock"><h3>✨ Phân bón chuyên dụng</h3><div class="grid">${Object.keys(F).map(matCard).join('')}</div><div class="tiny" style="margin-top:6px">Mỗi cây chỉ dùng được 1 loại phân trong một lứa.</div></div>`)
    }
    if(t==='inv'){
      const b=$('#mb');if(b&&!b.querySelector('.fertInvBlock'))b.insertAdjacentHTML('beforeend',`<div class="fertInvBlock"><h3>✨ Phân bón chuyên dụng</h3>${Object.keys(F).map(fertSellRow).join('')||'<div class="row">Không có phân chuyên dụng</div>'}</div>`)
    }
    return r
  };
  window.FERTILIZERS=F;
})();