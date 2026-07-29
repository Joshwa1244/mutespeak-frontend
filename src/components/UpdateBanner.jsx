import { createPortal } from "react-dom"; // <-- 1. Import createPortal
import usePWAUpdate from "../hooks/usePWAUpdate";
import { updateSW } from "../main";
import "./UpdateBanner.css";

export default function UpdateBanner() {
  const { updateAvailable } = usePWAUpdate();

  if (!updateAvailable) return null;

  // 2. Wrap the JSX in createPortal and attach it to document.body
  return createPortal(
    <div className="update-banner">
      <div>
        <strong>New version available</strong>
        <p>
          Update mutespeak; to enjoy the latest improvements.
        </p>
      </div>

      <button
        className="update-button"
        onClick={() => updateSW(true)}
      >
        Update
      </button>
    </div>,
    document.body
  );
}