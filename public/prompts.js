// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
// The prompt menu keeps endpoint names in one small, testable place.
window.MGTPrompts = Object.freeze({
  motion: Object.freeze({ label: 'Motion Graphics', endpoint: '/prompt/motion' }),
  '3d': Object.freeze({ label: '3D', endpoint: '/prompt/3d' }),
  images: Object.freeze({ label: 'Imágenes', endpoint: '/prompt/images' }),
  media: Object.freeze({ label: 'Vídeo y recursos animados', endpoint: '/prompt/media' }),
  subtitles: Object.freeze({ label: 'Subtítulos', endpoint: '/prompt/subtitles' })
});
