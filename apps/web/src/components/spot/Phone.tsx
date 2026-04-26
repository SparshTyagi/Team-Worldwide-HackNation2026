import { ReactNode, createContext, useContext } from "react";

/** When true, Phone renders fullscreen instead of in an iPhone frame */
export const MobileModeContext = createContext(false);

export function Phone({
  title,
  number,
  children,
  bg = "cream",
}: {
  title: string;
  number: number;
  children: ReactNode;
  bg?: "cream" | "forest" | "ink" | "paper";
}) {
  const isMobile = useContext(MobileModeContext);
  const bgClass =
    bg === "forest"
      ? "bg-[var(--forest)]"
      : bg === "ink"
        ? "bg-[#0c0a09]"
        : bg === "paper"
          ? "bg-[var(--paper)]"
          : "bg-[var(--cream)]";

  if (isMobile) {
    return <div className={`mobile-screen ${bgClass}`}>{children}</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="iphone-frame">
        <div className="iphone-island" />
        <div className={`iphone-screen ${bgClass}`}>{children}</div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-[var(--terracotta)] tracking-widest">
          0{number < 10 ? "0" : ""}
          {number}
        </div>
        <div className="font-display text-base text-[var(--forest)]">{title}</div>
      </div>
    </div>
  );
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  void dark;
  return null;
}
