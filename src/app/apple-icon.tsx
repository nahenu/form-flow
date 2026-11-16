import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS: the FormFlow mark, generated at build time. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#09318D" }}>
        <svg width="124" height="124" viewBox="0 0 16 16" fill="none">
          <path d="M3 4.5h10M3 8h6.5M3 11.5h4.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="11.75" cy="11.5" r="1.9" fill="#FD91CC" />
        </svg>
      </div>
    ),
    size,
  );
}
