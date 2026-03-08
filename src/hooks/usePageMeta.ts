import { useEffect } from "react";

const SITE_NAME = "FitMatch";
const DEFAULT_TITLE = "FitMatch — Premium European Cabinetry at 50-80% Off | GTA";
const DEFAULT_DESCRIPTION =
  "Shop premium European kitchen and bathroom cabinets at 50-80% off retail. Free quotes, local delivery in the Greater Toronto Area.";

interface PageMetaOptions {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  canonical?: string;
}

/**
 * usePageMeta — sets document title, meta description, and Open Graph tags.
 *
 * Overload 1 (legacy): usePageMeta(title?, description?)
 * Overload 2 (new):    usePageMeta(options)
 */
export function usePageMeta(titleOrOptions?: string | PageMetaOptions, descriptionArg?: string) {
  useEffect(() => {
    let opts: PageMetaOptions;

    if (typeof titleOrOptions === "object" && titleOrOptions !== null) {
      opts = titleOrOptions;
    } else {
      opts = { title: titleOrOptions, description };
    }

    // Title
    document.title = opts.title
      ? opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} — ${SITE_NAME}`
      : DEFAULT_TITLE;

    // Description
    setMeta("description", opts.description || DEFAULT_DESCRIPTION);

    // OG tags
    setMeta("og:title", opts.title || DEFAULT_TITLE, true);
    setMeta("og:description", opts.description || DEFAULT_DESCRIPTION, true);
    if (opts.ogImage) setMeta("og:image", opts.ogImage, true);
    if (opts.ogType) setMeta("og:type", opts.ogType, true);
    if (opts.ogUrl) setMeta("og:url", opts.ogUrl, true);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (opts.canonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", opts.canonical);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta("description", DEFAULT_DESCRIPTION);
      removeMeta("og:title", true);
      removeMeta("og:description", true);
      removeMeta("og:image", true);
      removeMeta("og:type", true);
      removeMeta("og:url", true);
    };
  }, [titleOrOptions, description]);
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(name: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  // Don't remove if it was in index.html originally
  if (el && !el.hasAttribute("data-static")) {
    el.remove();
  }
}
