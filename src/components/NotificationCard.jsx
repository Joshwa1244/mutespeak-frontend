import { useNavigate } from "react-router-dom";
import "./NotificationCard.css";

function formatTime(dateTime) {
  const now = new Date();
  const createdAt = new Date(dateTime);
  const diff = Math.floor((now - createdAt) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return createdAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationCard({ notification, onRead }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!notification.read && onRead) {
      onRead(notification.id);
    }
  };

  const handleProfileClick = (e) => {
    e.stopPropagation(); // Stops the card click event from firing

    // Mark as read if they view the profile from an unread notification
    if (!notification.read && onRead) {
      onRead(notification.id);
    }

    if (notification.senderId) {
      navigate(`/profile/${notification.senderId}`);
    }
  };

  // Prevent "senderName poked you" turning into "senderName senderName poked you"
  const cleanMessage = notification.message
    .replace(notification.senderName, "")
    .trim();

  return (
    <div
      className={`notification-card ${notification.read ? "read" : "unread"}`}
      onClick={handleCardClick}
    >
      {/* Avatar acting as a link */}
      <div
        className="notification-avatar-wrapper"
        onClick={handleProfileClick}
        title={`View ${notification.senderName}'s profile`}
      >
        <img
          className="notification-avatar"
          src={notification.senderProfilePicture || "/default-profile.png"}
          alt={notification.senderName}
        />
        <div className="avatar-overlay"></div>
      </div>

      <div className="notification-content">
        <p className="notification-message">
          <strong
            className="sender-name-link"
            onClick={handleProfileClick}
            title={`View ${notification.senderName}'s profile`}
          >
            {notification.senderName}
          </strong>{" "}
          {cleanMessage}
        </p>
        <span className="notification-time">
          {formatTime(notification.createdAt)}
        </span>
      </div>

      {!notification.read && <div className="notification-indicator" />}
    </div>
  );
}