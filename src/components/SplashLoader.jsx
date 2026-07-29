import { useEffect, useState } from "react";
import "./SplashLoader.css";

export default function SplashLoader({ isLoading }) {
  const [shouldRender, setShouldRender] = useState(isLoading);

  // Split the brand name to animate each character individually
  const brandText = "mutespeak;".split("");

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
    } else {
      // Allow the exit transition to complete before unmounting
      // Extended to 800ms for a smoother, premium exit
      const timer = setTimeout(() => setShouldRender(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`splash-overlay ${!isLoading ? "splash-fade-out" : ""}`}
      aria-busy="true"
      aria-label="Loading application"
    >
      <div className="splash-content">
        <span className="splash-subtitle">WELCOME TO</span>
        <div className="splash-brand-container">
          {brandText.map((char, index) => (
            <span
              key={index}
              className={`splash-char ${char === ";" ? "splash-accent" : ""}`}
              // Stagger each letter's animation by 50ms
              style={{ animationDelay: `${0.4 + index * 0.05}s` }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}