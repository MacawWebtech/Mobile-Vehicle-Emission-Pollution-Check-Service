/* ==========================================================================
   Clearway — dashboard.js  (customer portal behaviour; loads after main.js)
   --------------------------------------------------------------------------
   01. Skeleton loaders  — [data-skeleton] gets .is-loaded after "fetch"
   02. Toasts            — any [data-demo-toast="message"] button
   03. Renewal countdowns — [data-due-days] cards: days left, bar, badge
   04. Bookings table    — status chips + search
   05. Certificate QR modal
   06. Booking stepper   — vehicle → address → slot → payment
   07. Settings          — theme mode + RTL language demo
   TODO: replace the demo timeouts with real API calls (fetch) — search
   for "API:" comments below.
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const fmt = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  /* 01. SKELETONS -------------------------------------------------------- */
  // API: call your endpoint, render rows, then add .is-loaded.
  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 150 : 750;
  $$("[data-skeleton]").forEach((el, i) => {
    el.setAttribute("aria-busy", "true");
    setTimeout(() => { el.classList.add("is-loaded"); el.setAttribute("aria-busy", "false"); }, delay + i * 120);
  });

  /* 02. TOASTS ----------------------------------------------------------- */
  window.cwToast = function (msg) {
    const el = $("#cwToast");
    if (!el || !window.bootstrap) return;
    $("#cwToastMsg").textContent = msg;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 3200 }).show();
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-demo-toast]");
    if (b) window.cwToast(b.dataset.demoToast);
  });

  /* 03. COUNTDOWNS --------------------------------------------------------
     data-due-days = days until expiry (negative = expired), relative to
     today, so the demo never goes stale. API: compute from real expiry.  */
  $$("[data-due-days]").forEach((card) => {
    const days = parseInt(card.dataset.dueDays, 10);
    const total = parseInt(card.dataset.totalDays || "182", 10);
    const due = new Date(); due.setDate(due.getDate() + days);
    const used = Math.min(100, Math.max(0, Math.round(((total - Math.max(days, 0)) / total) * 100)));
    const state = days < 0 ? "expired" : days <= 30 ? "due" : "valid";
    card.classList.remove("is-due", "is-expired");
    if (state !== "valid") card.classList.add("is-" + state);
    const num = $("[data-days]", card); if (num) num.textContent = Math.abs(days);
    const lbl = $("[data-days-label]", card); if (lbl) lbl.textContent = days < 0 ? "days overdue" : days === 1 ? "day left" : "days left";
    const bar = $(".cw-progress", card);
    if (bar) { bar.setAttribute("aria-valuenow", used); bar.querySelector("i").style.width = used + "%"; }
    const dd = $("[data-due-date]", card); if (dd) dd.textContent = (days < 0 ? "Expired " : "Expires ") + fmt(due);
    const badge = $("[data-due-badge]", card);
    if (badge) {
      badge.className = "cw-badge badge-" + state;
      badge.textContent = state === "expired" ? "Expired" : state === "due" ? "Due soon" : "Valid";
    }
  });

  /* 04. BOOKINGS FILTER -------------------------------------------------- */
  const table = $("#bookingsTable");
  if (table) {
    const search = $("#bkSearch"); const chips = $$("[data-status-filter]");
    const rows = $$("tbody.real-view tr", table); const empty = $("#bkEmpty"); const count = $("#bkCount");
    let status = "all";
    const run = () => {
      const q = (search.value || "").trim().toLowerCase().replace(/\s+/g, "");
      let n = 0;
      rows.forEach((r) => {
        const ok = (status === "all" || r.dataset.status === status) && (!q || r.textContent.toLowerCase().replace(/\s+/g, "").includes(q));
        r.hidden = !ok; if (ok) n++;
      });
      empty.hidden = n !== 0;
      count.textContent = `Showing ${n} of ${rows.length} bookings`;
    };
    chips.forEach((c) => c.addEventListener("click", () => {
      status = c.dataset.statusFilter;
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      run();
    }));
    search.addEventListener("input", run);
    const q = new URLSearchParams(location.search).get("q"); if (q) search.value = q;
    run();
  }

  /* 05. QR MODAL --------------------------------------------------------- */
  const qrModal = $("#qrModal");
  if (qrModal) {
    qrModal.addEventListener("show.bs.modal", (e) => {
      const btn = e.relatedTarget; if (!btn) return;
      $("#qrPlate").textContent = btn.dataset.plate;
      $("#qrCert").textContent = btn.dataset.cert;
      // API: render a real QR (e.g. qrcode.js) for https://verify.example.com/{cert}
      const svg = $("#qrBox svg");
      if (svg) {
        svg.setAttribute("aria-label", "QR code to verify certificate " + btn.dataset.cert);
        // Shuffle a few modules so each certificate's demo code looks different.
        let seed = Array.from(btn.dataset.cert).reduce((a, ch) => a + ch.charCodeAt(0), 0);
        $$("g rect", svg).forEach((r) => { seed = (seed * 9301 + 49297) % 233280; r.style.opacity = seed / 233280 > 0.18 ? 1 : 0; });
      }
    });
  }

  /* 06. BOOKING STEPPER -------------------------------------------------- */
  const form = $("#bookingForm");
  if (form) {
    const panes = $$(".cw-step-pane", form);
    const inds = $$("[data-step-ind]");
    const back = $("#stepBack"), next = $("#stepNext"), submit = $("#stepSubmit");
    const names = ["Vehicle", "Address", "Slot", "Payment"];
    let step = 1;

    // Build next-7-days date chips
    const chipsBox = $("#dateChips");
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i + 1);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const wrap = document.createElement("div"); wrap.className = "cw-option";
      const lbl = i === 0 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" });
      wrap.innerHTML = `<input type="radio" name="date" id="d-${iso}" value="${iso}" required data-msg-required="Pick a day for the visit." ${i === 0 ? "checked" : ""}>
        <label for="d-${iso}"><small>${lbl}</small><strong>${d.getDate()}</strong><small>${d.toLocaleDateString("en-IN", { month: "short" })}</small></label>`;
      chipsBox.appendChild(wrap);
    }

    // Prefill from ?vehicle=bike|car|commercial&date=YYYY-MM-DD
    const params = new URLSearchParams(location.search);
    const vMap = { bike: "v-bike1", car: "v-car1", commercial: "v-van1" };
    if (vMap[params.get("vehicle")]) $("#" + vMap[params.get("vehicle")]).checked = true;
    if (params.get("date")) { const d = $(`#d-${params.get("date")}`); if (d) d.checked = true; }
    if (params.get("pincode")) $("#naPin").value = params.get("pincode");

    const toggleNew = () => {
      const nv = $("#newVehicle"), na = $("#newAddress");
      nv.hidden = !$("#v-new").checked; na.hidden = !$("#a-new").checked;
      $$("input, select", nv).forEach((el) => { el.disabled = nv.hidden; });
      $$("input, select", na).forEach((el) => { el.disabled = na.hidden; });
      const pm = ($("input[name=payMethod]:checked") || {}).value;
      $("#stripeBox").hidden = pm !== "card"; $("#paypalBox").hidden = pm !== "paypal";
    };
    const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");
    const summary = () => {
      const v = $("input[name=vehicleSel]:checked");
      let price = v ? +v.dataset.price : 0; let vLabel = v ? v.dataset.label : "—";
      if (v && v.value === "new") {
        const opt = $("#nvType").selectedOptions[0];
        if (opt && opt.dataset.price) price = +opt.dataset.price;
        vLabel = ($("#nvNumber").value || "New vehicle").toUpperCase();
      } else if (v) { vLabel += " · " + v.nextElementSibling.querySelector(".plate").textContent; }
      const a = $("input[name=addressSel]:checked");
      const d = $("input[name=date]:checked"); const s = $("input[name=slot]:checked");
      const p = $("input[name=payMethod]:checked");
      $("#sumVehicle").textContent = vLabel;
      $("#sumAddress").textContent = a ? (a.value === "new" ? ($("#naLine").value || "New address") : a.dataset.label) : "—";
      $("#sumSlot").textContent = d && s ? `${new Date(d.value + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${s.value}` : "—";
      $("#sumPay").textContent = p ? p.dataset.label : "—";
      $("#sumFee").textContent = rupee(price); $("#sumTotal").textContent = rupee(price);
    };
    const show = (n) => {
      step = n;
      panes.forEach((p) => p.classList.toggle("is-active", +p.dataset.step === n));
      inds.forEach((li) => {
        const i = +li.dataset.stepInd;
        li.classList.toggle("active", i === n); li.classList.toggle("done", i < n);
        if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
      back.disabled = n === 1; next.hidden = n === 4; submit.hidden = n !== 4;
      $("#stepAnnounce").textContent = `Step ${n} of 4: ${names[n - 1]}`;
      const legend = $(`.cw-step-pane[data-step="${n}"] legend`);
      if (legend) { legend.setAttribute("tabindex", "-1"); legend.focus({ preventScroll: true }); }
      form.closest(".cw-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    form.addEventListener("change", () => { toggleNew(); summary(); });
    form.addEventListener("input", summary);
    next.addEventListener("click", () => {
      const pane = $(`.cw-step-pane[data-step="${step}"]`);
      if (window.cwValidateScope(pane)) show(step + 1);
    });
    back.addEventListener("click", () => show(Math.max(1, step - 1)));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!window.cwValidateScope($('.cw-step-pane[data-step="4"]'))) return;
      // API: POST booking { vehicle, address, date, slot, payMethod } then redirect to payment (Stripe Checkout / PayPal) if needed.
      const id = "BK-" + (30500 + Math.floor(Math.random() * 400));
      $("#doneId").textContent = id;
      $("#doneText").textContent = `${$("#sumSlot").textContent} · ${$("#sumVehicle").textContent}. We'll WhatsApp your technician's details.`;
      form.hidden = true; $(".cw-stepper").hidden = true;
      inds.forEach((li) => li.classList.add("done"));
      const done = $("#bookingDone"); done.hidden = false; done.focus();
      if (window.cwToast) window.cwToast("Booking confirmed: " + id);
    });
    toggleNew(); summary();
  }

  /* 07. SETTINGS --------------------------------------------------------- */
  const tc = $("#themeChoice");
  if (tc && window.cwSetTheme) {
    const cur = window.cwGetThemeMode();
    const r = $(`#tm-${cur}`); if (r) r.checked = true;
    tc.addEventListener("change", (e) => { window.cwSetTheme(e.target.value); window.cwToast && window.cwToast("Theme updated."); });
  }
  const lang = $("#lang");
  if (lang) {
    if (document.documentElement.getAttribute("dir") === "rtl") lang.value = "ar";
    lang.addEventListener("change", () => {
      const wantRtl = lang.value === "ar";
      const isRtl = document.documentElement.getAttribute("dir") === "rtl";
      if (wantRtl !== isRtl) { const t = $(".dir-toggle"); if (t) t.click(); }
      // TODO: load translated strings for the chosen language (i18n).
    });
  }
})();
