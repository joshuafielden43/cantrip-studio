/**
 * Fortune Cookie — static SPA (working title: Fortune Cookie Workshop)
 * Fortune in location.hash: #v1. + base64url(UTF-8 JSON { t: string })
 * No accounts/DB. OG meta stays generic (never writes fortune into head).
 * fortune-wafer + viewport tray-well (review). Starters v0.4 lowercase blanks. Single-surface crack (~320ms), peek default off.
 */
(function () {
  "use strict";

  var MAX_LEN = 180;
  var FILTER_DEBOUNCE_MS = 280;
  var HASH_PREFIX = "v1.";
  var SLIP_W = 1080;
  var SLIP_H = 1350;
  var MARK_SRC = "/assets/logo-10hi-mark.png";
  var WAFER_CRACKED_SRC = "/fortune-cookie/assets/fortune-wafer-cracked.png";
  var WAFER_CLOSED_SRC = "/fortune-cookie/assets/fortune-wafer-closed.png";
  var FILTER_MSG = "Keep it friendly—please change this wording.";
  var LEDE_CREATE = "One fortune. One person. Crack when they’re ready.";
  var CRACK_MS = 320;

  var fortune = "";
  var packedFortune = "";
  var filterOk = true;
  var filterTimer = null;
  var toastTimer = null;
  var crackTimer = null;
  var markImg = null;
  var waferCrackedImg = null;

  var $ = function (id) { return document.getElementById(id); };

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Strip {{blank}} markers → plain lowercase tokens (hash / textarea / filter). */
  function plainBlanks(text) {
    return String(text || "").replace(/\{\{([A-Za-z0-9'’\-]+)\}\}/g, "$1");
  }

  /** Render {{them}} markers as lowercase blank-color highlights (Writer v0.4). */
  function formatBlanksHtml(text) {
    var s = String(text || "");
    var out = "";
    var re = /\{\{([A-Za-z0-9'’\-]+)\}\}/g;
    var last = 0;
    var m;
    while ((m = re.exec(s))) {
      out += escapeHtml(s.slice(last, m.index));
      out += '<strong class="blank">' + escapeHtml(String(m[1]).toLowerCase()) + "</strong>";
      last = m.index + m[0].length;
    }
    out += escapeHtml(s.slice(last));
    return out;
  }


  function isCoarsePointer() {
    try {
      return window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;
    } catch (e) {
      return "ontouchstart" in window;
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function closedHint() {
    return isCoarsePointer() ? "Tap to crack" : "Click to crack";
  }

  function setMode(mode) {
    document.documentElement.setAttribute("data-mode", mode);
    var create = $("panel-create");
    var closed = $("panel-closed");
    var cracking = $("panel-cracking");
    var revealed = $("panel-revealed");
    if (create) create.hidden = mode !== "create";
    if (closed) closed.hidden = mode !== "closed";
    if (cracking) cracking.hidden = mode !== "cracking";
    if (revealed) revealed.hidden = mode !== "revealed";

    var lede = $("lede");
    if (lede) {
      lede.textContent = LEDE_CREATE;
    }

    if (mode === "closed") {
      var prompt = $("receive-prompt");
      if (prompt) prompt.textContent = closedHint();
      var hit = $("cookie-hit");
      if (hit) hit.setAttribute("aria-label", closedHint());
    }
  }

  function showToast(msg, isError) {
    var el = $("toast");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-error", !!isError);
    clearTimeout(toastTimer);
    if (msg) {
      toastTimer = setTimeout(function () {
        el.textContent = "";
        el.classList.remove("is-error");
      }, 4200);
    }
  }

  function utf8ToBase64Url(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToUtf8(s) {
    var b64 = String(s || "").replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function encodeFortune(text) {
    var payload = JSON.stringify({ t: String(text || "").trim() });
    return HASH_PREFIX + utf8ToBase64Url(payload);
  }

  function decodeFortuneFromHash(hash) {
    var raw = String(hash || "").replace(/^#/, "");
    if (!raw) return null;
    if (raw.indexOf(HASH_PREFIX) !== 0) throw new Error("bad-prefix");
    var body = raw.slice(HASH_PREFIX.length);
    if (!body) throw new Error("empty");
    var obj = JSON.parse(base64UrlToUtf8(body));
    if (!obj || typeof obj.t !== "string") throw new Error("shape");
    var t = obj.t.trim();
    if (!t) throw new Error("empty-text");
    if (t.length > MAX_LEN) t = t.slice(0, MAX_LEN);
    return t;
  }

  function shareUrlFor(text) {
    return location.origin + location.pathname + "#" + encodeFortune(text);
  }

  /* Filter: basic profanity + hate only (writer/FILTER-POLICY.md · Joshua 2026-09-22).
     Reuses SHIFilter/obscenity as a narrow gate — not topic/tone policing. Grownups. */
  function runFilter(text) {
    var F = window.SHIFilter;
    if (!F || typeof F.checkInvitation !== "function") {
      return { ok: true, matches: [] };
    }
    return F.checkInvitation(text);
  }

  function hideLinkBlock() {
    packedFortune = "";
    var block = $("link-block");
    if (block) block.hidden = true;
    var hint = $("share-url-hint");
    if (hint) {
      hint.hidden = true;
      hint.textContent = "";
    }
  }

  function applyFilterUI(result) {
    filterOk = !!(result && result.ok);
    var ta = $("custom");
    var msg = $("filter-msg");
    if (ta) ta.classList.toggle("is-flagged", !filterOk);
    if (msg) {
      msg.hidden = filterOk;
      msg.textContent = filterOk
        ? ""
        : ((window.SHIFilter && window.SHIFilter.FILTER_MESSAGE) || FILTER_MSG);
    }
    if (!filterOk || fortune.trim() !== packedFortune) hideLinkBlock();
    updateMakeEnabled();
  }

  function scheduleFilter() {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(function () {
      applyFilterUI(runFilter(plainBlanks(fortune)));
    }, FILTER_DEBOUNCE_MS);
  }

  function updateMakeEnabled() {
    var plain = plainBlanks(fortune).trim();
    var ok = !!plain && filterOk && plain.length <= MAX_LEN;
    var makeBtn = $("btn-make");
    if (makeBtn) makeBtn.disabled = !ok;
  }

  function updatePeekPreview() {
    var peek = $("peek-slip");
    var preview = $("peek-slip-preview");
    var textEl = $("peek-slip-text");
    if (!peek || !preview || !textEl) return;
    var on = !!peek.checked;
    var t = fortune.trim();
    if (on && plainBlanks(t)) {
      textEl.innerHTML = formatBlanksHtml(t);
      preview.hidden = false;
    } else {
      textEl.innerHTML = "";
      preview.hidden = true;
    }
  }

  function setFortune(text, opts) {
    opts = opts || {};
    fortune = String(text || "").slice(0, MAX_LEN);
    var ta = $("custom");
    var count = $("char-count");
    var plain = plainBlanks(fortune);
    if (ta && opts.syncTextarea !== false) {
      if (ta.value !== plain) ta.value = plain;
    }
    if (count) count.textContent = plain.length + " / " + MAX_LEN;

    var chips = document.querySelectorAll(".chip");
    for (var i = 0; i < chips.length; i++) {
      var c = chips[i];
      c.classList.toggle("is-selected", c.getAttribute("data-fortune") === fortune);
    }

    if (opts.skipFilter) {
      filterOk = true;
      applyFilterUI({ ok: true, matches: [] });
    } else {
      if (fortune.trim() !== packedFortune) hideLinkBlock();
      scheduleFilter();
    }
    updateMakeEnabled();
    updatePeekPreview();
  }

  function buildChips() {
    var host = $("chips");
    if (!host) return;
    host.innerHTML = "";
    var list = window.FC_STARTERS || [];
    for (var i = 0; i < list.length; i++) {
      (function (text) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.setAttribute("data-fortune", text);
        btn.innerHTML = formatBlanksHtml(text);
        btn.addEventListener("click", function () {
          setFortune(text);
        });
        host.appendChild(btn);
      })(list[i]);
    }
  }

  function makeCookie() {
    var t = plainBlanks(fortune).trim();
    if (!t) {
      showToast("Add a fortune first.", true);
      return;
    }
    if (!filterOk) return;
    try {
      /* Validate encode path before showing Get link */
      var url = shareUrlFor(t);
      if (!url || url.indexOf("#" + HASH_PREFIX) === -1) throw new Error("encode");
      packedFortune = t;
      var block = $("link-block");
      if (block) block.hidden = false;
      var hint = $("share-url-hint");
      if (hint) {
        hint.hidden = false;
        hint.textContent = url;
      }
      showToast("");
      if (block) {
        try {
          block.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      hideLinkBlock();
      showToast("Couldn’t make the link. Try again.", true);
    }
  }

  function copyLink() {
    if (!packedFortune) {
      showToast("Add a fortune first.", true);
      return;
    }
    var url;
    try {
      url = shareUrlFor(packedFortune);
    } catch (e) {
      showToast("Couldn’t make the link. Try again.", true);
      return;
    }

    function ok() {
      showToast("Link ready — send it when you want.");
    }
    function fail() {
      showToast("Couldn’t make the link. Try again.", true);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(ok).catch(fail);
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var worked = document.execCommand("copy");
        document.body.removeChild(ta);
        if (worked) ok();
        else fail();
      } catch (e) {
        fail();
      }
    }
  }

  function nativeShare() {
    if (!packedFortune) return;
    var url;
    try {
      url = shareUrlFor(packedFortune);
    } catch (e) {
      showToast("Couldn’t make the link. Try again.", true);
      return;
    }
    if (!navigator.share) return;
    navigator
      .share({
        title: "Fortune Cookie",
        text: "I sent you a fortune cookie.",
        url: url
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return;
        showToast("Couldn’t make the link. Try again.", true);
      });
  }

  function finishReveal() {
    var slip = $("slip-text");
    if (slip) slip.innerHTML = formatBlanksHtml(fortune);
    setMode("revealed");
  }

  function crackOpen() {
    if (!fortune) {
      showToast("Couldn’t open that cookie. Ask for a new link.", true);
      return;
    }
    clearTimeout(crackTimer);
    /* Single-surface: leave closed immediately — never stack closed + open */
    if (prefersReducedMotion()) {
      finishReveal();
      return;
    }
    setMode("cracking");
    crackTimer = setTimeout(function () {
      crackTimer = null;
      finishReveal();
    }, CRACK_MS);
  }

  function makeOneBack() {
    clearTimeout(crackTimer);
    crackTimer = null;
    fortune = "";
    packedFortune = "";
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {
      location.hash = "";
    }
    hideLinkBlock();
    setFortune("", { skipFilter: true });
    setMode("create");
    showToast("");
  }

  function loadMark() {
    if (markImg && markImg.complete) return Promise.resolve(markImg);
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        markImg = img;
        resolve(img);
      };
      img.onerror = function () {
        markImg = null;
        resolve(null);
      };
      img.src = MARK_SRC;
    });
  }

  function loadWaferCracked() {
    if (waferCrackedImg && waferCrackedImg.complete) return Promise.resolve(waferCrackedImg);
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        waferCrackedImg = img;
        resolve(img);
      };
      img.onerror = function () {
        waferCrackedImg = null;
        resolve(null);
      };
      img.src = WAFER_CRACKED_SRC;
    });
  }

  function wrapText(ctx, text, maxWidth) {
    var words = String(text || "").split(/\s+/);
    var lines = [];
    var line = "";
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function saveSlip() {
    if (!fortune) return;
    /* Revealed compose only (Creative SAVE-SLIP-COMPOSE.md): cracked wafer + slip + text */
    Promise.all([loadMark(), loadWaferCracked()]).then(function (assets) {
      var mark = assets[0];
      var wafer = assets[1];
      var canvas = document.createElement("canvas");
      canvas.width = SLIP_W; /* 1080 */
      canvas.height = SLIP_H; /* 1350 */
      var ctx = canvas.getContext("2d");
      if (!ctx) {
        showToast("Couldn’t save the slip. Try again.", true);
        return;
      }

      /* 1. Packing Stamp paper — opaque */
      ctx.fillStyle = "#EFE2CD";
      ctx.fillRect(0, 0, SLIP_W, SLIP_H);

      var cx = SLIP_W / 2;
      var y = 64;
      var MARK_RESERVE = 96;
      var WM_INSET = 36; /* ≥24px */

      /* 2. Large cracked wafer top/center — unmistakable (not postage stamp) */
      if (wafer && wafer.width) {
        var ww = Math.round(SLIP_W * 0.84);
        var wh = Math.round((wafer.height / wafer.width) * ww);
        /* Cap so slip + mark still fit */
        var maxWh = Math.round(SLIP_H * 0.42);
        if (wh > maxWh) {
          wh = maxWh;
          ww = Math.round((wafer.width / wafer.height) * wh);
        }
        ctx.drawImage(wafer, (SLIP_W - ww) / 2, y, ww, wh);
        y += wh + 28;
      } else {
        y += 48;
      }

      /* 3. Optional eyebrow */
      ctx.fillStyle = "#6e6258";
      ctx.font = "500 28px Fraunces, Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("Your fortune", cx, y + 6);
      y += 40;

      /* 4. Cream slip card — text not clipped by wafer */
      var slipPadX = 100;
      var slipW = SLIP_W - slipPadX * 2;
      var slipPadY = 48;
      ctx.font = "600 46px Fraunces, Georgia, serif";
      var lines = wrapText(ctx, fortune, slipW - 88);
      var lineH = 60;
      var textBlockH = Math.max(lines.length, 1) * lineH;
      var slipH = Math.max(200, textBlockH + slipPadY * 2);
      if (y + slipH + MARK_RESERVE > SLIP_H) {
        slipH = Math.max(160, SLIP_H - MARK_RESERVE - y);
      }

      ctx.fillStyle = "#FFFDF8";
      ctx.strokeStyle = "#1A120C";
      ctx.lineWidth = 3;
      ctx.fillRect(slipPadX, y, slipW, slipH);
      ctx.strokeRect(slipPadX + 0.5, y + 0.5, slipW - 1, slipH - 1);

      ctx.fillStyle = "#2f2924";
      ctx.font = "600 46px Fraunces, Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var startY = y + slipH / 2 - textBlockH / 2 + lineH / 2;
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], cx, startY + i * lineH);
      }

      /* 5. Tiny 10hi LL watermark — same posture as SHI (≥24px inset, low opacity) */
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#1A120C";
      if (mark && mark.width) {
        var mw = 72;
        var mh = (mark.height / mark.width) * mw;
        ctx.drawImage(mark, WM_INSET, SLIP_H - WM_INSET - mh, mw, mh);
      } else {
        ctx.font = "800 18px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        try { ctx.letterSpacing = "0.18em"; } catch (e) {}
        ctx.fillText("10HI", WM_INSET, SLIP_H - WM_INSET);
      }
      ctx.restore();

      canvas.toBlob(function (blob) {
        if (!blob) {
          showToast("Couldn’t save the slip. Try again.", true);
          return;
        }
        var a = document.createElement("a");
        var url = URL.createObjectURL(blob);
        a.href = url;
        a.download = "fortune-slip.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
        showToast("");
      }, "image/png");
    });
  }

  function wire() {
    buildChips();

    var ta = $("custom");
    if (ta) {
      ta.addEventListener("input", function () {
        setFortune(ta.value, { syncTextarea: false });
      });
    }

    var peek = $("peek-slip");
    if (peek) {
      peek.checked = false; /* Creative lock: default OFF */
      peek.addEventListener("change", updatePeekPreview);
    }
    updatePeekPreview();

    var makeBtn = $("btn-make");
    if (makeBtn) makeBtn.addEventListener("click", makeCookie);

    var copyBtn = $("btn-copy");
    if (copyBtn) copyBtn.addEventListener("click", copyLink);

    var shareBtn = $("btn-share");
    if (shareBtn) {
      if (typeof navigator.share === "function") {
        shareBtn.hidden = false;
        shareBtn.addEventListener("click", nativeShare);
      } else {
        shareBtn.hidden = true;
      }
    }

    var crack = $("btn-crack");
    if (crack) crack.addEventListener("click", crackOpen);
    var hit = $("cookie-hit");
    if (hit) hit.addEventListener("click", crackOpen);

    var save = $("btn-save");
    if (save) save.addEventListener("click", saveSlip);
    var back = $("btn-make-back");
    if (back) back.addEventListener("click", makeOneBack);

    window.addEventListener("hashchange", function () {
      clearTimeout(crackTimer);
      crackTimer = null;
      bootFromHash({ fromHashChange: true });
    });
  }

  function bootFromHash(opts) {
    opts = opts || {};
    var hash = location.hash;
    if (!hash || hash === "#") {
      if (opts.fromHashChange) {
        hideLinkBlock();
        setFortune("", { skipFilter: true });
        setMode("create");
      }
      return;
    }
    try {
      var t = decodeFortuneFromHash(hash);
      fortune = t;
      var slip = $("slip-text");
      if (slip) slip.innerHTML = "";
      /* Receive: CLOSED — do not auto-reveal */
      setMode("closed");
    } catch (e) {
      showToast("Couldn’t open that cookie. Ask for a new link.", true);
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch (err) {
        location.hash = "";
      }
      hideLinkBlock();
      setFortune("", { skipFilter: true });
      setMode("create");
    }
  }

  function preloadWaferArt() {
    loadWaferCracked();
    var closed = new Image();
    closed.src = WAFER_CLOSED_SRC;
  }

  function init() {
    preloadWaferArt();
    wire();
    if (location.hash && location.hash !== "#") {
      bootFromHash();
    } else {
      setMode("create");
      updateMakeEnabled();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
