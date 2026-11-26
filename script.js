/* ============================================================
   54CUTZ — interactions & animations
   ============================================================ */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  /* ---------- year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- loader ---------- */
  // Le loader se retire dès que la page est chargée (au moins 1,3 s pour
  // l'animation du logo), et au plus tard après 2,5 s même si une image
  // traîne sur un réseau lent : on ne bloque jamais la page plus longtemps.
  const loader = document.getElementById("loader");
  const t0 = performance.now();
  let loaderDone = false;
  const finishLoader = () => {
    if (loaderDone) return;
    loaderDone = true;
    loader.classList.add("is-done");
    document.body.classList.add("loaded");
    playHero();
  };
  window.addEventListener("load", () => {
    const wait = reduce ? 0 : Math.max(0, 1300 - (performance.now() - t0));
    setTimeout(finishLoader, wait);
  });
  setTimeout(finishLoader, reduce ? 300 : 2500);

  /* ---------- hero text reveal ---------- */
  function playHero() {
    if (reduce) return;
    const spans = document.querySelectorAll(".hero__title .line > span");
    spans.forEach((s, i) => {
      s.style.transition = "transform 1s cubic-bezier(0.16,1,0.3,1)";
      s.style.transitionDelay = (i * 0.1) + "s";
      requestAnimationFrame(() => { s.style.transform = "translateY(0)"; });
    });
    document.querySelectorAll(".hero .reveal").forEach((el, i) => {
      setTimeout(() => el.classList.add("is-in"), 250 + i * 120);
    });
  }

  /* ---------- nav: scroll state + burger ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  navLinks.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    // menu mobile ouvert : on place la page sur la section instantanément,
    // derrière le menu encore opaque, puis le menu s'efface en douceur
    const href = link.getAttribute("href") || "";
    const target = href.startsWith("#") ? document.querySelector(href) : null;
    if (target && nav.classList.contains("is-open")) {
      e.preventDefault();
      document.body.style.overflow = "";
      const top = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "instant" });
      history.pushState(null, "", href);
    }
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  });

  /* ---------- reveal on scroll (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll(".reveal:not(.hero .reveal), [data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- statement: word-by-word fade ---------- */
  const wordEl = document.querySelector(".reveal-words");
  if (wordEl) {
    const text = wordEl.textContent.trim();
    wordEl.innerHTML = text.split(/\s+/)
      .map((w) => `<span class="word">${w}</span>`).join(" ");
    if (hasGSAP && !reduce) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(wordEl.querySelectorAll(".word"), {
        opacity: 1, stagger: 0.06, ease: "none",
        scrollTrigger: { trigger: wordEl, start: "top 80%", end: "bottom 60%", scrub: true }
      });
    } else {
      wordEl.querySelectorAll(".word").forEach((w) => (w.style.opacity = 1));
    }
  }

  /* ---------- animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = +el.dataset.count;
        if (reduce) { el.textContent = target; cio.unobserve(el); return; }
        const dur = 1400; const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- parallax (GSAP ScrollTrigger) ---------- */
  if (hasGSAP && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll("[data-parallax]").forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      // Hero bg sits at the top of the page: anchor it at "top top" so there is
      // NO downward shift (and no black strip) when the page is at scroll 0.
      const isHero = el.classList.contains("hero__bg");
      gsap.to(el, {
        yPercent: speed * 100,
        ease: "none",
        scrollTrigger: {
          trigger: isHero ? ".hero" : el,
          start: isHero ? "top top" : "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });
  }

  /* ---------- custom cursor ---------- */
  const cursor = document.getElementById("cursor");
  const dot = document.getElementById("cursorDot");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (fine && cursor && dot) {
    // caché tant que la souris n'a pas bougé (sinon il apparaît dans le coin haut-gauche)
    let mx = 0, my = 0, cx = 0, cy = 0, seen = false;
    cursor.style.opacity = 0; dot.style.opacity = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; cx = mx; cy = my; cursor.style.opacity = 1; dot.style.opacity = 1; }
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    const loop = () => {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.querySelectorAll("[data-cursor], a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
    document.addEventListener("mouseleave", () => { cursor.style.opacity = 0; dot.style.opacity = 0; });
    document.addEventListener("mouseenter", () => { cursor.style.opacity = 1; dot.style.opacity = 1; });
  }

  /* ---------- carte Google Maps chargée au clic (RGPD) ---------- */
  const mapBtn = document.getElementById("mapLoad");
  if (mapBtn) {
    mapBtn.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.title = "Plan — 54cutz Perwez";
      iframe.src = mapBtn.dataset.src;
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      mapBtn.replaceWith(iframe);
    });
  }

  /* ---------- bouton Réserver flottant (mobile) ----------
     visible après le hero, caché quand la section Réserver est à l'écran
     ou quand le menu mobile est ouvert */
  const fab = document.getElementById("bookFab");
  const heroEl = document.getElementById("hero");
  const bookEl = document.getElementById("book");
  if (fab && heroEl && bookEl && "IntersectionObserver" in window) {
    let pastHero = false, bookVisible = false;
    const updateFab = () => fab.classList.toggle("is-visible",
      pastHero && !bookVisible && !nav.classList.contains("is-open"));
    new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting; updateFab(); },
      { threshold: 0.15 }).observe(heroEl);
    new IntersectionObserver(([en]) => { bookVisible = en.isIntersecting; updateFab(); },
      { threshold: 0.1 }).observe(bookEl);
    burger.addEventListener("click", updateFab);
    navLinks.addEventListener("click", () => setTimeout(updateFab, 0));
  }

  /* ---------- horaires : jour actuel + ouvert / fermé ---------- */
  // Seule définition des horaires dans le JS (le badge et la ligne du jour
  // en dépendent). Index = getDay() : 0 = dimanche … 6 = samedi.
  // [ouverture, fermeture] en minutes depuis minuit ; null = fermé.
  // À garder alignée sur la liste .hours__list du HTML et le JSON-LD.
  const HOURS = [
    [600, 900],   // dimanche 10h–15h
    null,         // lundi fermé
    [600, 1200],  // mardi 10h–20h
    [600, 1200],  // mercredi
    [600, 1200],  // jeudi
    [600, 1200],  // vendredi
    [600, 900]    // samedi 10h–15h
  ];
  const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const hoursList = document.querySelector(".hours__list");
  const hoursStatus = document.getElementById("hoursStatus");

  // Jour et heure à Bruxelles, quel que soit le fuseau du visiteur.
  const brusselsFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels", weekday: "short",
    hour: "numeric", minute: "numeric", hourCycle: "h23"
  });
  const brusselsNow = () => {
    const parts = {};
    brusselsFmt.formatToParts(new Date()).forEach((p) => { parts[p.type] = p.value; });
    return {
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday),
      min: (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10)
    };
  };
  const fmtTime = (m) => Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : "");

  const hoursState = ({ day, min }) => {
    const t = HOURS[day];
    if (t && min >= t[0] && min < t[1]) {
      return { open: true, text: "Ouvert maintenant · jusqu'à " + fmtTime(t[1]) };
    }
    if (t && min < t[0]) {
      return { open: false, text: "Fermé · ouvre aujourd'hui à " + fmtTime(t[0]) };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d]) return { open: false, text: "Fermé · ouvre " + DAY_NAMES[d] + " à " + fmtTime(HOURS[d][0]) };
    }
    return null;
  };

  let lastDay = -1;
  const updateHours = () => {
    const now = brusselsNow();
    if (now.day < 0) return;
    if (hoursList && now.day !== lastDay) {
      hoursList.querySelectorAll("li[data-day]").forEach((li) => {
        const isToday = +li.dataset.day === now.day;
        li.classList.toggle("is-today", isToday);
        if (isToday) li.setAttribute("aria-current", "date"); else li.removeAttribute("aria-current");
        const label = li.querySelector(".hours__today");
        if (isToday && !label) {
          li.querySelector("span").insertAdjacentHTML("beforeend", ' <small class="hours__today">Aujourd’hui</small>');
        } else if (!isToday && label) {
          label.remove();
        }
      });
      lastDay = now.day;
    }
    const st = hoursState(now);
    if (hoursStatus && st) {
      if (hoursStatus.textContent !== st.text) hoursStatus.textContent = st.text;
      hoursStatus.classList.toggle("is-open", st.open);
      hoursStatus.hidden = false;
    }
  };
  if (hoursList || hoursStatus) {
    updateHours();
    // mise à jour au début de chaque minute, et au retour sur l'onglet
    setTimeout(() => { updateHours(); setInterval(updateHours, 60000); },
      60000 - (Date.now() % 60000) + 50);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) updateHours(); });
  }

  /* ---------- active nav link on scroll ---------- */
  const sections = ["services", "team", "gallery", "infos", "book"]
    .map((id) => document.getElementById(id)).filter(Boolean);
  const linkMap = {};
  document.querySelectorAll(".nav__links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && href.startsWith("#")) linkMap[href.slice(1)] = a;
  });
  if ("IntersectionObserver" in window && sections.length) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const a = linkMap[en.target.id];
        if (a) a.classList.toggle("is-active", en.isIntersecting);
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => sio.observe(s));
  }
})();
