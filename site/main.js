(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Nav background once the hero has scrolled past its top edge.
  const nav = document.querySelector(".nav");
  const hero = document.querySelector(".hero");
  new IntersectionObserver(([e]) => nav.classList.toggle("is-scrolled", !e.isIntersecting), {
    rootMargin: "-80px 0px 0px 0px",
    threshold: 0.92,
  }).observe(hero);

  // Mobile menu.
  const menuBtn = document.querySelector(".nav__menu");
  const menu = document.getElementById("mobile-menu");
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuBtn.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  // Scroll reveals.
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

  // Service panels: hover/focus opens one panel at a time.
  const panels = [...document.querySelectorAll(".panel")];
  const open = (p) => panels.forEach((x) => x.classList.toggle("is-open", x === p));
  panels.forEach((p) => {
    p.addEventListener("mouseenter", () => open(p));
    p.addEventListener("focus", () => open(p));
    p.addEventListener("click", () => open(p));
  });

  // Ambient loops (showreel background, destination reels): only play while on screen, never under reduced motion.
  const loops = [...document.querySelectorAll("[data-autoplay]")];
  const loopIO = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (reduce.matches) return;
      if (isIntersecting) {
        if (v.preload === "none") { v.preload = "auto"; v.load(); }
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  loops.forEach((v) => loopIO.observe(v));

  // Video testimonials: silent preview on hover (or when centred on touch screens),
  // tap/click/Enter restarts that clip with sound. Captions are drawn from the VTT track.
  const clips = [...document.querySelectorAll(".clip")];
  const canHover = window.matchMedia("(hover: hover)").matches;
  const clipVideo = (c) => c.querySelector("video");
  const stopClip = (c) => {
    const v = clipVideo(c);
    v.pause();
    v.muted = true;
    c.classList.remove("is-playing", "is-unmuted");
  };
  const preview = (c) => {
    if (reduce.matches || c.classList.contains("is-unmuted")) return;
    clipVideo(c).play().then(() => c.classList.add("is-playing")).catch(() => {});
  };
  const toggleSound = (c) => {
    const v = clipVideo(c);
    if (c.classList.contains("is-unmuted") && !v.paused) return stopClip(c);
    clips.forEach((o) => o !== c && stopClip(o));
    v.muted = false;
    v.currentTime = 0;
    v.play().then(() => c.classList.add("is-playing", "is-unmuted")).catch(() => {});
  };
  clips.forEach((c) => {
    const v = clipVideo(c);
    const cap = c.querySelector(".clip__cap");
    const track = v.textTracks[0];
    if (track) {
      track.mode = "hidden";
      track.addEventListener("cuechange", () => {
        const cue = track.activeCues && track.activeCues[0];
        cap.textContent = cue ? cue.text : "";
      });
    }
    v.addEventListener("ended", () => stopClip(c));
    c.addEventListener("click", () => toggleSound(c));
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSound(c); }
    });
    if (canHover) {
      c.addEventListener("mouseenter", () => preview(c));
      c.addEventListener("mouseleave", () => { if (!c.classList.contains("is-unmuted")) stopClip(c); });
    }
  });
  // Stop sound when a clip scrolls away; on touch screens, preview whichever clip is in view.
  const clipIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return stopClip(e.target);
      if (!canHover && e.intersectionRatio > 0.75) preview(e.target);
    });
  }, { threshold: [0, 0.75] });
  clips.forEach((c) => clipIO.observe(c));

  // Full reel player.
  const dialog = document.querySelector(".player");
  const video = dialog.querySelector("video");
  document.querySelectorAll("[data-play]").forEach((btn) => {
    btn.addEventListener("click", () => {
      clips.forEach(stopClip);
      dialog.classList.toggle("is-portrait", btn.hasAttribute("data-portrait"));
      video.poster = btn.dataset.poster || "";
      video.src = btn.dataset.play;
      dialog.showModal();
      loops.forEach((v) => v.pause());
      video.play().catch(() => {});
    });
  });
  const closePlayer = () => dialog.close();
  dialog.querySelector(".player__close").addEventListener("click", closePlayer);
  dialog.addEventListener("click", (e) => { if (e.target === dialog) closePlayer(); });
  dialog.addEventListener("close", () => {
    video.pause();
    video.removeAttribute("src");
    video.load();
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
