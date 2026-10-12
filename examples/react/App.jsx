// Works in Vite, Next.js (client component), Create React App…
//   npm install orbit-focus      (or copy the src/ folder into your project)
import { useMemo, useRef, useState } from 'react';
import OrbitFocus from 'orbit-focus/react';
import 'orbit-focus/style.css';

const photo = (id, w, h) => `https://picsum.photos/id/${id}/${w}/${h}`;
const data = [
  ['Nordhaus', 10], ['Aster Bloom', 20], ['Halcyon Type', 30],
  ['Ink Study', 40], ['Shadow Walk', 50], ['Kairo Editions', 60],
  ['Static Field', 70], ['Soft Face', 80], ['Red Line', 90],
];

export default function App() {
  // keep `items` stable (useMemo / module constant) — the carousel is rebuilt only when it changes
  const items = useMemo(
    () => data.map(([title, id]) => ({ title, image: photo(id, 700, 800), thumb: photo(id, 300, 400) })),
    []
  );
  const gallery = useRef(null);
  const [current, setCurrent] = useState(items[0].title);

  return (
    <div style={{ height: '100vh' }}>
      <OrbitFocus
        ref={gallery}
        items={items}
        buttonLabel="Order now"
        onChange={(item) => setCurrent(item.title)}
        onActivate={(item) => alert(`Open ${item.title}`)}
      />
      <p style={{ position: 'fixed', bottom: 12, width: '100%', textAlign: 'center', margin: 0 }}>
        Now showing: {current} ·{' '}
        <button onClick={() => gallery.current.prev()}>prev</button>{' '}
        <button onClick={() => gallery.current.next()}>next</button>
      </p>
    </div>
  );
}
