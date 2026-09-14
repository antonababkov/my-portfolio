import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 180, height: 180 };
export const alt = "Apple Touch Icon";

export default function AppleIcon() {
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
          borderRadius: 24,
          fontFamily: "Geist, sans-serif",
          fontSize: 100,
          fontWeight: 700,
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
