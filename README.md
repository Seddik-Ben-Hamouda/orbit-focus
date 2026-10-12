# OrbitFocus

**A zero-dependency 3D orbit carousel.** One image sits in focus in the middle while a ring of small thumbnails orbits around it. Scroll, drag, swipe or use the arrow keys and the ring spins, the focus image cross-fades to the next one, and the title updates.

- 🌀 **Desktop:** thumbnails travel along an elliptical 3D orbit, passing in front of and behind the focus image.
- 📱 **Phone:** the orbit becomes **one straight, swipeable row** under the focus image.
- 🖱️ Click the focus image to do anything you want (open a product, a case study, an order page…).
- 📦 About 4 KB gzipped (JS + CSS), no dependencies. Plain HTML/CSS/JS, plus a React wrapper and TypeScript types.

> **Template.** Fork it, swap the images and text, and ship it. The `examples/order-page` demo shows a complete "click the image → place an order" flow.

<!-- Add a preview GIF/screenshot: docs/preview.gif -->
<!-- ![OrbitFocus preview](docs/preview.gif) -->

---

## Quick start

### 1. Plain HTML (no build, no server)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/orbit-focus@1.0.0/dist/orbit-focus.css">

<div id="gallery" style="height:100vh"></div>

<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/orbit-focus@1.0.0/dist/orbit-focus.global.js"></script>
<script>
  new OrbitFocus('#gallery', {
    items: [
      { title: 'Nordhaus',    image: 'img/1-big.jpg', thumb: 'img/1-small.jpg' },
      { title: 'Aster Bloom', image: 'img/2-big.jpg', thumb: 'img/2-small.jpg' },
      // …8 to 20 items look best
    ],
    onActivate: (item, index) => console.log('clicked', item.title)
  });
</script>
```

You can also download the repo and use `dist/orbit-focus.global.js` and `dist/orbit-focus.css` directly. They work when you double-click the HTML file.

### 2. ES modules / bundlers (Vite, webpack, Next.js…)

```bash
npm install orbit-focus
```

```js
import { OrbitFocus } from 'orbit-focus';
import 'orbit-focus/style.css';

const gallery = new OrbitFocus('#gallery', { items });
// gallery.next(); gallery.prev(); gallery.goTo(3); gallery.destroy();
```

### 3. React

```jsx
import OrbitFocus from 'orbit-focus/react';
import 'orbit-focus/style.css';

<div style={{ height: '100vh' }}>
  <OrbitFocus items={items} onChange={(item) => …} onActivate={(item) => …} />
</div>
```

Keep `items` stable (a constant or `useMemo`): the carousel is rebuilt only when `items` changes. See [`examples/react/App.jsx`](examples/react/App.jsx).

---

## Options

| Option | Default | Description |
|---|---|---|
| `items` | `[]` | `[{ title, image, thumb?, ...yourData }]`. `thumb` is the small version (defaults to `image`). Extra fields are passed back to your callbacks. |
| `initialIndex` | `0` | Which item starts in focus. |
| `mobileBreakpoint` | `700` | Container width (px) under which the single-row layout is used. |
| `boxRatio` | `1.16` | Focus image height ÷ width. |
| `maxBoxWidth` | `500` | Max width of the focus box (px). |
| `radiusX` / `radiusY` | auto | Orbit width / height in px (desktop). |
| `depth` | `260` | How much closer the front of the orbit is (px, desktop). |
| `smoothing` | `5.5` | Higher = snappier, lower = floatier. |
| `buttonLabel` | `'Open'` | Text of the title-bar button. `''` removes it. |
| `onChange(item, i)` | – | Fired when the focused image changes. |
| `onActivate(item, i)` | – | Fired when the focus box (or its button) is clicked or tapped. |

**Methods:** `next()`, `prev()`, `goTo(i)`, `destroy()`, and the read-only `index`.

## Theming

Override CSS variables on the container (or `:root`):

```css
#gallery {
  --of-bg: #0e0e0e;
  --of-fg: #f2f2f2;
  --of-bar-bg: #1d1d1d;
  --of-button-bg: #fff;
  --of-button-fg: #111;
  --of-perspective: 1400px;
}
```

The component fills its container, so give the container a height (`height: 100vh`, a fixed height, or a flex/grid cell).

---

## How it works

1. **Position, not index.** The carousel keeps one floating-point number, `pos`, that smoothly chases a `target`. Scrolling, dragging and key presses only change `target`.
2. **Frame-rate independent easing.** `pos += (target − pos) · (1 − e^(−dt·k))`, so it feels the same on 60 Hz and 144 Hz screens.
3. **Orbit math.** Each thumbnail's offset from the focus is `d = wrap(i − pos)` and its angle is `θ = d · 2π / N`. Its position is an ellipse in 3D:
   `x = Rx·sin θ`, `y = Ry·cos θ`, `z = depth·cos θ`.
   `z` plus CSS `perspective` makes the front larger and the back smaller. Thumbnails with `cos θ > 0` get a higher `z-index` and pass in front of the focus box, and the rest pass behind it.
4. **Snap.** When you stop (or release your finger, after a small flick), `target` is rounded to the nearest whole image.
5. **Phone layout.** Under `mobileBreakpoint` the ellipse is replaced by a straight row: `x = d · spacing`. Dragging moves the row 1:1 with your finger.
6. **Only transforms and opacity are animated**, so it stays on the GPU and runs smoothly.

## Project structure

```
src/
  orbit-focus.js        core class (ES module, no dependencies)
  orbit-focus.css       styles + CSS variables
  orbit-focus.d.ts      TypeScript types
  react/OrbitFocus.jsx  React wrapper
dist/                   built files (ES module, global <script>, css)
examples/
  vanilla/              smallest possible example
  order-page/           click the image → order form (WhatsApp optional)
  react/                React example
scripts/build.mjs       zero-dependency build (node scripts/build.mjs)
```

## Browser support

Current Chrome, Edge, Safari and Firefox (needs CSS 3D transforms, `ResizeObserver` and Pointer Events). `prefers-reduced-motion` is respected.

## Accessibility

The container is focusable and responds to arrow keys. Thumbnails are real `<button>`s with labels. For the focus image's click action, provide the same action elsewhere on your page too if it's important.

## Credits

The interaction was inspired by the homepage of the *Bureau Nine* Framer template. This project contains **no code, images or branding** from that template. Demo photos come from [Lorem Picsum](https://picsum.photos) and are for demonstration only. Use your own images in real projects.

## License

[MIT](LICENSE)
