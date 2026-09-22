/**
 * Still Have It — Rev 4 sharing / personalization
 * Brief: STAFF-BRIEF-APPROVED.md R4 · Writer FILTER-POLICY + VISITOR-COPY · Creative CREATIVE-SHARING
 * Cookies: 10hi_age + 10hi_prefs only. No analytics/accounts/backend.
 */
(function () {
  "use strict";

  var SHARE_W = 1080;
  var SHARE_H = 1350;
  var AGE_COOKIE = "10hi_age";
  var PREFS_COOKIE = "10hi_prefs";
  var LEGACY_PACK = "shi_pack";
  var LEGACY_ITEM = "shi_item";
  var AGE_MAX_AGE = 31536000;
  var PREFS_MAX_AGE = 31536000;
  var PREFS_VERSION = 1;
  var AGE_POLICY = "13v1";
  var BASE = "/still-have-it/";
  var DEFAULT_PACK = "line-art";
  var DEFAULT_ITEM = "hoodie";
  var DEFAULT_BG = "light";
  var ICON_MAX = 720;
  var INVITE_MAX = 160;
  var WM_INSET = 36;
  var FILTER_DEBOUNCE_MS = 280;
  var FILTER_MSG = "Keep it friendly—please change this wording.";

  var PACKS = [
    { id: "line-art", label: "Line art" },
    { id: "kawaii", label: "Kawaii" },
    { id: "gloss", label: "Gloss" },
    { id: "workwear", label: "Workwear" }
  ];

  var ITEMS = [
    "hoodie", "pruning-shears", "phone-charger", "book", "sunglasses", "umbrella",
    "hammer", "power-drill", "extension-cord", "food-container", "garden-rake", "lawn-mower"
  ];

  var ITEM_ALIAS = { clippers: "pruning-shears" };

  /* Locked FINAL-VISITOR-WORDS + icon-pack defaults; duration parsed from time */
  var COPY = {
    hoodie: { line: "I still have your navy hoodie.", soft: "Kept it way too long. Want to grab a drink and get it back?", alt: "Navy hoodie", locked: true, duration: 14, unit: "months" },
    "pruning-shears": { line: "I still have your clippers.", soft: "Meant to give them back ages ago. Want to come pick them up and catch up?", alt: "Hair clippers", locked: true, duration: 11, unit: "months" },
    "phone-charger": { line: "I still have your charger.", soft: "Borrowed it for one night. Want to hang and get it back?", alt: "Phone charger", duration: 8, unit: "months" },
    book: { line: "I still have your book.", soft: "Meant to finish it months ago. Want to hang and hand it back?", alt: "Book", duration: 16, unit: "months" },
    sunglasses: { line: "I still have your sunglasses.", soft: "They\u2019ve been in my bag forever. Want to hang and get them back to you?", alt: "Sunglasses", duration: 9, unit: "months" },
    umbrella: { line: "I still have your umbrella.", soft: "Been in my trunk since that storm. Want to catch up? I\u2019ll bring it.", alt: "Umbrella", duration: 7, unit: "months" },
    hammer: { line: "I still have your hammer.", soft: "Borrowed it for one project. Want to hang? I\u2019ll bring it by.", alt: "Hammer", duration: 10, unit: "months" },
    "power-drill": { line: "I still have your drill.", soft: "Meant to run it back ages ago. Want to catch up? I\u2019ll drop it off.", alt: "Power drill", duration: 13, unit: "months" },
    "extension-cord": { line: "I still have your extension cord.", soft: "Still coiled in my garage. Want to hang? I\u2019ll bring it over.", alt: "Extension cord", duration: 12, unit: "months" },
    "food-container": { line: "I still have your Tupperware.", soft: "The good one, too. Want to hang? I\u2019ll bring it back.", alt: "Food container", duration: 6, unit: "months" },
    "garden-rake": { line: "I still have your rake.", soft: "Borrowed it \u201cfor a weekend.\u201d Want to come pick it up and catch up?", alt: "Garden rake", duration: 8, unit: "months" },
    "lawn-mower": { line: "I still have your mower.", soft: "Borrowed it for one Saturday. Want to hang? I\u2019ll bring it back.", alt: "Lawn mower", duration: 18, unit: "months" }
  };

  var brand = "Still Have It";
  var pack = DEFAULT_PACK;
  var item = DEFAULT_ITEM;
  var bg = DEFAULT_BG;
  var durationNum = 14;
  var durationUnit = "months";
  var invitation = COPY.hoodie.soft;
  var remember = false;
  var openSheetId = null;
  var pendingAction = null; /* 'share' | 'save' | null */
  var filterOk = true;
  var surfaceMode = "compose";
  var filterMatches = [];
  var filterTimer = null;
  var renderSeq = 0;
  var readyBlob = null;
  var readyFile = null;
  var readyObjectUrl = null;
  var readyKey = "";
  var shareBusy = false;
  var prepPromise = null;

  function isHttps() {
    return location.protocol === "https:";
  }

  function readCookie(name) {
    var parts = ("; " + document.cookie).split("; " + name + "=");
    if (parts.length < 2) return null;
    return decodeURIComponent(parts.pop().split(";").shift());
  }

  function writeCookie(name, value, path, maxAge) {
    var parts = [
      name + "=" + encodeURIComponent(value),
      "Path=" + path,
      "Max-Age=" + String(maxAge),
      "SameSite=Lax"
    ];
    if (isHttps()) parts.push("Secure");
    document.cookie = parts.join("; ");
  }

  function expireCookie(name, path) {
    writeCookie(name, "", path, 0);
  }

  function migrateLegacyPrefs() {
    expireCookie(LEGACY_PACK, BASE);
    expireCookie(LEGACY_ITEM, BASE);
    expireCookie(LEGACY_PACK, "/");
    expireCookie(LEGACY_ITEM, "/");
    expireCookie("shi_skin", BASE);
    expireCookie("shi_skin", "/");
  }

  function hasAgeAffirm() {
    var v = readCookie(AGE_COOKIE);
    return !!(v && (v === "1" || /^1(\.|$)/.test(v) || v.indexOf(AGE_POLICY) === 0));
  }

  function setAgeAffirm() {
    var ts = Math.floor(Date.now() / 1000);
    writeCookie(AGE_COOKIE, AGE_POLICY + "." + ts, "/", AGE_MAX_AGE);
  }

  function readPrefsCookie() {
    var raw = readCookie(PREFS_COOKIE);
    if (!raw) return null;
    try {
      var o = JSON.parse(raw);
      if (!o || o.v !== PREFS_VERSION) return null;
      if (o.remember !== true) return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function writePrefsIfRemembered() {
    if (!remember) {
      expireCookie(PREFS_COOKIE, BASE);
      expireCookie(PREFS_COOKIE, "/");
      return;
    }
    var payload = JSON.stringify({
      v: PREFS_VERSION,
      remember: true,
      pack: pack,
      item: item,
      bg: bg
    });
    writeCookie(PREFS_COOKIE, payload, BASE, PREFS_MAX_AGE);
  }

  function packLabel(id) {
    for (var i = 0; i < PACKS.length; i++) {
      if (PACKS[i].id === id) return PACKS[i].label;
    }
    return id;
  }

  function isPack(id) {
    for (var i = 0; i < PACKS.length; i++) if (PACKS[i].id === id) return true;
    return false;
  }

  function isItem(id) {
    return ITEMS.indexOf(id) !== -1;
  }

  function resolveItem(id) {
    if (ITEM_ALIAS[id]) return ITEM_ALIAS[id];
    return id;
  }

  function iconPath(p, it) {
    return BASE + "icon-packs/" + p + "/" + it + ".webp";
  }

  function copyFor(it) {
    return COPY[it] || { line: "I still have your thing.", soft: "", alt: it, duration: 1, unit: "months" };
  }

  function durationPhrase(n, unit) {
    var u = unit === "years" ? (n === 1 ? "year" : "years") : (n === 1 ? "month" : "months");
    return String(n) + " " + u + ".";
  }

  function parsePath() {
    var path = location.pathname.replace(/\/+/g, "/");
    if (path.charAt(path.length - 1) !== "/") path += "/";
    if (path.indexOf(BASE) !== 0) {
      return { pack: DEFAULT_PACK, item: DEFAULT_ITEM, explicit: false };
    }
    var rest = path.slice(BASE.length).replace(/\/+$/, "");
    if (!rest || rest === "privacy") {
      return { pack: DEFAULT_PACK, item: DEFAULT_ITEM, explicit: false };
    }
    var parts = rest.split("/").filter(Boolean);
    if (parts.length === 1) {
      var only = resolveItem(parts[0]);
      if (isItem(only)) return { pack: DEFAULT_PACK, item: only, explicit: true };
      return { pack: DEFAULT_PACK, item: DEFAULT_ITEM, explicit: false };
    }
    if (parts.length >= 2) {
      var p = parts[0];
      var it = resolveItem(parts[1]);
      if (isPack(p) && isItem(it)) return { pack: p, item: it, explicit: true };
      if (isItem(resolveItem(parts[0]))) {
        return { pack: DEFAULT_PACK, item: resolveItem(parts[0]), explicit: true };
      }
    }
    return { pack: DEFAULT_PACK, item: DEFAULT_ITEM, explicit: false };
  }

  function canonicalPath(p, it) {
    if (p === DEFAULT_PACK && it === DEFAULT_ITEM) return BASE;
    if (p === DEFAULT_PACK) return BASE + it + "/";
    return BASE + p + "/" + it + "/";
  }

  function stateKey() {
    return [pack, item, bg, durationNum, durationUnit, invitation].join("|");
  }

  function exportFilename() {
    return "still-have-it-" + item + "-" + bg + ".png";
  }

  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg || "";
    clearTimeout(toast._t);
    if (msg) {
      toast._t = setTimeout(function () { el.textContent = ""; }, 2800);
    }
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return 0;
    var lines = [];
    var current = "";
    for (var i = 0; i < words.length; i++) {
      var test = current ? current + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    var startY = y;
    for (var j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], x, startY + j * lineHeight);
    }
    return lines.length;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("Failed to load " + src)); };
      img.src = src;
    });
  }

  /**
   * Dark export art:
   * - line-art: keep ink lines; Creative cream stage plate drawn in paintShare (do NOT strip).
   * - other packs: strip near-white matte so art sits on dark without postage stamp.
   */
  function prepareIconForBg(iconImg, background, packId) {
    var w = iconImg.naturalWidth || iconImg.width;
    var h = iconImg.naturalHeight || iconImg.height;
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");
    ctx.drawImage(iconImg, 0, 0);
    if (background !== "dark") return c;
    if (packId === "line-art") return c;
    var imageData = ctx.getImageData(0, 0, w, h);
    var d = imageData.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], g = d[i + 1], b = d[i + 2];
      if (r >= 245 && g >= 245 && b >= 245) {
        d[i + 3] = 0;
      } else if (r >= 230 && g >= 230 && b >= 230) {
        var t = (r + g + b) / 3;
        d[i + 3] = Math.round(d[i + 3] * Math.max(0, (245 - t) / 15));
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return c;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function paintShare(iconImg, snapshot) {
    var canvas = document.createElement("canvas");
    canvas.width = SHARE_W;
    canvas.height = SHARE_H;
    var ctx = canvas.getContext("2d");
    var dark = snapshot.bg === "dark";
    var ground = dark ? "#1A120C" : "#EFE2CD";
    var brandColor = dark ? "#c4b4a4" : "#a08878";
    var lineColor = dark ? "#FFFDF8" : "#2f2924";
    var timeColor = dark ? "#e8a890" : "#c07860";
    var softColor = dark ? "#d8cfc6" : "#5a5048";
    var wmColor = dark ? "#EFE2CD" : "#1A120C";
    var wmAlpha = dark ? 0.28 : 0.22;

    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, SHARE_W, SHARE_H);

    ctx.fillStyle = brandColor;
    ctx.font = "500 28px Fraunces, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(brand, SHARE_W / 2, 72);

    var prepared = prepareIconForBg(iconImg, snapshot.bg, snapshot.pack);
    var iw = prepared.width;
    var ih = prepared.height;
    var scale = Math.min(ICON_MAX / iw, ICON_MAX / ih);
    var dw = iw * scale;
    var dh = ih * scale;
    var ix = (SHARE_W - dw) / 2;
    var iy = 72 + 28 + 28;
    // Creative: cream plate hugs icon bbox (pad ~8%); ≥24px clear above headline.
    // Skip plate for opaque dark-fill assets (extension-cord) — outer cream reads postage-stamped.
    var platePad = 0;
    var useLineArtPlate =
      snapshot.bg === "dark" &&
      snapshot.pack === "line-art" &&
      snapshot.item !== "extension-cord";
    if (useLineArtPlate) {
      platePad = Math.round(Math.min(dw, dh) * 0.08);
      platePad = Math.max(12, Math.min(platePad, Math.round(Math.min(dw, dh) * 0.12)));
      var plateX = ix - platePad;
      var plateY = iy - platePad;
      var plateW = dw + platePad * 2;
      var plateH = dh + platePad * 2;
      var radius = Math.max(16, Math.min(24, Math.round(platePad * 1.2)));
      ctx.fillStyle = "#FFFDF8";
      roundRectPath(ctx, plateX, plateY, plateW, plateH, radius);
      ctx.fill();
    }
    ctx.drawImage(prepared, ix, iy, dw, dh);

    var textX = SHARE_W / 2;
    var textMax = 900;
    var y = iy + dh + platePad + 24;

    ctx.fillStyle = lineColor;
    ctx.font = "600 48px Fraunces, Georgia, serif";
    ctx.textBaseline = "top";
    var lineCount = wrapText(ctx, snapshot.line, textX, y, textMax, 58);
    y += lineCount * 58 + 16;

    ctx.fillStyle = timeColor;
    ctx.font = "500 40px Fraunces, Georgia, serif";
    ctx.fillText(snapshot.time, textX, y);
    y += 40 + 28;

    ctx.fillStyle = softColor;
    ctx.font = "400 30px 'DM Sans', system-ui, sans-serif";
    wrapText(ctx, snapshot.invitation, textX, y, 860, 40);

    ctx.save();
    ctx.globalAlpha = wmAlpha;
    ctx.fillStyle = wmColor;
    ctx.font = "800 18px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.letterSpacing = "0.18em";
    try { ctx.letterSpacing = "0.18em"; } catch (e) {}
    ctx.fillText("10HI", WM_INSET, SHARE_H - WM_INSET);
    ctx.restore();

    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error("toBlob failed"));
        }, "image/png");
      } else {
        try {
          var data = canvas.toDataURL("image/png");
          var bin = atob(data.split(",")[1]);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: "image/png" }));
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  function invalidateReady() {
    readyBlob = null;
    readyFile = null;
    readyKey = "";
    if (readyObjectUrl) {
      URL.revokeObjectURL(readyObjectUrl);
      readyObjectUrl = null;
    }
  }

  function setSurface(mode) {
    surfaceMode = mode === "result" ? "result" : "compose";
    document.documentElement.setAttribute("data-surface", surfaceMode);
    var compose = document.getElementById("compose");
    var result = document.getElementById("result");
    if (compose) compose.hidden = surfaceMode === "result";
    if (result) result.hidden = surfaceMode !== "result";
  }

  function enterResultMode(blob) {
    if (!blob) return;
    if (readyObjectUrl) URL.revokeObjectURL(readyObjectUrl);
    readyObjectUrl = URL.createObjectURL(blob);
    var img = document.getElementById("result-img");
    if (img) {
      img.src = readyObjectUrl;
      img.alt = "Still Have It card — " + pack + " / " + item + " / " + bg;
    }
    setSurface("result");
  }

  function exitResultMode() {
    setSurface("compose");
    var img = document.getElementById("result-img");
    if (img) img.removeAttribute("src");
    if (readyObjectUrl) {
      URL.revokeObjectURL(readyObjectUrl);
      readyObjectUrl = null;
    }
  }


  function snapshotNow() {
    return {
      pack: pack,
      item: item,
      bg: bg,
      line: copyFor(item).line,
      time: durationPhrase(durationNum, durationUnit),
      invitation: invitation,
      key: stateKey()
    };
  }

  function runFilter(text) {
    var F = window.SHIFilter;
    if (!F || typeof F.checkInvitation !== "function") {
      return { ok: true, matches: [] };
    }
    return F.checkInvitation(text);
  }

  function applyFilterUI(result) {
    filterOk = result.ok;
    filterMatches = result.matches || [];
    var ta = document.getElementById("invitation");
    var msg = document.getElementById("filter-msg");
    if (ta) ta.classList.toggle("is-flagged", !filterOk);
    if (msg) {
      msg.hidden = filterOk;
      msg.textContent = (window.SHIFilter && window.SHIFilter.FILTER_MESSAGE) || FILTER_MSG;
    }
    if (!filterOk) invalidateReady();
  }

  function scheduleFilter() {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(function () {
      applyFilterUI(runFilter(invitation));
      if (filterOk) schedulePrepare();
    }, FILTER_DEBOUNCE_MS);
  }

  function schedulePrepare() {
    if (!filterOk) return;
    var seq = ++renderSeq;
    var snap = snapshotNow();
    prepPromise = (async function () {
      try {
        var iconImg = await loadImage(iconPath(snap.pack, snap.item));
        if (document.fonts && document.fonts.ready) {
          try { await document.fonts.ready; } catch (e) {}
        }
        if (seq !== renderSeq) return null;
        var canvas = paintShare(iconImg, snap);
        var blob = await canvasToBlob(canvas);
        if (seq !== renderSeq) return null;
        if (stateKey() !== snap.key) return null;
        readyBlob = blob;
        readyFile = new File([blob], exportFilename(), { type: "image/png" });
        readyKey = snap.key;
        /* no stacked preview */
        var shareBtn = document.getElementById("share");
        if (shareBtn && shareBtn.dataset.waiting === "1") {
          shareBtn.dataset.waiting = "0";
          shareBtn.disabled = false;
          shareBtn.textContent = "Share card";
          enterResultMode(blob);
          toast("Here's your card");
        }
        return blob;
      } catch (err) {
        console.error(err);
        if (seq === renderSeq) toast("Couldn\u2019t make image — try again");
        return null;
      }
    })();
    return prepPromise;
  }

  function ensureReady() {
    if (readyBlob && readyFile && readyKey === stateKey() && filterOk) {
      return Promise.resolve(readyFile);
    }
    return schedulePrepare().then(function () {
      if (readyBlob && readyFile && readyKey === stateKey() && filterOk) return readyFile;
      return null;
    });
  }

  function triggerDownload(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = exportFilename();
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  async function doShare() {
    if (shareBusy) return;
    if (!filterOk) {
      toast(FILTER_MSG);
      return;
    }
    shareBusy = true;
    var shareBtn = document.getElementById("share");
    try {
      if (surfaceMode !== "result" || !(readyFile && readyKey === stateKey() && readyBlob)) {
        if (shareBtn) {
          shareBtn.disabled = true;
          shareBtn.textContent = "Getting the card ready\u2026";
          shareBtn.dataset.waiting = "1";
        }
        toast("Getting the card ready\u2026");
        await ensureReady();
        if (!(readyFile && readyKey === stateKey() && readyBlob)) {
          if (shareBtn) {
            shareBtn.disabled = false;
            shareBtn.textContent = "Share card";
            shareBtn.dataset.waiting = "0";
          }
          return;
        }
        if (shareBtn) {
          shareBtn.disabled = false;
          shareBtn.textContent = "Share card";
          shareBtn.dataset.waiting = "0";
        }
        enterResultMode(readyBlob);
        toast("Here's your card");
        return;
      }

      var file = readyFile;
      if (!navigator.share) {
        triggerDownload(readyBlob);
        toast("Sharing isn't available here — saved the image instead");
        return;
      }
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        triggerDownload(readyBlob);
        toast("This browser can't share files — saved the image instead");
        return;
      }
      try {
        await navigator.share({ files: [file], title: brand });
      } catch (e) {
        if (e && e.name === "AbortError") {
          return;
        }
        triggerDownload(readyBlob);
        toast("Couldn't share — saved the image instead");
      }
    } finally {
      shareBusy = false;
      if (shareBtn && shareBtn.dataset.waiting !== "1") {
        shareBtn.disabled = false;
        shareBtn.textContent = "Share card";
      }
    }
  }

  async function doSave() {
    if (!filterOk) {
      toast(FILTER_MSG);
      return;
    }
    var saveBtn = document.getElementById("save");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving\u2026";
    }
    try {
      var file = await ensureReady();
      if (!file || !readyBlob) {
        toast("Couldn\u2019t make image — try again");
        return;
      }
      triggerDownload(readyBlob);
      toast("Image saved");
    } catch (err) {
      console.error(err);
      toast("Couldn\u2019t save — try again");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save image";
      }
    }
  }

  function openAgeModal(action) {
    pendingAction = action || null;
    var overlay = document.getElementById("age-overlay");
    var yes = document.getElementById("age-yes");
    var no = document.getElementById("age-no");
    var denied = document.getElementById("age-denied");
    if (yes) yes.setAttribute("aria-pressed", "false");
    if (no) no.setAttribute("aria-pressed", "false");
    if (denied) denied.hidden = true;
    if (overlay) overlay.classList.add("is-open");
  }

  function closeAgeModal() {
    var overlay = document.getElementById("age-overlay");
    if (overlay) overlay.classList.remove("is-open");
  }

  function gatedAction(action) {
    if (!hasAgeAffirm()) {
      openAgeModal(action);
      return;
    }
    if (action === "share") doShare();
    else if (action === "save") doSave();
  }

  function clampDuration(raw) {
    var digits = String(raw || "").replace(/\D/g, "");
    if (!digits) return null;
    var n = parseInt(digits, 10);
    if (!isFinite(n) || n < 1) return null;
    if (n > 999) n = 999;
    return n;
  }

  function syncDurationInputs() {
    var input = document.getElementById("duration-number");
    var months = document.getElementById("unit-months");
    var years = document.getElementById("unit-years");
    if (input && document.activeElement !== input) input.value = String(durationNum);
    if (months) months.setAttribute("aria-pressed", durationUnit === "months" ? "true" : "false");
    if (years) years.setAttribute("aria-pressed", durationUnit === "years" ? "true" : "false");
  }

  function syncBgChips() {
    var light = document.getElementById("bg-light");
    var dark = document.getElementById("bg-dark");
    if (light) light.setAttribute("aria-pressed", bg === "light" ? "true" : "false");
    if (dark) dark.setAttribute("aria-pressed", bg === "dark" ? "true" : "false");
    document.documentElement.setAttribute("data-bg", bg);
  }

  function applyState(pushHistory) {
    var c = copyFor(item);
    document.documentElement.setAttribute("data-pack", pack);
    document.documentElement.setAttribute("data-item", item);
    document.documentElement.setAttribute(
      "data-skin",
      item === "pruning-shears" ? "clippers" : "hoodie"
    );
    syncBgChips();
    syncDurationInputs();

    var hero = document.getElementById("hero");
    if (hero) {
      hero.src = iconPath(pack, item);
      hero.alt = c.alt || item;
    }
    var lookLabel = document.getElementById("look-label");
    if (lookLabel) lookLabel.textContent = packLabel(pack);

    var lineEl = document.getElementById("line");
    if (lineEl) lineEl.textContent = c.line;

    var inv = document.getElementById("invitation");
    if (inv && document.activeElement !== inv) inv.value = invitation;

    var rem = document.getElementById("remember");
    if (rem) rem.checked = remember;

    document.title = "Still Have It — " + (c.alt || item) + " · " + packLabel(pack);

    writePrefsIfRemembered();

    var next = canonicalPath(pack, item);
    var cur = location.pathname.replace(/\/+/g, "/");
    if (cur.charAt(cur.length - 1) !== "/") cur += "/";
    if (pushHistory && cur !== next) {
      history.pushState({ pack: pack, item: item }, "", next);
    } else if (!pushHistory && cur !== next && location.protocol !== "file:") {
      history.replaceState({ pack: pack, item: item }, "", next);
    }

    invalidateReady();
    applyFilterUI(runFilter(invitation));
    if (filterOk) schedulePrepare();
  }

  function selectPack(id) {
    if (!isPack(id)) return;
    pack = id;
    applyState(true);
    closeSheet("look-sheet");
  }

  function selectItem(id) {
    id = resolveItem(id);
    if (!isItem(id)) return;
    item = id;
    var c = copyFor(item);
    durationNum = c.duration || 1;
    durationUnit = c.unit || "months";
    invitation = c.soft || "";
    applyState(true);
    closeSheet("item-sheet");
  }

  function closeSheet(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = true;
    el.classList.remove("is-open");
    if (openSheetId === id) openSheetId = null;
  }

  function openSheet(id) {
    if (openSheetId && openSheetId !== id) closeSheet(openSheetId);
    var el = document.getElementById(id);
    if (!el) return;
    if (id === "look-sheet") renderPackGrid();
    if (id === "item-sheet") renderItemGrid();
    el.hidden = false;
    el.classList.add("is-open");
    openSheetId = id;
  }

  function renderPackGrid() {
    var grid = document.getElementById("pack-grid");
    if (!grid) return;
    grid.innerHTML = "";
    PACKS.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pack-tile" + (p.id === pack ? " is-selected" : "");
      btn.setAttribute("aria-pressed", p.id === pack ? "true" : "false");
      btn.innerHTML =
        '<img src="' + iconPath(p.id, item) + '" alt="" width="120" height="120" />' +
        '<span class="pack-tile-label">' + p.label + "</span>";
      btn.addEventListener("click", function () { selectPack(p.id); });
      grid.appendChild(btn);
    });
  }

  function renderItemGrid() {
    var grid = document.getElementById("item-grid");
    if (!grid) return;
    grid.innerHTML = "";
    ITEMS.forEach(function (it) {
      var c = copyFor(it);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "item-tile" + (it === item ? " is-selected" : "");
      btn.setAttribute("aria-pressed", it === item ? "true" : "false");
      btn.title = c.alt || it;
      btn.innerHTML =
        '<img src="' + iconPath(pack, it) + '" alt="' + (c.alt || it) + '" width="88" height="88" />';
      btn.addEventListener("click", function () { selectItem(it); });
      grid.appendChild(btn);
    });
  }

  function onPopState() {
    var parsed = parsePath();
    pack = parsed.pack;
    item = parsed.item;
    var c = copyFor(item);
    durationNum = c.duration || durationNum;
    durationUnit = c.unit || durationUnit;
    invitation = c.soft || invitation;
    applyState(false);
  }

  function initFromPrefsAndPath() {
    migrateLegacyPrefs();
    var parsed = parsePath();
    pack = parsed.pack;
    item = parsed.item;
    var c = copyFor(item);
    durationNum = c.duration || 14;
    durationUnit = c.unit || "months";
    invitation = c.soft || "";
    bg = DEFAULT_BG;
    remember = false;

    var prefs = readPrefsCookie();
    if (prefs) {
      remember = true;
      if (!parsed.explicit) {
        if (isPack(prefs.pack)) pack = prefs.pack;
        if (isItem(prefs.item)) item = prefs.item;
      }
      if (prefs.bg === "light" || prefs.bg === "dark") bg = prefs.bg;
      c = copyFor(item);
      durationNum = c.duration || durationNum;
      durationUnit = c.unit || durationUnit;
      invitation = c.soft || invitation;
    }
  }

  function init() {
    initFromPrefsAndPath();
    applyState(false);

    var shareBtn = document.getElementById("share");
    if (shareBtn) shareBtn.addEventListener("click", function () { gatedAction("share"); });
    var saveBtn = document.getElementById("save");
    if (saveBtn) saveBtn.addEventListener("click", function () { gatedAction("save"); });
    var backBtn = document.getElementById("result-back");
    if (backBtn) backBtn.addEventListener("click", function () { exitResultMode(); });

    var ageYes = document.getElementById("age-yes");
    if (ageYes) {
      ageYes.addEventListener("click", function () {
        ageYes.setAttribute("aria-pressed", "true");
        var no = document.getElementById("age-no");
        if (no) no.setAttribute("aria-pressed", "false");
        var denied = document.getElementById("age-denied");
        if (denied) denied.hidden = true;
        setAgeAffirm();
        closeAgeModal();
        var act = pendingAction;
        pendingAction = null;
        if (act === "share") doShare();
        else if (act === "save") doSave();
      });
    }
    var ageNo = document.getElementById("age-no");
    if (ageNo) {
      ageNo.addEventListener("click", function () {
        ageNo.setAttribute("aria-pressed", "true");
        if (ageYes) ageYes.setAttribute("aria-pressed", "false");
        var denied = document.getElementById("age-denied");
        if (denied) denied.hidden = false;
        pendingAction = null;
        /* No does not unlock */
      });
    }
    var ageCancel = document.getElementById("age-cancel");
    if (ageCancel) {
      ageCancel.addEventListener("click", function () {
        pendingAction = null;
        closeAgeModal();
      });
    }

    var durInput = document.getElementById("duration-number");
    if (durInput) {
      durInput.addEventListener("focus", function () {
        try { durInput.select(); } catch (e) {}
      });
      durInput.addEventListener("input", function () {
        var n = clampDuration(durInput.value);
        if (n == null) return;
        durationNum = n;
        invalidateReady();
        schedulePrepare();
      });
      durInput.addEventListener("change", function () {
        var n = clampDuration(durInput.value);
        if (n == null) {
          durInput.value = String(durationNum);
          return;
        }
        durationNum = n;
        durInput.value = String(n);
        invalidateReady();
        schedulePrepare();
      });
      durInput.addEventListener("blur", function () {
        var n = clampDuration(durInput.value);
        if (n == null) durInput.value = String(durationNum);
        else {
          durationNum = n;
          durInput.value = String(n);
        }
      });
    }

    var unitMonths = document.getElementById("unit-months");
    var unitYears = document.getElementById("unit-years");
    if (unitMonths) {
      unitMonths.addEventListener("click", function () {
        durationUnit = "months";
        syncDurationInputs();
        invalidateReady();
        schedulePrepare();
      });
    }
    if (unitYears) {
      unitYears.addEventListener("click", function () {
        durationUnit = "years";
        syncDurationInputs();
        invalidateReady();
        schedulePrepare();
      });
    }

    var inv = document.getElementById("invitation");
    if (inv) {
      inv.addEventListener("input", function () {
        invitation = inv.value.slice(0, INVITE_MAX);
        if (inv.value.length > INVITE_MAX) inv.value = invitation;
        invalidateReady();
        scheduleFilter();
      });
    }

    var bgLight = document.getElementById("bg-light");
    var bgDark = document.getElementById("bg-dark");
    if (bgLight) {
      bgLight.addEventListener("click", function () {
        bg = "light";
        syncBgChips();
        writePrefsIfRemembered();
        invalidateReady();
        schedulePrepare();
      });
    }
    if (bgDark) {
      bgDark.addEventListener("click", function () {
        bg = "dark";
        syncBgChips();
        writePrefsIfRemembered();
        invalidateReady();
        schedulePrepare();
      });
    }

    var rem = document.getElementById("remember");
    if (rem) {
      rem.addEventListener("change", function () {
        remember = !!rem.checked;
        writePrefsIfRemembered();
      });
    }

    var lookOpen = document.getElementById("look-open");
    if (lookOpen) lookOpen.addEventListener("click", function () { openSheet("look-sheet"); });
    var lookClose = document.getElementById("look-close");
    if (lookClose) lookClose.addEventListener("click", function () { closeSheet("look-sheet"); });
    var lookSheet = document.getElementById("look-sheet");
    if (lookSheet) lookSheet.addEventListener("click", function (e) {
      if (e.target === lookSheet) closeSheet("look-sheet");
    });

    var itemOpen = document.getElementById("item-open");
    if (itemOpen) itemOpen.addEventListener("click", function () { openSheet("item-sheet"); });
    var itemClose = document.getElementById("item-close");
    if (itemClose) itemClose.addEventListener("click", function () { closeSheet("item-sheet"); });
    var itemSheet = document.getElementById("item-sheet");
    if (itemSheet) itemSheet.addEventListener("click", function (e) {
      if (e.target === itemSheet) closeSheet("item-sheet");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (openSheetId) closeSheet(openSheetId);
        else closeAgeModal();
      }
    });

    window.addEventListener("popstate", onPopState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
