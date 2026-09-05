import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

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
          background: "#0c0e12",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#ff5c38",
            fontSize: 20,
            fontWeight: 700,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
            letterSpacing: "-0.06em",
            lineHeight: 1,
            marginTop: -1,
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
