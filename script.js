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
  const loader = document.getElementById("loader");
  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("is-done");
      document.body.classList.add("loaded");
      playHero();
    }, reduce ? 0 : 1300);
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
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
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
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
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
