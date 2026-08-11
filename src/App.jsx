import React, { useState, useEffect, useRef } from "react";
import {
  Droplet, Snowflake, Sparkles, Utensils, Footprints, Moon, Sun,
  Camera, ChevronRight, ChevronLeft, Check, Heart, X,
  Home as HomeIcon, BarChart3, Image as ImageIcon,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import storage from "./storage";

/* ---------------------------------- THEME ---------------------------------- */
const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Montserrat:wght@400;500;600;700&display=swap');
  .sgc-serif { font-family: 'Instrument Serif', serif; }
  .sgc-serif-italic { font-family: 'Instrument Serif', serif; font-style: italic; }
  .sgc-sans { font-family: 'Montserrat', sans-serif; }
  * { box-sizing: border-box; }
`;

const COLORS = {
  cream: "#FBF6EE",
  creamDeep: "#F4ECDD",
  blush: "#FBE9EC",
  blushDeep: "#F3CBD3",
  rose: "#D98A9B",
  roseDeep: "#B9647B",
  ink: "#3A3230",
  inkSoft: "#8A7D77",
};

const MAX_CYCLES = 2;
const WATER_GOAL = 8;
const STORAGE_KEY = "puffy-face-reset-state";
const PHOTO1_KEY = "puffy-face-reset-day1-photo";
const PHOTO7_KEY = "puffy-face-reset-day7-photo";

/* ---------------------------------- CONTENT ---------------------------------- */
const FOCUS_DATA = [
  { title: "Observe your baseline", why: "Today isn't about fixing anything yet — just notice how your face feels this morning. That's your starting point." },
  { title: "Build hydration consistency", why: "Dehydration can make your body hold onto more fluid. Staying consistently hydrated today teaches your body it doesn't need to retain water." },
  { title: "Support circulation", why: "Sluggish circulation lets fluid pool overnight. Today's focus is gentle movement and lymphatic massage to keep things flowing." },
  { title: "Improve sleep habits", why: "Poor sleep disrupts your body's overnight drainage. Tonight, prioritize your wind-down and a slightly elevated head." },
  { title: "Reduce sodium where possible", why: "Excess salt encourages your body to hold onto water. Today, go a little lighter on salty and processed foods." },
  { title: "Stay consistent", why: "You're almost there. The habits matter more than any single day — keep showing up the way you have been." },
  { title: "Celebrate progress", why: "This is it — your last day. Take a moment to notice what's changed since Day 1, and be proud of what you built." },
];

// Seven distinct reflection prompts — one per day, none repeated.
const REFLECTION_PROMPTS = [
  "How did your skin feel when you woke up this morning?",
  "What was your easiest water moment today?",
  "How did you feel after your massage today?",
  "How refreshed did you feel upon waking today?",
  "What hydrating or nourishing meal did you enjoy today?",
  "What habit are you most excited to carry into next week?",
  "Which habit has become your favorite part of the day?",
];

// Day 1 and Day 7 keep the full "breathing space" moment; Days 2–6 get a single short line so the ceremony
// doesn't start to feel like reading the same paragraph every day by midweek.
const MORNING_TRANSITIONS_FULL = {
  0: ["Beautiful work.", "You've taken care of yourself this morning. Now go enjoy your day.", "Come back tonight for your Evening Reset."],
  6: ["One more morning, beautifully done.", "This is your last Morning Reset for the week — you've really shown up for yourself.", "Come back tonight for your final Evening Reset."],
};
const MORNING_TRANSITIONS_SHORT = [
  "Morning done — see you tonight.",
  "That's your morning sorted.",
  "Nice work this morning.",
  "Morning complete. Evening's next.",
  "Good start to the day.",
];
// Written as preparation for sleep — Reflection still comes after this, so it never sounds like the day is over yet.
const EVENING_TRANSITIONS_FULL = {
  0: ["Your evening routine is set.", "You've given your body a good chance to rest and recover tonight.", "Just one quick reflection left before you close out the day."],
  6: ["Your final evening routine is set.", "You've made it through a full week of caring for yourself, morning and night.", "One last reflection, and your week is complete."],
};
const EVENING_TRANSITIONS_SHORT = [
  "Evening done — one quick reflection to go.",
  "Tonight's routine is set.",
  "Nicely done tonight.",
  "Evening sorted — reflection's next.",
  "That's tonight taken care of.",
];
const getTransitionLines = (type, dayIndex) => {
  const fullMap = type === "morning" ? MORNING_TRANSITIONS_FULL : EVENING_TRANSITIONS_FULL;
  if (fullMap[dayIndex]) return fullMap[dayIndex];
  const shortList = type === "morning" ? MORNING_TRANSITIONS_SHORT : EVENING_TRANSITIONS_SHORT;
  return [shortList[(dayIndex - 1) % shortList.length]];
};

const MORNING_HABITS = [
  { key: "water", title: "Start with one glass of water", Icon: Droplet },
  { key: "cold", title: "A moment of cold therapy", Icon: Snowflake },
  { key: "massage", title: "5-minute lymphatic massage", Icon: Sparkles },
  { key: "breakfast", title: "A balanced breakfast", Icon: Utensils },
  { key: "movement", title: "A little movement", Icon: Footprints },
];

const EVENING_HABITS = [
  { key: "skincare", title: "Evening skincare" },
  { key: "avoidSalt", title: "Easing off salty snacks" },
  { key: "sleepPrep", title: "Sleep preparation" },
];

// Cold therapy is chosen by the person each day, not rotated automatically.
const COLD_METHODS = {
  Splash: "Splash ice-cold water on your face 2–3 times.",
  Dip: "Submerge your face in a bowl of cold water for 10–15 seconds.",
  Roll: "Glide a chilled roller across your face.",
  Spoons: "Press two chilled spoons gently to your eyes and puffy areas.",
};

// Each of these habits gets a few variants so the tip changes as the week goes on instead of repeating verbatim.
const HABIT_VARIANTS = {
  water: [
    "About 8 glasses across the day — this first one helps your body let go of excess fluid.",
    "Try a big glass before your coffee today — it makes more of a difference than people think.",
    "Keep a bottle or cup nearby this morning so sipping stays effortless.",
    "Add a slice of lemon or cucumber if it helps you drink more today.",
  ],
  // The oil/serum tip only appears on Day 1 — the other days keep their own focus so it doesn't repeat every day.
  massage: [
    "Apply a facial oil or serum first, then follow the 5-minute routine from your guide, with extra attention on your jawline.",
    "Follow the 5-minute routine from your guide, focusing on your cheeks today.",
    "Follow the 5-minute routine from your guide — don't skip the under-eye sweep.",
    "Follow the 5-minute routine from your guide, finishing with long strokes down your neck.",
  ],
  breakfast: [
    "Protein and fiber help support steady energy — try eggs or Greek yogurt.",
    "Add something water-rich today, like berries or citrus, alongside your protein.",
    "Avocado toast with a boiled egg is an easy balanced option.",
    "Oats with fruit and a scoop of protein keep things simple and balanced.",
  ],
  movement: [
    "Even a 10–20 minute walk counts.",
    "Try some light stretching or a few minutes of yoga.",
    "A short walk after breakfast supports circulation nicely.",
    "Dance around your room for five minutes if that's more fun than a walk — it still counts.",
  ],
  skincare: [
    "A few gentle minutes of skincare, whenever suits your evening.",
    "Cleanse with cool or lukewarm water tonight — it supports circulation.",
    "Take an extra minute to massage your moisturizer in as you apply it.",
    "Keep it simple tonight — cleanse, moisturize, done.",
  ],
  avoidSalt: [
    "Try to skip salty or processed foods this evening.",
    "If you're snacking tonight, reach for something water-rich instead of salty.",
    "Check labels tonight — sauces and dressings often hide extra sodium.",
    "A lighter, earlier dinner tends to help the most.",
  ],
  sleepPrep: [
    "Prop your head with an extra pillow and keep the room cool.",
    "Try winding down without your phone for the last 10 minutes tonight.",
    "A cool, dark room supports deeper rest.",
    "Sleeping on your back or side, rather than face-down, can help too.",
  ],
};
const getVariant = (key, dayIndex) => {
  const list = HABIT_VARIANTS[key] || [];
  return list.length ? list[dayIndex % list.length] : "";
};

const HABIT_LABELS = {
  water: "Morning hydration", cold: "Cold therapy", massage: "Lymphatic massage", breakfast: "Balanced breakfast",
  movement: "Movement", skincare: "Evening skincare", waterGoal: "Daily water goal",
  avoidSalt: "Avoiding late salt", sleepPrep: "Sleep prep",
};
const HABIT_KEYS = [...MORNING_HABITS.map((h) => h.key), ...EVENING_HABITS.map((h) => h.key), "waterGoal"];

// The guide content, brought into the app itself so no one needs to reopen the PDF.
const LYMPHATIC_STEPS = [
  { step: 1, title: "Open the Drainage Pathways", desc: "Place your fingertips just above the collarbones. Make gentle circles for 5–10 seconds." },
  { step: 2, title: "Sweep the Cheeks", desc: "Sweep from the sides of the nose, across the cheeks, toward the ears." },
  { step: 3, title: "Sculpt the Jawline", desc: "Sweep from the center of the chin along the jawline toward the ears." },
  { step: 4, title: "Lift the Mid-Cheeks", desc: "Sweep from the corners of the mouth upward across the cheeks toward the ears." },
  { step: 5, title: "Depuff the Under-Eye Area", desc: "Using your ring fingers, gently sweep from the inner corners of the eyes toward the temples." },
  { step: 6, title: "Release the Forehead", desc: "Sweep from the center of the forehead outward toward the temples." },
  { step: 7, title: "Drain the Neck", desc: "Starting just below the ears, gently sweep down the sides of the neck toward the collarbones. Repeat 3 times." },
  { step: 8, title: "Finish the Routine", desc: "Sweep down the sides of the neck to the collarbones. Take a deep breath." },
];

const FOOD_GUIDE = [
  { title: "Potassium-rich foods", desc: "Help support healthy fluid balance.", items: ["Bananas", "Avocados", "Spinach", "Sweet potatoes", "Watermelon", "Coconut water"] },
  { title: "Water-rich foods", desc: "Support hydration and fluid regulation.", items: ["Cucumber", "Watermelon", "Oranges", "Strawberries", "Celery"] },
  { title: "Anti-inflammatory foods", desc: "Support overall wellness and recovery.", items: ["Berries", "Ginger", "Turmeric", "Leafy greens", "Brown rice", "Green tea"] },
  { title: "Protein & healthy fats", desc: "Support overall balance.", items: ["Salmon", "Eggs", "Tofu", "Nuts and seeds", "Olive oil"] },
];

const emptyDay = () => ({
  morning: { water: false, cold: false, massage: false, breakfast: false, movement: false },
  evening: { skincare: false, avoidSalt: false, sleepPrep: false },
  coldChoice: "Splash",
  sleepHours: "",
  waterGlasses: 0,
  puffMorning: 0,
  puffNight: 0,
  reflection: "",
});

/* ---------------------------------- HELPERS ---------------------------------- */
const allTrue = (obj) => Object.values(obj).every(Boolean);
const anyTrue = (obj) => Object.values(obj).some(Boolean);
const isDayTouched = (d) => anyTrue(d.morning) || anyTrue(d.evening) || d.reflection || d.puffMorning || d.puffNight || d.waterGlasses > 0;
// Evening "closes off" once its habits are checked and at least some water is logged. (Sleep duration is a
// planning tool, not a completion gate.)
const eveningAllDone = (d) => allTrue(d.evening) && d.waterGlasses > 0;
const reflectionAllDone = (d) => Boolean(d.reflection.trim() && d.puffMorning && d.puffNight);
const isDayComplete = (d) => allTrue(d.morning) && eveningAllDone(d) && reflectionAllDone(d);
const currentDayIndex = (daysData) => {
  const idx = daysData.findIndex((d) => !isDayComplete(d));
  return idx === -1 ? daysData.length - 1 : idx;
};
const streakFromStart = (daysData) => {
  let s = 0;
  for (const d of daysData) { if (isDayComplete(d)) s++; else break; }
  return s;
};
// Whether a given habit key was "done" that day — waterGoal is derived from the glass count, not a checkbox.
const habitDone = (d, key) => {
  if (key === "waterGoal") return d.waterGlasses >= WATER_GOAL;
  if (key in d.morning) return d.morning[key];
  return d.evening[key];
};
const weeklyProgressPct = (daysData) => {
  const total = daysData.reduce((sum, d) => sum + HABIT_KEYS.filter((k) => habitDone(d, k)).length, 0);
  return Math.round((total / (daysData.length * HABIT_KEYS.length)) * 100);
};
const badgesForDays = (daysData) => {
  const badges = [];
  if (isDayComplete(daysData[0])) badges.push("First Day Complete");
  if (daysData.some((d) => d.waterGlasses >= WATER_GOAL)) badges.push("Water Goal Reached");
  const completedCount = daysData.filter(isDayComplete).length;
  if (completedCount >= 2) badges.push("Two Days Completed");
  let streak = 0, maxStreak = 0;
  daysData.forEach((d) => { streak = isDayComplete(d) ? streak + 1 : 0; maxStreak = Math.max(maxStreak, streak); });
  if (maxStreak >= 3) badges.push("Three-Day Streak");
  if (isDayComplete(daysData[3])) badges.push("Halfway There");
  if (isDayComplete(daysData[5])) badges.push("Six Days Complete");
  if (completedCount === 7) badges.push("Weekly Reset Complete");
  return badges;
};
// Compares average morning puffiness on days a habit was done vs. not — the core "what's causing this" insight.
const puffinessInsight = (daysData) => {
  let best = null;
  HABIT_KEYS.forEach((key) => {
    const withHabit = daysData.filter((d) => habitDone(d, key) && d.puffMorning);
    const withoutHabit = daysData.filter((d) => !habitDone(d, key) && d.puffMorning);
    if (withHabit.length && withoutHabit.length) {
      const avgWith = withHabit.reduce((s, d) => s + d.puffMorning, 0) / withHabit.length;
      const avgWithout = withoutHabit.reduce((s, d) => s + d.puffMorning, 0) / withoutHabit.length;
      const gap = avgWithout - avgWith;
      if (!best || Math.abs(gap) > Math.abs(best.gap)) best = { key, avgWith, avgWithout, gap };
    }
  });
  return best;
};
const coachingMessage = (dayIdx, daysData) => {
  if (dayIdx === 0) return null;
  const prev = daysData[dayIdx - 1];
  if (!prev || !isDayTouched(prev)) return null;
  if (!prev.morning.water || prev.waterGlasses < WATER_GOAL) return "Hydration was a little harder yesterday — let's start with one glass today.";
  if (!prev.morning.movement) return "Movement got missed yesterday — even five minutes today would help.";
  if (prev.sleepHours && Number(prev.sleepHours) >= 8) return "Looks like you got more sleep last night — that should help.";
  if (prev.sleepHours && Number(prev.sleepHours) < 7) return "Sleep was short last night — try for an earlier wind-down tonight.";
  if (isDayComplete(prev)) return "You completed every habit yesterday — let's keep that going.";
  return null;
};
const greetingForNow = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

/* ---------------------------------- SMALL UI PIECES ---------------------------------- */
function ProgressBar({ value, height = 8 }) {
  return (
    <div style={{ background: COLORS.blush, borderRadius: 999, height, width: "100%", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(90deg, ${COLORS.roseDeep}, ${COLORS.rose})`, height: "100%", width: `${Math.max(0, Math.min(100, value))}%`, borderRadius: 999, transition: "width .6s ease" }} />
    </div>
  );
}

function SoftButton({ children, onClick, variant = "primary", disabled, style }) {
  const base = {
    fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, padding: "13px 26px",
    borderRadius: 999, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, transition: "transform .15s ease", display: "inline-flex",
    alignItems: "center", gap: 8, ...style,
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${COLORS.roseDeep}, ${COLORS.rose})`, color: "#fff", boxShadow: "0 6px 16px rgba(185,100,123,0.28)" },
    ghost: { background: "transparent", color: COLORS.roseDeep, border: `1.5px solid ${COLORS.blushDeep}` },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = "translateY(-1px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
      {children}
    </button>
  );
}

function Card({ children, style, highlight, soft }) {
  return (
    <div style={{
      background: soft ? COLORS.blush : "#fff", borderRadius: 24, padding: "24px 22px", marginBottom: 16,
      boxShadow: soft ? "none" : "0 10px 30px rgba(185,100,123,0.08)",
      border: soft ? "none" : `1.5px solid ${highlight ? COLORS.roseDeep : COLORS.blush}`,
      ...style,
    }}>{children}</div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: COLORS.blushDeep, opacity: 0.6 }} />
      <Heart size={12} color={COLORS.rose} fill={COLORS.rose} />
      <div style={{ flex: 1, height: 1, background: COLORS.blushDeep, opacity: 0.6 }} />
    </div>
  );
}

function Eyebrow({ children }) {
  return <div className="sgc-sans" style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: COLORS.roseDeep, fontWeight: 700, marginBottom: 8 }}>{children}</div>;
}

// Habit row and any related controls (cold method picker, guide link) live inside ONE shared card —
// every habit keeps its own separate, clearly visible box.
function HabitRow({ title, why, done, onToggle, Icon, extra }) {
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); }
  };
  return (
    <div style={{
      borderRadius: 16, padding: "14px 16px", marginBottom: 10,
      background: done ? COLORS.blush : "#fff", border: `1.5px solid ${done ? COLORS.blushDeep : COLORS.blush}`,
      boxShadow: done ? "none" : "0 4px 14px rgba(185,100,123,0.06)",
      transition: "background .2s ease",
    }}>
      <div
        onClick={onToggle}
        onKeyDown={handleKey}
        role="checkbox"
        aria-checked={done}
        tabIndex={0}
        style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
      >
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: done ? COLORS.roseDeep : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", color: done ? "#fff" : COLORS.rose, border: `1px solid ${COLORS.blushDeep}`,
          }}><Icon size={16} /></div>
        )}
        <div style={{ flex: 1 }}>
          <div className="sgc-sans" style={{ fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{title}</div>
          <div className="sgc-sans" style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2, lineHeight: 1.4 }}>{why}</div>
        </div>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: done ? COLORS.roseDeep : "#fff",
          border: `1.5px solid ${done ? COLORS.roseDeep : COLORS.blushDeep}`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>{done && <Check size={14} color="#fff" strokeWidth={3} />}</div>
      </div>
      {extra && <div style={{ marginTop: 12 }}>{extra}</div>}
    </div>
  );
}

function PuffinessScale({ value, onChange, labelPrefix }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${labelPrefix || "Puffiness"} level ${n} of 5`} className="sgc-sans" style={{
          width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${value === n ? COLORS.roseDeep : COLORS.blushDeep}`,
          background: value === n ? COLORS.roseDeep : "#fff", color: value === n ? "#fff" : COLORS.inkSoft, fontWeight: 600, cursor: "pointer",
        }}>{n}</button>
      ))}
    </div>
  );
}

function WaterTracker({ value, onChange, goal = WATER_GOAL }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Array.from({ length: goal }).map((_, i) => (
        <button key={i} onClick={() => onChange(i + 1 === value ? i : i + 1)} aria-label={`Glass ${i + 1} of ${goal}`} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <Droplet size={22} color={i < value ? COLORS.roseDeep : COLORS.blushDeep} fill={i < value ? COLORS.roseDeep : "none"} />
        </button>
      ))}
    </div>
  );
}

function ColdMethodPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Object.keys(COLD_METHODS).map((m) => (
        <button key={m} onClick={(e) => { e.stopPropagation(); onChange(m); }} className="sgc-sans" style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", borderRadius: 999, cursor: "pointer",
          border: `1px solid ${value === m ? COLORS.roseDeep : COLORS.blushDeep}`,
          background: value === m ? COLORS.roseDeep : "#fff", color: value === m ? "#fff" : COLORS.inkSoft,
        }}>{m}</button>
      ))}
    </div>
  );
}

function GuideLink({ Icon, label, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="sgc-sans"
      style={{
        background: "none", border: "none", color: COLORS.roseDeep, fontWeight: 600, fontSize: 12,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0,
      }}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function PhotoUpload({ photo, onPhoto, label }) {
  return (
    <label style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
      borderRadius: 20, border: `1.5px dashed ${COLORS.blushDeep}`, background: COLORS.cream, padding: photo ? 8 : 34, cursor: "pointer", overflow: "hidden",
    }}>
      {photo ? (
        <img src={photo} alt="upload" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 14 }} />
      ) : (
        <><Camera size={26} color={COLORS.rose} /><span className="sgc-sans" style={{ fontSize: 13, color: COLORS.inkSoft, fontWeight: 600 }}>{label}</span></>
      )}
      <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onPhoto(reader.result);
        reader.readAsDataURL(file);
      }} />
    </label>
  );
}

function Screen({ children, maxWidth = 460 }) {
  return <div style={{ maxWidth, margin: "0 auto", padding: "28px 20px 90px" }}>{children}</div>;
}

function Toast({ text, onClose }) {
  const timerRef = useRef(null);
  useEffect(() => { timerRef.current = setTimeout(onClose, 4000); return () => clearTimeout(timerRef.current); }, [text]);
  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", maxWidth: "88%",
      background: "#fff", padding: "12px 20px", borderRadius: 999, boxShadow: "0 10px 30px rgba(185,100,123,0.25)",
      border: `1px solid ${COLORS.blushDeep}`, zIndex: 60, display: "flex", alignItems: "center", gap: 10, textAlign: "center",
    }}>
      <span className="sgc-sans" style={{ fontSize: 13, fontWeight: 600, color: COLORS.roseDeep }}>{text}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, flexShrink: 0 }}><X size={13} /></button>
    </div>
  );
}

function ConfirmDialog({ message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{
      position: "fixed", inset: 0, background: "rgba(58,50,48,0.45)", backdropFilter: "blur(3px)",
      zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 24, maxWidth: 380, width: "100%", padding: "28px 24px",
        boxShadow: "0 20px 60px rgba(185,100,123,0.3)", textAlign: "center",
      }}>
        <div style={{ fontSize: 26, marginBottom: 10 }}>🤍</div>
        <p className="sgc-sans" style={{ fontSize: 14.5, color: COLORS.ink, lineHeight: 1.6, margin: "0 0 20px" }}>{message}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SoftButton onClick={onConfirm} style={{ justifyContent: "center" }}>{confirmLabel}</SoftButton>
          <SoftButton variant="ghost" onClick={onCancel} style={{ justifyContent: "center" }}>{cancelLabel}</SoftButton>
        </div>
      </div>
    </div>
  );
}

/* Guide modal shell — used for both the Lymphatic Flow Guide and the Food Guide */
function GuideModal({ eyebrow, title, onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(58,50,48,0.45)", backdropFilter: "blur(3px)",
        zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 24, maxWidth: 440, width: "100%", maxHeight: "85vh",
          overflowY: "auto", padding: "26px 22px", position: "relative", boxShadow: "0 20px 60px rgba(185,100,123,0.3)",
        }}
      >
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: 16, right: 16, background: COLORS.blush, border: "none", borderRadius: "50%",
          width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.roseDeep,
        }}><X size={14} /></button>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="sgc-serif" style={{ fontSize: 24, color: COLORS.ink, margin: "0 0 16px", paddingRight: 30 }}>{title}</h2>
        {children}
        <SoftButton onClick={onClose} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>Got it, thank you</SoftButton>
      </div>
    </div>
  );
}

function LymphGuideModal({ onClose }) {
  return (
    <GuideModal eyebrow="interactive guide" title="8-Step Lymphatic Flow" onClose={onClose}>
      <p className="sgc-sans" style={{ fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: "0 0 16px" }}>
        Use light pressure with a facial oil or moisturizer. Less is more — gentle sweeping motions work better than firm pressure.
      </p>
      {LYMPHATIC_STEPS.map((s) => (
        <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${COLORS.blush}` }}>
          <div className="sgc-serif" style={{
            width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${COLORS.roseDeep}`, display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 12.5, color: COLORS.roseDeep, flexShrink: 0,
          }}>{s.step}</div>
          <div>
            <div className="sgc-sans" style={{ fontWeight: 600, fontSize: 13.5, color: COLORS.ink }}>{s.title}</div>
            <div className="sgc-sans" style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </GuideModal>
  );
}

function FoodGuideModal({ onClose }) {
  return (
    <GuideModal eyebrow="nutrition guide" title="Foods That Reduce Puffiness" onClose={onClose}>
      <p className="sgc-sans" style={{ fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: "0 0 16px" }}>
        Focus on adding these foods rather than restricting — small, consistent choices add up.
      </p>
      {FOOD_GUIDE.map((group, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div className="sgc-sans" style={{ fontWeight: 700, fontSize: 13, color: COLORS.roseDeep }}>{group.title}</div>
          <div className="sgc-sans" style={{ fontSize: 12, color: COLORS.inkSoft, margin: "2px 0 8px" }}>{group.desc}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {group.items.map((item, j) => (
              <span key={j} className="sgc-sans" style={{
                fontSize: 11.5, fontWeight: 600, color: COLORS.roseDeep, background: COLORS.blush,
                padding: "6px 12px", borderRadius: 999, border: `1px solid ${COLORS.blushDeep}`,
              }}>{item}</span>
            ))}
          </div>
        </div>
      ))}
    </GuideModal>
  );
}

/* ---------------------------------- NAV ---------------------------------- */
function DayDot({ index, complete, active, onClick }) {
  const bg = active ? COLORS.roseDeep : complete ? COLORS.rose : "#fff";
  const color = active || complete ? "#fff" : COLORS.roseDeep;
  return (
    <button onClick={onClick} aria-label={`Day ${index + 1}${complete ? ", complete" : ""}`} className="sgc-sans" style={{
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${active ? COLORS.roseDeep : COLORS.blushDeep}`,
      background: bg, color, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>{complete && !active ? <Check size={14} strokeWidth={3} /> : index + 1}</button>
  );
}

function TopNav({ daysData, finishedDays, screen, selectedDay, onHome, onDay, onDashboard }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(251,246,238,0.92)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${COLORS.blush}`, padding: "10px 16px" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", display: "flex", alignItems: "center", gap: 10, overflowX: "auto" }}>
        <button onClick={onHome} aria-label="Home" style={{
          background: screen === "home" ? COLORS.roseDeep : "#fff", color: screen === "home" ? "#fff" : COLORS.roseDeep,
          border: `1.5px solid ${COLORS.blushDeep}`, borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
        }}><HomeIcon size={15} /></button>
        {daysData.map((d, i) => (
          <DayDot key={i} index={i} onClick={() => onDay(i)} active={screen === "day" && selectedDay === i} complete={finishedDays[i]} />
        ))}
        <button onClick={onDashboard} aria-label="Results" style={{
          background: screen === "dashboard" ? COLORS.roseDeep : "#fff", color: screen === "dashboard" ? "#fff" : COLORS.roseDeep,
          border: `1.5px solid ${COLORS.blushDeep}`, borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
        }}><BarChart3 size={15} /></button>
      </div>
    </div>
  );
}

/* ---------------------------------- ONBOARDING ---------------------------------- */
function Welcome({ onStart, startDate, setStartDate }) {
  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>🎀</div>
        <Eyebrow>soft girl circle</Eyebrow>
        <h1 className="sgc-serif" style={{ fontSize: 44, lineHeight: 1.05, color: COLORS.ink, margin: 0 }}>
          7-Day Puffy Face<br /><span style={{ fontStyle: "italic" }}>Reset</span>
        </h1>
      </div>
      <Card>
        <p className="sgc-sans" style={{ fontSize: 14.5, color: COLORS.ink, lineHeight: 1.7 }}>
          This is your 7-day tracker — a simple daily check-in to help you build the habits that
          support a less puffy, more refreshed face, and see for yourself what's actually helping.
        </p>
        <p className="sgc-sans" style={{ fontSize: 14.5, color: COLORS.ink, lineHeight: 1.7 }}>
          You don't need to be perfect. Consistency matters more than intensity.
        </p>

        <div style={{ background: COLORS.blush, borderRadius: 18, padding: "18px 18px 20px", marginTop: 20 }}>
          <label className="sgc-sans" style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: COLORS.roseDeep, letterSpacing: 0.5, marginBottom: 10 }}>
            CHOOSE YOUR START DATE
          </label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="sgc-sans" style={{
            width: "100%", padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${COLORS.blushDeep}`,
            background: "#fff", fontSize: 14, color: COLORS.ink,
          }} />
        </div>

        <Divider />
        <p className="sgc-serif-italic" style={{ fontSize: 18, color: COLORS.roseDeep, textAlign: "center", lineHeight: 1.5 }}>
          "Take your time. Show up each day.<br />The small habits are what create lasting change."
        </p>
      </Card>
      <div style={{ textAlign: "center" }}>
        <SoftButton onClick={onStart}>Begin my reset <ChevronRight size={16} /></SoftButton>
      </div>
    </Screen>
  );
}

function OnboardPhoto({ onNext, photo, setPhoto }) {
  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <Eyebrow>before you begin</Eyebrow>
        <h2 className="sgc-serif" style={{ fontSize: 32, color: COLORS.ink, margin: 0 }}>Your starting point</h2>
      </div>
      <Card>
        <p className="sgc-sans" style={{ fontSize: 14.5, color: COLORS.ink, lineHeight: 1.7 }}>
          This photo is completely private. No one else can see it. It's simply your starting
          point, so you can look back at the end of the week and compare.
        </p>
        <p className="sgc-sans" style={{ fontSize: 13.5, color: COLORS.inkSoft, fontStyle: "italic", lineHeight: 1.6 }}>
          You can add or change this anytime from your Home screen.
        </p>
        <div style={{ marginTop: 14 }}><PhotoUpload photo={photo} onPhoto={setPhoto} label="Tap to add a photo" /></div>
      </Card>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <SoftButton variant="ghost" onClick={onNext}>Skip for now</SoftButton>
        <SoftButton onClick={onNext}>Continue <ChevronRight size={16} /></SoftButton>
      </div>
    </Screen>
  );
}

/* ---------------------------------- HOME ---------------------------------- */
function Home({ daysData, finishedDays, cycleCount, goDay, goDashboard, goPhotos }) {
  const curr = currentDayIndex(daysData);
  const day = daysData[curr];
  const streak = streakFromStart(daysData);
  const progress = weeklyProgressPct(daysData);
  const focus = FOCUS_DATA[curr];
  const morningCount = Object.values(day.morning).filter(Boolean).length;
  const eveningCount = Object.values(day.evening).filter(Boolean).length + (day.waterGlasses >= WATER_GOAL ? 1 : 0);
  const reflectionDone = reflectionAllDone(day);
  const dayComplete = isDayComplete(day);

  return (
    <Screen>
      <div style={{ marginBottom: 2 }}>
        <span className="sgc-sans" style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 600 }}>Cycle {cycleCount} of {MAX_CYCLES}</span>
      </div>
      <h1 className="sgc-serif" style={{ fontSize: 34, color: COLORS.ink, margin: "0 0 4px" }}>{greetingForNow()} 🎀</h1>
      <p className="sgc-sans" style={{ fontSize: 14, color: COLORS.inkSoft, marginBottom: 18 }}>
        You're on Day {curr + 1} of 7{streak >= 2 ? ` — ${streak}-day streak` : ""}
      </p>

      <Card highlight>
        <Eyebrow>today's focus — day {curr + 1}</Eyebrow>
        <h2 className="sgc-serif" style={{ fontSize: 24, color: COLORS.ink, margin: "0 0 8px" }}>{focus.title}</h2>
        <p className="sgc-sans" style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, margin: "0 0 14px" }}>{focus.why}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <div className="sgc-sans" style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 6, fontWeight: 600 }}>MORNING · {morningCount}/5</div>
            <ProgressBar value={(morningCount / 5) * 100} height={6} />
          </div>
          <div>
            <div className="sgc-sans" style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 6, fontWeight: 600 }}>EVENING · {eveningCount}/4</div>
            <ProgressBar value={(eveningCount / 4) * 100} height={6} />
          </div>
        </div>

        {!reflectionDone && (morningCount > 0 || eveningCount > 0) && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "10px 14px", marginBottom: 14 }}>
            <span className="sgc-sans" style={{ fontSize: 12.5, color: COLORS.roseDeep, fontWeight: 600 }}>
              Today's reflection is still waiting — it takes less than 20 seconds.
            </span>
          </div>
        )}

        <SoftButton onClick={() => goDay(curr)} style={{ width: "100%", justifyContent: "center" }}>
          {dayComplete ? "Review Day " + (curr + 1) : "Continue"} <ChevronRight size={16} />
        </SoftButton>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Eyebrow>your seven days</Eyebrow>
          <span className="sgc-sans" style={{ fontSize: 12, color: COLORS.roseDeep, fontWeight: 700 }}>{progress}%</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {daysData.map((d, i) => (
            <button key={i} onClick={() => goDay(i)} className="sgc-sans" style={{
              flex: "1 0 auto", minWidth: 42, padding: "10px 0", borderRadius: 14, textAlign: "center", cursor: "pointer",
              background: i === curr ? COLORS.roseDeep : finishedDays[i] ? COLORS.blush : COLORS.cream,
              border: `1.5px solid ${i === curr ? COLORS.roseDeep : COLORS.blushDeep}`,
              color: i === curr ? "#fff" : COLORS.ink, fontWeight: 700, fontSize: 13,
            }}>
              {finishedDays[i] ? <Check size={14} strokeWidth={3} style={{ margin: "0 auto" }} /> : i + 1}
            </button>
          ))}
        </div>
        <p className="sgc-sans" style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
          Every day is open — jump ahead, revisit a past day, or do things out of order.
        </p>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <SoftButton variant="ghost" onClick={goDashboard} style={{ flex: 1, justifyContent: "center" }}><BarChart3 size={15} /> Results</SoftButton>
        <SoftButton variant="ghost" onClick={goPhotos} style={{ flex: 1, justifyContent: "center" }}><ImageIcon size={15} /> Photos</SoftButton>
      </div>
    </Screen>
  );
}

/* ---------------------------------- DAY FLOW (multi-step) ---------------------------------- */
function StepIndicator({ current }) {
  const steps = [
    { key: "morning", label: "Morning" },
    { key: "evening", label: "Evening" },
    { key: "reflection", label: "Reflection" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 16 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <span className="sgc-sans" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
            color: s.key === current ? COLORS.roseDeep : COLORS.inkSoft,
            opacity: s.key === current ? 1 : 0.55,
          }}>{s.label}</span>
          {i < steps.length - 1 && <span style={{ width: 14, height: 1, background: COLORS.blushDeep }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function StepHeader({ dayIndex, current, goHome, backLabel, onBack }) {
  return (
    <>
      <button onClick={goHome} className="sgc-sans" style={{ background: "none", border: "none", color: COLORS.roseDeep, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: 0, marginBottom: 10 }}>
        <ChevronLeft size={15} /> Home
      </button>
      {onBack && (
        <button onClick={onBack} className="sgc-sans" style={{ background: "none", border: "none", color: COLORS.inkSoft, fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: 0, marginBottom: 12 }}>
          <ChevronLeft size={13} /> {backLabel}
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div className="sgc-serif" style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${COLORS.roseDeep}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: COLORS.roseDeep, flexShrink: 0 }}>
          {dayIndex + 1}
        </div>
        <Eyebrow>day {dayIndex + 1} of 7</Eyebrow>
      </div>
      <StepIndicator current={current} />
    </>
  );
}

function MorningPage({ dayIndex, day, setters, goHome, reminderDismissed, onDismissReminder, onContinue }) {
  const focus = FOCUS_DATA[dayIndex];
  const morningComplete = allTrue(day.morning);
  const [showReminder, setShowReminder] = useState(false);
  const [showLymph, setShowLymph] = useState(false);
  const [showFood, setShowFood] = useState(false);

  const handleContinue = () => {
    if (!morningComplete && !reminderDismissed) setShowReminder(true);
    else onContinue();
  };

  return (
    <>
      <Screen>
        <StepHeader dayIndex={dayIndex} current="morning" goHome={goHome} />
        <Card>
          <Eyebrow>today's focus</Eyebrow>
          <h1 className="sgc-serif" style={{ fontSize: 26, color: COLORS.ink, margin: "0 0 8px" }}>{focus.title}</h1>
          <p className="sgc-sans" style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>{focus.why}</p>
        </Card>

        {MORNING_HABITS.map((h) => {
          let extra = null;
          if (h.key === "cold") extra = <ColdMethodPicker value={day.coldChoice} onChange={(m) => setters.setColdChoice(dayIndex, m)} />;
          if (h.key === "massage") extra = <GuideLink Icon={Sparkles} label="View lymphatic guide" onClick={() => setShowLymph(true)} />;
          if (h.key === "breakfast") extra = <GuideLink Icon={Utensils} label="View food ideas" onClick={() => setShowFood(true)} />;
          return (
            <HabitRow
              key={h.key}
              title={h.title}
              why={h.key === "cold" ? COLD_METHODS[day.coldChoice] : getVariant(h.key, dayIndex)}
              Icon={h.Icon}
              done={day.morning[h.key]}
              onToggle={() => setters.toggleMorning(dayIndex, h.key)}
              extra={extra}
            />
          );
        })}

        <SoftButton onClick={handleContinue} style={{ width: "100%", justifyContent: "center", marginTop: 12, padding: "16px 26px", fontSize: 15 }}>
          Continue <ChevronRight size={17} />
        </SoftButton>
      </Screen>

      {showReminder && (
        <ConfirmDialog
          message="Would you like to complete a few habits before moving on? Every small step counts."
          confirmLabel="Continue anyway"
          cancelLabel="Stay here"
          onConfirm={() => { setShowReminder(false); onDismissReminder(); onContinue(); }}
          onCancel={() => setShowReminder(false)}
        />
      )}
      {showLymph && <LymphGuideModal onClose={() => setShowLymph(false)} />}
      {showFood && <FoodGuideModal onClose={() => setShowFood(false)} />}
    </>
  );
}

function EveningPage({ dayIndex, day, setters, goHome, onBack, reminderDismissed, onDismissReminder, onContinue }) {
  const eveningComplete = eveningAllDone(day);
  const [showReminder, setShowReminder] = useState(false);

  const handleContinue = () => {
    if (!eveningComplete && !reminderDismissed) setShowReminder(true);
    else onContinue();
  };

  return (
    <>
      <Screen>
        <StepHeader dayIndex={dayIndex} current="evening" goHome={goHome} backLabel="Back to Morning Reset" onBack={onBack} />
        <h1 className="sgc-serif" style={{ fontSize: 28, color: COLORS.ink, margin: "0 0 20px" }}>Evening Reset</h1>

        <Card soft>
          <span className="sgc-sans" style={{ fontSize: 12, fontWeight: 700, color: COLORS.roseDeep }}>TODAY'S WATER TOTAL · GOAL {WATER_GOAL} GLASSES</span>
          <div style={{ marginTop: 10 }}><WaterTracker value={day.waterGlasses} onChange={(v) => setters.setWater(dayIndex, v)} /></div>
          <p className="sgc-sans" style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 8 }}>Tally up everything you drank today — morning included.</p>
        </Card>

        {EVENING_HABITS.map((h) => (
          <HabitRow key={h.key} title={h.title} why={getVariant(h.key, dayIndex)} done={day.evening[h.key]} onToggle={() => setters.toggleEvening(dayIndex, h.key)} />
        ))}

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="sgc-sans" style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.roseDeep }}>PLAN SLEEP DURATION</label>
            <span className="sgc-sans" style={{ fontSize: 12, fontWeight: 700, color: COLORS.roseDeep }}>{day.sleepHours || 7} hrs</span>
          </div>
          <input
            type="range" min="5" max="11" step="0.5"
            value={day.sleepHours || 7}
            onChange={(e) => setters.setField(dayIndex, "sleepHours", e.target.value)}
            aria-label="Plan sleep duration in hours"
            style={{ width: "100%", marginTop: 10, accentColor: COLORS.roseDeep }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="sgc-sans" style={{ fontSize: 10.5, color: COLORS.inkSoft }}>5 hrs</span>
            <span className="sgc-sans" style={{ fontSize: 10.5, color: COLORS.roseDeep, fontWeight: 600 }}>Goal: 7–9 hrs</span>
            <span className="sgc-sans" style={{ fontSize: 10.5, color: COLORS.inkSoft }}>11 hrs</span>
          </div>
        </Card>

        <SoftButton onClick={handleContinue} style={{ width: "100%", justifyContent: "center", marginTop: 4, padding: "16px 26px", fontSize: 15 }}>
          Continue to Reflection <ChevronRight size={17} />
        </SoftButton>
      </Screen>

      {showReminder && (
        <ConfirmDialog
          message="Would you like to complete a few habits before moving on? Every small step counts."
          confirmLabel="Continue anyway"
          cancelLabel="Stay here"
          onConfirm={() => { setShowReminder(false); onDismissReminder(); onContinue(); }}
          onCancel={() => setShowReminder(false)}
        />
      )}
    </>
  );
}

function ReflectionPage({ dayIndex, day, setters, goHome, onBack, reminderDismissed, onDismissReminder, onContinue }) {
  const question = REFLECTION_PROMPTS[dayIndex];
  const isLastDay = dayIndex === 6;
  const complete = reflectionAllDone(day);
  const [showReminder, setShowReminder] = useState(false);

  const handleContinue = () => {
    if (!complete && !reminderDismissed) setShowReminder(true);
    else onContinue();
  };

  return (
    <>
      <Screen>
        <StepHeader dayIndex={dayIndex} current="reflection" goHome={goHome} backLabel="Back to Evening Reset" onBack={onBack} />
        <h1 className="sgc-serif" style={{ fontSize: 28, color: COLORS.ink, margin: "0 0 20px" }}>A quiet moment</h1>

        <Card>
          <span className="sgc-sans" style={{ fontSize: 12, fontWeight: 700, color: COLORS.roseDeep }}>MORNING PUFFINESS</span>
          <div style={{ marginTop: 8, marginBottom: 18 }}><PuffinessScale value={day.puffMorning} onChange={(v) => setters.setField(dayIndex, "puffMorning", v)} labelPrefix="Morning puffiness" /></div>
          <span className="sgc-sans" style={{ fontSize: 12, fontWeight: 700, color: COLORS.roseDeep }}>NIGHT PUFFINESS</span>
          <div style={{ marginTop: 8, marginBottom: 18 }}><PuffinessScale value={day.puffNight} onChange={(v) => setters.setField(dayIndex, "puffNight", v)} labelPrefix="Night puffiness" /></div>
          <Divider />
          <label className="sgc-sans" style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>{question}</label>
          <textarea value={day.reflection} onChange={(e) => setters.setField(dayIndex, "reflection", e.target.value)} maxLength={140} rows={2}
            placeholder="A sentence is plenty..." className="sgc-sans" style={{
              width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${COLORS.blushDeep}`, background: COLORS.cream, fontSize: 14, resize: "none",
            }} />
        </Card>

        <SoftButton onClick={handleContinue} style={{ width: "100%", justifyContent: "center", padding: "16px 26px", fontSize: 15 }}>
          {isLastDay ? "Complete My Week" : "Continue"} <ChevronRight size={17} />
        </SoftButton>
      </Screen>

      {showReminder && (
        <ConfirmDialog
          message="Would you like to finish your reflection before moving on? Every small step counts."
          confirmLabel="Continue anyway"
          cancelLabel="Stay here"
          onConfirm={() => { setShowReminder(false); onDismissReminder(); onContinue(); }}
          onCancel={() => setShowReminder(false)}
        />
      )}
    </>
  );
}

// Tap anywhere on the screen to move on, not just the button — reading the message is optional, not a gate.
function TransitionScreen({ type, dayIndex, onContinue }) {
  const lines = getTransitionLines(type, dayIndex);
  const emoji = type === "morning" ? "☀️" : "🌙";
  const buttonLabel = type === "morning" ? "Continue to Evening Reset" : "Continue to Reflection";
  const isShort = lines.length === 1;
  return (
    <div onClick={onContinue} style={{ cursor: "pointer" }}>
      <Screen>
        <Card style={{ textAlign: "center", padding: isShort ? "40px 26px" : "56px 26px" }}>
          <div style={{ fontSize: isShort ? 34 : 44, marginBottom: isShort ? 10 : 16 }}>{emoji}</div>
          {isShort ? (
            <p className="sgc-serif" style={{ fontSize: 21, color: COLORS.ink, lineHeight: 1.5, margin: 0 }}>{lines[0]}</p>
          ) : (
            lines.map((line, i) => (
              <p key={i} className={i === 0 ? "sgc-serif" : "sgc-sans"} style={{
                fontSize: i === 0 ? 24 : 14.5, color: i === 0 ? COLORS.ink : COLORS.inkSoft,
                lineHeight: 1.6, margin: i === 0 ? "0 0 14px" : "0 0 6px",
              }}>{line}</p>
            ))
          )}
        </Card>
        <div style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <SoftButton onClick={onContinue}>{buttonLabel} <ChevronRight size={16} /></SoftButton>
        </div>
      </Screen>
    </div>
  );
}

function DayCompleteCelebration({ dayIndex, daysData, finishedDays, goDay }) {
  const completedCount = finishedDays.filter(Boolean).length;
  // A soft, early look at "what seems to help" from Day 4 onward — a taste of the payoff before Day 7.
  const showMidweekInsight = dayIndex >= 3;
  const insight = showMidweekInsight ? puffinessInsight(daysData) : null;

  return (
    <Screen>
      <Card style={{ textAlign: "center", padding: "48px 26px" }}>
        <div style={{ fontSize: 38, marginBottom: 10 }}>🎀</div>
        <h1 className="sgc-serif" style={{ fontSize: 28, color: COLORS.ink, margin: "0 0 10px" }}>Day {dayIndex + 1} Complete</h1>
        <p className="sgc-sans" style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.7, margin: "0 0 22px" }}>
          Beautiful work. Every small habit you repeated today is another investment in feeling your best.
        </p>
        <div style={{ marginBottom: 8 }}>
          <ProgressBar value={(completedCount / 7) * 100} />
        </div>
        <p className="sgc-sans" style={{ fontSize: 12.5, color: COLORS.roseDeep, fontWeight: 700 }}>{completedCount}/7 days complete</p>
      </Card>

      {showMidweekInsight && (
        <Card soft>
          <Eyebrow>a little sneak peek</Eyebrow>
          {insight && Math.abs(insight.gap) >= 0.4 ? (
            <p className="sgc-sans" style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, margin: 0 }}>
              Your morning puffiness looks a little different on days you did <strong>{HABIT_LABELS[insight.key]}</strong> —
              full results reveal on Day 7.
            </p>
          ) : (
            <p className="sgc-sans" style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>
              Your personal insights are quietly building — the full picture comes together by Day 7.
            </p>
          )}
        </Card>
      )}

      <div style={{ textAlign: "center" }}>
        <SoftButton onClick={() => goDay(dayIndex + 1)}>Continue to Day {dayIndex + 2} <ChevronRight size={16} /></SoftButton>
      </div>
    </Screen>
  );
}

function DayFlow({ dayIndex, day, daysData, stepByDay, finishedDays, onMarkFinished, dismissedReminders, onDismissReminder, setters, goHome, goDay, goCelebration, initialStep, onStepChange }) {
  const computeDefault = () => {
    if (!allTrue(day.morning)) return "morning";
    if (!eveningAllDone(day)) return "evening";
    return "reflection";
  };
  const [step, setStep] = useState(initialStep || computeDefault());

  useEffect(() => { onStepChange(dayIndex, step); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDismissed = (section) => dismissedReminders.includes(`${dayIndex}-${section}`);

  if (step === "morning") {
    return (
      <MorningPage
        dayIndex={dayIndex} day={day} setters={setters} goHome={goHome}
        reminderDismissed={isDismissed("morning")}
        onDismissReminder={() => onDismissReminder(dayIndex, "morning")}
        onContinue={() => setStep("morningComplete")}
      />
    );
  }
  if (step === "morningComplete") {
    return <TransitionScreen type="morning" dayIndex={dayIndex} onContinue={() => setStep("evening")} />;
  }
  if (step === "evening") {
    return (
      <EveningPage
        dayIndex={dayIndex} day={day} setters={setters} goHome={goHome} onBack={() => setStep("morning")}
        reminderDismissed={isDismissed("evening")}
        onDismissReminder={() => onDismissReminder(dayIndex, "evening")}
        onContinue={() => setStep("eveningComplete")}
      />
    );
  }
  if (step === "eveningComplete") {
    return <TransitionScreen type="evening" dayIndex={dayIndex} onContinue={() => setStep("reflection")} />;
  }
  if (step === "reflection") {
    return (
      <ReflectionPage
        dayIndex={dayIndex} day={day} setters={setters} goHome={goHome}
        onBack={() => setStep("evening")}
        reminderDismissed={isDismissed("reflection")}
        onDismissReminder={() => onDismissReminder(dayIndex, "reflection")}
        onContinue={() => { onMarkFinished(dayIndex); if (dayIndex === 6) goCelebration(); else setStep("dayDone"); }}
      />
    );
  }
  if (step === "dayDone") {
    return <DayCompleteCelebration dayIndex={dayIndex} daysData={daysData} finishedDays={finishedDays} goDay={goDay} />;
  }
  return null;
}

/* ---------------------------------- PHOTOS ---------------------------------- */
function PhotosPage({ day1Photo, setDay1Photo, finalPhoto, setFinalPhoto, goHome }) {
  return (
    <Screen>
      <button onClick={goHome} className="sgc-sans" style={{ background: "none", border: "none", color: COLORS.roseDeep, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: 0, marginBottom: 14 }}>
        <ChevronLeft size={15} /> Home
      </button>
      <Eyebrow>compare photos</Eyebrow>
      <h1 className="sgc-serif" style={{ fontSize: 30, color: COLORS.ink, margin: "0 0 14px" }}>Your progress, side by side</h1>
      <Card>
        <p className="sgc-sans" style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 14 }}>
          These photos are completely private and only visible to you. Add or update them anytime.
        </p>
        <label className="sgc-sans" style={{ fontSize: 12, fontWeight: 700, color: COLORS.roseDeep }}>DAY 1</label>
        <div style={{ marginTop: 8, marginBottom: 18 }}><PhotoUpload photo={day1Photo} onPhoto={setDay1Photo} label="Tap to add your starting photo" /></div>
        <label className="sgc-sans" style={{ fontSize: 12, fontWeight: 700, color: COLORS.roseDeep }}>DAY 7</label>
        <div style={{ marginTop: 8 }}><PhotoUpload photo={finalPhoto} onPhoto={setFinalPhoto} label="Tap to add your Day 7 photo" /></div>
      </Card>
    </Screen>
  );
}

/* ---------------------------------- DASHBOARD ---------------------------------- */
function Dashboard({ daysData, day1Photo, finalPhoto, setFinalPhoto, goHome, goCelebration }) {
  const touchedDays = daysData.filter(isDayTouched);
  const daysVisited = touchedDays.length;
  const completedCount = daysData.filter(isDayComplete).length;
  const allDone = completedCount === 7;
  const progress = weeklyProgressPct(daysData);

  const base = touchedDays.length ? touchedDays : daysData;
  const avgWater = (base.reduce((s, d) => s + d.waterGlasses, 0) / base.length).toFixed(1);
  const sleepVals = base.map((d) => Number(d.sleepHours)).filter((n) => n > 0);
  const avgSleep = sleepVals.length ? (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1) : "—";

  const consistency = HABIT_KEYS.map((key) => {
    const done = daysData.filter((d) => habitDone(d, key)).length;
    return { key, label: HABIT_LABELS[key], pct: Math.round((done / daysData.length) * 100) };
  });
  const mostConsistent = consistency.reduce((a, b) => (b.pct > a.pct ? b : a), consistency[0]);
  const trend = daysData.map((d, i) => ({ day: `D${i + 1}`, Morning: d.puffMorning || null, Night: d.puffNight || null }));
  const insight = puffinessInsight(daysData);

  const badgeDefs = [
    { title: "Consistency Queen", icon: "👑", unlocked: completedCount >= 5, desc: "Completed 5+ reset days" },
    { title: "Hydration Hero", icon: "💧", unlocked: Number(avgWater) >= 7, desc: "Averaged 7+ water glasses" },
    { title: "Sleep Champion", icon: "🌙", unlocked: avgSleep !== "—" && Number(avgSleep) >= 7.5, desc: "Averaged 7.5+ sleep hours" },
    { title: "Drainage Guru", icon: "🌸", unlocked: true, desc: "Practiced facial flow routines" },
    { title: "Reset Complete", icon: "🎀", unlocked: completedCount === 7, desc: "Finished the full 7-day reset" },
    { title: "Self-Care Star", icon: "✨", unlocked: true, desc: "Showed up with soft dedication" },
  ];

  return (
    <Screen>
      <button onClick={goHome} className="sgc-sans" style={{ background: "none", border: "none", color: COLORS.roseDeep, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: 0, marginBottom: 14 }}>
        <ChevronLeft size={15} /> Home
      </button>

      <div style={{ marginBottom: 4 }}>
        <Eyebrow>{allDone ? "your week, in review" : "progress so far"}</Eyebrow>
        <h1 className="sgc-serif" style={{ fontSize: 30, color: COLORS.ink, margin: 0 }}>{allDone ? "Weekly Results" : `${progress}% Complete`}</h1>
        <p className="sgc-sans" style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6 }}>
          Days visited: {daysVisited}/7 · Days fully completed: {completedCount}/7
        </p>
      </div>

      <Card style={{ marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Habits completed", value: progress + "%" },
            { label: "Avg. water intake", value: avgWater + " glasses" },
            { label: "Avg. sleep", value: avgSleep + " hrs" },
            { label: "Most consistent", value: mostConsistent?.label || "—" },
          ].map((s) => (
            <div key={s.label} style={{ background: COLORS.blush, borderRadius: 16, padding: "14px 12px" }}>
              <div className="sgc-serif" style={{ fontSize: 22, color: COLORS.roseDeep }}>{s.value}</div>
              <div className="sgc-sans" style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card highlight>
        <Eyebrow>what seems to help you</Eyebrow>
        {insight && Math.abs(insight.gap) >= 0.4 ? (
          <p className="sgc-sans" style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.65, margin: 0 }}>
            Your morning puffiness averaged <strong style={{ color: COLORS.roseDeep }}>{insight.avgWith.toFixed(1)}/5</strong> on
            days you did <strong>{HABIT_LABELS[insight.key]}</strong>, vs <strong style={{ color: COLORS.roseDeep }}>{insight.avgWithout.toFixed(1)}/5</strong> on
            days you didn't. {insight.gap > 0 ? "That habit is doing real work for you." : "Worth watching this one a little more closely."}
          </p>
        ) : (
          <p className="sgc-sans" style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>
            Keep logging your puffiness and habits each day — this card will show you which habit is actually moving the needle for you.
          </p>
        )}
      </Card>

      <Card>
        <Eyebrow>puffiness trend</Eyebrow>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.blush} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${COLORS.blushDeep}`, fontFamily: "Montserrat" }} />
              <Line type="monotone" dataKey="Morning" stroke={COLORS.roseDeep} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Night" stroke={COLORS.rose} strokeWidth={2.5} strokeDasharray="4 3" dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <Eyebrow>visual comparison</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          <div>
            {day1Photo ? <img src={day1Photo} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 14 }} /> : <div style={{ height: 150, borderRadius: 14, background: COLORS.cream, border: `1.5px dashed ${COLORS.blushDeep}` }} />}
            <div className="sgc-sans" style={{ fontSize: 11, color: COLORS.inkSoft, textAlign: "center", marginTop: 6 }}>Day 1</div>
          </div>
          <div>
            {finalPhoto ? (
              <img src={finalPhoto} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 14 }} />
            ) : (
              <div style={{ height: 150 }}><PhotoUpload photo={null} onPhoto={setFinalPhoto} label="Add Day 7 photo" /></div>
            )}
            <div className="sgc-sans" style={{ fontSize: 11, color: COLORS.inkSoft, textAlign: "center", marginTop: 6 }}>Day 7</div>
          </div>
        </div>
      </Card>

      <Card>
        <Eyebrow>achievement badges</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
          {badgeDefs.map((b, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "12px 8px", borderRadius: 16,
              background: b.unlocked ? COLORS.blush : COLORS.cream,
              border: `1px solid ${b.unlocked ? COLORS.blushDeep : "transparent"}`,
              opacity: b.unlocked ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{b.icon}</div>
              <div className="sgc-sans" style={{ fontSize: 11, fontWeight: 700, color: COLORS.ink, lineHeight: 1.2 }}>{b.title}</div>
              <div className="sgc-sans" style={{ fontSize: 9.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.2 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Both options are always available here — reviewing results doesn't require finishing the whole week. */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <SoftButton variant="ghost" onClick={goHome}>Back to my reset</SoftButton>
        <SoftButton onClick={goCelebration}>Continue to celebration <ChevronRight size={16} /></SoftButton>
      </div>
    </Screen>
  );
}

/* ---------------------------------- CELEBRATION / CONTINUE ---------------------------------- */
function WeeklyCelebration({ daysData, onContinue }) {
  const touchedDays = daysData.filter(isDayTouched);
  const base = touchedDays.length ? touchedDays : daysData;
  const avgWater = (base.reduce((s, d) => s + d.waterGlasses, 0) / base.length).toFixed(1);
  const sleepVals = base.map((d) => Number(d.sleepHours)).filter((n) => n > 0);
  const avgSleep = sleepVals.length ? (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1) : "—";

  return (
    <Screen>
      <Card style={{ textAlign: "center", padding: "44px 26px" }}>
        <div style={{ fontSize: 38, marginBottom: 8 }}>🎀</div>
        <Eyebrow>reset complete</Eyebrow>
        <h1 className="sgc-serif" style={{ fontSize: 30, color: COLORS.ink, margin: "0 0 14px" }}>You showed up for yourself.</h1>
        <p className="sgc-sans" style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.75 }}>
          You spent seven days building simple, supportive habits. The goal was never
          perfection — it was creating a ritual of self-care that helps you feel your best.
        </p>
      </Card>

      <Card soft>
        <div className="sgc-sans" style={{ fontWeight: 700, fontSize: 13, color: COLORS.roseDeep, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Heart size={14} color={COLORS.roseDeep} fill={COLORS.roseDeep} /> Your wins this week
        </div>
        <div className="sgc-sans" style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 2 }}>
          <div>✓ Practiced your cold, drain, hydrate method daily</div>
          <div>✓ Drank an average of {avgWater} glasses of water</div>
          <div>✓ Averaged {avgSleep} hours of restorative sleep</div>
        </div>
      </Card>

      <p className="sgc-serif-italic" style={{ fontSize: 17, color: COLORS.roseDeep, textAlign: "center", lineHeight: 1.5 }}>
        "Softness begins with self-care. Keep going — your future self will thank you."
      </p>

      <p className="sgc-sans" style={{ fontSize: 12.5, color: COLORS.inkSoft, textAlign: "center", marginTop: 14 }}>
        With love, Soft Girl Circle 🎀
      </p>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <SoftButton onClick={onContinue}>Continue <ChevronRight size={16} /></SoftButton>
      </div>
    </Screen>
  );
}

function ContinueJourney({ cycleCount, canRestart, onNewCycle, onHome }) {
  return (
    <Screen>
      {canRestart ? (
        <>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 30 }}>🤍</div>
            <Eyebrow>this isn't the end</Eyebrow>
            <h1 className="sgc-serif" style={{ fontSize: 32, color: COLORS.ink, margin: 0 }}>You've completed Cycle {cycleCount}</h1>
          </div>
          <Card>
            <p className="sgc-sans" style={{ fontSize: 14.5, color: COLORS.ink, lineHeight: 1.75 }}>
              Facial puffiness is a normal part of life, and it can look different from day to day.
              If this week felt messy, or you just want to keep building on what's working, you can
              run through the reset one more time.
            </p>
          </Card>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <SoftButton variant="ghost" onClick={onHome}>Back to Home</SoftButton>
            <SoftButton onClick={onNewCycle}>Start Cycle {cycleCount + 1} <ChevronRight size={16} /></SoftButton>
          </div>
        </>
      ) : (
        <>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 30 }}>🎀</div>
            <Eyebrow>both cycles complete</Eyebrow>
            <h1 className="sgc-serif" style={{ fontSize: 32, color: COLORS.ink, margin: 0 }}>You've finished your reset.</h1>
          </div>
          <Card>
            <p className="sgc-sans" style={{ fontSize: 14.5, color: COLORS.ink, lineHeight: 1.75 }}>
              Two full weeks of showing up for yourself — that's the whole reset, complete. Take what
              you've learned about your own habits and carry it forward, at your own pace.
            </p>
            <p className="sgc-sans" style={{ fontSize: 14.5, color: COLORS.ink, lineHeight: 1.75 }}>
              If this was helpful, a review would genuinely mean a lot to Soft Girl Circle — it helps
              other people find their own reset too.
            </p>
          </Card>
          <div style={{ textAlign: "center" }}>
            {/* TODO: replace href with the real review link once available */}
            <SoftButton onClick={() => {}}>Leave a review 🎀</SoftButton>
          </div>
        </>
      )}
    </Screen>
  );
}

/* ---------------------------------- APP ROOT ---------------------------------- */
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("welcome"); // welcome | onboardPhoto | home | day | photos | dashboard | weeklyCelebration | continue
  const [startDate, setStartDate] = useState("");
  const [day1Photo, setDay1Photo] = useState(null);
  const [finalPhoto, setFinalPhoto] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [daysData, setDaysData] = useState(Array.from({ length: 7 }, emptyDay));
  const [stepByDay, setStepByDay] = useState(Array(7).fill(null));
  const [finishedDays, setFinishedDays] = useState(Array(7).fill(false));
  const [dismissedReminders, setDismissedReminders] = useState([]);
  const [cycleCount, setCycleCount] = useState(1);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [toast, setToast] = useState(null);

  // Load any saved progress once, on first mount.
  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.get(STORAGE_KEY);
        if (saved && saved.value) {
          const parsed = JSON.parse(saved.value);
          if (Array.isArray(parsed.daysData) && parsed.daysData.length === 7) setDaysData(parsed.daysData);
          if (parsed.cycleCount) setCycleCount(parsed.cycleCount);
          if (Array.isArray(parsed.unlockedBadges)) setUnlockedBadges(parsed.unlockedBadges);
          if (parsed.startDate) setStartDate(parsed.startDate);
          if (typeof parsed.selectedDay === "number") setSelectedDay(parsed.selectedDay);
          if (Array.isArray(parsed.stepByDay) && parsed.stepByDay.length === 7) setStepByDay(parsed.stepByDay);
          if (Array.isArray(parsed.finishedDays) && parsed.finishedDays.length === 7) setFinishedDays(parsed.finishedDays);
          if (Array.isArray(parsed.dismissedReminders)) setDismissedReminders(parsed.dismissedReminders);
          const hasProgress = (parsed.daysData || []).some(isDayTouched) || (parsed.cycleCount || 1) > 1;
          if (hasProgress) setScreen("home");
        }
      } catch (err) {
        // No saved state yet — fresh start, nothing to do.
      }
      try {
        const p1 = await storage.get(PHOTO1_KEY);
        if (p1 && p1.value) setDay1Photo(p1.value);
      } catch (err) { /* no saved photo yet */ }
      try {
        const p7 = await storage.get(PHOTO7_KEY);
        if (p7 && p7.value) setFinalPhoto(p7.value);
      } catch (err) { /* no saved photo yet */ }
      setLoaded(true);
    })();
  }, []);

  // Persist core progress whenever it changes.
  useEffect(() => {
    if (!loaded) return;
    const payload = JSON.stringify({ daysData, cycleCount, unlockedBadges, startDate, selectedDay, stepByDay, finishedDays, dismissedReminders });
    storage.set(STORAGE_KEY, payload).catch(() => {});
  }, [daysData, cycleCount, unlockedBadges, startDate, selectedDay, stepByDay, finishedDays, dismissedReminders, loaded]);

  useEffect(() => {
    if (!loaded || !day1Photo) return;
    storage.set(PHOTO1_KEY, day1Photo).catch(() => {});
  }, [day1Photo, loaded]);

  useEffect(() => {
    if (!loaded || !finalPhoto) return;
    storage.set(PHOTO7_KEY, finalPhoto).catch(() => {});
  }, [finalPhoto, loaded]);

  useEffect(() => {
    const current = badgesForDays(daysData);
    const added = current.filter((b) => !unlockedBadges.includes(b));
    if (added.length) {
      setUnlockedBadges((prev) => [...new Set([...prev, ...current])]);
      setToast(added[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysData]);

  // Only the water-goal and badge toasts remain — every other "you finished this section" moment is now
  // covered by its own dedicated transition or celebration screen, so a duplicate toast isn't needed.
  const setWater = (dayIdx, val) => {
    const day = daysData[dayIdx];
    const newDay = { ...day, waterGlasses: val };
    const next = [...daysData]; next[dayIdx] = newDay;
    setDaysData(next);
    if (val >= WATER_GOAL && day.waterGlasses < WATER_GOAL) setToast("Water goal reached for today.");
  };

  const toggleMorning = (dayIdx, key) => {
    const day = daysData[dayIdx];
    const newMorning = { ...day.morning, [key]: !day.morning[key] };
    const newDay = { ...day, morning: newMorning };
    const next = [...daysData]; next[dayIdx] = newDay;
    setDaysData(next);
  };

  const toggleEvening = (dayIdx, key) => {
    const day = daysData[dayIdx];
    const newEvening = { ...day.evening, [key]: !day.evening[key] };
    const newDay = { ...day, evening: newEvening };
    const next = [...daysData]; next[dayIdx] = newDay;
    setDaysData(next);
  };

  const setColdChoice = (dayIdx, method) => {
    const day = daysData[dayIdx];
    const newDay = { ...day, coldChoice: method };
    const next = [...daysData]; next[dayIdx] = newDay;
    setDaysData(next);
  };

  const setField = (dayIdx, field, val) => {
    const day = daysData[dayIdx];
    const newDay = { ...day, [field]: val };
    const next = [...daysData]; next[dayIdx] = newDay;
    setDaysData(next);
  };

  const setters = { toggleMorning, toggleEvening, setWater, setColdChoice, setField };

  const goHome = () => setScreen("home");
  const goDay = (idxOrDashboard) => {
    if (idxOrDashboard === "dashboard") return setScreen("dashboard");
    setSelectedDay(idxOrDashboard);
    setScreen("day");
  };
  const goDashboard = () => setScreen("dashboard");
  const goPhotos = () => setScreen("photos");
  const goCelebration = () => setScreen("weeklyCelebration");

  const onStepChange = (dayIdx, step) => {
    setStepByDay((prev) => {
      if (prev[dayIdx] === step) return prev;
      const next = [...prev]; next[dayIdx] = step; return next;
    });
  };

  const onDismissReminder = (dayIdx, section) => {
    const key = `${dayIdx}-${section}`;
    setDismissedReminders((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const markDayFinished = (dayIdx) => {
    setFinishedDays((prev) => {
      if (prev[dayIdx]) return prev;
      const next = [...prev]; next[dayIdx] = true; return next;
    });
  };

  const startNewCycle = () => {
    if (cycleCount >= MAX_CYCLES) return;
    setCycleCount((c) => c + 1);
    setDaysData(Array.from({ length: 7 }, emptyDay));
    setStepByDay(Array(7).fill(null));
    setFinishedDays(Array(7).fill(false));
    setDismissedReminders([]);
    setUnlockedBadges([]);
    setScreen("home");
  };

  const showTopNav = ["day", "dashboard", "photos"].includes(screen);

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONT_STYLE}</style>
        <span className="sgc-serif-italic" style={{ fontSize: 18, color: COLORS.roseDeep }}>Loading your reset…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, fontFamily: "Montserrat, sans-serif" }}>
      <style>{FONT_STYLE}</style>
      {toast && <Toast text={toast} onClose={() => setToast(null)} />}
      {showTopNav && (
        <TopNav daysData={daysData} finishedDays={finishedDays} screen={screen} selectedDay={selectedDay} onHome={goHome} onDay={(i) => goDay(i)} onDashboard={goDashboard} />
      )}

      {screen === "welcome" && <Welcome onStart={() => setScreen("onboardPhoto")} startDate={startDate} setStartDate={setStartDate} />}

      {screen === "onboardPhoto" && <OnboardPhoto photo={day1Photo} setPhoto={setDay1Photo} onNext={() => setScreen("home")} />}

      {screen === "home" && <Home daysData={daysData} finishedDays={finishedDays} cycleCount={cycleCount} goDay={goDay} goDashboard={goDashboard} goPhotos={goPhotos} />}

      {screen === "day" && (
        <DayFlow
          key={selectedDay}
          dayIndex={selectedDay}
          day={daysData[selectedDay]}
          daysData={daysData}
          stepByDay={stepByDay}
          finishedDays={finishedDays}
          onMarkFinished={markDayFinished}
          dismissedReminders={dismissedReminders}
          onDismissReminder={onDismissReminder}
          setters={setters}
          goHome={goHome}
          goDay={goDay}
          goCelebration={goCelebration}
          initialStep={stepByDay[selectedDay]}
          onStepChange={onStepChange}
        />
      )}

      {screen === "photos" && <PhotosPage day1Photo={day1Photo} setDay1Photo={setDay1Photo} finalPhoto={finalPhoto} setFinalPhoto={setFinalPhoto} goHome={goHome} />}

      {screen === "dashboard" && (
        <Dashboard daysData={daysData} day1Photo={day1Photo} finalPhoto={finalPhoto} setFinalPhoto={setFinalPhoto} goHome={goHome} goCelebration={goCelebration} />
      )}

      {screen === "weeklyCelebration" && <WeeklyCelebration daysData={daysData} onContinue={() => setScreen("continue")} />}

      {screen === "continue" && (
        <ContinueJourney cycleCount={cycleCount} canRestart={cycleCount < MAX_CYCLES} onNewCycle={startNewCycle} onHome={goHome} />
      )}
    </div>
  );
}
