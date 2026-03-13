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

window.onload = async () => {
    try {
        await initDatabase();
        populatePageSelect();
        // صفحه پیش‌فرض: اولین صفحه موجود (احتمالاً 2)
        const select = document.getElementById('page-select');
        if (select.options.length > 0) {
            loadPage(select.value);
        }
    } catch (error) {
        console.error('خطا در بارگذاری:', error);
        document.getElementById('mushaf-page').innerHTML = 
            `<div class="error">خطا در بارگذاری دیتابیس: ${error.message}</div>`;
    }
};

async function initDatabase() {
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    const response = await fetch('indopak-15-lines.db');
    if (!response.ok) throw new Error('فایل دیتابیس یافت نشد');
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    db = new SQL.Database(uint8Array);
}

function populatePageSelect() {
    if (!db) return;
    
    // استخراج شماره صفحات یکتا از دیتابیس (به جز صفحه 1 اگر فایل ندارد)
    const result = db.exec("SELECT DISTINCT page_number FROM pages ORDER BY page_number");
    if (result.length > 0) {
        const pages = result[0].values;
        const select = document.getElementById('page-select');
        // فیلتر صفحاتی که احتمالاً فایل ورد دارند (صفحات 2 تا 611)
        // توجه: صفحه 1 ممکن است فایل نداشته باشد، در صورت نیاز می‌توانید شرط را تغییر دهید
        const filteredPages = pages.filter(p => p[0] >= 2 && p[0] <= 611);
        select.innerHTML = filteredPages.map(p => `<option value="${p[0]}">صفحه ${p[0]}</option>`).join('');
    }
}

async function loadPage(pageNumber) {
    const pageElement = document.getElementById('mushaf-page');
    pageElement.innerHTML = '<div class="loading">در حال بارگذاری صفحه...</div>';
    
    try {
        // دریافت اطلاعات خطوط صفحه از دیتابیس
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

        const lines = linesResult[0].values; // هر آیتم: [line_number, line_type, is_centered]

        // دانلود فایل Word مربوط به صفحه
        // نام فایل: pages/[pageNumber].docx  (توجه: صفحه 1 معادل فایل 1.docx نیست، اما طبق گفته شما صفحات از 2 تا 611 هستند و فایل‌ها از 1 تا 610)
        // پس برای صفحه شماره p، نام فایل pages/(p-1).docx  است (برای p>=2)
        let fileNumber = pageNumber - 1;
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

        // استخراج متن از فایل docx با mammoth
        const mammothResult = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
        const fullText = mammothResult.value; // متن کامل با پاراگراف‌های جدا شده با کاراکتر newline

        // تقسیم متن به خطوط (با فرض اینکه هر خط یک پاراگراف در Word است)
        let wordLines = fullText.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        // بررسی تطابق تعداد خطوط
        if (wordLines.length !== lines.length) {
            console.warn(`تعداد خطوط در فایل Word (${wordLines.length}) با دیتابیس (${lines.length}) مطابقت ندارد.`);
            // در صورت عدم تطابق، سعی می‌کنیم از تعداد کمینه استفاده کنیم
            const minLines = Math.min(wordLines.length, lines.length);
            wordLines = wordLines.slice(0, minLines);
        }

        // ساخت HTML صفحه
        let html = '';
        for (let i = 0; i < lines.length; i++) {
            const [lineNum, lineType, isCentered] = lines[i];
            const lineText = wordLines[i] || ''; // اگر خطی نبود، خالی
            
            let lineClass = 'line';
            if (lineType === 'surah_name') lineClass += ' surah-name';
            else if (lineType === 'basmallah') lineClass += ' basmallah';
            else if (lineType === 'ayah') lineClass += ' ayah';
            
            const alignStyle = isCentered ? 'text-align: center;' : 'text-align: justify;';
            html += `<div class="${lineClass}" style="${alignStyle}">${lineText}</div>`;
        }
        
        pageElement.innerHTML = html;
        
    } catch (error) {
        pageElement.innerHTML = `<div class="error">خطا در بارگذاری صفحه: ${error.message}</div>`;
    }
}
