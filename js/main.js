(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};

  /* ---------- text from config ---------- */
  document.querySelectorAll("[data-config]").forEach(function (el) {
    var key = el.getAttribute("data-config");
    if (cfg[key]) el.textContent = cfg[key];
  });

  /* ---------- maps button ---------- */
  var mapBtn = document.getElementById("map-btn");
  if (mapBtn) {
    var url = cfg.mapsUrl;
    if (!url) {
      var q = encodeURIComponent((cfg.venueName || "") + ", " + (cfg.venueAddress || ""));
      url = "https://www.google.com/maps/search/?api=1&query=" + q;
    }
    mapBtn.setAttribute("href", url);
  }

  /* ---------- calendar ---------- */
  (function buildCalendar() {
    var container = document.getElementById("calendar");
    var dtText = document.getElementById("calendar-datetime");
    if (!container) return;

    var parts = (cfg.eventDateShort || "").split(".");
    if (parts.length !== 3) return;
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    var year = parseInt(parts[2], 10);

    var weekdayLabels = ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жб"];
    var firstOfMonth = new Date(year, month, 1);
    var startIndex = (firstOfMonth.getDay() + 6) % 7; // Monday-first
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    var heartSvg =
      '<svg class="heart-mark" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 21s-8-4.6-8-10.4C4 6.8 6.6 4.4 9.6 4.4c1.7 0 3 .8 3.9 2 .9-1.2 2.2-2 3.9-2 3 0 5.6 2.4 5.6 6.2C21 16.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
      "</svg>";

    var html = '<div class="calendar-weekdays">';
    weekdayLabels.forEach(function (w) {
      html += "<div>" + w + "</div>";
    });
    html += '</div><div class="calendar-days">';

    for (var i = 0; i < startIndex; i++) {
      html += '<div class="calendar-cell calendar-cell--empty"></div>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var isEvent = d === day;
      html += '<div class="calendar-cell' + (isEvent ? " is-event" : "") + '">';
      if (isEvent) html += heartSvg;
      html += '<span class="day-num">' + (d < 10 ? "0" + d : d) + "</span></div>";
    }
    html += "</div>";
    container.innerHTML = html;

    if (dtText) {
      dtText.innerHTML = (cfg.eventDateLong || "") + "<br>Сағат " + (cfg.eventTime || "") + "-де";
    }
  })();

  /* ---------- photos: load real image, keep ornamental fallback on failure ---------- */
  document.querySelectorAll("[data-photo]").forEach(function (el) {
    var key = el.getAttribute("data-photo");
    var src = cfg.photos && cfg.photos[key];
    if (!src) return;
    var img = new Image();
    img.onload = function () {
      el.style.backgroundImage = 'url("' + src + '")';
    };
    img.onerror = function () {
      /* keep the CSS ornamental placeholder already applied */
    };
    img.src = src;
  });

  /* ---------- reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll(".reveal, .photo-frame");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- reveal on page load (hero) ---------- */
  window.addEventListener("load", function () {
    document.querySelectorAll(".reveal-load").forEach(function (el) {
      el.classList.add("in-view");
    });
  });
  // fallback in case 'load' already fired or is slow
  setTimeout(function () {
    document.querySelectorAll(".reveal-load").forEach(function (el) {
      el.classList.add("in-view");
    });
  }, 400);

  /* ---------- gentle parallax ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll(".photo-parallax"));
  var ticking = false;
  function updateParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var rect = el.parentElement.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var offset = (center - vh / 2) / vh; // -1..1 roughly
      var shift = Math.max(-1, Math.min(1, offset)) * 22;
      el.style.transform = "translateY(" + shift.toFixed(1) + "px)";
    });
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true }
  );
  updateParallax();

  /* ---------- music toggle ---------- */
  var musicBtn = document.getElementById("music-toggle");
  var audio = document.getElementById("bg-music");
  if (musicBtn && audio) {
    var disableMusic = function () {
      musicBtn.classList.add("is-disabled");
      musicBtn.classList.remove("is-playing");
      musicBtn.title = "Аудио файл табылмады";
    };

    function startPlayback(onFail) {
      if (musicBtn.classList.contains("is-disabled")) return;
      var settled = false;
      var safety = setTimeout(function () {
        if (!settled) { settled = true; (onFail || disableMusic)(); }
      }, 2500);
      audio.play().then(function () {
        if (settled) return;
        settled = true;
        clearTimeout(safety);
        musicBtn.classList.add("is-playing");
      }).catch(function () {
        if (settled) return;
        settled = true;
        clearTimeout(safety);
        (onFail || disableMusic)();
      });
    }

    if (cfg.musicSrc) {
      var src = document.createElement("source");
      src.src = cfg.musicSrc;
      src.type = "audio/mpeg";
      audio.appendChild(src);
      audio.load();
    } else {
      disableMusic();
    }
    audio.addEventListener("error", disableMusic, true);

    musicBtn.addEventListener("click", function () {
      if (musicBtn.classList.contains("is-disabled")) return;
      if (audio.paused) {
        startPlayback();
      } else {
        audio.pause();
        musicBtn.classList.remove("is-playing");
      }
    });

    // Browsers block audio autoplay without a user gesture, so try right
    // away and, if blocked, start on the guest's very first tap/scroll/key —
    // the button still works normally to pause/resume at any time.
    startPlayback(function () {
      var events = ["pointerdown", "touchstart", "keydown", "wheel"];
      function onFirstInteract() {
        events.forEach(function (ev) { window.removeEventListener(ev, onFirstInteract); });
        startPlayback();
      }
      events.forEach(function (ev) {
        window.addEventListener(ev, onFirstInteract, { passive: true, once: true });
      });
    });
  }

  /* ---------- RSVP ---------- */
  var openBtn = document.getElementById("rsvp-open");
  var form = document.getElementById("rsvp-form");
  var thanks = document.getElementById("rsvp-thanks");
  var thanksText = document.getElementById("rsvp-thanks-text");

  if (openBtn && form) {
    openBtn.addEventListener("click", function () {
      form.hidden = false;
      openBtn.hidden = true;
      var firstInput = form.querySelector("input[name='name']");
      if (firstInput) firstInput.focus();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var phone = (data.get("phone") || "").toString().trim();
      var attending = data.get("attending");
      var guests = data.get("guests");

      if (!name || !phone) return;

      if (cfg.rsvpWhatsapp) {
        var lines = [
          "Қатысуды растау / RSVP",
          "Аты-жөні: " + name,
          "Қатысады: " + (attending === "yes" ? "Иә, қатысамын" : "Жоқ, қатыса алмаймын"),
          "Қонақ саны: " + guests,
          "Телефон: " + phone,
        ];
        var waUrl = "https://wa.me/" + cfg.rsvpWhatsapp + "?text=" + encodeURIComponent(lines.join("\n"));
        window.open(waUrl, "_blank", "noopener");
      }

      form.hidden = true;
      thanks.hidden = false;
      if (thanksText) {
        thanksText.textContent =
          attending === "no"
            ? "Хабарлағаныңызға рахмет!"
            : "Келетініңізге қуаныштымыз!";
      }
    });
  }

  /* ---------- gentle auto-scroll (stops on any user interaction) ---------- */
  (function autoScroll() {
    var SPEED = 42; // px / second — gentle, video-like pace
    var START_DELAY = 1800; // let the hero reveal play first
    var rafId = null;
    var lastTime = null;
    var stopped = false;

    function stop() {
      if (stopped) return;
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", onKey);
    }

    function onKey(e) {
      var keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
      if (keys.indexOf(e.key) !== -1) stop();
    }

    function step(timestamp) {
      if (stopped) return;
      if (lastTime === null) lastTime = timestamp;
      var dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 2) {
        stop();
        return;
      }
      window.scrollBy(0, SPEED * dt);
      rafId = requestAnimationFrame(step);
    }

    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("pointerdown", stop, { passive: true });
    window.addEventListener("keydown", onKey);

    setTimeout(function () {
      if (!stopped) rafId = requestAnimationFrame(step);
    }, START_DELAY);
  })();
})();
