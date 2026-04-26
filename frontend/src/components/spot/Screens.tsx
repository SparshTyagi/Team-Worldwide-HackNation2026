import { useState } from "react";
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
  Mic,
  Trash2,
  Bell as BellIcon,
  Users,
  Euro,
  Activity,
  ArrowUpRight,
  Plus,
} from "lucide-react";

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
          tuning into Stuttgart
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
      <div className="relative flex-1 mx-4 rounded-3xl overflow-hidden border border-[var(--border)]">
        <div className="relative w-full h-full spot-map-clean overflow-hidden">
          {/* Sequential dashed routes — Home → Work, then Work → Tony's.
              SVG viewBox uses 0..100 normalized space and stretches with the container so
              that path coords match the pin percentages exactly. */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Home (20,18) -> Work (80,78) */}
            <path
              d="M20 18 C 38 38, 58 56, 80 78"
              stroke="var(--terracotta)"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="0.8 2.4"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              className="draw-path"
              style={{ strokeWidth: 3 } as any}
            />
            {/* Work (80,78) -> Tony's (22,70) */}
            <path
              d="M80 78 C 60 78, 40 76, 22 70"
              stroke="var(--forest)"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="0.8 2.4"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              className="draw-path-2"
              style={{ strokeWidth: 3 } as any}
            />
          </svg>

          {/* Pins — outer wrapper handles positioning (transform places pin TIP on coord),
              inner wrapper handles drop-in animation so they don't fight over transform. */}
          <div className="absolute" style={{ left: "20%", top: "18%", transform: "translate(-50%, -42px)" }}>
            <div className="pin-drop" style={{ animationDelay: "200ms" }}>
              <HandPin label="Home" color="var(--forest)" />
            </div>
          </div>
          <div className="absolute" style={{ left: "80%", top: "78%", transform: "translate(-50%, -42px)" }}>
            <div className="pin-drop" style={{ animationDelay: "1900ms" }}>
              <HandPin label="Work" color="var(--terracotta)" />
            </div>
          </div>
          <div className="absolute" style={{ left: "22%", top: "70%", transform: "translate(-50%, -42px)" }}>
            <div className="pin-drop" style={{ animationDelay: "3700ms" }}>
              <HandPin label="Tony's ☕" color="var(--sand)" pulsing />
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">
        <button className="w-full h-13 py-3.5 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30">
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 03 ONBOARDING — meal-time rail sliders + chips ---------- */
export function S03Meals() {
  const [vals, setVals] = useState([0.42, 0.55, 0.72]);
  const [chips, setChips] = useState([true, true, true, false, true, false, true, false, true]);
  const chipNames = ["Coffee", "Bakery", "Italian", "Asian", "Healthy", "Wine bars", "Bistro", "Vegan", "Sweet"];
  const fmtTime = (v: number) => { const h = Math.floor(6 + v * 16); const m = Math.floor(((6 + v * 16) - h) * 60); return `${String(h).padStart(2,"0")}:${String(Math.round(m / 5) * 5).padStart(2,"0")}`; };
  const startDrag = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    const track = (e.currentTarget as HTMLElement);
    const move = (ev: PointerEvent) => { const r = track.getBoundingClientRect(); setVals(p => { const n=[...p]; n[i]=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)); return n; }); };
    move(e.nativeEvent);
    const up = () => { window.removeEventListener("pointermove",move); window.removeEventListener("pointerup",up); };
    window.addEventListener("pointermove",move); window.addEventListener("pointerup",up);
  };
  const railIcons = [<Coffee size={15} />, <UtensilsCrossed size={15} />, <Wine size={15} />];
  const railLabels = ["Coffee", "Lunch", "Dinner"];
  return (
    <Phone title="Onboarding · Taste" number={3}>
      <StatusBar />
      <div className="px-6 pb-1">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--terracotta)]">STEP 2 OF 4</div>
        <div className="mt-1 flex gap-1.5"><span className="h-1 flex-1 rounded-full bg-[var(--forest)]" /><span className="h-1 flex-1 rounded-full bg-[var(--forest)]" /><span className="h-1 flex-1 rounded-full bg-[var(--border)]" /><span className="h-1 flex-1 rounded-full bg-[var(--border)]" /></div>
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
            <div className="rail-track mt-2.5" onPointerDown={startDrag(i)} style={{ touchAction: "none", cursor: "pointer" }}>
              <div className="rail-base" /><div className="rail-fill" style={{ width: `${vals[i]*100}%` }} />
              {[0,0.25,0.5,0.75,1].map(t => <span key={t} className="rail-tick" style={{ left: `${t*100}%` }} />)}
              <span className="rail-thumb" style={{ left: `${vals[i]*100}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-[var(--forest)]/45 font-medium"><span>earlier</span><span>later</span></div>
          </div>
        ))}
      </div>
      <div className="px-6 mt-3">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--forest)]/55 mb-1.5">TASTES YOU TRUST</div>
        <div className="flex flex-wrap gap-1.5">
          {chipNames.map((l, i) => (
            <span key={l} onClick={() => setChips(p => { const n=[...p]; n[i]=!n[i]; return n; })}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                chips[i] ? "bg-[var(--forest)] text-white border-[var(--forest)]" : "bg-white text-[var(--forest)] border-[var(--border)]"
              }`}>{l}</span>
          ))}
        </div>
      </div>
      <div className="mt-auto px-5 pt-3 pb-4">
        <button className="w-full py-3.5 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30">Looks right</button>
      </div>
    </Phone>
  );
}

/* ---------- 04 PERMISSIONS ---------- */
export function S04Permissions() {
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
      <div className="mt-auto p-5">
        <button className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30">
          Finish setup <ChevronRight size={18} />
        </button>
        <button className="w-full mt-2 h-10 text-sm text-[var(--forest)]/60">Read the full policy</button>
      </div>
    </Phone>
  );
}

/* ---------- 04b DIETARY & ACCESSIBILITY ---------- */
export function S04bDietary() {
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
    <div onClick={() => setAccs(p => { const n=[...p]; n[idx]=!n[idx]; return n; })} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[var(--border)] cursor-pointer">
      <div className="w-9 h-9 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--terracotta)]">{icon}</div>
      <div className="flex-1">
        <div className="font-display text-[14px] text-[var(--forest)] leading-tight">{label}</div>
        <div className="text-[11px] text-[var(--forest)]/60">{desc}</div>
      </div>
      <span className={`w-9 h-5 rounded-full p-0.5 flex transition-all ${accs[idx] ? "bg-[var(--terracotta)] justify-end" : "bg-[var(--border)] justify-start"}`}>
        <span className="w-4 h-4 rounded-full bg-white shadow" />
      </span>
    </div>
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
          <Acc icon={<Accessibility size={16} />} label="Step-free entrance only" desc="Show offers Mia can roll into." idx={0} />
          <Acc icon={<Eye size={16} />} label="High-contrast cards" desc="Larger text, AAA contrast." idx={1} />
          <Acc icon={<Mic size={16} />} label="Read offers aloud" desc="VoiceOver-friendly summaries." idx={2} />
        </div>
      </div>

      <div className="mt-auto p-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--cream)] mb-3 text-[11px] text-[var(--forest)]/70">
          <Shield size={11} className="text-[var(--terracotta)]" />
          All filters stay on this phone.
        </div>
        <button className="w-full py-4 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30">
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 05 HOME / FEED ---------- */
export function S05Feed() {
  return (
    <Phone title="Home — feed" number={5}>
      <StatusBar />
      <div className="px-6 pb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-[var(--forest)]/60">Hi Mia,</div>
          <div className="font-display text-[22px] text-[var(--forest)] leading-tight">3 little reasons to step out.</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--sand)] flex items-center justify-center font-display text-[var(--forest)]">M</div>
      </div>

      {/* Context pill */}
      <div className="px-6">
        <div className="context-pulse inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[var(--border)] text-[12px] font-medium text-[var(--forest)]">
          <CloudRain size={14} className="text-[var(--accent)]" />
          11°C · light rain · Tuesday lunch
        </div>
      </div>

      {/* Cards — 3 visually distinct */}
      <div className="flex-1 overflow-hidden mt-3 px-5 space-y-3 pb-3">
        {/* Card 1 — vertical photo card */}
        <div className="fade-rise relative rounded-3xl overflow-hidden bg-white border border-[var(--border)] shadow-sm" style={{ animationDelay: "60ms" }}>
          <div className="relative h-32 grain">
            <img src={cafeImg} alt="Tony's café" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-[10px] font-semibold text-[var(--forest)]">
              <Footprints size={10} /> 80m
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[var(--terracotta)] text-white text-[10px] font-semibold flex items-center gap-1">
              <Clock size={10} /> 14 min left
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-[18px] text-[var(--forest)] leading-tight">Tony just brewed a fresh batch.</div>
                <div className="text-xs text-[var(--forest)]/60 mt-1">Tony's Café · cortado + pastry</div>
              </div>
              <div className="text-right">
                <div className="font-display text-[22px] text-[var(--terracotta)] leading-none">−€3.40</div>
                <div className="text-[10px] text-[var(--forest)]/50 mt-0.5">was €8.40</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 — horizontal pill */}
        <div className="fade-rise flex items-center gap-3 rounded-full bg-[var(--forest)] text-white p-2 pr-5 shadow-sm" style={{ animationDelay: "160ms" }}>
          <img src={bakeryImg} alt="" className="w-14 h-14 rounded-full object-cover" />
          <div className="flex-1">
            <div className="text-[13px] font-semibold leading-tight">Pain au chocolat, half off.</div>
            <div className="text-[11px] text-white/60">Boulangerie Marie · 220m · ends 13:30</div>
          </div>
          <div className="font-display text-lg text-[var(--sand)]">−50%</div>
        </div>

        {/* Card 3 — minimal text card */}
        <div className="fade-rise rounded-3xl bg-[var(--cream)] border-2 border-dashed border-[var(--terracotta)]/40 p-4" style={{ animationDelay: "260ms" }}>
          <div className="text-[10px] font-semibold tracking-widest text-[var(--terracotta)]">RAINY-DAY WHISPER</div>
          <div className="font-display text-[19px] text-[var(--forest)] leading-tight mt-1">A bowl of ramen, three streets over.</div>
          <div className="flex items-center justify-between mt-3 text-xs text-[var(--forest)]/70">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Footprints size={12} /> 340m</span>
              <span className="flex items-center gap-1"><Clock size={12} /> 22 min</span>
            </span>
            <span className="font-display text-base text-[var(--terracotta)]">−€2.10</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-t border-[var(--border)] px-10 py-3 flex justify-between bg-white">
        <button className="flex flex-col items-center gap-0.5"><Sparkles size={22} className="text-[var(--terracotta)]" /><span className="text-[9px] font-semibold text-[var(--terracotta)]">Feed</span></button>
        <button className="flex flex-col items-center gap-0.5"><MapPin size={22} className="text-[var(--forest)]/40" /><span className="text-[9px] text-[var(--forest)]/40">Map</span></button>
        <button className="flex flex-col items-center gap-0.5"><Clock size={22} className="text-[var(--forest)]/40" /><span className="text-[9px] text-[var(--forest)]/40">History</span></button>
        <button className="flex flex-col items-center gap-0.5"><Shield size={22} className="text-[var(--forest)]/40" /><span className="text-[9px] text-[var(--forest)]/40">Privacy</span></button>
      </div>
    </Phone>
  );
}

/* ---------- 06 OFFER DETAIL ---------- */
export function S06OfferDetail() {
  return (
    <Phone title="Offer detail" number={6}>
      <div className="relative h-72 grain">
        <img src={cafeImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[var(--cream)]" />
        <StatusBar dark />
        <button className="absolute top-16 left-5 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
        <button className="absolute top-16 right-5 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
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
              <div className="text-xs text-[var(--forest)]/60">Tony's Café · Marienstr. 14</div>
              <h2 className="font-display text-[24px] text-[var(--forest)] leading-tight mt-0.5">
                Tony just brewed a fresh batch — and it's quiet today.
              </h2>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-4xl text-[var(--terracotta)] leading-none">−€3.40</span>
            <span className="text-sm text-[var(--forest)]/50 line-through">€8.40</span>
            <span className="ml-auto inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[var(--cream)] text-[var(--forest)] text-[11px] font-semibold whitespace-nowrap leading-none">
              cortado + pastry
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
        <button className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold shadow-lg shadow-[var(--terracotta)]/30 flex items-center justify-center gap-2">
          Redeem now <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 07 WALK THE WALLET ---------- */
export function S07Walk() {
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
            <div className="pin-drop" style={{ animationDelay: "1700ms" }}>
              <HandPin color="var(--forest)" pulsing label="Tony's · −€3.40" />
            </div>
          </div>
          <div className="absolute" style={{ left: "78%", top: "45%", transform: "translate(-50%, -42px)" }}>
            <div className="pin-drop" style={{ animationDelay: "3500ms" }}>
              <HandPin color="var(--terracotta)" pulsing label="Marie · −50%" />
            </div>
          </div>
          <div className="absolute" style={{ left: "70%", top: "18%", transform: "translate(-50%, -42px)" }}>
            <div className="pin-drop" style={{ animationDelay: "5500ms" }}>
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
            <div className="font-display text-xl text-[var(--terracotta)]">−€3.40</div>
          </div>
          <button className="mt-3 w-full h-12 rounded-full bg-[var(--terracotta)] text-white font-semibold">
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

        <button className="mt-5 px-5 py-2 rounded-full qr-redeem-secondary text-[12px] transition">
          Simulate scan →
        </button>
      </div>
      <div className="relative p-5 pb-7">
        <button className="w-full py-4 rounded-full qr-redeem-cancel text-[var(--paper)] font-semibold transition">
          Cancel redeem
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 09 CONFIRMATION ---------- */
export function S09Confirm() {
  const colors = ["var(--terracotta)", "var(--forest)", "var(--sand)", "#2EA06D"];
  // Smoother confetti — full width, varied speeds, drift via CSS var
  const pieces = Array.from({ length: 36 }).map((_, i) => {
    const left = (i * 17) % 100;
    const drift = ((i * 53) % 80) - 40; // -40 to +40 px sideways
    const dur = 2200 + ((i * 137) % 1500);
    const delay = (i % 12) * 90;
    return { i, left, drift, dur, delay, c: colors[i % 4] };
  });
  return (
    <Phone title="Confirmation" number={9}>
      <StatusBar />
      {/* Confetti — starts above viewport, drifts smoothly */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {pieces.map((p) => (
          <span
            key={p.i}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.c,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.dur}ms`,
              ["--cx" as any]: `${p.drift}px`,
              transform: `rotate(${p.i * 27}deg)`,
              opacity: 0,
            }}
          />
        ))}
      </div>

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
          You saved <span className="text-[var(--terracotta)]">€3.40</span>
        </h2>
        <p className="mt-3 text-[13px] text-[var(--forest)]/65 max-w-[260px] leading-relaxed">
          Your cortado &amp; pastry are on their way to the table.
        </p>

        {/* Three-stat box */}
        <div className="mt-8 w-full bg-white rounded-2xl border border-[var(--border)] shadow-sm p-4 flex items-stretch text-left fade-rise" style={{ animationDelay: "500ms" }}>
          <div className="flex-1 px-2">
            <div className="font-display text-[18px] text-[var(--forest)] leading-none">€3.40</div>
            <div className="text-[10px] text-[var(--forest)]/55 mt-1.5 font-medium">today</div>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div className="flex-1 px-2">
            <div className="font-display text-[18px] text-[var(--forest)] leading-none">€42.10</div>
            <div className="text-[10px] text-[var(--forest)]/55 mt-1.5 font-medium">this month</div>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div className="flex-1 px-2">
            <div className="font-display text-[18px] text-[var(--forest)] leading-none">17</div>
            <div className="text-[10px] text-[var(--forest)]/55 mt-1.5 font-medium">spots tried</div>
          </div>
        </div>
      </div>

      <div className="p-5 pb-7">
        <button className="w-full py-4 rounded-full bg-[var(--forest)] text-white font-semibold shadow-lg shadow-[var(--forest)]/25">
          Done
        </button>
        <button className="w-full mt-2 text-[12px] text-[var(--forest)]/55">Rate Tony's in 5 seconds</button>
      </div>
    </Phone>
  );
}

/* ---------- 10 SETTINGS / PRIVACY (redesigned per reference) ---------- */
export function S10Settings() {
  const [toggles, setToggles] = useState([true, true, true, true, false]);
  const Toggle = ({ idx }: { idx: number }) => (
    <span onClick={() => setToggles(p => { const n=[...p]; n[idx]=!n[idx]; return n; })}
      className={`w-10 h-6 rounded-full p-0.5 flex items-center transition-all cursor-pointer ${toggles[idx] ? "bg-[var(--terracotta)] justify-end" : "bg-[var(--border)] justify-start"}`}>
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </span>
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
        <button className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center font-display text-[16px] text-[var(--forest)]">Privacy</div>
        <div className="w-9" />
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

      <div className="mt-auto pb-4 flex items-center justify-center gap-1.5 text-[11px] text-[var(--forest)]/55">
        <Bell size={11} /> Last sync · 2 minutes ago
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
        <button className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center">
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

      {/* URL field */}
      <div className="mx-5 mt-4 rounded-2xl bg-white border border-[var(--border)] p-2 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--forest)]/60">
          <Link2 size={15} />
        </div>
        <span className="flex-1 truncate text-[12px] text-[var(--forest)]">maps.app.goo.gl/tonysCafeStuttg…</span>
        <button onClick={() => setFetched(f => !f)} className="px-4 py-2 rounded-xl bg-[var(--forest)] text-white text-[12px] font-semibold active:scale-95 transition-transform">Fetch</button>
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
        <button className="w-full py-4 rounded-full bg-[var(--forest)] text-white font-semibold flex items-center justify-center gap-2">
          Continue to margins
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
  return (
    <Phone title="Margin setup" number={12}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center"><ChevronLeft size={16} /></button>
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
        <div className="mt-5 relative h-2.5 rounded-full" onPointerDown={startDrag} style={{ background: "linear-gradient(90deg, var(--forest) 0%, var(--sand) 50%, var(--terracotta) 100%)", touchAction: "none", cursor: "pointer" }}>
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
        <button className="w-full py-4 rounded-full bg-[var(--sand)] text-[var(--forest)] font-semibold shadow-lg shadow-[var(--sand)]/30">Lock in {pos}%</button>
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
        <button className="w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center"><ChevronLeft size={16} /></button>
        <div className="flex-1 text-center font-display text-[15px] text-[var(--forest)]">Goal studio</div>
        <div className="w-9" />
      </div>
      <div className="px-6 mt-3">
        <h2 className="font-display text-[24px] leading-[1.15] text-[var(--forest)]">Tell Spot what<br /> you're trying to fix.</h2>
      </div>
      <div className="mx-5 mt-4 rounded-2xl bg-white border border-[var(--border)] p-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[var(--terracotta)]"><Sparkles size={11} /> YOUR WORDS</div>
        <div className="font-display text-[17px] text-[var(--forest)] leading-snug mt-2">"Fill my Thursday afternoon dip — it's dead between lunch and dinner."</div>
        <div className="mt-3 flex items-center justify-between">
          <button className="w-9 h-9 rounded-full bg-[var(--cream)] flex items-center justify-center text-[var(--forest)]"><Mic size={14} /></button>
          <span className="text-[11px] text-[var(--forest)]/55">tap to re-record · 8s</span>
        </div>
      </div>
      <div className="px-6 mt-4 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[var(--forest)]/65">
        <Sparkles size={11} className="text-[var(--terracotta)]" /> PARSED INTO {rules.length} RULES
      </div>
      <div className="px-5 mt-2 flex flex-wrap gap-1.5">
        {rules.map((r, i) => (
          <span key={r.label} onClick={() => setRules(p => p.filter((_, j) => j !== i))}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer active:scale-95 transition-transform ${
              r.sand ? "bg-[var(--sand)]/35 text-[var(--forest)]" : "bg-[var(--forest)] text-white"
            }`}>{r.label} <X size={10} className="opacity-70" /></span>
        ))}
        <span onClick={() => { if (extraIdx < extras.length) { setRules(p => [...p, { label: extras[extraIdx], sand: false }]); setExtraIdx(i => i + 1); } }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white border border-dashed border-[var(--border)] text-[var(--forest)]/65 cursor-pointer active:scale-95 transition-transform">
          <Plus size={11} /> add rule
        </span>
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
        <button className="w-full py-4 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30">
          Launch goal <Sparkles size={16} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 14 LIVE DASHBOARD ---------- */
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
        <button className="relative w-9 h-9 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-[var(--forest)]">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--sand)]" />
        </button>
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

      {/* Live offers */}
      <div className="px-5 mt-3 flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-widest text-[var(--forest)]/65">LIVE OFFERS · 3</div>
        <button className="text-[11px] text-[var(--terracotta)] font-semibold">manage</button>
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

      <div className="mt-auto p-5">
        <button className="w-full py-4 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30"><ScanLine size={16} /> Open scanner</button>
      </div>
    </Phone>
  );
}

/* ---------- 15 MERCHANT QR SCANNER ---------- */
export function S15Scanner() {
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
            <div className="font-display text-[18px] mt-3">Mia · cortado + pastry</div>
            <div className="text-[12px] text-white/70">−€3.40 · valid</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="font-display text-[18px]">Confirmed at 13:04</div>
          <div className="text-[12px] text-white/60 mt-1">Today's 13th redemption · keep it up</div>
        </div>
      </div>
      <div className="relative p-5">
        <button className="w-full h-12 rounded-full bg-[var(--terracotta)] text-white font-semibold">
          Scan next customer
        </button>
      </div>
    </Phone>
  );
}
