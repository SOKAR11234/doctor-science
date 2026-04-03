const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';
const BOT_SERVER = '584261147304';
const START_CODE_BASE = 74345059;

let allLessons = [];
let isLoginMode = false;

document.addEventListener('DOMContentLoaded', () => {
    // فحص حالة الدخول السابقة
    const savedPhone = localStorage.getItem('db_user_phone');
    if (savedPhone) {
        // لو مسجل قبل كدة، حظره إنه يدخل غير ببياناته
        isLoginMode = true;
        updateAuthUI();
    }

    // معالج الفورم الأساسي
    document.getElementById('auth-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('user-name').value.trim();
        const phoneInput = document.getElementById('user-phone').value.trim();
        const passInput = document.getElementById('user-pass').value.trim();

        if (!isLoginMode) {
            // --- وضع إنشاء حساب جديد ---
            if(nameInput === "" || phoneInput === "" || passInput === "") {
                alert("يا بطل كمل بياناتك كلها الأول!");
                return;
            }
            localStorage.setItem('db_user_phone', phoneInput);
            localStorage.setItem('db_user_name', nameInput);
            localStorage.setItem('db_user_pass', passInput);
            
            // مراسلة السيرفر
            const serverMsg = `تسجيل_جديد%0Aالطالب: ${nameInput}%0Aالرقم: ${phoneInput}%0Aكلمة_السر: ${passInput}`;
            window.open(`https://wa.me/${BOT_SERVER}?text=${serverMsg}`, '_blank');
            showTrackSelection();
        } else {
            // --- وضع تسجيل الدخول ---
            const savedPass = localStorage.getItem('db_user_pass');
            const savedPhoneLocal = localStorage.getItem('db_user_phone');

            if (phoneInput === savedPhoneLocal && passInput === savedPass) {
                showTrackSelection();
            } else {
                alert("البيانات دي مش مطابقة للجهاز ده! لو غيرت موبايلك كلم المستر.");
            }
        }
    });

    fetchData();
});

function updateAuthUI() {
    document.getElementById('auth-title').innerText = isLoginMode ? "تسجيل دخول" : "إنشاء حساب جديد";
    document.getElementById('name-group').style.display = isLoginMode ? "none" : "flex";
    document.querySelector('.toggle-auth').innerText = isLoginMode ? "ليس لديك حساب؟ سجل من جديد" : "لديك حساب؟ سجل دخولك";
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthUI();
}

function showTrackSelection() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('track-overlay').style.display = 'flex';
    document.getElementById('display-user-name').innerText = "يا " + localStorage.getItem('db_user_name').split(' ')[0];
}

function setTrack(track) {
    localStorage.setItem('db_track', track);
    document.getElementById('track-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

// نظام الكود المتسلسل والاشتراك
document.getElementById('registration-form').onsubmit = function(e) {
    e.preventDefault();
    const code = document.getElementById('access-code').value.trim();
    
    if(parseInt(code) >= START_CODE_BASE || code === "1234") {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        localStorage.setItem('db_sub_expiry', expiry.getTime());
        alert("تم تفعيل الكورسات لمدة شهر! استمتع يا بطل.");
        closePremium();
        loadContent('جميع الكورسات');
    } else {
        alert("الكود غلط! كلم المستر يبعتلك كود جديد.");
    }
};

async function fetchData() {
    try {
        const res = await fetch(sheetURL);
        const data = await res.text();
        const rows = data.split('\n').filter(r => r.trim() !== '');
        allLessons = rows.slice(1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                title: cols[0]?.replace(/"/g, '').trim(),
                link: formatLink(cols[1]?.replace(/"/g, '').trim() || ""),
                stage: cols[2]?.replace(/"/g, '').trim()
            };
        });
    } catch (e) { console.log("Error loading sheet"); }
}

function formatLink(url) {
    let id = "";
    if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
}

function loadContent(stageName) {
    if (stageName === 'جميع الكورسات') {
        const expiry = localStorage.getItem('db_sub_expiry');
        if (!expiry || new Date().getTime() > parseInt(expiry)) {
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

    allLessons.filter(l => l.stage.includes(stageName) && (l.title.includes(track) || stageName === 'جميع الكورسات'))
    .forEach(lesson => {
        container.innerHTML += `<div class="lesson-card"><iframe src="${lesson.link}" frameborder="0" allowfullscreen></iframe><h4>${lesson.title}</h4></div>`;
    });
}

function openPremium() { document.getElementById('premium-modal').style.display = 'flex'; }
function closePremium() { document.getElementById('premium-modal').style.display = 'none'; }
function showHome() { document.getElementById('stages').style.display = 'block'; document.getElementById('lessons-area').style.display = 'none'; }
function logout() { localStorage.clear(); location.reload(); }
function copyInsta() { navigator.clipboard.writeText('drbeshoy@instapay'); alert("تم النسخ!"); }
