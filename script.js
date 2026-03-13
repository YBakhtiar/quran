let db = null;
let surahNames = {
    1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة",
    6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
    11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر",
    16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
    21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان",
    26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
    31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر",
    36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
    41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية",
    46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
    51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن",
    56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
    61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق",
    66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
    71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة",
    76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
    81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج",
    86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
    91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
    96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
    101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
    106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
    111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
};

// تابع کمکی برای ذخیره و بازیابی از localStorage
const PAGE_CACHE_KEY = 'quran_page_';

function getCachedPageLines(pageNumber) {
    const cached = localStorage.getItem(PAGE_CACHE_KEY + pageNumber);
    return cached ? JSON.parse(cached) : null;
}

function cachePageLines(pageNumber, lines) {
    localStorage.setItem(PAGE_CACHE_KEY + pageNumber, JSON.stringify(lines));
}

// کدهای قبلی برای IndexedDB و initDatabase را اینجا قرار دهید (مثل قبل)
// ...

window.onload = async () => {
    const pageElement = document.getElementById('mushaf-page');
    pageElement.classList.add('qpc-hafs'); // اضافه کردن کلاس فونت مانند راهنما
    try {
        await initDatabase(); // همان تابع قبلی که از IndexedDB استفاده می‌کند
        populatePageSelect();
        
        const select = document.getElementById('page-select');
        if (select.options.length > 0) {
            loadPage(select.value);
        } else {
            pageElement.innerHTML = '<div class="error">هیچ صفحه‌ای یافت نشد</div>';
        }
    } catch (error) {
        console.error('خطا:', error);
        pageElement.innerHTML = `<div class="error">خطا در بارگذاری: ${error.message}</div>`;
    }
};

function populatePageSelect() {
    if (!db) return;
    const result = db.exec("SELECT DISTINCT page_number FROM pages WHERE page_number >= 2 ORDER BY page_number");
    if (result.length > 0) {
        const pages = result[0].values;
        const select = document.getElementById('page-select');
        select.innerHTML = pages.map(p => `<option value="${p[0]}">صفحه ${p[0]}</option>`).join('');
    }
}

async function loadPage(pageNumber) {
    const pageElement = document.getElementById('mushaf-page');
    pageElement.innerHTML = '<div class="loading">در حال بارگذاری صفحه...</div>';
    
    try {
        // اطلاعات خطوط از دیتابیس
        const linesResult = db.exec(`
            SELECT line_number, line_type, is_centered
            FROM pages 
            WHERE page_number = ${pageNumber} 
            ORDER BY line_number
        `);
        
        if (linesResult.length === 0) {
            pageElement.innerHTML = '<div class="error">اطلاعات این صفحه در دیتابیس یافت نشد</div>';
            return;
        }

        const layoutLines = linesResult[0].values; // [line_number, line_type, is_centered]

        // تلاش برای بازیابی متن صفحه از localStorage
        let pageTextLines = getCachedPageLines(pageNumber);
        
        if (!pageTextLines) {
            // اگر در کش نبود، از فایل Word بخوان
            const fileNumber = pageNumber - 1;
            const docxUrl = `pages/${fileNumber}.docx`;
            
            let docxBuffer;
            try {
                const response = await fetch(docxUrl);
                if (!response.ok) throw new Error('فایل Word یافت نشد');
                docxBuffer = await response.arrayBuffer();
            } catch (e) {
                pageElement.innerHTML = `<div class="error">فایل Word صفحه ${pageNumber} یافت نشد</div>`;
                return;
            }

            const mammothResult = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
            const fullText = mammothResult.value;
            pageTextLines = fullText.split('\n').map(line => line.trim()).filter(line => line !== '');
            
            // ذخیره در localStorage برای دفعات بعد
            cachePageLines(pageNumber, pageTextLines);
        }

        // تطابق تعداد خطوط
        if (pageTextLines.length !== layoutLines.length) {
            console.warn(`تعداد خطوط در فایل Word (${pageTextLines.length}) با دیتابیس (${layoutLines.length}) مطابقت ندارد.`);
            const minLines = Math.min(pageTextLines.length, layoutLines.length);
            pageTextLines = pageTextLines.slice(0, minLines);
        }

        // ساخت HTML با رعایت is_centered
        let html = '';
        for (let i = 0; i < layoutLines.length; i++) {
            const [lineNum, lineType, isCentered] = layoutLines[i];
            const lineText = pageTextLines[i] || '';
            
            // تعیین کلاس‌ها
            let lineClass = 'line';
            if (lineType === 'surah_name') lineClass += ' surah-name';
            else if (lineType === 'basmallah') lineClass += ' basmallah';
            else if (lineType === 'ayah') lineClass += ' ayah';
            
            // اعمال align بر اساس is_centered
            if (isCentered) {
                lineClass += ' center';
                html += `<div class="${lineClass}">${lineText}</div>`;
            } else {
                // برای ayah با is_centered=false از justify استفاده می‌کنیم
                if (lineType === 'ayah') {
                    lineClass += ' justify';
                }
                html += `<div class="${lineClass}" style="text-align: justify;">${lineText}</div>`;
            }
        }
        
        pageElement.innerHTML = html;
        
    } catch (error) {
        pageElement.innerHTML = `<div class="error">خطا در بارگذاری صفحه: ${error.message}</div>`;
    }
}
