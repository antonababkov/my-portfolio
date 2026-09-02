import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/api";
import { SITE_NAME } from "@/lib/constants";

export const alt = "Иван Иванов — Frontend-разработчик";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const profile = await getProfile();
  const name = profile?.fullName || SITE_NAME;
  const position = profile?.position || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#171717",
          fontFamily: "Geist, sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, marginBottom: 24 }}>
          {name}
        </div>
        {position && (
          <div style={{ fontSize: 36, color: "#4f46e5", fontWeight: 500 }}>
            {position}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}