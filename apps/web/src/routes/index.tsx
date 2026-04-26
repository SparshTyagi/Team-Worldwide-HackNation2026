import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { MobileModeContext } from "@/components/spot/Phone";
import {
  S00RolePicker,
  S01Splash,
  S02Pins,
  S03Meals,
  S04Permissions,
  S04bDietary,
  S05Feed,
  S06OfferDetail,
  S07Walk,
  S08QR,
  S09Confirm,
  S10Settings,
  S11MerchantOnboarding,
  S12Margin,
  S13Goal,
  S13bVoiceIdentity,
  S14MerchantApproval,
  S14Dashboard,
  S15Scanner,
  S16RoadmapCoverage,
  S16PrivacyPolicy,
  SpotAppProvider,
} from "@/components/spot/Screens";
import { login, register, type AuthRole } from "@/lib/auth-api";
import { fetchActiveOffers, fetchSavingsSummary } from "@/lib/offers-api";
import {
  createMerchantVoiceIdentity,
  createMerchantVoiceSession,
  fetchMerchantVoiceIdentity,
} from "@/lib/voice-agent-api";
import {
  FALLBACK_FEED_OFFERS,
  getOfferSavingsDelta,
  resolveRedeemOffer,
} from "@/lib/spot-offer-math";

export const Route = createFileRoute("/")({ component: MobileApp });

// Screen index constants
const S = {
  role: 0,
  splash: 1,
  pins: 2,
  meals: 3,
  dietary: 4,
  perms: 5,
  feed: 6,
  offer: 7,
  walk: 8,
  qr: 9,
  confirm: 10,
  settings: 11,
  mOnboard: 12,
  mMargin: 13,
  mVoice: 14,
  mGoal: 15,
  mApproval: 16,
  mDash: 17,
  mScan: 18,
  coverage: 19,
  policy: 20,
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
  const [dir, setDir] = useState<"right" | "up">("right");
  const [history, setHistory] = useState<number[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPseudonym, setUserPseudonym] = useState("");
  const [userRole, setUserRole] = useState<AuthRole | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [isOffersLoading, setIsOffersLoading] = useState(false);
  const [offersSyncStatus, setOffersSyncStatus] = useState<string | null>(null);
  const [savings, setSavings] = useState({
    latestSavedEur: 0,
    todaySavedEur: 0,
    monthSavedEur: 0,
    spotsTried: 0,
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
  const [isVoiceConversationLive, setIsVoiceConversationLive] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeVoiceConversationRef = useRef<{ endSession?: () => Promise<void> } | null>(null);

  const go = useCallback(
    (to: number, anim: "right" | "up" = "right", recordHistory = true) => {
      if (recordHistory) setHistory((prev) => [...prev, idx]);
      setDir(anim);
      setIdx(to);
      window.scrollTo(0, 0);
    },
    [idx],
  );

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

  const hydrateAuthState = useCallback(
    (auth: any) => {
      setAuthToken(auth?.session?.access_token || null);
      setUserPseudonym(auth?.pseudonym || "");
      setUserRole(auth?.role === "merchant" || auth?.role === "consumer" ? auth.role : null);
      const displayName = (auth?.display_name || userName).trim();
      if (displayName) setUserName(displayName);
    },
    [userName],
  );

  const loadLiveData = useCallback(async (pseudonym: string, token: string | null) => {
    if (!pseudonym) return;
    setOffersSyncStatus(null);
    setIsOffersLoading(true);
    try {
      const [liveOffers, summary] = await Promise.all([
        fetchActiveOffers(pseudonym, token),
        fetchSavingsSummary(pseudonym, token),
      ]);
      setOffers(liveOffers.offers || []);
      setSelectedOffer((current) => {
        if (current) {
          return current;
        }
        return resolveRedeemOffer(null, liveOffers.offers || [], FALLBACK_FEED_OFFERS);
      });
      setSavings((prev) => {
        const a = {
          latest: Number(summary.latest_saved_eur) || 0,
          today: Number(summary.today_saved_eur) || 0,
          month: Number(summary.month_saved_eur) || 0,
          spots: Number(summary.spots_tried) || 0,
        };
        return {
          latestSavedEur: Math.max(a.latest, prev.latestSavedEur),
          todaySavedEur: Math.max(a.today, prev.todaySavedEur),
          monthSavedEur: Math.max(a.month, prev.monthSavedEur),
          spotsTried: Math.max(a.spots, prev.spotsTried),
        };
      });
    } catch (error) {
      setOffersSyncStatus(
        error instanceof Error
          ? `Live deals are temporarily unavailable (${error.message}). Showing demo offers.`
          : "Live deals are temporarily unavailable. Showing demo offers.",
      );
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

  const hydrateVoiceIdentity = useCallback(
    (identity?: {
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
    },
    [],
  );

  const saveVoiceIdentity = useCallback(async () => {
    setVoiceIdentityStatus(null);
    const brandStory = merchantVoiceIdentity.brandStory.trim();
    const menuHighlights = parseCsvList(merchantVoiceIdentity.menuHighlights);
    const promotions = parseCsvList(merchantVoiceIdentity.promotions);
    if (brandStory.length < 20) {
      setVoiceIdentityStatus("Add a short brand story (at least 20 characters).");
      return;
    }
    if (!menuHighlights.length && !promotions.length) {
      setVoiceIdentityStatus("Add at least one menu highlight or one promotion to guide the sales agent.");
      return;
    }
    const payload = {
      brand_story: brandStory,
      menu_highlights: menuHighlights,
      promotions,
      voice_name: merchantVoiceIdentity.voiceName.trim(),
      voice_id: merchantVoiceIdentity.voiceId.trim(),
      tone: merchantVoiceIdentity.tone.trim(),
      language: merchantVoiceIdentity.language.trim(),
    };

    if (!authToken) {
      setVoiceIdentityStatus(
        "Saved locally in demo mode. Sign in as merchant to persist to backend.",
      );
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
      setVoiceWidgetSession(null);
      setVoiceWidgetError("Sign in to start a live voice session.");
      setIsVoiceWidgetLoading(false);
      return null;
    }
    if (userRole !== "merchant") {
      setVoiceWidgetSession({ sessionToken: "consumer-live-preview-session" });
      setVoiceWidgetError(null);
      setIsVoiceWidgetLoading(false);
      return { sessionToken: "consumer-live-preview-session" };
    }
    try {
      const session = await createMerchantVoiceSession(authToken);
      const nextSession = {
        sessionToken: session.session_token,
        signedUrl: session.signed_url,
      };
      setVoiceWidgetSession(nextSession);
      return nextSession;
    } catch (error) {
      setVoiceWidgetSession(null);
      const message =
        error instanceof Error ? error.message : "Could not start voice session. Please try again.";
      if (
        message.toLowerCase().includes("requires role: merchant") ||
        message.toLowerCase().includes("forbidden")
      ) {
        setVoiceWidgetError("Voice chat is currently available for merchant accounts only.");
      } else {
        setVoiceWidgetError(message);
      }
      return null;
    } finally {
      setIsVoiceWidgetLoading(false);
    }
  }, [authToken, userRole]);

  const stopVoiceConversation = useCallback(async () => {
    const activeConversation = activeVoiceConversationRef.current;
    activeVoiceConversationRef.current = null;
    setIsVoiceConversationLive(false);
    if (activeConversation?.endSession) {
      try {
        await activeConversation.endSession();
      } catch {
        // no-op: closing a dead conversation can throw
      }
    }
  }, []);

  const startVoiceConversation = useCallback(async () => {
    if (isVoiceConversationLive) return;

    const session = await bootstrapVoiceSession();
    if (!session) return;

    if (!session.signedUrl && !session.sessionToken) {
      setVoiceWidgetError("Live voice handshake failed. Please try again.");
      return;
    }

    if (!session.signedUrl && userRole !== "merchant") {
      setVoiceWidgetError("Switch to a merchant account to launch the live sales voice agent.");
      return;
    }

    try {
      setIsVoiceWidgetLoading(true);
      await stopVoiceConversation();

      const { Conversation } = await import("@elevenlabs/client");
      const conversation = await Conversation.startSession({
        ...(session.signedUrl
          ? { signedUrl: session.signedUrl, connectionType: "websocket" as const }
          : { conversationToken: session.sessionToken, connectionType: "webrtc" as const }),
        onConnect: () => {
          setVoiceWidgetError(null);
          setIsVoiceConversationLive(true);
        },
        onDisconnect: () => {
          activeVoiceConversationRef.current = null;
          setIsVoiceConversationLive(false);
        },
        onError: (errorMessage: unknown) => {
          setVoiceWidgetError(
            typeof errorMessage === "string"
              ? errorMessage
              : "Voice session could not connect. Please check microphone permissions and retry.",
          );
        },
      });
      activeVoiceConversationRef.current = conversation as { endSession?: () => Promise<void> };
    } catch (error) {
      setVoiceWidgetError(
        error instanceof Error
          ? error.message
          : "Unable to launch live sales voice agent right now. Please retry.",
      );
      setIsVoiceConversationLive(false);
    } finally {
      setIsVoiceWidgetLoading(false);
    }
  }, [bootstrapVoiceSession, isVoiceConversationLive, stopVoiceConversation, userRole]);

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
      await loadLiveData(auth.pseudonym || "", auth?.session?.access_token || null);
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

  useEffect(() => {
    return () => {
      void stopVoiceConversation();
    };
  }, [stopVoiceConversation]);

  // Event delegation: intercept all clicks and navigate
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const el = e.target as HTMLElement;
      const btn = el.closest("button");

      // --- Role picker: route consumer → splash, merchant → mOnboard ---
      if (idx === S.role && btn) {
        const role = btn.getAttribute("data-role");
        if (role === "consumer") {
          go(S.splash);
          return;
        }
        if (role === "merchant") {
          go(S.mOnboard, "up");
          return;
        }
      }

      if (btn) {
        const navAction = btn.getAttribute("data-nav");
        if (navAction === "back") {
          if (idx === S.offer || idx === S.walk || idx === S.settings || idx === S.policy)
            go(S.feed, "right", false);
          else goBack();
          return;
        }
        if (navAction === "policy") {
          go(S.policy);
          return;
        }

        const buttonAction = btn.getAttribute("data-action");
        if (buttonAction === "finish-setup") {
          void finishSetup();
          return;
        }
        if (buttonAction === "save-voice-identity") {
          void saveVoiceIdentity();
          return;
        }
        if (buttonAction === "open-voice-widget") {
          setVoiceWidgetOpen(true);
          return;
        }
        if (buttonAction === "close-voice-widget") {
          void stopVoiceConversation();
          setVoiceWidgetOpen(false);
          return;
        }
        if (buttonAction === "start-voice-chat") {
          void startVoiceConversation();
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
          setSelectedOffer((prev) => resolveRedeemOffer(prev, offers, FALLBACK_FEED_OFFERS));
          go(S.qr, "up");
          return;
        }
        if (buttonAction === "start-walk") {
          go(S.offer);
          return;
        }
        if (buttonAction === "simulate-scan") {
          const resolved = resolveRedeemOffer(selectedOffer, offers, FALLBACK_FEED_OFFERS);
          setSelectedOffer(resolved);
          const savedDelta = getOfferSavingsDelta(resolved);
          setSavings((prev) => {
            const nextToday = Number((prev.todaySavedEur + savedDelta).toFixed(2));
            const nextMonth = Number((prev.monthSavedEur + savedDelta).toFixed(2));
            return {
              latestSavedEur: savedDelta,
              todaySavedEur: nextToday,
              monthSavedEur: nextMonth,
              spotsTried: prev.spotsTried + 1,
            };
          });
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
      }

      if (idx === S.feed) {
        const card = el.closest("[data-offer-index]");
        if (card) {
          const offerIndex = Number(card.getAttribute("data-offer-index"));
          const visibleOffers = offers.length ? offers : FALLBACK_FEED_OFFERS;
          if (Number.isFinite(offerIndex) && visibleOffers[offerIndex])
            setSelectedOffer(visibleOffers[offerIndex]);
          go(S.offer);
          return;
        }
      }
    },
    [
      idx,
      go,
      goBack,
      finishSetup,
      offers,
      saveVoiceIdentity,
      startVoiceConversation,
      stopVoiceConversation,
      selectedOffer,
    ],
  );

  const Screen = SCREENS[idx].C;
  const animClass = prefersReducedMotion ? "" : dir === "up" ? "page-enter-up" : "page-enter";
  const showSwitchRole = idx === S.feed || idx === S.settings || idx === S.mDash || idx === S.mScan;
  const showVoiceFab = idx === S.feed || idx === S.offer || idx === S.walk;
  const voiceFabPositionClass =
    idx === S.feed
      ? "left-4 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)]"
      : "left-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)]";

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
          offersSyncStatus,
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
            <div className="fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(S.role);
                }}
                aria-label="Switch role"
                className="px-3 py-1.5 rounded-full bg-[var(--ink)]/70 backdrop-blur text-white text-[11px] font-semibold shadow-md active:scale-95 transition-transform"
              >
                Switch role
              </button>
            </div>
          )}

          {showVoiceFab && (
            <div className={`fixed ${voiceFabPositionClass} z-50`}>
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
                  Start a live voice session to hear what is special about this merchant's menu and
                  offers.
                </p>

                {voiceWidgetSession?.sessionToken && (
                  <div className="mt-3 rounded-xl bg-[var(--cream)] px-3 py-2 text-[11px] text-[var(--forest)]/80">
                    Secure voice session token generated. Ready to connect.
                  </div>
                )}
                {voiceWidgetSession?.signedUrl && (
                  <div className="mt-2 rounded-xl bg-[var(--cream)] px-3 py-2 text-[11px] text-[var(--forest)]/80">
                    Signed launch link generated for this merchant session.
                  </div>
                )}
                {voiceWidgetError && (
                  <div className="mt-2 rounded-xl bg-[var(--terracotta)]/10 px-3 py-2 text-[11px] text-[var(--terracotta)]">
                    {voiceWidgetError}
                  </div>
                )}
                {isVoiceConversationLive && (
                  <div className="mt-2 rounded-xl bg-[oklch(0.94_0.07_150)]/50 px-3 py-2 text-[11px] text-[oklch(0.4_0.1_150)]">
                    Live session connected. The agent now speaks as the merchant salesperson with your
                    brand story and specialties.
                  </div>
                )}

                <button
                  data-action="start-voice-chat"
                  disabled={isVoiceWidgetLoading}
                  className="mt-4 w-full py-3 rounded-full bg-[var(--forest)] text-white text-[13px] font-semibold disabled:opacity-60"
                >
                  {isVoiceWidgetLoading
                    ? "Starting session..."
                    : isVoiceConversationLive
                      ? "Voice chat connected"
                      : "Start voice chat"}
                </button>
              </div>
            </div>
          )}
        </div>
      </SpotAppProvider>
    </MobileModeContext.Provider>
  );
}
