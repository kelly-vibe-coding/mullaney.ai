import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

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
          background: "#0c0e12",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#ff5c38",
            fontSize: 112,
            fontWeight: 700,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
            letterSpacing: "-0.06em",
            lineHeight: 1,
            marginTop: -4,
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
