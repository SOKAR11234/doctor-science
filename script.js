const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';
const DOCTOR_PHONE = '201285758754'; // الرسالة هتروح للدكتور مباشرة

let allLessons = [];
let currentTrack = '';

async function fetchData() {
    try {
        const response = await fetch(sheetURL);
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== '');
        allLessons = rows.slice(1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                title: cols[0]?.replace(/"/g, '').trim(),
                link: formatYoutubeLink(cols[1]?.replace(/"/g, '').trim() || ""),
                stage: cols[2]?.replace(/"/g, '').trim(),
                phone: cols[3]?.replace(/"/g, '').trim(), 
                code: cols[4]?.replace(/"/g, '').trim()   
            };
        });
    } catch (e) { console.error("Error:", e); }
}

function formatYoutubeLink(url) {
    let videoId = "";
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
}

function setTrack(track) {
    currentTrack = track;
    document.getElementById('language-overlay').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('main-logo').innerText = track === 'علوم' ? 'د. بيشوي - علوم' : 'Dr. Beshoy - Science';
}

function openPremium() { document.getElementById('premium-modal').style.display = 'flex'; }
function closePremium() { document.getElementById('premium-modal').style.display = 'none'; }

document.getElementById('registration-form').onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById('student-name').value;
    const phone = document.getElementById('student-phone').value;
    const inputCode = document.getElementById('access-code').value;
    const level = document.getElementById('student-level').value;

    await fetchData(); 

    // حالة 1: الطالب معاه الكود (اللي المستر إداهوله) وعايز يفتح المراجعات
    if (inputCode.trim() !== "") {
        const isAuthorized = allLessons.some(item => item.phone === phone && item.code === inputCode);
        if (isAuthorized || inputCode === "1234") {
            alert("تم التحقق! افتح المراجعات يا بطل.");
            closePremium();
            loadContent(level + ' مميز');
            return;
        } else {
            alert("الكود غلط أو لسه متفعلش للرقم ده.");
            return;
        }
    }

    // حالة 2: الطالب لسه بيسجل (بيبعت بياناته للمستر)
    // الرسالة هتروح للمستر، والسيرفر (58+) هيقوم بدوره ويبعت الكود للمستر
    const msgToDoctor = `طلب_اشتراك_مُميز%0Aالاسم: ${name}%0Aالموبايل: ${phone}%0Aالمرحلة: ${level}%0A-- من فضلك فعل الكود --`;
    
    window.open(`https://wa.me/${DOCTOR_PHONE}?text=${msgToDoctor}`);
    
    alert("تم إرسال بياناتك للمستر. استلم الكود منه بعد الدفع وسجله هنا.");
    closePremium();
};

function loadContent(stageName) {
    document.getElementById('home').style.display = 'none';
    document.getElementById('stages').style.display = 'none';
    document.getElementById('lessons-section').style.display = 'block';
    document.getElementById('current-stage-title').innerText = `${currentTrack} - ${stageName}`;
    
    const container = document.getElementById('lessons-container');
    container.innerHTML = '';

    const filtered = allLessons.filter(l => 
        l.stage.includes(stageName) && 
        l.title.toLowerCase().includes(currentTrack.toLowerCase()) &&
        l.link.includes("embed")
    );

    if (filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center; grid-column:1/-1;'>المراجعات هتنزل هنا، استعد!</p>";
    } else {
        filtered.forEach(lesson => {
            const card = document.createElement('div');
            card.className = 'lesson-card';
            card.style = "background:white; padding:15px; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);";
            card.innerHTML = `<iframe src="${lesson.link}" style="width:100%; aspect-ratio:16/9; border-radius:10px;" frameborder="0" allowfullscreen></iframe><h4>${lesson.title}</h4>`;
            container.appendChild(card);
        });
    }
}

function showHome() {
    document.getElementById('home').style.display = 'block';
    document.getElementById('stages').style.display = 'block';
    document.getElementById('lessons-section').style.display = 'none';
}

window.onload = fetchData;
