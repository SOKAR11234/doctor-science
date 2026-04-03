const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';
let allLessons = [];
let currentTrack = '';

async function fetchData() {
    try {
        const response = await fetch(sheetURL);
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== '');
        allLessons = rows.slice(1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 3) {
                return {
                    title: cols[0].replace(/"/g, '').trim(),
                    link: formatYoutubeLink(cols[1].replace(/"/g, '').trim()),
                    stage: cols[2].replace(/"/g, '').trim()
                };
            }
            return null;
        }).filter(item => item !== null);
    } catch (e) { console.error(e); }
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

// --- الجزء الخاص بتسجيل بيانات الطلاب ---
document.getElementById('registration-form').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('student-name').value;
    const phone = document.getElementById('student-phone').value;
    const level = document.getElementById('student-level').value;

    // 1. إرسال البيانات للواتساب عشان الإيصال
    const whatsappMsg = `طلب اشتراك مُميز:%0Aالاسم: ${name}%0Aالموبايل: ${phone}%0Aالمرحلة: ${level}%0Aجاري إرسال إيصال الدفع (500ج).`;
    
    // 2. كود سحري لإرسال البيانات لشيت جوجل (عبر Google Form)
    // استبدل الرابط ده برابط "Submit" بتاع الفورم بتاعتك (لو عايزها أوتوماتيك 100%)
    // حالياً هنكتفي بالواتساب كتوثيق والدكتور يسجلهم عنده
    
    window.open(`https://wa.me/201285758754?text=${whatsappMsg}`);
    
    alert("تم إرسال بياناتك للدكتور. برجاء إرسال صورة تحويل الـ 500ج الآن لتفعيل الحساب.");
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
        l.stage.includes(stageName) && l.title.toLowerCase().includes(currentTrack.toLowerCase())
    );

    if(filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center; grid-column:1/-1;'>لا يوجد دروس حالياً.</p>";
    } else {
        filtered.forEach(lesson => {
            const card = document.createElement('div');
            card.className = 'lesson-card';
            card.innerHTML = `<iframe src="${lesson.link}" frameborder="0" allowfullscreen></iframe><h4>${lesson.title}</h4>`;
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
