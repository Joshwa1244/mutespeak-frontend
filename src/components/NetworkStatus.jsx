import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom"; // <-- 1. Import createPortal
import useNetworkStatus from "../hooks/useNetworkStatus";
import "./NetworkStatus.css";

export default function NetworkStatus() {
  const isOnline = useNetworkStatus();
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  
  // Use a ref to track the first render without causing re-renders
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the toast logic on the very first page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isOnline) {
      setShowOnlineToast(true);
      
      const timer = setTimeout(() => {
        setShowOnlineToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Instantly hide the "Back online" toast if the user goes offline again
      setShowOnlineToast(false); 
    }
  }, [isOnline]);

  // 2. Wrap your return statement in createPortal(..., document.body)
  return createPortal(
    <>
      {!isOnline && (
        <div className="offline-banner">
          <span>You're offline</span>
        </div>
      )}

      {showOnlineToast && (
        <div className="online-toast">
          ✔ Back online
        </div>
      )}
    </>,
    document.body // <-- This forces the banner to render completely outside your app container
  );
}