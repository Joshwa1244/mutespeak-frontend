import { useState } from "react";
import { createPortal } from "react-dom";
// FIXED: Changed ../../ to ../ 
import useInstallPrompt from "../hooks/useInstallPrompt";
import "./InstallPrompt.css";

export default function InstallPrompt() {
  const { canInstall, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  // FIXED: Wrapped in createPortal so it doesn't get trapped inside other CSS layouts
  return createPortal(
    <div className="install-card">
      <div className="install-content">
        <h3>Install mutespeak;</h3>
        <p>
          Install the app for a faster, full-screen experience.
        </p>
      </div>

      <div className="install-actions">
        <button
          className="later-btn"
          onClick={() => setDismissed(true)}
        >
          Later
        </button>

        <button
          className="install-btn"
          onClick={install}
        >
          Install
        </button>
      </div>
    </div>,
    document.body
  );
}