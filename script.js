let pagesData = null;
let currentStartPage = 2; // صفحه شروع (دو صفحه ۲ و ۳)

// بارگذاری فایل JSON
async function loadPagesData() {
    const response = await fetch('pages.json');
    pagesData = await response.json();
    showPages(currentStartPage);
}

window.onload = () => {
    loadPagesData().catch(error => {
        console.error(error);
        document.getElementById('right-content').innerHTML = '<div style="color:red">خطا در بارگذاری</div>';
    });
};

// نمایش دو صفحه
function showPages(startPage) {
    if (!pagesData) return;

    const rightPage = startPage; // صفحه سمت راست (فرد)
    const leftPage = startPage + 1; // صفحه سمت چپ (زوج)

    // بروزرسانی اندیکاتور
    document.getElementById('page-indicator').textContent = `صفحات ${rightPage} و ${leftPage}`;

    // نمایش صفحه راست
    if (pagesData[rightPage]) {
        renderPage(rightPage, 'right-content');
    } else {
        document.getElementById('right-content').innerHTML = '<div class="line">صفحه موجود نیست</div>';
    }

    // نمایش صفحه چپ
    if (pagesData[leftPage]) {
        renderPage(leftPage, 'left-content');
    } else {
        document.getElementById('left-content').innerHTML = '<div class="line">صفحه موجود نیست</div>';
    }
}

// رندر یک صفحه
function renderPage(pageNumber, containerId) {
    const page = pagesData[pageNumber];
    const container = document.getElementById(containerId);
    
    let html = '';
    page.lines.forEach(line => {
        let lineClass = 'line';
        
        if (line.line_type === 'surah_name') {
            lineClass += ' surah-name';
        } else if (line.line_type === 'basmallah') {
            lineClass += ' basmallah';
        } else if (line.line_type === 'ayah') {
            lineClass += ' ayah';
        }
        
        // اگر is_centered=true باشد، کلاس center اضافه می‌شود
        if (line.is_centered) {
            lineClass += ' center';
        }
        
        html += `<div class="${lineClass}">${line.text}</div>`;
    });
    
    container.innerHTML = html;
}

// صفحه بعد (دو صفحه جلو)
function nextPages() {
    const maxPage = Math.max(...Object.keys(pagesData).map(Number));
    if (currentStartPage + 1 < maxPage) {
        currentStartPage += 2;
        showPages(currentStartPage);
    }
}

// صفحه قبل (دو صفحه عقب)
function prevPages() {
    if (currentStartPage - 2 >= 2) {
        currentStartPage -= 2;
        showPages(currentStartPage);
    }
}
