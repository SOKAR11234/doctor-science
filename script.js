// 1. الإعدادات والرابط الجديد
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRh_ccwqmmGwbT4VC-QnAJ_NMpTcHmKTHklJRQay67p6OvFoAufXk71_2QsosDW2ILie7lQ3Pwc9Ug4/pub?output=csv';
const BOT_SERVER = '584261147304';
const START_CODE_BASE = 74345059;

let allLessons = [];
let isLoginMode = false;

// 2. تشغيل النظام
document.addEventListener('DOMContentLoaded', () => {
    // جلب البيانات فوراً عند تحميل الصفحة
    fetchData();

    if (localStorage.getItem('db_user_phone')) {
        showTrackSelection();
    }
    
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
});

// 3. جلب البيانات (المحرك الأساسي)
async function fetchData() {
    try {
        console.log("جاري سحب الدروس من الشيت الجديد...");
        const response = await fetch(sheetURL);
        const csvData = await response.text();
        
        // تقسيم الصفوف وتنظيفها
        const rows = csvData.trim().split('\n').filter(r => r.length > 5);
        
        allLessons = rows.slice(1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                title: (cols[0] || "").replace(/"/g, '').trim(),
                link: (cols[1] || "").replace(/"/g, '').trim(),
                stage: (cols[2] || "").replace(/"/g, '').trim()
            };
        });
        
        console.log("تم تحميل بنجاح عدد: " + allLessons.length + " درس");
    } catch (err) {
        console.error("عطل في سحب بيانات الشيت:", err);
    }
}

// 4. تحويل الروابط لعرض الفيديو (Embed)
function formatYoutube(url) {
    if (!url) return "";
    let id = "";
    url = url.trim();
    if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('embed/')) return url;
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : "";
}

// 5. عرض المحتوى والفلترة
function loadContent(stage) {
    if (stage === 'جميع الكورسات') {
        const expiry = localStorage.getItem('db_sub_expiry');
        if (!expiry || new Date().getTime() > parseInt(expiry)) return openPremium();
    }

    document.getElementById('stages').style.display = 'none';
    document.getElementById('lessons-area').style.display = 'block';
    document.getElementById('current-title').innerText = "محتوى " + stage;
    
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">جاري تحميل الفيديوهات...</p>';
    
    const userTrack = localStorage.getItem('db_track') || 'علوم';

    // فلترة ذكية
    const filtered = allLessons.filter(lesson => {
        const stageMatch = lesson.stage.includes(stage) || stage === 'جميع الكورسات';
        const trackMatch = lesson.title.toLowerCase().includes(userTrack.toLowerCase()) || stage === 'جميع الكورسات';
        return stageMatch && trackMatch;
    });

    setTimeout(() => {
        grid.innerHTML = '';
        if (filtered.length === 0) {
            grid.innerHTML = "<p style='grid-column:1/-1; text-align:center; padding:50px;'>لا توجد دروس مضافة حالياً في هذا القسم.</p>";
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
    }, 500); // تأخير بسيط لضمان سلاسة العرض
}

// 6. وظائف الدخول والاشتراك
function handleAuth(e) {
    e.preventDefault();
    const name = document.getElementById('user-name').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const pass = document.getElementById('user-pass').value.trim();

    if (!isLoginMode) {
        if (!name || !phone || !pass) return alert("اكمل البيانات يا بطل!");
        localStorage.setItem('db_user_name', name);
        localStorage.setItem('db_user_phone', phone);
        localStorage.setItem('db_user_pass', pass);
        window.open(`https://wa.me/${BOT_SERVER}?text=تسجيل_جديد%0Aالطالب:${name}%0Aالرقم:${phone}`, '_blank');
        showTrackSelection();
    } else {
        if (phone === localStorage.getItem('db_user_phone') && pass === localStorage.getItem('db_user_pass')) {
            showTrackSelection();
        } else {
            alert("بيانات الدخول غير صحيحة!");
        }
    }
}

function showTrackSelection() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('track-overlay').style.display = 'flex';
    const name = localStorage.getItem('db_user_name') || "";
    document.getElementById('display-user-name').innerText = "أهلاً يا " + name.split(' ')[0];
}

function setTrack(t) {
    localStorage.setItem('db_track', t);
    document.getElementById('track-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "تسجيل دخول" : "إنشاء حساب جديد";
    document.getElementById('name-group').style.display = isLoginMode ? "none" : "flex";
}

function openPremium() { document.getElementById('premium-modal').style.display = 'flex'; }
function closePremium() { document.getElementById('premium-modal').style.display = 'none'; }
function showHome() { document.getElementById('stages').style.display = 'block'; document.getElementById('lessons-area').style.display = 'none'; }
function logout() { localStorage.clear(); location.reload(); }
function copyInsta() { navigator.clipboard.writeText('drbeshoy@instapay'); alert("تم نسخ عنوان الدفع!"); }
