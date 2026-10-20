"use client";

import { useId, type ReactNode } from "react";
import type { Level } from "@/data/drills";
import { cx } from "@/components/ui";

// Accomplishment badges: a medallion with a ribbon and an icon. Earned badges are club
// green with a brass ring; ones still to earn are a pale, dashed outline. Decorative
// (aria-hidden); the title and status are always in text next to them.

const INK = "#ffffff";
const LOCKED_INK = "#4f4a41";

// Icons drawn in a 24×24 box, centred in the medallion.
function Icon({ id, color }: { id: string; color: string }): ReactNode {
  const stroke = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const text = (t: string, size = 10) => (
    <text x="12" y="16" textAnchor="middle" fontSize={size} fontWeight="800" fill={color} fontFamily="var(--font-sans)">
      {t}
    </text>
  );
  switch (id) {
    case "first-round": // a tee with a ball on it
      return (
        <>
          <circle cx="12" cy="6.5" r="3.2" {...stroke} />
          <path d="M8.5 10.5 H15.5 L13 13 V20 L12 21 L11 20 V13 Z" fill={color} />
        </>
      );
    case "first-par": // flag in the hole
      return (
        <>
          <path d="M9 21 V3 L17 6.5 L9 10" {...stroke} />
          <ellipse cx="11" cy="21" rx="5" ry="1.4" fill={color} />
        </>
      );
    case "first-birdie": // a bird in flight
      return <path d="M3 11 C6 8, 9 8, 12 12 C15 8, 18 8, 21 11 M12 12 L12 16" {...stroke} />;
    case "up-and-down":
      return <path d="M4 18 C8 4, 16 4, 20 18 M17 15 L20 18 L22 14" {...stroke} />;
    case "no-three-putts":
      return text("2", 14);
    case "fairway-finder": // a fairway with a ball in the middle
      return (
        <>
          <path d="M6 21 L9 3 M18 21 L15 3" {...stroke} />
          <circle cx="12" cy="13" r="2.4" fill={color} />
        </>
      );
    case "three-greens": // a green with a flag
      return (
        <>
          <ellipse cx="12" cy="17" rx="8" ry="3.5" {...stroke} />
          <path d="M12 17 V4 L17 6.5 L12 9" {...stroke} />
        </>
      );
    case "bogey-golf":
      return text("+9", 10);
    case "full-18":
      return text("18", 11);
    case "course-collector": // map pin
      return (
        <>
          <path d="M12 21 C7 15, 5 12, 5 9 A7 7 0 0 1 19 9 C19 12, 17 15, 12 21 Z" {...stroke} />
          <circle cx="12" cy="9" r="2.4" fill={color} />
        </>
      );
    case "first-practice": // a range bucket of balls
      return (
        <>
          <path d="M5 10 H19 L17 20 H7 Z" {...stroke} />
          <circle cx="9.5" cy="7" r="2" fill={color} />
          <circle cx="14.5" cy="7" r="2" fill={color} />
          <circle cx="12" cy="4" r="2" fill={color} />
        </>
      );
    case "range-rat": // a pyramid of balls
      return (
        <>
          {[
            [12, 6],
            [9, 11],
            [15, 11],
            [6, 16],
            [12, 16],
            [18, 16],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.3" fill={color} />
          ))}
        </>
      );
    case "hour-of-power": // clock
      return (
        <>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M12 7 V12 L15.5 14" {...stroke} />
        </>
      );
    case "on-target": // target
      return (
        <>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <circle cx="12" cy="12" r="4.2" {...stroke} />
          <circle cx="12" cy="12" r="1.4" fill={color} />
        </>
      );
    case "gold-standard": // star
      return <path d="M12 3 L14.6 9 L21 9.4 L16 13.6 L17.6 20 L12 16.4 L6.4 20 L8 13.6 L3 9.4 L9.4 9 Z" fill={color} />;
    case "well-rounded": // four quarters
      return (
        <>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M12 4 V20 M4 12 H20" {...stroke} />
        </>
      );
    case "its-working": // a line going up
      return <path d="M4 18 L9 13 L13 15 L20 7 M15.5 7 H20 V11.5" {...stroke} />;
    case "yardage-book": // notebook
      return (
        <>
          <rect x="6" y="3.5" width="12" height="17" rx="1.5" {...stroke} />
          <path d="M9 8 H15 M9 12 H15 M9 16 H13" {...stroke} />
        </>
      );
    case "off-the-map": // compass
      return (
        <>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M14.8 9.2 L13 13 L9.2 14.8 L11 11 Z" fill={color} />
        </>
      );
    case "month-of-practice": // calendar
      return (
        <>
          <rect x="4" y="5.5" width="16" height="14" rx="1.5" {...stroke} />
          <path d="M4 10 H20 M8.5 3.5 V7 M15.5 3.5 V7" {...stroke} />
          <path d="M8.5 14 L11 16.5 L16 12.5" {...stroke} />
        </>
      );
    default:
      return <path d="M12 3 L14.6 9 L21 9.4 L16 13.6 L17.6 20 L12 16.4 L6.4 20 L8 13.6 L3 9.4 L9.4 9 Z" fill={color} />;
  }
}

const sizes = { xs: "size-7", sm: "size-10", md: "size-16", lg: "size-20" } as const;

type BadgeProps = {
  // Achievement id (picks the icon) or a challenge level (bronze/silver/gold medal).
  id?: string;
  level?: Level;
  earned: boolean;
  size?: keyof typeof sizes;
  // Play the unlock (pop, spin, shine, sparkles). Delay lets a row stagger.
  animate?: boolean;
  delay?: number;
  className?: string;
};

const medal = {
  earned: { face: "#1f4d3a", ring: "#b8893b", ribbon: ["#2f6b4f", "#b8893b"] },
  locked: { face: "#f8f2e4", ring: "#7a6e56", ribbon: ["#e6dcc4", "#e6dcc4"] },
  bronze: { face: "#8a5a2b", ring: "#c08a52", ribbon: ["#8a5a2b", "#c08a52"] },
  silver: { face: "#5c6670", ring: "#aeb6be", ribbon: ["#5c6670", "#aeb6be"] },
  gold: { face: "#9a7128", ring: "#e2bd5c", ribbon: ["#9a7128", "#e2bd5c"] },
} as const;

export function Badge({ id, level, earned, size = "md", animate, delay = 0, className }: BadgeProps) {
  const look = level ? (earned ? medal[level] : medal.locked) : earned ? medal.earned : medal.locked;
  const ink = earned ? INK : LOCKED_INK;
  const anim = animate && earned;
  // Each badge clips its shine to its own medallion.
  const clipId = `badge-face-${useId().replace(/:/g, "")}`;
  return (
    <span aria-hidden className={cx("relative inline-block shrink-0", sizes[size], className)}>
      <svg viewBox="0 0 64 64" className="size-full overflow-visible">
        <defs>
          <clipPath id={clipId}>
            <circle cx="32" cy="28" r="22" />
          </clipPath>
        </defs>
        <g
          className={anim ? "motion-safe:animate-[badge-unlock_700ms_cubic-bezier(0.2,0.8,0.3,1.2)_both]" : undefined}
          style={{ transformOrigin: "32px 30px", animationDelay: anim ? `${delay}ms` : undefined }}
        >
          {/* ribbon tails */}
          <path d="M22 40 L16 62 L23 57 L27 63 L32 44 Z" fill={look.ribbon[0]} />
          <path d="M42 40 L48 62 L41 57 L37 63 L32 44 Z" fill={look.ribbon[1]} />
          {/* medallion */}
          <circle cx="32" cy="28" r="22" fill={look.face} stroke={look.ring} strokeWidth="4" strokeDasharray={earned ? undefined : "5 4"} />
          <circle cx="32" cy="28" r="16" fill="none" stroke={earned ? look.ring : "transparent"} strokeOpacity="0.55" strokeWidth="1.2" />
          <g transform="translate(20 16)">{level ? <Icon id="gold-standard" color={ink} /> : <Icon id={id ?? ""} color={ink} />}</g>
          {/* shine sweeping across the face */}
          {anim && (
            <g clipPath={`url(#${clipId})`}>
              <g transform="rotate(25 32 28)">
                <rect
                  x="-10"
                  y="-10"
                  width="14"
                  height="84"
                  fill="#ffffff"
                  opacity="0.45"
                  className="motion-safe:animate-[badge-shine_800ms_ease-in-out_both] motion-reduce:hidden"
                  style={{ animationDelay: `${delay + 550}ms` }}
                />
              </g>
            </g>
          )}
        </g>
        {/* sparkles */}
        {anim &&
          [
            [8, 10],
            [57, 8],
            [60, 40],
            [4, 38],
          ].map(([x, y], i) => (
            <path
              key={i}
              d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z`}
              fill="#b8893b"
              className="motion-safe:animate-[badge-sparkle_900ms_ease-out_both] motion-reduce:hidden"
              style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${delay + 400 + i * 90}ms` }}
            />
          ))}
      </svg>
    </span>
  );
}

// Rendered once (in the layout) so every badge can animate.
export function BadgeStyles() {
  return (
    <style>{`
@keyframes badge-unlock {
  0% { transform: scale(0.3) rotate(-25deg); opacity: 0; }
  60% { transform: scale(1.12) rotate(6deg); opacity: 1; }
  80% { transform: scale(0.96) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes badge-shine {
  from { transform: translateX(0); }
  to { transform: translateX(84px); }
}
@keyframes badge-sparkle {
  0% { transform: scale(0); opacity: 0; }
  40% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.6); opacity: 0; }
}`}</style>
  );
}
