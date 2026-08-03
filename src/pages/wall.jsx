import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";

/**
 * THE WALL — public page
 * ------------------------------------------------------------
 * Corkboard of every mutespeak student: photo pinned up, name
 * scrawled underneath, serial number by join order. Draggable
 * canvas, same interaction language as the reference site.
 *
 * Pulls from GET {API_BASE_URL}/api/public/wall, which returns:
 *   { totalCount: number, users: [{ id, name, profilePictureUrl }] }
 *
 * API_BASE_URL below points at localhost:8080 for local dev —
 * swap it for your deployed backend URL (or wire it up as an
 * env var) before shipping this to Vercel.
 *
 * Notes for future maintainers:
 * - Placeholder avatars use DiceBear's "avataaars-neutral" style
 *   (not "avataaars") since we don't know a student's gender —
 *   the neutral set drops gendered hair/facial-hair variants.
 * - Card size, grid shape, and board padding scale down together
 *   via `isCompact`/`--card-w` on narrow screens so mobile users
 *   mostly pan vertically instead of hunting around a wide board.
 * ------------------------------------------------------------
 */

const API_BASE_URL = 

//"http://localhost:8080";
"https://site--mutespeak-backend--22t95wnlrvvt.code.run";

function seededRandom(seed) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

// ids are UUID strings, not numbers — hash to a stable integer before
// feeding into seededRandom, or "uuid" * 3.1 comes out NaN and every
// card collapses onto the same spot on the board.
function hashSeed(value) {
  const str = String(value);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

// Deterministic cartoon avatar for students who haven't uploaded a photo yet —
// same seed always gives the same face, so it doesn't reshuffle on re-render.
// "avataaars-neutral" is DiceBear's gender-neutral variant of the set — no
// assumed gender for a name/id we know nothing else about.
function cartoonAvatarUrl(seed) {
  return `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${encodeURIComponent(seed)}`;
}

function WallCard({ student, index, style }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const hasRealPhoto = Boolean(student.profilePictureUrl) && !photoFailed;
  const photoSrc = hasRealPhoto ? student.profilePictureUrl : cartoonAvatarUrl(student.id ?? student.name);

  return (
    <div className="wall-card" style={style}>
      <div className="wall-pin" aria-hidden="true" />
      <div className="wall-photo-frame">
        <div className="wall-photo-wrap">
          <img
            className="wall-photo"
            src={photoSrc}
            alt={student.name || "Student photo"}
            draggable={false}
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        </div>
        <div className="wall-name">{student.name}</div>
      </div>
      <div className="wall-serial">NO. {String(index + 1).padStart(3, "0")}</div>
    </div>
  );
}

export default function WallPage() {
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHint, setShowHint] = useState(true);

  const viewportRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });
  const hasCenteredOnce = useRef(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/public/wall`);
        if (!res.ok) throw new Error(`Wall request failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          const users = data.users ?? [];
          setStudents(users);
          // totalCount can be bigger than the returned user list (pagination,
          // future page sizing, etc.) — prefer it for the headline count and
          // only fall back to the rendered list length if it's missing.
          setTotalCount(typeof data.totalCount === "number" ? data.totalCount : users.length);
        }
      } catch (e) {
        if (!cancelled) setError("Couldn't load the wall. Try again in a moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Layout effect (not a regular effect) so the board is measured and sized
  // correctly before the first paint — otherwise mobile briefly renders a
  // desktop-sized grid for a frame before snapping to the compact one.
  useLayoutEffect(() => {
    function measure() {
      if (viewportRef.current) {
        setViewportSize({
          w: viewportRef.current.clientWidth,
          h: viewportRef.current.clientHeight,
        });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Below this width, shrink cards/spacing and favor a narrower board so a
  // phone mostly pans up and down instead of hunting side to side.
  const isCompact = viewportSize.w > 0 && viewportSize.w <= 640;
  const cardW = isCompact ? 118 : 150;
  const cellW = isCompact ? 148 : 190;
  const cellH = isCompact ? 182 : 230;
  const boardPadX = isCompact ? 40 : 60;
  const boardPadTop = isCompact ? 70 : 100;
  const boardPadBottom = isCompact ? 50 : 60;
  const skeletonColumns = isCompact ? 3 : 6;

  const columns = isCompact
    ? Math.max(2, Math.min(4, Math.floor((viewportSize.w || 320) / cellW) || 2))
    : Math.max(1, Math.ceil(Math.sqrt((students.length || 1) * 1.5)));
  const rows = Math.max(1, Math.ceil((students.length || 1) / columns));
  const boardWidth = columns * cellW + boardPadX * 2;
  const boardHeight = rows * cellH + boardPadTop + boardPadBottom;

  const cardPositions = useMemo(() => {
    return students.map((s, i) => {
      const seed = hashSeed(s.id);
      const col = i % columns;
      const row = Math.floor(i / columns);
      const jitterX = (seededRandom(seed * 3.1) - 0.5) * (isCompact ? 22 : 40);
      const jitterY = (seededRandom(seed * 7.7) - 0.5) * (isCompact ? 16 : 30);
      const rotate = (seededRandom(seed * 5.3) - 0.5) * 14;
      return {
        left: boardPadX + col * cellW + jitterX,
        top: boardPadTop + row * cellH + jitterY,
        rotate,
      };
    });
  }, [students, columns, cellW, isCompact, boardPadX, boardPadTop]);

  const clamp = useCallback(
    (x, y) => {
      const minX = Math.min(0, viewportSize.w - boardWidth);
      const minY = Math.min(0, viewportSize.h - boardHeight);
      return {
        x: Math.max(minX - 80, Math.min(80, x)),
        y: Math.max(minY - 80, Math.min(80, y)),
      };
    },
    [viewportSize, boardWidth, boardHeight]
  );

  // Center the view the first time we know board + viewport size. After
  // that, only re-clamp on resize (don't recenter) — mobile browsers fire
  // resize constantly as the address bar shows/hides while scrolling, and
  // recentering on every one of those used to yank the board back under
  // the user's thumb mid-drag.
  useEffect(() => {
    if (!viewportSize.w || !boardWidth) return;
    if (!hasCenteredOnce.current) {
      const centered = clamp((viewportSize.w - boardWidth) / 2, (viewportSize.h - boardHeight) / 3);
      setTranslate(centered);
      hasCenteredOnce.current = true;
    } else {
      setTranslate((t) => clamp(t.x, t.y));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportSize.w, viewportSize.h, boardWidth, boardHeight]);

  const onPointerDown = (e) => {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startTx: translate.x,
      startTy: translate.y,
    };
    setShowHint(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragState.current.dragging) return;
    e.preventDefault();
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setTranslate(clamp(dragState.current.startTx + dx, dragState.current.startTy + dy));
  };

  const endDrag = () => {
    dragState.current.dragging = false;
  };

  const onKeyDown = (e) => {
    const step = 60;
    const moves = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      setShowHint(false);
      const [dx, dy] = moves[e.key];
      setTranslate((t) => clamp(t.x + dx, t.y + dy));
    }
  };

  const displayCount = totalCount ?? students.length;

  return (
    <div className="wall-root" style={{ "--card-w": `${cardW}px` }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Caveat:wght@700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .wall-root {
          --wall-base: #241509;
          --brick: #6b4327;
          --brick-shadow: #1c0f07;
          --cream: #f3ead6;
          --gold: #d9ab35;
          --gold-dim: #a9822c;
          --ink: #1c1810;
          --muted: #cdb79d;
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 560px;
          overflow: hidden;
          background: var(--wall-base);
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          color: var(--cream);
          box-sizing: border-box;
          overscroll-behavior: contain;
        }
        .wall-root *, .wall-root *::before, .wall-root *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        .wall-header {
          position: absolute;
          top: 28px;
          left: 32px;
          z-index: 10;
          pointer-events: none;
          max-width: 440px;
        }
        .wall-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: var(--gold);
          margin-bottom: 6px;
        }
        .wall-title {
          font-family: 'Press Start 2P', monospace;
          font-size: 26px;
          line-height: 1.35;
          margin: 0 0 10px;
          color: var(--cream);
          text-shadow: 3px 3px 0 var(--brick-shadow);
        }
        .wall-tagline {
          font-size: 14px;
          color: var(--muted);
          margin: 0 0 10px;
        }
        .wall-count {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: var(--gold);
          background: rgba(0,0,0,0.28);
          display: inline-block;
          padding: 4px 10px;
          border: 1px solid var(--gold-dim);
        }

        .wall-cta {
          position: absolute;
          top: 32px;
          right: 32px;
          z-index: 10;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: var(--ink);
          background: var(--gold);
          padding: 10px 16px;
          text-decoration: none;
          border: 2px solid var(--brick-shadow);
          box-shadow: 4px 4px 0 var(--brick-shadow);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .wall-cta:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--brick-shadow); }
        .wall-cta:active { transform: translate(0,0); box-shadow: 2px 2px 0 var(--brick-shadow); }
        .wall-cta:focus-visible { outline: 2px solid var(--cream); outline-offset: 2px; }

        .wall-viewport {
          position: absolute;
          inset: 0;
          overflow: hidden;
          cursor: grab;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          background-color: var(--brick);
          background-image:
            linear-gradient(335deg, rgba(18, 9, 4, 0.55) 23px, transparent 23px),
            linear-gradient(155deg, rgba(18, 9, 4, 0.55) 23px, transparent 23px),
            linear-gradient(335deg, rgba(18, 9, 4, 0.55) 23px, transparent 23px),
            linear-gradient(155deg, rgba(18, 9, 4, 0.55) 23px, transparent 23px);
          background-size: 58px 58px;
          background-position: 0px 2px, 4px 35px, 29px 31px, 34px 6px;
        }
        .wall-viewport:active { cursor: grabbing; }
        .wall-viewport:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }

        /* Soft vignette behind the cards, so the brick pattern doesn't fight
           for attention at the edges of the screen. */
        .wall-viewport::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(8, 4, 2, 0.6) 100%);
          pointer-events: none;
          z-index: 0;
        }
        /* Faint grain over everything for a bit of tactile, non-digital texture. */
        .wall-viewport::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.05;
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 3;
        }

        .wall-board { position: relative; overflow: visible; will-change: transform; }

        .wall-card {
          width: var(--card-w, 150px);
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
          transition: transform 0.2s ease;
          animation: wall-card-fade 0.35s ease both;
        }
        @keyframes wall-card-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Hover lift only for devices with a real pointer — on touch, :hover
           sticks after a tap and makes the last-touched card look stuck. */
        @media (hover: hover) and (pointer: fine) {
          .wall-card:hover { transform: translateY(-6px) scale(1.05) rotate(0deg) !important; z-index: 5; }
        }

        .wall-pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #f7dd8a, var(--gold) 55%, var(--gold-dim) 100%);
          box-shadow: 0 3px 4px rgba(8,4,2,0.55);
          margin-bottom: -7px;
          z-index: 2;
          position: relative;
        }

        .wall-photo-frame {
          width: var(--card-w, 150px);
          background: var(--cream);
          padding: 8px 8px 6px;
          box-shadow: 0 8px 16px rgba(10,5,2,0.45);
          border: 1px solid rgba(0,0,0,0.12);
        }
        .wall-photo-wrap {
          width: calc(var(--card-w, 150px) - 16px);
          height: calc(var(--card-w, 150px) - 16px);
          overflow: hidden;
          background: #e6dcc8;
        }
        .wall-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          -webkit-touch-callout: none;
        }
        .wall-name {
          font-family: 'Caveat', cursive;
          font-weight: 700;
          font-size: 21px;
          color: var(--ink);
          text-align: center;
          margin-top: 4px;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wall-serial {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin-top: 5px;
        }

        .wall-skeleton {
          position: absolute;
          width: var(--card-w, 150px);
          height: calc(var(--card-w, 150px) + 28px);
          background: rgba(255,255,255,0.06);
          border: 1px dashed rgba(255,255,255,0.14);
          animation: wall-pulse 1.4s ease-in-out infinite;
        }
        @keyframes wall-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }

        .wall-hint {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--muted);
          background: rgba(0,0,0,0.4);
          padding: 6px 12px;
          border: 1px solid rgba(255,255,255,0.08);
          pointer-events: none;
          z-index: 10;
          animation: wall-hint-fade 3.5s ease forwards;
        }
        @keyframes wall-hint-fade { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }

        .wall-error {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'IBM Plex Mono', monospace;
          color: var(--muted);
          text-align: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .wall-card, .wall-cta, .wall-hint { transition: none !important; animation: none !important; }
        }

        @media (max-width: 640px) {
          .wall-title { font-size: 17px; }
          .wall-header { max-width: 250px; top: 16px; left: 16px; }
          .wall-cta {
            top: 16px;
            right: 16px;
            padding: 10px 14px;
            font-size: 11px;
            min-height: 40px;
            display: inline-flex;
            align-items: center;
          }
          .wall-tagline { display: none; }
        }
      `}</style>

      <header className="wall-header">
        <div className="wall-eyebrow">LOYOLA COLLEGE · MUTESPEAK</div>
        <h1 className="wall-title">THE WALL</h1>
        <p className="wall-tagline">Every face that's joined mutespeak so far.</p>
        <div className="wall-count" aria-live="polite">
          {loading ? "Counting…" : `${displayCount} students on the wall`}
        </div>
      </header>

      <a className="wall-cta" href="/signup">
        Join the wall →
      </a>

      <div
        className="wall-viewport"
        ref={viewportRef}
        tabIndex={0}
        role="group"
        aria-label={`Draggable wall of ${displayCount} student photos. Drag, swipe, or use the arrow keys to look around.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        {error && <div className="wall-error">{error}</div>}
        {!error && (
          <div
            className="wall-board"
            style={{
              width: boardWidth,
              height: boardHeight,
              transform: `translate(${translate.x}px, ${translate.y}px)`,
            }}
          >
            {students.map((s, i) => (
              <WallCard
                key={s.id}
                student={s}
                index={i}
                style={{
                  position: "absolute",
                  left: cardPositions[i].left,
                  top: cardPositions[i].top,
                  transform: `rotate(${cardPositions[i].rotate}deg)`,
                  animationDelay: `${Math.min(i * 15, 300)}ms`,
                }}
              />
            ))}
            {loading &&
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="wall-skeleton"
                  style={{
                    left: boardPadX + (i % skeletonColumns) * cellW,
                    top: boardPadTop + Math.floor(i / skeletonColumns) * cellH,
                  }}
                />
              ))}
          </div>
        )}
      </div>

      {showHint && !loading && !error && <div className="wall-hint">Drag or swipe to explore the wall</div>}
    </div>
  );
}
