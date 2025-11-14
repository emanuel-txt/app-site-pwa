(function(){
	const installBtn = document.getElementById('installBtn');
	let deferredPrompt = null;

	// atualizar ano
	document.getElementById('ano').textContent = new Date().getFullYear();

	// Service Worker registration
	if('serviceWorker' in navigator){
		navigator.serviceWorker.register('/service-worker.js').then(()=> {
			console.log('Service Worker registrado');
		}).catch(err => console.warn('SW falhou', err));
	}

	// beforeinstallprompt
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		deferredPrompt = e;
		installBtn.classList.add('show');
		installBtn.setAttribute('aria-hidden','false');
	});

	installBtn.addEventListener('click', async () => {
		if(!deferredPrompt) return;
		deferredPrompt.prompt();
		const choice = await deferredPrompt.userChoice;
		if(choice.outcome === 'accepted'){
			console.log('Usuário aceitou a instalação');
		} else {
			console.log('Usuário recusou a instalação');
		}
		deferredPrompt = null;
		installBtn.classList.remove('show');
		installBtn.setAttribute('aria-hidden','true');
	});

	// Hide install button if already standalone
	if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone){
		installBtn.style.display = 'none';
	}
})();