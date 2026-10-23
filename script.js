/* =========================================================
   Abel Conecta — lógica da aplicação
   Sem dependências. Organizado em módulos simples:
   roteamento, tema, instalação, abas de horário e offline.
   ========================================================= */

(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const THEME_KEY = 'abel-conecta-theme';
  const ROUTES = {
    inicio: { documentTitle: 'Abel Conecta | Escola Estadual Professor Abel Freire Coelho' },
    avisos: { documentTitle: 'Avisos · Abel Conecta' },
    horarios: { documentTitle: 'Horários · Abel Conecta' },
    sobre: { documentTitle: 'Sobre · Abel Conecta' }
  };
  const DEFAULT_ROUTE = 'inicio';

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        /* Armazenamento indisponível: o app continua funcionando sem persistir. */
      }
    }
  };

  /* ---------------------------------------------------------
     Toasts acessíveis
     --------------------------------------------------------- */
  const toastRegion = $('#toast-region');

  function showToast(message, options = {}) {
    if (!toastRegion) return;

    const { actionLabel, onAction, duration = 4800 } = options;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');

    const text = document.createElement('span');
    text.className = 'toast__message';
    text.textContent = message;
    toast.append(text);

    let timer;

    const hide = () => {
      window.clearTimeout(timer);
      toast.classList.remove('is-visible');
      window.setTimeout(() => toast.remove(), 320);
    };

    if (actionLabel && typeof onAction === 'function') {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'toast__action';
      action.textContent = actionLabel;
      action.addEventListener('click', () => {
        hide();
        onAction();
      });
      toast.append(action);
    }

    toastRegion.append(toast);
    timer = window.setTimeout(hide, duration);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => toast.classList.add('is-visible'));
    });
  }

  /* ---------------------------------------------------------
     Roteamento por hash (#/inicio, #/avisos, ...)
     Funciona em subdiretórios do GitHub Pages.
     --------------------------------------------------------- */
  const views = $$('[data-view]');
  const routeLinks = $$('[data-route]');
  let initialRender = true;

  function parseRoute(hash = window.location.hash) {
    const name = hash.replace(/^#\/?/, '').replace(/\/+$/, '').split('?')[0];
    return Object.prototype.hasOwnProperty.call(ROUTES, name) ? name : DEFAULT_ROUTE;
  }

  function renderRoute(route, options = {}) {
    const { focusHeading = false } = options;

    if (!Object.prototype.hasOwnProperty.call(ROUTES, route)) {
      route = DEFAULT_ROUTE;
    }

    views.forEach((view) => {
      const isActive = view.dataset.view === route;
      view.hidden = !isActive;
      view.classList.toggle('is-active', isActive);
    });

    routeLinks.forEach((link) => {
      if (link.dataset.route === route) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    document.title = ROUTES[route].documentTitle;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (!focusHeading) return;

    const activeView = document.getElementById(`view-${route}`);
    const heading = activeView ? $('h1', activeView) : null;
    if (!heading) return;

    // Garante que o título receba foco mesmo se o autor remover o tabindex.
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  function syncRouteFromHash(options = {}) {
    const rawHash = window.location.hash;
    const route = parseRoute(rawHash);

    if (rawHash !== `#/${route}`) {
      try {
        window.history.replaceState(null, '', `#/${route}`);
      } catch (error) {
        /* Ambientes que bloqueiam replaceState (ex.: file://) continuam funcionando. */
      }
    }

    renderRoute(route, options);
  }

  // "#conteudo" pertence ao link "Pular para o conteúdo": não é uma rota.
  window.addEventListener('hashchange', (event) => {
    if (window.location.hash === '#conteudo') return;

    const route = parseRoute();
    if (event.oldURL && window.location.hash === new URL(event.oldURL).hash) return;

    syncRouteFromHash({ focusHeading: !initialRender });
  });

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // Define a rota inicial sem criar uma entrada extra no histórico.
  if (!window.location.hash || window.location.hash === '#') {
    try {
      window.history.replaceState(null, '', `#/${DEFAULT_ROUTE}`);
    } catch (error) {
      /* ignore */
    }
  }
  syncRouteFromHash({ focusHeading: false });
  initialRender = false;

  /* ---------------------------------------------------------
     Tema claro / escuro
     --------------------------------------------------------- */
  const themeToggle = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  const systemDarkQuery = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  function applyTheme(theme, persist = false) {
    const safeTheme = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = safeTheme;

    if (themeToggle) {
      const isDark = safeTheme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(isDark));
      themeToggle.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
      themeToggle.title = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';
    }

    if (themeMeta) {
      themeMeta.setAttribute('content', safeTheme === 'dark' ? '#071521' : '#0d3b66');
    }

    if (persist) storage.set(THEME_KEY, safeTheme);
  }

  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  }

  if (systemDarkQuery) {
    const handleSystemThemeChange = (event) => {
      if (!storage.get(THEME_KEY)) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    };

    if (typeof systemDarkQuery.addEventListener === 'function') {
      systemDarkQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof systemDarkQuery.addListener === 'function') {
      systemDarkQuery.addListener(handleSystemThemeChange);
    }
  }

  /* ---------------------------------------------------------
     Abas de horários
     --------------------------------------------------------- */
  const dayTabs = $$('.day-tab');
  const schedulePanels = $$('.schedule-panel');

  function activateDayTab(tab, moveFocus = true) {
    if (!tab) return;

    dayTabs.forEach((item) => {
      const isSelected = item === tab;
      item.setAttribute('aria-selected', String(isSelected));
      item.tabIndex = isSelected ? 0 : -1;
    });

    const panelId = tab.getAttribute('aria-controls');
    schedulePanels.forEach((panel) => {
      const isSelected = panel.id === panelId;
      panel.hidden = !isSelected;
      panel.classList.remove('is-entering');
      if (isSelected) {
        // Reinicia a animação de entrada ao trocar de dia.
        void panel.offsetWidth;
        panel.classList.add('is-entering');
      }
    });

    if (moveFocus) tab.focus();
  }

  dayTabs.forEach((tab) => {
    tab.addEventListener('click', () => activateDayTab(tab, false));

    tab.addEventListener('keydown', (event) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;

      event.preventDefault();
      const currentIndex = dayTabs.indexOf(tab);
      let nextIndex;

      if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = dayTabs.length - 1;
      } else {
        const step = event.key === 'ArrowRight' ? 1 : -1;
        nextIndex = (currentIndex + step + dayTabs.length) % dayTabs.length;
      }

      activateDayTab(dayTabs[nextIndex]);
    });
  });

  /* ---------------------------------------------------------
     Indicador de conexão
     --------------------------------------------------------- */
  const connectionStatus = $('#connection-status');

  function updateConnectionStatus(announce = false) {
    const isOnline = navigator.onLine;

    if (connectionStatus) connectionStatus.hidden = isOnline;

    if (announce) {
      showToast(
        isOnline
          ? 'Conexão restabelecida. O conteúdo será atualizado quando possível.'
          : 'Você está offline. Os conteúdos salvos continuam disponíveis.'
      );
    }
  }

  window.addEventListener('online', () => updateConnectionStatus(true));
  window.addEventListener('offline', () => updateConnectionStatus(true));
  updateConnectionStatus(false);

  /* ---------------------------------------------------------
     Instalação do PWA
     --------------------------------------------------------- */
  const installButton = $('#install-button');
  const installDialog = $('#install-dialog');
  const dialogInstallButton = $('#dialog-install');
  const closeDialogButtons = $$('[data-close-dialog]');
  let deferredPrompt = null;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  function updateInstallUI() {
    if (!installButton) return;

    if (isStandalone()) {
      installButton.hidden = true;
      return;
    }

    installButton.hidden = false;
    installButton.classList.toggle('is-ready', Boolean(deferredPrompt));
    if (dialogInstallButton) dialogInstallButton.hidden = !deferredPrompt;
  }

  function openInstallDialog() {
    if (!installDialog) return;

    if (typeof installDialog.showModal === 'function') {
      installDialog.showModal();
    } else {
      installDialog.setAttribute('open', '');
    }
  }

  function closeInstallDialog() {
    if (!installDialog) return;

    if (typeof installDialog.close === 'function' && installDialog.open) {
      installDialog.close();
    } else {
      installDialog.removeAttribute('open');
    }
  }

  async function promptInstall() {
    if (!deferredPrompt) {
      openInstallDialog();
      return;
    }

    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    updateInstallUI();

    try {
      const result = await promptEvent.prompt();
      const outcome = result ? result.outcome : 'dismissed';

      if (outcome === 'accepted') {
        closeInstallDialog();
      } else {
        showToast('Instalação cancelada. Você pode tentar novamente quando quiser.');
      }
    } catch (error) {
      showToast('Não foi possível iniciar a instalação neste navegador.');
    }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    updateInstallUI();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (dialogInstallButton) dialogInstallButton.hidden = true;
    if (installButton) installButton.hidden = true;
    closeInstallDialog();
    showToast('Abel Conecta instalado com sucesso!');
  });

  if (installButton) {
    installButton.addEventListener('click', () => {
      if (isStandalone()) {
        showToast('O Abel Conecta já está instalado neste dispositivo.');
        return;
      }

      if (deferredPrompt) {
        promptInstall();
      } else {
        openInstallDialog();
      }
    });
  }

  if (dialogInstallButton) {
    dialogInstallButton.addEventListener('click', promptInstall);
  }

  closeDialogButtons.forEach((button) => {
    button.addEventListener('click', closeInstallDialog);
  });

  if (installDialog) {
    installDialog.addEventListener('click', (event) => {
      if (event.target === installDialog) closeInstallDialog();
    });
  }

  updateInstallUI();

  /* ---------------------------------------------------------
     Service worker + atualizações
     --------------------------------------------------------- */
  let updateToastShown = false;
  let refreshRequested = false;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshRequested) window.location.reload();
    });

    window.addEventListener('load', () => {
      if (!window.isSecureContext) {
        console.info(
          'Abel Conecta: o service worker exige HTTPS ou localhost. A instalação e o modo offline ficam desativados neste ambiente.'
        );
        return;
      }

      navigator.serviceWorker
        .register('./service-worker.js', { scope: './' })
        .then((registration) => {
          const offerUpdate = (worker) => {
            if (!worker || updateToastShown) return;

            updateToastShown = true;
            showToast('Nova versão do Abel Conecta disponível.', {
              actionLabel: 'Atualizar',
              duration: 12000,
              onAction: () => {
                refreshRequested = true;
                worker.postMessage({ type: 'SKIP_WAITING' });
                window.setTimeout(() => window.location.reload(), 1200);
              }
            });
          };

          if (registration.waiting && navigator.serviceWorker.controller) {
            offerUpdate(registration.waiting);
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                offerUpdate(newWorker);
              }
            });
          });

          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) registration.update().catch(() => {});
          });
        })
        .catch((error) => {
          console.warn('Abel Conecta: não foi possível registrar o service worker.', error);
        });
    });
  }
})();
