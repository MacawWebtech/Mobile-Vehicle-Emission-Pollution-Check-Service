/* ==========================================================================
   Clearway — main.js  (site-wide behaviour, no dependencies beyond Bootstrap)
   --------------------------------------------------------------------------
   01. Theme (dark / light, with system-preference detection)
   02. Direction (LTR / RTL) — swaps to Bootstrap's RTL build
   03. Header: scroll state, close mobile menu on link click
   04. Reveal-on-scroll + animated stat counters
   05. Friendly client-side form validation (+ Formspree/Netlify-ready submit)
   06. Pincode checker + quick booking availability (hero card)
   07. Coverage page search / city filter
   08. Password show/hide, Login ↔ Forgot password panels
   09. Coming-soon countdown, footer year
   NOTE: the theme/dir are applied as early as possible by a tiny inline
   script in <head> (see any page) to prevent a flash of the wrong theme.
   ========================================================================== */
(function () {
  "use strict";
  const root = document.documentElement;
  root.classList.remove("no-js");
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* 01. THEME ------------------------------------------------------------ */
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  function applyTheme(theme) {
    root.setAttribute("data-bs-theme", theme);
    $$(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("title", theme === "dark" ? "Light mode" : "Dark mode");
    });
  }
  applyTheme(store.get("cw-theme") || (media.matches ? "dark" : "light"));
  // Public helper (used by dashboard Settings): "light" | "dark" | "system"
  window.cwSetTheme = function (mode) {
    if (mode === "system") { try { localStorage.removeItem("cw-theme"); } catch (e) {} applyTheme(media.matches ? "dark" : "light"); }
    else { store.set("cw-theme", mode); applyTheme(mode); }
  };
  window.cwGetThemeMode = () => store.get("cw-theme") || "system";
  // Follow the OS setting live — until the visitor picks a theme themselves.
  media.addEventListener("change", (e) => { if (!store.get("cw-theme")) applyTheme(e.matches ? "dark" : "light"); });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-toggle");
    if (!btn) return;
    const next = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
    store.set("cw-theme", next);
    applyTheme(next);
  });

  /* 02. DIRECTION (RTL) --------------------------------------------------- */
  const BS_LTR = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
  const BS_RTL = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css";
  function applyDir(dir) {
    root.setAttribute("dir", dir);
    const link = $("#bootstrap-css");
    const want = dir === "rtl" ? BS_RTL : BS_LTR;
    if (link && link.getAttribute("href") !== want) {
      link.removeAttribute("integrity"); // TODO: add SRI hashes for both files if you self-host
      link.setAttribute("href", want);
    }
    $$(".dir-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(dir === "rtl"));
      btn.setAttribute("aria-label", dir === "rtl" ? "Switch to left-to-right layout" : "Switch to right-to-left layout");
      const lbl = btn.querySelector(".dir-label");
      if (lbl) lbl.textContent = dir === "rtl" ? "LTR" : "RTL";
    });
  }
  applyDir(store.get("cw-dir") || root.getAttribute("dir") || "ltr");
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".dir-toggle");
    if (!btn) return;
    const next = root.getAttribute("dir") === "rtl" ? "ltr" : "rtl";
    store.set("cw-dir", next);
    applyDir(next);
  });

  /* 03. HEADER ----------------------------------------------------------- */
  const header = $(".cw-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const collapseEl = $("#mainNav");
    $$("#mainNav .nav-link").forEach((a) => a.addEventListener("click", () => {
      if (collapseEl && collapseEl.classList.contains("show") && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
    }));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && collapseEl && collapseEl.classList.contains("show") && window.bootstrap) {
        bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
        $(".navbar-toggler")?.focus();
      }
    });
  }

  /* 04. REVEAL + COUNTERS ------------------------------------------------ */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = window.matchMedia("(max-width: 639.98px)").matches;
  if ("IntersectionObserver" in window && !reduceMotion && !isSmall) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-visible"));
  }
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split(".")[1] || "").length;
    if (reduceMotion) { el.textContent = target.toLocaleString("en-IN", { minimumFractionDigits: dec }); return; }
    const dur = 1400; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur); const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach((c) => co.observe(c));
  } else counters.forEach(runCounter);

  /* 05. FORM VALIDATION ---------------------------------------------------
     Usage: <form class="cw-validate" novalidate data-success="Message">
     Each field can carry data-msg-required / data-msg-pattern / data-msg-type
     etc. to override the friendly defaults below. A field's error text is
     written into the sibling .invalid-feedback (created if missing).
     Submitting: if the form has a real action (Formspree / Netlify), it is
     sent with fetch(); otherwise a demo success message is shown.          */
  const DEFAULT_MSG = {
    valueMissing: "Please fill this in — we need it to book your test.",
    typeMismatch: { email: "That email doesn't look right. Try name@example.com.", url: "Please enter a full web address." },
    patternMismatch: "Please check the format and try again.",
    tooShort: (el) => `Please use at least ${el.minLength} characters.`,
    rangeUnderflow: (el) => `Please choose ${el.min} or later.`,
    rangeOverflow: (el) => `Please choose ${el.max} or earlier.`,
    mismatch: "These don't match yet — please type it again."
  };
  function messageFor(el) {
    const v = el.validity;
    if (el.dataset.mismatch === "true") return el.dataset.msgMatch || DEFAULT_MSG.mismatch;
    if (v.valueMissing) return el.dataset.msgRequired || (el.type === "checkbox" ? "Please tick this box to continue." : DEFAULT_MSG.valueMissing);
    if (v.typeMismatch) return el.dataset.msgType || DEFAULT_MSG.typeMismatch[el.type] || DEFAULT_MSG.patternMismatch;
    if (v.patternMismatch) return el.dataset.msgPattern || DEFAULT_MSG.patternMismatch;
    if (v.tooShort) return el.dataset.msgShort || DEFAULT_MSG.tooShort(el);
    if (v.rangeUnderflow) return el.dataset.msgMin || DEFAULT_MSG.rangeUnderflow(el);
    if (v.rangeOverflow) return el.dataset.msgMax || DEFAULT_MSG.rangeOverflow(el);
    return el.validationMessage;
  }
  function feedbackEl(el) {
    const scope = el.closest(".cw-field") || el.parentElement;
    let fb = scope.querySelector(".invalid-feedback");
    if (!fb) { fb = document.createElement("div"); fb.className = "invalid-feedback"; scope.appendChild(fb); }
    if (!fb.id) fb.id = (el.id || el.name || "f" + Math.random().toString(36).slice(2)) + "-error";
    return fb;
  }
  function checkMatch(el) {
    if (!el.dataset.match) return;
    const other = document.getElementById(el.dataset.match);
    const bad = other && el.value && el.value !== other.value;
    el.dataset.mismatch = String(!!bad);
    el.setCustomValidity(bad ? "mismatch" : "");
  }
  window.cwValidateField = function (el) {
    checkMatch(el);
    const fb = feedbackEl(el);
    const ok = el.checkValidity();
    el.classList.toggle("is-invalid", !ok);
    el.setAttribute("aria-invalid", String(!ok));
    if (!ok) {
      fb.textContent = messageFor(el);
      fb.style.display = "block";
      const ids = new Set((el.getAttribute("aria-describedby") || "").split(" ").filter(Boolean));
      ids.add(fb.id); el.setAttribute("aria-describedby", Array.from(ids).join(" "));
    } else { fb.style.display = "none"; }
    return ok;
  };
  window.cwValidateScope = function (scope) {
    let firstBad = null;
    $$("input, select, textarea", scope).forEach((el) => {
      if (el.disabled || el.type === "hidden" || el.closest("[hidden]")) return;
      if (el.type === "radio") {
        const group = $$(`input[name="${el.name}"]`, scope).filter((r) => !r.disabled);
        if (group[0] !== el) return;
        const ok = group.some((r) => r.checked) || !group.some((r) => r.required);
        const box = el.closest("[data-radio-group]");
        const fb = box && box.querySelector(".invalid-feedback");
        if (fb) { fb.style.display = ok ? "none" : "block"; fb.textContent = el.dataset.msgRequired || "Please choose one option to continue."; }
        if (!ok && !firstBad) firstBad = el;
        return;
      }
      if (!window.cwValidateField(el) && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus({ preventScroll: false });
    return !firstBad;
  };
  function setStatus(form, type, text) {
    const st = $(".cw-form-status", form);
    if (!st) return;
    st.className = "cw-form-status is-" + type;
    st.innerHTML = `<i class="bi ${type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}" aria-hidden="true"></i><span>${text}</span>`;
    st.focus();
  }
  $$("form.cw-validate").forEach((form) => {
    form.setAttribute("novalidate", "");
    $$("input, select, textarea", form).forEach((el) => {
      el.addEventListener("blur", () => { if (el.value || el.classList.contains("is-invalid")) window.cwValidateField(el); });
      el.addEventListener("input", () => { if (el.classList.contains("is-invalid")) window.cwValidateField(el); });
      el.addEventListener("change", () => { if (el.classList.contains("is-invalid")) window.cwValidateField(el); });
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!window.cwValidateScope(form)) { setStatus(form, "error", "A few details need a quick fix — see the highlighted fields."); return; }
      const success = form.dataset.success || "Thanks! We've got your details.";
      const action = form.getAttribute("action");
      const btn = $("[type=submit]", form);
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Sending…'; }
      try {
        // TODO: set action="https://formspree.io/f/XXXX" (or use Netlify: data-netlify="true")
        if (action && /^https?:/.test(action) && !/YOUR_/.test(action)) {
          const res = await fetch(action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error("bad response");
        } else {
          await new Promise((r) => setTimeout(r, 700)); // demo mode
        }
        setStatus(form, "success", success);
        form.reset();
        $$(".is-invalid, .is-valid", form).forEach((el) => el.classList.remove("is-invalid", "is-valid"));
        if (form.dataset.redirect) setTimeout(() => { window.location.href = form.dataset.redirect; }, 900);
      } catch (err) {
        setStatus(form, "error", "We couldn't send that just now. Please try again, or call our helpline.");
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
      }
    });
  });

  /* 06. PINCODE + AVAILABILITY -------------------------------------------
     TODO: replace this demo list with your real serviceable pincodes,
     or call your booking API / calendar (Calendly, Cal.com) here.        */
  const SERVICEABLE = {
    "5600": "Bengaluru", "5601": "Bengaluru", "4000": "Mumbai", "4001": "Mumbai",
    "6000": "Chennai", "6001": "Chennai", "1100": "New Delhi", "1101": "New Delhi",
    "4110": "Pune", "5000": "Hyderabad", "1220": "Gurugram", "2013": "Noida"
  };
  window.cwLookupPincode = function (pin) {
    const p = String(pin || "").trim();
    if (!/^[1-9][0-9]{5}$/.test(p)) return { valid: false };
    const city = SERVICEABLE[p.slice(0, 4)];
    return { valid: true, served: !!city, city };
  };
  $$("[data-pincode-check]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("input", form);
      const out = $(".cw-availability", form) || $(form.dataset.pincodeCheck);
      const r = window.cwLookupPincode(input.value);
      if (!r.valid) {
        input.classList.add("is-invalid"); input.setAttribute("aria-invalid", "true");
        window.cwValidateField(input);
        out.className = "cw-availability"; return;
      }
      input.classList.remove("is-invalid"); input.setAttribute("aria-invalid", "false");
      const fb = form.querySelector(".invalid-feedback"); if (fb) fb.style.display = "none";
      out.className = "cw-availability " + (r.served ? "is-ok" : "is-no");
      out.innerHTML = r.served
        ? `<i class="bi bi-check-circle-fill" aria-hidden="true"></i><span>Good news — we cover <strong>${input.value}</strong> (${r.city}). <a href="dashboard-book.html?pincode=${input.value}">Book a doorstep test</a></span>`
        : `<i class="bi bi-hourglass-split" aria-hidden="true"></i><span>We're not in <strong>${input.value}</strong> yet. <a href="contact.html?topic=coverage&pincode=${input.value}">Ask us to notify you</a> when we launch there.</span>`;
    });
  });

  const quick = $("#quickBooking");
  if (quick) {
    const date = $("#qbDate", quick);
    const today = new Date(); const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    date.min = iso(today);
    const max = new Date(); max.setDate(max.getDate() + 30); date.max = iso(max);
    if (!date.value) { const t = new Date(); t.setDate(t.getDate() + 1); date.value = iso(t); }
    quick.addEventListener("submit", (e) => {
      e.preventDefault();
      const out = $("#qbResult");
      if (!window.cwValidateScope(quick)) { out.className = "cw-availability"; return; }
      const pin = $("#qbPincode", quick).value;
      const r = window.cwLookupPincode(pin);
      const vehicle = $("input[name=vehicle]:checked", quick).value;
      const d = new Date(date.value + "T00:00:00");
      const nice = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
      if (r.served) {
        // Demo: slot count derived from the date so it feels "live".
        const slots = 3 + (d.getDate() % 6);
        out.className = "cw-availability is-ok";
        out.innerHTML = `<i class="bi bi-calendar-check-fill" aria-hidden="true"></i><span><strong>${slots} slots open</strong> on ${nice} in ${r.city}. <a href="dashboard-book.html?vehicle=${vehicle}&pincode=${pin}&date=${date.value}">Pick a time →</a></span>`;
      } else {
        out.className = "cw-availability is-no";
        out.innerHTML = `<i class="bi bi-geo-alt" aria-hidden="true"></i><span>We don't serve ${pin} yet. <a href="coverage.html">See where we go</a> or <a href="contact.html?topic=coverage&pincode=${pin}">request your area</a>.</span>`;
      }
      out.setAttribute("tabindex", "-1"); out.focus();
    });
  }

  /* 07. COVERAGE FILTER -------------------------------------------------- */
  const cov = $("#coverageSearch");
  if (cov) {
    const groups = $$(".cw-city-group");
    const empty = $("#coverageEmpty");
    const count = $("#coverageCount");
    const chips = $$("[data-city-filter]");
    let city = "all";
    const run = () => {
      const q = cov.value.trim().toLowerCase();
      let shown = 0;
      groups.forEach((g) => {
        const cityOk = city === "all" || g.dataset.city === city;
        let n = 0;
        $$("li", g).forEach((li) => {
          const hit = cityOk && (!q || li.textContent.toLowerCase().includes(q) || g.dataset.city.includes(q));
          li.hidden = !hit; if (hit) n++;
        });
        g.hidden = n === 0; shown += n;
      });
      empty.hidden = shown !== 0;
      count.textContent = `${shown} area${shown === 1 ? "" : "s"} shown`;
    };
    cov.addEventListener("input", run);
    chips.forEach((c) => c.addEventListener("click", () => {
      city = c.dataset.cityFilter;
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      run();
    }));
    const pre = new URLSearchParams(location.search).get("q");
    if (pre) cov.value = pre;
    run();
  }

  /* 08. AUTH helpers ----------------------------------------------------- */
  $$(".pw-toggle").forEach((btn) => btn.addEventListener("click", () => {
    const input = document.getElementById(btn.getAttribute("aria-controls"));
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-pressed", String(show));
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    btn.querySelector(".bi").className = "bi " + (show ? "bi-eye-slash" : "bi-eye");
  }));
  $$("[data-show-panel]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.getElementById(a.dataset.showPanel);
    $$(".cw-auth-panel").forEach((p) => { p.hidden = p !== target; });
    const h = target.querySelector("h1, h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  }));
  if (location.hash === "#register") {
    const t = document.getElementById("register-tab"); if (t && window.bootstrap) bootstrap.Tab.getOrCreateInstance(t).show();
  }
  if (location.hash === "#forgot") { const a = $('[data-show-panel="panelForgot"]'); if (a) a.click(); }

  // Contact form: preselect topic from ?topic=… (e.g. links from Coverage or Careers)
  const topicSel = $("#cTopic");
  if (topicSel) { const t = new URLSearchParams(location.search).get("topic"); if (t && topicSel.querySelector(`option[value="${t}"]`)) topicSel.value = t; }

  /* 09. COUNTDOWN + YEAR ------------------------------------------------- */
  const cd = $("[data-countdown]");
  if (cd) {
    // TODO: set data-countdown="2026-12-01T09:00:00" to your launch date/time.
    let end = new Date(cd.dataset.countdown);
    if (isNaN(end) || end < new Date()) { end = new Date(); end.setDate(end.getDate() + 12); end.setHours(9, 0, 0, 0); }
    const set = (k, v) => { const el = cd.querySelector(`[data-unit=${k}]`); if (el) el.textContent = String(v).padStart(2, "0"); };
    const tick = () => {
      const ms = Math.max(0, end - new Date());
      set("d", Math.floor(ms / 864e5)); set("h", Math.floor(ms / 36e5) % 24);
      set("m", Math.floor(ms / 6e4) % 60); set("s", Math.floor(ms / 1e3) % 60);
    };
    tick(); setInterval(tick, 1000);
  }
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  /* 10. STORY CAROUSEL (about.html) — arrows for the swipeable milestone cards (mobile/tablet) */
  $$(".story-road").forEach((road) => {
    const stops = Array.from(road.children);
    if (stops.length < 2) return;
    const wrap = document.createElement("div");
    wrap.className = "story-controls";
    wrap.innerHTML =
      '<button type="button" class="story-arrow" data-dir="-1" aria-label="Previous milestone"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>' +
            '<button type="button" class="story-arrow" data-dir="1" aria-label="Next milestone"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>';
    road.after(wrap);
    road.setAttribute("tabindex", "0");
    const prev = wrap.querySelector('[data-dir="-1"]'), next = wrap.querySelector('[data-dir="1"]');
    let current = 0;
    const rtl = () => getComputedStyle(road).direction === "rtl";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const goTo = (i) => {
      i = Math.max(0, Math.min(stops.length - 1, i));
      // scroll only the carousel itself (never the page)
      const rr = road.getBoundingClientRect(), sr = stops[i].getBoundingClientRect();
      const delta = rtl() ? sr.right - rr.right : sr.left - rr.left;
      road.scrollBy({ left: delta, behavior: reduce ? "auto" : "smooth" });
    };
    const update = () => {
      const rr = road.getBoundingClientRect();
      const max = road.scrollWidth - road.clientWidth;
      const pos = Math.abs(road.scrollLeft);
      let idx = 0, best = Infinity;
      stops.forEach((st, i) => {
        const sr = st.getBoundingClientRect();
        const d = Math.abs((rtl() ? sr.right - rr.right : sr.left - rr.left));
        if (d < best) { best = d; idx = i; }
      });
      if (pos <= 2) idx = 0;
      if (max - pos <= 2) idx = stops.length - 1;
      current = idx;
      prev.disabled = pos <= 2; next.disabled = max - pos <= 2;
    };
    let raf = 0;
    road.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    prev.addEventListener("click", () => goTo(current - 1));
    next.addEventListener("click", () => goTo(current + 1));
    update();
  });
})();

/* 11. HOME 2 STATS SLIDER — one card at a time on phones */
(function () {
  document.querySelectorAll(".h2-stats[data-slider]").forEach((box) => {
    const cards = Array.from(box.children);
    if (cards.length < 2) return;
    const wrap = document.createElement("div");
    wrap.className = "h2-stats-controls";
    wrap.innerHTML = '<button type="button" class="story-arrow" data-dir="-1" aria-label="Previous stat"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>' +
      '<div class="h2-dots" aria-hidden="true">' + cards.map(() => "<i></i>").join("") + '</div>' +
      '<button type="button" class="story-arrow" data-dir="1" aria-label="Next stat"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>';
    box.after(wrap);
    box.setAttribute("tabindex", "0");
    const prev = wrap.querySelector('[data-dir="-1"]'), next = wrap.querySelector('[data-dir="1"]');
    const dots = wrap.querySelectorAll(".h2-dots i");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rtl = () => getComputedStyle(box).direction === "rtl";
    let cur = 0;
    const update = () => {
      const w = box.clientWidth || 1;
      cur = Math.max(0, Math.min(cards.length - 1, Math.round(Math.abs(box.scrollLeft) / (w + 12))));
      dots.forEach((d, i) => d.classList.toggle("is-on", i === cur));
      prev.disabled = cur === 0; next.disabled = cur === cards.length - 1;
    };
    const goTo = (i) => {
      i = Math.max(0, Math.min(cards.length - 1, i));
      box.scrollTo({ left: (rtl() ? -1 : 1) * i * (box.clientWidth + 12), behavior: reduce ? "auto" : "smooth" });
    };
    let raf = 0;
    box.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    prev.addEventListener("click", () => goTo(cur - 1));
    next.addEventListener("click", () => goTo(cur + 1));
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") goTo(cur + (rtl() ? -1 : 1));
      if (e.key === "ArrowLeft") goTo(cur + (rtl() ? 1 : -1));
    });
    update();
  });
})();
