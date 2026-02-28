import { useEffect } from "react";

const SITE_NAME = "FitMatch";

const DEFAULT_DESCRIPTION =
  "GTA's marketplace for luxury European cabinetry at 50-80% off retail. Perfect fit-matching, bundled solutions, and fast installation.";

export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} — Luxury European Cabinets | 50-80% OFF in GTA`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description || DEFAULT_DESCRIPTION);

    return () => {
      document.title = `${SITE_NAME} — Luxury European Cabinets | 50-80% OFF in GTA`;
      metaDesc?.setAttribute("content", DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
