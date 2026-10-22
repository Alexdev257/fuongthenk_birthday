"use client";

import { useEffect, useState } from "react";
import type { ElementType } from "react";

const BOUQUET_POSTER = "/models/fuongthenn-blue-bouquet.png";

/** The seven-rose bouquet imported from sonabirthday, recolored in blue. */
export default function BlueBouquet({ active = false, loadModel = false, className = "" }: {
  active?: boolean;
  loadModel?: boolean;
  className?: string;
}) {
  const ModelViewer = "model-viewer" as ElementType;
  const [available, setAvailable] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!loadModel) return;
    let cancelled = false;
    void import("@google/model-viewer").then(() => {
      if (!cancelled) setAvailable(true);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [loadModel]);

  return (
    <div className={`blue-bouquet ${active ? "bouquet-active" : ""} ${ready && !failed ? "bouquet-ready" : ""} ${className}`} aria-hidden="true">
      <div className="bouquet-light" />
      {/* A local image of the same geometry prevents empty or flashing decoration. */}
      <div className="bouquet-poster" style={{ backgroundImage: `url("${BOUQUET_POSTER}")` }} />
      {available && !failed && loadModel && <ModelViewer
        className="bouquet-model"
        src="/models/fuongthenn-blue-bouquet.glb"
        poster={BOUQUET_POSTER}
        alt="Bó bảy bông hồng xanh dương với giấy gói trắng xanh và nơ sapphire"
        camera-orbit="0deg 90deg 7m"
        field-of-view="30deg"
        environment-image="neutral"
        exposure="1.15"
        shadow-intensity="0"
        interaction-prompt="none"
        loading="eager"
        reveal="auto"
        auto-rotate={active && !reducedMotion ? true : undefined}
        auto-rotate-delay="0"
        rotation-per-second="5deg"
        onLoad={() => setReady(true)}
        onError={() => setFailed(true)}
        tabIndex={-1}
      ><div slot="progress-bar" /></ModelViewer>}
      <div className="bouquet-shadow" />
    </div>
  );
}
