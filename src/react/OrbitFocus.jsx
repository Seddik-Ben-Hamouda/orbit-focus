import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { OrbitFocus as Core } from '../orbit-focus.js';

/**
 * <OrbitFocus items={[{ title, image, thumb }]} onChange={...} onActivate={...} />
 * Remember to import the stylesheet once:  import 'orbit-focus/style.css'
 * Give it a height (it fills its parent):   <div style={{ height: '100vh' }}>…</div>
 */
const OrbitFocus = forwardRef(function OrbitFocus(
  { items, onChange, onActivate, className, style, ...options },
  ref
) {
  const host = useRef(null);
  const core = useRef(null);
  const handlers = useRef({});
  handlers.current = { onChange, onActivate };   // always call the latest callbacks

  useEffect(() => {
    core.current = new Core(host.current, {
      ...options,
      items,
      onChange: (item, i) => handlers.current.onChange?.(item, i),
      onActivate: (item, i) => handlers.current.onActivate?.(item, i),
    });
    return () => core.current.destroy();
    // re-create only when the list of items changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useImperativeHandle(ref, () => ({
    next: () => core.current?.next(),
    prev: () => core.current?.prev(),
    goTo: (i) => core.current?.goTo(i),
  }));

  return <div ref={host} className={className} style={style} />;
});

export default OrbitFocus;
