// ─────────────────────────────────────────────
// 버전만 올리면 자동으로 캐시 교체 + 업데이트
// ─────────────────────────────────────────────
var VERSION = 'v1.0.0';
var CACHE   = 'table-' + VERSION;

// 캐시할 파일 목록
var ASSETS = [
  './',
  './index.html'
];

// ── 설치: 새 버전 캐시 빌드 ──────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      // 대기 없이 즉시 activate 단계로 이동
      return self.skipWaiting();
    })
  );
});

// ── 활성화: 이전 버전 캐시 전부 삭제 ─────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      // 열려있는 모든 탭에 즉시 적용
      return self.clients.claim();
    })
  );
});

// ── fetch: 캐시 우선, 없으면 네트워크 ────────
self.addEventListener('fetch', function(e) {
  // POST 등 non-GET은 그냥 통과
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        // 유효한 응답만 캐시에 저장
        if (res && res.status === 200 && res.type === 'basic') {
          var clone = res.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return res;
      });
    })
  );
});

// ── 메시지: 페이지에서 SKIP_WAITING 요청 처리 ─
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
