// 1. الإعدادات الأساسية
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';
const BOT_SERVER = '584261147304';
const START_CODE_BASE = 74345059;

let allLessons = [];
let isLoginMode = false;

// 2. تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التحقق لو الطالب مسجل دخول قبل كدة
    if (localStorage.getItem('db_user_phone')) {
        showTrackSelection();
    }
    
    // ربط الفورم بالأحداث
    const authForm = document.getElementById('auth-form');
    if(authForm) authForm.addEventListener('submit', handleAuth);

    const subForm = document.getElementById('subscription-form');
    if(subForm) subForm.addEventListener('submit', handleSubscription);

    // جلب البيانات من الشيت فوراً
    fetchData();
});

// 3. نظام الدخول والتسجيل الذكي
function handleAuth(e) {
    e.preventDefault();
    const name = document.getElementById('user-name').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const pass = document.getElementById('user-pass').value.trim();

    if (!isLoginMode) {
        // حالة إنشاء حساب جديد
        if (!name || !phone || !pass) return alert("يا بطل املأ كل البيانات!");
        
        localStorage.setItem('db_user_name', name);
        localStorage.setItem('db_user_phone', phone);
        localStorage.setItem('db_user_pass', pass);
        
        // إرسال بيانات للبوت
        const msg = `تسجيل_جديد%0Aالطالب:${name}%0Aالرقم:${phone}%0Aالباسورد:${pass}`;
        window.open(`https://wa.me/${BOT_SERVER}?text=${msg}`, '_blank');
        showTrackSelection();
    } else {
        // حالة تسجيل الدخول
        const savedPhone = localStorage.getItem('db_user_phone');
        const savedPass = localStorage.getItem('db_user_pass');
        
        if (phone === savedPhone && pass === savedPass) {
            showTrackSelection();
        } else {
            alert("بيانات الدخول غير صحيحة لهذا الجهاز!");
        }
    }
}

// 4. معالجة روابط اليوتيوب (الحل النهائي)
function formatYoutube(url) {
    if (!url) return "";
    let id = "";
    url = url.trim();
    
    if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('embed/')) return url;
    
    return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : "";
}

// 5. جلب البيانات من Google Sheets
async function fetchData() {
    try {
        const response = await fetch(sheetURL);
        const csvData = await response.text();
        const rows = csvData.split('\n').filter(row => row.trim() !== '');
        
        allLessons = rows.slice(1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                title: (cols[0] || "").replace(/"/g, '').trim(),
                link: (cols[1] || "").replace(/"/g, '').trim(),
                stage: (cols[2] || "").replace(/"/g, '').trim()
            };
        });
        console.log("تم تحميل " + allLessons.length + " درس");
    } catch (err) {
        console.error("خطأ في الاتصال بالشيت:", err);
    }
}

// 6. عرض المحتوى والفلترة
function loadContent(stage) {
    // حماية الباقة الذهبية
    if (stage === 'جميع الكورسات') {
        const expiry = localStorage.getItem('db_sub_expiry');
        if (!expiry || new Date().getTime() > parseInt(expiry)) return openPremium();
    }

    document.getElementById('stages').style.display = 'none';
    document.getElementById('lessons-area').style.display = 'block';
    document.getElementById('current-title').innerText = "محتوى " + stage;
    
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    
    const userTrack = localStorage.getItem('db_track') || 'علوم';

    const filtered = allLessons.filter(lesson => {
        const stageMatch = lesson.stage.includes(stage) || stage === 'جميع الكورسات';
        const trackMatch = lesson.title.toLowerCase().includes(userTrack.toLowerCase()) || stage === 'جميع الكورسات';
        return stageMatch && trackMatch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = "<p class='no-data'>سيتم إضافة الدروس قريباً لهذا القسم...</p>";
        return;
    }

    filtered.forEach(lesson => {
        const embed = formatYoutube(lesson.link);
        if (embed) {
            grid.innerHTML += `
                <div class="lesson-card">
                    <div class="video-wrapper">
                        <iframe src="${embed}" allowfullscreen loading="lazy"></iframe>
                    </div>
                    <h4>${lesson.title}</h4>
                </div>`;
        }
    });
    window.scrollTo(0,0);
}

// 7. وظائف النظام المساعدة
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "تسجيل دخول" : "إنشاء حساب جديد";
    document.getElementById('name-group').style.display = isLoginMode ? "none" : "flex";
    document.querySelector('.toggle-auth').innerText = isLoginMode ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب بالفعل؟ دخول";
}

function showTrackSelection() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('track-overlay').style.display = 'flex';
    const name = localStorage.getItem('db_user_name') || "بطل";
    document.getElementById('display-user-name').innerText = "أهلاً " + name.split(' ')[0];
}

function setTrack(track) {
    localStorage.setItem('db_track', track);
    document.getElementById('track-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

function handleSubscription(e) {
    e.preventDefault();
    const code = document.getElementById('access-code').value.trim();
    if (parseInt(code) >= START_CODE_BASE || code === "1234") {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        localStorage.setItem('db_sub_expiry', expiry.getTime());
        alert("مبروك! تم تفعيل الباقة الذهبية.");
        closePremium();
        loadContent('جميع الكورسات');
    } else {
        alert("كود التفعيل غير صحيح!");
    }
}

function openPremium() { document.getElementById('premium-modal').style.display = 'flex'; }
function closePremium() { document.getElementById('premium-modal').style.display = 'none'; }
function showHome() { 
    document.getElementById('stages').style.display = 'block'; 
    document.getElementById('lessons-area').style.display = 'none'; 
}
function logout() { localStorage.clear(); location.reload(); }
function copyInsta() { 
    navigator.clipboard.writeText('drbeshoy@instapay'); 
    alert("تم نسخ عنوان الدفع!"); 
}
function requestNewCode() {
    const n = localStorage.getItem('db_user_name');
    const p = localStorage.getItem('db_user_phone');
    window.open(`https://wa.me/${BOT_SERVER}?text=طلب_تفعيل_ذهبي%0Aالاسم:${n}%0Aالرقم:${p}`);
}
