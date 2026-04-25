import { ReactNode } from "react";

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
  const bgClass =
    bg === "forest"
      ? "bg-[var(--forest)]"
      : bg === "ink"
      ? "bg-[#0c0a09]"
      : bg === "paper"
      ? "bg-[var(--paper)]"
      : "bg-[var(--cream)]";

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
  return (
    <div className={`status-bar ${dark ? "on-dark" : ""}`}>
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <span className="text-[10px]">●●●●</span>
        <span className="ml-1">􀙇</span>
        <span>􀋨</span>
      </span>
    </div>
  );
}
