// src/lib/Seo.tsx
// A minimal, dependency-free head manager for React 19+
// It updates <title>, <meta name="description">, <link rel="canonical">,
// Open Graph tags, and optional keywords.

import { useEffect } from "react";

type SeoProps = {
  title?: string;           // <title>
  description?: string;     // <meta name="description">
  canonical?: string;       // <link rel="canonical">
  ogTitle?: string;         // <meta property="og:title">
  ogDescription?: string;   // <meta property="og:description">
  ogImage?: string;         // <meta property="og:image">
  ogUrl?: string;           // <meta property="og:url">
  twitterCard?: "summary" | "summary_large_image";
  keywords?: string;        // <meta name="keywords">
};

// --- helper: find or create a <meta name="..."> tag ---
function setNamedMeta(name: string, content?: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// --- helper: find or create a <meta property="..."> tag (Open Graph) ---
function setPropertyMeta(prop: string, content?: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", prop);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// --- helper: find or create <link rel="canonical"> ---
function setCanonical(href?: string) {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard = "summary_large_image",
  keywords,
}: SeoProps) {
  useEffect(() => {
    // --- title ---
    if (title) document.title = title;

    // --- basic metas ---
    setNamedMeta("description", description);
    setNamedMeta("keywords", keywords);

    // --- canonical ---
    setCanonical(canonical);

    // --- Open Graph ---
    setPropertyMeta("og:title", ogTitle ?? title);
    setPropertyMeta("og:description", ogDescription ?? description);
    setPropertyMeta("og:image", ogImage);
    setPropertyMeta("og:url", ogUrl ?? canonical);

    // --- Twitter ---
    setNamedMeta("twitter:card", twitterCard);
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogUrl, twitterCard, keywords]);

  // This component renders nothing; it only updates <head>
  return null;
}

export default Seo;
