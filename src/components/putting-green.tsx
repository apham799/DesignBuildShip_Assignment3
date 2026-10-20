"use client";

import { useEffect, useState } from "react";
import { update } from "@/lib/storage";

// The weekly streak as a putt: each practice session is a stroke that rolls the ball
// closer, and the session that meets the goal holes it. A putter takes the ball back,
// strikes it, and follows through; the ball rolls from the moment of impact. Only
// progress made since it was last shown animates (remembered in the store), so a refresh
// doesn't replay it. Decorative: the card's text says the same thing, and reduced motion
// skips the putter and the movement.

const START = 34;
const HOLE = 280;
const STRIKE_MS = 450; // putter impact, halfway through its 900ms stroke
const ROLL_MS = 1100;
// Drop (700ms) plus the flag wave that follows it, before the putt is remembered as seen.
const HOLE_OUT_MS = 1200;

// The stroke, drop, ripple and flag wave live with the component (not globals.css), so the
// green animates wherever it's rendered.
const keyframes = `@keyframes putter-stroke {
  0% {
    transform: rotate(0deg);
    opacity: 0;
  }
  12% {
    transform: rotate(4deg);
    opacity: 1;
  }
  40% {
    transform: rotate(22deg);
  }
  50% {
    transform: rotate(0deg);
  }
  72% {
    transform: rotate(-14deg);
    opacity: 1;
  }
  100% {
    transform: rotate(-14deg);
    opacity: 0;
  }
}
@keyframes ball-drop {
  0% {
    transform: none;
    opacity: 1;
  }
  60% {
    transform: translateY(2px) scale(0.6);
    opacity: 1;
  }
  100% {
    transform: translateY(3px) scale(0.3);
    opacity: 0;
  }
}
@keyframes cup-ripple {
  from {
    transform: scale(1);
    opacity: 0.9;
  }
  to {
    transform: scale(3.2);
    opacity: 0;
  }
}
@keyframes flag-wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-8deg);
  }
  60% {
    transform: rotate(5deg);
  }
}`;

const xFor = (sessions: number, goal: number) => START + (Math.min(sessions, goal) / goal) * (HOLE - START);

export function PuttingGreen({ sessions, goal, week, seen }: { sessions: number; goal: number; week: string; seen: number }) {
  // Where the ball was last shown this week; it rolls from there to today's spot.
  const from = Math.min(seen, sessions);
  const [shown, setShown] = useState(from);
  const striking = from < sessions;
  const justHoled = from < goal && shown >= goal;
  const holed = shown >= goal;
  const landed = STRIKE_MS + ROLL_MS; // when the ball reaches today's spot

  useEffect(() => {
    if (from === sessions) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = requestAnimationFrame(() => setShown(sessions));
    const done = setTimeout(() => update((s) => ({ ...s, streakSeen: { week, sessions } })), reduce ? 0 : STRIKE_MS + ROLL_MS + (sessions >= goal ? HOLE_OUT_MS : 0));
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [from, sessions, goal, week]);

  const x = xFor(shown, goal);
  const strikeX = xFor(from, goal) - START; // the putter stands where the ball starts
  return (
    <svg viewBox="0 0 320 84" className="h-auto w-full" aria-hidden>
      <style>{keyframes}</style>
      {/* the green */}
      <ellipse cx="160" cy="50" rx="156" ry="30" fill="#e2eddb" stroke="#2f6b4f" strokeOpacity="0.35" strokeWidth="1.5" />
      <ellipse cx="160" cy="50" rx="120" ry="20" fill="#d3e4c8" opacity="0.6" />
      {/* where earlier putts this week stopped */}
      {Array.from({ length: Math.min(shown, goal) }, (_, i) => i).map((i) => (
        <circle key={i} cx={xFor(i, goal)} cy="50" r="2.2" fill="#4f4a41" opacity="0.35" />
      ))}
      <line x1={START} y1="50" x2={x} y2="50" stroke="#4f4a41" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 4" />
      {/* the cup, a ripple when the ball drops, and the flag */}
      <ellipse cx={HOLE} cy="51" rx="8" ry="4" fill="#2b2a28" />
      {/* already holed on an earlier visit: the ball sits in the cup */}
      {holed && !justHoled && <ellipse cx={HOLE} cy="50" rx="4.5" ry="2.2" fill="#ffffff" />}
      {justHoled && (
        <ellipse
          cx={HOLE}
          cy="51"
          rx="8"
          ry="4"
          fill="none"
          stroke="#2f6b4f"
          strokeWidth="1.5"
          className="origin-[280px_51px] motion-safe:animate-[cup-ripple_700ms_ease-out_both]"
          style={{ animationDelay: `${landed}ms` }}
        />
      )}
      <g className={justHoled ? "origin-[281px_50px] motion-safe:animate-[flag-wave_900ms_ease-in-out_both]" : undefined} style={justHoled ? { animationDelay: `${landed + 200}ms` } : undefined}>
        <line x1={HOLE + 1} y1="50" x2={HOLE + 1} y2="8" stroke="#2b2a28" strokeWidth="1.8" />
        <path d={`M${HOLE + 2} 9 L${HOLE + 26} 15 L${HOLE + 2} 21 Z`} fill="#b8893b" />
      </g>
      {/* the putter: back, through the ball, follow-through, then it fades */}
      {striking && (
        <g transform={`translate(${strikeX} 0)`} className="motion-reduce:hidden">
          <g className="motion-safe:animate-[putter-stroke_900ms_ease-in-out_both]" style={{ transformOrigin: `${START - 6}px 4px` }}>
            <rect x={START - 8} y="2" width="4" height="13" rx="2" fill="#4f4a41" />
            <line x1={START - 6} y1="12" x2={START - 9} y2="46" stroke="#2b2a28" strokeWidth="2" strokeLinecap="round" />
            <rect x={START - 20} y="45" width="12" height="9" rx="2" fill="#7a6e56" stroke="#2b2a28" strokeWidth="1.2" />
          </g>
        </g>
      )}
      {/* the ball: rolls from the moment of impact, then drops into the cup */}
      <g
        style={{ transform: `translateX(${x - START}px)`, transitionDelay: striking ? `${STRIKE_MS}ms` : "0ms" }}
        className="transition-transform duration-[1100ms] ease-[cubic-bezier(0.15,0.6,0.25,1)] motion-reduce:transition-none"
      >
        <g
          className={justHoled ? "origin-[34px_50px] motion-safe:animate-[ball-drop_700ms_ease-in_both]" : undefined}
          style={justHoled ? { animationDelay: `${landed}ms` } : holed ? { opacity: 0 } : undefined}
        >
          <circle cx={START} cy="50" r="6" fill="#ffffff" stroke="#4f4a41" strokeWidth="1.5" />
          <circle cx={START - 1.5} cy="48.5" r="0.9" fill="#4f4a41" opacity="0.5" />
          <circle cx={START + 1.5} cy="51" r="0.9" fill="#4f4a41" opacity="0.5" />
        </g>
      </g>
    </svg>
  );
}
