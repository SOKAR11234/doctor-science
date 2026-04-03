const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';
const BOT_SERVER = '584261147304';
let isLoginMode = false;
let allLessons = [];

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('db_user_phone')) {
        showTrackSelection();
    }
    fetchData();
});

document.getElementById('auth-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('user-name').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const pass = document.getElementById('user-pass').value.trim();

    if (!isLoginMode) {
        if (!name || !phone || !pass) return alert("اكمل البيانات يا بطل!");
        localStorage.setItem('db_user_phone', phone);
        localStorage.setItem('db_user_name', name);
        localStorage.setItem('db_user_pass', pass);
        window.open(`https://wa.me/${BOT_SERVER}?text=تسجيل_جديد%0Aالاسم:${name}%0Aالرقم:${phone}`);
        showTrackSelection();
    } else {
        if (phone === localStorage.getItem('db_user_phone') && pass === localStorage.getItem('db_user_pass')) {
            showTrackSelection();
        } else {
            alert("البيانات خطأ أو غير مسجلة على هذا الجهاز!");
        }
    }
};

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "تسجيل دخول" : "إنشاء حساب جديد";
    document.getElementById('name-group').style.display = isLoginMode ? "none" : "flex";
}

function showTrackSelection() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('track-overlay').style.display = 'flex';
    document.getElementById('display-user-name').innerText = "أهلاً " + (localStorage.getItem('db_user_name') || "").split(' ')[0];
}

function setTrack(t) {
    localStorage.setItem('db_track', t);
    document.getElementById('track-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

async function fetchData() {
    try {
        const res = await fetch(sheetURL);
        const data = await res.text();
        const rows = data.split('\n').slice(1);
        allLessons = rows.map(r => {
            const c = r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return { title: c[0].replace(/"/g,''), link: c[1].replace(/"/g,''), stage: c[2].replace(/"/g,'') };
        });
    } catch(e) {}
}

function loadContent(s) {
    if (s === 'جميع الكورسات' && !localStorage.getItem('db_sub_expiry')) return alert("اشترك في الباقة الذهبية أولاً!");
    document.getElementById('stages').style.display = 'none';
    document.getElementById('lessons-area').style.display = 'block';
    document.getElementById('current-title').innerText = "محتوى " + s;
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    const track = localStorage.getItem('db_track');
    allLessons.filter(l => l.stage.includes(s) && (l.title.includes(track) || s === 'جميع الكورسات')).forEach(l => {
        grid.innerHTML += `<div class="lesson-card"><iframe src="${l.link.replace('watch?v=','embed/')}"></iframe><h4>${l.title}</h4></div>`;
    });
}

function showHome() { document.getElementById('stages').style.display = 'block'; document.getElementById('lessons-area').style.display = 'none'; }
function logout() { localStorage.clear(); location.reload(); }
