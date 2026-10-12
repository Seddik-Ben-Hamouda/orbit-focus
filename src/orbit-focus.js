/*!
 * OrbitFocus — zero-dependency 3D orbit carousel
 * A ring of thumbnails orbits one focused image. Scroll / drag / swipe / arrow keys to spin.
 * Desktop: elliptical orbit around the focus box.  Phone: one straight swipeable row under it.
 * MIT License
 */

const DEFAULTS = {
  items: [],               // [{ title, image, thumb?, ...anything you want }]
  initialIndex: 0,
  mobileBreakpoint: 700,   // container width (px) below which the single-row layout is used
  boxRatio: 1.16,          // focus image height / width
  maxBoxWidth: 500,        // px
  radiusX: null,           // px, null = automatic (desktop only)
  radiusY: null,           // px, null = automatic (desktop only)
  depth: 260,              // px, how much closer the front of the orbit is (desktop only)
  smoothing: 5.5,          // higher = snappier, lower = floatier
  buttonLabel: 'Open',     // text of the button in the title bar, '' hides it
  onChange: null,          // (item, index) => void   when the focused image changes
  onActivate: null         // (item, index) => void   when the focus box (or its button) is clicked
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const cssUrl = (u) => `url(${JSON.stringify(u)})`;
function el(tag, cls) { const e = document.createElement(tag); e.className = cls; return e; }

export class OrbitFocus {
  constructor(target, options = {}) {
    this.root = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.root) throw new Error('OrbitFocus: container not found');
    this.opts = { ...DEFAULTS, ...options };
    this.items = this.opts.items;
    if (!this.items.length) throw new Error('OrbitFocus: "items" is empty');

    this.N = this.items.length;
    this.pos = this.target = this.opts.initialIndex;
    this.active = -1;
    this.down = false;
    this.dragged = false;
    this.vel = 0;
    this.moved = 0;
    this.layout = { phone: false, Rx: 400, Ry: 300, Z: 260, sp: 80, rowY: 0 };
    this._reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._build();
    this._bind();
    this._measure();
    this._raf = requestAnimationFrame((t) => this._frame(t));
  }

  /* ---------- public API ---------- */
  get index() { return ((Math.round(this.pos) % this.N) + this.N) % this.N; }
  next() { this.target = Math.round(this.target) + 1; }
  prev() { this.target = Math.round(this.target) - 1; }
  goTo(i) { this.target = Math.round(this.pos) + Math.round(this._wrap(i - this.pos)); }
  destroy() {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._idle);
    this._ro.disconnect();
    this._off.forEach((off) => off());
    this.root.classList.remove('of-root');
    this.root.innerHTML = '';
  }

  /* ---------- DOM ---------- */
  _build() {
    const r = this.root;
    r.classList.add('of-root');
    if (!r.hasAttribute('tabindex')) r.tabIndex = 0;
    r.setAttribute('role', 'region');
    if (!r.hasAttribute('aria-label')) r.setAttribute('aria-label', 'Image carousel');
    r.innerHTML = '';

    this.stage = el('div', 'of-stage');
    this.main = el('div', 'of-main');
    const bar = el('div', 'of-bar');
    this.titleEl = el('span', 'of-title');
    bar.appendChild(this.titleEl);
    if (this.opts.buttonLabel) {
      this.button = el('button', 'of-button');
      this.button.type = 'button';
      this.button.textContent = this.opts.buttonLabel;
      bar.appendChild(this.button);
    }
    this.media = el('div', 'of-media');
    this.layers = this.items.map((it) => {
      const l = el('div', 'of-layer');
      l.style.backgroundImage = cssUrl(it.image);
      this.media.appendChild(l);
      return l;
    });
    this.main.append(bar, this.media);
    this.stage.appendChild(this.main);

    this.thumbs = this.items.map((it, i) => {
      const t = el('button', 'of-thumb');
      t.type = 'button';
      t.tabIndex = -1;
      t.setAttribute('aria-label', `Show ${it.title || 'image ' + (i + 1)}`);
      t.style.backgroundImage = cssUrl(it.thumb || it.image);
      t.addEventListener('click', () => { if (!this.dragged) this.goTo(i); });
      this.stage.appendChild(t);
      return t;
    });
    r.appendChild(this.stage);
  }

  /* ---------- events ---------- */
  _bind() {
    this._off = [];
    const on = (node, type, fn, opts) => {
      node.addEventListener(type, fn, opts);
      this._off.push(() => node.removeEventListener(type, fn, opts));
    };

    this._ro = new ResizeObserver(() => this._measure());
    this._ro.observe(this.root);

    on(this.root, 'wheel', (e) => {
      e.preventDefault();
      this._nudge(clamp(e.deltaY + e.deltaX, -120, 120) * 0.0018);
    }, { passive: false });

    on(this.root, 'keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.next(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); this.prev(); }
    });

    on(this.stage, 'pointerdown', (e) => {
      this.down = true; this.dragged = false; this.moved = 0; this.vel = 0;
      this._lx = e.clientX; this._ly = e.clientY;
      clearTimeout(this._idle);
    });
    on(window, 'pointermove', (e) => {
      if (!this.down) return;
      const dx = e.clientX - this._lx, dy = e.clientY - this._ly;
      this._lx = e.clientX; this._ly = e.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      const v = this.layout.phone ? -dx / this.layout.sp : -(dx + dy) * 0.004;
      this.vel = this.vel * 0.5 + v * 0.5;
      this.target += v;
    });
    const release = () => {
      if (!this.down) return;
      this.down = false;
      this.dragged = this.moved > 6;
      this.target = Math.round(this.target + this.vel * 5);   // small flick, then snap
    };
    on(window, 'pointerup', release);
    on(window, 'pointercancel', release);

    on(this.main, 'click', () => {
      if (this.dragged) return;
      if (this.opts.onActivate) this.opts.onActivate(this.items[this.index], this.index);
    });
  }

  _nudge(v) {
    this.target += v;
    clearTimeout(this._idle);
    this._idle = setTimeout(() => { this.target = Math.round(this.target); }, 180);
  }

  /* ---------- layout (re-run whenever the container resizes) ---------- */
  _measure() {
    const w = this.root.clientWidth, h = this.root.clientHeight, o = this.opts, L = this.layout;
    const phone = w < o.mobileBreakpoint, barH = 32;
    let bw, bh, tw;
    L.phone = phone;

    if (phone) {
      tw = clamp(w * 0.16, 52, 66);
      const rowH = tw * 1.35 * 1.35, gap = 22;
      const room = h - 32 - barH - gap - rowH;
      bw = clamp(Math.min(o.maxBoxWidth, w * 0.82, room / o.boxRatio), 150, o.maxBoxWidth);
      bh = bw * o.boxRatio;
      const total = bh + barH + gap + rowH;
      this.main.style.marginTop = `${-total / 2}px`;
      L.rowY = -total / 2 + bh + barH + gap + rowH / 2;
      L.sp = tw * 1.3;
    } else {
      bw = clamp(Math.min(o.maxBoxWidth, w * 0.5, (h * 0.85 - barH) / o.boxRatio), 150, o.maxBoxWidth);
      bh = bw * o.boxRatio;
      this.main.style.marginTop = `${-(bh + barH) / 2}px`;
      tw = clamp(h * 0.15, 60, 120);
      L.Rx = o.radiusX ?? Math.min(w * 0.42, 640);
      L.Ry = o.radiusY ?? Math.min(h * 0.38, 340);
      L.Z = o.depth;
    }
    this.main.style.width = `${bw}px`;
    this.main.style.marginLeft = `${-bw / 2}px`;
    this.media.style.height = `${bh}px`;
    this.thumbs.forEach((t) => {
      t.style.width = `${tw}px`;
      t.style.height = `${tw * 1.35}px`;
      t.style.margin = `${-tw * 0.675}px 0 0 ${-tw / 2}px`;
    });
  }

  /* ---------- animation loop ---------- */
  _wrap(d) { d = ((d % this.N) + this.N) % this.N; return d > this.N / 2 ? d - this.N : d; }

  _setActive(i) {
    if (i === this.active) return;
    const first = this.active === -1;
    if (!first) this.layers[this.active].classList.remove('of-on');
    this.layers[i].classList.add('of-on');
    this.titleEl.textContent = this.items[i].title || '';
    this.active = i;
    if (!first && this.opts.onChange) this.opts.onChange(this.items[i], i);
  }

  _frame(ts) {
    const dt = Math.min(0.05, (ts - (this._last || ts)) / 1000);
    this._last = ts;
    const rate = (this.down ? 14 : this.opts.smoothing) * (this._reduced ? 2 : 1);
    this.pos += (this.target - this.pos) * (1 - Math.exp(-dt * rate));   // frame-rate independent easing
    this._setActive(this.index);

    const L = this.layout, N = this.N;
    if (L.phone) {
      // one straight row under the focus box
      this.thumbs.forEach((t, i) => {
        const d = this._wrap(i - this.pos), ad = Math.abs(d), sel = clamp(1 - ad), op = clamp(1 - (ad - 1.8) * 0.5);
        t.style.transform = `translate3d(${d * L.sp}px,${L.rowY}px,0) scale(${1 + 0.35 * sel})`;
        t.style.opacity = op;
        t.style.zIndex = 10 - Math.min(9, Math.round(ad));
        t.style.pointerEvents = op < 0.2 ? 'none' : 'auto';
      });
    } else {
      // elliptical orbit:  x = Rx·sinθ   y = Ry·cosθ   z = depth·cosθ
      const step = (Math.PI * 2) / N;
      this.thumbs.forEach((t, i) => {
        const d = this._wrap(i - this.pos), a = d * step, s = Math.sin(a), c = Math.cos(a), sel = clamp(1 - Math.abs(d));
        t.style.transform =
          `translate3d(${s * L.Rx}px,${c * L.Ry}px,${c * L.Z}px) rotateY(${-s * 28}deg) scale(${1 + 0.25 * sel})`;
        t.style.opacity = 0.55 + 0.45 * clamp((c + 1) / 1.2);
        t.style.zIndex = c > 0 ? 10 : 1;
        t.style.pointerEvents = 'auto';
      });
    }
    this._raf = requestAnimationFrame((t) => this._frame(t));
  }
}

export default OrbitFocus;
