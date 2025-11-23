/**
 * サービスワーカー
 * PWAのオフライン機能とキャッシュ管理を提供
 * 作成理由: アプリをオフラインで動作可能にし、高速な読み込みを実現するため
 */

// キャッシュ名（バージョン管理用）
const CACHE_NAME = 'tilt-game-v1';

// キャッシュするファイルのリスト
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './manifest.json'
];

/**
 * インストールイベント
 * サービスワーカーがインストールされる時に実行
 * 機能: 必要なファイルをキャッシュに保存
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] インストール中');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] ファイルをキャッシュ中');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

/**
 * アクティベートイベント
 * サービスワーカーがアクティブになる時に実行
 * 機能: 古いキャッシュを削除
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] アクティベート中');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] 古いキャッシュを削除:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

/**
 * フェッチイベント
 * ネットワークリクエストをインターセプト
 * 機能: キャッシュファーストの戦略でコンテンツを提供
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークからフェッチ
        return fetch(event.request);
      })
      .catch(() => {
        // オフライン時のフォールバック
        return caches.match('./index.html');
      })
  );
});
