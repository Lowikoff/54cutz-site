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
  // Le loader se retire dès que le premier écran est prêt (photo du hero +
  // polices), au moins 1,3 s pour l'animation du logo, et au plus tard après
  // 2,5 s même sur un réseau lent. On n'attend pas l'événement « load » : il
  // attend aussi les photos de l'équipe, plus bas dans la page.
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
  const heroImg = document.querySelector(".hero__bg-img");
  const heroReady = !heroImg || heroImg.complete ? Promise.resolve()
    : new Promise((res) => { heroImg.addEventListener("load", res, { once: true }); heroImg.addEventListener("error", res, { once: true }); });
  Promise.all([heroReady, document.fonts ? document.fonts.ready : null]).then(() => {
    const wait = reduce ? 0 : Math.max(0, 1300 - (performance.now() - t0));
    setTimeout(finishLoader, wait);
  });
  setTimeout(finishLoader, reduce ? 300 : 2500);

  /* ---------- pré-décodage des photos (équipe + galerie) ----------
     Sans ça, le navigateur décode ces grandes photos au moment où elles
     entrent à l'écran : à-coup au premier passage (défilement rapide vers
     une ancre). Une fois le premier écran affiché (loader retiré + 1,2 s,
     et après le load), en temps libre, une photo à la fois : rien ne
     concurrence l'affichage du hero.
     La galerie reste en loading="lazy" dans le HTML ; ici on la passe en
     eager pour la charger puis la décoder en arrière-plan. */
  const afterFirstScreen = (fn) => {
    const go = () => setTimeout(fn, 1200);
    const wait = () => (loaderDone ? go() : setTimeout(wait, 100));
    if (document.readyState === "complete") wait();
    else window.addEventListener("load", wait, { once: true });
  };
  afterFirstScreen(() => {
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
  });

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
  /* ---------- galerie : visionneuse plein écran ----------
     JS vanilla. Ouverture : la photo grandit depuis sa miniature (FLIP :
     transform + clip-path, la miniature étant recadrée en object-fit: cover),
     fermeture : elle y retourne. Navigation : flèches et ← → Échap ; au
     doigt : glisser gauche/droite, glisser vers le bas pour fermer, pincer
     ou double-tap pour zoomer. Focus piégé dans la boîte de dialogue, page
     derrière inerte et bloquée, focus rendu à la miniature à la fermeture.
     prefers-reduced-motion : simple fondu. Sans JS : le lien ouvre la photo. */
  const lb = document.getElementById("lightbox");
  const thumbs = [...document.querySelectorAll(".gallery__item")];
  if (lb && thumbs.length) {
    const stage = lb.querySelector(".lb__stage");
    const bg = lb.querySelector(".lb__bg");
    const ui = [...lb.querySelectorAll(".lb__count, .lb__btn")];
    const curEl = lb.querySelector(".lb__current");
    const srEl = lb.querySelector(".lb__sr"); // annonce pour lecteurs d'écran (pas de légende visible)
    const btnClose = lb.querySelector(".lb__close");
    const btnPrev = lb.querySelector(".lb__prev");
    const btnNext = lb.querySelector(".lb__next");
    lb.querySelector(".lb__total").textContent = thumbs.length;

    const EASE = "cubic-bezier(.32,.72,0,1)"; // courbe type iOS, douce à l'arrivée
    const GAP = 24;                           // espace entre deux photos pendant le glissé
    const MAX_ZOOM = 4;
    let order = thumbs, idx = 0, open = false, busy = false, lastFocus = null;
    let W = 0, H = 0;

    // 3 emplacements : photo précédente, actuelle, suivante
    const slides = [0, 1, 2].map(() => {
      const s = document.createElement("div"); s.className = "lb__slide";
      const z = document.createElement("div"); z.className = "lb__zoom";
      const img = document.createElement("img"); img.className = "lb__img"; img.alt = ""; img.draggable = false;
      img.decoding = "async";
      z.append(img); s.append(z); stage.append(s);
      return { s, z, img, i: -1, rect: null };
    });
    let [sPrev, sCur, sNext] = slides;
    // zoom / déplacement de la photo actuelle
    let zs = 1, zx = 0, zy = 0;

    const big = (a) => a.getAttribute("href");
    const small = (a) => { const im = a.querySelector("img"); return im.currentSrc || im.src; };
    const isMobile = () => !matchMedia("(hover: hover) and (pointer: fine)").matches;
    // zone d'affichage de la photo (place pour le compteur et les flèches, centrée verticalement)
    const fitRect = (a) => {
      const w = +a.dataset.w, h = +a.dataset.h;
      const sx = isMobile() ? 0 : 84, top = isMobile() ? 64 : 72, bottom = top;
      const aw = W - 2 * sx, ah = H - top - bottom;
      const k = Math.min(aw / w, ah / h, 1.5);
      const rw = w * k, rh = h * k;
      return { left: sx + (aw - rw) / 2, top: top + (ah - rh) / 2, width: rw, height: rh };
    };
    const place = (sl, i) => {
      sl.i = i;
      if (i < 0 || i >= order.length) { sl.s.style.visibility = "hidden"; sl.img.removeAttribute("src"); return; }
      sl.s.style.visibility = "";
      sl.z.style.transition = "none";
      const a = order[i], r = fitRect(a);
      sl.rect = r;
      Object.assign(sl.z.style, { width: r.width + "px", height: r.height + "px", transform: `translate3d(${r.left}px, ${r.top}px, 0)` });
      // miniature déjà chargée tout de suite, puis la grande version une fois décodée
      const lo = small(a), hi = big(a);
      if (sl.img.dataset.src !== hi) {
        sl.img.dataset.src = hi;
        sl.img.src = lo || hi;
        const pre = new Image(); pre.src = hi;
        (pre.decode ? pre.decode() : Promise.resolve()).then(() => { if (sl.img.dataset.src === hi) sl.img.src = hi; }).catch(() => {});
      }
    };
    const setStage = (dx, anim) => {
      stage.style.transition = anim ? `transform ${anim}ms ${EASE}` : "none";
      stage.style.transform = `translate3d(${dx}px, 0, 0)`;
    };
    const layout = () => {
      W = window.innerWidth; H = window.innerHeight;
      slides.forEach((sl) => (sl.s.style.transition = "none"));
      sPrev.s.style.transform = `translate3d(${-(W + GAP)}px, 0, 0)`;
      sCur.s.style.transform = "none";
      sNext.s.style.transform = `translate3d(${W + GAP}px, 0, 0)`;
      place(sPrev, idx - 1); place(sCur, idx); place(sNext, idx + 1);
      zs = 1; zx = 0; zy = 0;
    };
    // transform de la photo actuelle (position de base + zoom)
    const applyZoom = (anim) => {
      const r = sCur.rect;
      sCur.z.style.transition = anim ? `transform ${anim}ms ${EASE}` : "none";
      sCur.z.style.transform = `translate3d(${r.left + zx}px, ${r.top + zy}px, 0) scale(${zs})`;
    };
    // garde la photo zoomée dans l'écran (centrée si plus petite que l'écran)
    const clampZoom = () => {
      const r = sCur.rect, w = r.width * zs, h = r.height * zs;
      zx = w <= W ? W / 2 - r.left - w / 2 : Math.min(-r.left, Math.max(W - r.left - w, zx));
      zy = h <= H ? H / 2 - r.top - h / 2 : Math.min(-r.top, Math.max(H - r.top - h, zy));
      if (zs === 1) { zx = 0; zy = 0; }
    };
    const zoomAt = (cx, cy, z, anim) => {
      const r = sCur.rect;
      const ux = (cx - r.left - zx) / zs, uy = (cy - r.top - zy) / zs; // point de la photo sous le doigt
      zs = Math.min(MAX_ZOOM, Math.max(1, z));
      zx = cx - r.left - zs * ux; zy = cy - r.top - zs * uy;
      clampZoom(); applyZoom(anim);
    };
    const updateUI = () => {
      curEl.textContent = idx + 1;
      sCur.img.alt = order[idx].querySelector("img").alt; // la légende n'est plus affichée : le texte reste pour les lecteurs d'écran
      srEl.textContent = `Photo ${idx + 1} sur ${order.length} : ${sCur.img.alt}`;
      btnPrev.disabled = idx === 0;
      btnNext.disabled = idx === order.length - 1;
    };
    const go = (dir) => {
      const j = idx + dir;
      if (busy || j < 0 || j >= order.length) { setStage(0, reduce ? 0 : 260); return; }
      busy = true;
      if (zs !== 1) { zs = 1; zx = 0; zy = 0; applyZoom(reduce ? 0 : 200); }
      const done = () => {
        idx = j;
        // on fait tourner les 3 emplacements : aucun rechargement visible
        if (dir > 0) [sPrev, sCur, sNext] = [sCur, sNext, sPrev];
        else [sPrev, sCur, sNext] = [sNext, sPrev, sCur];
        setStage(0, 0);
        layout(); updateUI(); busy = false;
      };
      if (reduce) { done(); return; }
      setStage(-dir * (W + GAP), 340);
      setTimeout(done, 350);
    };

    // sur un fond noir, rien d'autre ne doit être atteignable
    const setInert = (on) => {
      [...document.body.children].forEach((el) => { if (el !== lb && el.tagName !== "SCRIPT") el.inert = on; });
    };
    // FLIP : transform + clip-path qui font coïncider la grande photo avec la miniature
    const thumbState = (a, r) => {
      const t = a.getBoundingClientRect();
      const im = a.querySelector("img"), cs = getComputedStyle(im);
      const imgScale = new DOMMatrix(cs.transform === "none" ? undefined : cs.transform).a || 1; // zoom au survol
      const [px, py] = cs.objectPosition.split(" ").map((v) => parseFloat(v) / 100);
      const s = Math.max(t.width / r.width, t.height / r.height) * imgScale;
      const vw = t.width / s, vh = t.height / s;          // partie visible, en pixels de la grande photo
      const il = (r.width - vw) * (isNaN(px) ? .5 : px), it = (r.height - vh) * (isNaN(py) ? .5 : py);
      const ir = r.width - vw - il, ib = r.height - vh - it;
      const g = /grayscale\(([\d.]+)\)/.exec(getComputedStyle(a).filter);
      return {
        transform: `translate3d(${t.left - s * il}px, ${t.top - s * it}px, 0) scale(${s})`,
        clipPath: `inset(${it}px ${ir}px ${ib}px ${il}px round ${4 / s}px)`,
        filter: `grayscale(${g ? g[1] : 0})`,
        visible: t.bottom > 0 && t.top < H && t.right > 0 && t.left < W,
      };
    };
    // fill "backwards" à l'ouverture (ensuite le style inline reprend la main : glisser vers le bas
    // peut estomper le fond) ; "forwards" à la fermeture (reste invisible jusqu'à la fin)
    const fade = (els, from, to, ms, delay = 0, fill = "backwards") => els.map((el) => el.animate([{ opacity: from }, { opacity: to }], { duration: ms, delay, easing: "ease", fill }));

    // Commandes (croix, flèches, compteur) masquées après 2 s sans mouvement,
    // réaffichées au moindre mouvement, toucher ou touche du clavier.
    let idleT = 0;
    const wake = () => {
      lb.classList.remove("lb--idle"); document.body.classList.remove("lb-idle");
      clearTimeout(idleT);
      if (open) idleT = setTimeout(() => { if (open) { lb.classList.add("lb--idle"); document.body.classList.add("lb-idle"); } }, 2000);
    };
    ["pointermove", "pointerdown"].forEach((t) => lb.addEventListener(t, wake, { passive: true }));
    lb.addEventListener("keydown", wake);

    const openAt = (a) => {
      if (open) return;
      // ordre = ordre visuel (la mosaïque mobile n'a pas l'ordre du HTML)
      order = [...thumbs].sort((p, q) => {
        const r1 = p.getBoundingClientRect(), r2 = q.getBoundingClientRect();
        return Math.round(r1.top) - Math.round(r2.top) || r1.left - r2.left;
      });
      idx = order.indexOf(a);
      open = true; busy = true; lastFocus = a;
      lb.hidden = false;
      // bloque la page sans changer sa largeur (sinon, avec une barre de défilement
      // classique, la page se remet en page et le navigateur décale le défilement)
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = "hidden";
      if (sbw > 0) document.documentElement.style.paddingRight = sbw + "px";
      setInert(true);
      setStage(0, 0); layout(); updateUI();
      btnClose.focus({ preventScroll: true });
      wake();
      const finish = () => { busy = false; };
      if (reduce) { fade([lb], 0, 1, 200)[0].onfinish = finish; return; }
      const from = thumbState(a, sCur.rect), r = sCur.rect;
      a.style.visibility = "hidden";
      sCur.z.style.transition = "none";
      const anim = sCur.z.animate([
        { transform: from.transform, clipPath: from.clipPath, filter: from.filter },
        { transform: `translate3d(${r.left}px, ${r.top}px, 0) scale(1)`, clipPath: `inset(0px 0px 0px 0px round 0px)`, filter: "grayscale(0)" },
      ], { duration: 480, easing: EASE });
      fade([bg], 0, 1, 320);
      fade(ui, 0, 1, 260, 180);
      [sPrev, sNext].forEach((sl) => (sl.s.style.opacity = 0));
      anim.onfinish = () => { [sPrev, sNext].forEach((sl) => (sl.s.style.opacity = "")); finish(); };
    };

    const close = () => {
      if (!open || busy) return;
      busy = true;
      const a = order[idx];
      const end = () => {
        lb.getAnimations({ subtree: true }).forEach((x) => x.cancel());
        lb.hidden = true; open = false; busy = false;
        clearTimeout(idleT); lb.classList.remove("lb--idle"); document.body.classList.remove("lb-idle");
        thumbs.forEach((t) => (t.style.visibility = ""));
        sCur.s.style.transform = "none"; bg.style.opacity = "";
        ui.forEach((el) => (el.style.opacity = ""));
        document.documentElement.style.overflow = "";
        document.documentElement.style.paddingRight = "";
        setInert(false);
        a.focus({ preventScroll: true });
      };
      if (reduce) { fade([lb], 1, 0, 200, 0, "forwards")[0].onfinish = end; return; }
      // position actuelle (zoomée, glissée vers le bas…) → miniature
      const cur = sCur.z.getBoundingClientRect(), r = sCur.rect;
      const k = cur.width / r.width;
      const start = `translate3d(${cur.left}px, ${cur.top}px, 0) scale(${k})`;
      sCur.s.style.transform = "none"; setStage(0, 0);
      sCur.z.style.transition = "none"; sCur.z.style.transform = start;
      const bgFrom = parseFloat(getComputedStyle(bg).opacity);
      lb.getAnimations().forEach((x) => x.cancel());
      fade(ui, parseFloat(getComputedStyle(ui[0]).opacity), 0, 150, 0, "forwards");
      fade([bg], bgFrom, 0, 320, 0, "forwards");
      const to = thumbState(a, r);
      let anim;
      if (to.visible) {
        a.style.visibility = "hidden";
        anim = sCur.z.animate([
          { transform: start, clipPath: "inset(0px 0px 0px 0px round 0px)", filter: "grayscale(0)" },
          { transform: to.transform, clipPath: to.clipPath, filter: to.filter },
        ], { duration: 420, easing: EASE, fill: "forwards" });
      } else {
        anim = sCur.z.animate([{ transform: start, opacity: 1 }, { transform: start + " scale(.92)", opacity: 0 }], { duration: 260, easing: "ease", fill: "forwards" });
      }
      anim.onfinish = end;
    };

    thumbs.forEach((a) => a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // nouvel onglet : on laisse faire
      e.preventDefault();
      openAt(a);
    }));
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", () => go(-1));
    btnNext.addEventListener("click", () => go(1));
    window.addEventListener("resize", () => { if (open && !busy) { setStage(0, 0); layout(); } });

    document.addEventListener("keydown", (e) => {
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key === "Tab") {
        // piège du focus : on reste sur les boutons de la visionneuse
        const f = [btnClose, btnPrev, btnNext].filter((b) => !b.disabled && b.offsetParent !== null);
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    lb.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

    /* gestes (pointer events : doigt, souris, stylet) */
    const pts = new Map();
    let g = null;        // geste en cours
    let lastTap = null;  // pour le double-tap
    const onImage = (x, y) => {
      const r = sCur.z.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    stage.addEventListener("pointerdown", (e) => {
      if (!open || busy) return;
      try { stage.setPointerCapture(e.pointerId); } catch (_) { /* pointeur déjà relâché */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        // pincer : point milieu et écart de départ
        const [p, q] = [...pts.values()];
        g = { type: "pinch", d0: Math.hypot(p.x - q.x, p.y - q.y), z0: zs, mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2, zx0: zx, zy0: zy };
        return;
      }
      g = { type: "pending", x0: e.clientX, y0: e.clientY, t0: performance.now(), zx0: zx, zy0: zy, hist: [{ x: e.clientX, y: e.clientY, t: performance.now() }] };
    });
    stage.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId) || !g) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.type === "pinch" && pts.size >= 2) {
        const [p, q] = [...pts.values()];
        const d = Math.hypot(p.x - q.x, p.y - q.y), mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        const r = sCur.rect;
        const ux = (g.mx - r.left - g.zx0) / g.z0, uy = (g.my - r.top - g.zy0) / g.z0;
        zs = Math.min(MAX_ZOOM * 1.2, Math.max(.8, g.z0 * d / g.d0));
        zx = mx - r.left - zs * ux; zy = my - r.top - zs * uy;
        applyZoom(0);
        return;
      }
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      g.hist.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (g.hist.length > 6) g.hist.shift();
      if (g.type === "pending") {
        if (Math.hypot(dx, dy) < 8) return;
        g.type = zs > 1 ? "pan" : Math.abs(dx) > Math.abs(dy) ? "swipe" : dy > 0 ? "down" : "none";
      }
      if (g.type === "pan") { zx = g.zx0 + dx; zy = g.zy0 + dy; applyZoom(0); }
      else if (g.type === "swipe") {
        const edge = (dx > 0 && idx === 0) || (dx < 0 && idx === order.length - 1);
        setStage(edge ? dx * .3 : dx, 0); // résistance au bout de la série
      } else if (g.type === "down") {
        const k = Math.max(0, dy);
        sCur.s.style.transition = "none";
        sCur.s.style.transform = `translate3d(${dx * .5}px, ${k}px, 0) scale(${1 - Math.min(k / H, 1) * .25})`;
        bg.style.opacity = String(Math.max(0, 1 - k / (H * .6)));
        ui.forEach((el) => (el.style.opacity = String(Math.max(0, 1 - k / 120))));
      }
    });
    const velocity = (h) => {
      const a = h[0], b = h[h.length - 1], dt = Math.max(1, b.t - a.t);
      return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
    };
    const endGesture = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (!g) return;
      if (g.type === "pinch") {
        if (pts.size === 0) {
          if (zs < 1.05) { zs = 1; zx = 0; zy = 0; }
          else zs = Math.min(MAX_ZOOM, zs);
          clampZoom(); applyZoom(reduce ? 0 : 280);
          g = null;
        }
        return;
      }
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      const { vx, vy } = velocity(g.hist);
      if (g.type === "pending") {
        // tap : double-tap = zoom ; tap à côté de la photo = fermer
        const now = performance.now();
        if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
          lastTap = null;
          if (zs > 1) { zs = 1; zx = 0; zy = 0; applyZoom(reduce ? 0 : 300); }
          else zoomAt(e.clientX, e.clientY, 2.5, reduce ? 0 : 300);
        } else {
          lastTap = { t: now, x: e.clientX, y: e.clientY };
          if (zs === 1 && !onImage(e.clientX, e.clientY)) { lastTap = null; close(); }
        }
      } else if (g.type === "pan") {
        clampZoom(); applyZoom(reduce ? 0 : 300);
      } else if (g.type === "swipe") {
        if ((dx < -W * .2 || vx < -.45) && idx < order.length - 1) go(1);
        else if ((dx > W * .2 || vx > .45) && idx > 0) go(-1);
        else setStage(0, reduce ? 0 : 300);
      } else if (g.type === "down") {
        if (dy > 110 || vy > .5) close();
        else {
          sCur.s.style.transition = reduce ? "none" : `transform 300ms ${EASE}`;
          sCur.s.style.transform = "none";
          bg.style.opacity = ""; ui.forEach((el) => (el.style.opacity = ""));
        }
      }
      g = null;
    };
    stage.addEventListener("pointerup", endGesture);
    stage.addEventListener("pointercancel", endGesture);
  }
})();
