import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom"; // ✅ Added Link import here
import { getCurrentUser } from "../services/authService";
import { getUnreadCount } from "../services/notificationService";
import { subscribe } from "../services/websocketService";

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // -------------------------------------------------------------
  // FETCH & LISTEN FOR NOTIFICATIONS
  // -------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let notificationSubscription = null;

    async function refreshUnreadCount() {
      try {
        const data = await getUnreadCount();
        if (!cancelled) {
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    }
    
    async function initializeNotifications() {
      try {
        const user = await getCurrentUser();

        if (cancelled) {
          return;
        }

        await refreshUnreadCount();

        notificationSubscription = subscribe(
          `/topic/notifications/${user.id}`,
          () => {
            refreshUnreadCount();
          }
        );

      } catch (error) {
        console.error("Notification initialization failed", error);

        /*
         * Session expired or token missing.
         * Redirect back to login.
         */
        navigate("/", {
          replace: true,
        });
      }
    }

    initializeNotifications();

    return () => {
      cancelled = true;
      if (notificationSubscription) {
        notificationSubscription.unsubscribe();
      }
    };
  }, [navigate]);

  // -------------------------------------------------------------
  // BRAND → HOME
  // -------------------------------------------------------------
  function handleBrandClick() {
    navigate("/home");
  }

  return (
    <div className="app-shell">
      {/* =========================================================
         AUTHENTICATED HEADER
         Logged-in pages use this header.
         There is intentionally NO footer inside AppShell.
      ========================================================== */}
      <header className="app-header">
        {/* ✅ Added inline flex styles to separate the logo and the icon */}
        <div 
          className="app-header-inner" 
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}
        >
          {/* -----------------------------------------------------
             MUTESPEAK BRAND
          ------------------------------------------------------ */}
          <button
            type="button"
            className="app-wordmark app-wordmark-button"
            onClick={handleBrandClick}
            aria-label="Go to mutespeak home"
          >
            mutespeak;
          </button>

          {/* -----------------------------------------------------
             HUB ICON (Right Corner)
          ------------------------------------------------------ */}
          <Link 
            to="/hub" 
            aria-label="Campus Hub" 
            style={{ color: "#555650", display: "flex", alignItems: "center" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </Link>

        </div>
      </header>

      {/* =========================================================
         PAGE CONTENT
      ========================================================== */}
      <main className="app-content">
        {children}
      </main>

      {/* =========================================================
         MOBILE / APP NAVIGATION
      ========================================================== */}
      
      {/* Mobile-only styles to force a single line without breaking desktop */}
      <style>{`
        @media (max-width: 768px) {
          .bottom-nav {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            justify-content: space-evenly !important;
            align-items: center !important;
            width: 100% !important;
          }
          .bottom-nav-item {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 1 1 0px !important;
            width: 25% !important; /* Strictly divides space for 4 icons */
            min-width: 0 !important;
            text-decoration: none !important;
          }
          .bottom-nav-label {
            white-space: nowrap !important; /* Prevents text from breaking into 2 lines */
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <nav className="bottom-nav" aria-label="Main navigation">
        <NavItem to="/home" label="Home" icon={<HomeIcon />} />
        <NavItem to="/search" label="Search" icon={<SearchIcon />} />
        <NavItem 
          to="/notifications" 
          label="Notifications" 
          badgeCount={unreadCount} 
          icon={<NotificationIcon />} 
        />
        <NavItem to="/profile" label="Profile" icon={<ProfileIcon />} />
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------
// NAVIGATION ITEM
// ---------------------------------------------------------------
function NavItem({ to, label, icon, badgeCount = 0 }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? "bottom-nav-item active" : "bottom-nav-item"
      }
    >
      <span className="bottom-nav-icon" style={{ position: "relative" }}>
        {icon}
        {badgeCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-6px",
              backgroundColor: "#d93025",
              color: "white",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "2px 5px",
              borderRadius: "10px",
              lineHeight: 1,
            }}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </span>
      <span className="bottom-nav-label">
        {label}
      </span>
    </NavLink>
  );
}

// ---------------------------------------------------------------
// HOME ICON
// ---------------------------------------------------------------
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
      <path
        d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------
// SEARCH ICON
// ---------------------------------------------------------------
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------
// NOTIFICATION ICON
// ---------------------------------------------------------------
function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------
// PROFILE ICON
// ---------------------------------------------------------------
function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
      <circle
        cx="12"
        cy="8"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 21c.8-4.1 3.3-6.2 7.5-6.2s6.7 2.1 7.5 6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}