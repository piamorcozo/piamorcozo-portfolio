(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Subtle glowing cursor light */
  const glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(pointer: fine)").matches) {
    document.body.classList.add("is-pointer");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    window.addEventListener(
      "pointermove",
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
      },
      { passive: true }
    );

    const tickGlow = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(tickGlow);
    };
    requestAnimationFrame(tickGlow);
  }

  /* Scroll-spy nav (Brittany-style active section) */
  const sections = [...document.querySelectorAll("[data-section]")];
  const navLinks = [...document.querySelectorAll("[data-nav]")];

  const setActiveNav = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.nav === id);
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setActiveNav(link.dataset.nav));
  });

  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveNav(visible[0].target.dataset.section);
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );
    sections.forEach((section) => spy.observe(section));
  } else if (sections[0]) {
    setActiveNav(sections[0].dataset.section);
  }

  /* Mobile TOC: pin numbers to the top after leaving the intro */
  const nav = document.querySelector(".side-nav");
  const navSlot = document.querySelector(".side-nav-slot");
  const mobileNav = window.matchMedia("(max-width: 959px)");

  const setPinnedNav = (pinned) => {
    if (!nav || !navSlot) return;
    const isPinned = nav.classList.contains("is-pinned");
    if (pinned === isPinned) return;

    if (pinned) {
      navSlot.style.minHeight = `${nav.getBoundingClientRect().height}px`;
      nav.classList.add("is-pinned");
    } else {
      nav.classList.remove("is-pinned");
      navSlot.style.minHeight = "";
    }
  };

  const updatePinnedNav = () => {
    if (!nav || !navSlot) return;
    if (!mobileNav.matches) {
      setPinnedNav(false);
      return;
    }
    setPinnedNav(navSlot.getBoundingClientRect().top <= 0);
  };

  if (nav && navSlot) {
    window.addEventListener("scroll", updatePinnedNav, { passive: true });
    window.addEventListener("resize", updatePinnedNav);
    mobileNav.addEventListener("change", updatePinnedNav);
    updatePinnedNav();
  }

  /* Orbit experience timeline */
  const orbit = document.querySelector("[data-orbit]");
  if (!orbit) return;

  const progressPath = orbit.querySelector(".orbit-progress");
  const beacon = orbit.querySelector(".orbit-beacon");
  const trackPath = orbit.querySelector(".orbit-track");
  const stops = [...orbit.querySelectorAll(".orbit-stop")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setStopState = (progress) => {
    const count = Math.max(stops.length - 1, 1);
    stops.forEach((stop, i) => {
      const threshold = 0.04 + (i / count) * 0.78;
      const active = reduceMotion || progress >= threshold;
      stop.classList.toggle("is-active", active);
    });
  };

  if (!progressPath || !beacon || !trackPath || !stops.length) {
    setStopState(1);
    return;
  }

  const updateOrbit = () => {
    const rect = orbit.getBoundingClientRect();
    const viewH = window.innerHeight || 1;
    const start = viewH * 0.72;
    const end = -rect.height + viewH * 0.3;
    const raw = (start - rect.top) / (start - end || 1);
    const progress = Math.min(1, Math.max(0, raw));

    progressPath.style.strokeDashoffset = String(1 - progress);

    try {
      const length = trackPath.getTotalLength();
      const point = trackPath.getPointAtLength(progress * length);
      beacon.setAttribute("cx", String(point.x));
      beacon.setAttribute("cy", String(point.y));
    } catch {
      /* SVG path length unavailable */
    }

    setStopState(progress);
  };

  if (reduceMotion) {
    progressPath.style.strokeDashoffset = "0";
    setStopState(1);
    return;
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateOrbit();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateOrbit();
})();
