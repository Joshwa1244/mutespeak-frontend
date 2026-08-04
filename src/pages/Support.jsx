import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Support.css";

// -------------------------------------------------------------
// CONFIGURATION
// -------------------------------------------------------------
const BMC_LINK = "https://buymeacoffee.com/mutespeak";
const API_BASE_URL = "https://site--mutespeak-backend--22t95wnlrvvt.code.run/api/payments";

// Current approximate USD to INR conversion factor for webhook amounts
const USD_TO_INR_RATE = 95;

const TIMELINE = [
  {
    status: "completed",
    title: "Backend Infrastructure",
    description: "Core architecture, WebSockets, and real-time data flow.",
  },
  {
    status: "active",
    title: "Progressive Web App (PWA)",
    description: "Native app feel, installable directly to your home screen.",
  },
  {
    status: "upcoming",
    title: "Direct Messaging",
    description: "Private, encrypted 1-on-1 conversations between students.",
  },
  {
    status: "upcoming",
    title: "Campus Communities",
    description: "Niche groups for clubs, departments, and shared interests.",
  },
];

export default function Support() {
  const [supporters, setSupporters] = useState([]);
  const [loadingSupporters, setLoadingSupporters] = useState(true);

  // Fetch supporters from backend database
  const fetchSupporters = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/supporters`);
      if (res.ok) {
        const data = await res.json();
        setSupporters(data);
      }
    } catch (err) {
      console.error("Failed to load supporters:", err);
    } finally {
      setLoadingSupporters(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchSupporters();

    // Auto-poll every 30 seconds to catch webhook updates in real-time
    const interval = setInterval(fetchSupporters, 30000);
    return () => clearInterval(interval);
  }, []);

  const [statsRef, statsIn] = useReveal(0.3);
  const [wallRef, wallIn] = useReveal(0.15);
  const [roadmapRef, roadmapIn] = useReveal(0.12);
  const [founderRef, founderIn] = useReveal(0.3);
  const [thanksRef, thanksIn] = useReveal(0.2);

  const stats = [
    { id: "coffees", value: supporters.length, suffix: "", label: "Coffees Donated" },
    { id: "features", value: 14, suffix: "+", label: "Features Built" },
    { id: "hours", value: 300, suffix: "+", label: "Hours Building" },
  ];

  return (
    <div className="support-page">
      {/* =========================================================
          HERO SECTION
      ========================================================== */}
      <section className="support-hero">
        <div className="support-hero-noise" aria-hidden="true"></div>

        <div className="support-bg-beans" aria-hidden="true">
          <div className="bg-bean bg-bean-1"></div>
          <div className="bg-bean bg-bean-2"></div>
          <div className="bg-bean bg-bean-3"></div>
          <div className="bg-bean bg-bean-4"></div>
          <div className="bg-bean bg-bean-5"></div>
        </div>

        <div className="support-container support-hero-grid">
          <div className="support-hero-content">
            <span className="eyebrow eyebrow-light">Support mutespeak</span>

            <h1>Buy me a coffee</h1>

            <p>
              mutespeak is built by a student, for students. It&apos;s 100%
              free, ad-free, and privacy-first. If you love the platform,
              your support fuels the server costs, late nights, and clean code.
            </p>

            <div className="support-action-area">
              <a
                href={BMC_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="support-btn active"
              >
                Support via Buy Me a Coffee
              </a>

              <div className="support-secure-badge">
                <LockIcon />
                <span>Instant & secure processing via BMC</span>
              </div>
            </div>

            <Link to="/" className="support-back-link">
              ← Back to mutespeak
            </Link>
          </div>

          <div className="support-art-container" aria-hidden="true">
            <div className="steam steam-1"></div>
            <div className="steam steam-2"></div>
            <div className="steam steam-3"></div>
            <div className="cup-body">
              <div className="cup-handle"></div>
              <div className="cup-inner"></div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STATISTICS SECTION
      ========================================================== */}
      <section
        className={`support-stats${statsIn ? " is-in" : ""}`}
        ref={statsRef}
      >
        <div className="support-container support-stats-row">
          {stats.map((stat, i) => (
            <StatItem key={stat.id} stat={stat} active={statsIn} index={i} />
          ))}
        </div>
      </section>

      {/* =========================================================
          PREMIUM SUPPORTERS WALL
      ========================================================== */}
      <section
        className={`support-wall-section${wallIn ? " is-in" : ""}`}
        ref={wallRef}
      >
        <div className="support-container">
          <div className="support-section-header">
            <span className="eyebrow">Wall of Fame</span>
            <h2>Recent Supporters</h2>
            <p>The legends powering this independent ecosystem.</p>
          </div>

          {loadingSupporters ? (
            <div className="wall-loading">Loading ledger...</div>
          ) : supporters.length === 0 ? (
            <div className="wall-empty-card">
              <span className="empty-coffee-icon">☕</span>
              <p>No coffees on the wall yet. Be the first legendary supporter.</p>
              <a
                href={BMC_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="wall-empty-btn"
              >
                Drop a Coffee
              </a>
            </div>
          ) : (
            <div className="supporters-grid">
              {supporters.map((s, index) => (
                <div 
                  key={s.id || index} 
                  className="supporter-card"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="supporter-card-header">
                    <div className="supporter-identity">
                      <div className="supporter-avatar-badge">
                        {(s.displayName || "A").charAt(0).toUpperCase()}
                      </div>
                      <div className="supporter-meta">
                        <h4 className="supporter-name">{s.displayName || "Anonymous"}</h4>
                        <span className="supporter-date">
                          {new Date(s.createdAt || Date.now()).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="supporter-amount-pill">
                      ₹{Math.round((s.amount || 0) * USD_TO_INR_RATE)}
                    </div>
                  </div>
                  <p className="supporter-message">
                    "{s.message || "Brought a coffee to keep mutespeak alive."}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          ROADMAP / TIMELINE
      ========================================================== */}
      <section
        className={`support-roadmap${roadmapIn ? " is-in" : ""}`}
        ref={roadmapRef}
      >
        <div className="support-container">
          <div className="support-section-header">
            <span className="eyebrow">Roadmap</span>
            <h2>The Journey Ahead</h2>
            <p>What your support helps build next.</p>
          </div>

          <div className="timeline">
            {TIMELINE.map((item, i) => (
              <div
                key={item.title}
                className={`timeline-item ${item.status}`}
                style={{ transitionDelay: roadmapIn ? `${i * 130}ms` : "0ms" }}
              >
                <div
                  className={`timeline-dot${
                    item.status === "active" ? " pulse-dot" : ""
                  }`}
                ></div>
                <div className="timeline-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FOUNDER NOTE
      ========================================================== */}
      <section
        className={`support-founder-note${founderIn ? " is-in" : ""}`}
        ref={founderRef}
      >
        <div className="support-container founder-note-inner">
          <div className="founder-note-avatar" aria-hidden="true">
            JA
          </div>
          <div className="founder-note-text">
            <span className="founder-note-label">A note from the builder</span>
            <p>
              Joshwa Antony here — mutespeak is a one-person build squeezed
              between classes and deadlines. Nothing here runs on ad revenue
              or investor money, just whatever time and coffee I can put
              into it.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          THANK YOU NOTE
      ========================================================== */}
      <section
        className={`support-thank-you${thanksIn ? " is-in" : ""}`}
        ref={thanksRef}
      >
        <div className="support-container support-thank-you-inner">
          <h2>Thank you for believing in indie development.</h2>
          <p>
            Every line of code in mutespeak is written with the belief that
            college communities deserve a better, more private digital
            space. It&apos;s a solo journey, but it&apos;s powered by the
            people who use it and support it.
          </p>

          <div className="support-footer-quote">
            <span className="quote-mark" aria-hidden="true">“</span>
            <blockquote>
              Every coffee becomes another late night building mutespeak
            </blockquote>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// STAT ITEM (with count-up animation on scroll into view)
// ---------------------------------------------------------------
function StatItem({ stat, active, index }) {
  const count = useCountUp(stat.value, active);
  const Icon = STAT_ICONS[stat.id];

  return (
    <article
      className="stat-row"
      style={{ transitionDelay: active ? `${index * 120}ms` : "0ms" }}
    >
      <span className="stat-row-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="stat-row-value">
        {count}
        {stat.suffix}
      </span>
      <span className="stat-row-label">{stat.label}</span>
    </article>
  );
}

// ---------------------------------------------------------------
// HOOKS
// ---------------------------------------------------------------
function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIn(true);
          observer.unobserve(node);
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isIn];
}

function useCountUp(target, active, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === 0) {
      setValue(0);
      return undefined;
    }

    let frame;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}

// ---------------------------------------------------------------
// ICONS
// ---------------------------------------------------------------
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoffeeGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8 3.2c0 1-1 1-1 2s1 1 1 2M12 3.2c0 1-1 1-1 2s1 1 1 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7v5l3.5 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STAT_ICONS = {
  coffees: CoffeeGlyph,
  features: SparkGlyph,
  hours: ClockGlyph,
};