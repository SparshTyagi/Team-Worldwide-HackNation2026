import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileModeContext } from "@/components/spot/Phone";
import {
  S01Splash, S02Pins, S03Meals, S04Permissions, S04bDietary, S05Feed,
  S06OfferDetail, S07Walk, S08QR, S09Confirm, S10Settings,
  S11MerchantOnboarding, S12Margin, S13Goal, S14Dashboard, S15Scanner,
} from "@/components/spot/Screens";

export const Route = createFileRoute("/")({ component: MobileApp });

// Screen index constants
const S = {
  splash:0, pins:1, meals:2, perms:3, dietary:4, feed:5,
  offer:6, walk:7, qr:8, confirm:9, settings:10,
  mOnboard:11, mMargin:12, mGoal:13, mDash:14, mScan:15,
} as const;

const SCREENS = [
  { id: "splash", C: S01Splash },
  { id: "pins", C: S02Pins },
  { id: "meals", C: S03Meals },
  { id: "perms", C: S04Permissions },
  { id: "dietary", C: S04bDietary },
  { id: "feed", C: S05Feed },
  { id: "offer", C: S06OfferDetail },
  { id: "walk", C: S07Walk },
  { id: "qr", C: S08QR },
  { id: "confirm", C: S09Confirm },
  { id: "settings", C: S10Settings },
  { id: "m-onboard", C: S11MerchantOnboarding },
  { id: "m-margin", C: S12Margin },
  { id: "m-goal", C: S13Goal },
  { id: "m-dash", C: S14Dashboard },
  { id: "m-scan", C: S15Scanner },
];

function MobileApp() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"right"|"up">("right");

  const go = useCallback((to: number, anim: "right"|"up" = "right") => {
    setDir(anim);
    setIdx(to);
    window.scrollTo(0, 0);
  }, []);

  // Auto-advance splash → pins after 2.5s
  useEffect(() => {
    if (idx === S.splash) {
      const t = setTimeout(() => go(S.pins), 2500);
      return () => clearTimeout(t);
    }
  }, [idx, go]);

  // Event delegation: intercept all clicks and navigate
  const handleClick = useCallback((e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    const btn = el.closest("button");

    // --- Back buttons: small round icon-only buttons near top ---
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const isSmallRound = btn.className.includes("w-9") || (btn.className.includes("rounded-full") && rect.width < 48);
      const isTopArea = rect.top < 130;
      const hasNoText = !btn.textContent?.replace(/[\s\u200B]/g, "");

      if (isSmallRound && isTopArea && hasNoText) {
        if (idx === S.offer || idx === S.walk) go(S.feed);
        else if (idx === S.settings) go(S.feed);
        else if (idx === S.mMargin) go(S.mOnboard);
        else if (idx === S.mGoal) go(S.mOnboard);
        else if (idx > 0) go(idx - 1);
        return;
      }

      const text = (btn.textContent || "").trim();

      // --- Onboarding flow ---
      if (text.includes("Continue") && idx <= S.dietary) { go(idx + 1); return; }
      if (text === "Looks right") { go(S.perms); return; }
      if (text.includes("Allow") && text.includes("continue")) { go(S.dietary); return; }
      if (text.includes("Finish setup")) { go(S.feed, "up"); return; }

      // --- Customer app ---
      if (text.includes("Redeem now")) { go(S.qr, "up"); return; }
      if (text.includes("Start the walk")) { go(S.offer); return; }
      if (text.includes("Simulate scan")) { go(S.confirm, "up"); return; }
      if (text === "Cancel redeem") { go(S.feed); return; }
      if (text === "Done") { go(S.feed, "up"); return; }
      if (text.includes("next nearby")) { go(S.feed); return; }
      if (text.includes("Rate Tony")) { go(S.feed); return; }

      // --- Tab bar (Feed screen) ---
      if (idx === S.feed && btn.closest(".border-t")) {
        if (text.includes("Map")) go(S.walk);
        else if (text.includes("Privacy")) go(S.settings);
        return;
      }

      // --- Settings ---
      if (text.includes("Wipe all") || text.includes("Export")) return; // no-op

      // --- Merchant flow ---
      if (text.includes("Continue to margins")) { go(S.mMargin); return; }
      if (text.includes("Lock in")) { go(S.mGoal); return; }
      if (text.includes("Launch goal")) { go(S.mDash, "up"); return; }
      if (text.includes("Open scanner")) { go(S.mScan); return; }
      if (text === "Scan next customer") { go(S.mDash); return; }
    }

    // --- Feed card clicks → offer detail ---
    if (idx === S.feed) {
      const card = el.closest(".fade-rise");
      if (card) { go(S.offer); return; }
    }
  }, [idx, go]);

  const Screen = SCREENS[idx].C;
  const animClass = dir === "up" ? "page-enter-up" : "page-enter";

  return (
    <MobileModeContext.Provider value={true}>
      <div onClick={handleClick}>
        <div key={idx} className={animClass}>
          <Screen />
        </div>

        {/* Floating mode switch: Customer ↔ Merchant */}
        <div className="fixed top-3 right-3 z-50 flex gap-1.5">
          {idx >= S.mOnboard ? (
            <button
              onClick={(e) => { e.stopPropagation(); go(S.feed); }}
              className="px-3 py-1.5 rounded-full bg-[var(--ink)]/80 backdrop-blur text-white text-[11px] font-semibold shadow-lg active:scale-95 transition-transform"
            >
              ← Customer
            </button>
          ) : idx >= S.feed ? (
            <button
              onClick={(e) => { e.stopPropagation(); go(S.mOnboard); }}
              className="px-3 py-1.5 rounded-full bg-[var(--ink)]/80 backdrop-blur text-white text-[11px] font-semibold shadow-lg active:scale-95 transition-transform"
            >
              Merchant →
            </button>
          ) : null}
        </div>
      </div>
    </MobileModeContext.Provider>
  );
}
