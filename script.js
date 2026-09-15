(() => {
  'use strict';
  const WA = { Marinilla: '573127921643', Granada: '573104042085' };
  const HOURS = {
    Marinilla: 'Lun–Vie 7:30–19:00 · Sáb 9:00–16:00',
    Granada: 'Vie 13:00–17:30 · Sáb 9:00–13:00 y 14:00–18:00 · Dom 9:00–14:00 · Lun 9:00–13:30',
  };
  const byId = (id) => document.getElementById(id);
  const qs = (selector, root = document) => root?.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root?.querySelectorAll(selector) || []);
  const whatsappUrl = (location, message = '') => {
    const number = WA[location] || WA.Marinilla;
    return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  };
  const scrollToBooking = () => byId('cita')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
    qsa('.field-error', form).forEach((node) => node.remove());
    qsa('input, select', form).forEach((field) => field.removeAttribute('aria-invalid'));
    const showError = (field, message) => {
      if (!field) return;
      field.setAttribute('aria-invalid', 'true');
      const note = document.createElement('small');
      note.className = 'field-error';
      note.textContent = message;
      field.closest('label')?.append(note);
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
  const setMenu = (open) => {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  if (nav && navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    qsa('a[href^="#"]', nav).forEach((anchor) => anchor.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
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

  // Asistente guiado local: sedes, horarios, servicios y enlaces de cita.
  const chatbot = byId('chatbot'); const chatTrigger = byId('chatbot-trigger');
  const chatClose = byId('chat-close'); const chatBody = qs('.chat-body', chatbot);
  const chatInput = byId('chat-input'); const chatSend = byId('chat-send');
  let lastChatTrigger = null;
  const setChat = (open) => {
    if (!chatbot || !chatTrigger) return;
    chatbot.classList.toggle('open', open); chatbot.setAttribute('aria-hidden', String(!open));
    chatbot.setAttribute('role', 'dialog'); chatbot.setAttribute('aria-modal', 'false');
    chatTrigger.setAttribute('aria-expanded', String(open));
    if (open) { lastChatTrigger = chatTrigger; setTimeout(() => chatInput?.focus(), 0); } else lastChatTrigger?.focus();
  };
  const addBubble = (text, who = 'bot', action) => {
    if (!chatBody) return;
    const bubble = document.createElement('div'); bubble.className = `bubble ${who}`; bubble.textContent = text;
    if (action) {
      const link = document.createElement('a'); link.href = action.href; link.target = '_blank'; link.rel = 'noreferrer';
      link.className = 'chat-action'; link.textContent = action.label;
      bubble.append(document.createElement('br'), link);
    }
    chatBody.appendChild(bubble); chatBody.scrollTop = chatBody.scrollHeight;
  };
  const sendReply = (raw) => {
    const text = String(raw || '').trim(); if (!text || !chatBody) return;
    addBubble(text, 'user'); const lower = text.toLocaleLowerCase('es');
    const location = lower.includes('granada') ? 'Granada' : 'Marinilla';
    if (lower.includes('whatsapp')) addBubble(`Te conecto con el equipo de ${location}. Allí podrán responderte directamente.`, 'bot', { href: whatsappUrl(location), label: `Abrir WhatsApp ${location} ↗` });
    else if (lower.includes('horario') || lower.includes('hora') || lower.includes('sede')) addBubble(`${location} tiene atención física. Horario publicado: ${HOURS[location]}. También puedes escribirles para confirmar disponibilidad.`, 'bot', { href: '#sedes', label: 'Ver sedes y mapas ↗' });
    else if (lower.includes('servicio') || lower.includes('lente') || lower.includes('examen') || lower.includes('montura')) addBubble('Ofrecemos consulta de optometría, lentes oftálmicos, monturas y armazones, y adaptación de lentes de contacto.', 'bot', { href: '#servicios', label: 'Ver servicios ↗' });
    else if (lower.includes('agend') || lower.includes('cita')) addBubble('Puedes dejar una solicitud con tu nombre, sede y servicio. El equipo revisará disponibilidad y te responderá por nuestros canales de atención.', 'bot', { href: '#cita', label: 'Dejar solicitud ↗' });
    else addBubble('Puedo orientarte sobre sedes, horarios, servicios o una solicitud de cita. ¿Qué necesitas conocer?', 'bot');
  };
  chatTrigger?.addEventListener('click', () => setChat(!chatbot?.classList.contains('open')));
  chatClose?.addEventListener('click', () => setChat(false));
  qsa('.quick-replies [data-reply]').forEach((button) => button.addEventListener('click', () => sendReply(button.dataset.reply)));
  chatSend?.addEventListener('click', () => { if (chatInput?.value.trim()) { sendReply(chatInput.value); chatInput.value = ''; } });
  chatInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); chatSend?.click(); } });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && chatbot?.classList.contains('open')) setChat(false); });

  // Revelado progresivo con fallback visible y respeto por reduced motion.
  const revealTargets = qsa('.reveal, .section-heading, .service-card, .frame-card, .story-image, .story-copy, .location-card, .team-card, .booking');
  revealTargets.forEach((element) => element.classList.add('reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((element, index) => { element.style.setProperty('--reveal-index', String(index % 6)); observer.observe(element); });
  } else revealTargets.forEach((element) => element.classList.add('is-visible'));

  const progress = qs('.scroll-progress') || (() => { const node = document.createElement('div'); node.className = 'scroll-progress'; document.body.prepend(node); return node; })();
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true }); window.addEventListener('resize', updateProgress, { passive: true }); updateProgress();
})();

