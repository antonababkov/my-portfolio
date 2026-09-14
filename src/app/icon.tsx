import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 48, height: 48 };
export const alt = "Favicon";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4f46e5",
          color: "#ffffff",
          borderRadius: 8,
          fontFamily: "Geist, sans-serif",
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
