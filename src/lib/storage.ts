"use client";

import { useSyncExternalStore } from "react";
import type { Store } from "./types";

// Everything lives under one versioned localStorage key. Pages read it with
// useStore(), which returns null on the server and during the first client render,
// so pages show a skeleton instead of flashing the wrong (first-visit vs.
// welcome-back) version.

export const STORAGE_KEY = "bucket-list:v1";

export function emptyStore(): Store {
  return {
    version: 1,
    rounds: [],
    practice: [],
    focus: null,
    holeNotes: {},
    customCourses: [],
    weeklyGoal: 1,
    seenTips: [],
    checklistDismissed: false,
    practiceDraft: null,
    unlocked: {},
    levels: {},
    streakSeen: null,
    trophyCaseViewedAt: null,
  };
}

let cache: { raw: string | null; value: Store } | null = null;
// Used when localStorage is unavailable (private mode, storage full), so the app
// keeps working for this visit.
let memory: Store | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): Store {
  if (!raw) return emptyStore();
  try {
    const data = JSON.parse(raw);
    if (data?.version === 1) return { ...emptyStore(), ...data };
  } catch {
    // Keep a copy of unreadable data instead of silently losing it.
    try {
      localStorage.setItem(`${STORAGE_KEY}:unreadable`, raw);
    } catch {}
  }
  return emptyStore();
}

function read(): Store {
  if (memory) return memory;
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    memory = emptyStore();
    return memory;
  }
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: parse(raw) };
  return cache.value;
}

function write(next: Store) {
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(STORAGE_KEY, raw);
    cache = { raw, value: next };
  } catch {
    memory = next;
  }
  listeners.forEach((l) => l());
}

export function update(change: (store: Store) => Store) {
  write(change(read()));
}

// Erases everything saved on this device, as if visiting for the first time.
export function resetStore() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  cache = null;
  if (memory) memory = emptyStore();
  listeners.forEach((l) => l());
}

// True when saves aren't reaching localStorage, so the UI can warn.
export function isSavingToMemoryOnly() {
  return memory !== null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab saved: re-read.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore(): Store | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
