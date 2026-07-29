import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Support.css";

// -------------------------------------------------------------
// CONFIGURATION
// -------------------------------------------------------------
// Replace this with your actual Razorpay Key ID from the dashboard
// e.g., "rzp_live_XXXXXXXXXXXXX" or "rzp_test_XXXXXXXXXXXXX"
const RAZORPAY_KEY_ID = "rzp_test_TJHviw1r08mCBt";

// Illustrative price used only to drive the calculator below.
const PRICE_PER_COFFEE = 49;
const MAX_COFFEES = 20;
const COFFEE_PRESETS = [1, 3, 5, 10];

const STATS = [
  { id: "coffees", value: 0, suffix: "", label: "Coffees" },
  { id: "features", value: 14, suffix: "+", label: "Features Built" },
  { id: "hours", value: 300, suffix: "+", label: "Hours Building" },
];

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
  {
    status: "upcoming",
    title: "AI Features",
    description: "Smart moderation, personalized feeds, and context-aware tools.",
  },
];

export default function Support() {
  // 1. Scroll to top on mount for a premium entrance
  // 2. Load the Razorpay SDK dynamically
  useEffect(() => {
    window.scrollTo(0, 0);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const [statsRef, statsIn] = useReveal(0.3);
  const [calcRef, calcIn] = useReveal(0.15);
  const [roadmapRef, roadmapIn] = useReveal(0.12);
  const [founderRef, founderIn] = useReveal(0.3);
  const [thanksRef, thanksIn] = useReveal(0.2);

  return (
    <div className="support-page">
      {/* =========================================================
          HERO SECTION
      ========================================================== */}
      <section className="support-hero">
        <div className="support-hero-noise" aria-hidden="true"></div>

        {/* Floating Background Beans */}
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
              mutespeak; is built by a student, for students. It&apos;s 100%
              free, ad-free, and privacy-first. If you love the platform,
              your support fuels the late nights, server costs, and the
              thousands of lines of code that make it happen.
            </p>

            <div className="support-action-area">
              <SupportButton label="Support via Razorpay" amount={PRICE_PER_COFFEE} />

              <div className="support-secure-badge">
                <LockIcon />
                <span>Secure payments via Razorpay</span>
              </div>
            </div>

            <Link to="/" className="support-back-link">
              ← Back to mutespeak;
            </Link>
          </div>

          {/* Animated Coffee Cup Art */}
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
          {STATS.map((stat, i) => (
            <StatItem key={stat.id} stat={stat} active={statsIn} index={i} />
          ))}
        </div>
      </section>

      {/* =========================================================
          COFFEE CALCULATOR (signature interactive section)
      ========================================================== */}
      <section
        className={`support-calculator${calcIn ? " is-in" : ""}`}
        ref={calcRef}
      >
        <CoffeeCalculator />
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
              Joshwa Antony here — mutespeak; is a one-person build squeezed
              between classes and deadlines. Nothing here runs on ad revenue
              or investor money, just whatever time and coffee I can put
              into it.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          THANK YOU NOTE & FOOTER QUOTE
      ========================================================== */}
      <section
        className={`support-thank-you${thanksIn ? " is-in" : ""}`}
        ref={thanksRef}
      >
        <div className="support-container support-thank-you-inner">
          <h2>Thank you for believing in indie development.</h2>
          <p>
            Every line of code in mutespeak; is written with the belief that
            college communities deserve a better, more private digital
            space. It&apos;s a solo journey, but it&apos;s powered by the
            people who use it and support it. Whether you buy a coffee or
            simply drop a post on the feed, you are what makes this platform
            alive.
          </p>

          <div className="support-footer-quote">
            <span className="quote-mark" aria-hidden="true">
              “
            </span>
            <blockquote>
              Every coffee becomes another late night building mutespeak;
            </blockquote>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// COFFEE CALCULATOR (With Custom Input Support)
// ---------------------------------------------------------------
function CoffeeCalculator() {
  const [coffees, setCoffees] = useState(3);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [bump, setBump] = useState(false);

  // Dynamic calculations based on mode
  const activeAmount = isCustom ? (Number(customAmount) || 0) : coffees * PRICE_PER_COFFEE;
  const activeCoffees = activeAmount / PRICE_PER_COFFEE;

  useEffect(() => {
    setBump(true);
    const t = setTimeout(() => setBump(false), 260);
    return () => clearTimeout(t);
  }, [activeAmount]);

  const serverHours = (activeCoffees * 2.5).toFixed(1);
  const codeLines = Math.round(activeCoffees * 120);
  const lateNights = Math.max(1, Math.round(activeCoffees / 3));
  const fillPercent = ((coffees - 1) / (MAX_COFFEES - 1)) * 100;

  // Handlers
  const handlePreset = (n) => {
    setIsCustom(false);
    setCoffees(n);
  };

  const handleCustomClick = () => {
    if (!isCustom) {
      setIsCustom(true);
      setCustomAmount(activeAmount > 0 ? activeAmount.toString() : "");
    }
  };

  return (
    <div className="support-container calc-grid">
      <div className="calc-heading">
        <span className="eyebrow">Where it actually goes</span>
        <h2>Every contribution builds something.</h2>
        <p>
          Adjust the amount and watch your support translate into server time,
          shipped code, and the late nights that keep mutespeak; running.
        </p>
      </div>

      <div className="calc-panel">
        <div className="calc-readout">
          <span className="calc-currency">₹</span>
          <span
            className={`calc-amount${bump ? " is-bumping" : ""}`}
            aria-live="polite"
          >
            {activeAmount}
          </span>
        </div>
        <p className="calc-caption">
          {isCustom
            ? `≈ ${Math.max(0, activeCoffees).toFixed(1)} coffees`
            : `${coffees} coffee${coffees > 1 ? "s" : ""} · ≈ ₹${PRICE_PER_COFFEE} each`}
        </p>

        {isCustom ? (
          <div className="calc-custom-group">
            <span className="calc-custom-prefix">₹</span>
            <input
              type="number"
              min="1"
              className="calc-custom-input"
              placeholder="Enter custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              autoFocus
            />
          </div>
        ) : (
          <input
            type="range"
            min="1"
            max={MAX_COFFEES}
            value={coffees}
            onChange={(e) => setCoffees(Number(e.target.value))}
            className="calc-slider"
            style={{ "--fill": `${fillPercent}%` }}
            aria-label="Number of coffees"
          />
        )}

        <div className="calc-presets">
          {COFFEE_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              className={`calc-chip${!isCustom && coffees === n ? " active" : ""}`}
              onClick={() => handlePreset(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className={`calc-chip${isCustom ? " active" : ""}`}
            onClick={handleCustomClick}
          >
            Custom
          </button>
        </div>

        <ul className="calc-equivalents">
          <li>
            <strong>{serverHours} hrs</strong>
            <span>of server uptime kept alive</span>
          </li>
          <li>
            <strong>{codeLines}</strong>
            <span>lines of code reviewed and shipped</span>
          </li>
          <li>
            <strong>
              {lateNights} late night{lateNights > 1 ? "s" : ""}
            </strong>
            <span>of building, fully fueled</span>
          </li>
        </ul>

        <p className="calc-note">
          mutespeak; has had zero coffees so far — yours could be the first.
        </p>

        <SupportButton 
          label={`Support ₹${activeAmount}`} 
          className="calc-cta" 
          disabled={activeAmount <= 0}
          amount={activeAmount}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// SHARED SUPPORT BUTTON (Standard Checkout Integration)
// ---------------------------------------------------------------
function SupportButton({ label, className = "", disabled = false, amount = 0 }) {
  const magnetic = useMagnetic();

  const handlePayment = () => {
    if (disabled || amount <= 0) return;

    if (!window.Razorpay) {
      alert("Razorpay SDK is still loading or failed to load. Please ensure you have internet access.");
      return;
    }

    // Razorpay standard checkout configuration
    const options = {
      key: RAZORPAY_KEY_ID, 
      amount: amount * 100, // Razorpay takes amounts in paise (multiply by 100)
      currency: "INR",
      name: "mutespeak;",
      description: "Support for Server and Coffee",
      theme: {
        color: "#003f22", // Your brand dark forest green
      },
      handler: function (response) {
        // This fires when the payment is successfully completed
        alert(`Thank you for your support! Payment ID: ${response.razorpay_payment_id}`);
        // Future proofing: If you ever add a backend for tracking donations, send the ID there.
      },
      prefill: {
        name: "Campus Supporter", // Optional defaults
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (RAZORPAY_KEY_ID) {
    return (
      <button
        type="button"
        onClick={handlePayment}
        className={`support-btn primary active ${className}`}
        disabled={disabled}
        {...magnetic}
      >
        {label}
      </button>
    );
  }

  // Fallback state for when the Key ID is empty (verification pending)
  return (
    <button
      type="button"
      className={`support-btn primary disabled ${className}`}
      disabled
    >
      <span className="support-ribbon">Coming Soon</span>
      {label}
    </button>
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

function useMagnetic() {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };

  return { ref, onMouseMove };
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