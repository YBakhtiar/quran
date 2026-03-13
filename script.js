let pagesData = null;
let currentStartPage = 2; // اولین صفحه اندوپاک

async function loadPagesData() {
    const response = await fetch('quran-combined.json');
    pagesData = await response.json();
    showPages(currentStartPage);
}

window.onload = () => {
    loadPagesData().catch(error => {
        console.error(error);
        document.getElementById('right-content').innerHTML = '<div style="color:red">خطا در بارگذاری</div>';
    });
};

function showPages(startPage) {
    if (!pagesData) return;

    const rightPage = startPage;
    const leftPage = startPage + 1;

    document.getElementById('page-indicator').textContent = `صفحات ${rightPage} و ${leftPage}`;

    renderPage(rightPage, 'right-content');
    renderPage(leftPage, 'left-content');
}

function renderPage(pageNumber, containerId) {
    const page = pagesData[pageNumber];
    const container = document.getElementById(containerId);
    
    if (!page) {
        container.innerHTML = '<div class="line">صفحه موجود نیست</div>';
        return;
    }

    let html = '';
    page.lines.forEach(line => {
        let lineClass = 'line';
        if (line.line_type === 'surah_name') lineClass += ' surah-name';
        else if (line.line_type === 'basmallah') lineClass += ' basmallah';
        else if (line.line_type === 'ayah') lineClass += ' ayah';
        if (line.is_centered) lineClass += ' center';

        if (line.line_type === 'ayah' && line.words) {
            // ساخت خط با کلمات جداگانه
            let lineHtml = '';
            line.words.forEach(word => {
                const pageStr = word.page.toString().padStart(3, '0');
                lineHtml += `<span style="font-family: 'MadaniPage${pageStr}';">${word.text}</span> `;
            });
            html += `<div class="${lineClass}">${lineHtml.trim()}</div>`;
        } else {
            html += `<div class="${lineClass}">${line.text || ''}</div>`;
        }
    });

    container.innerHTML = html;
}

function nextPages() {
    const maxPage = Math.max(...Object.keys(pagesData).map(Number));
    if (currentStartPage + 1 < maxPage) {
        currentStartPage += 2;
        showPages(currentStartPage);
    }
}

function prevPages() {
    if (currentStartPage - 2 >= 2) {
        currentStartPage -= 2;
        showPages(currentStartPage);
    }
}
