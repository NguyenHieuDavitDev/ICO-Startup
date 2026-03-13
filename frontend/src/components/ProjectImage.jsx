import { useState } from "react";

// Each project gets a unique gradient based on its id
const GRADIENTS = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#ffecd2", "#fcb69f"],
  ["#a1c4fd", "#c2e9fb"],
  ["#fd7043", "#ff8a65"],
  ["#26c6da", "#00acc1"],
];

const ICONS = [
  "fa-seedling", "fa-rocket", "fa-lightbulb", "fa-brain", "fa-microchip",
  "fa-leaf", "fa-star", "fa-gem", "fa-bolt", "fa-fire",
];

/**
 * Props:
 *  src      — image URL (may be empty or broken)
 *  alt      — alt text
 *  seed     — number used to pick gradient/icon (e.g. project.id)
 *  height   — CSS height string, default "200px"
 *  className
 */
export default function ProjectImage({ src, alt = "", seed = 0, height = "200px", className = "" }) {
  const [status, setStatus] = useState("loading"); // loading | ok | error

  const idx  = Math.abs(seed) % GRADIENTS.length;
  const [c1, c2] = GRADIENTS[idx];
  const icon = ICONS[idx % ICONS.length];

  const hasSrc = src && src.trim().length > 0;

  return (
    <div
      className={`project-img-wrap ${className}`}
      style={{ height, position: "relative", overflow: "hidden", flexShrink: 0 }}
    >
      {/* ── Placeholder (gradient + icon) — visible when no src or error ── */}
      {(!hasSrc || status === "error") && (
        <div
          className="project-img-placeholder"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, height }}
        >
          <i className={`fas ${icon}`}></i>
        </div>
      )}

      {/* ── Shimmer skeleton while real img loads ── */}
      {hasSrc && status === "loading" && (
        <div className="img-shimmer" style={{ height }}></div>
      )}

      {/* ── Actual image ── */}
      {hasSrc && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="project-img-real"
          style={{
            opacity: status === "ok" ? 1 : 0,
            transition: "opacity .35s ease",
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
        />
      )}
    </div>
  );
}
