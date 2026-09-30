// clawd-md renderer: scene config -> animated SVG string.
// Pure ES module, no dependencies. Runs in Node (scripts/build.js) and in the browser (index.html).

export const ORANGE = '#D97757';

const FONT = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
const CHAR_W = 0.6; // monospace glyph width relative to font size

export const THEMES = {
  light: { ground: '#d0d7de', text: '#1f2328', muted: '#656d76', bubble: '#ffffff', bubbleStroke: '#d0d7de', decor: '#3d3929', background: 'none' },
  dark: { ground: '#30363d', text: '#e6edf3', muted: '#8b949e', bubble: '#161b22', bubbleStroke: '#30363d', decor: '#8b949e', background: 'none' },
};

export const SCENE_DEFAULTS = {
  width: 900,
  height: 130,
  ground: { style: 'dotted', y: null, width: 3 }, // style: dotted | dashed | solid | none; y defaults to height - 16
  background: null, // null (transparent) or { light: '#fdf6ec', dark: '#1a1a17', radius: 12 }
  theme: { light: {}, dark: {} }, // override any key of THEMES
  clawds: [],
  texts: [],
  status: null,
  decor: [],
};

export const CLAWD_DEFAULTS = {
  x: '50%', // center x in px, or percentage string of scene width
  size: 6, // px per pixel
  color: ORANGE,
  pose: 'stand', // stand | sit
  eyes: 'dots', // dots | tall | happy | closed | sparkly | wide
  accessories: [], // glasses | party | crown | tophat | laptop | coffee | book
  animation: 'idle', // idle | hop | bounce | walk | dance | wave | sleep | none
  blink: true,
  look: true, // glance left and right while idle
  hopHeight: 9,
  speed: 1, // animation speed multiplier (2 = twice as fast)
  delay: 0, // seconds, to desync multiple clawds
  shadow: true,
  say: null, // string or array of strings (cycled)
  sayEvery: 3, // seconds per message
  sayTyping: false,
  bubbleSide: 'right', // right | left
  walk: { duration: 14, stopAt: 0.5, stopFor: 0.12, trick: 'flip', direction: 'ltr' }, // stopAt: 0..1 or null; trick: flip | spin | hop | none
};

export const TEXT_DEFAULTS = {
  text: '', // string or array of strings (cycled)
  x: '50%',
  y: 40,
  size: 16,
  weight: 700,
  align: 'middle', // start | middle | end
  color: 'text', // text | muted | accent | any css color
  every: 3,
  typing: false,
};

// The whimsical "thinking" verbs of the Claude Code spinner. Use verbs: "claude" to pick from them.
export const CLAUDE_VERBS = [
  'Accomplishing', 'Actualizing', 'Baking', 'Booping', 'Brewing', 'Cerebrating', 'Channelling', 'Churning', 'Clauding',
  'Coalescing', 'Cogitating', 'Combobulating', 'Concocting', 'Conjuring', 'Contemplating', 'Crunching', 'Deciphering',
  'Deliberating', 'Discombobulating', 'Divining', 'Elucidating', 'Enchanting', 'Envisioning', 'Finagling',
  'Flibbertigibbeting', 'Forging', 'Frolicking', 'Germinating', 'Hatching', 'Herding', 'Honking', 'Hustling', 'Ideating',
  'Incubating', 'Jiving', 'Manifesting', 'Marinating', 'Meandering', 'Moseying', 'Mulling', 'Mustering', 'Musing',
  'Noodling', 'Percolating', 'Perusing', 'Philosophising', 'Pondering', 'Pontificating', 'Puttering', 'Puzzling',
  'Reticulating', 'Ruminating', 'Scheming', 'Schlepping', 'Shimmying', 'Shucking', 'Simmering', 'Smooshing',
  'Spelunking', 'Stewing', 'Sussing', 'Synthesizing', 'Tinkering', 'Transmogrifying', 'Unfurling', 'Unravelling',
  'Vibing', 'Wandering', 'Whirring', 'Wibbling', 'Wizarding', 'Wrangling',
];

export const STATUS_DEFAULTS = {
  verbs: 'claude', // "claude" = random pick from CLAUDE_VERBS; or your own list, which may contain "claude" too
  count: 12, // how many verbs "claude" expands to
  seed: 1, // change for a different pick/order; builds stay reproducible
  x: 24,
  y: 30,
  size: 15,
  every: 2.5,
  hint: 'esc to interrupt', // '' to hide
  color: ORANGE,
};

// ---------------------------------------------------------------- helpers

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function deepMerge(base, over) {
  if (!isObj(over)) return over === undefined ? base : over;
  const out = { ...(isObj(base) ? base : {}) };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  return out;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = (n) => Math.round(n * 100) / 100;
const list = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v.filter((s) => s !== '') : [v]);
const px = (v, total) => (typeof v === 'string' && v.trim().endsWith('%') ? (parseFloat(v) / 100) * total : Number(v) || 0);
const colorOf = (c) => (c === 'text' || c === 'muted' ? `var(--${c})` : c === 'accent' ? ORANGE : c);

// Deterministic shuffle (mulberry32), so the same seed always renders the same SVG.
function seededShuffle(items, seed) {
  let a = seed >>> 0 || 1;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function shade(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + amount))));
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('');
}

const rect = (x, y, w, h, extra = '') => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}"${extra}/>`;
const anim = (name, dur, { delay = 0, timing = 'ease-in-out', box = false, origin = '50% 50%', vars = '' } = {}) =>
  ` style="animation:${name} ${r(dur)}s ${timing} ${r(delay)}s infinite;${box ? `transform-box:fill-box;transform-origin:${origin};` : ''}${vars}"`;

// ---------------------------------------------------------------- shared keyframes

const BASE_KEYFRAMES = `
@keyframes cl-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes cl-look{0%{transform:translateX(0)}20%{transform:translateX(-.5px)}40%{transform:translateX(0)}60%{transform:translateX(.5px)}80%{transform:translateX(0)}}
@keyframes cl-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(var(--hop))}}
@keyframes cl-squash{0%,100%{transform:scale(1.08,.9)}25%{transform:scale(1,1)}50%{transform:scale(.96,1.05)}}
@keyframes cl-bounce{0%,66%,76%,86%,100%{transform:translateY(0)}71%,81%{transform:translateY(var(--hop))}}
@keyframes cl-bsquash{0%,64%,90%,100%{transform:scale(1,1)}66%,76%,86%{transform:scale(1.12,.86)}71%,81%{transform:scale(.94,1.06)}}
@keyframes cl-legs{0%{transform:translateY(0)}50%{transform:translateY(-.6px)}}
@keyframes cl-wave{0%,24%,100%{transform:translateY(0)}4%,12%,20%{transform:translateY(-2px)}8%,16%{transform:translateY(-1px)}}
@keyframes cl-sway{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes cl-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.95)}}
@keyframes cl-z{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}100%{opacity:0;transform:translate(12px,-26px)}}
@keyframes cl-shadow{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(.7);opacity:.15}}
@keyframes cl-spin{to{transform:rotate(360deg)}}
@keyframes cl-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes cl-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(28px)}}
@keyframes cl-twinkle{0%,100%{opacity:.2;transform:scale(.6)}50%{opacity:1;transform:scale(1)}}
@keyframes cl-steam{0%{opacity:0;transform:translateY(0)}30%{opacity:.8}100%{opacity:0;transform:translateY(-1.6px)}}
@keyframes cl-flowersway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}`;

// Opacity window for message i of n, and a typewriter reveal inside that window.
function cycleKeyframes(n) {
  const slot = 100 / n;
  const fade = Math.min(2, slot / 10);
  return (
    `@keyframes cl-cycle-${n}{0%{opacity:0}${r(fade)}%{opacity:1}${r(slot - fade)}%{opacity:1}${r(slot)}%{opacity:0}100%{opacity:0}}` +
    `@keyframes cl-type-${n}{0%{transform:scaleX(0)}${r(slot * 0.45)}%{transform:scaleX(1)}100%{transform:scaleX(1)}}`
  );
}

// ---------------------------------------------------------------- clawd sprite (unit grid: 11 wide, 8 tall)

const SPRITE_W = 11;
const SPRITE_H = 8;

function eyesSvg(style, by) {
  const L = 2.5, R = 8.5, y = by + 2.5; // eye centers
  const dark = ' fill="#141413"';
  const pair = (fn) => fn(L) + fn(R);
  switch (style) {
    case 'tall': return pair((c) => rect(c - 0.5, y - 1, 1, 2, dark));
    case 'wide': return pair((c) => rect(c - 1, y - 0.5, 2, 1, dark));
    case 'closed': return pair((c) => rect(c - 0.75, y, 1.5, 0.45, dark));
    case 'happy': return pair((c) => rect(c - 0.9, y, 0.6, 0.6, dark) + rect(c - 0.3, y - 0.6, 0.6, 0.6, dark) + rect(c + 0.3, y, 0.6, 0.6, dark));
    case 'sparkly': return pair((c) => rect(c - 0.75, y - 0.75, 1.5, 1.5, dark) + rect(c - 0.5, y - 0.5, 0.5, 0.5, ' fill="#ffffff"'));
    default: return pair((c) => rect(c - 0.5, y - 0.5, 1, 1, dark));
  }
}

function accessoriesSvg(items, by, body, t) {
  let out = '';
  const has = (k) => items.includes(k);
  if (has('glasses')) {
    const g = ' fill="none" stroke="#5c1a33" stroke-width=".45"';
    out += rect(1.35, by + 1.35, 2.3, 2.3, g) + rect(7.35, by + 1.35, 2.3, 2.3, g) + rect(3.6, by + 2.1, 3.8, 0.45, ' fill="#5c1a33"');
  }
  if (has('party')) {
    out += `<g fill="#e05d8a">${rect(4, by - 1, 3, 1)}${rect(4.5, by - 2, 2, 1)}${rect(5, by - 3, 1, 1)}</g>` +
      rect(4.75, by - 1.8, 0.5, 0.5, ' fill="#f2b24b"') + rect(5.75, by - 0.8, 0.5, 0.5, ' fill="#f2b24b"') + rect(4.9, by - 3.8, 1.2, 0.8, ' fill="#f2b24b"');
  }
  if (has('crown')) {
    out += `<g fill="#f2b24b">${rect(3, by - 1, 5, 1)}${rect(3, by - 2, 1, 1)}${rect(5, by - 2, 1, 1)}${rect(7, by - 2, 1, 1)}</g>` + rect(5.25, by - 0.75, 0.5, 0.5, ' fill="#e05d8a"');
  }
  if (has('tophat')) {
    out += `<g fill="#2b2320">${rect(2.5, by - 0.6, 6, 0.6)}${rect(3.5, by - 3.6, 4, 3)}</g>` + rect(3.5, by - 1.4, 4, 0.5, ` fill="${shade(body, -0.25)}"`);
  }
  if (has('book')) {
    out += rect(8.2, by + 3, 2.6, 3.2, ' fill="#3f3a80"') + rect(8.2, by + 3, 0.5, 3.2, ' fill="#e8e1d4"');
  }
  if (has('laptop')) {
    out += rect(2.5, by + 3.4, 6, 3, ' fill="#3a3a3a"') + rect(1.5, by + 6.2, 8, 0.6, ' fill="#8b8b8b"');
    out += `<g transform="translate(5.5 ${r(by + 4.9)})" stroke="${ORANGE}" stroke-width=".3" stroke-linecap="round">${sparkleLines(0.9)}</g>`;
  }
  if (has('coffee')) {
    const mug = ' fill="#f5f0e8"';
    out += rect(11, by + 2.6, 2, 2.2, mug) + rect(13, by + 3, 0.6, 1.2, mug) + rect(11, by + 2.6, 2, 0.45, ' fill="#6f4e37"');
    for (const [i, sx] of [[0, 11.3], [1, 12.2]]) out += `<g${anim('cl-steam', 2.4 / t.speed, { delay: t.delay + i * 1.2, timing: 'ease-out' })}>${rect(sx, by + 1.4, 0.45, 0.8, ' fill="#c8c1b6"')}</g>`;
  }
  return out;
}

const hatExtra = (items) => (items.includes('tophat') || items.includes('party') ? 4 : items.includes('crown') ? 2 : 0);

function sprite(c) {
  const sit = c.pose === 'sit';
  const by = sit ? 1 : 0; // body top
  const legH = sit ? 1 : 2;
  const t = { speed: c.speed, delay: c.delay };
  const walking = c.animation === 'walk';
  const legs = (xs) => xs.map((x) => rect(x, by + 6, 1, legH)).join('');
  let s = '';
  if (walking) {
    s += `<g${anim('cl-legs', 0.5 / c.speed, { timing: 'steps(1)' })}>${legs([1, 7])}</g>`;
    s += `<g${anim('cl-legs', 0.5 / c.speed, { timing: 'steps(1)', delay: -0.25 / c.speed })}>${legs([3, 9])}</g>`;
  } else s += legs([1, 3, 7, 9]);
  s += rect(1, by, 9, 6) + rect(0, by + 2, 1, 2);
  const arm = rect(10, by + 2, 1, 2);
  s += c.animation === 'wave' ? `<g${anim('cl-wave', 3 / c.speed, { timing: 'steps(1)', delay: c.delay })}>${arm}</g>` : arm;

  let eyes = eyesSvg(c.eyes, by);
  const canBlink = c.blink && !['closed', 'happy'].includes(c.eyes) && c.animation !== 'sleep';
  if (canBlink) eyes = `<g${anim('cl-blink', 3.5 / c.speed, { delay: c.delay, timing: 'linear', box: true })}>${eyes}</g>`;
  if (c.look && !walking && c.animation !== 'sleep') eyes = `<g${anim('cl-look', 7 / c.speed, { delay: c.delay, timing: 'steps(1)' })}>${eyes}</g>`;
  s += eyes;
  s += accessoriesSvg(list(c.accessories), by, c.color, t);
  return `<g fill="${esc(c.color)}" shape-rendering="crispEdges">${s}</g>`;
}

const sparkleLines = (rad) => {
  const d = rad * Math.SQRT1_2;
  return `<line x1="0" y1="${-rad}" x2="0" y2="${rad}"/><line x1="${-rad}" y1="0" x2="${rad}" y2="0"/>` +
    `<line x1="${r(-d)}" y1="${r(-d)}" x2="${r(d)}" y2="${r(d)}"/><line x1="${r(-d)}" y1="${r(d)}" x2="${r(d)}" y2="${r(-d)}"/>`;
};

// ---------------------------------------------------------------- speech bubbles & text

function bubble(text, anchorX, bottomY, side, size = 14) {
  const w = text.length * size * CHAR_W + 22;
  const h = size + 16;
  const x = side === 'left' ? anchorX - w : anchorX;
  const y = bottomY - h;
  const tail = side === 'left' ? [x + w - 10, x + w - 22, x + w - 4] : [x + 10, x + 4, x + 22];
  return `<g><rect class="cl-bub" x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${h}" rx="8" stroke-width="2"/>` +
    `<path class="cl-bub" d="M${r(tail[0])} ${r(y + h - 1)} L${r(tail[1])} ${r(y + h + 10)} L${r(tail[2])} ${r(y + h - 1)} Z" stroke-width="2" stroke-linejoin="round"/>` +
    `<rect class="cl-bubfill" x="${r(Math.min(tail[0], tail[2]) + 1)}" y="${r(y + h - 3)}" width="10" height="4"/>` +
    `<text class="cl-txt" x="${r(x + w / 2)}" y="${r(y + h / 2 + size * 0.36)}" text-anchor="middle" font-size="${size}" font-weight="700">${esc(text)}</text></g>`;
}

// A text that is optionally typed out. Returns svg for one message; clip ids must be unique.
function typedText(ctx, { msg, x, y, size, weight, anchor, fill, typing, n, every, delay, extraClass = '' }) {
  const w = msg.length * size * CHAR_W * 1.15; // generous: real fonts run wider than the estimate
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const t = `<text${extraClass ? ` class="${extraClass}"` : ''} x="${r(x)}" y="${r(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}"${fill ? ` fill="${esc(fill)}"` : ''}>${esc(msg)}</text>`;
  if (!typing) return t;
  const id = `cl-clip-${ctx.uid++}`;
  const steps = Math.max(1, msg.length);
  ctx.defs.push(`<clipPath id="${id}"><rect x="${r(left - 4)}" y="${r(y - size * 1.1)}" width="${r(w + 12)}" height="${r(size * 1.5)}" style="animation:cl-type-${n} ${r(n * every)}s steps(${steps}) ${r(delay)}s infinite;transform-box:fill-box;transform-origin:0 50%"/></clipPath>`);
  return `<g clip-path="url(#${id})">${t}</g>`;
}

// Wrap several messages into a cycling group. render(msg, i) -> svg.
function cycle(ctx, msgs, every, delay, render) {
  const n = msgs.length;
  if (n === 0) return '';
  if (n === 1) return render(msgs[0], 0, 1);
  ctx.keyframes.add(cycleKeyframes(n));
  return msgs.map((m, i) => `<g style="opacity:0;animation:cl-cycle-${n} ${r(n * every)}s linear ${r(delay + i * every)}s infinite">${render(m, i, n)}</g>`).join('');
}

// ---------------------------------------------------------------- clawd actor

function renderClawd(ctx, raw, index) {
  const c = deepMerge(CLAWD_DEFAULTS, raw);
  if (c.animation === 'sleep' && !raw.eyes) c.eyes = 'closed';
  c.speed = Math.max(0.1, Number(c.speed) || 1);
  const u = Math.max(1, Number(c.size) || 6);
  const w = SPRITE_W * u, h = SPRITE_H * u;
  const { width, groundY } = ctx;
  const cx = px(c.x, width);
  const walking = c.animation === 'walk';
  const top = -(hatExtra(list(c.accessories)) * u);
  const msgs = list(c.say);
  const d = c.delay;

  // body motion
  let motion = '', squash = '', shadowAnim = '';
  const hopVar = `--hop:${-Math.abs(c.hopHeight)}px;`;
  switch (c.animation) {
    case 'hop':
    case 'walk':
      motion = anim('cl-hop', 0.5 / c.speed, { delay: d, vars: hopVar });
      squash = anim('cl-squash', 0.5 / c.speed, { delay: d, box: true, origin: '50% 100%' });
      shadowAnim = anim('cl-shadow', 0.5 / c.speed, { delay: d, box: true });
      break;
    case 'bounce':
      motion = anim('cl-bounce', 4 / c.speed, { delay: d, vars: hopVar });
      squash = anim('cl-bsquash', 4 / c.speed, { delay: d, box: true, origin: '50% 100%' });
      break;
    case 'dance':
      motion = anim('cl-sway', 1 / c.speed, { delay: d, box: true, origin: '50% 100%' });
      squash = anim('cl-squash', 0.5 / c.speed, { delay: d, box: true, origin: '50% 100%' });
      break;
    case 'sleep':
      squash = anim('cl-breathe', 3 / c.speed, { delay: d, box: true, origin: '50% 100%' });
      break;
  }

  let body = `<g${squash}><g transform="scale(${u})">${sprite(c)}</g></g>`;
  body = motion ? `<g${motion}>${body}</g>` : body;

  // extras that ride along with the clawd
  let extras = '';
  if (c.animation === 'sleep') {
    extras += [0, 1, 2].map((i) => `<text class="cl-muted-fill" x="${r(w * 0.85)}" y="${r(top - 2)}" font-size="${12 + i * 2}" font-weight="700" style="opacity:0;animation:cl-z 3s ease-out ${r(d + i)}s infinite">z</text>`).join('');
  }

  const bubbleX = c.bubbleSide === 'left' ? w * 0.3 : w * 0.7;
  const bubbleY = top - 12;

  if (!walking) {
    if (msgs.length) extras += cycle(ctx, msgs, c.sayEvery, d, (m) => bubble(m, bubbleX, bubbleY, c.bubbleSide));
    const shadow = c.shadow ? `<ellipse cx="${r(w / 2)}" cy="${r(h + 1.5)}" rx="${r(w * 0.45)}" ry="${r(u * 0.6)}" fill="#000" opacity=".3"${shadowAnim}/>` : '';
    return `<g transform="translate(${r(cx - w / 2)} ${r(groundY - h)})">${shadow}${body}${extras}</g>`;
  }

  // walk: across the scene, optional stop with a trick and the first message
  const wk = deepMerge(CLAWD_DEFAULTS.walk, c.walk || {});
  const dur = Math.max(2, Number(wk.duration) || 14) / c.speed;
  const startX = -w - 20, endX = width + 20;
  const rtl = wk.direction === 'rtl';
  const pos = (p) => r(rtl ? endX + startX - p - w : p);
  const id = `cl-w${index}`;
  let walkKf, trickKf = '', showKf = '';
  if (wk.stopAt == null || wk.stopAt === false) {
    walkKf = `0%{transform:translateX(${pos(startX)}px)}100%{transform:translateX(${pos(endX)}px)}`;
  } else {
    const stopX = Number(wk.stopAt) * width - w / 2;
    const stopFor = Math.min(0.8, Math.max(0.02, Number(wk.stopFor) || 0.12));
    const d1 = stopX - startX, d2 = endX - stopX;
    const t1 = (1 - stopFor) * (d1 / (d1 + d2)) * 100;
    const t2 = t1 + stopFor * 100;
    walkKf = `0%{transform:translateX(${pos(startX)}px)}${r(t1)}%,${r(t2)}%{transform:translateX(${pos(stopX)}px)}100%{transform:translateX(${pos(endX)}px)}`;
    const mid = (t1 + t2) / 2, span = (t2 - t1) / 2;
    const a = r(mid - span * 0.35), m = r(mid), b = r(mid + span * 0.35);
    if (wk.trick === 'flip') trickKf = `0%,${a}%{transform:translateY(0) rotate(0deg)}${m}%{transform:translateY(${-h}px) rotate(180deg)}${b}%,100%{transform:translateY(0) rotate(360deg)}`;
    else if (wk.trick === 'spin') trickKf = `0%,${a}%{transform:rotate(0deg)}${b}%,100%{transform:rotate(360deg)}`;
    else if (wk.trick === 'hop') trickKf = `0%,${a}%,${b}%,100%{transform:translateY(0)}${m}%{transform:translateY(${-h}px)}`;
    showKf = `0%,${r(t1)}%{opacity:0}${r(t1 + 1)}%,${r(t2 - 1)}%{opacity:1}${r(t2)}%,100%{opacity:0}`;
    const sparkKf = `0%,${a}%{opacity:0;transform:scale(.2) rotate(0deg)}${m}%{opacity:1;transform:scale(1.2) rotate(45deg)}${b}%{opacity:1;transform:scale(1) rotate(90deg)}${r(t2)}%,100%{opacity:0;transform:scale(.4) rotate(120deg)}`;
    ctx.keyframes.add(`@keyframes ${id}-show{${showKf}}@keyframes ${id}-spark{${sparkKf}}`);
    if (trickKf) ctx.keyframes.add(`@keyframes ${id}-trick{${trickKf}}`);
    if (msgs.length) extras += `<g style="opacity:0;animation:${id}-show ${r(dur)}s linear ${r(d)}s infinite">${bubble(msgs[0], bubbleX, bubbleY, c.bubbleSide)}</g>`;
    if (wk.trick !== 'none') extras += `<g style="opacity:0;animation:${id}-spark ${r(dur)}s linear ${r(d)}s infinite;transform-box:fill-box;transform-origin:50% 50%"><g transform="translate(${r(-u)} ${r(top + u)})" stroke="${esc(c.color)}" stroke-width="4" stroke-linecap="round">${sparkleLines(10)}</g></g>`;
  }
  ctx.keyframes.add(`@keyframes ${id}{${walkKf}}`);
  if (trickKf) body = `<g style="animation:${id}-trick ${r(dur)}s ease-in-out ${r(d)}s infinite;transform-box:fill-box;transform-origin:50% 50%">${body}</g>`;
  const shadow = c.shadow ? `<ellipse cx="${r(w / 2)}" cy="${r(h + 1.5)}" rx="${r(w * 0.45)}" ry="${r(u * 0.6)}" fill="#000" opacity=".3"${shadowAnim}/>` : '';
  return `<g transform="translate(0 ${r(groundY - h)})"><g style="animation:${id} ${r(dur)}s linear ${r(d)}s infinite;transform:translateX(${pos(startX)}px)">${shadow}${body}${extras}</g></g>`;
}

// ---------------------------------------------------------------- texts, status line, decor

function renderText(ctx, raw) {
  const t = deepMerge(TEXT_DEFAULTS, raw);
  const msgs = list(t.text);
  const x = px(t.x, ctx.width), y = px(t.y, ctx.height);
  const fill = colorOf(t.color);
  return cycle(ctx, msgs, t.every, 0, (msg, i, n) => {
    if (t.typing && n === 1) ctx.keyframes.add(cycleKeyframes(1));
    return typedText(ctx, { msg, x, y, size: t.size, weight: t.weight, anchor: t.align, fill, typing: t.typing, n, every: t.every, delay: i * t.every });
  });
}

function renderStatus(ctx, raw) {
  const s = deepMerge(STATUS_DEFAULTS, raw);
  const x = px(s.x, ctx.width), y = px(s.y, ctx.height);
  // "claude" (alone or as a list entry) expands to a seeded random pick from CLAUDE_VERBS
  const own = list(s.verbs).filter((v) => v !== 'claude');
  const pick = list(s.verbs).includes('claude')
    ? seededShuffle(CLAUDE_VERBS.filter((v) => !own.includes(v)), Number(s.seed) || 1).slice(0, Math.max(1, Number(s.count) || 12))
    : [];
  const verbs = list(s.verbs).flatMap((v) => (v === 'claude' ? pick : [v]));
  const star = `<g transform="translate(${r(x + s.size * 0.45)} ${r(y - s.size * 0.33)})"><g style="animation:cl-spin 2.4s linear infinite,cl-pulse 1.2s ease-in-out infinite" stroke="${esc(s.color)}" stroke-width="${r(s.size / 7)}" stroke-linecap="round">${sparkleLines(s.size * 0.42)}</g></g>`;
  const tx = x + s.size * 1.4;
  const lines = cycle(ctx, verbs, s.every, 0, (verb, i, n) => {
    const label = `${verb}…`;
    if (n === 1) ctx.keyframes.add(cycleKeyframes(1));
    let out = typedText(ctx, { msg: label, x: tx, y, size: s.size, weight: 700, anchor: 'start', fill: s.color, typing: true, n, every: s.every, delay: i * s.every });
    if (s.hint) out += `<text class="cl-muted-fill" x="${r(tx + (label.length + 1) * s.size * CHAR_W)}" y="${r(y)}" font-size="${r(s.size * 0.85)}">(${esc(s.hint)})</text>`;
    return out;
  });
  return star + lines;
}

function renderDecor(ctx, raw) {
  const type = raw.type;
  const x = px(raw.x ?? '50%', ctx.width);
  const k = Number(raw.scale) || 1;
  // decor is drawn in px (not scaled groups) so the dither pattern keeps its fine grain
  const blocks = (u, list, extra) => list.map(([bx, by, bw, bh]) => rect(bx * u, by * u, bw * u, bh * u, extra)).join('');
  if (type === 'cloud') {
    const y = px(raw.y ?? 18, ctx.height);
    const u = 6 * k;
    const dur = 12 / (Number(raw.speed) || 1);
    return `<g transform="translate(${r(x - 10 * u)} ${r(y)})"><g style="animation:cl-drift ${r(dur)}s ease-in-out infinite" fill="url(#cl-dither)" shape-rendering="crispEdges">${blocks(u, [[5, 0, 8, 2], [0, 2, 20, 3]])}</g></g>`;
  }
  if (type === 'flower') {
    const u = 5 * k;
    const dither = ' fill="url(#cl-dither)"';
    const petals = blocks(u, [[2, 0, 2, 2], [0, 2, 2, 2], [4, 2, 2, 2], [2, 4, 2, 2]], dither) + blocks(u, [[2, 2, 2, 2]], ' class="cl-decor-fill"');
    const stem = blocks(u, [[2.5, 6, 1, 1.5], [3, 7.5, 1, 1.5], [2.5, 9, 1, 1.5], [2, 10.5, 1, 1.5]], dither);
    return `<g transform="translate(${r(x - 3 * u)} ${r(ctx.groundY - 12 * u)})"><g style="animation:cl-flowersway 4s ease-in-out ${r(raw.delay || 0)}s infinite;transform-box:fill-box;transform-origin:50% 100%" shape-rendering="crispEdges">${stem}${petals}</g></g>`;
  }
  if (type === 'sparkle') {
    const y = px(raw.y ?? 24, ctx.height);
    const color = raw.color || ORANGE;
    return `<g transform="translate(${r(x)} ${r(y)})"><g style="animation:cl-twinkle ${r(raw.every || 2.4)}s ease-in-out ${r(raw.delay || 0)}s infinite;transform-box:fill-box;transform-origin:50% 50%" stroke="${esc(color)}" stroke-width="${r(2.5 * k)}" stroke-linecap="round">${sparkleLines(7 * k)}</g></g>`;
  }
  return '';
}

// ---------------------------------------------------------------- scene

export function renderScene(input = {}, { theme: forceTheme } = {}) {
  const s = deepMerge(SCENE_DEFAULTS, input);
  const width = Number(s.width) || 900;
  const height = Number(s.height) || 130;
  const ground = deepMerge(SCENE_DEFAULTS.ground, s.ground || {});
  const groundY = ground.y == null ? height - 16 : px(ground.y, height);
  const ctx = { width, height, groundY, keyframes: new Set(), defs: [], uid: 0 };

  const light = { ...THEMES.light, ...(s.theme?.light || {}) };
  const dark = { ...THEMES.dark, ...(s.theme?.dark || {}) };
  if (s.background) {
    if (s.background.light) light.background = s.background.light;
    if (s.background.dark) dark.background = s.background.dark;
  }
  const vars = (t) => Object.entries(t).map(([k, v]) => `--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v};`).join('');

  const parts = [];
  if (s.background) parts.push(`<rect class="cl-bg" width="${width}" height="${height}" rx="${Number(s.background.radius ?? 12)}"/>`);
  if (ground.style && ground.style !== 'none') {
    const gw = Number(ground.width) || 2;
    const dash = ground.style === 'dotted' ? ` stroke-dasharray="0 ${r(gw * 2.6)}"` : ground.style === 'dashed' ? ` stroke-dasharray="${r(gw * 3)} ${r(gw * 3)}"` : '';
    parts.push(`<line class="cl-ground" x1="${r(gw)}" y1="${r(groundY + gw / 2)}" x2="${r(width - gw)}" y2="${r(groundY + gw / 2)}" stroke-width="${gw}" stroke-linecap="round"${dash}/>`);
  }
  for (const d of list(s.decor)) parts.push(renderDecor(ctx, d));
  for (const t of list(s.texts)) parts.push(renderText(ctx, t));
  if (s.status) parts.push(renderStatus(ctx, s.status === true ? {} : s.status));
  list(s.clawds).forEach((c, i) => parts.push(renderClawd(ctx, c, i)));

  const themeCss = forceTheme
    ? `:root{${vars(forceTheme === 'dark' ? dark : light)}}`
    : `:root{${vars(light)}}@media (prefers-color-scheme: dark){:root{${vars(dark)}}}`;

  const css = `${themeCss}
text{font-family:${FONT}}
.cl-bg{fill:var(--background)}
.cl-ground{stroke:var(--ground)}
.cl-bub{fill:var(--bubble);stroke:var(--bubble-stroke)}
.cl-bubfill{fill:var(--bubble)}
.cl-txt{fill:var(--text)}
.cl-muted-fill{fill:var(--muted)}
.cl-decor-fill{fill:var(--decor)}
${BASE_KEYFRAMES}
${[...ctx.keyframes].join('\n')}`;

  const label = esc(s.title || 'Clawd, the Claude Code mascot');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${label}">
<style>${css}</style>
<defs><pattern id="cl-dither" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="1.5" height="1.5" class="cl-decor-fill"/></pattern>${ctx.defs.join('')}</defs>
${parts.join('\n')}
</svg>
`;
}
