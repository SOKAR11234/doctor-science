const START_CODE_BASE = 74345059;
const BOT_SERVER = '584261147304';
const DOCTOR_INSTAPAY = 'drbeshoy@instapay'; // عنوان إنستا باي للمستر

// 1. نظام التحقق والاشتراك الشهري
document.getElementById('registration-form').onsubmit = async function(e) {
    e.preventDefault();
    const name = localStorage.getItem('db_user_name');
    const phone = localStorage.getItem('db_user_phone');
    const inputCode = document.getElementById('access-code').value.trim();

    // حساب الكود المتسلسل القادم بناءً على عدد المرات اللي الطالب ده فعل فيها أو من السيرفر
    // ملاحظة: لجعل التسلسل عالمي لكل الطلاب، الأفضل للمستر إعطاء الكود يدوياً من السيرفر
    if (inputCode === "") {
        // طلب كود جديد من السيرفر (58+)
        const serverMsg = `طلب_اشتراك_199ج%0Aالطالب: ${name}%0Aالرقم: ${phone}%0Aالدفع: انستا_باي`;
        window.open(`https://wa.me/${BOT_SERVER}?text=${serverMsg}`);
        alert("تم تحويلك للسيرفر لطلب الكود. بعد التحويل بـ 199ج على إنستا باي، المستر هيديك كود التفعيل.");
        return;
    }

    // التحقق من الكود (سواء كود الماستر أو الكود المتسلسل)
    // هنا بنفترض إن المستر بيدي الكود للطالب بناءً على التسلسل
    if (parseInt(inputCode) >= START_CODE_BASE || inputCode === "1234") {
        // تفعيل لمدة 30 يوم
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        localStorage.setItem('db_sub_expiry', expiryDate.getTime());
        
        alert(`عاش يا بطل! تم تفعيل "جميع الكورسات" بنجاح.\nصالح حتى: ${expiryDate.toLocaleDateString('ar-EG')}`);
        closePremium();
        loadContent('جميع الكورسات');
    } else {
        alert("الكود ده قديم أو غير صحيح. تأكد من الكود المستلم من المستر.");
    }
};

// 2. دالة فحص الصلاحية (تمنع الدخول لو الشهر خلص)
function isSubscriptionValid() {
    const expiry = localStorage.getItem('db_sub_expiry');
    if (!expiry) return false;
    
    if (new Date().getTime() > parseInt(expiry)) {
        localStorage.removeItem('db_sub_expiry'); // مسح الاشتراك المنتهي
        return false;
    }
    return true;
}

// 3. تعديل تحميل المحتوى ليدعم القفل التلقائي
function loadContent(stageName) {
    // حماية قسم "جميع الكورسات"
    if (stageName === 'جميع الكورسات') {
        if (!isSubscriptionValid()) {
            alert("عفواً! لازم تشترك في باقة الـ 199ج عشان تفتح جميع الكورسات.");
            openPremium();
            return;
        }
    }

    document.getElementById('stages').style.display = 'none';
    document.getElementById('lessons-area').style.display = 'block';
    document.getElementById('current-title').innerText = stageName;
    
    const container = document.getElementById('video-grid');
    container.innerHTML = '';

    const track = localStorage.getItem('db_track');
    // فلترة الدروس: تظهر لو هي تبع المرحلة والمسار، أو لو القسم هو "جميع الكورسات"
    const filtered = allLessons.filter(l => 
        (l.stage.includes(stageName)) && 
        (l.title.toLowerCase().includes(track.toLowerCase()) || stageName === 'جميع الكورسات')
    );

    if (filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>لا يوجد دروس مرفوعة حالياً لهذا القسم.</p>";
    }

    filtered.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `<iframe src="${lesson.link}" frameborder="0" allowfullscreen></iframe><h4>${lesson.title}</h4>`;
        container.appendChild(card);
    });
}

// دالة مساعدة لنسخ عنوان إنستا باي
function copyInsta() {
    navigator.clipboard.writeText(DOCTOR_INSTAPAY);
    alert("تم نسخ عنوان InstaPay: " + DOCTOR_INSTAPAY);
}
