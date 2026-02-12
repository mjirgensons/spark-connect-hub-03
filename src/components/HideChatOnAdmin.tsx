import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const HideChatOnAdmin = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const widget = document.querySelector("elevenlabs-convai") as HTMLElement | null;
    if (widget) {
      widget.style.display = pathname.startsWith("/admin") ? "none" : "";
    }
  }, [pathname]);

  return null;
};
