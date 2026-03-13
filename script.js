let pagesData = null;

// بارگذاری فایل JSON
async function loadPagesData() {
    try {
        const response = await fetch('pages.json');
        if (!response.ok) throw new Error('فایل pages.json یافت نشد');
        pagesData = await response.json();
        
        // پر کردن منوی انتخاب صفحه
        populatePageSelect();
        
        // بارگذاری اولین صفحه (صفحه 2)
        const select = document.getElementById('page-select');
        if (select.options.length > 0) {
            loadPage(select.value);
        } else {
            document.getElementById('mushaf-page').innerHTML = '<div class="error">هیچ صفحه‌ای یافت نشد</div>';
        }
    } catch (error) {
        console.error(error);
        document.getElementById('mushaf-page').innerHTML = '<div class="error">خطا در بارگذاری داده‌ها</div>';
    }
}

window.onload = () => {
    loadPagesData();
};

function populatePageSelect() {
    const select = document.getElementById('page-select');
    // گرفتن شماره صفحات و مرتب‌سازی
    const pageNumbers = Object.keys(pagesData).map(Number).sort((a, b) => a - b);
    select.innerHTML = pageNumbers.map(p => `<option value="${p}">صفحه ${p}</option>`).join('');
}

function loadPage(pageNumber) {
    const page = pagesData[pageNumber];
    if (!page) {
        document.getElementById('mushaf-page').innerHTML = '<div class="error">صفحه یافت نشد</div>';
        return;
    }

    let html = '';
    page.lines.forEach(line => {
        // تعیین کلاس بر اساس نوع خط
        let lineClass = 'line';
        if (line.line_type === 'surah_name') lineClass += ' surah-name';
        else if (line.line_type === 'basmallah') lineClass += ' basmallah';
        else if (line.line_type === 'ayah') lineClass += ' ayah';

        // تعیین چیدمان (وسط‌چین یا هم‌تراز)
        const alignStyle = line.is_centered ? 'text-align: center;' : 'text-align: justify;';
        
        // اضافه کردن خط به HTML
        html += `<div class="${lineClass}" style="${alignStyle}">${line.text}</div>`;
    });

    document.getElementById('mushaf-page').innerHTML = html;
}
