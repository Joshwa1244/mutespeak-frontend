import { useState, useRef, useEffect, useMemo, useCallback } from "react";

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
function cartoonAvatarUrl(seed) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
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
            alt=""
            draggable={false}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHint, setShowHint] = useState(true);

  const viewportRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });
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
        if (!cancelled) setStudents(data.users ?? []);
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

  useEffect(() => {
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

  const cellW = 190;
  const cellH = 230;
  const skeletonColumns = 6;
  const columns = Math.max(1, Math.ceil(Math.sqrt((students.length || 1) * 1.5)));
  const rows = Math.max(1, Math.ceil((students.length || 1) / columns));
  const boardWidth = columns * cellW + 120;
  const boardHeight = rows * cellH + 160;

  const cardPositions = useMemo(() => {
    return students.map((s, i) => {
      const seed = hashSeed(s.id);
      const col = i % columns;
      const row = Math.floor(i / columns);
      const jitterX = (seededRandom(seed * 3.1) - 0.5) * 40;
      const jitterY = (seededRandom(seed * 7.7) - 0.5) * 30;
      const rotate = (seededRandom(seed * 5.3) - 0.5) * 14;
      return {
        left: 60 + col * cellW + jitterX,
        top: 100 + row * cellH + jitterY,
        rotate,
      };
    });
  }, [students, columns]);

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

  // Center the initial view once we know board + viewport size
  useEffect(() => {
    if (viewportSize.w && boardWidth) {
      const centered = clamp((viewportSize.w - boardWidth) / 2, (viewportSize.h - boardHeight) / 3);
      setTranslate(centered);
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

  return (
    <div className="wall-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Caveat:wght@700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .wall-root {
          --navy: #141b2e;
          --navy-deep: #0d1220;
          --cork-dot: rgba(255,255,255,0.04);
          --cream: #f5efe0;
          --gold: #d9ab35;
          --gold-dim: #a9822c;
          --ink: #1c1810;
          --muted: #9aa3b8;
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 560px;
          overflow: hidden;
          background: var(--navy);
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          color: var(--cream);
          box-sizing: border-box;
        }
        .wall-root *, .wall-root *::before, .wall-root *::after { box-sizing: border-box; }

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
          text-shadow: 3px 3px 0 var(--navy-deep);
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
          background: rgba(0,0,0,0.25);
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
          border: 2px solid var(--navy-deep);
          box-shadow: 4px 4px 0 var(--navy-deep);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .wall-cta:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--navy-deep); }
        .wall-cta:active { transform: translate(0,0); box-shadow: 2px 2px 0 var(--navy-deep); }

        .wall-viewport {
          position: absolute;
          inset: 0;
          overflow: hidden;
          cursor: grab;
          touch-action: none;
          background-image: radial-gradient(var(--cork-dot) 1px, transparent 1px);
          background-size: 14px 14px;
          background-color: var(--navy);
        }
        .wall-viewport:active { cursor: grabbing; }
        .wall-viewport:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }

        .wall-board { position: relative; overflow: visible; will-change: transform; }

        .wall-card {
          width: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
          transition: transform 0.2s ease;
        }
        .wall-card:hover { transform: translateY(-6px) scale(1.05) rotate(0deg) !important; z-index: 5; }

        .wall-pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #f7dd8a, var(--gold) 55%, var(--gold-dim) 100%);
          box-shadow: 0 3px 4px rgba(0,0,0,0.45);
          margin-bottom: -7px;
          z-index: 2;
          position: relative;
        }

        .wall-photo-frame {
          width: 150px;
          background: var(--cream);
          padding: 8px 8px 6px;
          box-shadow: 0 6px 14px rgba(0,0,0,0.35);
          border: 1px solid rgba(0,0,0,0.12);
        }
        .wall-photo-wrap { width: 134px; height: 134px; overflow: hidden; background: #ddd; }
        .wall-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
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
          width: 150px;
          height: 178px;
          background: rgba(255,255,255,0.05);
          border: 1px dashed rgba(255,255,255,0.12);
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
          background: rgba(0,0,0,0.35);
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
          .wall-cta { top: 16px; right: 16px; padding: 8px 12px; font-size: 11px; }
          .wall-tagline { display: none; }
        }
      `}</style>

      <header className="wall-header">
        <div className="wall-eyebrow">LOYOLA COLLEGE · MUTESPEAK</div>
        <h1 className="wall-title">THE WALL</h1>
        <p className="wall-tagline">Every face that's joined mutespeak so far.</p>
        <div className="wall-count">{loading ? "Counting…" : `${students.length} students on the wall`}</div>
      </header>

      <a className="wall-cta" href="/signup">
        Join the wall →
      </a>

      <div
        className="wall-viewport"
        ref={viewportRef}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
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
                }}
              />
            ))}
            {loading &&
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="wall-skeleton"
                  style={{
                    left: 60 + (i % skeletonColumns) * cellW,
                    top: 100 + Math.floor(i / skeletonColumns) * cellH,
                  }}
                />
              ))}
          </div>
        )}
      </div>

      {showHint && !loading && !error && <div className="wall-hint">Drag to explore the wall</div>}
    </div>
  );
}
