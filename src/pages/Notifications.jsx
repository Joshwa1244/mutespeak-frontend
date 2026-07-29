import { useEffect, useState } from "react";
import NotificationCard from "../components/NotificationCard";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService";

import { 
  getCurrentUser 
} from "../services/authService";

import { 
  connectWebSocket, 
  subscribe 
} from "../services/websocketService";

export default function Notifications() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Fetch user and initial notifications on mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (isMounted) setCurrentUser(user);

        const data = await getNotifications();
        if (isMounted) setNotifications(data || []);
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Connect to WebSocket once we have the currentUser
  useEffect(() => {
    if (!currentUser) return;

    connectWebSocket();

    // Subscribe to the specific topic defined in FeedEventPublisher.java
    const destination = `/topic/notifications/${currentUser.id}`;
    
    const notificationSubscription = subscribe(
      destination,
      (newNotification) => {
        // The WS event uses 'notificationId', but REST uses 'id'. Normalize it:
        const normalizedNotification = {
          ...newNotification,
          id: newNotification.notificationId || newNotification.id,
        };

        setNotifications((prev) => {
          // Prevent duplicates
          if (prev.some((n) => n.id === normalizedNotification.id)) {
            return prev;
          }
          // Add lively new notification to the top
          return [normalizedNotification, ...prev];
        });
      }
    );

    return () => {
      if (notificationSubscription) {
        notificationSubscription.unsubscribe();
      }
    };
  }, [currentUser]);

  async function handleMarkAsRead(notificationId) {
    try {
      // Optimistic update for a snappy UI
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      await markAsRead(notificationId);
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      // Optimistic update
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
      await markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ============================================================================
  // PREMIUM BRAND STYLES
  // ============================================================================
  const PremiumStyles = (
    <style>{`
      :root {
        --brand-primary: #023d20;
        --brand-primary-hover: #03522b;
        --brand-accent: #b6c324;
        --brand-accent-hover: #c9d532;
        --brand-shadow: rgba(2, 61, 32, 0.08);
      }

      .notifications-page {
        max-width: 680px;
        margin: 0 auto;
        padding: 32px 20px;
        min-height: 100vh;
        animation: fadeIn 0.4s ease-out forwards;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .notifications-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(2, 61, 32, 0.1);
      }

      .notifications-title-area {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .notifications-title-area h2 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--brand-primary);
        letter-spacing: -0.02em;
      }

      .unread-badge {
        background: var(--brand-accent);
        color: var(--brand-primary);
        font-size: 0.85rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        box-shadow: 0 4px 12px rgba(182, 195, 36, 0.3);
        animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .mark-all-btn {
        border: 1px solid #e5e7eb;
        background: #ffffff;
        color: #374151;
        padding: 8px 20px;
        border-radius: 30px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .mark-all-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        color: var(--brand-primary);
      }

      .mark-all-btn:active {
        transform: scale(0.96);
      }

      .notifications-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .notifications-empty {
        text-align: center;
        padding: 80px 20px;
        background: #ffffff;
        border-radius: 24px;
        border: 2px dashed #e5e7eb;
        box-shadow: 0 4px 20px var(--brand-shadow);
      }

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .notifications-empty h3 {
        margin: 0 0 8px 0;
        color: var(--brand-primary);
        font-weight: 700;
        font-size: 1.25rem;
      }

      .notifications-empty p {
        margin: 0;
        color: #6b7280;
      }

      .notifications-loader, .notifications-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 100px 0;
        color: #6b7280;
      }

      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid rgba(2, 61, 32, 0.1);
        border-top-color: var(--brand-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      .notifications-error button {
        margin-top: 16px;
        background: var(--brand-primary);
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 30px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(2, 61, 32, 0.2);
      }

      .notifications-error button:hover {
        background: var(--brand-primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(2, 61, 32, 0.3);
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes popIn {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  );

  // ============================================================================
  // RENDERS
  // ============================================================================

  if (loading) {
    return (
      <>
        {PremiumStyles}
        <div className="notifications-page">
          <div className="notifications-loader">
            <div className="spinner"></div>
            <p>Catching you up...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {PremiumStyles}
        <div className="notifications-page">
          <div className="notifications-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {PremiumStyles}
      <div className="notifications-page">
        <div className="notifications-header">
          <div className="notifications-title-area">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>

          {notifications.length > 0 && unreadCount > 0 && (
            <button
              className="mark-all-btn"
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="notifications-empty">
              <div className="empty-icon">🔔</div>
              <h3>You're all caught up!</h3>
              <p>No new notifications at the moment.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}