import { Link } from "react-router-dom";
import "./Hub.css";

export default function Hub() {
  return (
    <div className="hub-container">
      <div className="hub-header-section">
        <h1 className="hub-title">Campus Hub</h1>
        <p className="hub-subtitle">Explore exclusive campus services and official announcements.</p>
      </div>

      <div className="hub-grid">
        <Link to="/news" className="hub-card hub-card--active">
          <div className="hub-card-content">
            <h2>The Loyola Gazette</h2>
            <p>Daily campus announcements and official news published directly from campus sources.</p>
          </div>
          <div className="hub-arrow-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <div className="hub-card hub-card--disabled">
          <div className="hub-ribbon"><span>Coming Soon</span></div>
          <h2>Campus Athletics</h2>
          <p>Schedules, tournament trackers, and live sports updates.</p>
        </div>

        <div className="hub-card hub-card--disabled">
          <div className="hub-ribbon"><span>Coming Soon</span></div>
          <h2>Marketplace</h2>
          <p>Student exchanges, books, gear, and local micro-commerce.</p>
        </div>

        <div className="hub-card hub-card--disabled">
          <div className="hub-ribbon"><span>Coming Soon</span></div>
          <h2>Platform Updates</h2>
          <p>Changelogs, new features, and system maintenance logs.</p>
        </div>
      </div>
    </div>
  );
}