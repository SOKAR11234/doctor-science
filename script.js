// 1. الرابط الجديد الذي أرسلته
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwFKvOvJeP7zjl_KV475zGoVMkrHJvtisD2n3pr1DYEQV5UV8zNwmyv6zUJlNMjEoGGunYmmdQciG_/pub?output=csv';

let allLessons = [];
let currentTrack = ''; // سيتم تحديده (علوم أو Science)

// 2. جلب البيانات من الشيت الجديد
async function fetchData() {
    try {
        const response = await fetch(sheetURL);
        const data = await response.text();
        // تقسيم البيانات لأسطر وتجاهل الأسطر الفارغة
        const rows = data.split('\n').filter(row => row.trim() !== '');
        
        allLessons = rows.slice(1).map(row => {
            // تقسيم الأسطر مع مراعاة وجود فواصل داخل النصوص
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 3) {
                return {
                    title: cols[0].replace(/"/g, '').trim(),
                    link: formatYoutubeLink(cols[1].replace(/"/g, '').trim()),
                    stage: cols[2].replace(/"/g, '').trim() // متوقع: ابتدائي، اعدادي، ثانوي
                };
            }
            return null;
        }).filter(item => item !== null);
        
        console.log("تم تحميل البيانات بنجاح، عدد الدروس:", allLessons.length);
    } catch (e) {
        console.error("خطأ في جلب بيانات الشيت:", e);
    }
}

// 3. تحويل روابط يوتيوب لروابط Embed لتعمل داخل الموقع
function formatYoutubeLink(url) {
    let videoId = "";
    if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('embed/')) {
        return url;
    } else {
        return url;
    }
    return `https://www.youtube.com/embed/${videoId}`;
}

// 4. دالة اختيار المسار (تستدعى من شاشة الاختيار)
function setTrack(track) {
    currentTrack = track;
    // إخفاء شاشة الاختيار وإظهار المحتوى
    document.getElementById('language-overlay').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    // تغيير نص اللوجو بناءً على الاختيار
    const logo = document.getElementById('main-logo');
    if (track === 'علوم') {
        logo.innerText = 'د. بيشوي - علوم';
    } else {
        logo.innerText = 'Dr. Beshoy - Science';
    }
    window.scrollTo(0,0);
}

// 5. عرض الدروس بناءً على المرحلة والمسار المختار
function loadContent(stageName) {
    // إخفاء الصفحة الرئيسية والمراحل
    document.getElementById('home').style.display = 'none';
    document.getElementById('stages').style.display = 'none';
    // إظهار قسم الدروس
    document.getElementById('lessons-section').style.display = 'block';
    
    // تحديث العنوان (مثلاً: Science - اعدادي)
    document.getElementById('current-stage-title').innerText = `${currentTrack} - ${stageName}`;
    
    const container = document.getElementById('lessons-container');
    container.innerHTML = '';

    // الفلترة: يجب أن تطابق المرحلة (C) ويحتوي العنوان (A) على كلمة المسار
    const filtered = allLessons.filter(l => {
        const matchStage = l.stage.includes(stageName);
        const matchTrack = l.title.toLowerCase().includes(currentTrack.toLowerCase());
        return matchStage && matchTrack;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 50px;">
                <p>لا توجد فيديوهات مضافة حالياً لـ ${currentTrack} (${stageName}).</p>
            </div>`;
    } else {
        filtered.forEach(lesson => {
            const card = document.createElement('div');
            card.className = 'lesson-card';
            card.innerHTML = `
                <iframe src="${lesson.link}" frameborder="0" allowfullscreen></iframe>
                <h4>${lesson.title}</h4>
            `;
            container.appendChild(card);
        });
    }
    window.scrollTo(0,0);
}

// 6. العودة للقائمة الرئيسية
function showHome() {
    document.getElementById('home').style.display = 'block';
    document.getElementById('stages').style.display = 'block';
    document.getElementById('lessons-section').style.display = 'none';
}

// 7. زر الوضع الليلي
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const icon = darkModeToggle.querySelector('i');
        if (document.body.classList.contains('dark')) {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    });
}

// تشغيل جلب البيانات عند فتح الصفحة
window.onload = fetchData;