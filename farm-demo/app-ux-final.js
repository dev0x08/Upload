(function(){
  const modal=document.getElementById('modal'),panel=()=>document.querySelector('#modal .panel'),title=()=>document.getElementById('mt'),body=()=>document.getElementById('mb');
  const VIEW_RULES=[
    [/Chăm sóc cây/i,'care'],[/Tài khoản/i,'account'],[/Cửa hàng/i,'shop'],[/Kho/i,'inv'],[/Đơn hàng/i,'orders'],[/Nhiệm vụ/i,'missions'],[/Danh hiệu/i,'titles'],[/Thành tựu/i,'achievements'],[/Quản lý nông trại/i,'management'],[/Chợ nông sản/i,'market'],[/Cẩm nang/i,'guide'],[/Mở rộng nông trại/i,'expansion'],[/Nhân công/i,'workers'],[/Dụng cụ/i,'tools'],[/Đất dinh dưỡng|Cải tạo đất/i,'soil'],[/Kho chứa|Nâng cấp kho/i,'storage'],[/Sự kiện nông trại/i,'event'],[/Dự báo thời tiết/i,'weather'],[/Test/i,'test']
  ];
  const HINTS={
    care:['🌿','Chăm sóc cây','Theo dõi tiến độ và chỉ hiện thao tác cây đang cần.'],
    account:['👤','Hồ sơ người chơi','Tài khoản Google đang dùng để vào Nông Trại Mây.'],
    storage:['🏚️','Kho chứa','Theo dõi sức chứa và nâng cấp khi cần thêm chỗ.'],
    workers:['🧑‍🌾','Nhân công','Thuê người hỗ trợ tưới, chăm hoặc thu hoạch theo từng khu.'],
    tools:['🛠️','Dụng cụ','Nâng cấp vĩnh viễn để tiết kiệm năng lượng khi làm việc.'],
    soil:['🟫','Đất dinh dưỡng','Mỗi ô đất có thể mua một loại đất chuyên dụng và giữ lâu dài.'],
    expansion:['🗺️','Mở rộng nông trại','Mở khu mới khi đủ cấp và tiền, sau đó mở từng ô đất.'],
    achievements:['🏆','Thành tựu','Các mốc dài hạn của nông trại và phần thưởng đã đạt.'],
    event:['🎪','Sự kiện','Hiệu ứng toàn nông trại trong một khoảng thời gian ngắn.'],
    weather:['🌤️','Thời tiết','Thời tiết hiện tại tác động trực tiếp đến tốc độ và rủi ro cây trồng.'],
    test:['🔧','Công cụ kiểm thử','Chỉ dùng để kiểm tra nhanh gameplay trong giai đoạn phát triển.']
  };
  function detect(){const text=title()?.textContent||'';for(const [rx,name] of VIEW_RULES)if(rx.test(text))return name;return ''}
  function ensureHint(view){const mb=body(),hint=HINTS[view];if(!mb||!hint||mb.querySelector('.uxFinalHint'))return;const el=document.createElement('div');el.className='uxScreenHint uxFinalHint';el.innerHTML=`<span>${hint[0]}</span><div><b>${hint[1]}</b><small>${hint[2]}</small></div>`;mb.prepend(el)}
  function decorate(){const p=panel();if(!p)return;const view=detect()||p.dataset.view||'';if(view)p.dataset.view=view;ensureHint(view);if(view==='care'){const hero=body()?.querySelector('.careHero');if(hero&&!hero.querySelector('.careStatusDot'))hero.insertAdjacentHTML('beforeend','<span class="careStatusDot" aria-hidden="true"></span>')}if(view==='account'){const note=body()?.querySelector('.authSaveNote');if(note&&!note.dataset.ux){note.dataset.ux='1';note.insertAdjacentHTML('afterbegin','<b style="display:block;margin-bottom:3px">☁️ Trạng thái lưu</b>')}}}
  if(title()){new MutationObserver(()=>requestAnimationFrame(decorate)).observe(title(),{childList:true,subtree:true,characterData:true})}
  if(body()){new MutationObserver(()=>requestAnimationFrame(decorate)).observe(body(),{childList:true,subtree:false})}
  modal?.addEventListener('click',e=>{if(e.target===modal&&typeof closeModal==='function')closeModal()});
  document.querySelectorAll('.toolbar .tool').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.toolbar .tool').forEach(x=>x.classList.remove('tapActive'));btn.classList.add('tapActive');setTimeout(()=>btn.classList.remove('tapActive'),250)}));
  const baseOpenAccount=window.openFarmAccount;if(typeof baseOpenAccount==='function')window.openFarmAccount=function(){const r=baseOpenAccount.apply(this,arguments);requestAnimationFrame(decorate);return r};
  const baseCare=window.care;if(typeof baseCare==='function')window.care=function(){const r=baseCare.apply(this,arguments);requestAnimationFrame(decorate);return r};
  setTimeout(decorate,0);
})();
