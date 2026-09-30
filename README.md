<h1 align="center">clawd-md</h1>
<p align="center">Cute animated Clawd — the Claude Code mascot — for your GitHub README.<br/>
Walking, sitting, sleeping, dancing, with hats, laptops, speech bubbles and a Claude-Code-style status line.<br/>
Pure SVG + CSS. No JavaScript in the output, no GIFs. Light and dark mode built in. Everything configurable.</p>

<p align="center">
  <a href="#clawdify-your-readme-with-one-prompt"><b>✻ Clawdify with one prompt</b></a> ·
  <a href="https://jaameypr.github.io/clawd-md/">Playground</a> ·
  <a href="#setup">Setup</a> ·
  <a href="#config-reference">Config reference</a>
</p>

<img src="./assets/banner.svg" width="100%" alt="Clawd walking through a pixel landscape" />

## Gallery

| Scene | |
| --- | --- |
| `walk` — hops through, stops, says hi, does a flip | <img src="./assets/walk.svg" width="520" alt="" /> |
| `divider` — a cute replacement for `---` | <img src="./assets/divider.svg" width="520" alt="" /> |
| `sitting` — sitting Clawds with glasses, laptop, party hat and cycling messages | <img src="./assets/sitting.svg" width="520" alt="" /> |
| `status` — Claude Code spinner with the whimsical thinking verbs (Flibbertigibbeting…) | <img src="./assets/status.svg" width="520" alt="" /> |
| `party` — hats, dancing, sparkly eyes | <img src="./assets/party.svg" width="520" alt="" /> |
| `wave` | <img src="./assets/wave.svg" width="520" alt="" /> |
| `sleepy` | <img src="./assets/sleepy.svg" width="520" alt="" /> |
| `banner` — background, clouds, flowers, typed text | <img src="./assets/banner.svg" width="520" alt="" /> |

See it in the wild: [github.com/jaameypr](https://github.com/jaameypr) ([source](./examples/profile)).

## Clawdify your README with one prompt

Open [Claude Code](https://claude.com/claude-code) (or any coding agent) in the repo whose README you want to decorate — for a profile README that is the `<username>/<username>` repo — and paste this:

````text
Clawdify my README.md using https://github.com/jaameypr/clawd-md — animated pixel
Clawds (the Claude Code mascot) rendered as SVGs from a JSON config.

1. Clone the generator: git clone --depth 1 https://github.com/jaameypr/clawd-md .clawd-md
   Read .clawd-md/README.md (section "Config reference") and .clawd-md/clawd.config.json
   (the presets) so you know every option.
2. Read my README.md and understand who I am and what I work on.
3. Create clawd.config.json in the repo root with outDir "assets" and 2–3 scenes that
   fit my content. Less is more — for example:
   - a header scene with my name as text and a Clawd hopping by,
   - one status line ("✻ Flibbertigibbeting… (esc to interrupt)") using
     verbs: ["claude"] or a mix of my own verbs and "claude",
   - a calm footer with a few sitting / waving / sleeping Clawds.
   Match accessories and speech bubbles to my stack and hobbies. Keep bubble texts short.
4. Build: node .clawd-md/scripts/build.js clawd.config.json   (Node 18+, no npm install)
5. Insert the SVGs into README.md with relative paths, e.g.
   <p align="center"><img src="./assets/header.svg" width="100%" alt="…" /></p>
   Keep all my existing text. Give every image a meaningful alt text.
6. Delete .clawd-md, then show me the diff before committing anything.
````

Want it to stay editable on GitHub? Also add the workflow from [Keep it in sync](#keep-it-in-sync-with-a-github-action).

## Setup

### Option A — Playground (no install)

Open the [playground](https://jaameypr.github.io/clawd-md/), pick a preset, click around or edit the JSON, then *Download SVG*. Put the file into your repo (e.g. `assets/clawd.svg`) and reference it:

```html
<p align="center"><img src="./assets/clawd.svg" width="100%" alt="Clawd" /></p>
```

### Option B — Config in your own repo

1. Add a `clawd.config.json` to your repo (start from [the presets](./clawd.config.json) or [the profile example](./examples/profile/clawd.config.json)).
2. Build the SVGs — Node 18+, nothing to install:

   ```sh
   git clone --depth 1 https://github.com/jaameypr/clawd-md .clawd-md
   node .clawd-md/scripts/build.js clawd.config.json    # writes <outDir>/<scene>.svg
   ```

3. Reference `./assets/<scene>.svg` in your README and commit.

### Keep it in sync with a GitHub Action

Add `.github/workflows/clawd.yml` to your repo. Every time you edit `clawd.config.json` (even in the GitHub web editor), the SVGs are rebuilt and committed:

```yaml
name: Clawd
on:
  push:
    paths: ['clawd.config.json']
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/checkout@v4
        with:
          repository: jaameypr/clawd-md
          path: .clawd-md
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node .clawd-md/scripts/build.js clawd.config.json
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add assets
          git diff --cached --quiet || (git commit -m "chore: rebuild Clawd SVGs" && git push)
```

### Option C — Hotlink a ready-made SVG

Quickest, but you can't customize it:

```html
<p align="center">
  <img src="https://raw.githubusercontent.com/jaameypr/clawd-md/main/assets/walk.svg" width="100%" alt="Clawd hopping by" />
</p>
```

Swap `walk.svg` for any scene from the gallery; `divider.svg` works as a replacement for `---`.

### Option D — Use the renderer as a library

`src/render.js` is a dependency-free ES module that runs in Node and in the browser:

```js
import { renderScene } from './src/render.js';
const svg = renderScene({ clawds: [{ pose: 'sit', accessories: ['laptop'], say: ['git push', 'ship it'] }] });
```

### Working on clawd-md itself

```sh
git clone https://github.com/jaameypr/clawd-md && cd clawd-md
npm run build                 # renders clawd.config.json -> assets/*.svg
python -m http.server 8000    # playground at http://localhost:8000 (ES modules don't load from file://)
```

## Config reference

A config holds named scenes. Each scene becomes one SVG.

```json
{
  "outDir": "assets",
  "scenes": {
    "my-scene": { "height": 140, "clawds": [{ "pose": "sit", "say": "hi!" }] }
  }
}
```

### Scene

| Key | Default | Description |
| --- | --- | --- |
| `width`, `height` | `900`, `130` | Canvas size in px. Embed with `width="100%"` and it scales. |
| `ground` | `{ "style": "dotted", "y": null, "width": 3 }` | `style`: `dotted` · `dashed` · `solid` · `none`. `y` defaults to `height - 16`. |
| `background` | `null` | `{ "light": "#fdf6ec", "dark": "#1a1a17", "radius": 12 }` for a card look. |
| `theme` | GitHub colors | Override `ground`, `text`, `muted`, `bubble`, `bubbleStroke`, `decor` per `light` / `dark`. |
| `clawds` | `[]` | List of Clawds, see below. |
| `texts` | `[]` | Free text lines, see below. |
| `status` | `null` | Claude Code status line, see below. `true` uses defaults. |
| `decor` | `[]` | `{ "type": "cloud" \| "flower" \| "sparkle", "x", "y", "scale", "delay" }` |
| `title` | `Clawd, the Claude Code mascot` | Accessible label of the SVG. |

`x` and `y` values take px (`120`) or a percentage of the scene (`"50%"`).

### Clawd

| Key | Default | Options |
| --- | --- | --- |
| `x` | `"50%"` | Center position. |
| `size` | `6` | px per pixel. Clawd is 11 × 8 pixels. |
| `color` | `#D97757` | Any hex color. |
| `pose` | `stand` | `stand` · `sit` |
| `eyes` | `dots` | `dots` · `tall` · `wide` · `happy` · `sparkly` · `closed` |
| `accessories` | `[]` | `glasses` · `book` · `laptop` · `coffee` · `party` · `crown` · `tophat` (combine freely) |
| `animation` | `idle` | `idle` · `hop` · `bounce` · `walk` · `dance` · `wave` · `sleep` · `none` |
| `say` | `null` | A string, or a list of strings that cycle. |
| `sayEvery` | `3` | Seconds per message. |
| `bubbleSide` | `right` | `right` · `left` |
| `blink`, `look`, `shadow` | `true` | Blinking, glancing around, drop shadow. |
| `hopHeight` | `9` | px. |
| `speed` | `1` | Multiplier for all animations of this Clawd. |
| `delay` | `0` | Seconds; offsets multiple Clawds so they don't move in sync. |
| `walk` | `{ "duration": 14, "stopAt": 0.5, "stopFor": 0.12, "trick": "flip", "direction": "ltr" }` | Only for `animation: "walk"`. `stopAt` 0–1 or `null` for no stop. `trick`: `flip` · `spin` · `hop` · `none`. `direction`: `ltr` · `rtl`. The first `say` message shows while stopped. |

### Text

| Key | Default | Description |
| --- | --- | --- |
| `text` | `""` | A string, or a list that cycles. |
| `x`, `y` | `"50%"`, `40` | Position (y is the baseline). |
| `size`, `weight` | `16`, `700` | Monospace font. |
| `align` | `middle` | `start` · `middle` · `end` |
| `color` | `text` | `text` · `muted` · `accent` · any CSS color. |
| `every` | `3` | Seconds per message. |
| `typing` | `false` | Typewriter effect. |

### Status line

The Claude Code spinner: `✻ Flibbertigibbeting… (esc to interrupt)`, typed out verb by verb.

| Key | Default | Description |
| --- | --- | --- |
| `verbs` | `"claude"` | `"claude"` picks from the ~70 real Claude Code thinking verbs (Combobulating, Transmogrifying, Reticulating, …). Or your own list, which may contain `"claude"` as an entry: `["Flibbertigibbeting", "Shipping", "claude"]`. |
| `count` | `12` | How many verbs `"claude"` expands to. |
| `seed` | `1` | Change it for a different random pick. The same seed always gives the same SVG. |
| `x`, `y`, `size` | `24`, `30`, `15` | |
| `every` | `2.5` | Seconds per verb. |
| `hint` | `"esc to interrupt"` | `""` hides it. |
| `color` | `#D97757` | |

## How it works

GitHub strips scripts and styles from Markdown, but an SVG loaded through `<img>` keeps its own internal CSS — including `@keyframes` and `prefers-color-scheme`. Clawd is drawn with `<rect>`s on a pixel grid. Nested groups each carry one animation (walk, trick, hop, squash, legs, blink, look), so they combine without fighting over `transform`. Cycling messages are staggered opacity windows; typing is a `steps()` scale on a clip path.

## Contributing

New accessories, eyes, poses, decor or scenes are welcome. Add them to `src/render.js`, add a scene to `clawd.config.json`, run `npm run build` and open a PR.

## License

Code: [MIT](./LICENSE).

This is fan art. Clawd and Claude are Anthropic's; this project is not affiliated with or endorsed by Anthropic.
