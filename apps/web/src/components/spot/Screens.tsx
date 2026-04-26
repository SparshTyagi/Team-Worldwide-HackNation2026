import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Phone, StatusBar } from "@/components/spot/Phone";
import { SpotLogo, MapStylized, HandPin, QrCode } from "@/components/spot/Visuals";
import cafeImg from "@/assets/cafe-tony.jpg";
import bakeryImg from "@/assets/bakery.jpg";
import ramenImg from "@/assets/ramen.jpg";
import baristaImg from "@/assets/barista.jpg";
import {
  CloudRain,
  MapPin,
  Coffee,
  UtensilsCrossed,
  Pizza,
  Salad,
  Wine,
  IceCream,
  Shield,
  Smartphone,
  Cloud,
  Bell,
  Camera,
  ChevronRight,
  Clock,
  Footprints,
  X,
  Check,
  Sparkles,
  TrendingUp,
  Lock,
  Globe,
  Link2,
  ScanLine,
  ChevronLeft,
  Sun,
  Moon,
  Wheat,
  Leaf,
  Flame,
  Accessibility,
  Eye,
  ShoppingBag,
  Store,
  Mic,
  Trash2,
  Bell as BellIcon,
  Users,
  Euro,
  Activity,
  ArrowUpRight,
  Plus,
} from "lucide-react";

type SpotOffer = {
  offer_id: string;
  headline: string;
  body_line: string;
  cta_text: string;
  discount_type: string;
  discount_value: number;
  valid_for_minutes: number;
  tone_style: string;
  ui_layout_variant: string;
  expires_at_utc: string;
};

type SpotSavings = {
  latestSavedEur: number;
  todaySavedEur: number;
  monthSavedEur: number;
  spotsTried: number;
};

type SpotMerchantVoiceIdentity = {
  brandStory: string;
  menuHighlights: string;
  promotions: string;
  voiceName: string;
  voiceId: string;
  tone: string;
  language: string;
};

type SpotAppState = {
  userName: string;
  userEmail: string;
  userPassword: string;
  userPseudonym: string;
  isAuthLoading: boolean;
  authError: string | null;
  offers: SpotOffer[];
  selectedOffer: SpotOffer | null;
  isOffersLoading: boolean;
  savings: SpotSavings;
  merchantVoiceIdentity: SpotMerchantVoiceIdentity;
  voiceIdentityStatus: string | null;
  voiceWidgetSession: { sessionToken?: string; signedUrl?: string } | null;
  isVoiceWidgetLoading: boolean;
  voiceWidgetError: string | null;
  setUserName: (value: string) => void;
  setUserEmail: (value: string) => void;
  setUserPassword: (value: string) => void;
  setMerchantVoiceIdentity: (value: SpotMerchantVoiceIdentity) => void;
};

const defaultSpotState: SpotAppState = {
  userName: "Friend",
  userEmail: "",
  userPassword: "",
  userPseudonym: "demo_user",
  isAuthLoading: false,
  authError: null,
  offers: [],
  selectedOffer: null,
  isOffersLoading: false,
  savings: {
    latestSavedEur: 3.4,
    todaySavedEur: 3.4,
    monthSavedEur: 42.1,
    spotsTried: 17,
  },
  merchantVoiceIdentity: {
    brandStory: "",
    menuHighlights: "",
    promotions: "",
    voiceName: "Warm Guide",
    voiceId: "",
    tone: "friendly",
    language: "en",
  },
  voiceIdentityStatus: null,
  voiceWidgetSession: null,
  isVoiceWidgetLoading: false,
  voiceWidgetError: null,
  setUserName: () => undefined,
  setUserEmail: () => undefined,
  setUserPassword: () => undefined,
  setMerchantVoiceIdentity: () => undefined,
};

const SpotAppContext = createContext<SpotAppState>(defaultSpotState);

export function SpotAppProvider({
  value,
  children,
}: {
  value: SpotAppState;
  children: React.ReactNode;
}) {
  const memoValue = useMemo(() => value, [value]);
  return <SpotAppContext.Provider value={memoValue}>{children}</SpotAppContext.Provider>;
}

function useSpotApp() {
  return useContext(SpotAppContext);
}

function getInitial(name: string) {
  const trimmed = name.trim();
  return (trimmed[0] || "U").toUpperCase();
}

function euro(value: number) {
  return `€${value.toFixed(2)}`;
}

type CoverageStatus = "Implemented" | "In Progress" | "Planned";

const statusClassByType: Record<CoverageStatus, string> = {
  Implemented: "bg-[oklch(0.94_0.07_150)] text-[oklch(0.4_0.1_150)]",
  "In Progress": "bg-[var(--sand)]/35 text-[var(--forest)]",
  Planned: "bg-[var(--terracotta)]/12 text-[var(--terracotta)]",
};

function StatusBadge({ status }: { status: CoverageStatus }) {
  return (
    <span className={`spot-status-badge ${statusClassByType[status]}`}>
      {status}
    </span>
  );
}

function SectionFrame({
  track,
  title,
  status,
  whatUserSees,
  whyItMatters,
}: {
  track: string;
  title: string;
  status: CoverageStatus;
  whatUserSees: string;
  whyItMatters: string;
}) {
  return (
    <div className="spot-section-frame">
      <div className="flex items-center justify-between gap-2">
        <div className="spot-kicker">{track}</div>
        <StatusBadge status={status} />
      </div>
      <div className="spot-title mt-1.5">{title}</div>
      <div className="mt-2 space-y-1.5">
        <p className="spot-explain">
          <strong>Experience:</strong> {whatUserSees}
        </p>
        <p className="spot-explain">
          <strong>Benefit:</strong> {whyItMatters}
        </p>
      </div>
    </div>
  );
}

/* ---------- 00 ROLE PICKER — choose Consumer or Merchant ---------- */
export function S00RolePicker() {
  return (
    <Phone title="Choose your role" number={0} bg="cream">
      <div className="relative flex-1 flex flex-col px-7 pt-10 pb-8 grain">
        {/* Soft background glow */}
        <div className="absolute inset-0 opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 25%, var(--sand) 0%, transparent 65%)" }} />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <SpotLogo size={36} />
            <span className="font-display text-[22px] text-[var(--forest)]">Spot</span>
          </div>
          <h1 className="font-display text-[34px] leading-[1.05] text-[var(--forest)] mt-7">
            Welcome.<br />Who are you here?
          </h1>
          <p className="mt-3 text-[14px] text-[var(--forest)]/65 max-w-[300px] leading-relaxed">
            Pick a side — you can switch later.
          </p>
        </div>

        <div className="relative flex flex-col gap-3.5 mt-9">
          {/* Consumer card */}
          <button
            data-role="consumer"
            className="group relative text-left rounded-3xl border border-[var(--terracotta)]/25 bg-white p-5 shadow-md active:scale-[0.985] transition-all duration-200 hover:shadow-lg overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, var(--terracotta) 0%, transparent 70%)" }} />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--terracotta)] text-white flex items-center justify-center shrink-0 shadow-md">
                <ShoppingBag size={22} strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <div className="font-display text-[19px] text-[var(--forest)] leading-tight">I'm exploring</div>
                <div className="text-[12.5px] text-[var(--forest)]/60 mt-1.5 leading-relaxed">
                  Find local offers as you walk by — no chasing coupons, no spam.
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--terracotta)]">
                  Continue as customer <ChevronRight size={13} />
                </div>
              </div>
            </div>
          </button>

          {/* Merchant card */}
          <button
            data-role="merchant"
            className="group relative text-left rounded-3xl border border-[var(--forest)]/25 bg-white p-5 shadow-md active:scale-[0.985] transition-all duration-200 hover:shadow-lg overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, var(--forest) 0%, transparent 70%)" }} />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--forest)] text-white flex items-center justify-center shrink-0 shadow-md">
                <Store size={22} strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <div className="font-display text-[19px] text-[var(--forest)] leading-tight">I run a business</div>
                <div className="text-[12.5px] text-[var(--forest)]/60 mt-1.5 leading-relaxed">
                  Set a goal, let AI fill your quiet hours with the right customers.
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--forest)]">
                  Continue as merchant <ChevronRight size={13} />
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="relative mt-auto pt-6 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--forest)]/55">
            <Lock size={11} /> Privacy-first · on-device by default
          </div>
        </div>
      </div>
    </Phone>
  );
}

/* ---------- 01 SPLASH ---------- */
export function S01Splash() {
  return (
    <Phone title="Splash" number={1} bg="cream">
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 grain">
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 40%, var(--sand) 0%, transparent 60%)" }} />
        <div className="relative animate-[fade-rise_600ms_ease-out]">
          <SpotLogo size={120} />
        </div>
        <h1 className="font-display text-5xl text-[var(--forest)] mt-8 tracking-tight">
          Spot
        </h1>
        <p className="mt-3 text-center text-[var(--forest)]/70 max-w-[260px] text-[15px] leading-relaxed">
          Little reasons to step outside,
          <br /> made for your block.
        </p>
        <div className="absolute bottom-12 flex items-center gap-2 text-xs text-[var(--forest)]/60">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--terracotta)] animate-pulse" />
          tuning into Munich
        </div>
      </div>
    </Phone>
  );
}

/* ---------- 02 ONBOARDING — pins ---------- */
export function S02Pins() {
  return (
    <Phone title="Pin Home & Work" number={2}>
      <StatusBar />
      <div className="px-7 pb-3">
        <div className="text-xs font-semibold tracking-wider text-[var(--terracotta)]">STEP 1 OF 4</div>
        <div className="mt-1 flex gap-1.5"><span className="h-1 flex-1 rounded-full bg-[var(--forest)]" /><span className="h-1 flex-1 rounded-full bg-[var(--border)]" /><span className="h-1 flex-1 rounded-full bg-[var(--border)]" /><span className="h-1 flex-1 rounded-full bg-[var(--border)]" /></div>
        <h2 className="font-display text-[26px] leading-[1.1] text-[var(--forest)] mt-2.5">
          Where do you spend
          <br /> your days?
        </h2>
        <p className="text-[12px] text-[var(--forest)]/60 mt-1.5">
          Drop two pins. We'll trace your natural path between them.
        </p>
      </div>
      <div className="relative flex-1 min-h-[420px] mx-4 rounded-3xl overflow-hidden border border-[var(--border)] spot-map-clean">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Path 1: Home (20,18) → Work (80,78) — endpoints sit exactly under pin tips */}
          <motion.path
            d="M 20 18 Q 50 30 80 78"
            stroke="var(--terracotta)"
            strokeLinecap="round"
            strokeDasharray="2 2"
            fill="none"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{ strokeWidth: 3 } as any}
          />
          {/* Path 2: Work (80,78) → Tony's (22,70) */}
          <motion.path
            d="M 80 78 Q 50 80 22 70"
            stroke="var(--forest)"
            strokeLinecap="round"
            strokeDasharray="2 2"
            fill="none"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ duration: 0.7, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ strokeWidth: 3 } as any}
          />
          {/* Anchor dots at each pin tip — guarantees lines visually connect to pin tip */}
          <motion.circle cx="20" cy="18" r="1.4" fill="var(--terracotta)" vectorEffect="non-scaling-stroke"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.25 }} style={{ transformOrigin: "20px 18px" }} />
          <motion.circle cx="80" cy="78" r="1.4" fill="var(--terracotta)" vectorEffect="non-scaling-stroke"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.45, duration: 0.25 }} style={{ transformOrigin: "80px 78px" }} />
          <motion.circle cx="22" cy="70" r="1.4" fill="var(--sand)" vectorEffect="non-scaling-stroke"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.6, duration: 0.25 }} style={{ transformOrigin: "22px 70px" }} />
        </svg>

        {/* Pins — zero-size anchor at exact coord; SVG tip lands on anchor via -18/-42 offset */}
        <div className="absolute" style={{ left: "20%", top: "18%", width: 0, height: 0 }}>
          <motion.div
            initial={{ y: -32, opacity: 0, scale: 0.65 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: "absolute", left: -22, top: -42 }}
          >
            <HandPin label="Home" color="var(--forest)" />
          </motion.div>
        </div>
        <div className="absolute" style={{ left: "80%", top: "78%", width: 0, height: 0 }}>
          <motion.div
            initial={{ y: -32, opacity: 0, scale: 0.65 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: "absolute", left: -21.5, top: -42 }}
          >
            <HandPin label="Work" color="var(--terracotta)" />
          </motion.div>
        </div>
        <div className="absolute" style={{ left: "22%", top: "70%", width: 0, height: 0 }}>
          <motion.div
            initial={{ y: -32, opacity: 0, scale: 0.65 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 2.3, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: "absolute", left: -29, top: -28 }}
          >
            <HandPin label="Tony's ☕" color="var(--sand)" pulsing />
          </motion.div>
        </div>
      </div>
      <div className="p-5">
        <button
          data-action="continue"
          className="w-full h-13 py-3.5 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-all duration-300"
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 03 ONBOARDING — meal-time rail sliders + chips ---------- */
export function S03Meals() {
  const { userName, setUserName } = useSpotApp();
  const [vals, setVals] = useState([0.42, 0.55, 0.72]);
  const [chips, setChips] = useState([true, true, true, false, true, false, true, false, true]);
  const chipNames = ["Coffee", "Bakery", "Italian", "Asian", "Healthy", "Wine bars", "Bistro", "Vegan", "Sweet"];
  const fmtTime = (v: number) => { const h = Math.floor(6 + v * 16); const m = Math.floor(((6 + v * 16) - h) * 60); return `${String(h).padStart(2,"0")}:${String(Math.round(m / 5) * 5).padStart(2,"0")}`; };
  const startDrag = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    const track = e.currentTarget as HTMLElement;
    track.setPointerCapture?.(e.pointerId);
    let raf = 0;
    let pendingX = e.clientX;
    const update = () => {
      const r = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (pendingX - r.left) / r.width));
      setVals(p => { const n = [...p]; n[i] = x; return n; });
      raf = 0;
    };
    const onMove = (ev: PointerEvent) => {
      pendingX = ev.clientX;
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onUp = (ev: PointerEvent) => {
      track.releasePointerCapture?.(ev.pointerId);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    pendingX = e.clientX;
    update();
  };
  const updateRailValue = (index: number, next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setVals((previous) => {
      const updated = [...previous];
      updated[index] = clamped;
      return updated;
    });
  };
  const onRailKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.02;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        updateRailValue(index, vals[index] - step);
        break;
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        updateRailValue(index, vals[index] + step);
        break;
      case "Home":
        event.preventDefault();
        updateRailValue(index, 0);
        break;
      case "End":
        event.preventDefault();
        updateRailValue(index, 1);
        break;
      default:
        break;
    }
  };
  const railIcons = [<Coffee size={15} />, <UtensilsCrossed size={15} />, <Wine size={15} />];
  const railLabels = ["Coffee", "Lunch", "Dinner"];
  return (
    <Phone title="Onboarding · Taste" number={3}>
      <StatusBar />
      <div className="px-6 pb-1">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--terracotta)]">STEP 2 OF 4</div>
        <div className="mt-1 flex gap-1.5"><span className="h-1 flex-1 rounded-full bg-[var(--forest)]" /><span className="h-1 flex-1 rounded-full bg-[var(--forest)]" /><span className="h-1 flex-1 rounded-full bg-[var(--border)]" /><span className="h-1 flex-1 rounded-full bg-[var(--border)]" /></div>
        <div className="mt-2">
          <label className="text-[10px] font-semibold tracking-widest text-[var(--forest)]/65" htmlFor="onboarding-name">
            YOUR NAME
          </label>
          <input
            id="onboarding-name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter first name"
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[13px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
          />
        </div>
        <h2 className="font-display text-[22px] leading-[1.1] text-[var(--forest)] mt-2.5">When do you usually<br /> get hungry?</h2>
      </div>
      <div className="px-4 mt-3 space-y-2">
        {[0,1,2].map(i => (
          <div key={i} className="bg-white rounded-2xl px-4 py-3 border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--cream)] flex items-center justify-center text-[var(--forest)]">{railIcons[i]}</div>
              <div className="flex-1"><div className="font-display text-[14px] text-[var(--forest)] leading-tight">{railLabels[i]}</div></div>
              <div className="font-display text-[16px] text-[var(--terracotta)]">{fmtTime(vals[i])}</div>
            </div>
            <div
              className="rail-track mt-2.5"
              tabIndex={0}
              role="slider"
              aria-label={`${railLabels[i]} preferred time`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(vals[i] * 100)}
              aria-valuetext={fmtTime(vals[i])}
              onPointerDown={startDrag(i)}
              onKeyDown={onRailKeyDown(i)}
              style={{ touchAction: "none", cursor: "pointer" }}
            >
              <div className="rail-base" /><div className="rail-fill" style={{ left: `${Math.max(0, vals[i]-0.06)*100}%`, width: `${(Math.min(1, vals[i]+0.06) - Math.max(0, vals[i]-0.06))*100}%` }} />
              {[0,0.25,0.5,0.75,1].map(t => <span key={t} className="rail-tick" style={{ left: `${t*100}%` }} />)}
              <span className="rail-thumb" style={{ left: `${vals[i]*100}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-[var(--forest)]/45 font-medium"><span>earlier</span><span>later</span></div>
          </div>
        ))}
      </div>
      <div className="px-6 mt-3">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--forest)]/55 mb-1.5">TASTES YOU TRUST</div>
        <div className="flex flex-wrap gap-2">
          {chipNames.map((l, i) => (
            <button
              key={l}
              type="button"
              aria-pressed={chips[i]}
              onClick={() => setChips(p => { const n=[...p]; n[i]=!n[i]; return n; })}
              className={`inline-flex items-center px-4 py-2 rounded-full text-[13px] font-medium border transition-all cursor-pointer active:scale-95 ${
                chips[i] ? "bg-[var(--forest)] text-white border-[var(--forest)]" : "bg-white text-[var(--forest)] border-[var(--border)]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-auto px-5 pt-3 pb-4">
        <button
          data-action="looks-right"
          className="w-full py-3.5 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-all duration-300"
        >
          Looks right
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 04 PERMISSIONS ---------- */
export function S04Permissions() {
  const {
    userName,
    userEmail,
    userPassword,
    isAuthLoading,
    authError,
    setUserEmail,
    setUserPassword,
  } = useSpotApp();
  const Row = ({ icon, title, desc, on }: { icon: React.ReactNode; title: string; desc: string; on: "device" | "cloud" }) => (
    <div className="flex gap-3 p-4 bg-white rounded-2xl border border-[var(--border)]">
      <div className="w-10 h-10 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--terracotta)] shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-display text-[var(--forest)]">{title}</div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            on === "device" ? "bg-[var(--forest)]/10 text-[var(--forest)]" : "bg-[var(--terracotta)]/10 text-[var(--terracotta)]"
          }`}>
            {on === "device" ? "ON DEVICE" : "CLOUD"}
          </span>
        </div>
        <div className="text-xs text-[var(--forest)]/60 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
  return (
    <Phone title="Privacy first" number={4}>
      <StatusBar />
      <div className="px-7 pb-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--terracotta)]">STEP 4 OF 4</div>
        <div className="mt-1 flex gap-1.5 mb-2">
          <span className="h-1.5 flex-1 rounded-full bg-[var(--forest)]" />
          <span className="h-1.5 flex-1 rounded-full bg-[var(--forest)]" />
          <span className="h-1.5 flex-1 rounded-full bg-[var(--forest)]" />
          <span className="h-1.5 flex-1 rounded-full bg-[var(--forest)]" />
        </div>
        <h2 className="font-display text-[28px] leading-[1.1] text-[var(--forest)] mt-1">
          What stays on
          <br /> your phone.
        </h2>
        <p className="text-sm text-[var(--forest)]/60 mt-2">
          We hide as much as possible from our own servers. Here's the honest breakdown.
        </p>
      </div>
      <div className="px-5 mt-4 space-y-2.5">
        <Row icon={<MapPin size={18} />} title="Location" desc="Used to find offers under 200m. Coordinates never leave your phone." on="device" />
        <Row icon={<Cloud size={18} />} title="Weather + time" desc="Public data. We fetch it, then forget you asked." on="cloud" />
        <Row icon={<Sparkles size={18} />} title="Behavior model" desc="Learns your rhythm locally. Trained on your phone." on="device" />
        <Row icon={<Bell size={18} />} title="Notifications" desc="Only when an offer fits — never marketing blasts." on="device" />
      </div>
      <div className="px-5 mt-3 space-y-2">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--forest)]/60">ACCOUNT SETUP</div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-3 space-y-2">
          <div className="text-[12px] text-[var(--forest)]/75">Hi {userName || "there"}, add login details to save your profile.</div>
          <input
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
          />
          <input
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            placeholder="Password (8+ chars)"
            type="password"
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
          />
          {authError && <div className="text-[11px] text-[var(--terracotta)]">{authError}</div>}
        </div>
      </div>
      <div className="mt-auto p-5">
        <button
          data-action="finish-setup"
          disabled={isAuthLoading}
          className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-all duration-300 disabled:opacity-70"
        >
          {isAuthLoading ? "Setting up account..." : <>Finish setup <ChevronRight size={18} /></>}
        </button>
        <button data-nav="policy" className="w-full mt-2 h-10 text-sm text-[var(--forest)]/60 active:scale-95 transition-all duration-300">
          Read the full policy
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 04b DIETARY & ACCESSIBILITY ---------- */
export function S04bDietary() {
  const { userName } = useSpotApp();
  const [diets, setDiets] = useState([true, false, true, false, false, true, false, false]);
  const [accs, setAccs] = useState([true, true, false]);
  const Diet = ({ icon, label, idx }: { icon: React.ReactNode; label: string; idx: number }) => (
    <button onClick={() => setDiets(p => { const n=[...p]; n[idx]=!n[idx]; return n; })} className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${
      diets[idx] ? "bg-[var(--forest)] text-white border-[var(--forest)]" : "bg-white text-[var(--forest)] border-[var(--border)]"
    }`}>
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-current">{icon}</span>
      <span className="text-[12px] font-semibold">{label}</span>
      {diets[idx] && <Check size={12} className="ml-1" />}
    </button>
  );
  const Acc = ({ icon, label, desc, idx }: { icon: React.ReactNode; label: string; desc: string; idx: number }) => (
    <button
      type="button"
      aria-pressed={accs[idx]}
      onClick={() => setAccs(p => { const n=[...p]; n[idx]=!n[idx]; return n; })}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-[var(--border)] cursor-pointer active:scale-95 transition-all duration-300"
    >
      <div className="w-9 h-9 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--terracotta)]">{icon}</div>
      <div className="flex-1">
        <div className="font-display text-[14px] text-[var(--forest)] leading-tight">{label}</div>
        <div className="text-[11px] text-[var(--forest)]/60">{desc}</div>
      </div>
      <div className={`relative w-10 h-6 rounded-full transition-all duration-300 ease-in-out ${accs[idx] ? "bg-[var(--terracotta)]" : "bg-[var(--border)]"}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out transform ${accs[idx] ? "translate-x-4" : "translate-x-0"}`} />
      </div>
    </button>
  );
  return (
    <Phone title="Dietary & Accessibility" number={5}>
      <StatusBar />
      <div className="px-6 pb-1">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--terracotta)]">STEP 3 OF 4</div>
        <div className="mt-1 flex gap-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-[var(--forest)]" />
          <span className="h-1.5 flex-1 rounded-full bg-[var(--forest)]" />
          <span className="h-1.5 flex-1 rounded-full bg-[var(--forest)]" />
          <span className="h-1.5 flex-1 rounded-full bg-[var(--border)]" />
        </div>
        <h2 className="font-display text-[24px] leading-[1.1] text-[var(--forest)] mt-3">
          Anything we should
          <br /> always check for?
        </h2>
        <p className="text-[12px] text-[var(--forest)]/60 mt-1.5">
          Filters run on-device. Spot will never compose an offer that violates them.
        </p>
      </div>

      <div className="px-5 mt-4">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--forest)]/60 mb-2 flex items-center gap-1.5">
          <Leaf size={11} /> DIETARY
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Diet icon={<Leaf size={13} />} label="Vegetarian" idx={0} />
          <Diet icon={<Leaf size={13} />} label="Vegan" idx={1} />
          <Diet icon={<Wheat size={13} />} label="Gluten-free" idx={2} />
          <Diet icon={<Flame size={13} />} label="Halal" idx={3} />
          <Diet icon={<Sparkles size={13} />} label="Kosher" idx={4} />
          <Diet icon={<X size={13} />} label="Nut-free" idx={5} />
          <Diet icon={<X size={13} />} label="Dairy-free" idx={6} />
          <Diet icon={<X size={13} />} label="Low-sugar" idx={7} />
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--forest)]/60 mb-2 flex items-center gap-1.5">
          <Accessibility size={11} /> ACCESSIBILITY
        </div>
        <div className="space-y-2">
          <Acc icon={<Accessibility size={16} />} label="Step-free entrance only" desc={`Show offers ${(userName || "you").trim()} can roll into.`} idx={0} />
          <Acc icon={<Eye size={16} />} label="High-contrast cards" desc="Larger text, AAA contrast." idx={1} />
          <Acc icon={<Mic size={16} />} label="Read offers aloud" desc="VoiceOver-friendly summaries." idx={2} />
        </div>
      </div>

      <div className="mt-auto p-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--cream)] mb-3 text-[11px] text-[var(--forest)]/70">
          <Shield size={11} className="text-[var(--terracotta)]" />
          All filters stay on this phone.
        </div>
        <button
          data-action="continue"
          className="w-full py-4 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-all duration-300"
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 05 HOME / FEED ---------- */
export function S05Feed() {
  const { userName, offers, isOffersLoading } = useSpotApp();
  const displayName = (userName || "Friend").trim();
  const fallbackCards: SpotOffer[] = [
    {
      offer_id: "fallback-1",
      headline: "Tony just brewed a fresh batch.",
      body_line: "Tony's Café · cortado + pastry",
      cta_text: "Redeem now",
      discount_type: "fixed",
      discount_value: 3.4,
      valid_for_minutes: 14,
      tone_style: "friendly",
      ui_layout_variant: "photo",
      expires_at_utc: new Date(Date.now() + 14 * 60000).toISOString(),
    },
    {
      offer_id: "fallback-2",
      headline: "Pain au chocolat, half off.",
      body_line: "Boulangerie Marie · ends 13:30",
      cta_text: "Redeem now",
      discount_type: "percent",
      discount_value: 50,
      valid_for_minutes: 30,
      tone_style: "short",
      ui_layout_variant: "pill",
      expires_at_utc: new Date(Date.now() + 30 * 60000).toISOString(),
    },
  ];
  const cards = offers.length ? offers : fallbackCards;

  return (
    <Phone title="Home — feed" number={5}>
      <StatusBar />
      <div className="px-6 pb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-[var(--forest)]/60">Hi {displayName},</div>
          <div className="font-display text-[22px] text-[var(--forest)] leading-tight">3 little reasons to step out.</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--sand)] flex items-center justify-center font-display text-[var(--forest)]">
          {getInitial(displayName)}
        </div>
      </div>

      {/* Context pill */}
      <div className="px-6">
        <div className="context-pulse inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[var(--border)] text-[12px] font-medium text-[var(--forest)]">
          <CloudRain size={14} className="text-[var(--accent)]" />
          11°C · light rain · Tuesday lunch
        </div>
      </div>
      <div className="px-5 mt-2.5">
        <SectionFrame
          track="Consumer Flow"
          status="Implemented"
          title="Live offer feed with context cues"
          whatUserSees="Nearby cards with distance, urgency, and dynamic savings from active offers."
          whyItMatters="Proves the core 3-second offer experience is visible and understandable in one glance."
        />
      </div>

      {/* Cards — 3 visually distinct */}
      <div className="flex-1 overflow-hidden mt-3 px-5 space-y-3 pb-3">
        {isOffersLoading && (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-3 text-[12px] text-[var(--forest)]/70">
            Generating live deals...
          </div>
        )}
        {cards.map((offer, i) => (
          <button
            key={offer.offer_id}
            type="button"
            data-offer-index={i}
            className="fade-rise relative block w-full text-left rounded-3xl overflow-hidden bg-white border border-[var(--border)] shadow-sm"
            style={{ animationDelay: `${60 + i * 120}ms` }}
          >
          <div className="relative h-32 grain">
            <img src={cafeImg} alt="Tony's café" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-[10px] font-semibold text-[var(--forest)]">
              <Footprints size={10} /> 80m
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[var(--terracotta)] text-white text-[10px] font-semibold flex items-center gap-1">
              <Clock size={10} /> {offer.valid_for_minutes} min left
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-[18px] text-[var(--forest)] leading-tight">{offer.headline}</div>
                <div className="text-xs text-[var(--forest)]/60 mt-1">{offer.body_line}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-[22px] text-[var(--terracotta)] leading-none">
                  {offer.discount_type === "percent" ? `-${offer.discount_value}%` : `-${euro(offer.discount_value)}`}
                </div>
                <div className="text-[10px] text-[var(--forest)]/50 mt-0.5">live deal</div>
              </div>
            </div>
          </div>
          </button>
        ))}
      </div>

      {/* Tab bar — pinned to bottom of screen */}
      <div className="mt-auto border-t border-[var(--border)] px-10 pt-3 flex justify-between bg-white" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
        <button data-action="noop" className="flex flex-col items-center gap-0.5 active:scale-95 transition-all duration-300"><Sparkles size={22} className="text-[var(--terracotta)]" /><span className="text-[9px] font-semibold text-[var(--terracotta)]">Feed</span></button>
        <button data-action="feed-tab-map" className="flex flex-col items-center gap-0.5 active:scale-95 transition-all duration-300"><MapPin size={22} className="text-[var(--forest)]/40" /><span className="text-[9px] text-[var(--forest)]/40">Map</span></button>
        <button data-action="feed-tab-history" className="flex flex-col items-center gap-0.5 active:scale-95 transition-all duration-300"><Clock size={22} className="text-[var(--forest)]/40" /><span className="text-[9px] text-[var(--forest)]/40">History</span></button>
        <button data-action="feed-tab-privacy" className="flex flex-col items-center gap-0.5 active:scale-95 transition-all duration-300"><Shield size={22} className="text-[var(--forest)]/40" /><span className="text-[9px] text-[var(--forest)]/40">Privacy</span></button>
      </div>
    </Phone>
  );
}

/* ---------- 06 OFFER DETAIL ---------- */
export function S06OfferDetail() {
  const { selectedOffer } = useSpotApp();
  const offer = selectedOffer || {
    offer_id: "fallback-detail",
    headline: "Tony just brewed a fresh batch — and it's quiet today.",
    body_line: "Tony's Café · Marienstr. 14",
    cta_text: "Redeem now",
    discount_type: "fixed",
    discount_value: 3.4,
    valid_for_minutes: 14,
    tone_style: "friendly",
    ui_layout_variant: "card",
    expires_at_utc: new Date(Date.now() + 14 * 60000).toISOString(),
  };
  return (
    <Phone title="Offer detail" number={6}>
      <div className="relative h-72 grain">
        <img src={cafeImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[var(--cream)]" />
        <StatusBar dark />
        <button data-nav="back" aria-label="Back to feed" className="absolute top-16 left-5 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center active:scale-95 transition-all duration-300">
          <ChevronLeft size={18} />
        </button>
        <button data-action="noop" aria-label="Close offer details" className="absolute top-16 right-5 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center active:scale-95 transition-all duration-300">
          <X size={18} />
        </button>
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[var(--terracotta)] text-white text-[11px] font-bold tracking-wide flex items-center gap-1.5 shadow-lg shadow-black/20">
            <Clock size={11} /> ENDS IN 13:42
          </span>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-6 relative">
        <div className="bg-white rounded-3xl p-5 border border-[var(--border)] shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-[var(--forest)]/60">{offer.body_line}</div>
              <h2 className="font-display text-[24px] text-[var(--forest)] leading-tight mt-0.5">
                {offer.headline}
              </h2>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-4xl text-[var(--terracotta)] leading-none">
              {offer.discount_type === "percent" ? `-${offer.discount_value}%` : `-${euro(offer.discount_value)}`}
            </span>
            <span className="text-sm text-[var(--forest)]/50 line-through">live</span>
            <span className="ml-auto inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[var(--cream)] text-[var(--forest)] text-[11px] font-semibold whitespace-nowrap leading-none">
              {offer.cta_text}
            </span>
          </div>
        </div>

        {/* Walking map — clean + animated dashed route, pin tips aligned to coords */}
        <div className="mt-3 relative rounded-3xl overflow-hidden border border-[var(--border)] h-40">
          <div className="relative w-full h-full spot-map-clean overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M14 80 C 38 65, 62 50, 86 22"
                stroke="var(--terracotta)"
                strokeLinecap="round"
                fill="none"
                pathLength={1}
                vectorEffect="non-scaling-stroke"
                className="draw-path"
                style={{ strokeWidth: 3.5 } as any}
              />
            </svg>
            <div className="absolute" style={{ left: "14%", top: "80%", transform: "translate(-50%, -42px)" }}>
              <div className="pin-drop" style={{ animationDelay: "200ms" }}>
                <HandPin color="var(--forest)" label="You" />
              </div>
            </div>
            <div className="absolute" style={{ left: "86%", top: "22%", transform: "translate(-50%, -42px)" }}>
              <div className="pin-drop" style={{ animationDelay: "2200ms" }}>
                <HandPin pulsing label="Tony's" />
              </div>
            </div>
            <div className="absolute right-2 bottom-2 px-2 py-1 rounded-full bg-white/95 text-[11px] font-semibold flex items-center gap-1 shadow-sm">
              <Footprints size={11} /> 80m · 1 min
            </div>
          </div>
        </div>

        <div className="mt-3 text-[12px] text-[var(--forest)]/60 leading-relaxed px-1">
          <span className="inline-flex items-center gap-1 mr-1 font-semibold text-[var(--forest)]">
            <Sparkles size={11} /> Why now
          </span>
          Light rain + your usual lunch slot + Tony has 3 quiet seats. Composed for you, 11 seconds ago.
        </div>
      </div>

      <div className="p-5 pt-3">
        <button data-action="redeem-now" className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold shadow-lg shadow-[var(--terracotta)]/30 flex items-center justify-center gap-2 active:scale-95 transition-all duration-300">
          Redeem now <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 07 WALK THE WALLET ---------- */
export function S07Walk() {
  const { selectedOffer } = useSpotApp();
  const discountLabel = selectedOffer
    ? selectedOffer.discount_type === "percent"
      ? `-${selectedOffer.discount_value}%`
      : `-${euro(selectedOffer.discount_value)}`
    : "-€3.40";
  // Normalized 0..100 viewBox keeps path coords aligned with pin percentages.
  // You (15,88) → Tony's (24,65) → Marie (78,45) → Ramen (70,18)
  return (
    <Phone title="Walk the Wallet" number={7}>
      <div className="absolute inset-0">
        <div className="relative w-full h-full spot-map-clean overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Leg 1: You → Tony's */}
            <path
              d="M15 88 C 16 80, 20 73, 24 65"
              stroke="var(--terracotta)" strokeDasharray="0.7 2.4"
              strokeLinecap="round" fill="none" pathLength={1}
              vectorEffect="non-scaling-stroke" className="draw-path"
              style={{ strokeWidth: 3.5 } as any}
            />
            {/* Leg 2: Tony's → Marie */}
            <path
              d="M24 65 C 40 60, 60 52, 78 45"
              stroke="var(--terracotta)" strokeDasharray="0.7 2.4"
              strokeLinecap="round" fill="none" pathLength={1}
              vectorEffect="non-scaling-stroke" className="draw-path-2"
              style={{ strokeWidth: 3.5 } as any}
            />
            {/* Leg 3: Marie → Ramen */}
            <path
              d="M78 45 C 76 36, 73 26, 70 18"
              stroke="var(--terracotta)" strokeDasharray="0.7 2.4"
              strokeLinecap="round" fill="none" pathLength={1}
              vectorEffect="non-scaling-stroke" className="draw-path-3"
              style={{ strokeWidth: 3.5 } as any}
            />
          </svg>

          {/* Pins — outer wrapper places pin TIP on coord, inner wrapper animates drop */}
          <div className="absolute" style={{ left: "24%", top: "65%", transform: "translate(-50%, -42px)" }}>
            <div className="pin-drop" style={{ animationDelay: "600ms" }}>
              <HandPin color="var(--forest)" pulsing label="Tony's · −€3.40" />
            </div>
          </div>
          <div className="absolute" style={{ left: "78%", top: "45%", transform: "translate(-50%, -42px)" }}>
            <div className="pin-drop" style={{ animationDelay: "600ms" }}>
              <HandPin color="var(--terracotta)" pulsing label="Marie · −50%" />
            </div>
          </div>
          <div className="absolute" style={{ left: "70%", top: "18%", transform: "translate(-50%, -42px)" }}>
            <div className="pin-drop" style={{ animationDelay: "600ms" }}>
              <HandPin color="var(--forest)" pulsing label="Ramen · −€2.10" />
            </div>
          </div>
          {/* You — dot centred on coord */}
          <div className="absolute flex flex-col items-center" style={{ left: "15%", top: "88%", transform: "translate(-50%, -50%)" }}>
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-[var(--terracotta)] animate-ping opacity-60" />
              <div className="relative w-5 h-5 rounded-full bg-white border-4 border-[var(--terracotta)] shadow" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded-full bg-white text-[10px] font-semibold shadow">You</span>
          </div>
        </div>
      </div>

      <StatusBar />
      <div className="relative px-6 mt-2">
        <button
          data-nav="back"
          aria-label="Back to feed"
          className="w-9 h-9 rounded-full bg-white/95 border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-[var(--forest)] text-[12px] font-medium shadow-sm border border-[var(--border)]">
          <Sparkles size={12} className="text-[var(--terracotta)]" /> A 9-minute loop · 3 spots
        </div>
      </div>

      <div className="mt-auto relative p-5">
        <div className="bg-white/95 backdrop-blur rounded-3xl p-4 border border-white/40 shadow-xl">
          <div className="flex items-center gap-3">
            <img src={cafeImg} className="w-12 h-12 rounded-xl object-cover" alt="" />
            <div className="flex-1">
              <div className="text-[10px] font-semibold tracking-widest text-[var(--terracotta)]">NEXT STOP</div>
              <div className="font-display text-[16px] text-[var(--forest)] leading-tight">Tony's Café — 80m ahead</div>
            </div>
            <div className="font-display text-xl text-[var(--terracotta)]">{discountLabel}</div>
          </div>
          <button data-action="start-walk" className="mt-3 w-full h-12 rounded-full bg-[var(--terracotta)] text-white font-semibold active:scale-95 transition-all duration-300">
            Start the walk
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ---------- 08 QR REDEEM ---------- */
export function S08QR() {
  return (
    <Phone title="QR redeem" number={8} bg="ink">
      <div className="absolute inset-0 pointer-events-none qr-redeem-bg" />
      <StatusBar dark />
      <div className="relative flex-1 flex flex-col items-center px-8">
        <div className="mt-[114px] text-[10px] font-bold tracking-[0.24em] text-[var(--sand)]">
          SHOW THIS TO TONY
        </div>

        <h2 className="font-serif font-bold text-[35px] mt-2 text-center leading-none text-[var(--paper)]">
          Tony's Café
        </h2>

        <div className="relative mt-4 font-serif font-bold text-[60px] text-[var(--terracotta)] leading-none qr-amount-reveal">
          <span className="absolute left-[-12px] top-[0.55em] w-12 h-[3px] rounded-full bg-[var(--terracotta)]" />
          €3.40
        </div>

        <div className="mt-[34px] qr-mat">
          <div className="qr-redeem-card rounded-[26px] p-3">
            <QrCode size={218} />
          </div>
        </div>

        <div className="mt-7 inline-flex items-center gap-2 px-4 py-2 rounded-full qr-expiry-pill text-[13px] text-[var(--paper)]">
          <Clock size={13} className="text-[var(--paper)]/80" />
          <span>Expires in</span>
          <span className="font-mono font-bold text-[var(--terracotta)] tracking-wider">02:02</span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] qr-redeem-note">
          <Lock size={11} /> Code generated on this device · single-use
        </div>

        <button data-action="simulate-scan" className="mt-5 px-5 py-2 rounded-full qr-redeem-secondary text-[12px] transition active:scale-95 transition-all duration-300">
          Simulate scan →
        </button>
      </div>
      <div className="relative p-5 pb-7">
        <button data-action="cancel-redeem" className="w-full py-4 rounded-full qr-redeem-cancel text-[var(--paper)] font-semibold transition active:scale-95 transition-all duration-300">
          Cancel redeem
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 09 CONFIRMATION ---------- */
export function S09Confirm() {
  const { savings } = useSpotApp();
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#E76F51", "#264653", "#F4A261", "#FBBF24", "#2EA06D"];
      const duration = 1100;
      const end = Date.now() + duration;

      confetti({
        particleCount: 40,
        spread: 100,
        startVelocity: 40,
        origin: { x: 0.5, y: 0.55 },
        colors,
        scalar: 0.9,
        ticks: 200,
        gravity: 1.1,
      });

      interval = setInterval(() => {
        const timeLeft = end - Date.now();
        if (timeLeft <= 0) {
          if (interval) clearInterval(interval);
          return;
        }
        const particleCount = Math.floor(15 * (timeLeft / duration));

        confetti({
          startVelocity: 25,
          spread: 60,
          ticks: 100,
          particleCount,
          origin: { x: Math.random() * 0.25 + 0.05, y: Math.random() * 0.3 + 0.1 },
          colors,
          scalar: Math.random() * 0.4 + 0.7,
          gravity: 1,
          drift: Math.random() * 0.6 - 0.3,
        });
        confetti({
          startVelocity: 25,
          spread: 60,
          ticks: 100,
          particleCount,
          origin: { x: Math.random() * 0.25 + 0.7, y: Math.random() * 0.3 + 0.1 },
          colors,
          scalar: Math.random() * 0.4 + 0.7,
          gravity: 1,
          drift: Math.random() * 0.6 - 0.3,
        });
      }, 300);
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <Phone title="Confirmation" number={9}>
      <StatusBar />

      <div className="flex-1 flex flex-col items-center px-7 text-center relative">
        {/* Tony's thanks at top — bigger pill */}
        <div className="mt-3 fade-rise flex items-center gap-3 bg-white rounded-full border border-[var(--border)] py-2.5 pl-2.5 pr-5 shadow-md">
          <img src={baristaImg} className="w-12 h-12 rounded-full object-cover" alt="" />
          <div className="text-left">
            <div className="font-display text-[16px] text-[var(--forest)] leading-tight">"Tony says thanks 👋"</div>
            <div className="text-[11px] text-[var(--forest)]/60 mt-0.5">Tony's Café · 13:04</div>
          </div>
        </div>

        {/* Centered check + amount — pushed lower so things sit centred on the screen */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 -m-8 rounded-full bg-[oklch(0.78_0.12_150)] opacity-25 blur-2xl check-glow" />
          {/* Animated halo ring */}
          <span className="absolute inset-0 rounded-full border-2 border-[oklch(0.62_0.13_150)] opacity-40 animate-ping" />
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center check-pop"
            style={{ background: "oklch(0.62 0.13 150)" }}
          >
            <Check size={56} className="text-white check-stroke" strokeWidth={3.2} />
          </div>
        </div>

        <h2 className="font-display text-[36px] text-[var(--forest)] mt-9 leading-none">
          You saved <span className="text-[var(--terracotta)]">{euro(savings.latestSavedEur)}</span>
        </h2>
        <p className="mt-3 text-[13px] text-[var(--forest)]/65 max-w-[260px] leading-relaxed">
          Your cortado &amp; pastry are on their way to the table.
        </p>

        {/* Three-stat box */}
        <div className="mt-8 w-full bg-white rounded-2xl border border-[var(--border)] shadow-sm p-4 flex items-stretch text-left fade-rise" style={{ animationDelay: "500ms" }}>
          <div className="flex-1 px-2">
            <div className="font-display text-[18px] text-[var(--forest)] leading-none">{euro(savings.todaySavedEur)}</div>
            <div className="text-[10px] text-[var(--forest)]/55 mt-1.5 font-medium">today</div>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div className="flex-1 px-2">
            <div className="font-display text-[18px] text-[var(--forest)] leading-none">{euro(savings.monthSavedEur)}</div>
            <div className="text-[10px] text-[var(--forest)]/55 mt-1.5 font-medium">this month</div>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div className="flex-1 px-2">
            <div className="font-display text-[18px] text-[var(--forest)] leading-none">{savings.spotsTried}</div>
            <div className="text-[10px] text-[var(--forest)]/55 mt-1.5 font-medium">spots tried</div>
          </div>
        </div>
      </div>

      <div className="p-5 pb-7">
        <button data-action="confirm-done" className="w-full py-4 rounded-full bg-[var(--forest)] text-white font-semibold shadow-lg shadow-[var(--forest)]/25 active:scale-95 transition-all duration-300">
          Done
        </button>
        <button data-action="confirm-rate" className="w-full mt-2 text-[12px] text-[var(--forest)]/55 active:scale-95 transition-all duration-300">Rate Tony's in 5 seconds</button>
      </div>
    </Phone>
  );
}

/* ---------- 10 SETTINGS / PRIVACY (redesigned per reference) ---------- */
export function S10Settings() {
  const [toggles, setToggles] = useState([true, true, true, true, false]);
  const Toggle = ({ idx }: { idx: number }) => (
    <button
      type="button"
      role="switch"
      aria-checked={toggles[idx]}
      onClick={() => setToggles(p => { const n=[...p]; n[idx]=!n[idx]; return n; })}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out cursor-pointer active:scale-95 ${toggles[idx] ? "bg-[var(--terracotta)]" : "bg-[var(--forest)]/20"}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out transform ${toggles[idx] ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
  const Row = ({ title, desc, idx, badge }: { title: string; desc: string; idx: number; badge: "DEVICE" | "CLOUD" }) => (
    <div className="flex items-center gap-3 py-3.5 border-b border-[var(--border)]/60 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-display text-[14px] text-[var(--forest)]">{title}</div>
          <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
            badge === "DEVICE" ? "bg-[var(--forest)]/10 text-[var(--forest)]" : "bg-[var(--sand)]/25 text-[oklch(0.5_0.1_60)]"
          }`}>
            {badge === "DEVICE" ? <Smartphone size={9} /> : <Cloud size={9} />} {badge}
          </span>
        </div>
        <div className="text-[11px] text-[var(--forest)]/60 mt-0.5">{desc}</div>
      </div>
      <Toggle idx={idx} />
    </div>
  );
  return (
    <Phone title="Privacy" number={10}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button data-nav="back" aria-label="Back to feed" className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center font-display text-[16px] text-[var(--forest)]">Privacy</div>
        <div className="w-9" />
      </div>
      <div className="mx-5 mt-2">
        <SectionFrame
          track="Privacy Story"
          status="Implemented"
          title="On-device-first controls"
          whatUserSees="A clear split between device and cloud signals with direct user toggles."
          whyItMatters="Builds trust with transparent controls and privacy-by-default defaults."
        />
      </div>

      {/* Hero card */}
      <div className="mx-5 mt-3 rounded-3xl p-5 bg-[var(--forest)] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          background: "radial-gradient(circle at 80% 20%, var(--terracotta) 0%, transparent 60%)",
        }} />
        <h3 className="relative font-display text-[22px] leading-tight mt-3">
          Most of Spot lives on this phone.
        </h3>
        <p className="relative text-[12px] text-white/70 mt-2 leading-relaxed">
          The model that picks your offers is 38&nbsp;MB. It runs locally — your routines never reach our servers.
        </p>
        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white/10 p-3">
            <div className="text-[9px] tracking-widest font-bold text-white/55">ON DEVICE</div>
            <div className="font-display text-[22px] mt-1">14 signals</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <div className="text-[9px] tracking-widest font-bold text-white/55">IN CLOUD</div>
            <div className="font-display text-[22px] mt-1">2 signals</div>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-3 px-4 rounded-3xl bg-white border border-[var(--border)]">
        <Row title="Approximate location" desc="Neighbourhood-level only." idx={0} badge="DEVICE" />
        <Row title="Time-of-day patterns" desc="When you usually leave work." idx={1} badge="DEVICE" />
        <Row title="Weather lookups" desc="By postcode, anonymised." idx={2} badge="CLOUD" />
        <Row title="Notifications" desc="Maximum three per day." idx={3} badge="DEVICE" />
        <Row title="Spending insights" desc="Opt-in monthly summary." idx={4} badge="CLOUD" />
      </div>

      <div className="mx-5 mt-3 flex items-center gap-3 p-3 bg-white rounded-2xl border border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl bg-[var(--terracotta)]/10 flex items-center justify-center text-[var(--terracotta)]">
          <Trash2 size={16} />
        </div>
        <div className="flex-1">
          <div className="font-display text-[14px] text-[var(--forest)] leading-tight">Wipe all on-device memory</div>
          <div className="text-[11px] text-[var(--forest)]/60">Restart Spot like new</div>
        </div>
        <ChevronRight size={16} className="text-[var(--forest)]/40" />
      </div>

      <div className="mt-auto pb-4 flex flex-col items-center justify-center gap-2 text-[11px] text-[var(--forest)]/55">
        <button data-nav="policy" className="text-[12px] text-[var(--terracotta)] font-semibold underline-offset-2 hover:underline">
          Read the full policy
        </button>
        <div className="flex items-center gap-1.5">
          <Bell size={11} /> Last sync · 2 minutes ago
        </div>
      </div>
    </Phone>
  );
}

/* ---------- 11 MERCHANT ONBOARDING (Maps link · auto-fill) ---------- */
export function S11MerchantOnboarding() {
  const [fetched, setFetched] = useState(true);
  const Field = ({ label, value, dim }: { label: string; value: string; dim?: boolean }) => (
    <div className="py-2.5 border-b border-[var(--border)]/60 last:border-b-0">
      <div className="text-[10px] font-semibold tracking-widest text-[var(--forest)]/55">{label}</div>
      <div className={`mt-0.5 text-[14px] ${dim ? "text-[var(--forest)]/50" : "text-[var(--forest)] font-medium"}`}>{value}</div>
    </div>
  );
  return (
    <Phone title="Merchant onboarding" number={11}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button data-nav="back" aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center font-display text-[15px] text-[var(--forest)]">Add your business</div>
        <div className="w-9" />
      </div>

      <div className="px-6 mt-3">
        <h2 className="font-display text-[24px] leading-[1.15] text-[var(--forest)]">
          Paste a Google Maps link.
          <br /> We'll do the typing.
        </h2>
      </div>
      <div className="mx-5 mt-2">
        <SectionFrame
          track="Merchant Setup"
          status="Implemented"
          title="Fast onboarding from Maps profile"
          whatUserSees="Auto-filled business details plus confirmation before moving to campaign setup."
          whyItMatters="Shows merchants can start quickly without manual data entry."
        />
      </div>

      {/* URL field */}
      <div className="mx-5 mt-4 rounded-2xl bg-white border border-[var(--border)] p-2 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--forest)]/60">
          <Link2 size={15} />
        </div>
        <span className="flex-1 truncate text-[12px] text-[var(--forest)]">maps.app.goo.gl/tonysCafeStuttg…</span>
        <button type="button" onClick={() => setFetched(f => !f)} className="px-4 py-2 rounded-xl bg-[var(--forest)] text-white text-[12px] font-semibold active:scale-95 transition-transform">Fetch</button>
      </div>

      <div className="mx-6 mt-2.5 flex items-center gap-2 text-[11px] text-[var(--forest)]/65">
        No login. No spreadsheet.
      </div>

      {/* Auto-filled card */}
      {fetched && (
      <div className="mx-5 mt-4 rounded-2xl bg-white border border-[var(--border)] p-4 fade-rise">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[var(--terracotta)]">
          <Sparkles size={11} /> AUTO-FILLED IN 1.4S
        </div>
        <Field label="BUSINESS NAME" value="Tony's Café" />
        <Field label="CUISINE" value="Italian · handmade pasta" />
        <Field label="ADDRESS" value="📍 Hauptstätter Str. 14, 70173 Stuttgart" />
        <Field label="HOURS TODAY" value="🕐 11:30 – 22:00" />
        <Field label="PHONE" value="📞 +49 711 222 8841" />
        <div className="py-2.5 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-[var(--forest)]/55">AVERAGE TICKET</div>
            <div className="mt-0.5 text-[16px] text-[var(--forest)] font-semibold">€14.20</div>
          </div>
          <span className="text-[10px] text-[var(--forest)]/50 italic mb-0.5">estimated</span>
        </div>
      </div>

      )}
      {fetched && <div className="mx-5 mt-3 px-3 py-2 rounded-xl bg-[oklch(0.94_0.07_150)]/50 border border-[oklch(0.7_0.13_150)]/30 flex items-center gap-2 text-[11px] text-[oklch(0.4_0.1_150)]">
        <Check size={13} /> Looks right? Edit anything before continuing.
      </div>}

      <div className="mt-auto p-5">
        <button data-action="merchant-continue-challenge-fit" className="w-full py-4 rounded-full bg-[var(--forest)] text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all duration-300">
          Continue to goal setup
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 12 MARGIN SETUP (interactive slider · live profit-impact) ---------- */
export function S12Margin() {
  const [pos, setPos] = useState(22);
  const avg = (14.2 * pos / 100).toFixed(2);
  const covers = Math.round(8 + pos * 0.4);
  const rev = Math.round(80 + pos * 6);
  const mpt = (pos * 0.12).toFixed(1);
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const track = e.currentTarget as HTMLElement;
    const move = (ev: PointerEvent) => { const r = track.getBoundingClientRect(); setPos(Math.round(Math.max(0, Math.min(50, ((ev.clientX - r.left) / r.width) * 50)))); };
    move(e.nativeEvent);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const onSliderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        setPos((value) => Math.max(0, value - 1));
        break;
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        setPos((value) => Math.min(50, value + 1));
        break;
      case "Home":
        event.preventDefault();
        setPos(0);
        break;
      case "End":
        event.preventDefault();
        setPos(50);
        break;
      default:
        break;
    }
  };
  return (
    <Phone title="Margin setup" number={12}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button data-nav="back" aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300"><ChevronLeft size={16} /></button>
        <div className="flex-1 text-center font-display text-[15px] text-[var(--forest)]">Margins</div>
        <span className="text-[11px] text-[var(--forest)]/55">Step 2 / 3</span>
      </div>
      <div className="px-6 mt-3">
        <h2 className="font-display text-[24px] leading-[1.15] text-[var(--forest)]">How much can you<br /> afford to give back?</h2>
        <p className="text-[12px] text-[var(--forest)]/60 mt-2">Spot will never compose an offer above this ceiling. Change it any time.</p>
      </div>
      <div className="mx-5 mt-4 rounded-2xl bg-white border border-[var(--border)] p-4">
        <div className="flex items-start justify-between">
          <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">MAX DISCOUNT</div>
          <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">AVG PER TICKET</div>
        </div>
        <div className="mt-1 flex items-end justify-between">
          <div className="font-display text-[44px] text-[var(--forest)] leading-none">{pos}<span className="text-[20px]">%</span></div>
          <div className="font-display text-[28px] text-[var(--forest)] leading-none">€{avg}</div>
        </div>
        <div
          className="mt-5 relative h-2.5 rounded-full"
          tabIndex={0}
          role="slider"
          aria-label="Maximum discount percentage"
          aria-valuemin={0}
          aria-valuemax={50}
          aria-valuenow={pos}
          aria-valuetext={`${pos}%`}
          onPointerDown={startDrag}
          onKeyDown={onSliderKeyDown}
          style={{ background: "linear-gradient(90deg, var(--forest) 0%, var(--sand) 50%, var(--terracotta) 100%)", touchAction: "none", cursor: "pointer" }}
        >
          <div className="absolute -top-2 w-7 h-7 rounded-full bg-[var(--forest)] border-[3px] border-white shadow-lg transition-all" style={{ left: `calc(${pos * 2}% - 14px)` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-semibold text-[var(--forest)]/55"><span>0%</span><span>CAUTIOUS</span><span>GENEROUS</span><span>50%</span></div>
      </div>
      <div className="mx-5 mt-3 rounded-2xl bg-[var(--forest)] text-white p-4 relative overflow-hidden">
        <div className="text-[10px] font-bold tracking-widest text-[var(--sand)]">LIVE PROFIT-IMPACT PREVIEW</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-left">
          <div><div className="text-[10px] text-white/55">COVER</div><div className="font-display text-[22px] mt-1 leading-none">+{covers}<span className="text-[11px] text-white/55"> /day</span></div></div>
          <div><div className="text-[10px] text-white/55">REVENUE</div><div className="font-display text-[22px] mt-1 leading-none">+€{rev} <ArrowUpRight size={14} className="inline text-[oklch(0.78_0.13_150)]" /></div></div>
          <div><div className="text-[10px] text-white/55">NET MARGIN</div><div className="font-display text-[22px] mt-1 leading-none">−{mpt}pt <span className="text-[11px] text-[var(--terracotta)]">↓</span></div></div>
        </div>
        <svg viewBox="0 0 280 50" className="mt-3 w-full"><defs><linearGradient id="margin-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--sand)" stopOpacity="0.6" /><stop offset="100%" stopColor="var(--sand)" stopOpacity="0" /></linearGradient></defs>
          <path d="M0 38 L40 32 L80 30 L120 24 L160 22 L200 14 L240 10 L280 6" stroke="var(--sand)" strokeWidth="2.5" fill="none" style={{ strokeDasharray: 600, strokeDashoffset: 600, animation: "draw-path 1800ms ease-out 200ms forwards" }} />
          <path d="M0 38 L40 32 L80 30 L120 24 L160 22 L200 14 L240 10 L280 6 L280 50 L0 50 Z" fill="url(#margin-grad)" /></svg>
        <div className="text-[10px] text-white/55 mt-1">based on the last 30 days at this margin</div>
      </div>
      <div className="mt-auto p-5">
        <button data-action="merchant-lock-margin" className="w-full py-4 rounded-full bg-[var(--sand)] text-[var(--forest)] font-semibold shadow-lg shadow-[var(--sand)]/30 active:scale-95 transition-all duration-300">Lock in {pos}%</button>
      </div>
    </Phone>
  );
}

/* ---------- 13 GOAL STUDIO (natural-language → parsed rules + preview) ---------- */
export function S13Goal() {
  const [rules, setRules] = useState([
    { label: "Thursdays only", sand: false },
    { label: "14:00 – 17:00", sand: false },
    { label: "When < 30% capacity", sand: true },
    { label: "Coffee + sweet pairings", sand: true },
    { label: "Walking distance ≤ 400m", sand: false },
    { label: "Max 18% off", sand: false },
  ]);
  const extras = ["Regulars only", "Rain bonus +5%", "First-time visitors", "Weekdays"];
  const [extraIdx, setExtraIdx] = useState(0);
  return (
    <Phone title="Goal studio" number={13}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button data-nav="back" aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300"><ChevronLeft size={16} /></button>
        <div className="flex-1 text-center font-display text-[15px] text-[var(--forest)]">Goal studio</div>
        <div className="w-9" />
      </div>
      <div className="px-6 mt-3">
        <h2 className="font-display text-[24px] leading-[1.15] text-[var(--forest)]">Tell Spot what<br /> you're trying to fix.</h2>
      </div>
      <div className="mx-5 mt-2">
        <SectionFrame
          track="Rules + Explainability"
          status="In Progress"
          title="Natural language goals converted into guardrails"
          whatUserSees="Merchant intent parsed into editable rules and an example customer card preview."
          whyItMatters="Bridges campaign strategy to offer generation in a way the team can explain live."
        />
      </div>
      <div className="mx-5 mt-4 rounded-2xl bg-white border border-[var(--border)] p-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[var(--terracotta)]"><Sparkles size={11} /> YOUR WORDS</div>
        <div className="font-display text-[17px] text-[var(--forest)] leading-snug mt-2">"Fill my Thursday afternoon dip — it's dead between lunch and dinner."</div>
        <div className="mt-3 flex items-center justify-between">
          <button className="w-9 h-9 rounded-full bg-[var(--cream)] flex items-center justify-center text-[var(--forest)] active:scale-95 transition-all duration-300"><Mic size={14} /></button>
          <span className="text-[11px] text-[var(--forest)]/55">tap to re-record · 8s</span>
        </div>
      </div>
      <div className="px-6 mt-4 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[var(--forest)]/65">
        <Sparkles size={11} className="text-[var(--terracotta)]" /> PARSED INTO {rules.length} RULES
      </div>
      <div className="px-5 mt-2 flex flex-wrap gap-1.5">
        {rules.map((r, i) => (
          <button key={r.label} type="button" onClick={() => setRules(p => p.filter((_, j) => j !== i))}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer active:scale-95 transition-transform ${
              r.sand ? "bg-[var(--sand)]/35 text-[var(--forest)]" : "bg-[var(--forest)] text-white"
            }`}>{r.label} <X size={10} className="opacity-70" /></button>
        ))}
        <button type="button" onClick={() => { if (extraIdx < extras.length) { setRules(p => [...p, { label: extras[extraIdx], sand: false }]); setExtraIdx(i => i + 1); } }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white border border-dashed border-[var(--border)] text-[var(--forest)]/65 cursor-pointer active:scale-95 transition-transform">
          <Plus size={11} /> add rule
        </button>
      </div>

      {/* Preview */}
      <div className="mx-5 mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
        <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/55">PREVIEW · WHAT MIA WOULD SEE</div>
        <div className="mt-2 rounded-2xl bg-[var(--forest)] text-white p-4">
          <div className="text-[10px] font-bold tracking-widest text-[var(--sand)]">THURSDAY SLOW HOUR</div>
          <div className="font-display text-[16px] mt-1 leading-snug">
            "Tony's espresso &amp; cantucci · €4.50 instead of €6."
          </div>
          <div className="mt-2 text-[11px] text-white/65 flex items-center gap-3">
            <span>• 230 m</span><span>• until 17:00</span><span>• 6 left</span>
          </div>
        </div>
      </div>

      <div className="mt-auto p-5">
        <button data-action="merchant-configure-voice" className="w-full mb-2 py-3 rounded-full border border-[var(--forest)]/20 text-[var(--forest)] font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all duration-300">
          Configure voice identity <Mic size={14} />
        </button>
        <button data-action="merchant-submit-approval" className="w-full py-4 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-all duration-300">
          Submit for approval <Sparkles size={16} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 13b MERCHANT VOICE IDENTITY ---------- */
export function S13bVoiceIdentity() {
  const {
    merchantVoiceIdentity,
    setMerchantVoiceIdentity,
    voiceIdentityStatus,
  } = useSpotApp();

  const updateField = (key: keyof SpotMerchantVoiceIdentity, value: string) => {
    setMerchantVoiceIdentity({
      ...merchantVoiceIdentity,
      [key]: value,
    });
  };

  return (
    <Phone title="Voice identity" number={13}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button
          data-nav="back"
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center font-display text-[15px] text-[var(--forest)]">
          Voice sales agent
        </div>
        <div className="w-9" />
      </div>

      <div className="px-6 mt-3">
        <h2 className="font-display text-[24px] leading-[1.15] text-[var(--forest)]">
          Give your shop
          <br /> a voice personality.
        </h2>
        <p className="text-[12px] text-[var(--forest)]/65 mt-2">
          This will be used as the sales script context for your ElevenLabs voice agent.
        </p>
      </div>

      <div className="mx-5 mt-4 rounded-2xl border border-[var(--border)] bg-white p-4 space-y-3">
        <label className="block">
          <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">BRAND STORY</div>
          <textarea
            value={merchantVoiceIdentity.brandStory}
            onChange={(e) => updateField("brandStory", e.target.value)}
            placeholder="What makes your place special?"
            className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--forest)] min-h-[72px] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
          />
        </label>

        <label className="block">
          <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">
            MENU HIGHLIGHTS (comma separated)
          </div>
          <input
            value={merchantVoiceIdentity.menuHighlights}
            onChange={(e) => updateField("menuHighlights", e.target.value)}
            placeholder="cortado, pistachio croissant, seasonal soup"
            className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
          />
        </label>

        <label className="block">
          <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">
            PROMOTIONS (comma separated)
          </div>
          <input
            value={merchantVoiceIdentity.promotions}
            onChange={(e) => updateField("promotions", e.target.value)}
            placeholder="happy hour 14:00-17:00, lunch combo"
            className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">VOICE NAME</div>
            <input
              value={merchantVoiceIdentity.voiceName}
              onChange={(e) => updateField("voiceName", e.target.value)}
              placeholder="Warm Guide"
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
            />
          </label>
          <label className="block">
            <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">VOICE ID</div>
            <input
              value={merchantVoiceIdentity.voiceId}
              onChange={(e) => updateField("voiceId", e.target.value)}
              placeholder="elevenlabs_voice_id"
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">TONE</div>
            <input
              value={merchantVoiceIdentity.tone}
              onChange={(e) => updateField("tone", e.target.value)}
              placeholder="friendly"
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
            />
          </label>
          <label className="block">
            <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/60">LANGUAGE</div>
            <input
              value={merchantVoiceIdentity.language}
              onChange={(e) => updateField("language", e.target.value)}
              placeholder="en"
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
            />
          </label>
        </div>
      </div>

      {voiceIdentityStatus && (
        <div className="mx-5 mt-3 rounded-xl bg-[var(--cream)] border border-[var(--border)] px-3 py-2 text-[11px] text-[var(--forest)]/75">
          {voiceIdentityStatus}
        </div>
      )}

      <div className="mt-auto p-5">
        <button
          data-action="save-voice-identity"
          className="w-full py-4 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-all duration-300"
        >
          Save voice identity <Mic size={16} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 14 MERCHANT APPROVAL ---------- */
export function S14MerchantApproval() {
  return (
    <Phone title="Merchant approval" number={14}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button data-nav="back" aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center font-display text-[15px] text-[var(--forest)]">Challenge review</div>
        <div className="w-9" />
      </div>
      <div className="px-6 mt-4">
        <h2 className="font-display text-[24px] leading-[1.15] text-[var(--forest)]">
          Your business is in
          <br /> manual review.
        </h2>
        <p className="text-[12px] text-[var(--forest)]/65 mt-2 leading-relaxed">
          We activate merchants that match this pilot focus (local food, coffee, bakery, and nearby walk-in shops).
        </p>
      </div>
      <div className="mx-5 mt-4 rounded-2xl bg-white border border-[var(--border)] p-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--sand)]/35 text-[var(--forest)]">
          <Clock size={12} /> Approval status: Pending
        </div>
        <div className="mt-4 space-y-2 text-[12px] text-[var(--forest)]/75">
          <div className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-[var(--forest)]" />Profile details captured from your Maps link.</div>
          <div className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-[var(--forest)]" />Margin guardrails and campaign rules saved.</div>
          <div className="flex items-start gap-2"><Users size={14} className="mt-0.5 text-[var(--terracotta)]" />Team review required before offers can go live.</div>
        </div>
      </div>
      <div className="mx-5 mt-3 rounded-2xl bg-[var(--forest)] text-white p-4">
        <div className="text-[10px] font-bold tracking-widest text-[var(--sand)]">WHY THIS LAYER</div>
        <div className="font-display text-[17px] mt-1 leading-snug">
          Keeps activation quality high for the business types currently supported.
        </div>
      </div>
      <div className="mt-auto p-5">
        <button data-action="merchant-simulate-approval" className="w-full py-4 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-all duration-300">
          Simulate approval
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 15 LIVE DASHBOARD ---------- */
export function S14Dashboard() {
  const Tile = ({ icon, label, value, delta, deltaPositive = true }: any) => (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-3.5 fade-rise">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--forest)]">{icon}</div>
        <span className={`text-[10px] font-bold ${deltaPositive ? "text-[oklch(0.55_0.15_150)]" : "text-[var(--terracotta)]"}`}>
          {delta}
        </span>
      </div>
      <div className="font-display text-[26px] text-[var(--forest)] mt-2 leading-none">{value}</div>
      <div className="text-[11px] text-[var(--forest)]/60 mt-1">{label}</div>
    </div>
  );
  const bars = [22, 30, 28, 38, 34, 44, 56, 50, 72, 60, 48, 40];
  return (
    <Phone title="Live dashboard" number={14}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-start justify-between">
        <div>
          <div className="text-[11px] text-[var(--forest)]/55">Tony's Café · Stuttgart</div>
          <h2 className="font-display text-[26px] text-[var(--forest)] leading-tight">Today, so far</h2>
        </div>
        <button className="relative w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-[var(--forest)] active:scale-95 transition-all duration-300">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--sand)]" />
        </button>
      </div>
      <div className="px-5 mt-2">
        <SectionFrame
          track="Merchant Dashboard"
          status="In Progress"
          title="KPI + context performance command center"
          whatUserSees="Revenue and walk-in KPIs with campaign performance cards and live offer monitoring."
          whyItMatters="Makes merchant value visible in real time with practical decision signals."
        />
      </div>

      <div className="px-5 mt-3 grid grid-cols-2 gap-2.5">
        <Tile icon={<Euro size={15} />} label="Revenue lift" value="+€186" delta="+12%" />
        <Tile icon={<Users size={15} />} label="Walk-ins from Spot" value="14" delta="+5" />
        <Tile icon={<Activity size={15} />} label="Accept rate" value="38%" delta="+4pt" />
        <Tile icon={<Footprints size={15} />} label="Avg distance" value="120m" delta="−20m" />
      </div>

      {/* Bar chart card */}
      <div className="mx-5 mt-3 rounded-2xl bg-[var(--forest)] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold tracking-widest text-[var(--sand)]">REDEMPTIONS TODAY</div>
          <span className="text-[10px] text-white/55 lowercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--sand)] animate-pulse" /> live
          </span>
        </div>
        <div className="mt-3 h-24 flex items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md bar-grow"
              style={{
                height: `${h}%`,
                background: i === 8 ? "var(--sand)" : "rgba(255,255,255,0.18)",
                animationDelay: `${i * 60}ms`,
              }} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-white/45 mt-1.5">
          <span>09</span><span>11</span><span>13</span><span>15</span><span>17</span><span>19</span>
        </div>
      </div>

      <div className="mx-5 mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
          <div className="spot-kicker">Funnel</div>
          <div className="mt-1 text-[12px] text-[var(--forest)]/75">Impression 124 → Accept 47 → Redeem 14</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
          <div className="spot-kicker">Budget</div>
          <div className="mt-1 text-[12px] text-[var(--forest)]/75">€74 used of €180 daily cap</div>
        </div>
      </div>
      <div className="mx-5 mt-2 rounded-2xl border border-[var(--border)] bg-white p-3">
        <div className="spot-kicker">Context Heatmap (placeholder)</div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {["RainLunch", "ClearLunch", "RainEvening", "ClearEvening"].map((cell, index) => (
            <div
              key={cell}
              className="h-10 rounded-lg"
              style={{ background: index % 2 === 0 ? "var(--sand)" : "var(--cream)" }}
              title={cell}
            />
          ))}
        </div>
      </div>

      {/* Live offers */}
      <div className="px-5 mt-3 flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/65">LIVE OFFERS · 3</div>
        <button data-action="merchant-manage-voice" className="text-[11px] text-[var(--terracotta)] font-semibold active:scale-95 transition-all duration-300">manage</button>
      </div>
      <div className="px-5 mt-2 space-y-1.5">
        {[
          { dot: "var(--terracotta)", icon: "🔥", t: "Rainy-day pasta", s: "−€3.40 · ends 13:30", v: "42%", a: "ACCEPT" },
          { dot: "var(--forest)", icon: "·", t: "Slow-hour espresso & ca…", s: "−25% · 14:00–17:00", v: "31%", a: "ACCEPT" },
          { dot: "var(--forest)", icon: "·", t: "Late-night tiramisu", s: "−€2 · 21:00–22:30", v: "18%", a: "ACCEPT" },
        ].map((o, i) => (
          <div key={o.t} className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-[var(--border)]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
              style={{ background: i === 0 ? "var(--sand)" : "var(--cream)" }}>{o.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[13px] text-[var(--forest)] leading-tight truncate">{o.t}</div>
              <div className="text-[10px] text-[var(--forest)]/60">{o.s}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-[14px] text-[var(--forest)] leading-none">{o.v}</div>
              <div className="text-[9px] tracking-widest text-[var(--forest)]/55">{o.a}</div>
            </div>
            <ChevronRight size={14} className="text-[var(--forest)]/30" />
          </div>
        ))}
      </div>
      <div className="mx-5 mt-2 rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-3">
        <div className="spot-kicker">Why this offer (drawer preview)</div>
        <p className="mt-1 text-[12px] text-[var(--forest)]/75">
          Rain + lunch slowdown + remaining budget combine to prioritize the pasta offer for nearby users.
        </p>
      </div>

      <div className="mt-auto p-5">
        <button data-action="merchant-open-scanner" className="w-full py-4 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-all duration-300"><ScanLine size={16} /> Open scanner</button>
      </div>
    </Phone>
  );
}

/* ---------- 16 MERCHANT QR SCANNER ---------- */
export function S15Scanner() {
  const { userName } = useSpotApp();
  return (
    <Phone title="QR scanner" number={15} bg="ink">
      <StatusBar dark />
      <div className="absolute inset-0">
        {/* fake camera background */}
        <div className="w-full h-full" style={{
          background: "radial-gradient(ellipse at center, #2a2421 0%, #0c0a09 70%)"
        }} />
      </div>
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-white">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--sand)]">SCAN CUSTOMER CODE</div>

        {/* viewfinder */}
        <div className="relative mt-4 w-64 h-64 rounded-3xl">
          <div className="absolute inset-0 rounded-3xl border-2 border-white/15" />
          {/* corners */}
          {["top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
            "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl"].map((c, i) => (
            <span key={i} className={`absolute w-10 h-10 border-[var(--terracotta)] ${c}`} />
          ))}
          {/* success state */}
          <div className="absolute inset-6 rounded-2xl bg-[var(--forest)]/95 flex flex-col items-center justify-center qr-mat">
            <div className="w-16 h-16 rounded-full bg-[var(--cream)] flex items-center justify-center">
              <Check size={36} className="text-[var(--forest)]" strokeWidth={3} />
            </div>
            <div className="font-display text-[18px] mt-3">{(userName || "Guest").trim()} · cortado + pastry</div>
            <div className="text-[12px] text-white/70">−€3.40 · valid</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="font-display text-[18px]">Confirmed at 13:04</div>
          <div className="text-[12px] text-white/60 mt-1">Today's 13th redemption · keep it up</div>
        </div>
      </div>
      <div className="relative p-5">
        <button data-action="merchant-scan-next" className="w-full h-12 rounded-full bg-[var(--terracotta)] text-white font-semibold active:scale-95 transition-all duration-300">
          Scan next customer
        </button>
        <button data-action="open-coverage" className="w-full mt-2 h-10 rounded-full bg-white/10 border border-white/20 text-white text-[12px] font-medium active:scale-95 transition-all duration-300">
          Roadmap coverage
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 16 ROADMAP COVERAGE ---------- */
export function S16RoadmapCoverage() {
  const coverageRows: Array<{
    status: CoverageStatus;
    title: string;
    whatUserSees: string;
    whyItMatters: string;
  }> = [
    {
      status: "Implemented",
      title: "Consumer discovery + redemption loop",
      whatUserSees: "Offer feed, offer detail, QR redemption, and confirmation outcomes.",
      whyItMatters: "Demonstrates the complete consumer value chain in one pass.",
    },
    {
      status: "Implemented",
      title: "Privacy-first controls",
      whatUserSees: "Device/cloud signal split, controls, and full privacy policy screens.",
      whyItMatters: "Supports trust and compliance story with visible controls.",
    },
    {
      status: "In Progress",
      title: "Merchant decision intelligence",
      whatUserSees: "Dashboard cards for funnel, context heatmap, budget, and offer explanations.",
      whyItMatters: "Shows where merchant analytics are heading while keeping UI consistent.",
    },
    {
      status: "Planned",
      title: "Expanded model runtime and operations polish",
      whatUserSees: "Roadmap callouts for ONNX runtime and expanded operational readiness.",
      whyItMatters: "Sets expectations for next milestones without changing API behavior.",
    },
  ];

  const mustShow = [
    "At least two active context signals",
    "Generated offer clarity in under 3 seconds",
    "Accept and redeem simulation from customer to merchant scanner",
    "Merchant KPI and context rationale visibility",
    "Clear privacy and on-device positioning",
  ];

  return (
    <Phone title="Roadmap coverage" number={16}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button data-nav="back" aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center font-display text-[16px] text-[var(--forest)]">Roadmap coverage</div>
        <div className="w-9" />
      </div>
      <div className="px-5 pb-5 space-y-3 overflow-y-auto">
        <div className="spot-section-frame">
          <div className="spot-kicker">Experience Alignment</div>
          <div className="spot-title mt-1.5">What this frontend now shows consistently</div>
          <p className="spot-explain mt-2">
            Every major flow now exposes implementation status, visible UX proof, and why the section exists.
          </p>
        </div>
        {coverageRows.map((row) => (
          <SectionFrame
            key={row.title}
            track="Coverage item"
            status={row.status}
            title={row.title}
            whatUserSees={row.whatUserSees}
            whyItMatters={row.whyItMatters}
          />
        ))}
        <div className="spot-section-frame">
          <div className="spot-kicker">Must-Show Checklist</div>
          <div className="mt-2 space-y-1.5">
            {mustShow.map((item) => (
              <div key={item} className="flex items-start gap-2 text-[12px] text-[var(--forest)]/80">
                <Check size={13} className="text-[var(--forest)] mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Phone>
  );
}

/* ---------- 17 FULL PRIVACY POLICY ---------- */
export function S16PrivacyPolicy() {
  return (
    <Phone title="Privacy policy" number={17}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button data-nav="back" aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center active:scale-95 transition-all duration-300">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center font-display text-[16px] text-[var(--forest)]">Privacy policy</div>
        <div className="w-9" />
      </div>
      <div className="px-5 pb-5 space-y-3 overflow-y-auto">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h3 className="font-display text-[18px] text-[var(--forest)]">1. What we collect</h3>
          <p className="text-[12px] text-[var(--forest)]/70 mt-1 leading-relaxed">
            Spot collects account basics (name, email), offer interactions, and redemption events needed to run offers and
            measure savings. Location and behavior preference data are processed on-device whenever possible.
          </p>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h3 className="font-display text-[18px] text-[var(--forest)]">2. How we use data</h3>
          <p className="text-[12px] text-[var(--forest)]/70 mt-1 leading-relaxed">
            We use data to generate context-aware deals, prevent abuse, and show you value metrics like cashback and money
            saved. We do not sell personal data or run third-party ad profiling.
          </p>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h3 className="font-display text-[18px] text-[var(--forest)]">3. Storage and retention</h3>
          <p className="text-[12px] text-[var(--forest)]/70 mt-1 leading-relaxed">
            Offer and redemption records are stored to support settlement, analytics, and fraud checks. We minimize retention
            windows and keep only what is required for product operation and legal obligations.
          </p>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h3 className="font-display text-[18px] text-[var(--forest)]">4. Your controls</h3>
          <p className="text-[12px] text-[var(--forest)]/70 mt-1 leading-relaxed">
            You can manage notification settings, disable optional signals, or wipe local memory from Privacy settings. You may
            request account deletion and data export through support.
          </p>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h3 className="font-display text-[18px] text-[var(--forest)]">5. Contact and updates</h3>
          <p className="text-[12px] text-[var(--forest)]/70 mt-1 leading-relaxed">
            Contact privacy@spot.app for requests. We may update this policy as the product evolves and will reflect the latest
            revision date in-app.
          </p>
        </section>
        <button data-nav="coverage" className="w-full py-3 rounded-full bg-[var(--forest)] text-white text-[13px] font-semibold active:scale-95 transition-all duration-300">
          View roadmap coverage
        </button>
      </div>
    </Phone>
  );
}
