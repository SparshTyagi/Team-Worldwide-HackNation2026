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
        <div className="text-xs font-semibold tracking-wider text-[var(--terracotta)]">STEP 1 OF 3</div>
        <h2 className="font-display text-[28px] leading-[1.1] text-[var(--forest)] mt-1">
          Where do you spend
          <br /> your days?
        </h2>
        <p className="text-sm text-[var(--forest)]/60 mt-2">
          Drop two pins. We'll only suggest things on your natural path.
        </p>
      </div>
      <div className="relative flex-1 mx-4 rounded-3xl overflow-hidden border border-[var(--border)]">
        <MapStylized>
          <div className="absolute left-12 top-20"><HandPin label="Home" color="#264653" /></div>
          <div className="absolute right-10 bottom-28"><HandPin label="Work" color="#E76F51" /></div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 393 600" preserveAspectRatio="none">
            <path d="M70 130 Q 200 250 320 470" stroke="#E76F51" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" fill="none" />
          </svg>
        </MapStylized>
      </div>
      <div className="p-5">
        <button className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30">
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 03 ONBOARDING — meal sliders + chips ---------- */
export function S03Meals() {
  const Slider = ({ label, time, pos }: { label: string; time: string; pos: number }) => (
    <div className="bg-white rounded-2xl p-4 border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="font-display text-[var(--forest)]">{label}</div>
        <div className="text-sm font-semibold text-[var(--terracotta)]">{time}</div>
      </div>
      <div className="mt-3 relative h-2 rounded-full bg-[var(--cream)]">
        <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--terracotta)]" style={{ width: `${pos}%` }} />
        <div className="absolute -top-1.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--terracotta)] shadow"
             style={{ left: `calc(${pos}% - 10px)` }} />
      </div>
    </div>
  );
  const chips = [
    { l: "Coffee", i: <Coffee size={14} />, on: true },
    { l: "Bakery", i: <Pizza size={14} />, on: true },
    { l: "Ramen", i: <UtensilsCrossed size={14} />, on: true },
    { l: "Salads", i: <Salad size={14} />, on: false },
    { l: "Wine bars", i: <Wine size={14} />, on: false },
    { l: "Gelato", i: <IceCream size={14} />, on: true },
  ];
  return (
    <Phone title="Your rhythm" number={3}>
      <StatusBar />
      <div className="px-7 pb-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--terracotta)]">STEP 2 OF 3</div>
        <h2 className="font-display text-[28px] leading-[1.1] text-[var(--forest)] mt-1">
          When do you usually
          <br /> get hungry?
        </h2>
      </div>
      <div className="px-5 mt-3 space-y-3">
        <Slider label="☕  Coffee" time="08:30" pos={28} />
        <Slider label="🥪  Lunch" time="12:45" pos={55} />
        <Slider label="🍷  Dinner" time="19:30" pos={82} />
      </div>
      <div className="px-7 mt-5">
        <div className="text-xs font-semibold tracking-wider text-[var(--forest)]/60 mb-2">I'M INTO</div>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <span key={c.l}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${
                c.on ? "bg-[var(--forest)] text-white border-[var(--forest)]" : "bg-white text-[var(--forest)] border-[var(--border)]"
              }`}>
              {c.i}{c.l}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-auto p-5">
        <button className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--terracotta)]/30">
          Continue <ChevronRight size={18} />
        </button>
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
        <div className="text-xs font-semibold tracking-wider text-[var(--terracotta)]">STEP 3 OF 3</div>
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
          <Lock size={16} /> Allow & continue
        </button>
        <button className="w-full mt-2 h-10 text-sm text-[var(--forest)]/60">Read the full policy</button>
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
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--forest)]/10 text-[var(--forest)] font-semibold">ON-DEVICE AI</span>
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
        <Sparkles size={22} className="text-[var(--terracotta)]" />
        <MapPin size={22} className="text-[var(--forest)]/40" />
        <Clock size={22} className="text-[var(--forest)]/40" />
        <Shield size={22} className="text-[var(--forest)]/40" />
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
        <div className="absolute bottom-3 left-5 flex items-center gap-2">
          <span className="px-2 py-1 rounded-full bg-[var(--terracotta)] text-white text-[10px] font-semibold flex items-center gap-1">
            <Clock size={10} /> ENDS IN 13:42
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
          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-4xl text-[var(--terracotta)] leading-none">−€3.40</span>
            <span className="text-sm text-[var(--forest)]/50 line-through pb-1">€8.40</span>
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-[var(--cream)] text-[var(--forest)] font-semibold">cortado + pastry</span>
          </div>
        </div>

        {/* Walking map */}
        <div className="mt-3 relative rounded-3xl overflow-hidden border border-[var(--border)] h-40">
          <MapStylized>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 393 200" preserveAspectRatio="none">
              <path d="M40 160 Q 150 140 220 100 T 340 50" stroke="#E76F51" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" fill="none" />
            </svg>
            <div className="absolute left-4 bottom-3"><HandPin color="#264653" /></div>
            <div className="absolute right-6 top-3"><HandPin pulsing /></div>
            <div className="absolute right-2 bottom-2 px-2 py-1 rounded-full bg-white/90 text-[11px] font-semibold flex items-center gap-1">
              <Footprints size={11} /> 80m · 1 min
            </div>
          </MapStylized>
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
  return (
    <Phone title="Walk the Wallet" number={7} bg="forest">
      <div className="absolute inset-0">
        <MapStylized>
          {/* darker overlay */}
          <div className="absolute inset-0 bg-[var(--forest)]/30" />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 393 852" preserveAspectRatio="none">
            <path
              d="M60 720 Q 120 600 200 540 T 280 320 Q 220 220 320 100"
              stroke="#FEF3E2"
              strokeWidth="4"
              strokeDasharray="3 9"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
          </svg>
          <div className="absolute left-10 bottom-32"><HandPin color="#264653" pulsing label="Tony's · −€3.40" /></div>
          <div className="absolute right-12 top-[44%]"><HandPin color="#E76F51" pulsing label="Marie · −50%" /></div>
          <div className="absolute right-14 top-24"><HandPin color="#264653" pulsing label="Ramen · −€2.10" /></div>
          {/* You */}
          <div className="absolute left-12 bottom-20 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-white border-4 border-[var(--terracotta)] shadow" />
            <span className="mt-1 px-2 py-0.5 rounded-full bg-white text-[10px] font-semibold">You</span>
          </div>
        </MapStylized>
      </div>

      <StatusBar dark />
      <div className="relative px-6 mt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur text-white text-[12px]">
          <Sparkles size={12} className="text-[var(--sand)]" /> A 9-minute loop · 3 spots
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
      <StatusBar dark />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--sand)]">SHOW THIS TO TONY</div>
        <h2 className="font-display text-[26px] mt-1 text-center leading-tight">Tony's Café</h2>
        <div className="font-display text-5xl text-[var(--terracotta)] mt-1">−€3.40</div>

        <div className="mt-6 p-3 rounded-3xl bg-[var(--cream)] qr-mat">
          <QrCode size={230} />
        </div>

        <div className="mt-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[12px]">
          <Clock size={12} /> Expires in <span className="font-semibold text-[var(--sand)]">02:14</span>
        </div>

        <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-white/50">
          <Lock size={10} /> Code generated on this device · single-use
        </div>
      </div>
      <div className="p-5">
        <button className="w-full h-12 rounded-full bg-white/10 text-white font-medium">Cancel redeem</button>
      </div>
    </Phone>
  );
}

/* ---------- 09 CONFIRMATION ---------- */
export function S09Confirm() {
  const colors = ["#E76F51", "#264653", "#F4A261", "#FEF3E2"];
  return (
    <Phone title="Confirmation" number={9}>
      <StatusBar />
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${(i * 37) % 100}%`,
              background: colors[i % 4],
              animationDelay: `${(i % 8) * 60}ms`,
              transform: `rotate(${i * 23}deg)`,
            }}
          />
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center relative">
        <div className="relative w-24 h-24 rounded-full bg-[var(--forest)] flex items-center justify-center shadow-xl">
          <Check size={48} className="text-[var(--cream)]" strokeWidth={3} />
          <span className="absolute inset-0 rounded-full pulse-ring" />
        </div>
        <h2 className="font-display text-[30px] text-[var(--forest)] mt-6 leading-tight">
          You saved
          <br />
          <span className="text-[var(--terracotta)] text-5xl">€3.40</span>
        </h2>

        <div className="mt-5 flex items-center gap-3 bg-white rounded-2xl border border-[var(--border)] p-3 pr-5">
          <img src={baristaImg} className="w-12 h-12 rounded-full object-cover" alt="" />
          <div className="text-left">
            <div className="font-display text-[15px] text-[var(--forest)] leading-tight">"Tony says thanks 👋"</div>
            <div className="text-[11px] text-[var(--forest)]/60">Tony's Café · 13:04</div>
          </div>
        </div>

        <div className="mt-6 text-xs text-[var(--forest)]/60 max-w-[260px]">
          That's €27.80 saved this month — and 14 walks taken.
        </div>
      </div>
      <div className="p-5 space-y-2">
        <button className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold shadow-lg shadow-[var(--terracotta)]/30">
          Show next nearby spot
        </button>
        <button className="w-full h-12 rounded-full text-[var(--forest)]/70 text-sm">Done</button>
      </div>
    </Phone>
  );
}

/* ---------- 10 SETTINGS / PRIVACY ---------- */
export function S10Settings() {
  const Toggle = ({ on = true }: { on?: boolean }) => (
    <span className={`w-10 h-6 rounded-full p-0.5 flex ${on ? "bg-[var(--terracotta)] justify-end" : "bg-[var(--border)] justify-start"}`}>
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </span>
  );
  const Row = ({ icon, title, desc, on, badge }: any) => (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[var(--border)]">
      <div className="w-9 h-9 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--terracotta)]">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-display text-[15px] text-[var(--forest)]">{title}</div>
          {badge && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--forest)]/10 text-[var(--forest)]">{badge}</span>}
        </div>
        <div className="text-[11px] text-[var(--forest)]/60 mt-0.5">{desc}</div>
      </div>
      <Toggle on={on} />
    </div>
  );
  return (
    <Phone title="Privacy dashboard" number={10}>
      <StatusBar />
      <div className="px-6 pb-2">
        <div className="text-xs text-[var(--forest)]/60">Settings</div>
        <h2 className="font-display text-[26px] text-[var(--forest)]">Your data, your call.</h2>
      </div>

      <div className="px-5 mt-3 space-y-2.5">
        <div className="rounded-3xl p-4 bg-[var(--forest)] text-white">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[var(--sand)]">
            <Shield size={14} /> ON-DEVICE AI · ACTIVE
          </div>
          <div className="font-display text-[18px] mt-1 leading-tight">73% of Spot runs on your phone.</div>
          <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-[var(--sand)]" style={{ width: "73%" }} />
          </div>
          <div className="flex justify-between text-[10px] text-white/70 mt-1.5">
            <span>On device</span><span>Cloud</span>
          </div>
        </div>

        <Row icon={<MapPin size={16} />} title="Precise location" desc="Used only when app is open" on badge="DEVICE" />
        <Row icon={<Sparkles size={16} />} title="Behavior learning" desc="Local model, retrains nightly" on badge="DEVICE" />
        <Row icon={<Cloud size={16} />} title="Weather sync" desc="Public API · no PII" on badge="CLOUD" />
        <Row icon={<Bell size={16} />} title="Soft notifications" desc="Max 2 per day, never marketing" on={false} badge="DEVICE" />
      </div>

      <div className="mt-auto p-5 text-center">
        <button className="text-sm text-[var(--terracotta)] font-semibold underline-offset-4 underline">
          Export & wipe everything
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 11 MERCHANT ONBOARDING ---------- */
export function S11MerchantOnboarding() {
  return (
    <Phone title="Merchant onboarding" number={11}>
      <StatusBar />
      <div className="px-7 pb-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--terracotta)]">FOR LOCAL OWNERS</div>
        <h2 className="font-display text-[26px] leading-[1.1] text-[var(--forest)] mt-1">
          Paste your shop link.
          <br /> We'll do the rest.
        </h2>
      </div>

      <div className="px-5 mt-4">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-[10px] font-semibold tracking-wider text-[var(--forest)]/60">GOOGLE MAPS LINK</div>
          <div className="mt-2 flex items-center gap-2 px-3 py-3 rounded-xl bg-[var(--cream)]">
            <Link2 size={16} className="text-[var(--forest)]/60" />
            <span className="text-[12px] text-[var(--forest)] truncate">maps.app.goo.gl/x9b2…</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--forest)]/70">
            <span className="w-3 h-3 rounded-full bg-[var(--terracotta)] animate-pulse" />
            On-device AI reading the page…
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white border border-[var(--border)] overflow-hidden">
          <img src={cafeImg} className="w-full h-28 object-cover" alt="" />
          <div className="p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[var(--forest)]/60">
              <Sparkles size={11} className="text-[var(--terracotta)]" /> AI AUTO-FILLED · TAP TO EDIT
            </div>
            <div className="font-display text-[18px] text-[var(--forest)] mt-1">Tony's Café</div>
            <div className="text-[11px] text-[var(--forest)]/60">Marienstr. 14, 70178 Stuttgart</div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Espresso bar", "Pastries", "Vegan options", "Outdoor seats", "Cash + card"].map(t => (
                <span key={t} className="text-[11px] px-2 py-1 rounded-full bg-[var(--cream)] text-[var(--forest)] border border-[var(--border)]">{t}</span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[var(--cream)] rounded-lg p-2">
                <div className="text-[var(--forest)]/60">Hours</div>
                <div className="font-semibold text-[var(--forest)]">07:00 – 19:00</div>
              </div>
              <div className="bg-[var(--cream)] rounded-lg p-2">
                <div className="text-[var(--forest)]/60">Avg ticket</div>
                <div className="font-semibold text-[var(--forest)]">€7.20</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-5">
        <button className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2">
          Looks right — continue <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 12 MARGIN SETUP ---------- */
export function S12Margin() {
  const pos = 22;
  return (
    <Phone title="Margin setup" number={12}>
      <StatusBar />
      <div className="px-7 pb-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--terracotta)]">STEP 2 OF 4</div>
        <h2 className="font-display text-[26px] leading-[1.1] text-[var(--forest)] mt-1">
          How much can you
          <br /> afford to give back?
        </h2>
      </div>

      <div className="mx-5 mt-5 rounded-3xl bg-white border border-[var(--border)] p-5">
        <div className="flex items-end justify-between">
          <div className="font-display text-6xl text-[var(--terracotta)] leading-none">{pos}<span className="text-2xl">%</span></div>
          <div className="text-right">
            <div className="text-[10px] tracking-widest font-semibold text-[var(--forest)]/60">SAFE ZONE</div>
            <div className="text-[11px] text-[var(--forest)]">recommended ≤ 25%</div>
          </div>
        </div>
        <div className="mt-5 relative h-3 rounded-full bg-[var(--cream)]">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos}%`, background: "linear-gradient(90deg, var(--sand), var(--terracotta))" }} />
          <div className="absolute -top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[var(--terracotta)] shadow" style={{ left: `calc(${pos}% - 12px)` }} />
          {/* danger marker */}
          <div className="absolute top-3.5 text-[9px] text-[var(--forest)]/60" style={{ left: "25%" }}>safe</div>
          <div className="absolute top-3.5 text-[9px] text-[var(--destructive)]" style={{ left: "60%" }}>tight</div>
        </div>
      </div>

      <div className="mx-5 mt-3 rounded-3xl bg-[var(--forest)] text-white p-5">
        <div className="text-[11px] tracking-widest font-semibold text-[var(--sand)]">LIVE PROFIT IMPACT</div>
        <div className="mt-2 flex items-end gap-3">
          <div>
            <div className="text-[10px] text-white/60">Per cup</div>
            <div className="font-display text-2xl">€1.32</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60">Was</div>
            <div className="text-lg line-through text-white/50">€1.69</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] text-white/60">If +30 walk-ins</div>
            <div className="font-display text-2xl text-[var(--sand)]">+€39.60</div>
          </div>
        </div>
        {/* mini chart */}
        <svg viewBox="0 0 280 60" className="mt-3 w-full">
          <path d="M0 50 L40 45 L80 40 L120 30 L160 22 L200 20 L240 12 L280 8" stroke="#F4A261" strokeWidth="2.5" fill="none" />
          <path d="M0 50 L40 45 L80 40 L120 30 L160 22 L200 20 L240 12 L280 8 L280 60 L0 60 Z" fill="#F4A261" opacity="0.2" />
        </svg>
      </div>

      <div className="mt-auto p-5">
        <button className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2">
          Lock margin <ChevronRight size={18} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 13 GOAL STUDIO ---------- */
export function S13Goal() {
  return (
    <Phone title="Goal Studio" number={13}>
      <StatusBar />
      <div className="px-7 pb-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--terracotta)]">GOAL STUDIO</div>
        <h2 className="font-display text-[26px] leading-[1.1] text-[var(--forest)] mt-1">
          Tell us what
          <br /> you'd like to fix.
        </h2>
      </div>

      <div className="mx-5 mt-4 rounded-3xl bg-white border border-[var(--border)] p-4">
        <div className="text-[10px] font-semibold tracking-wider text-[var(--forest)]/60">YOU SAID</div>
        <div className="font-display text-[20px] text-[var(--forest)] leading-tight mt-1">
          "Fill my Thursday afternoon dip."
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--forest)]/60">
          <Sparkles size={12} className="text-[var(--terracotta)]" /> Parsed into 4 rules · tap to edit
        </div>
      </div>

      <div className="mx-5 mt-3 space-y-2">
        {[
          { k: "WHEN", v: "Thursdays · 14:00 – 17:00" },
          { k: "WHO", v: "Locals within 600m, low recent visits" },
          { k: "WHAT", v: "Coffee + small pastry combos" },
          { k: "HOW MUCH", v: "Up to −25% off · cap 40 redemptions" },
        ].map((r) => (
          <div key={r.k} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--cream)] border border-[var(--border)]">
            <span className="text-[10px] font-semibold tracking-widest text-[var(--terracotta)] w-20">{r.k}</span>
            <span className="text-[13px] text-[var(--forest)] flex-1">{r.v}</span>
            <ChevronRight size={14} className="text-[var(--forest)]/40" />
          </div>
        ))}
      </div>

      <div className="mx-5 mt-3 rounded-2xl bg-[var(--forest)] text-white p-4">
        <div className="flex items-center gap-2 text-[10px] tracking-widest font-semibold text-[var(--sand)]">
          <TrendingUp size={12} /> FORECAST
        </div>
        <div className="font-display text-[16px] mt-1 leading-tight">
          Likely to bring 18–24 extra visits each Thursday.
        </div>
      </div>

      <div className="mt-auto p-5">
        <button className="w-full h-14 rounded-full bg-[var(--terracotta)] text-white font-semibold flex items-center justify-center gap-2">
          Launch goal <Sparkles size={16} />
        </button>
      </div>
    </Phone>
  );
}

/* ---------- 14 MERCHANT DASHBOARD ---------- */
export function S14Dashboard() {
  return (
    <Phone title="Live dashboard" number={14}>
      <StatusBar />
      <div className="px-6 pb-2 flex items-end justify-between">
        <div>
          <div className="text-xs text-[var(--forest)]/60">Tuesday · 13:04</div>
          <h2 className="font-display text-[24px] text-[var(--forest)]">Tony's Café</h2>
        </div>
        <span className="px-2 py-1 rounded-full bg-[var(--forest)] text-white text-[10px] font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--sand)] animate-pulse" /> LIVE
        </span>
      </div>

      <div className="px-5 mt-3 grid grid-cols-3 gap-2">
        {[
          { k: "Offers sent", v: "47", s: "+12 vs avg" },
          { k: "Accept rate", v: "61%", s: "+8 pts" },
          { k: "Walk-ins", v: "29", s: "today" },
        ].map((m) => (
          <div key={m.k} className="bg-white rounded-2xl border border-[var(--border)] p-3">
            <div className="text-[10px] text-[var(--forest)]/60">{m.k}</div>
            <div className="font-display text-2xl text-[var(--forest)] leading-none mt-1">{m.v}</div>
            <div className="text-[10px] text-[var(--terracotta)] font-semibold mt-1">{m.s}</div>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-3 rounded-3xl bg-[var(--forest)] text-white p-5">
        <div className="text-[11px] tracking-widest font-semibold text-[var(--sand)]">REVENUE LIFT TODAY</div>
        <div className="font-display text-4xl mt-1">+€186.40</div>
        <svg viewBox="0 0 280 70" className="mt-2 w-full">
          {[14, 22, 18, 30, 26, 38, 44, 36, 52, 48, 60, 54].map((v, i) => (
            <rect key={i} x={i * 23 + 4} y={70 - v} width="14" height={v} rx="3" fill={i === 11 ? "#E76F51" : "#F4A261"} opacity={i === 11 ? 1 : 0.85} />
          ))}
        </svg>
        <div className="flex justify-between text-[9px] text-white/50 mt-1">
          <span>9</span><span>11</span><span>13</span><span>15</span><span>17</span>
        </div>
      </div>

      <div className="px-5 mt-3">
        <div className="text-[11px] font-semibold tracking-wider text-[var(--forest)]/60 mb-2">TODAY'S OFFERS</div>
        <div className="space-y-2">
          {[
            { t: "Cortado + pastry", s: "−€3.40 · 12 redeemed", live: true },
            { t: "Quiet-hour latte", s: "−25% · 7 redeemed", live: false },
            { t: "Two croissants", s: "−€2 · 10 redeemed", live: false },
          ].map((o) => (
            <div key={o.t} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[var(--border)]">
              <div className="w-2 h-2 rounded-full" style={{ background: o.live ? "#E76F51" : "#264653", opacity: o.live ? 1 : 0.3 }} />
              <div className="flex-1">
                <div className="font-display text-[14px] text-[var(--forest)]">{o.t}</div>
                <div className="text-[11px] text-[var(--forest)]/60">{o.s}</div>
              </div>
              <ChevronRight size={14} className="text-[var(--forest)]/40" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto" />
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

/* ---------- 16 DEMO TOGGLE PANEL ---------- */
export function S16Demo() {
  const Toggle = ({ on, label, icon }: any) => (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--cream)]">
      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[var(--terracotta)]">{icon}</div>
      <span className="text-[12px] font-semibold text-[var(--forest)] flex-1">{label}</span>
      <span className={`w-9 h-5 rounded-full p-0.5 flex ${on ? "bg-[var(--terracotta)] justify-end" : "bg-[var(--border)] justify-start"}`}>
        <span className="w-4 h-4 rounded-full bg-white shadow" />
      </span>
    </div>
  );
  return (
    <Phone title="Demo overlay" number={16}>
      <StatusBar />
      {/* faded home behind */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="px-6 pt-16">
          <div className="font-display text-[22px] text-[var(--forest)]">3 little reasons to step out.</div>
          <div className="mt-4 h-32 rounded-2xl bg-white border border-[var(--border)]" />
          <div className="mt-3 h-16 rounded-full bg-[var(--forest)]" />
          <div className="mt-3 h-24 rounded-2xl bg-[var(--cream)] border-2 border-dashed border-[var(--terracotta)]/40" />
        </div>
      </div>

      <div className="relative mt-auto m-4 rounded-3xl bg-[var(--ink)] text-white p-4 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--terracotta)] animate-pulse" />
            <span className="text-[10px] tracking-widest font-semibold text-[var(--sand)]">DEMO STATE · DEV</span>
          </div>
          <X size={14} className="text-white/60" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Toggle on label="Light rain" icon={<CloudRain size={14} />} />
          <Toggle on={false} label="Sunny" icon={<Sun size={14} />} />
          <Toggle on={false} label="Evening" icon={<Moon size={14} />} />
          <Toggle on label="Lunch slot" icon={<UtensilsCrossed size={14} />} />
        </div>

        <div className="mt-3 p-3 rounded-2xl bg-white/5">
          <div className="text-[10px] tracking-widest font-semibold text-white/50">CITY</div>
          <div className="flex items-center gap-2 mt-1">
            <Globe size={14} className="text-[var(--sand)]" />
            <span className="text-[13px] font-semibold">Stuttgart, DE</span>
            <span className="ml-auto text-[10px] text-white/50">11°C</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px]">
          {["Mia 28", "Tourist", "Senior"].map((p, i) => (
            <button key={p} className={`py-2 rounded-lg ${i === 0 ? "bg-[var(--terracotta)] text-white" : "bg-white/5 text-white/70"}`}>{p}</button>
          ))}
        </div>

        <button className="mt-3 w-full h-10 rounded-full bg-[var(--terracotta)] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5">
          <Sparkles size={12} /> Recompose feed
        </button>
      </div>
    </Phone>
  );
}
