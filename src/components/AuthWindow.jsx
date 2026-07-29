import "./AuthWindow.css";

/**
 * Windows-98-style chrome frame, reused across every auth screen
 * (Login, Register, Verify OTP, Forgot Password) so the product
 * feels like one system, not four separate pages.
 */
export default function AuthWindow({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-window">
        <div className="auth-titlebar">
          <span className="pixel auth-titlebar-text">◆ mutespeak;</span>
          <div className="auth-dots">
            <span className="auth-dot" />
            <span className="auth-dot" />
            <span className="auth-dot" />
          </div>
        </div>

        <div className="auth-body">
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>
      </div>

      <p className="auth-footnote">
        Currently only @ Loyola College
      </p>
    </div>
  );
}
