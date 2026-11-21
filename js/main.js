/* =========================================================
   NERJA — interacciones y animaciones
   GSAP + ScrollTrigger + SplitText + Lenis · 3D con CSS transforms
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Menú móvil ---------- */
  const toggle = $('.nav__toggle');
  const menu = $('#menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open && hasGsap && !reduce) {
      gsap.from($$('#menu nav a, #menu .btn'), { yPercent: 60, opacity: 0, rotateX: -50, stagger: 0.06, duration: 0.8, ease: 'expo.out' });
    }
  };
  toggle?.addEventListener('click', () => setMenu(menu.hidden));
  $$('#menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); } });

  /* ---------- Barra móvil + nav sólida ---------- */
  const nav = $('.nav');
  const bar = $('.actionbar');
  const hero = $('.hero');
  const visit = $('#visita');
  let heroGone = false, visitOn = false;
  const syncBar = () => bar?.classList.toggle('is-visible', heroGone && !visitOn);
  new IntersectionObserver(([e]) => {
    heroGone = !e.isIntersecting;
    nav.classList.toggle('is-solid', heroGone);
    syncBar();
  }, { rootMargin: '-70px 0px 0px 0px' }).observe(hero);
  new IntersectionObserver(([e]) => { visitOn = e.isIntersecting; syncBar(); }, { threshold: 0.25 }).observe(visit);

  /* ---------- Sección activa en la nav ---------- */
  const links = $$('.nav__links a');
  links.forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { links.forEach((l) => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
    }, { rootMargin: '-45% 0px -50% 0px' }).observe(sec);
  });

  // Sin GSAP (offline) o con movimiento reducido: el sitio queda estático y completo.
  if (!hasGsap || reduce) {
    root.classList.add('static');
    $('.loader')?.remove();
    return;
  }

  root.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  document.body.classList.add('is-loading');

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
    })
  );

  /* ---------- Nav: se esconde al bajar, vuelve al subir ---------- */
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-hidden', y > 300 && y > lastY && !document.body.classList.contains('menu-open'));
      lastY = y;
    },
  });

  /* =========================================================
     CURSOR + MAGNÉTICOS + TILT 3D
     ========================================================= */
  if (fine) {
    root.classList.add('has-cursor');
    const cursor = $('.cursor');
    const dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12 }), dy = gsap.quickTo(dot, 'y', { duration: 0.12 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    addEventListener('mousemove', (e) => { cursor.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-label'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-label'));
    });
    $$('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-link'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-link'));
    });

    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });

    // Tilt 3D con brillo que sigue al puntero
    $$('.tilt, .card3d').forEach((el) => {
      const rX = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
      const rY = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rY((px - 0.5) * 12); rX((0.5 - py) * 10);
        el.style.setProperty('--gx', `${px * 100}%`); el.style.setProperty('--gy', `${py * 100}%`);
      });
      el.addEventListener('mouseleave', () => { rX(0); rY(0); });
    });
  }

  /* =========================================================
     LOADER → ENTRADA DEL HERO
     ========================================================= */
  const loader = $('.loader');
  const counter = { v: 0 };
  const intro = gsap.timeline({ onComplete: () => { document.body.classList.remove('is-loading'); lenis?.start(); loader.remove(); } });
  intro
    .from('.loader__word span', { yPercent: 110, rotateX: -80, stagger: 0.06, duration: 0.9, ease: 'expo.out' })
    .to(counter, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { $('.loader__num').textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0.1)
    .to('.loader__bar i', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.1)
    .to('.loader__word span', { yPercent: -110, stagger: 0.04, duration: 0.6, ease: 'expo.in' }, '+=0.1')
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.2')
    .add(heroIn, '-=0.75');
  gsap.set(loader, { clipPath: 'inset(0 0 0% 0)' });

  function heroIn() {
    const tl = gsap.timeline();
    tl.from('.hero__media', { scale: 1.3, duration: 2.2, ease: 'expo.out' }, 0)
      .from('.hero__char', {
        yPercent: 105, rotateX: -95, z: -120, opacity: 0,
        stagger: 0.075, duration: 1.6, ease: 'expo.out',
      }, 0.1)
      .from('[data-hero-fade]', { y: 30, opacity: 0, stagger: 0.09, duration: 1.1, ease: 'expo.out' }, 0.5)
      .from('.nav__inner', { yPercent: -100, opacity: 0, duration: 1, ease: 'expo.out' }, 0.4);
  }

  /* ---------- Hero: profundidad con el puntero ---------- */
  if (fine) {
    const scene = $('.hero__scene');
    const word = $('.hero__word');
    const sX = gsap.quickTo(scene, 'rotationY', { duration: 1.2, ease: 'power3' });
    const sY = gsap.quickTo(scene, 'rotationX', { duration: 1.2, ease: 'power3' });
    const wX = gsap.quickTo(word, 'x', { duration: 1.2, ease: 'power3' });
    const wY = gsap.quickTo(word, 'y', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('mousemove', (e) => {
      const px = e.clientX / innerWidth - 0.5, py = e.clientY / innerHeight - 0.5;
      sX(px * 4); sY(-py * 3); wX(px * -24); wY(py * -12);
    });
    hero.addEventListener('mouseleave', () => { sX(0); sY(0); wX(0); wY(0); });
  }

  /* ---------- Hero: salida al hacer scroll ---------- */
  const heroOut = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  heroOut
    .to('.hero__media', { yPercent: 14, scale: 1.08, ease: 'none' }, 0)
    .to('.hero__char', { yPercent: (i) => -30 - i * 12, rotateX: 55, opacity: 0.2, stagger: 0.02, ease: 'none' }, 0)
    .to('.hero__aside, .hero__strip, .hero__eyebrow', { y: -60, opacity: 0, ease: 'none' }, 0);

  /* =========================================================
     TITULARES: líneas que se levantan en 3D
     ========================================================= */
  const splitHeads = () => {
    if (!window.SplitText) return;
    $$('h2.split').forEach((h) => {
      const s = new SplitText(h, { type: 'lines', linesClass: 'line', mask: 'lines' });
      gsap.from(s.lines, {
        yPercent: 110, rotateX: -35, transformOrigin: '50% 100%',
        stagger: 0.1, duration: 1.3, ease: 'expo.out',
        scrollTrigger: { trigger: h, start: 'top 85%', once: true },
      });
    });
  };

  /* ---------- Intro: palabras que se encienden + tarjetas 3D ---------- */
  const words = $('[data-words]');
  const splitWords = () => {
    if (!words || !window.SplitText) return;
    const s = new SplitText(words, { type: 'words' });
    gsap.fromTo(s.words, { opacity: 0.14 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: words, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  };
  gsap.fromTo('.card3d', { rotationY: -28, rotationX: 10, z: -120 }, {
    rotationY: 10, rotationX: -4, z: 0, ease: 'none', transformPerspective: 1200,
    scrollTrigger: { trigger: '.intro', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  /* =========================================================
     DEL DÍA A LA NOCHE — prisma que gira con el scroll
     ========================================================= */
  const day = $('.day');
  const body = $('.prism__body');
  const faces = $$('.prism__face');
  const shades = $$('.prism__shade');
  const moments = $$('.moment');
  const steps = $$('.day__steps li');
  const sun = $('.sky__sun');
  const N = faces.length;
  const grounds = ['#f1e6d2', '#f5f2ec', '#ecd4b2', '#0c2223'];
  const mix = gsap.utils.interpolate(grounds);
  let half = 0, active = 0;

  const layoutPrism = () => {
    half = faces[0].offsetWidth / 2;
    faces.forEach((f, i) => { f.style.transform = `rotateY(${i * 90}deg) translateZ(${half}px)`; });
  };
  layoutPrism();

  const smooth = (t) => t * t * (3 - 2 * t);
  const showMoment = (next) => {
    if (next === active) return;
    const dir = next > active ? 1 : -1;
    const out = moments[active], inn = moments[next];
    gsap.killTweensOf([out, inn]);
    gsap.to(out, { yPercent: -30 * dir, rotateX: 50 * dir, opacity: 0, duration: 0.5, ease: 'power3.in', onComplete: () => out.classList.remove('is-active') });
    inn.classList.add('is-active');
    gsap.fromTo(inn, { yPercent: 40 * dir, rotateX: -60 * dir, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, duration: 0.9, delay: 0.2, ease: 'expo.out' });
    steps.forEach((s, i) => s.classList.toggle('is-active', i <= next));
    active = next;
  };

  const arc = (t) => { // 0..1 → punto sobre el arco del cielo
    const a = Math.PI * (1 - t);
    return [200 + 190 * Math.cos(a), 200 - 190 * Math.sin(a)];
  };

  ScrollTrigger.create({
    trigger: day, start: 'top top', end: 'bottom bottom',
    onRefresh: layoutPrism,
    onUpdate: (self) => {
      const raw = self.progress * (N - 1);
      const i = Math.min(Math.floor(raw), N - 2);
      const f = raw - i;
      const eased = i + smooth(Math.min(Math.max((f - 0.25) / 0.5, 0), 1));
      const rot = -eased * 90;
      body.style.transform = `translateZ(${-half}px) rotateX(-7deg) rotateY(${rot}deg)`;
      shades.forEach((s, k) => {
        const c = Math.cos(((k * 90 + rot) * Math.PI) / 180);
        s.style.opacity = (0.75 * (1 - Math.max(0, c))).toFixed(3);
      });
      day.style.setProperty('--bg', mix(eased / (N - 1)));
      day.classList.toggle('is-night', eased > 2.5);
      const [x, y] = arc(self.progress);
      sun.setAttribute('cx', x.toFixed(1)); sun.setAttribute('cy', y.toFixed(1));
      showMoment(Math.round(eased));
    },
  });
  body.style.transform = `translateZ(${-half}px) rotateX(-7deg) rotateY(0deg)`;
  shades.forEach((s, k) => { s.style.opacity = k === 0 ? 0 : 0.75; });

  // un empujón 3D cuando la sección entra en pantalla
  gsap.from('.prism', { rotationX: 40, rotationY: -40, scale: 0.7, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: day, start: 'top 60%', once: true } });

  /* =========================================================
     LA CASA — túnel de fotos en profundidad
     ========================================================= */
  const tunnel = $('.tunnel');
  const tiles = $$('.tile');
  const head = $('.tunnel__head');
  const end = $('.tunnel__end');
  const GAP = 620;
  const DEPTH = GAP * (tiles.length + 1);
  const renderTunnel = (p) => {
    const travel = p * DEPTH;
    const sx = innerWidth / 100, sy = innerHeight / 100;
    const spread = innerWidth < 760 ? 0.7 : 1;
    tiles.forEach((t, i) => {
      const z = -(i + 1) * GAP + travel;
      const x = +t.dataset.x * sx * spread, y = +t.dataset.y * sy;
      let o = 1;
      if (z < -4000) o = 0;
      else if (z < -2400) o = (z + 4000) / 1600;
      if (z > 250) o = Math.max(0, 1 - (z - 250) / 450);
      t.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${(-x / innerWidth) * 18}deg)`;
      t.style.opacity = o.toFixed(3);
      t.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    });
    head.style.opacity = Math.max(0, 1 - p / 0.1).toFixed(3);
    head.style.transform = `translateZ(0) scale(${1 + p * 2})`;
    end.style.opacity = Math.min(1, Math.max(0, (p - 0.8) / 0.12)).toFixed(3);
    end.style.transform = `scale(${0.85 + Math.min(1, Math.max(0, (p - 0.8) / 0.2)) * 0.15})`;
  };
  ScrollTrigger.create({ trigger: tunnel, start: 'top top', end: 'bottom bottom', onUpdate: (s) => renderTunnel(s.progress), onRefresh: (s) => renderTunnel(s.progress) });
  renderTunnel(0);

  /* =========================================================
     MARQUEE con inclinación según la velocidad
     ========================================================= */
  const track = $('.marquee__track');
  const loop = gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
  const skew = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '.marquee', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = self.getVelocity();
      skew(gsap.utils.clamp(-12, 12, v / -220));
      gsap.to(loop, { timeScale: self.direction * (1 + Math.min(Math.abs(v) / 900, 3)), duration: 0.4, overwrite: true });
    },
  });
  gsap.fromTo('.marquee', { rotationX: 25, transformPerspective: 900 }, { rotationX: -10, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* =========================================================
     DULCES — las fotos se enderezan en 3D al entrar
     ========================================================= */
  gsap.fromTo('.sweet--a', { rotationY: 32, rotationX: 10, z: -220, transformPerspective: 1400 }, { rotationY: 0, rotationX: 0, z: 0, ease: 'none', scrollTrigger: { trigger: '.sweets__grid', start: 'top bottom', end: 'center 55%', scrub: true } });
  gsap.fromTo('.sweet--b', { rotationY: -32, rotationX: 10, z: -220, transformPerspective: 1400 }, { rotationY: 0, rotationX: 0, z: 0, ease: 'none', scrollTrigger: { trigger: '.sweets__grid', start: 'top bottom', end: 'center 55%', scrub: true } });
  gsap.from('.sweets__quote', { y: 60, opacity: 0, rotateX: -30, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.sweets__quote', start: 'top 85%', once: true } });

  /* =========================================================
     RESEÑAS — un mazo de cartas que se reparte
     ========================================================= */
  gsap.from('.review', {
    y: 140, z: -300, rotationX: -55, rotationZ: (i) => (i - 1.5) * 6, opacity: 0,
    transformPerspective: 1200, transformOrigin: '50% 100%',
    stagger: 0.12, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.reviews__deck', start: 'top 80%', once: true },
  });

  /* =========================================================
     VISITANOS
     ========================================================= */
  gsap.fromTo('.visit__media', { clipPath: 'inset(18% 12% 18% 12%)', rotationY: -16, transformPerspective: 1400 }, {
    clipPath: 'inset(0% 0% 0% 0%)', rotationY: 0, ease: 'none',
    scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'center center', scrub: true },
  });
  gsap.fromTo('.visit__media img', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.from('.visit__data .row', { x: -40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.visit__data', start: 'top 85%', once: true } });

  /* =========================================================
     FOOTER — las letras se levantan en 3D
     ========================================================= */
  gsap.fromTo('.footer__big span', { rotationX: -100, yPercent: 40, opacity: 0 }, {
    rotationX: 0, yPercent: 0, opacity: 1, stagger: 0.06, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: true },
  });

  /* ---------- Fuentes listas → recalcular ---------- */
  const ready = () => { splitHeads(); splitWords(); ScrollTrigger.refresh(); };
  if (document.fonts?.ready) document.fonts.ready.then(ready); else addEventListener('load', ready);
  addEventListener('load', () => ScrollTrigger.refresh());
})();
