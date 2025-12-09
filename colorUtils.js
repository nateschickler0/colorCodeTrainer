/**
 * colorUtils.js - Shared color conversion utilities
 */

// DOM selector helper
const $ = (sel) => document.querySelector(sel);

// HSL to RGB conversion
// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
const hsl2rgb = (h, s, l, a = s * Math.min(l, 1 - l), f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) => [f(0), f(8), f(4)];

// RGB to HSL conversion
// h: 0..360, s/l: 0..1
const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m, l = (M + m) / 2;
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    const h = !d ? 0 : 60 * (M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4);
    return [h, s, l];
};

// RGB (0-1 range) to hex, e.g. #0812fa
const rgb2hex = (r, g, b) => "#" + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, 0)).join('');

// RGB (0-255 range) to hex
const rgb2hex265 = (r, g, b) => "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, 0)).join('');
