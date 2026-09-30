# Contributing to clawd-md

Thanks for wanting to make Clawd cuter! Every pixel counts — new accessories, poses, eyes, decor, scenes, playground features, docs fixes and bug reports are all welcome.

## Ideas to pick up

Nothing here is claimed yet. Open an issue or draft PR so others know you're on it.

- **Accessories:** headphones, beanie, scarf, wizard hat, sunglasses, a tiny keyboard, a rubber duck, a flag
- **Poses:** lying down, peeking in from the edge of the scene, jumping out of a box
- **Animations:** typing on the laptop, juggling, a slow walk with pauses, a thought bubble instead of a speech bubble
- **Decor:** pixel trees, stars at night, rain, a sun, grass tufts
- **Scenes:** seasonal presets (winter, halloween), a "contribution graph" scene, a loading bar
- **Playground:** undo/redo, shareable links (config in the URL), drag Clawds around the preview
- **Tooling:** snapshot tests for the renderer, an npm package, a GitHub Action on the Marketplace

## Getting started

```sh
git clone https://github.com/<you>/clawd-md && cd clawd-md
npm run build                 # renders clawd.config.json -> assets/*.svg (Node 18+, no dependencies)
python -m http.server 8000    # playground at http://localhost:8000
```

Everything lives in [`src/render.js`](./src/render.js):

- Clawd is drawn on an 11 × 8 unit grid (`sprite()`); accessories are extra `rect`s in the same units (`accessoriesSvg()`).
- Each animation sits on its own nested `<g>` so transforms don't fight. Shared keyframes are in `BASE_KEYFRAMES`.
- Options and their defaults are in `CLAWD_DEFAULTS`, `SCENE_DEFAULTS`, `TEXT_DEFAULTS` and `STATUS_DEFAULTS`.

## Pull request checklist

- [ ] Output is still pure SVG + CSS (no JavaScript, no external fonts or images) — GitHub strips everything else.
- [ ] Looks right in both light and dark mode (use the CSS variables, not hard-coded text colors).
- [ ] New options have a default and a row in the README config reference.
- [ ] New visuals are shown in a scene in `clawd.config.json`, and `npm run build` output is committed.
- [ ] Code, comments and docs are in English.

## Code of conduct

Be kind. Clawd would want it that way.
