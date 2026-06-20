import React from "react";

// Glowing crescent-moon mark used in the header and onboarding.
export default function MoonLogo({ size = 40 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-gold-grad shadow-gold"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </div>
  );
}
