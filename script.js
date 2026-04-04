// الإعدادات الأساسية
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';
const BOT_SERVER = '584261147304';
const START_CODE_BASE = 74345059;

let allLessons = [];
let isLoginMode = false;

// 1. نظام الحماية والتسجيل (أول ما الصفحة تحمل)
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('db_user_phone')) {
        showTrackSelection();
    }
    fetchData();
});

// معالج فورم التسجيل/الدخول
document.getElementById('auth-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const nameInput = document.getElementById('user-name').value.trim();
    const phoneInput = document.getElementById('user-phone').value.trim();
    const passInput = document.getElementById('user-pass').value.trim();

    if (!isLoginMode) {
        // --- وضع إنشاء حساب جديد ---
        if(nameInput === "" || phoneInput === "" || passInput === "") return alert("يا بطل املأ بياناتك كلها الأول!");
        localStorage.setItem('db_user_phone', phoneInput);
        localStorage.setItem('db_user_name', nameInput);
        localStorage.setItem('db_user_pass', passInput);
        window.open(`https://wa.me/${BOT_SERVER}?text=تسجيل_جديد%0Aالطالب:${nameInput}%0Aالرقم:${phoneInput}`);
        showTrackSelection();
    } else {
        // --- وضع تسجيل الدخول (مقارنة بالبيانات المخزنة) ---
        const savedPhone = localStorage.getItem('db_user_phone');
        const savedPass = localStorage.getItem('db_user_pass');
        if (phoneInput === savedPhone && passInput === savedPass) {
            showTrackSelection();
        } else {
            alert("البيانات دي غلط أو مش بتاعة الموبايل ده! راجع المستر.");
        }
    }
});

// معالج فورم الاشتراك المتسلسل
document.getElementById('subscription-form').onsubmit = (e) => {
    e.preventDefault();
    const code = document.getElementById('access-code').value.trim();
    if(parseInt(code) >= START_CODE_BASE || code === "1234") {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        localStorage.setItem('db_sub_expiry', expiry.getTime());
        alert("تم تفعيل الباقة الذهبية لمدة شهر! استمتع يا بطل.");
        closePremium();
        loadContent('جميع الكورسات');
    } else {
        alert("الكود خطأ! كلم المستر يبعتلك كود جديد.");
    }
};

// 2. التحكم في الشاشات واللغة
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "تسجيل دخول" : "إنشاء حساب جديد";
    document.getElementById('name-group').style.display = isLoginMode ? "none" : "flex";
}

function showTrackSelection() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('track-overlay').style.display = 'flex';
    document.getElementById('display-user-name').innerText = "أهلاً يا " + localStorage.getItem('db_user_name').split(' ')[0];
}

function setTrack(track) {
    localStorage.setItem('db_track', track);
    document.getElementById('track-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

// 3. جلب وعرض المحتوى (تشغيل الفيديوهات أوتوماتيك)
async function fetchData() {
    try {
        const res = await fetch(sheetURL);
        const data = await res.text();
        const rows = data.split('\n').filter(r => r.trim() !== '');
        allLessons = rows.slice(1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                title: cols[0]?.replace(/"/g, '').trim(),
                link: formatYoutubeEmbed(cols[1]?.replace(/"/g, '').trim() || ""),
                stage: cols[2]?.replace(/"/g, '').trim()
            };
        });
    } catch (e) { console.log("Error loading sheet"); }
}

function formatYoutubeEmbed(url) {
    if (!url) return "";
    let id = "";
    if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
}

function loadContent(stageName) {
    // حماية الباقة الذهبية
    if (stageName === 'جميع الكورسات') {
        const expiry = localStorage.getItem('db_sub_expiry');
        if (!expiry || new Date().getTime() > parseInt(expiry)) return openPremium();
    }
    document.getElementById('stages').style.display = 'none';
    document.getElementById('lessons-area').style.display = 'block';
    document.getElementById('current-title').innerText = "محتوى " + stageName;
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    const track = localStorage.getItem('db_track') || 'علوم';

    allLessons.filter(l => l.stage.includes(stageName) && (l.title.includes(track) || stageName === 'جميع الكورسات'))
    .forEach(l => {
        grid.innerHTML += `
            <div class="lesson-card">
                <div class="video-wrapper"><iframe src="${l.link}" allowfullscreen></iframe></div>
                <h4>${l.title}</h4>
            </div>`;
    });
}

// 4. وظائف إضافية (مودال، نسخ، خروج)
function openPremium() { document.getElementById('premium-modal').style.display = 'flex'; }
function closePremium() { document.getElementById('premium-modal').style.display = 'none'; }
function showHome() { document.getElementById('stages').style.display = 'block'; document.getElementById('lessons-area').style.display = 'none'; }
function logout() { localStorage.clear(); location.reload(); }
function copyInsta() { navigator.clipboard.writeText('drbeshoy@instapay'); alert("تم النسخ!"); }
function requestNewCode() {
    const name = localStorage.getItem('db_user_name');
    const phone = localStorage.getItem('db_user_phone');
    window.open(`https://wa.me/${BOT_SERVER}?text=طلب_كود_الذهبية%0Aالاسم:${name}%0Aالرقم:${phone}`);
}
