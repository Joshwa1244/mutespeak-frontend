// components/CreativeLoader.jsx

export default function CreativeLoader({ message = "Loading..." }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      width: "100%",
      gap: "1.5rem",
      // Prevents long-press text selection to maintain a native app feel
      userSelect: "none",
      WebkitUserSelect: "none"
    }}>
      
      {/* Kinetic Semicolon Graphic */}
      <div style={{ position: "relative", width: "64px", height: "64px" }}>
        <svg 
          viewBox="0 0 60 60" 
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          {/* Subtle Orbital Track */}
          <circle 
            cx="30" cy="30" r="22" 
            fill="none" 
            stroke="var(--border-color, rgba(150, 150, 150, 0.15))" 
            strokeWidth="1" 
          />

          {/* The Comma (Gravitational Anchor) */}
          {/* Pulses slightly in response to the dot's orbit */}
          <text
            x="30"
            y="39" 
            textAnchor="middle"
            style={{
              fill: "#f59e0b", // Mutespeak warm amber
              fontSize: "36px",
              fontWeight: "800",
              fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
              transformOrigin: "30px 30px",
              animation: "mutespeak-comma 2s cubic-bezier(0.75, 0, 0.25, 1) infinite"
            }}
          >
            ,
          </text>

          {/* The Orbiting Dot (Loading Indicator) */}
          <g style={{
            transformOrigin: "30px 30px",
            // The steep cubic-bezier creates the cinematic "hang time" at the top
            animation: "mutespeak-orbit 2s cubic-bezier(0.75, 0, 0.25, 1) infinite"
          }}>
            {/* Core Dot */}
            <circle cx="30" cy="8" r="4.5" fill="#f59e0b" />
            {/* Premium outer glow attached to the moving dot */}
            <circle cx="30" cy="8" r="10" fill="rgba(245, 158, 11, 0.2)" />
          </g>
        </svg>
      </div>

      {/* Editorial Typography */}
      <div style={{
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        fontSize: "0.75rem",
        fontWeight: "600",
        letterSpacing: "0.4em",
        textTransform: "uppercase",
        color: "var(--text-muted, rgba(255, 255, 255, 0.5))",
        paddingLeft: "0.4em", // Optically centers text with high letter-spacing
        animation: "mutespeak-text-fade 2s cubic-bezier(0.75, 0, 0.25, 1) infinite"
      }}>
        {message}
      </div>

      {/* Scoped Hardware-Accelerated Keyframes */}
      <style>
        {`
          /* Rotates the dot. Slows down dramatically at 0deg (top) to reveal the logo */
          @keyframes mutespeak-orbit {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Comma scales down as the dot moves away, and snaps back as it returns */
          @keyframes mutespeak-comma {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(0.85); 
              opacity: 0.5; 
            }
          }
          
          /* Text gently fades in sync with the logo formation */
          @keyframes mutespeak-text-fade {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
}