import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/api";
import { SITE_NAME } from "@/lib/constants";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export const dynamic = "force-dynamic";

export async function generateImageMetadata() {
  let alt = `${SITE_NAME} — портфолио`;
  try {
    const profile = await getProfile();
    if (profile) {
      alt = `${profile.fullName}${profile.position ? ` — ${profile.position}` : ""}`;
    }
  } catch (error) {
    console.error("Failed to load profile for OG image alt:", error);
  }

  return [{ id: "default", size, contentType, alt }];
}

export default async function Image() {
  let name = SITE_NAME;
  let position = "";

  try {
    const profile = await getProfile();
    if (profile) {
      name = profile.fullName || SITE_NAME;
      position = profile.position || "";
    }
  } catch (error) {
    console.error("Failed to load profile for OG image:", error);
  }

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