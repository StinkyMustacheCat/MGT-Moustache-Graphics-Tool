// SPDX-License-Identifier: GPL-3.0-or-later
(function (root) {
  'use strict';
  const FPS = 60;
  const sizes = { horizontal: [1920, 1080], vertical: [1080, 1920], square: [1080, 1080], classic: [1440, 1080] };
  const defaults = { text: 'Haz que tus\nideas se muevan.', font: 'Arial', size: 100, color: '#f4f4f5', background: '#172326', duration: 60, aspect: 'horizontal', easing: 'linear', start: { x: 30, y: 50 }, end: { x: 70, y: 50 } };
  function normalize(s) {
    function num(v, min, max, label) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error(label + ' fuera de rango.');
      return v;
    }
    function color(v, alpha=false) { if (!(alpha?/^#[0-9a-f]{6}([0-9a-f]{2})?$/i:/^#[0-9a-f]{6}$/i).test(v)) throw new Error('Color no válido.'); return v; }
    function point(p) { return { x: num(p?.x, -100, 200, 'Posición X'), y: num(p?.y, -100, 200, 'Posición Y') }; }
    if (!s || typeof s.text !== 'string' || !s.text.trim() || s.text.length > 1000) throw new Error('Escribe entre 1 y 1000 caracteres.');
    if (typeof s.font !== 'string' || !s.font.trim() || s.font.length > 160) throw new Error('Fuente no válida.');
    if (!Object.hasOwn(sizes, s.aspect)) throw new Error('Proporción no válida.');
    if (!['linear', 'smooth'].includes(s.easing)) throw new Error('Movimiento no válido.');
    return { text: s.text, font: s.font, size: num(s.size, 12, 400, 'Tamaño'), color: color(s.color,true), background: color(s.background), duration: Math.round(num(s.duration, .1, 3600, 'Duración') * FPS) / FPS, aspect: s.aspect, easing: s.easing, start: point(s.start), end: point(s.end) };
  }
  // This function is embedded unchanged in preview, copied HTML, and render documents.
  function mount(s, width, height, fps, autoplay, workspace, transparent) {
    const label = document.getElementById('text');
    document.body.style.background = transparent?'transparent':workspace ? '#20262b' : s.background;
    if (workspace) {
      const bg = document.createElement('div');
      Object.assign(bg.style, { position:'absolute', left:width + 'px', top:height + 'px', width:width + 'px', height:height + 'px', background:transparent?'transparent':s.background });
      document.body.insertBefore(bg, label);
    }
    label.textContent = s.text;
    Object.assign(label.style, { fontFamily: JSON.stringify(s.font), fontSize: s.size + 'px', color: s.color });
    const count = Math.round(s.duration * fps);
    window.setPositions = function (start, end) { s.start = start; s.end = end; };
    window.setFrame = function (frame) {
      const progress = Math.max(0, Math.min(1, frame / Math.max(1, count - 1)));
      const eased = s.easing === 'smooth' ? progress * progress * (3 - 2 * progress) : progress;
      label.style.left = ((s.start.x + (s.end.x - s.start.x) * eased) * width / 100 + (workspace ? width : 0)) + 'px';
      label.style.top = ((s.start.y + (s.end.y - s.start.y) * eased) * height / 100 + (workspace ? height : 0)) + 'px';
    };
    window.setFrame(0);
    window.sceneReady = document.fonts.load(s.size + 'px ' + JSON.stringify(s.font), s.text).then(() => document.fonts.ready).then(() => {
      if (autoplay) {
        let started;
        function tick(now) {
          started ??= now;
          const frame = Math.min(count - 1, Math.floor((now - started) * fps / 1000));
          window.setFrame(frame);
          if (frame < count - 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    });
  }
  function documentHTML(input, autoplay = false, workspace = false, transparent = false) {
    const s = normalize(input), [w, h] = sizes[s.aspect];
    const data = JSON.stringify(s).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>MGT · composición</title>\n<style>\n*{box-sizing:border-box}html,body{margin:0;width:' + w * (workspace ? 3 : 1) + 'px;height:' + h * (workspace ? 3 : 1) + 'px;overflow:hidden}#text{position:absolute;transform:translate(-50%,-50%);white-space:pre;text-align:center;font-weight:400;font-style:normal;line-height:1.15;font-kerning:normal}\n</style>\n</head>\n<body>\n<div id="text"></div>\n<script>\n// 60 FPS. El último fotograma alcanza exactamente la posición final.\n(' + mount.toString() + ')(' + data + ',' + w + ',' + h + ',60,' + Boolean(autoplay) + ',' + Boolean(workspace) + ','+Boolean(transparent)+');\n</script>\n</body>\n</html>';
  }
  const api = { FPS, sizes, defaults, normalize, documentHTML };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MotionScene = api;
})(typeof window !== 'undefined' ? window : globalThis);
