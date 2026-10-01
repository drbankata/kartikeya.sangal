/* =====================================================================
   DR KARTIKEYA SANGAL — site script (no libraries, no build step)
   Progressive enhancement: the site reads fine without JavaScript.
   ===================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- SETTINGS (edit here) ----------
     WHATSAPP : Dr Sangal's WhatsApp number, digits only, with country code.
     GOOGLE_FORM : appointment requests are sent straight to a Google Form (and its Google Sheet)
        action : the form's "formResponse" URL, e.g. https://docs.google.com/forms/d/e/FORM_ID/formResponse
        fields : map of our field names -> the form's entry ids (entry.123456789)
        Leave action empty ("") and the form opens WhatsApp with the details filled in instead.
     CAL_URL : Cal.com booking page, e.g. https://cal.com/yourname/consultation
        Leave empty ("") and the page shows a "slot booking opening soon" card instead of the calendar. */
  var WHATSAPP = "919899352267";
  var GOOGLE_FORM = {
    action: "", // DISCONNECTED on purpose until Dr Sangal's own Google Form exists (see TODO-details.md). Empty = form opens WhatsApp.
    fields: { name: "entry.1693713653", phone: "entry.864078726", email: "entry.1653371526", location: "entry.726174552", date: "entry.1627332851", concern: "entry.168266271", message: "entry.1382283897" }
  };
  var CAL_URL = "";

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var ICON_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg><span class="sr-only">Open menu</span>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg><span class="sr-only">Close menu</span>';
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.innerHTML = open ? ICON_CLOSE : ICON_OPEN;
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- Header shadow, progress bar, back-to-top, WhatsApp button ---------- */
  var header = document.querySelector(".site-header");
  var bar = document.querySelector(".progress");
  var toTop = document.querySelector(".to-top");
  var wa = document.querySelector(".wa");
  var onScroll = function () {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (bar) {
      var h = document.body.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    if (toTop) toTop.classList.toggle("show", y > 900);
    if (wa) wa.classList.toggle("show", y > 500);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------- YouTube facade: loads the player only when the visitor clicks play ---------- */
  document.querySelectorAll("[data-yt]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + btn.getAttribute("data-yt") + "?autoplay=1&rel=0";
      f.title = btn.getAttribute("data-title") || "Video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.allowFullscreen = true;
      btn.replaceWith(f);
    });
  });

  /* ---------- Cal.com embed ---------- */
  var calHost = document.getElementById("cal-embed");
  if (calHost && CAL_URL) {
    calHost.innerHTML = '<div class="calbox"><iframe src="' + CAL_URL + (CAL_URL.indexOf("?") > -1 ? "&" : "?") +
      'embed=true&theme=light" title="Book an appointment with Dr Kartikeya Sangal" loading="lazy"></iframe></div>';
  }
  document.querySelectorAll("[data-cal-link]").forEach(function (a) { if (CAL_URL) a.href = CAL_URL; });

  /* ---------- Appointment request form ---------- */
  var form = document.querySelector("form[data-appointment]");
  if (form) {
    var note = form.querySelector(".form-note");
    var say = function (m, bad) { if (note) { note.textContent = m; note.style.color = bad ? "#b3261e" : ""; } };
    var val = function (n) { var f = form.elements[n]; return f ? (f.value || "").trim() : ""; };
    var waText = function () {
      var lines = ["Hello Dr Sangal, I would like to request an appointment."];
      [["name", "Name"], ["phone", "Phone"], ["email", "Email"], ["location", "Preferred centre"], ["date", "Preferred date"], ["concern", "Concern"], ["message", "Notes"]]
        .forEach(function (p) { if (val(p[0])) lines.push(p[1] + ": " + val(p[0])); });
      return lines.join("\n");
    };
    var openWhatsApp = function () { window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(waText()), "_blank", "noopener"); };

    // minimum date = today
    var dateField = form.elements.date;
    if (dateField) dateField.min = new Date().toISOString().slice(0, 10);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (GOOGLE_FORM.action) {
        var body = new URLSearchParams();
        Object.keys(GOOGLE_FORM.fields).forEach(function (k) {
          var id = GOOGLE_FORM.fields[k], v = val(k);
          if (!id || (!v && k !== "location")) return;
          if (k === "date") { var d = v.split("-"); body.append(id + "_year", d[0]); body.append(id + "_month", d[1]); body.append(id + "_day", d[2]); }
          else body.append(id, v || "No preference");
        });
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        say("Sending your request…");
        fetch(GOOGLE_FORM.action, { method: "POST", mode: "no-cors", body: body })
          .then(function () { form.reset(); say("Thank you. Your request has reached Dr Sangal's team and we will call you to confirm a time."); })
          .catch(function () { say("We could not send that just now. Opening WhatsApp so you can reach us directly.", true); openWhatsApp(); })
          .then(function () { if (btn) btn.disabled = false; });
      } else {
        say("Thank you. WhatsApp is opening with your details ready to send.");
        openWhatsApp();
      }
    });
    var waBtn = form.querySelector("[data-wa]");
    if (waBtn) waBtn.addEventListener("click", function (e) { e.preventDefault(); openWhatsApp(); });
  }
})();
