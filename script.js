// الإعدادات الأساسية
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';
const BOT_SERVER = '584261147304';
const START_CODE_BASE = 74345059;

let allLessons = [];
let isLoginMode = false;

// --- 1. نظام الحماية والتسجيل (أول ما الصفحة تحمل) ---
document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    
    // فحص لو الطالب مسجل دخول قبل كدة على الجهاز ده
    if (localStorage.getItem('db_user_phone')) {
        showTrackSelection();
    }

    // معالج فورم التسجيل/الدخول
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('user-name').value.trim();
        const phone = document.getElementById('user-phone').value.trim();
        const pass = document.getElementById('user-pass').value.trim();

        if (!isLoginMode) {
            // حالة إنشاء حساب جديد
            if(name === "" || phone === "" || pass === "") {
                alert("برجاء كمال البيانات أولاً");
                return;
            }
            // حفظ البيانات "بصمة الجهاز"
            localStorage.setItem('db_user_phone', phone);
            localStorage.setItem('db_user_name', name);
            localStorage.setItem('db_user_pass', pass);
            
            // مراسلة السيرفر (بوت الـ 58)
            const serverMsg = `تسجيل_جديد%0Aالطالب: ${name}%0Aالرقم: ${phone}%0Aكلمة_السر: ${pass}`;
            window.open(`https://wa.me/${BOT_SERVER}?text=${serverMsg}`, '_blank');
            
            showTrackSelection();
        } else {
            // حالة تسجيل الدخول (فحص البيانات المخزنة)
            const savedPhone = localStorage.getItem('db_user_phone');
            const savedPass = localStorage.getItem('db_user_pass');

            if (phone === savedPhone && pass === savedPass) {
                showTrackSelection();
            } else {
                alert("عفواً! البيانات غير متطابقة مع هذا الجهاز، أو لم تقم بإنشاء حساب.");
            }
        }
    });

    // معالج فورم الاشتراك (الكود المتسلسل)
    const regForm = document.getElementById('registration-form');
    regForm.addEventListener('submit', handleSubscription);
    
    // تحميل بيانات الشيت في الخلفية
    fetchData();
});

// --- 2. التحكم في الشاشات ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "تسجيل دخول" : "إنشاء حساب جديد";
    document.getElementById('name-group').style.display = isLoginMode ? "none" : "flex";
    document.querySelector('.toggle-auth').innerText = isLoginMode ? "ليس لديك حساب؟ أنشئ واحد الآن" : "لديك حساب بالفعل؟ سجل دخولك";
}

function showTrackSelection() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('track-overlay').style.display = 'flex';
    const userName = localStorage.getItem('db_user_name');
    document.getElementById('display-user-name').innerText = "يا " + (userName ? userName.split(' ')[0] : "بطل");
}

function setTrack(track) {
    localStorage.setItem('db_track', track);
    document.getElementById('track-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    window.scrollTo(0,0);
}

// --- 3. نظام الاشتراك (199ج) ---
async function handleSubscription(e) {
    e.preventDefault();
    const inputCode = document.getElementById('access-code').value.trim();
    
    if (inputCode === "") {
        requestNewCode();
        return;
    }

    // التحقق من كود الماستر أو التسلسل (74345059 فما فوق)
    if (parseInt(inputCode) >= START_CODE_BASE || inputCode === "1234") {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        localStorage.setItem('db_sub_expiry', expiry.getTime());
        
        alert("تم تفعيل الكورسات بنجاح لمدة شهر!");
        closePremium();
        loadContent('جميع الكورسات');
    } else {
        alert("كود التفعيل غير صحيح!");
    }
}

// --- 4. جلب وعرض المحتوى ---
async function fetchData() {
    try {
        const res = await fetch(sheetURL);
        const data = await res.text();
        const rows = data.split('\n').filter(r => r.trim() !== '');
        allLessons = rows.slice(1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                title: cols[0]?.replace(/"/g, '').trim(),
                link: formatYoutubeLink(cols[1]?.replace(/"/g, '').trim() || ""),
                stage: cols[2]?.replace(/"/g, '').trim()
            };
        });
    } catch (e) { console.error("Sheet Error:", e); }
}

function formatYoutubeLink(url) {
    let id = "";
    if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
}

function loadContent(stageName) {
    // حماية "جميع الكورسات"
    if (stageName === 'جميع الكورسات') {
        const expiry = localStorage.getItem('db_sub_expiry');
        const now = new Date().getTime();
        if (!expiry || now > parseInt(expiry)) {
            openPremium();
            return;
        }
    }

    document.getElementById('stages').style.display = 'none';
    document.getElementById('lessons-area').style.display = 'block';
    document.getElementById('current-title').innerText = stageName;
    
    const container = document.getElementById('video-grid');
    container.innerHTML = '';
    const track = localStorage.getItem('db_track') || 'علوم';

    const filtered = allLessons.filter(l => 
        l.stage.includes(stageName) && 
        (l.title.toLowerCase().includes(track.toLowerCase()) || stageName === 'جميع الكورسات')
    );

    if(filtered.length === 0) container.innerHTML = "<p>سيتم إضافة الدروس قريباً...</p>";

    filtered.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `<iframe src="${lesson.link}" frameborder="0" allowfullscreen></iframe><h4>${lesson.title}</h4>`;
        container.appendChild(card);
    });
}

// --- 5. وظائف إضافية ---
function openPremium() { document.getElementById('premium-modal').style.display = 'flex'; }
function closePremium() { document.getElementById('premium-modal').style.display = 'none'; }
function showHome() { document.getElementById('stages').style.display = 'block'; document.getElementById('lessons-area').style.display = 'none'; }
function copyInsta() { navigator.clipboard.writeText('drbeshoy@instapay'); alert("تم نسخ العنوان!"); }
function requestNewCode() {
    const name = localStorage.getItem('db_user_name');
    const phone = localStorage.getItem('db_user_phone');
    window.open(`https://wa.me/${BOT_SERVER}?text=طلب_كود_199ج%0Aالاسم:${name}%0Aالرقم:${phone}`, '_blank');
}
function logout() { localStorage.clear(); location.reload(); }
