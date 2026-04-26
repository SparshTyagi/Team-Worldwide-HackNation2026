import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
}));

vi.mock("@/lib/auth-api", () => ({
  register: vi.fn(),
  login: vi.fn(),
}));

vi.mock("@/lib/offers-api", () => ({
  fetchActiveOffers: vi.fn().mockResolvedValue({ offers: [] }),
  fetchSavingsSummary: vi.fn().mockResolvedValue({
    latest_saved_eur: 3.4,
    today_saved_eur: 3.4,
    month_saved_eur: 42.1,
    spots_tried: 17,
  }),
}));

vi.mock("@/lib/voice-agent-api", () => ({
  createMerchantVoiceIdentity: vi.fn().mockResolvedValue({
    merchant_id: "m-1",
    status: "saved",
    updated_at_utc: new Date().toISOString(),
    identity: {
      brand_story: "Fresh pastries daily",
      menu_highlights: ["cortado"],
      promotions: ["happy hour"],
      voice_name: "Warm Guide",
      voice_id: "voice_123",
      tone: "friendly",
      language: "en",
    },
  }),
  fetchMerchantVoiceIdentity: vi.fn().mockResolvedValue({
    merchant_id: "m-1",
    status: "saved",
    updated_at_utc: new Date().toISOString(),
  }),
  createMerchantVoiceSession: vi.fn().mockResolvedValue({
    merchant_id: "m-1",
    agent_id: "agent_123",
    provider: "elevenlabs",
    created_at_utc: new Date().toISOString(),
    session_token: "session-token-12345",
  }),
}));

function MockScreen({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <section data-testid={`screen-${id}`}>
      <h1>{id}</h1>
      {children}
    </section>
  );
}

vi.mock("@/components/spot/Screens", () => ({
  SpotAppProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  S00RolePicker: () => (
    <MockScreen id="role">
      <button data-role="consumer">Consumer</button>
      <button data-role="merchant">Merchant</button>
    </MockScreen>
  ),
  S01Splash: () => <MockScreen id="splash" />,
  S02Pins: () => (
    <MockScreen id="pins">
      <button data-action="continue">Continue</button>
    </MockScreen>
  ),
  S03Meals: () => (
    <MockScreen id="meals">
      <button data-action="looks-right">Looks right</button>
    </MockScreen>
  ),
  S04bDietary: () => (
    <MockScreen id="dietary">
      <button data-action="continue">Continue</button>
    </MockScreen>
  ),
  S04Permissions: () => (
    <MockScreen id="perms">
      <button data-action="continue">Continue</button>
      <button data-nav="policy">Read the full policy</button>
    </MockScreen>
  ),
  S05Feed: () => (
    <MockScreen id="feed">
      <div data-offer-index="0">
        <span>Offer card</span>
      </div>
      <div className="border-t">
        <button data-action="feed-tab-map">Map</button>
        <button data-action="feed-tab-privacy">Privacy</button>
      </div>
    </MockScreen>
  ),
  S06OfferDetail: () => (
    <MockScreen id="offer">
      <button data-nav="back">Back</button>
      <button data-action="redeem-now">Redeem now</button>
    </MockScreen>
  ),
  S07Walk: () => (
    <MockScreen id="walk">
      <button data-nav="back">Back</button>
      <button data-action="start-walk">Start the walk</button>
    </MockScreen>
  ),
  S08QR: () => (
    <MockScreen id="qr">
      <button data-action="simulate-scan">Simulate scan →</button>
      <button data-action="cancel-redeem">Cancel redeem</button>
    </MockScreen>
  ),
  S09Confirm: () => (
    <MockScreen id="confirm">
      <button data-action="confirm-done">Done</button>
      <button data-action="confirm-rate">Rate Tony's in 5 seconds</button>
    </MockScreen>
  ),
  S10Settings: () => (
    <MockScreen id="settings">
      <button data-nav="back">Back</button>
      <button>Wipe all on-device memory</button>
      <button>Export profile</button>
    </MockScreen>
  ),
  S11MerchantOnboarding: () => (
    <MockScreen id="m-onboard">
      <button data-nav="back">Back</button>
      <button data-action="merchant-continue-challenge-fit">Continue to challenge fit</button>
    </MockScreen>
  ),
  S12Margin: () => (
    <MockScreen id="m-margin">
      <button data-nav="back">Back</button>
      <button data-action="merchant-lock-margin">Lock in 22%</button>
    </MockScreen>
  ),
  S13Goal: () => (
    <MockScreen id="m-goal">
      <button data-nav="back">Back</button>
      <button data-action="merchant-configure-voice">Configure voice identity</button>
      <button data-action="merchant-submit-approval">Submit for approval</button>
    </MockScreen>
  ),
  S13bVoiceIdentity: () => (
    <MockScreen id="m-voice">
      <button data-nav="back">Back</button>
      <button data-action="save-voice-identity">Save voice identity</button>
      <button data-action="merchant-submit-approval">Submit for approval</button>
    </MockScreen>
  ),
  S14MerchantApproval: () => (
    <MockScreen id="m-approval">
      <button data-nav="back">Back</button>
      <button data-action="merchant-simulate-approval">Simulate approval</button>
    </MockScreen>
  ),
  S14Dashboard: () => (
    <MockScreen id="m-dash">
      <button data-action="merchant-manage-voice">manage</button>
      <button data-action="merchant-open-scanner">Open scanner</button>
    </MockScreen>
  ),
  S15Scanner: () => (
    <MockScreen id="m-scan">
      <button data-action="merchant-scan-next">Scan next customer</button>
    </MockScreen>
  ),
  S16RoadmapCoverage: () => (
    <MockScreen id="coverage">
      <button data-nav="back">Back</button>
    </MockScreen>
  ),
  S16PrivacyPolicy: () => (
    <MockScreen id="policy">
      <button data-nav="back">Back</button>
    </MockScreen>
  ),
}));

import { MobileApp } from "@/routes/index";

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function expectScreen(id: string) {
  expect(screen.getByTestId(`screen-${id}`)).toBeInTheDocument();
}

describe("MobileApp user journeys", () => {
  it("auto-advances customer splash and shows role switcher", () => {
    vi.useFakeTimers();
    render(<MobileApp />);

    expectScreen("role");
    click("Consumer");
    expectScreen("splash");
    expect(screen.queryByRole("button", { name: "Switch role" })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expectScreen("pins");
    vi.useRealTimers();
  });

  it("covers customer onboarding, policy path, and redemption flow", () => {
    vi.useFakeTimers();
    render(<MobileApp />);

    click("Consumer");
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    click("Continue");
    click("Looks right");
    click("Continue");
    expectScreen("perms");

    click("Read the full policy");
    expectScreen("policy");
    click("Back");
    expectScreen("feed");

    click("Map");
    expectScreen("walk");
    click("Start the walk");
    expectScreen("offer");
    click("Redeem now");
    expectScreen("qr");
    click("Simulate scan →");
    expectScreen("confirm");
    click("Done");
    expectScreen("feed");

    fireEvent.click(screen.getByText("Offer card"));
    expectScreen("offer");
    click("Back");
    expectScreen("feed");

    click("Privacy");
    expectScreen("settings");
    click("Back");
    expectScreen("feed");
    vi.useRealTimers();
  });

  it("returns to feed for cancel and rate actions", () => {
    vi.useFakeTimers();
    render(<MobileApp />);

    click("Consumer");
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    click("Continue");
    click("Looks right");
    click("Continue");
    click("Continue");

    fireEvent.click(screen.getByText("Offer card"));
    click("Redeem now");
    click("Cancel redeem");
    expectScreen("feed");

    fireEvent.click(screen.getByText("Offer card"));
    click("Redeem now");
    click("Simulate scan →");
    click("Rate Tony's in 5 seconds");
    expectScreen("feed");
    vi.useRealTimers();
  });

  it("covers merchant journey through approval and scanner", () => {
    render(<MobileApp />);

    click("Merchant");
    expectScreen("m-onboard");
    click("Continue to challenge fit");
    expectScreen("m-margin");
    click("Back");
    expectScreen("m-onboard");
    click("Continue to challenge fit");
    click("Lock in 22%");
    expectScreen("m-voice");
    click("Submit for approval");
    expectScreen("m-approval");
    click("Simulate approval");
    expectScreen("m-dash");
    click("manage");
    expectScreen("m-voice");
    click("Submit for approval");
    click("Simulate approval");
    click("Open scanner");
    expectScreen("m-scan");
    click("Scan next customer");
    expectScreen("m-scan");
    click("Switch role");
    expectScreen("role");
  });

  it("opens the customer voice widget and boots a session", () => {
    vi.useFakeTimers();
    render(<MobileApp />);

    click("Consumer");
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    click("Continue");
    click("Looks right");
    click("Continue");
    click("Continue");

    click("Talk to this shop");
    expect(screen.getByText("Sales agent ready")).toBeInTheDocument();
    click("Start voice chat");
    expect(screen.getByText(/Sign in to start a live voice session/)).toBeInTheDocument();
    click("Close voice assistant");
    expect(screen.queryByText("Sales agent ready")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
