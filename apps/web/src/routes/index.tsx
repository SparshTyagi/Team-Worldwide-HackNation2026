import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileModeContext } from "@/components/spot/Phone";
import {
  S00RolePicker, S01Splash, S02Pins, S03Meals, S04Permissions, S04bDietary, S05Feed,
  S06OfferDetail, S07Walk, S08QR, S09Confirm, S10Settings,
  S11MerchantOnboarding, S12Margin, S13Goal, S13bVoiceIdentity, S14MerchantApproval, S14Dashboard, S15Scanner,
  S16RoadmapCoverage, S16PrivacyPolicy,
  SpotAppProvider,
} from "@/components/spot/Screens";
import { login, register } from "@/lib/auth-api";
import { fetchActiveOffers, fetchSavingsSummary } from "@/lib/offers-api";
import {
  createMerchantVoiceIdentity,
  createMerchantVoiceSession,
  fetchMerchantVoiceIdentity,
} from "@/lib/voice-agent-api";

export const Route = createFileRoute("/")({ component: MobileApp });

// Screen index constants
const S = {
  role:0, splash:1, pins:2, meals:3, dietary:4, perms:5, feed:6,
  offer:7, walk:8, qr:9, confirm:10, settings:11,
  mOnboard:12, mMargin:13, mVoice:14, mGoal:15, mApproval:16, mDash:17, mScan:18,
  coverage:19, policy:20,
} as const;

const SCREENS = [
  { id: "role", C: S00RolePicker },
  { id: "splash", C: S01Splash },
  { id: "pins", C: S02Pins },
  { id: "meals", C: S03Meals },
  { id: "dietary", C: S04bDietary },
  { id: "perms", C: S04Permissions },
  { id: "feed", C: S05Feed },
  { id: "offer", C: S06OfferDetail },
  { id: "walk", C: S07Walk },
  { id: "qr", C: S08QR },
  { id: "confirm", C: S09Confirm },
  { id: "settings", C: S10Settings },
  { id: "m-onboard", C: S11MerchantOnboarding },
  { id: "m-margin", C: S12Margin },
  { id: "m-voice", C: S13bVoiceIdentity },
  { id: "m-goal", C: S13Goal },
  { id: "m-approval", C: S14MerchantApproval },
  { id: "m-dash", C: S14Dashboard },
  { id: "m-scan", C: S15Scanner },
  { id: "coverage", C: S16RoadmapCoverage },
  { id: "policy", C: S16PrivacyPolicy },
];

export function MobileApp() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"right"|"up">("right");
  const [history, setHistory] = useState<number[]>([]);
  const [userName, setUserName] = useState("Mia");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPseudonym, setUserPseudonym] = useState("demo_user");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [isOffersLoading, setIsOffersLoading] = useState(false);
  const [savings, setSavings] = useState({
    latestSavedEur: 3.4,
    todaySavedEur: 3.4,
    monthSavedEur: 42.1,
    spotsTried: 17,
  });
  const [merchantVoiceIdentity, setMerchantVoiceIdentity] = useState({
    brandStory: "",
    menuHighlights: "",
    promotions: "",
    voiceName: "Warm Guide",
    voiceId: "",
    tone: "friendly",
    language: "en",
  });
  const [voiceIdentityStatus, setVoiceIdentityStatus] = useState<string | null>(null);
  const [voiceWidgetOpen, setVoiceWidgetOpen] = useState(false);
  const [voiceWidgetSession, setVoiceWidgetSession] = useState<{
    sessionToken?: string;
    signedUrl?: string;
  } | null>(null);
  const [isVoiceWidgetLoading, setIsVoiceWidgetLoading] = useState(false);
  const [voiceWidgetError, setVoiceWidgetError] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const go = useCallback((to: number, anim: "right"|"up" = "right", recordHistory = true) => {
    if (recordHistory) setHistory((prev) => [...prev, idx]);
    setDir(anim);
    setIdx(to);
    window.scrollTo(0, 0);
  }, [idx]);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (!prev.length) {
        if (idx > 0) setIdx(idx - 1);
        return prev;
      }
      const next = [...prev];
      const to = next.pop()!;
      setDir("right");
      setIdx(to);
      window.scrollTo(0, 0);
      return next;
    });
  }, [idx]);

  const hydrateAuthState = useCallback((auth: any) => {
    setAuthToken(auth?.session?.access_token || null);
    setUserPseudonym(auth?.pseudonym || "demo_user");
    const displayName = (auth?.display_name || userName).trim();
    if (displayName) setUserName(displayName);
  }, [userName]);

  const loadLiveData = useCallback(async (pseudonym: string, token: string | null) => {
    if (!pseudonym) return;
    setIsOffersLoading(true);
    try {
      const [liveOffers, summary] = await Promise.all([
        fetchActiveOffers(pseudonym, token),
        fetchSavingsSummary(pseudonym, token),
      ]);
      setOffers(liveOffers.offers || []);
      setSelectedOffer((current) => current || liveOffers.offers?.[0] || null);
      setSavings({
        latestSavedEur: summary.latest_saved_eur,
        todaySavedEur: summary.today_saved_eur,
        monthSavedEur: summary.month_saved_eur,
        spotsTried: summary.spots_tried,
      });
    } catch {
      // Keep local fallbacks for demos when API is unavailable.
    } finally {
      setIsOffersLoading(false);
    }
  }, []);

  const parseCsvList = useCallback((value: string) => {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }, []);

  const hydrateVoiceIdentity = useCallback((identity?: {
    brand_story: string;
    menu_highlights: string[];
    promotions: string[];
    voice_name: string;
    voice_id: string;
    tone: string;
    language: string;
  }) => {
    if (!identity) return;
    setMerchantVoiceIdentity({
      brandStory: identity.brand_story || "",
      menuHighlights: (identity.menu_highlights || []).join(", "),
      promotions: (identity.promotions || []).join(", "),
      voiceName: identity.voice_name || "Warm Guide",
      voiceId: identity.voice_id || "",
      tone: identity.tone || "friendly",
      language: identity.language || "en",
    });
  }, []);

  const saveVoiceIdentity = useCallback(async () => {
    setVoiceIdentityStatus(null);
    const payload = {
      brand_story: merchantVoiceIdentity.brandStory.trim(),
      menu_highlights: parseCsvList(merchantVoiceIdentity.menuHighlights),
      promotions: parseCsvList(merchantVoiceIdentity.promotions),
      voice_name: merchantVoiceIdentity.voiceName.trim(),
      voice_id: merchantVoiceIdentity.voiceId.trim(),
      tone: merchantVoiceIdentity.tone.trim(),
      language: merchantVoiceIdentity.language.trim(),
    };

    if (!authToken) {
      setVoiceIdentityStatus("Saved locally in demo mode. Sign in as merchant to persist to backend.");
      go(S.mGoal, "up");
      return;
    }

    try {
      const response = await createMerchantVoiceIdentity(payload, authToken);
      hydrateVoiceIdentity(response.identity);
      setVoiceIdentityStatus("Voice identity saved for your shop.");
      go(S.mGoal, "up");
    } catch (error) {
      setVoiceIdentityStatus(
        error instanceof Error ? error.message : "Unable to save voice identity right now.",
      );
    }
  }, [authToken, go, hydrateVoiceIdentity, merchantVoiceIdentity, parseCsvList]);

  const bootstrapVoiceSession = useCallback(async () => {
    setVoiceWidgetError(null);
    setIsVoiceWidgetLoading(true);
    if (!authToken) {
      setVoiceWidgetSession({ sessionToken: "demo-session-preview-token" });
      setIsVoiceWidgetLoading(false);
      return;
    }
    try {
      const session = await createMerchantVoiceSession(authToken);
      setVoiceWidgetSession({
        sessionToken: session.session_token,
        signedUrl: session.signed_url,
      });
    } catch (error) {
      setVoiceWidgetSession(null);
      setVoiceWidgetError(
        error instanceof Error
          ? error.message
          : "Could not start voice session. Please try again.",
      );
    } finally {
      setIsVoiceWidgetLoading(false);
    }
  }, [authToken]);

  const finishSetup = useCallback(async () => {
    if (!userName.trim()) {
      setAuthError("Please enter your name before finishing setup.");
      return;
    }
    if (!userEmail.trim() || !userPassword.trim()) {
      setAuthError("Email and password are required to create your account.");
      return;
    }
    if (userPassword.trim().length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      let auth;
      try {
        auth = await register({
          email: userEmail.trim(),
          password: userPassword.trim(),
          role: "consumer",
          display_name: userName.trim(),
        });
      } catch {
        auth = await login({ email: userEmail.trim(), password: userPassword.trim() });
      }
      hydrateAuthState(auth);
      go(S.feed, "up");
      await loadLiveData(auth.pseudonym || "demo_user", auth?.session?.access_token || null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not authenticate. Try again.");
    } finally {
      setIsAuthLoading(false);
    }
  }, [go, hydrateAuthState, loadLiveData, userEmail, userName, userPassword]);

  // Auto-advance splash → pins after 2.5s
  useEffect(() => {
    if (idx === S.splash) {
      const t = setTimeout(() => go(S.pins, "right", false), 2500);
      return () => clearTimeout(t);
    }
  }, [idx, go]);

  useEffect(() => {
    if (idx === S.feed && authToken) {
      void loadLiveData(userPseudonym, authToken);
    }
  }, [authToken, idx, loadLiveData, userPseudonym]);

  useEffect(() => {
    if (idx !== S.mVoice || !authToken) return;
    let ignore = false;

    const loadIdentity = async () => {
      try {
        const response = await fetchMerchantVoiceIdentity(authToken);
        if (!ignore) hydrateVoiceIdentity(response.identity);
      } catch {
        if (!ignore) setVoiceIdentityStatus("You can still fill this in and save manually.");
      }
    };

    void loadIdentity();
    return () => {
      ignore = true;
    };
  }, [authToken, hydrateVoiceIdentity, idx]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  // Event delegation: intercept all clicks and navigate
  const handleClick = useCallback((e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    const btn = el.closest("button");

    // --- Role picker: route consumer → splash, merchant → mOnboard ---
    if (idx === S.role && btn) {
      const role = btn.getAttribute("data-role");
      if (role === "consumer") { go(S.splash); return; }
      if (role === "merchant") { go(S.mOnboard, "up"); return; }
    }

    if (btn) {
      const navAction = btn.getAttribute("data-nav");
      if (navAction === "back") {
        if (idx === S.offer || idx === S.walk || idx === S.settings || idx === S.policy) go(S.feed, "right", false);
        else goBack();
        return;
      }
      if (navAction === "policy") {
        go(S.policy);
        return;
      }
      if (navAction === "coverage") {
        go(S.coverage);
        return;
      }

      const buttonAction = btn.getAttribute("data-action");
      if (buttonAction === "finish-setup") {
        void finishSetup();
        return;
      }
      if (buttonAction === "save-voice-identity") {
        go(S.mGoal, "up");
        void saveVoiceIdentity();
        return;
      }
      if (buttonAction === "open-voice-widget") {
        setVoiceWidgetOpen(true);
        return;
      }
      if (buttonAction === "close-voice-widget") {
        setVoiceWidgetOpen(false);
        return;
      }
      if (buttonAction === "start-voice-chat") {
        void bootstrapVoiceSession();
        return;
      }
      if (buttonAction === "continue") {
        go(idx + 1);
        return;
      }
      if (buttonAction === "looks-right") {
        go(idx + 1);
        return;
      }
      if (buttonAction === "redeem-now") {
        go(S.qr, "up");
        return;
      }
      if (buttonAction === "start-walk") {
        go(S.offer);
        return;
      }
      if (buttonAction === "simulate-scan") {
        go(S.confirm, "up");
        return;
      }
      if (buttonAction === "cancel-redeem") {
        go(S.feed);
        return;
      }
      if (buttonAction === "confirm-done") {
        go(S.feed, "up");
        return;
      }
      if (buttonAction === "confirm-rate") {
        go(S.feed);
        return;
      }
      if (buttonAction === "feed-tab-map") {
        go(S.walk);
        return;
      }
      if (buttonAction === "feed-tab-history") {
        go(S.confirm);
        return;
      }
      if (buttonAction === "feed-tab-privacy") {
        go(S.settings);
        return;
      }
      if (buttonAction === "noop") {
        return;
      }
      if (buttonAction === "merchant-continue-challenge-fit") {
        go(S.mMargin);
        return;
      }
      if (buttonAction === "merchant-lock-margin") {
        go(S.mVoice);
        return;
      }
      if (buttonAction === "merchant-configure-voice") {
        go(S.mVoice);
        return;
      }
      if (buttonAction === "merchant-submit-approval") {
        go(S.mApproval, "up");
        return;
      }
      if (buttonAction === "merchant-simulate-approval") {
        go(S.mDash, "up");
        return;
      }
      if (buttonAction === "merchant-open-scanner") {
        go(S.mScan);
        return;
      }
      if (buttonAction === "merchant-scan-next") {
        go(S.mScan);
        return;
      }
      if (buttonAction === "merchant-manage-voice") {
        go(S.mVoice);
        return;
      }
      if (buttonAction === "open-coverage") {
        go(S.coverage, "up");
        return;
      }
    }

    if (idx === S.feed) {
      const card = el.closest("[data-offer-index]");
      if (card) {
        const offerIndex = Number(card.getAttribute("data-offer-index"));
        if (Number.isFinite(offerIndex) && offers[offerIndex]) setSelectedOffer(offers[offerIndex]);
        go(S.offer);
        return;
      }
    }
  }, [idx, go, goBack, finishSetup, offers, saveVoiceIdentity, bootstrapVoiceSession]);

  const Screen = SCREENS[idx].C;
  const animClass = prefersReducedMotion ? "" : dir === "up" ? "page-enter-up" : "page-enter";
  const showSwitchRole = idx === S.feed || idx === S.settings || idx === S.mDash || idx === S.mScan;

  return (
    <MobileModeContext.Provider value={true}>
      <SpotAppProvider
        value={{
          userName,
          userEmail,
          userPassword,
          userPseudonym,
          isAuthLoading,
          authError,
          offers,
          selectedOffer,
          isOffersLoading,
          savings,
          merchantVoiceIdentity,
          voiceIdentityStatus,
          voiceWidgetSession,
          isVoiceWidgetLoading,
          voiceWidgetError,
          setUserName,
          setUserEmail,
          setUserPassword,
          setMerchantVoiceIdentity,
        }}
      >
        <div onClick={handleClick}>
          <div key={idx} className={animClass}>
            <Screen />
          </div>

          {/* Floating role switch is only shown on top-level hubs to avoid blocking flow */}
          {showSwitchRole && (
            <div className="fixed right-3 bottom-20 z-40">
              <button
                onClick={(e) => { e.stopPropagation(); go(S.role); }}
                aria-label="Switch role"
                className="px-3 py-1.5 rounded-full bg-[var(--ink)]/70 backdrop-blur text-white text-[11px] font-semibold shadow-md active:scale-95 transition-transform"
              >
                Switch role
              </button>
            </div>
          )}

          {(idx === S.feed || idx === S.offer || idx === S.walk) && (
            <div className="fixed bottom-4 left-4 z-50">
              <button
                data-action="open-voice-widget"
                className="px-4 py-2 rounded-full bg-[var(--terracotta)] text-white text-[12px] font-semibold shadow-lg shadow-[var(--terracotta)]/30 active:scale-95 transition-transform"
              >
                Talk to this shop
              </button>
            </div>
          )}

          {voiceWidgetOpen && (
            <div className="fixed inset-0 z-[60] bg-black/35 flex items-end sm:items-center sm:justify-center p-3">
              <div className="w-full max-w-sm rounded-3xl bg-white border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold tracking-widest text-[var(--terracotta)]">
                      ELEVENLABS VOICE
                    </div>
                    <div className="font-display text-[20px] text-[var(--forest)] leading-tight">
                      Sales agent ready
                    </div>
                  </div>
                  <button
                    data-action="close-voice-widget"
                    aria-label="Close voice assistant"
                    className="w-8 h-8 rounded-full bg-[var(--cream)] text-[var(--forest)] text-sm font-bold"
                  >
                    ×
                  </button>
                </div>

                <p className="mt-2 text-[12px] text-[var(--forest)]/65">
                  Start a live voice session to hear what is special about this merchant's menu and offers.
                </p>

                {voiceWidgetSession?.sessionToken && (
                  <div className="mt-3 rounded-xl bg-[var(--cream)] px-3 py-2 text-[11px] text-[var(--forest)]/80">
                    Session token ready (preview): {voiceWidgetSession.sessionToken.slice(0, 28)}...
                  </div>
                )}
                {voiceWidgetSession?.signedUrl && (
                  <div className="mt-2 rounded-xl bg-[var(--cream)] px-3 py-2 text-[11px] text-[var(--forest)]/80 break-all">
                    Signed URL: {voiceWidgetSession.signedUrl}
                  </div>
                )}
                {voiceWidgetError && (
                  <div className="mt-2 rounded-xl bg-[var(--terracotta)]/10 px-3 py-2 text-[11px] text-[var(--terracotta)]">
                    {voiceWidgetError}
                  </div>
                )}

                <button
                  data-action="start-voice-chat"
                  disabled={isVoiceWidgetLoading}
                  className="mt-4 w-full py-3 rounded-full bg-[var(--forest)] text-white text-[13px] font-semibold disabled:opacity-60"
                >
                  {isVoiceWidgetLoading ? "Starting session..." : "Start voice chat"}
                </button>
              </div>
            </div>
          )}
        </div>
      </SpotAppProvider>
    </MobileModeContext.Provider>
  );
}
