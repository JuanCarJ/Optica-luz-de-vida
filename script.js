(() => {
  'use strict';
  const WA = { Marinilla: '573127921643', Granada: '573104042085', Urrao: '573116104538' };
  const byId = (id) => document.getElementById(id);
  const qs = (selector, root = document) => root?.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root?.querySelectorAll(selector) || []);
  const whatsappUrl = (location, message = '') => {
    const number = WA[location] || WA.Marinilla;
    return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  };
  const scrollToBooking = () => byId('cita')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

  // Solicitud de cita: valida localmente y prepara un enlace, sin enviar ni guardar PII.
  const form = byId('booking-form');
  const result = qs('.form-result', form);
  if (form && result) form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const location = String(data.get('location') || 'Marinilla').trim();
    const service = String(data.get('service') || 'Examen visual').trim();
    const phone = String(data.get('phone') || '').trim();
    const consent = qs('input[type="checkbox"]', form);
    const digits = phone.replace(/\D/g, '');
    const nameOk = name.length >= 2 && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(name);
    const phoneOk = digits.length >= 7 && digits.length <= 15;
    qsa('.field-error', form).forEach((node) => { node.hidden = true; node.textContent = ''; });
    qsa('input, select', form).forEach((field) => field.removeAttribute('aria-invalid'));
    const showError = (field, message) => {
      if (!field) return;
      field.setAttribute('aria-invalid', 'true');
      const errorId = field.id ? `${field.id}-error` : '';
      const note = (errorId && byId(errorId)) || document.createElement('small');
      note.className = 'field-error';
      note.hidden = false;
      note.textContent = message;
      if (!note.id) { note.id = `${field.name || 'field'}-error`; field.closest('label')?.append(note); }
      field.setAttribute('aria-describedby', note.id);
    };
    if (!nameOk) showError(qs('[name="name"]', form), 'Escribe tu nombre completo.');
    if (!phoneOk) showError(qs('[name="phone"]', form), 'Revisa tu número de celular.');
    if (consent && !consent.checked) showError(consent, 'Necesitamos tu autorización para gestionar la solicitud.');
    if (!nameOk || !phoneOk || (consent && !consent.checked)) {
      result.textContent = 'Revisa los campos marcados para continuar.';
      result.classList.add('has-error');
      (qs('[aria-invalid="true"]', form) || qs('[name="name"]', form))?.focus();
      return;
    }
    const message = `Hola, soy ${name}. Quisiera solicitar disponibilidad para ${service} en la sede ${location}. Mi celular es ${phone}.`;
    const link = document.createElement('a');
    link.href = whatsappUrl(location, message); link.target = '_blank'; link.rel = 'noreferrer';
    link.className = 'form-result-link'; link.textContent = `Continuar por WhatsApp de ${location} ↗`;
    result.classList.remove('has-error'); result.replaceChildren();
    const summary = document.createElement('span');
    summary.textContent = `Solicitud preparada para ${location}: ${service}. `;
    result.append(summary, link);
  });

  // Menú móvil.
  const nav = qs('.site-header nav');
  const navToggle = qs('.nav-toggle');
  let lastNavTrigger = navToggle;
  const setMenu = (open) => {
    if (!nav || !navToggle) return;
    lastNavTrigger = navToggle;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    navToggle.classList.toggle('is-open', open);
    nav.setAttribute('aria-hidden', String(!open));
    if (open) nav.querySelector('a')?.focus();
    else if (document.activeElement && nav.contains(document.activeElement)) lastNavTrigger?.focus();
  };
  if (nav && navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    qsa('a[href^="#"]', nav).forEach((anchor) => anchor.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
    document.addEventListener('click', (event) => { if (nav.classList.contains('is-open') && !nav.contains(event.target) && !navToggle.contains(event.target)) setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); }, { passive: true });
    nav.setAttribute('aria-hidden', 'true');
  }

  // Filtros de monturas con estado accesible.
  const pills = qsa('.pill[data-filter]');
  const frameCards = qsa('.frame-card[data-type]');
  const applyFilter = (filter) => {
    pills.forEach((pill) => {
      const active = pill.dataset.filter === filter;
      pill.classList.toggle('active', active); pill.setAttribute('aria-pressed', String(active));
    });
    frameCards.forEach((card) => {
      const visible = filter === 'all' || card.dataset.type === filter;
      card.hidden = !visible; card.setAttribute('aria-hidden', String(!visible));
    });
  };
  if (pills.length) {
    pills.forEach((pill) => pill.addEventListener('click', () => applyFilter(pill.dataset.filter || 'all')));
    applyFilter(pills.find((pill) => pill.classList.contains('active'))?.dataset.filter || 'all');
  }

  // Detalle de montura en dialog reutilizando la imagen existente.
  const dialog = byId('frame-dialog');
  const dialogImage = qs('.frame-dialog-image', dialog);
  const dialogTitle = qs('.frame-dialog-title', dialog);
  const dialogCopy = qs('.frame-dialog-copy', dialog);
  const dialogCta = qs('.frame-dialog-cta', dialog);
  const dialogClose = byId('frame-dialog-close');
  let lastFrameTrigger = null;
  const closeFrameDialog = () => {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    dialog.classList.remove('is-open'); lastFrameTrigger?.focus();
  };
  const openFrameDialog = (trigger) => {
    if (!dialog) return;
    lastFrameTrigger = trigger;
    const key = trigger.dataset.frame || '';
    let card = trigger.closest('.frame-card');
    if (!card && key) card = qsa('.frame-card').find((node) => node.dataset.frame === key || node.id === key);
    const image = qs('img', card); const title = qs('h3', card); const copy = qs('.frame-meta p', card);
    if (dialogImage && image) { dialogImage.src = image.currentSrc || image.src; dialogImage.alt = image.alt || ''; }
    if (dialogTitle) dialogTitle.textContent = title?.textContent?.trim() || key || 'Montura';
    if (dialogCopy) dialogCopy.textContent = copy?.textContent?.trim() || 'Conoce esta opción en tienda con la orientación de nuestro equipo.';
    if (dialogCta) {
      dialogCta.href = '#cita';
      dialogCta.onclick = () => {
        const service = qs('[name="service"]', form);
        if (service) service.value = 'Monturas y lentes';
        closeFrameDialog(); setTimeout(scrollToBooking, 0);
      };
    }
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
    dialog.classList.add('is-open'); (dialogClose || dialog).focus?.();
  };
  qsa('.frame-explore[data-frame]').forEach((trigger) => trigger.addEventListener('click', () => openFrameDialog(trigger)));
  dialogClose?.addEventListener('click', closeFrameDialog);
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) closeFrameDialog(); });
  dialog?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); closeFrameDialog(); return; }
    if (event.key !== 'Tab') return;
    const focusable = qsa('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])', dialog).filter((el) => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // Revelado progresivo con fallback visible y respeto por reduced motion.
  const revealTargets = qsa('.reveal, .section-heading, .service-card, .frame-card, .story-image, .story-copy, .location-card, .team-card, .booking');
  revealTargets.forEach((element) => element.classList.add('reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((element, index) => { element.style.setProperty('--reveal-index', String(index % 6)); observer.observe(element); });
  } else revealTargets.forEach((element) => element.classList.add('is-visible'));

})();

