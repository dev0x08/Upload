(function(){
  const FIREBASE_CONFIG={
    apiKey:'AIzaSyAM7rH3u2GtJwetAL_FKBhC8-UMpsjZXJ4',
    authDomain:'loginapp-881dc.firebaseapp.com',
    projectId:'loginapp-881dc',
    storageBucket:'loginapp-881dc.firebasestorage.app',
    messagingSenderId:'453348824111',
    appId:'1:453348824111:web:e0c5996ab7211883fa22da'
  };
  let auth=null,user=null,busy=false;
  const gate=()=>document.getElementById('authGate');
  const status=()=>document.getElementById('authStatus');
  const loginBtn=()=>document.getElementById('googleLoginBtn');
  const profile=()=>document.querySelector('.profile');
  const profileAvatar=()=>document.querySelector('.avatar');
  const profileName=()=>document.querySelector('.name');

  function friendly(error){
    const code=String(error?.code||'');
    if(code==='auth/unauthorized-domain')return'Tên miền nông trại chưa được thêm vào Firebase Authorized domains.';
    if(code==='auth/operation-not-allowed')return'Đăng nhập Google chưa được bật trong Firebase.';
    if(code==='auth/popup-closed-by-user')return'Bạn đã đóng cửa sổ đăng nhập.';
    if(code==='auth/popup-blocked')return'Trình duyệt đã chặn cửa sổ đăng nhập.';
    if(code==='auth/network-request-failed')return'Không thể kết nối Firebase. Hãy kiểm tra mạng rồi thử lại.';
    return code?'Không thể đăng nhập ('+code+').':'Không thể đăng nhập lúc này.';
  }
  function setBusy(on,text=''){
    busy=on;const b=loginBtn();if(b){b.disabled=on;b.textContent=on?'Đang kết nối…':'Đăng nhập bằng Google'}
    if(text&&status())status().textContent=text;
  }
  function paintUser(firebaseUser){
    user=firebaseUser||null;
    document.body.classList.remove('auth-pending');
    document.body.classList.toggle('auth-signed-out',!user);
    document.body.classList.toggle('auth-signed-in',!!user);
    const g=gate();if(g)g.hidden=!!user;
    if(!user){
      if(status())status().textContent='Dùng cùng tài khoản Google với Thị Trấn Đào Viên.';
      if(profileName())profileName().textContent='Trang trại thử nghiệm';
      const a=profileAvatar();if(a){a.innerHTML='👩‍🌾';a.removeAttribute('style')}
      return;
    }
    if(profileName())profileName().textContent=user.displayName||user.email||'Nông dân';
    const a=profileAvatar();
    if(a){
      if(user.photoURL){a.textContent='';a.style.backgroundImage=`url("${String(user.photoURL).replace(/"/g,'')}")`;a.style.backgroundSize='cover';a.style.backgroundPosition='center'}
      else{a.innerHTML='👩‍🌾';a.removeAttribute('style')}
    }
    const p=profile();if(p){p.setAttribute('role','button');p.setAttribute('tabindex','0');p.title='Tài khoản Google';p.onclick=openFarmAccount;p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openFarmAccount()}}}
  }

  window.farmGoogleLogin=async function(){
    if(busy||!auth)return;
    setBusy(true,'Đang mở Google…');
    const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    try{
      await auth.signInWithPopup(provider);
    }catch(error){
      const code=String(error?.code||'');
      if(code==='auth/popup-blocked'||code==='auth/operation-not-supported-in-this-environment'){
        try{await auth.signInWithRedirect(provider);return}catch(redirectError){if(status())status().textContent=friendly(redirectError)}
      }else if(status())status().textContent=friendly(error);
    }finally{setBusy(false)}
  };
  window.farmGoogleLogout=async function(){
    if(!auth)return;
    try{await auth.signOut();if(typeof closeModal==='function')closeModal()}catch(error){if(typeof msg==='function')msg(friendly(error))}
  };
  window.openFarmAccount=function(){
    if(!user||typeof $!=='function')return;
    $('#modal').classList.add('open');$('#mt').textContent='👤 Tài khoản';
    const photo=user.photoURL?`<img class="accountAvatar" src="${String(user.photoURL).replace(/"/g,'&quot;')}" alt="">`:'<div class="accountAvatar accountAvatarFallback">👩‍🌾</div>';
    $('#mb').innerHTML=`<div class="accountCard">${photo}<div class="accountInfo"><b>${user.displayName||'Nông dân'}</b><span>${user.email||''}</span><small>Firebase: loginapp-881dc</small></div></div><div class="authSaveNote">Hiện tại tài khoản Google chỉ dùng để đăng nhập. Dữ liệu nông trại vẫn giữ trong máy để không làm thay đổi save đang test.</div><button class="danger authLogout" onclick="farmGoogleLogout()">Đăng xuất</button>`;
  };

  async function init(){
    if(!window.firebase){document.body.classList.remove('auth-pending');document.body.classList.add('auth-signed-out');if(status())status().textContent='Không tải được Firebase SDK.';return}
    try{
      const app=firebase.apps.length?firebase.app():firebase.initializeApp(FIREBASE_CONFIG);
      auth=app.auth();
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      try{await auth.getRedirectResult()}catch(error){if(status())status().textContent=friendly(error)}
      auth.onAuthStateChanged(firebaseUser=>paintUser(firebaseUser),error=>{paintUser(null);if(status())status().textContent=friendly(error)});
    }catch(error){paintUser(null);if(status())status().textContent=friendly(error)}
  }
  init();
})();