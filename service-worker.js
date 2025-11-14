const CACHE_NAME = 'conecta-cache-v1';
const ASSETS = [
	'/',
	'/index.html',
	'/styles.css',
	'/app.js',
	'/manifest.json',
	'/icons/icon-192.png',
	'/icons/icon-512.png'
];

self.addEventListener('install', event => {
	self.skipWaiting();
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(keys => Promise.all(
			keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
		))
	);
});

self.addEventListener('fetch', event => {
	const req = event.request;
	event.respondWith(
		caches.match(req).then(cached => {
			if(cached) return cached;
			return fetch(req).then(networkRes => {
				// opcional: cachear novos GET responses
				if(req.method === 'GET' && networkRes && networkRes.status === 200){
					const resClone = networkRes.clone();
					caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
				}
				return networkRes;
			}).catch(()=> caches.match('/'));
		})
	);
});
