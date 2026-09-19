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
        var settled = false;
        var safety = setTimeout(function () {
          if (!settled) { settled = true; disableMusic(); }
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
          disableMusic();
        });
      } else {
        audio.pause();
        musicBtn.classList.remove("is-playing");
      }
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
})();
