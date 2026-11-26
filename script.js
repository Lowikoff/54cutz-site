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

  /* ---------- pré-décodage des photos (équipe + galerie) ----------
     Sans ça, le navigateur décode ces grandes photos au moment où elles
     entrent à l'écran : à-coup au premier passage (défilement rapide vers
     une ancre). Après le load, en temps libre, une photo à la fois.
     La galerie reste en loading="lazy" dans le HTML (rien ne gêne le
     premier affichage) ; ici on la passe en eager pour la charger puis
     la décoder en arrière-plan. */
  window.addEventListener("load", () => {
    const idle = window.requestIdleCallback
      ? (fn) => requestIdleCallback(fn, { timeout: 2000 })
      : (fn) => setTimeout(fn, 200);
    const imgs = [...document.querySelectorAll(".member__photo-img, .gallery__item img")];
    const next = () => {
      const img = imgs.shift();
      if (!img) return;
      if (img.loading === "lazy") img.loading = "eager";
      const p = img.decode ? img.decode() : Promise.resolve();
      p.catch(() => {}).then(() => idle(next));
    };
    idle(next);
  }, { once: true });

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
  /* ---------- liens vers une section de la page ----------
     Défilement en JS plutôt que scroll-behavior: smooth (Safari le fait
     très vite, sans réglage, et ignore le header fixe) :
     - requestAnimationFrame + easeInOutCubic, durée selon la distance
       (600 à 1000 ms) ;
     - arrivée sous le header (hauteur du header en mode « scrolled »,
       celle qu'il aura à l'arrivée) : le titre n'est jamais caché ;
     - URL mise à jour avec history.pushState, sans saut ;
     - un toucher, la molette, un clic ou une touche pendant l'animation
       l'arrête aussitôt : l'utilisateur reprend la main ;
     - prefers-reduced-motion : saut direct. */
  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // hauteur du header une fois la page défilée (padding 1rem haut et bas)
  const headerH = () => {
    const cs = getComputedStyle(nav);
    return nav.offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) + 2 * remPx();
  };
  const anchorTarget = (href) => {
    if (!href || href.length < 2 || href[0] !== "#") return null;
    try { return document.getElementById(decodeURIComponent(href.slice(1))); } catch (_) { return null; }
  };
  const targetY = (el) => {
    if (el.id === "hero") return 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = el.getBoundingClientRect().top + window.scrollY - headerH();
    return Math.max(0, Math.min(max, Math.round(y)));
  };
  const setHash = (href) => {
    if (location.hash === href) history.replaceState(null, "", href);
    else history.pushState(null, "", href);
  };
  // focus sur la section (comme le saut natif) sans redéfiler
  const focusTarget = (el) => {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  };
  const easeInOutCubic = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const STOP_EVENTS = ["wheel", "touchstart", "mousedown", "keydown"];
  let scrollRun = null;
  const stopScroll = () => {
    if (!scrollRun) return;
    cancelAnimationFrame(scrollRun.raf);
    STOP_EVENTS.forEach((t) => window.removeEventListener(t, stopScroll));
    scrollRun = null;
  };
  const smoothScrollTo = (el) => {
    stopScroll();
    const startY = window.scrollY;
    const dist = Math.abs(targetY(el) - startY);
    if (reduce || dist < 2) { window.scrollTo(0, targetY(el)); focusTarget(el); return; }
    const duration = Math.min(1000, Math.max(600, 450 + dist * 0.12));
    const t0 = performance.now();
    const run = { raf: 0 };
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      // cible relue à chaque image : suit tout décalage de mise en page
      const endY = targetY(el);
      window.scrollTo(0, startY + (endY - startY) * easeInOutCubic(t));
      if (t < 1) run.raf = requestAnimationFrame(step);
      else { stopScroll(); focusTarget(el); }
    };
    scrollRun = run;
    STOP_EVENTS.forEach((t) => window.addEventListener(t, stopScroll, { passive: true }));
    run.raf = requestAnimationFrame(step);
  };

  navLinks.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    // menu mobile ouvert : on place la page sur la section instantanément,
    // derrière le menu encore opaque, puis le menu s'efface en douceur
    // (un seul mouvement à l'écran : jamais le menu et le défilement ensemble)
    const href = link.getAttribute("href") || "";
    const target = anchorTarget(href);
    if (target && nav.classList.contains("is-open")) {
      e.preventDefault();
      stopScroll();
      document.body.style.overflow = "";
      nav.classList.add("is-scrolled"); // hauteur d'arrivée du header
      window.scrollTo(0, targetY(target));
      setHash(href);
      focusTarget(target);
    }
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  });

  // tous les autres liens #ancre de la page (hero, logo, FAQ, menu ordinateur…)
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute("href");
    const target = anchorTarget(href);
    if (!target) return;
    e.preventDefault();
    setHash(href);
    smoothScrollTo(target);
  });

  // arrivée sur la page avec une ancre (lien partagé) : on corrige la
  // position pour tenir compte du header
  if (location.hash) {
    const target = anchorTarget(location.hash);
    // après le load (le navigateur fait lui-même son saut natif à ce moment-là)
    if (target) window.addEventListener("load", () => requestAnimationFrame(() => {
      if (!scrollRun) window.scrollTo(0, targetY(target));
    }), { once: true });
  }

  /* ---------- reveal on scroll (IntersectionObserver) ---------- */
  // opacity + translateY uniquement ; will-change posé juste avant
  // l'animation et retiré à la fin (pas de calques GPU gardés en mémoire).
  const revealEls = document.querySelectorAll(".reveal:not(.hero .reveal), [data-reveal]");
  const playReveal = (el) => {
    el.style.willChange = "opacity, transform";
    const done = () => { el.style.willChange = ""; };
    el.addEventListener("transitionend", (e) => {
      if (e.target === el && e.propertyName === "transform") done();
    });
    setTimeout(done, 1200); // filet si transitionend ne vient pas
    requestAnimationFrame(() => el.classList.add("is-in"));
  };
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { playReveal(en.target); io.unobserve(en.target); }
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
      // pas de recalcul quand la barre d'adresse de Safari se replie
      ScrollTrigger.config({ ignoreMobileResize: true });
      gsap.to(wordEl.querySelectorAll(".word"), {
        opacity: 1, stagger: 0.06, ease: "none",
        scrollTrigger: { trigger: wordEl, start: "top 80%", end: "bottom 60%", scrub: true }
      });
    } else {
      wordEl.querySelectorAll(".word").forEach((w) => (w.style.opacity = 1));
    }
  }

  /* ---------- FAQ : ouverture / fermeture animées ----------
     Reprise de la FAQ d'amautraining.be. On garde <details>/<summary>
     (clavier, lecteurs d'écran, marche sans JS). Animer la hauteur ferait
     recalculer toute la page à chaque image (saccades sur iPhone) : la mise
     en page n'est calculée qu'une fois, puis tout ce qui suit la question
     glisse avec transform (FLIP) et la question se découpe au même rythme
     avec clip-path : rien ne se chevauche.
     Interruptible : un clic en pleine animation repart de la position
     actuelle, dans l'autre sens, sans saut.
     prefers-reduced-motion : comportement natif (aucune animation). */
  const faqItems = document.querySelectorAll(".faq__item");
  if (faqItems.length && !reduce && Element.prototype.animate) {
    const FAQ_EASE = "cubic-bezier(.4,0,.2,1)";
    const FAQ_OPEN_MS = 650;
    const FAQ_CLOSE_MS = 550;
    // Pendant l'animation, la question est découpée 4 px plus haut (dans le
    // padding vide) : marge contre le léger décalage entre clip-path et
    // transform dans Safari au moment le plus rapide. Invisible à l'arrêt.
    const CLIP_PAD = 4;
    let run = null; // animation en cours : { item, anims, extra, opening, done }

    document.querySelector(".faq__list").classList.add("faq-js");

    // Tout ce qui suit l'élément dans la page : ses frères, puis ceux de ses parents
    const contentBelow = (el) => {
      const out = [];
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        for (let s = n.nextElementSibling; s; s = s.nextElementSibling) {
          if (s.tagName !== "SCRIPT" && s.offsetParent !== null &&
              getComputedStyle(s).position !== "fixed") out.push(s);
        }
      }
      return out;
    };
    // Pixels de la réponse encore masqués (lus sur le clip-path en cours)
    const hiddenPx = (item) => {
      const m = /inset\(([^)]*)\)/.exec(getComputedStyle(item).clipPath || "");
      const v = m ? parseFloat(m[1].split(/\s+/)[2] || m[1].split(/\s+/)[0]) || 0 : CLIP_PAD;
      return Math.max(0, v - CLIP_PAD);
    };
    const stop = () => { if (run) { run.anims.forEach((a) => a.cancel()); } };

    faqItems.forEach((item) => {
      const summary = item.querySelector("summary");
      const answer = summary.nextElementSibling;

      summary.addEventListener("click", (e) => {
        e.preventDefault();
        const opening = !item.open || item.classList.contains("is-closing");

        // Position de départ : celle de l'animation en cours si elle touche
        // cette question, sinon fermée (ouverture) ou ouverte (fermeture).
        let from = null, fromOpacity = opening ? 0 : 1;
        if (run && run.item === item) {
          from = hiddenPx(item);
          fromOpacity = parseFloat(getComputedStyle(answer).opacity);
          stop(); run = null;
        } else if (run) {
          stop(); run.done(); // autre question : on termine la précédente
        }

        // Hauteur de la réponse = écart entre question ouverte et fermée
        item.open = false;
        const closedH = item.offsetHeight;
        item.open = true; // la réponse reste affichée pendant la fermeture
        const extra = item.offsetHeight - closedH;
        if (from === null) from = opening ? extra : 0;
        const to = opening ? 0 : extra;

        const base = opening ? FAQ_OPEN_MS : FAQ_CLOSE_MS;
        const duration = extra ? Math.max(200, base * Math.abs(to - from) / extra) : 0;
        const opts = { duration, easing: FAQ_EASE, fill: "forwards" };
        const clip = (v) => `inset(0 0 ${v + CLIP_PAD}px 0)`;
        const shift = (v) => `translate3d(0, ${-v}px, 0)`;

        item.classList.toggle("is-closing", !opening);
        const anims = [item.animate([{ clipPath: clip(from) }, { clipPath: clip(to) }], opts)];
        contentBelow(item).forEach((s) => {
          anims.push(s.animate([{ transform: shift(from) }, { transform: shift(to) }], opts));
        });
        anims.push(answer.animate([{ opacity: fromOpacity }, { opacity: opening ? 1 : 0 }],
          { duration: opening ? duration : duration * 0.6, easing: FAQ_EASE, fill: "forwards" }));

        const done = () => {
          anims.forEach((a) => a.cancel());
          if (!opening) { item.open = false; item.classList.remove("is-closing"); }
          if (run && run.anims === anims) run = null;
        };
        run = { item, anims, done };
        anims[0].onfinish = () => { if (run && run.anims === anims) done(); };
      });
    });
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

  /* ---------- parallax ----------
     Fait en CSS (scroll-driven animations, voir styles.css) : animé par le
     navigateur en même temps que le défilement, donc fluide sur iPhone,
     contrairement à un parallaxe JS qui a du retard pendant l'élan de Safari. */

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
