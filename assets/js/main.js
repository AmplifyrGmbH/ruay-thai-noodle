/* ============================================================
   RUAY THAI NOODLE — Main JS (shared, nav + menu + reveal)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Footer year ───────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─── Sticky nav ────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const hasHero = !!document.getElementById('hero');
    const updateNav = () => {
      if (!hasHero) {
        // Non-hero pages: nav always visible with background
        navbar.classList.add('visible', 'scrolled');
        return;
      }
      // Hero pages: always visible (transparent at top), cream bar only on scroll
      navbar.classList.add('visible');
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  // ─── Active nav link on scroll ─────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav ul a');
  if (sections.length && navLinks.length) {
    const updateActive = () => {
      let current = '';
      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
      });
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    };
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  // ─── Hamburger / mobile nav ────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navMobile = document.getElementById('navMobile');
  if (hamburger && navMobile) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      navMobile.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navMobile.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── Menu chips / panels ───────────────────────────────────
  const chips = document.querySelectorAll('.chip[data-panel]');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const target = chip.dataset.panel;
      chips.forEach(c => { c.classList.toggle('active', c === chip); });
      document.querySelectorAll('.menu-panel').forEach(p => {
        p.classList.toggle('active', p.id === target);
      });
    });
  });

  // ─── Scroll reveal ─────────────────────────────────────────
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(el => observer.observe(el));
  }

});
