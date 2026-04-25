import { createFileRoute } from "@tanstack/react-router";
import {
  S01Splash, S02Pins, S03Meals, S04Permissions, S05Feed, S06OfferDetail,
  S07Walk, S08QR, S09Confirm, S10Settings, S11MerchantOnboarding,
  S12Margin, S13Goal, S14Dashboard, S15Scanner, S16Demo,
} from "@/components/spot/Screens";
import { SpotLogo } from "@/components/spot/Visuals";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spot — Generative City Wallet · High-Fidelity Mockups" },
      { name: "description", content: "16 mobile mockups for Spot, a hyper-personalized local-offer app for neighborhoods. Terracotta + forest, hand-crafted, on-device AI." },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const userScreens = [
    <S01Splash />, <S02Pins />, <S03Meals />, <S04Permissions />,
    <S05Feed />, <S06OfferDetail />, <S07Walk />, <S08QR />,
    <S09Confirm />, <S10Settings />,
  ];
  const merchantScreens = [
    <S11MerchantOnboarding />, <S12Margin />, <S13Goal />, <S14Dashboard />, <S15Scanner />,
  ];

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.94 0.018 75)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[oklch(0.94_0.018_75/0.85)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <SpotLogo size={36} />
          <div>
            <div className="font-display text-xl text-[var(--forest)] leading-none">Spot</div>
            <div className="text-[11px] text-[var(--forest)]/60">Generative city wallet · 16 screens</div>
          </div>
          <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-[var(--forest)]/70">
            <a href="#user" className="hover:text-[var(--terracotta)]">User app</a>
            <a href="#merchant" className="hover:text-[var(--terracotta)]">Merchant</a>
            <a href="#dev" className="hover:text-[var(--terracotta)]">Dev</a>
          </nav>
          <span className="ml-4 text-[10px] font-semibold tracking-widest text-[var(--terracotta)] hidden md:inline">
            iPhone 14 Pro · 393×852
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--border)] text-[11px] font-semibold tracking-wider text-[var(--forest)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--terracotta)] animate-pulse" />
          HIGH-FIDELITY MOCKUPS · STUTTGART CASE STUDY
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-[var(--forest)] mt-5 leading-[1.05] tracking-tight">
          Little reasons to step
          <br /> outside, made for your block.
        </h1>
        <p className="mt-5 text-[15px] text-[var(--forest)]/70 max-w-2xl mx-auto leading-relaxed">
          Mia is on her lunch break. It's 11°C, light rain. Spot composes a fresh offer card —
          not a coupon — for Tony's café, 80m away. She walks. Tony smiles.
        </p>
      </section>

      {/* Section: user app */}
      <SectionHeader id="user" eyebrow="Customer flow · 1 → 10" title="The morning Mia found Tony." />
      <Grid screens={userScreens} />

      {/* Section: merchant */}
      <SectionHeader id="merchant" eyebrow="Merchant flow · 11 → 15" title="And how Tony filled his quiet hour." />
      <Grid screens={merchantScreens} />

      {/* Section: dev */}
      <SectionHeader id="dev" eyebrow="Dev tooling · 16" title="Switch the world to demo it." />
      <Grid screens={[<S16Demo />]} />

      {/* Tokens panel */}
      <Tokens />

      <footer className="py-12 text-center text-[12px] text-[var(--forest)]/50">
        Spot · neighbourhood-warm design system · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function SectionHeader({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div id={id} className="max-w-7xl mx-auto px-6 mt-20 mb-8 scroll-mt-24">
      <div className="flex items-end gap-6 border-b border-[var(--border)] pb-4">
        <div className="flex-1">
          <div className="text-[11px] font-semibold tracking-widest text-[var(--terracotta)]">{eyebrow}</div>
          <h2 className="font-display text-3xl md:text-4xl text-[var(--forest)] mt-1 leading-tight">{title}</h2>
        </div>
        <div className="hand-dash w-20 mb-3 hidden md:block" />
      </div>
    </div>
  );
}

function Grid({ screens }: { screens: React.ReactNode[] }) {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-8">
      <div className="flex flex-wrap gap-x-10 gap-y-14 justify-center">
        {screens.map((s, i) => (
          <div key={i}>{s}</div>
        ))}
      </div>
    </div>
  );
}

function Tokens() {
  const colors = [
    { n: "Terracotta", v: "#E76F51", c: "var(--terracotta)" },
    { n: "Forest", v: "#264653", c: "var(--forest)" },
    { n: "Cream", v: "#FEF3E2", c: "var(--cream)" },
    { n: "Sand", v: "#F4A261", c: "var(--sand)" },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 mt-24">
      <div className="rounded-3xl bg-[var(--paper)] border border-[var(--border)] p-8 md:p-10">
        <div className="text-[11px] font-semibold tracking-widest text-[var(--terracotta)]">DESIGN TOKENS</div>
        <h2 className="font-display text-3xl text-[var(--forest)] mt-1">Neighbourhood warmth.</h2>
        <p className="text-sm text-[var(--forest)]/70 mt-2 max-w-xl">
          A small, deliberate palette. Hand-crafted feel through film grain, torn edges, hand-drawn pins, and tilted hovers.
        </p>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-[var(--forest)]/60 mb-3">PALETTE</div>
            <div className="grid grid-cols-2 gap-3">
              {colors.map((c) => (
                <div key={c.n} className="rounded-2xl border border-[var(--border)] overflow-hidden bg-white">
                  <div className="h-20" style={{ background: c.c }} />
                  <div className="p-3">
                    <div className="font-display text-[15px] text-[var(--forest)]">{c.n}</div>
                    <div className="text-[11px] text-[var(--forest)]/60 font-mono">{c.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-[var(--forest)]/60 mb-3">TYPOGRAPHY</div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="font-display text-3xl text-[var(--forest)] leading-tight">Cabinet Grotesk</div>
              <div className="text-[11px] text-[var(--forest)]/60 mt-1">Display · headlines · warmth</div>
              <div className="hand-dash w-16 my-4" />
              <div className="text-[15px] text-[var(--forest)]">Inter · body · clean and quiet</div>
              <div className="text-[11px] text-[var(--forest)]/60 mt-1">Used for paragraphs, labels, metadata</div>
            </div>
            <div className="mt-4 rounded-2xl bg-[var(--forest)] text-white p-5">
              <div className="text-[11px] tracking-widest font-semibold text-[var(--sand)]">VOICE</div>
              <div className="font-display text-[18px] mt-1 leading-snug">"Tony just brewed a fresh batch — and it's quiet today."</div>
              <div className="text-[11px] text-white/60 mt-2">Personal. Warm. Slightly poetic. Never marketing.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
