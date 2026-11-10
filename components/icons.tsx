import type { CSSProperties } from "react";

type IconName =
  | "arrow"
  | "arrow-up"
  | "close"
  | "chevron-left"
  | "chevron-right"
  | "clock"
  | "pin"
  | "check"
  | "tooth"
  | "sparkle"
  | "smile"
  | "calendar"
  | "plus";

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M4 12h15M13 5l7 7-7 7" />
      </>
    ),
    "arrow-up": (
      <>
        <path d="M5 19 19 5M5 5h14v14" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M6 18 18 6" />
      </>
    ),
    "chevron-left": <path d="m15 5-7 7 7 7" />,
    "chevron-right": <path d="m9 5 7 7-7 7" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    tooth: (
      <path d="M12 5C8 1 3 4 4 9c.4 2.4 1.5 3.7 2 7 .6 4 3 6 4 1 .3-1.5.6-3 2-3s1.7 1.5 2 3c1 5 3.4 3 4-1 .5-3.3 1.6-4.6 2-7 1-5-4-8-8-4Zm0 0 3 2" />
    ),
    sparkle: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
        <path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z" />
      </>
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14c2 3 6 3 8 0M8 9h.01M16 9h.01" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
