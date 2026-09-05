import Image from "next/image";

type MeAvatarProps = {
  /** Outer diameter in px (Me tab: 24; About card: 56). */
  size?: number;
  className?: string;
};

export function MeAvatar({ size = 24, className }: MeAvatarProps) {
  const inset = Math.round(size * 0.8);

  return (
    <span
      className={["me-avatar", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/kelly-death-face.png"
        alt=""
        width={inset}
        height={inset}
        className="me-avatar-photo"
        sizes={`${inset}px`}
      />
    </span>
  );
}
