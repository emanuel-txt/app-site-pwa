// captura global do evento antes de qualquer DOMContentLoaded para não perder o evento
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] beforeinstallprompt capturado');
  e.preventDefault();
  deferredPrompt = e;
  // torna visíveis os botões via classe CSS
  document.body.classList.add('show-install');
  document.querySelectorAll('.install-button').forEach(b => b.setAttribute('aria-hidden','false'));
});

window.addEventListener('appinstalled', () => {
  console.log('[PWA] appinstalled');
  deferredPrompt = null;
  document.body.classList.remove('show-install');
});

document.addEventListener('DOMContentLoaded', () => {
  const planosGrid = document.getElementById('planos-grid');
  const anoSpan = document.getElementById('ano');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const planoInput = document.getElementById('plano-input');
  const signupForm = document.getElementById('signup-form');
  const signupSuccess = document.getElementById('signup-success');
  const contactForm = document.getElementById('contact-form');
  const btnInstalar = document.getElementById('btn-instalar');
  const btnInstalarBottom = document.getElementById('btn-instalar-bottom');

  anoSpan.textContent = new Date().getFullYear();

  // checagem rápida do manifest e ícones para diagnóstico
  async function checkManifestAssets() {
    try {
      const res = await fetch('/manifest.json', {cache: 'no-store'});
      if (!res.ok) {
        console.warn('[PWA] manifest.json não disponível (status ' + res.status + ')');
        return;
      }
      const manifest = await res.json();
      if (!manifest.icons || manifest.icons.length === 0) {
        console.warn('[PWA] manifest.json não contém icons. Isso pode impedir o prompt de instalação.');
      } else {
        // verifica os ícones referenciados
        await Promise.all(manifest.icons.map(async icon => {
          try {
            const r = await fetch(icon.src, {method: 'HEAD'});
            if (!r.ok) console.warn(`[PWA] ícone ${icon.src} retornou ${r.status}`);
          } catch (err) {
            console.warn(`[PWA] falha ao buscar ícone ${icon.src}:`, err);
          }
        }));
      }
    } catch (err) {
      console.warn('[PWA] erro ao buscar manifest.json:', err);
    }
  }
  checkManifestAssets();

  // Carrega planos
  fetch('/plans.json').then(r => r.json()).then(data => {
    data.plans.forEach(plan => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div>
          <h4>${plan.name}</h4>
          <div class="price">${plan.price}</div>
          <div class="muted">${plan.speed}</div>
          <ul class="features">
            ${plan.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        <div style="margin-top:0.75rem">
          <button class="btn contratar" data-plan="${plan.name}">Contratar</button>
        </div>
      `;
      planosGrid.appendChild(card);
    });

    // liga eventos de contratar
    document.querySelectorAll('.contratar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const planName = e.currentTarget.dataset.plan;
        planoInput.value = planName;
        openModal();
      });
    });
  }).catch(()=> {
    planosGrid.innerHTML = '<p>Erro ao carregar planos. Atualize a página.</p>';
  });

  function openModal(){
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    signupForm.reset();
    signupSuccess.classList.add('hidden');
  }
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
  });

  // submissão: gera mailto e salva no localStorage (simulação)
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(signupForm).entries());
    // salva local
    const saves = JSON.parse(localStorage.getItem('solicitacoes') || '[]');
    saves.push({...data, date: new Date().toISOString()});
    localStorage.setItem('solicitacoes', JSON.stringify(saves));
    // abre cliente de email com template
    const subject = encodeURIComponent(`Solicitação de Contratação - ${data.plano}`);
    const body = encodeURIComponent(`Nome: ${data.nome}\nTelefone: ${data.telefone}\nEndereço: ${data.endereco}\nEmail: ${data.email}\nPlano: ${data.plano}`);
    window.location.href = `mailto:contato@provedor.local?subject=${subject}&body=${body}`;
    signupSuccess.classList.remove('hidden');
  });

  // formulário de contato simples
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(contactForm).entries());
    const contato = JSON.parse(localStorage.getItem('contatos') || '[]');
    contato.push({...data, date:new Date().toISOString()});
    localStorage.setItem('contatos', JSON.stringify(contato));
    alert('Mensagem enviada! Responderemos por email.');
    contactForm.reset();
  });

  // Service Worker registration
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').catch(()=>{/*fail silently*/});
  }

  // Função reutilizável que usa a variável global deferredPrompt
  async function promptInstall() {
    if (!deferredPrompt) {
      console.warn('[PWA] deferredPrompt é null — verifique manifest/icons, HTTPS ou localhost');
      alert('Instalação indisponível no momento. Verifique se está em localhost ou HTTPS e se o navegador suporta PWA.');
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log('[PWA] userChoice:', choice);
    deferredPrompt = null;
    document.body.classList.remove('show-install');
    document.querySelectorAll('.install-button').forEach(b => b.setAttribute('aria-hidden','true'));
  }

  if (btnInstalar) btnInstalar.addEventListener('click', promptInstall);
  if (btnInstalarBottom) btnInstalarBottom.addEventListener('click', promptInstall);
});