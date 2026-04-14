// ==UserScript==
// @name         Caffiliate Auto Checkin - Full Match
// @match        *://app.caffiliate.vn/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Chỉ chạy trên trang rewards
    if (!window.location.href.includes('/rewards')) {
        // Nếu đang ở trang login, chờ chuyển hướng
        if (window.location.href.includes('/auth/google')) {
            console.log('[AutoCheckin] Đang đăng nhập, chờ chuyển hướng...');
        }
        return;
    }

    const XENG_SECRET = "caffi_xeng_secure_2026_x82";
    const STATUS_URL = "https://app.caffiliate.vn/api/v2/xeng/check-in/status";
    const CHECKIN_URL = "https://app.caffiliate.vn/api/v2/xeng/check-in-secure";
    
    const STORAGE_KEY = 'caff_session';
    const SETTINGS_KEY = 'caff_settings';
    
    const DEFAULT_SETTINGS = {
        spam_time: "00:00:00",
        auto_check: 60,
        hot_zone: 10,
        spam_duration: 5,
        spam_rate: 10,
        hot_zone_start: "23:55",
        hot_zone_end: "00:05"
    };
    
    let settings = { ...DEFAULT_SETTINGS };
    let session = null;
    let checkinDone = false;
    let isSpamming = false;
    let spamInterval = null;
    let fastCheckInterval = null;
    let countdownInterval = null;
    
    // ========== TỰ ĐỘNG LẤY COOKIE & CSRF ==========
    function getAutoCookie() {
        return document.cookie;
    }
    
    function getAutoCsrf() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) return meta.getAttribute('content');
        
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
            const match = script.textContent.match(/csrfToken["']?\s*[:=]\s*["']([^"']+)["']/i);
            if (match) return match[1];
        }
        return null;
    }
    
    function getUserIdFromPage() {
        try {
            const winData = window.__INITIAL_STATE__ || window.__NUXT__ || window.__NEXT_DATA__ || window._app;
            if (winData) {
                const user = winData.user || winData.auth?.user || winData.profile;
                if (user?.id) return String(user.id);
                if (user?._id) return String(user._id);
            }
        } catch(e) {}
        
        try {
            const auth = localStorage.getItem('user') || localStorage.getItem('auth');
            if (auth) {
                const data = JSON.parse(auth);
                if (data?.id) return String(data.id);
                if (data?._id) return String(data._id);
            }
        } catch(e) {}
        
        try {
            const match = document.cookie.match(/userId=([^;]+)/);
            if (match) return match[1];
        } catch(e) {}
        
        return null;
    }
    
    function isLoggedIn() {
        const cookie = getAutoCookie();
        return cookie && cookie.includes('caffiliate.sid');
    }
    
    // ========== LƯU & TẢI SESSION ==========
    function loadSettings() {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                settings = { ...DEFAULT_SETTINGS, ...loaded };
            } catch(e) {}
        }
        return settings;
    }
    
    function saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
    
    function loadSession() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                session = JSON.parse(saved);
                updateUserDisplay();
                addLog(`[+] ĐÃ TẢI SESSION | USER:${session.userId}`, 'success');
                return true;
            } catch(e) {
                addLog(`[!] SESSION LỖI: ${e.message}`, 'error');
            }
        }
        return false;
    }
    
    function saveSession(sess) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
        session = sess;
        updateUserDisplay();
        addLog(`[+] ĐÃ LƯU SESSION | USER:${sess.userId}`, 'success');
    }
    
    function autoRefreshSession() {
        const newCookie = getAutoCookie();
        const newCsrf = getAutoCsrf();
        let updated = false;
        
        if (newCookie && (!session || session.cookie !== newCookie)) {
            if (session) session.cookie = newCookie;
            addLog(`🍪 ĐÃ TỰ ĐỘNG CẬP NHẬT COOKIE`, 'success');
            updated = true;
        }
        
        if (newCsrf && (!session || session.csrf !== newCsrf)) {
            if (session) session.csrf = newCsrf;
            addLog(`🔑 ĐÃ TỰ ĐỘNG CẬP NHẬT CSRF`, 'success');
            updated = true;
        }
        
        if (updated && session) {
            saveSession(session);
        }
        
        return session;
    }
    
    // ========== UI PANEL ==========
    function createPanel() {
        let panel = document.getElementById('hacker-panel');
        if (panel) return;
        
        panel = document.createElement('div');
        panel.id = 'hacker-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 16px;
            left: 16px;
            right: 16px;
            background: #0a0c0fdd;
            backdrop-filter: blur(12px);
            border: 1px solid #00ff41;
            padding: 14px;
            z-index: 999999;
            font-family: 'Courier New', monospace;
            box-shadow: 0 0 30px rgba(0,255,65,0.2);
        `;
        
        panel.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #00ff4133; padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 8px; height: 8px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 6px #00ff41; animation: pulse 1.5s infinite;"></div>
                    <span style="color: #00ff41; font-weight: bold; font-size: 12px;">⦿ AUTO CHECKIN</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span id="status-badge" style="background: transparent; border: 1px solid #00ff41; padding: 2px 8px; font-size: 9px; color: #00ff41;">[ IDLE ]</span>
                    <span id="time-display" style="color: #00ff4166; font-size: 9px;"></span>
                </div>
            </div>
            
            <div id="user-info" style="background: #00000080; padding: 8px 10px; margin-bottom: 10px; font-size: 10px; color: #00ff41; border-left: 3px solid #00ff41;">
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <span>>> USER: <span id="display-userid" style="color: #00ff41; font-weight: bold;">---</span></span>
                    <span>>> EMAIL: <span id="display-email" style="color: #00ff41;">---</span></span>
                    <span>>> STATUS: <span id="display-status" style="color: #00ff41;">---</span></span>
                </div>
            </div>
            
            <div id="log-area" style="background: #00000080; padding: 8px; margin-bottom: 10px; max-height: 100px; overflow-y: auto; font-size: 9px; font-family: monospace; color: #00ff41;"></div>
            
            <div style="font-size: 11px; color: #00ff41; text-align: center; margin-bottom: 10px; background: #00000060; padding: 6px; border-radius: 6px;">
                ⏰ CÒN: <span id="countdown-timer">ĐANG TÍNH...</span>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="btn-check" style="flex: 1; background: transparent; border: 1px solid #00ff41; padding: 8px 0; color: #00ff41; font-family: monospace; font-size: 11px; cursor: pointer;">[ KIỂM TRA ]</button>
                <button id="btn-checkin" style="flex: 2; background: linear-gradient(135deg, #f97316, #ea580c); border: none; padding: 8px 0; color: #000; font-weight: bold; font-family: monospace; font-size: 12px; cursor: pointer;">[ NHẬN NGAY ]</button>
                <button id="btn-refresh" style="flex: 1; background: transparent; border: 1px solid #3b82f6; padding: 8px 0; color: #3b82f6; font-family: monospace; font-size: 11px; cursor: pointer;">[ REFRESH ]</button>
            </div>
            
            <div style="font-size: 8px; color: #00ff4166; text-align: center; margin-top: 10px;">
                > SPAM: ${settings.spam_time} | TỰ ĐỘNG: ${settings.auto_check}s | AUTO COOKIE: ON
            </div>
        `;
        
        document.body.appendChild(panel);
        
        const style = document.createElement('style');
        style.textContent = `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`;
        document.head.appendChild(style);
        
        function updateTime() {
            const timeSpan = document.getElementById('time-display');
            if (timeSpan) timeSpan.textContent = new Date().toLocaleTimeString('vi-VN');
        }
        updateTime();
        setInterval(updateTime, 1000);
        
        document.getElementById('btn-check').onclick = () => checkStatus();
        document.getElementById('btn-checkin').onclick = () => doCheckin();
        document.getElementById('btn-refresh').onclick = () => {
            if (!isLoggedIn()) {
                addLog(`🔐 CHƯA ĐĂNG NHẬP!`, 'error');
                addLog(`👉 VUI LÒNG ĐĂNG NHẬP GOOGLE TRƯỚC`, 'warning');
                return;
            }
            autoRefreshSession();
            addLog(`🔄 ĐÃ LÀM MỚI COOKIE/CSRF TỪ TRÌNH DUYỆT`, 'success');
            checkStatus();
        };
    }
    
    function updateUserDisplay() {
        const uidSpan = document.getElementById('display-userid');
        const emailSpan = document.getElementById('display-email');
        const statusSpan = document.getElementById('display-status');
        
        if (uidSpan) uidSpan.textContent = session?.userId || '[CHƯA CÓ]';
        if (emailSpan) emailSpan.textContent = session?.email || '[CHƯA CÓ]';
        if (statusSpan) statusSpan.textContent = checkinDone ? 'ĐÃ NHẬN' : (session ? 'SẴN SÀNG' : 'CHƯA LOGIN');
    }
    
    function addLog(msg, type = 'info') {
        const logArea = document.getElementById('log-area');
        if (!logArea) return;
        const time = new Date().toLocaleTimeString('vi-VN');
        const prefix = type === 'success' ? '[+]' : type === 'error' ? '[!]' : type === 'warning' ? '[*]' : '[>]';
        const color = type === 'success' ? '#00ff41' : type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa44' : '#00ff41';
        const line = document.createElement('div');
        line.style.cssText = `color: ${color}; margin-bottom: 3px; border-left: 2px solid ${color}; padding-left: 6px; font-size: 9px;`;
        line.innerHTML = `${time} ${prefix} ${msg}`;
        logArea.appendChild(line);
        logArea.scrollTop = logArea.scrollHeight;
        while (logArea.children.length > 30) logArea.removeChild(logArea.firstChild);
    }
    
    function updateStatus(text, color = '#00ff41') {
        const badge = document.getElementById('status-badge');
        if (badge) {
            badge.innerHTML = `[ ${text} ]`;
            badge.style.color = color;
            badge.style.borderColor = color;
        }
    }
    
    // ========== COUNTDOWN ==========
    function startCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        
        function updateCountdown() {
            const countdownSpan = document.getElementById('countdown-timer');
            if (!countdownSpan) return;
            
            if (checkinDone) {
                countdownSpan.innerHTML = '✅ ĐÃ NHẬN';
                return;
            }
            
            const now = new Date();
            const [targetHour, targetMinute, targetSecond] = settings.spam_time.split(':').map(Number);
            let target = new Date();
            target.setHours(targetHour, targetMinute, targetSecond || 0, 0);
            
            if (now >= target) {
                target.setDate(target.getDate() + 1);
            }
            
            const diffMs = target - now;
            const diffSec = Math.floor(diffMs / 1000);
            const hours = Math.floor(diffSec / 3600);
            const minutes = Math.floor((diffSec % 3600) / 60);
            const seconds = diffSec % 60;
            
            if (diffSec <= 0) {
                countdownSpan.innerHTML = '🔥 ĐANG SPAM...';
            } else if (diffSec < 3600) {
                countdownSpan.innerHTML = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')} phút`;
            } else {
                countdownSpan.innerHTML = `${hours} giờ ${minutes.toString().padStart(2,'0')} phút`;
            }
        }
        
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }
    
    // ========== API ==========
    function generateNonce(len = 10) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }
    
    async function hmacSha256(key, message) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key);
        const msgData = encoder.encode(message);
        const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
        return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async function callAPI(url, method = 'GET', body = null) {
        const cookie = getAutoCookie();
        const csrf = getAutoCsrf();
        
        if (!cookie || !cookie.includes('caffiliate.sid')) {
            throw new Error('CHƯA ĐĂNG NHẬP');
        }
        
        if (session) {
            let needSave = false;
            if (session.cookie !== cookie) {
                session.cookie = cookie;
                needSave = true;
            }
            if (session.csrf !== csrf && csrf) {
                session.csrf = csrf;
                needSave = true;
            }
            if (needSave) saveSession(session);
        }
        
        const userId = session?.userId || getUserIdFromPage();
        if (!userId) throw new Error('KHÔNG TÌM THẤY USER_ID');
        
        const timestamp = Date.now().toString();
        const nonce = generateNonce(10);
        const signature = await hmacSha256(XENG_SECRET, `${timestamp}.${nonce}.${userId}`);
        
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'x-timestamp': timestamp,
            'x-nonce': nonce,
            'x-signature': signature,
            'X-Requested-With': 'XMLHttpRequest'
        };
        if (csrf) headers['x-csrf-token'] = csrf;
        if (url.includes('check-in-secure')) headers['x-xeng-secret'] = XENG_SECRET;
        
        const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        
        if (res.status === 401) {
            throw new Error('LỖI 401 - VUI LÒNG ĐĂNG NHẬP LẠI GOOGLE');
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }
    
    async function checkStatus() {
        if (!isLoggedIn()) {
            updateStatus('CHƯA LOGIN', '#ef4444');
            addLog(`🔐 CHƯA ĐĂNG NHẬP!`, 'error');
            addLog(`👉 VUI LÒNG ĐĂNG NHẬP GOOGLE VÀ BẤM REFRESH`, 'warning');
            return;
        }
        
        updateStatus('ĐANG KIỂM', '#3b82f6');
        try {
            const data = await callAPI(STATUS_URL, 'GET');
            const hasChecked = data?.data?.todayCheckedIn === true;
            const streak = data?.data?.currentStreak || 0;
            if (hasChecked) {
                updateStatus('ĐÃ NHẬN', '#10b981');
                addLog(`✅ ĐÃ NHẬN THƯỞNG HÔM NAY | CHUỖI: ${streak} NGÀY`, 'success');
                checkinDone = true;
                stopFastCheck();
            } else {
                updateStatus('SẴN SÀNG', '#00ff41');
                addLog(`⏰ CHƯA NHẬN | CHUỖI: ${streak} NGÀY`, 'info');
            }
            updateUserDisplay();
        } catch(e) {
            updateStatus('LỖI', '#ef4444');
            addLog(`❌ ${e.message}`, 'error');
        }
    }
    
    async function doCheckin() {
        if (checkinDone) { addLog(`⚠️ HÔM NAY ĐÃ NHẬN RỒI`, 'warning'); return false; }
        if (!isLoggedIn()) {
            addLog(`🔐 CHƯA ĐĂNG NHẬP!`, 'error');
            return false;
        }
        
        updateStatus('ĐANG NHẬN...', '#f59e0b');
        try {
            const data = await callAPI(CHECKIN_URL, 'POST', null);
            const success = data?.success === true || data?.data?.success === true;
            const reward = data?.data?.reward || 0;
            if (success) {
                updateStatus('THÀNH CÔNG', '#10b981');
                addLog(`🎉 NHẬN THƯỞNG THÀNH CÔNG! +${reward} XENG 🎉`, 'success');
                checkinDone = true;
                stopFastCheck();
                updateUserDisplay();
                return true;
            } else {
                const msg = data?.message || data?.data?.message || 'KHÔNG RÕ';
                addLog(`❌ THẤT BẠI: ${msg}`, 'error');
                return false;
            }
        } catch(e) {
            addLog(`❌ ${e.message}`, 'error');
            return false;
        }
    }
    
    function startSpamming() {
        if (isSpamming || checkinDone) return;
        if (!isLoggedIn()) {
            addLog(`🔐 CHƯA ĐĂNG NHẬP, KHÔNG THỂ SPAM`, 'error');
            return;
        }
        
        isSpamming = true;
        const intervalMs = 1000 / settings.spam_rate;
        addLog(`🚀 [SPAM] BẮT ĐẦU | ${settings.spam_rate} LẦN/GIÂY x ${settings.spam_duration} GIÂY`, 'warning');
        
        const interval = setInterval(async () => {
            if (checkinDone) { clearInterval(interval); isSpamming = false; return; }
            await doCheckin();
        }, intervalMs);
        
        setTimeout(() => {
            if (isSpamming) {
                clearInterval(interval);
                isSpamming = false;
                addLog(`⏹️ [SPAM] KẾT THÚC`, 'info');
            }
        }, settings.spam_duration * 1000);
        
        doCheckin();
    }
    
    function checkAndSpamIfPastTime() {
        if (checkinDone) return false;
        if (!isLoggedIn()) return false;
        
        const now = new Date();
        const [targetHour, targetMinute, targetSecond] = settings.spam_time.split(':').map(Number);
        const targetToday = new Date();
        targetToday.setHours(targetHour, targetMinute, targetSecond || 0, 0);
        
        if (now.getTime() >= targetToday.getTime()) {
            if (!isSpamming) {
                addLog(`⚠️ ĐÃ QUÁ GIỜ ${settings.spam_time} HÔM NAY`, 'warning');
                addLog(`🔥 TIẾN HÀNH NHẬN THƯỞNG NGAY!`, 'warning');
                startSpamming();
            }
            return true;
        }
        return false;
    }
    
    function startPeriodicCheck() {
        setInterval(() => {
            if (!checkinDone && isLoggedIn()) {
                checkStatus();
            }
        }, settings.auto_check * 1000);
        
        function checkHotZone() {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
            const isHotZone = (currentTime >= settings.hot_zone_start && currentTime <= "23:59") || 
                              (currentTime >= "00:00" && currentTime <= settings.hot_zone_end);
            
            if (isHotZone && !checkinDone && isLoggedIn()) {
                if (!fastCheckInterval) {
                    addLog(`🔥 [VÙNG NÓNG] BẬT | KIỂM TRA MỖI ${settings.hot_zone} GIÂY`, 'warning');
                    fastCheckInterval = setInterval(() => {
                        if (!checkinDone && isLoggedIn()) checkStatus();
                    }, settings.hot_zone * 1000);
                }
            } else {
                if (fastCheckInterval) {
                    clearInterval(fastCheckInterval);
                    fastCheckInterval = null;
                }
            }
        }
        checkHotZone();
        setInterval(checkHotZone, 30000);
    }
    
    function stopFastCheck() {
        if (fastCheckInterval) {
            clearInterval(fastCheckInterval);
            fastCheckInterval = null;
        }
    }
    
    function scheduleSpam() {
        const [targetHour, targetMinute, targetSecond] = settings.spam_time.split(':').map(Number);
        const now = new Date();
        let target = new Date();
        target.setHours(targetHour, targetMinute, targetSecond || 0, 0);
        if (now >= target) target.setDate(target.getDate() + 1);
        const waitMs = target - now;
        addLog(`⏰ ĐÃ HẸN GIỜ SPAM LÚC ${settings.spam_time} | CÒN ${Math.round(waitMs/60000)} PHÚT`, 'info');
        setTimeout(() => { if (!checkinDone && isLoggedIn()) startSpamming(); }, waitMs);
    }
    
    // ========== KHỞI ĐỘNG ==========
    async function init() {
        loadSettings();
        createPanel();
        startCountdown();
        
        // Kiểm tra đăng nhập
        if (!isLoggedIn()) {
            addLog(`🔐 CHƯA ĐĂNG NHẬP!`, 'error');
            addLog(`👉 VUI LÒNG ĐĂNG NHẬP GOOGLE`, 'warning');
            addLog(`👉 SAU KHI ĐĂNG NHẬP XONG, BẤM REFRESH`, 'info');
            updateStatus('CHƯA LOGIN', '#ef4444');
            return;
        }
        
        // Tự động lấy user_id
        let userId = getUserIdFromPage();
        if (!userId) {
            addLog(`⚠️ KHÔNG TÌM THẤY USER_ID, THỬ GỌI API...`, 'warning');
        }
        
        // Tạo session mới từ trình duyệt
        session = {
            userId: userId || '1509',
            email: '',
            csrf: getAutoCsrf(),
            cookie: getAutoCookie(),
            savedAt: new Date().toISOString()
        };
        saveSession(session);
        
        addLog(`✅ HỆ THỐNG SẴN SÀNG | USER: ${session.userId}`, 'success');
        addLog(`🍪 COOKIE ĐÃ ĐƯỢC TỰ ĐỘNG LẤY TỪ TRÌNH DUYỆT`, 'success');
        
        await checkStatus();
        
        if (!checkinDone) {
            const isPast = checkAndSpamIfPastTime();
            if (!isPast) {
                scheduleSpam();
                startPeriodicCheck();
            }
        }
        
        // Kiểm tra lại mỗi phút
        setInterval(() => {
            if (!checkinDone && !isSpamming && isLoggedIn()) {
                checkAndSpamIfPastTime();
            }
        }, 60000);
    }
    
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();