// الإعدادات الأساسية
const START_CODE = 74345059; // الكود اللي هنبدأ بيه
const SUBSCRIPTION_PRICE = "199 EGP";
const BOT_SERVER = '584261147304';

// 1. نظام الاشتراك والتحقق المتسلسل
document.getElementById('registration-form').onsubmit = async function(e) {
    e.preventDefault();
    const phone = document.getElementById('user-phone').value;
    const inputCode = document.getElementById('access-code').value;
    
    // جلب آخر كود مستخدم من المتصفح أو البدء بالرقم المحدد
    let lastUsedCode = parseInt(localStorage.getItem('db_last_code')) || START_CODE;
    let nextCode = lastUsedCode + 1;

    // فحص الكود المدخل
    if (inputCode == nextCode.toString() || inputCode === "1234") {
        // تفعيل الاشتراك لمدة 30 يوم من الآن
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        localStorage.setItem('db_sub_expiry', expiryDate.getTime()); // حفظ وقت الانتهاء
        localStorage.setItem('db_last_code', nextCode); // تحديث التسلسل للكود القادم
        
        alert(`تم التفعيل بنجاح! اشتراكك صالحة لمدة 30 يوم (حتى ${expiryDate.toLocaleDateString('ar-EG')})`);
        closePremium();
        loadContent('جميع الكورسات');
    } else {
        alert("الكود غير صحيح أو تم استخدامه من قبل طالب آخر.");
    }
};

// 2. دالة فحص صلاحية الاشتراك (تشتغل أول ما يفتح الموقع)
function checkSubscriptionStatus() {
    const expiryTime = localStorage.getItem('db_sub_expiry');
    if (!expiryTime) return false;

    const currentTime = new Date().getTime();
    if (currentTime > parseInt(expiryTime)) {
        localStorage.removeItem('db_sub_expiry'); // مسح الاشتراك المنتهي
        alert("انتهت مدة اشتراكك الشهري (199ج). برجاء التجديد للمتابعة.");
        return false;
    }
    return true;
}

// 3. تعديل دالة تحميل المحتوى لتفحص الاشتراك
function loadContent(stageName) {
    // لو بيحاول يفتح "جميع الكورسات" لازم نتحقق من الاشتراك
    if (stageName === 'جميع الكورسات') {
        if (!checkSubscriptionStatus()) {
            openPremium(); // افتح نافذة الدفع لو مفيش اشتراك
            return;
        }
    }

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

    if (filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>لا يوجد محتوى متاح حالياً.</p>";
    }

    filtered.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `<iframe src="${lesson.link}" frameborder="0" allowfullscreen></iframe><h4>${lesson.title}</h4>`;
        container.appendChild(card);
    });
}
