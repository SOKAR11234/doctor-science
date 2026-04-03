const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';
const BOT_SERVER = '584261147304';

let allLessons = [];
let isLoginMode = false;

// 1. نظام تسجيل الدخول والجهاز الواحد (Local الحماية)
document.getElementById('auth-form').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    const pass = document.getElementById('user-pass').value;

    if (!isLoginMode) {
        // إنشاء حساب جديد: تخزين البيانات في الجهاز (بصمة الجهاز)
        localStorage.setItem('db_user_phone', phone);
        localStorage.setItem('db_user_name', name);
        localStorage.setItem('db_user_pass', pass);
        
        // إرسال البيانات لسيرفر الأكواد عشان المستر يسجلها
        const msg = `تسجيل_جديد%0Aالاسم: ${name}%0Aالرقم: ${phone}%0Aكلمة_السر: ${pass}%0A-- سجل البيانات في الشيت --`;
        window.open(`https://wa.me/${BOT_SERVER}?text=${msg}`);
        
        showTrackSelection();
    } else {
        // تسجيل دخول: فحص لو نفس الجهاز
        const savedPhone = localStorage.getItem('db_user_phone');
        const savedPass = localStorage.getItem('db_user_pass');

        if (phone === savedPhone && pass === savedPass) {
            showTrackSelection();
        } else {
            alert("خطأ: هذا الحساب مسجل على جهاز آخر أو البيانات غير صحيحة. راجع المستر.");
        }
    }
};

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "تسجيل دخول" : "إنشاء حساب جديد";
    document.getElementById('name-group').style.display = isLoginMode ? "none" : "flex";
    document.querySelector('.toggle-auth').innerText = isLoginMode ? "ليس لديك حساب؟ أنشئ واحد الآن" : "لديك حساب بالفعل؟ سجل دخولك";
}

function showTrackSelection() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('track-overlay').style.display = 'flex';
    document.getElementById('display-user-name').innerText = localStorage.getItem('db_user_name');
}

function setTrack(track) {
    localStorage.setItem('db_track', track);
    document.getElementById('track-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    fetchData();
}

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
    } catch (e) { console.error(e); }
}

function formatYoutubeLink(url) {
    let id = "";
    if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
}

function loadContent(stageName) {
    document.getElementById('stages').style.display = 'none';
    document.getElementById('lessons-area').style.display = 'block';
    document.getElementById('current-title').innerText = stageName;
    
    const container = document.getElementById('video-grid');
    container.innerHTML = '';

    const track = localStorage.getItem('db_track');
    const filtered = allLessons.filter(l => 
        (l.stage.includes(stageName)) && 
        (l.title.toLowerCase().includes(track.toLowerCase()) || stageName === 'جميع الكورسات')
    );

    filtered.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `<iframe src="${lesson.link}" frameborder="0" allowfullscreen></iframe><h4>${lesson.title}</h4>`;
        container.appendChild(card);
    });
}

function showHome() {
    document.getElementById('stages').style.display = 'block';
    document.getElementById('lessons-area').style.display = 'none';
}

function logout() { localStorage.clear(); location.reload(); }

// التحقق لو مسجل دخول قبل كدة
window.onload = () => {
    if (localStorage.getItem('db_user_phone')) {
        showTrackSelection();
    }
};
