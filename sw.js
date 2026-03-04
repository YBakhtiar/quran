const APP_CACHE_NAME = 'quran-app-v2';
const IMAGE_CACHE_NAME = 'quran-cache-v1';

// فایل‌هایی که برای اجرای اولیه و آفلاین پوسته برنامه نیاز هستند
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
  // اگر فایل آیکون (مثل icon-192.png) داری، مسیر آن را هم اینجا اضافه کن
];

// مرحله نصب (Install): کش کردن فایل‌های اصلی برنامه (App Shell)
self.addEventListener('install', event => {
  self.skipWaiting(); // فوراً سرویس ورکر جدید را جایگزین نسخه قبلی می‌کند
  event.waitUntil(
    caches.open(APP_CACHE_NAME)
      .then(cache => {
        console.log('App shell cached');
        return cache.addAll(urlsToCache);
      })
  );
});

// مرحله فعال‌سازی (Activate): پاک کردن کش‌های قدیمیِ برنامه (به جز تصاویر!)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // فقط کش‌های قدیمی مربوط به برنامه را پاک می‌کنیم
          // دقت کن که کش تصاویر (quran-cache-v1) حفظ می‌شود
          if (cacheName.startsWith('quran-app-') && cacheName !== APP_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// مرحله درخواست (Fetch): استراتژی مدیریت آفلاین/آنلاین
self.addEventListener('fetch', event => {
  
  // ۱. اگر درخواست مربوط به تصاویر قرآن بود:
  if (event.request.url.includes('images/Quran')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // اگر تصویر در کش وجود داشت همان را نشان بده، در غیر این صورت از اینترنت دانلود کن
          return cachedResponse || fetch(event.request);
        })
    );
  } 
  
  // ۲. اگر درخواست مربوط به فایل‌های اصلی (مثل index.html) بود:
  else {
    event.respondWith(
      // استراتژی Network-First: اول تلاش می‌کند نسخه جدید را از اینترنت بگیرد
      fetch(event.request)
        .then(networkResponse => {
          // اگر موفق شد فایل جدید را بگیرد، آن را در کش هم آپدیت می‌کند
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(APP_CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // اگر اینترنت قطع بود (آفلاین)، نسخه ذخیره‌شده در کش را نشان می‌دهد
          return caches.match(event.request);
        })
    );
  }
});
