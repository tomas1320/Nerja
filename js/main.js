/* =========================================================
   NERJA — interacciones y animaciones (GSAP + ScrollTrigger + SplitText + Lenis)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sin GSAP (offline): mostramos el sitio tal cual.
  if (!window.gsap || !window.ScrollTrigger) {
    $('.loader')?.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) =>
      a.addEventListener('click', (e) => {
        const target = $(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
      })
    );
  }

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor');
  if (fine && cursor) {
    const label = $('.cursor__label', cursor);
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); });

    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        label.textContent = el.dataset.cursor;
        gsap.to(cursor, { width: 92, height: 92, margin: '-46px 0 0 -46px', backgroundColor: '#8b7262', duration: 0.5, ease: 'expo.out' });
        gsap.to(label, { opacity: 1, duration: 0.3, delay: 0.1 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(cursor, { width: 10, height: 10, margin: '-5px 0 0 -5px', backgroundColor: '#2a211d', duration: 0.5, ease: 'expo.out' });
        gsap.to(label, { opacity: 0, duration: 0.2 });
      });
    });
    $$('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 3.2, opacity: 0.25, duration: 0.4 }));
      el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.4 }));
    });
  }

  /* ---------- Botones magnéticos ---------- */
  if (fine) {
    $$('.magnetic').forEach((btn) => {
      const span = btn.querySelector('span');
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: dx * 0.3, y: dy * 0.4, duration: 0.6, ease: 'power3.out' });
        if (span) gsap.to(span, { x: dx * 0.12, y: dy * 0.15, duration: 0.6, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to([btn, span], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, .4)' });
      });
    });
  }

  /* ---------- Preloader + intro del hero ---------- */
  document.body.classList.add('is-loading');
  lenis?.stop();

  const heroChars = $$('.hero__char');
  gsap.set(heroChars, { yPercent: 110 });
  gsap.set(['.hero__eyebrow', '.hero__foot'], { autoAlpha: 0, y: 24 });
  gsap.set('.nav', { yPercent: -100 });

  const counter = { v: 0 };
  const numEl = $('.loader__num');

  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.inOut' } });
  intro
    .to('.loader__word', { yPercent: -40, autoAlpha: 0, duration: 0.8, ease: 'power3.in' })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.2 }, '-=0.2')
    .to('.hero__media', { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.8 }, '-=0.9')
    .to('.hero__media img', { scale: 1.08, duration: 2.2, ease: 'expo.out' }, '<')
    .to('.hero__veil', { opacity: 1, duration: 1.2, ease: 'power2.out' }, '-=1.4')
    .to(heroChars, { yPercent: 0, duration: 1.4, stagger: 0.07, ease: 'expo.out' }, '-=1.3')
    .to(['.hero__eyebrow', '.hero__foot'], { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, '-=1.1')
    .to('.nav', { yPercent: 0, duration: 1, ease: 'expo.out' }, '-=1')
    .add(() => {
      $('.loader')?.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
      ScrollTrigger.refresh();
    });

  const loaderTl = gsap.timeline();
  loaderTl
    .fromTo('.loader__word span', { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' })
    .to(counter, {
      v: 100, duration: reduce ? 0.3 : 1.8, ease: 'power2.inOut',
      onUpdate: () => (numEl.textContent = Math.round(counter.v)),
    }, 0.2)
    .to('.loader__bar i', { scaleX: 1, duration: reduce ? 0.3 : 1.8, ease: 'power2.inOut' }, 0.2);

  // Esperamos fuentes + timeline del loader antes de lanzar el intro
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => loaderTl.eventCallback('onComplete', r)),
  ]).then(() => {
    initScroll();
    intro.play();
  });

  /* =========================================================
     Animaciones de scroll
     ========================================================= */
  function initScroll() {
    /* Nav: se vuelve sólido y se oculta al bajar */
    ScrollTrigger.create({
      start: () => innerHeight * 0.85,
      end: 'max',
      onUpdate: (self) => {
        const nav = $('.nav');
        nav.classList.toggle('is-solid', self.progress > 0 || self.scroll() > innerHeight * 0.85);
        nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > innerHeight * 1.2);
      },
      onLeaveBack: () => $('.nav').classList.remove('is-solid', 'is-hidden'),
    });

    /* Hero: parallax de salida */
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    })
      .to('.hero__media img', { yPercent: 18, scale: 1.2, ease: 'none' }, 0)
      .to('.hero__media', { clipPath: 'inset(0% 0% 8% 0% round 0px 0px 48px 48px)', ease: 'none' }, 0)
      .to(heroChars, { yPercent: (i) => -30 - i * 14, ease: 'none' }, 0)
      .to('.hero__content', { autoAlpha: 0.2, ease: 'none' }, 0);

    /* Titulares: reveal por líneas */
    $$('.split').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            rotate: 3,
            duration: 1.3,
            stagger: 0.12,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }),
      });
    });

    $$('.kicker').forEach((k) =>
      gsap.from(k, {
        autoAlpha: 0, x: -30, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: k, start: 'top 90%', once: true },
      })
    );

    /* Manifiesto: palabra por palabra */
    const mText = $('[data-words]');
    if (mText) {
      mText.innerHTML = mText.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
      gsap.to($$('.w', mText), {
        opacity: 1,
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: { trigger: mText, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
      });
      gsap.from('.manifesto__sig', {
        autoAlpha: 0, y: 30, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.manifesto__sig', start: 'top 90%', once: true },
      });
      gsap.from('.manifesto__dot', {
        scale: 0, duration: 1, ease: 'elastic.out(1, .4)',
        scrollTrigger: { trigger: '.manifesto__sig', start: 'top 90%', once: true },
      });
    }

    /* Del día a la noche: scroll horizontal fijado */
    const track = $('.day__track');
    const getDist = () => Math.max(0, track.scrollWidth - innerWidth);
    const horiz = gsap.to(track, {
      x: () => -getDist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.day__pin',
        start: 'top top',
        end: () => '+=' + getDist(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
    gsap.to('.day__progress i', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.day__pin', start: 'top top', end: () => '+=' + getDist(), scrub: true },
    });

    // Cada momento: reveal + parallax interno usando containerAnimation
    $$('.moment').forEach((m) => {
      const img = $('img', m);
      const box = $('.moment__img', m);
      gsap.fromTo(box,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)', ease: 'expo.out', duration: 1.4,
          scrollTrigger: { trigger: m, containerAnimation: horiz, start: 'left 92%', toggleActions: 'play none none reverse' },
        });
      gsap.fromTo(img, { xPercent: -10 }, {
        xPercent: 10, ease: 'none',
        scrollTrigger: { trigger: m, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true },
      });
      gsap.from($$('h3, p, .moment__n', m), {
        y: 40, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: m, containerAnimation: horiz, start: 'left 80%', toggleActions: 'play none none reverse' },
      });
    });
    gsap.from('.day__end', {
      autoAlpha: 0, x: 120, ease: 'power2.out',
      scrollTrigger: { trigger: '.day__end', containerAnimation: horiz, start: 'left right', end: 'left 60%', scrub: true },
    });

    initRing();

    /* Contadores */
    $$('[data-count]').forEach((el) => {
      const end = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const o = { v: 0 };
      gsap.to(o, {
        v: end, duration: 2, ease: 'power3.out',
        onUpdate: () => (el.textContent = Math.round(o.v) + suffix),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
    gsap.from('.fact', {
      y: 50, autoAlpha: 0, stagger: 0.15, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.house__facts', start: 'top 90%', once: true },
    });

    /* Marquee infinito que reacciona a la velocidad del scroll */
    const row = $('.marquee__row');
    const marq = gsap.to(row, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        dir = self.direction;
        const boost = gsap.utils.clamp(1, 6, Math.abs(self.getVelocity()) / 250);
        gsap.to(marq, { timeScale: dir * boost, duration: 0.2, overwrite: true });
        gsap.to(marq, { timeScale: dir, duration: 1.2, delay: 0.2, ease: 'power2.out' });
      },
    });
    gsap.fromTo('.marquee', { rotate: -5 }, {
      rotate: 1.5, ease: 'none',
      scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    /* Dulces: arco que se abre + parallax */
    $$('.sweet').forEach((s, i) => {
      const frame = $('.sweet__frame', s);
      const img = $('img', s);
      gsap.fromTo(frame,
        { clipPath: 'inset(40% 20% 40% 20% round 300px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.6, ease: 'expo.inOut',
          scrollTrigger: { trigger: s, start: 'top 80%', once: true },
        });
      gsap.fromTo(img, { yPercent: -18 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.from($('figcaption', s), {
        y: 30, autoAlpha: 0, duration: 1, ease: 'power3.out', delay: 0.4,
        scrollTrigger: { trigger: s, start: 'top 75%', once: true },
      });
      gsap.to(s, {
        y: i === 0 ? -60 : -140, ease: 'none',
        scrollTrigger: { trigger: '.sweets__grid', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.from('.sweets__quote p', {
      autoAlpha: 0, y: 60, rotateX: -40, transformOrigin: '50% 100%', duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: '.sweets__quote', start: 'top 80%', once: true },
    });

    /* Reseñas: entrada en cascada 3D + tilt */
    gsap.from('.review', {
      y: 120, rotateX: -30, autoAlpha: 0, transformOrigin: '50% 100%',
      stagger: 0.12, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: '.reviews__list', start: 'top 85%', once: true },
    });
    if (fine) {
      $$('.review').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, { rotateY: px * 10, rotateX: -py * 10, y: -6, duration: 0.6, ease: 'power3.out' });
        });
        card.addEventListener('mouseleave', () =>
          gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, .5)' })
        );
      });
    }

    /* Visitanos */
    gsap.fromTo('.visit__media img', { yPercent: -16 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('.visit__media',
      { clipPath: 'inset(0% 100% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut',
        scrollTrigger: { trigger: '.visit', start: 'top 70%', once: true },
      });
    gsap.from('.visit__data .row', {
      autoAlpha: 0, y: 30, stagger: 0.1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.visit__data', start: 'top 85%', once: true },
    });
    gsap.from('.visit__actions .btn', {
      autoAlpha: 0, y: 30, stagger: 0.1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.visit__actions', start: 'top 95%', once: true },
    });

    /* Footer: NERJA gigante */
    gsap.from('.footer__big span', {
      yPercent: 100, stagger: 0.06, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.8 },
    });

    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* =========================================================
     Anillo 3D giratorio (las fotos del lugar en círculo)
     ========================================================= */
  function initRing() {
    const stage = $('.stage');
    const ring = $('.ring');
    const cards = $$('.card', ring);
    const n = cards.length;
    const step = 360 / n;
    let radius = 0;

    const layout = () => {
      const w = Math.min(260, Math.max(150, innerWidth * 0.32));
      const h = w * 1.32;
      ring.style.setProperty('--card-w', w + 'px');
      ring.style.setProperty('--card-h', h + 'px');
      radius = Math.round((w / 2) / Math.tan(Math.PI / n) * 1.32);
      cards.forEach((c, i) => {
        c.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
      });
    };
    layout();
    addEventListener('resize', layout);

    // Estado de rotación
    const state = { rot: 0, vel: 0, tilt: -8, auto: reduce ? 0.03 : 0.16 };
    let dragging = false;
    let lastX = 0;

    // Entrada del anillo con el scroll
    gsap.fromTo(stage,
      { scale: 0.55, autoAlpha: 0, rotateX: 35 },
      {
        scale: 1, autoAlpha: 1, rotateX: 0, ease: 'power2.out',
        scrollTrigger: { trigger: '.house', start: 'top 85%', end: 'top 15%', scrub: 1 },
      });

    // La velocidad del scroll empuja el giro
    ScrollTrigger.create({
      trigger: '.house',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        if (!dragging) state.vel += self.getVelocity() * 0.00035;
      },
    });
    // Inclinación según la posición del scroll
    gsap.to(state, {
      tilt: 6, ease: 'none',
      scrollTrigger: { trigger: '.house', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    // Arrastrar
    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      stage.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      state.vel = dx * 0.18;
      state.rot += dx * 0.25;
    };
    const onUp = () => (dragging = false);
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);

    // Visible sólo cuando está en pantalla
    let active = false;
    ScrollTrigger.create({
      trigger: '.house', start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (active = self.isActive),
    });

    gsap.ticker.add(() => {
      if (!active) return;
      if (!dragging) {
        state.rot += state.auto + state.vel;
        state.vel *= 0.94;
      }
      ring.style.transform = `translateZ(${-radius * 0.35}px) rotateX(${state.tilt}deg) rotateY(${state.rot}deg)`;

      // Sombreado según qué tan de frente está cada foto
      cards.forEach((c, i) => {
        const a = ((i * step + state.rot) * Math.PI) / 180;
        const facing = Math.cos(a); // 1 = de frente, -1 = atrás
        c.style.setProperty('--shade', ((1 - facing) * 0.38).toFixed(3));
      });
    });
  }
})();
