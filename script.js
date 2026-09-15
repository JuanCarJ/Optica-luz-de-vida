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
    const compactNav = window.innerWidth <= 900;
    lastNavTrigger = navToggle;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    navToggle.classList.toggle('is-open', open);
    nav.setAttribute('aria-hidden', String(compactNav ? !open : false));
    if (open) window.setTimeout(() => nav.querySelector('a')?.focus(), 0);
    else if (document.activeElement && nav.contains(document.activeElement)) lastNavTrigger?.focus();
  };
  if (nav && navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    qsa('a[href^="#"]', nav).forEach((anchor) => anchor.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
    document.addEventListener('click', (event) => { if (nav.classList.contains('is-open') && !nav.contains(event.target) && !navToggle.contains(event.target)) setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); }, { passive: true });
    nav.setAttribute('aria-hidden', String(window.innerWidth <= 900));
  }

  // Privacidad: permanece fuera del flujo del landing y se abre desde el footer o el consentimiento.
  const privacyDialog = byId('privacy-dialog');
  const privacyClose = byId('privacy-dialog-close');
  let lastPrivacyTrigger = null;
  const closePrivacy = () => {
    if (!privacyDialog) return;
    if (typeof privacyDialog.close === 'function' && privacyDialog.open) privacyDialog.close();
    lastPrivacyTrigger?.focus();
  };
  const openPrivacy = (trigger) => {
    if (!privacyDialog) return;
    lastPrivacyTrigger = trigger;
    if (typeof privacyDialog.showModal === 'function' && !privacyDialog.open) privacyDialog.showModal();
    privacyClose?.focus();
  };
  const privacyTrigger = document.createElement('button');
  privacyTrigger.type = 'button';
  privacyTrigger.className = 'footer-policy-link';
  privacyTrigger.textContent = 'Política de privacidad';
  privacyTrigger.setAttribute('aria-haspopup', 'dialog');
  privacyTrigger.addEventListener('click', () => openPrivacy(privacyTrigger));
  qs('.footer-bottom')?.append(privacyTrigger);
  qsa('a[href="#privacidad"]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => { event.preventDefault(); openPrivacy(trigger); });
    trigger.setAttribute('aria-haspopup', 'dialog');
  });
  privacyClose?.addEventListener('click', closePrivacy);
  privacyDialog?.addEventListener('cancel', (event) => { event.preventDefault(); closePrivacy(); });
  privacyDialog?.addEventListener('click', (event) => { if (event.target === privacyDialog) closePrivacy(); });

  // Vista de propuesta para el agendamiento: calendario demo y alternativa por WhatsApp.
  const bookingPreview = byId('booking-preview-dialog');
  const bookingPreviewClose = byId('booking-preview-close');
  let lastBookingPreviewTrigger = null;
  const closeBookingPreview = () => {
    if (!bookingPreview) return;
    if (typeof bookingPreview.close === 'function' && bookingPreview.open) bookingPreview.close();
    lastBookingPreviewTrigger?.focus();
  };
  const openBookingPreview = (trigger) => {
    if (!bookingPreview) return;
    lastBookingPreviewTrigger = trigger;
    if (typeof bookingPreview.showModal === 'function' && !bookingPreview.open) bookingPreview.showModal();
    bookingPreviewClose?.focus();
  };
  qsa('[data-open-booking-preview]').forEach((trigger) => trigger.addEventListener('click', (event) => { event.preventDefault(); openBookingPreview(trigger); }));
  bookingPreviewClose?.addEventListener('click', closeBookingPreview);
  bookingPreview?.addEventListener('cancel', (event) => { event.preventDefault(); closeBookingPreview(); });
  bookingPreview?.addEventListener('click', (event) => { if (event.target === bookingPreview) closeBookingPreview(); });
  const demoDates = qsa('.demo-day', bookingPreview);
  const demoSlots = qsa('.demo-slot', bookingPreview);
  const demoSelectedSlot = byId('demo-selected-slot');
  const demoLocations = qsa('.demo-location', bookingPreview);
  const demoServices = qsa('.demo-service', bookingPreview);
  const demoLocationSelect = qs('[name="demo-location"]', bookingPreview);
  const demoCalendarLocation = qs('.demo-calendar-top span', bookingPreview);
  const demoSlotLabel = () => demoSlots.find((slot) => slot.classList.contains('is-selected'))?.dataset.demoSlot || '';
  let selectedDemoService = demoServices.find((item) => item.classList.contains('is-selected'))?.dataset.demoService || 'Consulta de optometría';
  const demoServiceLabel = () => selectedDemoService;
  const demoLocationLabel = () => demoLocations.find((item) => item.classList.contains('is-selected'))?.dataset.demoLocation || 'Marinilla';
  const updateDemoSelectionSummary = () => {
    if (demoSelectedSlot) demoSelectedSlot.textContent = `Horario elegido: ${demoServiceLabel()} · ${demoLocationLabel()} · ${demoSlotLabel()}`;
  };
  demoLocations.forEach((location) => location.addEventListener('click', () => {
    const value = location.dataset.demoLocation || 'Marinilla';
    demoLocations.forEach((item) => item.classList.toggle('is-selected', item === location));
    if (demoLocationSelect) demoLocationSelect.value = value;
    if (demoCalendarLocation) demoCalendarLocation.textContent = value;
    updateDemoSelectionSummary();
  }));
  demoServices.forEach((service) => service.addEventListener('click', () => {
    selectedDemoService = service.dataset.demoService || 'Consulta de optometría';
    demoServices.forEach((item) => item.classList.toggle('is-selected', item === service));
    updateDemoSelectionSummary();
  }));
  const selectDemoSlot = (slot) => {
    demoSlots.forEach((item) => item.classList.toggle('is-selected', item === slot));
    updateDemoSelectionSummary();
  };
  demoDates.forEach((date) => date.addEventListener('click', () => {
    const value = date.dataset.demoDate || '';
    demoDates.forEach((item) => item.classList.toggle('is-selected', item === date));
    demoSlots.forEach((slot) => { slot.dataset.demoSlot = `${value} · ${slot.textContent.trim()}`; });
    selectDemoSlot(demoSlots[0]);
  }));
  demoSlots.forEach((slot) => slot.addEventListener('click', () => selectDemoSlot(slot)));
  const demoForm = byId('demo-appointment-form');
  const demoResult = qs('.demo-form-result', demoForm);
  demoForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(demoForm);
    const name = String(data.get('demo-name') || '').trim();
    const phone = String(data.get('demo-phone') || '').replace(/\D/g, '');
    if (demoResult) {
      if (name.length < 2 || phone.length < 7) { demoResult.textContent = 'Escribe tu nombre y un celular válido para continuar.'; demoResult.classList.add('has-error'); return; }
      demoResult.classList.remove('has-error'); demoResult.textContent = `Ejemplo preparado para ${name}: ${demoServiceLabel()} en ${demoLocationLabel()}, ${demoSlotLabel()}. En una versión conectada, el equipo confirmaría esta cita.`;
    }
  });
  updateDemoSelectionSummary();

  // Horarios: convierte el texto corrido en filas legibles por día y rango.
  qsa('.location-data > div:nth-child(2)').forEach((hours) => {
    const paragraph = qs('p', hours);
    if (!paragraph || hours.querySelector('.hours-list')) return;
    const lines = paragraph.innerHTML.split(/<br\s*\/?>/i).map((line) => line.replace(/<[^>]*>/g, '').trim()).filter(Boolean);
    const list = document.createElement('ul');
    list.className = 'hours-list';
    let lastTime = null;
    lines.forEach((line) => {
      const separator = line.indexOf(' · ');
      if (separator < 0 && lastTime) {
        lastTime.append(document.createElement('br'), document.createTextNode(line));
        return;
      }
      const row = document.createElement('li');
      const day = document.createElement('span');
      const time = document.createElement('time');
      day.textContent = separator < 0 ? 'Horario' : line.slice(0, separator);
      time.textContent = separator < 0 ? line : line.slice(separator + 3);
      row.append(day, time);
      list.append(row);
      lastTime = time;
    });
    paragraph.replaceWith(list);
  });

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
    pills.forEach((pill) => pill.addEventListener('click', () => { applyFilter(pill.dataset.filter || 'all'); window.setTimeout(() => syncFrameCarousel?.(), 0); }));
    applyFilter(pills.find((pill) => pill.classList.contains('active'))?.dataset.filter || 'all');
  }

  // Carrusel de monturas: avance suave, controles táctiles y pausa accesible.
  const frameCarousel = qs('.frame-carousel');
  const framePrev = qs('.frame-control-prev', frameCarousel);
  const frameNext = qs('.frame-control-next', frameCarousel);
  const framePlay = qs('.frame-play');
  const frameDots = qs('.frame-carousel-dots');
  const frameStatus = qs('.frame-carousel-status');
  const frameGrid = qs('.frame-grid', frameCarousel);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frameTimer = null;
  let frameScrollRaf = 0;
  let framePaused = reducedMotion.matches;
  let frameHover = false;
  let frameFocus = false;

  const visibleFrames = () => frameCards.filter((card) => !card.hidden);
  const frameIndex = () => {
    const visible = visibleFrames();
    if (!visible.length || !frameGrid) return 0;
    const left = frameGrid.getBoundingClientRect().left;
    let closest = 0;
    let distance = Infinity;
    visible.forEach((card, index) => {
      const delta = Math.abs(card.getBoundingClientRect().left - left);
      if (delta < distance) { distance = delta; closest = index; }
    });
    return closest;
  };
  const scrollToFrame = (index) => {
    const visible = visibleFrames();
    const card = visible[index];
    if (!card || !frameGrid) return;
    const target = card.offsetLeft - frameGrid.offsetLeft;
    window.cancelAnimationFrame(frameScrollRaf);
    if (reducedMotion.matches) { frameGrid.scrollLeft = target; return; }
    const start = frameGrid.scrollLeft;
    const distance = target - start;
    const startedAt = performance.now();
    const duration = 950;
    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      frameGrid.scrollLeft = start + distance * eased;
      if (progress < 1) frameScrollRaf = window.requestAnimationFrame(tick);
    };
    frameScrollRaf = window.requestAnimationFrame(tick);
  };
  const syncFrameCarousel = () => {
    const visible = visibleFrames();
    const current = Math.min(frameIndex(), Math.max(visible.length - 1, 0));
    if (frameStatus) frameStatus.textContent = visible.length ? `${current + 1} de ${visible.length}` : 'Sin resultados';
    if (frameDots) {
      frameDots.replaceChildren(...visible.map((card, index) => {
        const dot = document.createElement('button');
        dot.type = 'button'; dot.className = 'frame-dot'; dot.setAttribute('aria-label', `Ver ${qs('h3', card)?.textContent?.trim() || `montura ${index + 1}`}`);
        dot.setAttribute('aria-current', String(index === current));
        dot.addEventListener('click', () => { framePaused = true; updatePlayButton(); scrollToFrame(index); });
        return dot;
      }));
    }
  };
  const updatePlayButton = () => {
    if (!framePlay) return;
    framePlay.textContent = framePaused ? 'Reanudar movimiento' : 'Pausar movimiento';
    framePlay.setAttribute('aria-pressed', String(framePaused));
  };
  const stopFrameTimer = () => { if (frameTimer) { window.clearInterval(frameTimer); frameTimer = null; } };
  const startFrameTimer = () => {
    stopFrameTimer();
    if (!frameCarousel || framePaused || reducedMotion.matches) return;
    frameTimer = window.setInterval(() => {
      if (frameHover || frameFocus) return;
      const visible = visibleFrames();
      if (visible.length > 1) scrollToFrame((frameIndex() + 1) % visible.length);
    }, 9000);
  };
  const restartFrameTimer = () => { updatePlayButton(); startFrameTimer(); };
  const refreshFrameMotion = () => { framePaused = reducedMotion.matches || framePaused; restartFrameTimer(); };
  if (frameCarousel && frameGrid) {
    framePrev?.addEventListener('click', () => { framePaused = true; updatePlayButton(); const visible = visibleFrames(); scrollToFrame((frameIndex() - 1 + visible.length) % visible.length); });
    frameNext?.addEventListener('click', () => { framePaused = true; updatePlayButton(); const visible = visibleFrames(); scrollToFrame((frameIndex() + 1) % visible.length); });
    framePlay?.addEventListener('click', () => { framePaused = !framePaused; restartFrameTimer(); });
    frameGrid.addEventListener('scroll', () => window.requestAnimationFrame(syncFrameCarousel), { passive: true });
    frameCarousel.addEventListener('pointerenter', () => { frameHover = true; });
    frameCarousel.addEventListener('pointerleave', () => { frameHover = false; });
    frameCarousel.addEventListener('focusin', () => { frameFocus = true; });
    frameCarousel.addEventListener('focusout', (event) => { if (!frameCarousel.contains(event.relatedTarget)) frameFocus = false; });
    reducedMotion.addEventListener?.('change', refreshFrameMotion);
    syncFrameCarousel(); updatePlayButton(); startFrameTimer();
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

