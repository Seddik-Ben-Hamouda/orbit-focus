export interface OrbitItem {
  title?: string;
  /** Large image shown in the focus box */
  image: string;
  /** Optional smaller image for the orbiting thumbnails (defaults to `image`) */
  thumb?: string;
  /** Anything else you want to carry along (price, link, id…) */
  [key: string]: unknown;
}

export interface OrbitFocusOptions {
  items: OrbitItem[];
  initialIndex?: number;
  /** Container width (px) below which the single-row layout is used. Default 700 */
  mobileBreakpoint?: number;
  /** Focus image height / width. Default 1.16 */
  boxRatio?: number;
  /** Max width of the focus box in px. Default 500 */
  maxBoxWidth?: number;
  radiusX?: number | null;
  radiusY?: number | null;
  /** How much closer the front of the orbit is, in px. Default 260 */
  depth?: number;
  /** Higher = snappier, lower = floatier. Default 5.5 */
  smoothing?: number;
  /** Text of the title-bar button, '' hides it. Default 'Open' */
  buttonLabel?: string;
  onChange?: (item: OrbitItem, index: number) => void;
  onActivate?: (item: OrbitItem, index: number) => void;
}

export class OrbitFocus {
  constructor(target: string | HTMLElement, options: OrbitFocusOptions);
  readonly index: number;
  next(): void;
  prev(): void;
  goTo(index: number): void;
  destroy(): void;
}

export default OrbitFocus;
