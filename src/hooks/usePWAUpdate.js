import { useEffect, useState } from "react";

export default function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const onControllerChange = () => {
      setUpdateAvailable(true);
    };

    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      onControllerChange
    );

    return () => {
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  return {
    updateAvailable,
  };
}