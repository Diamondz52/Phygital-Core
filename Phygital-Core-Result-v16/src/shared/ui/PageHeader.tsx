"use client";

import { useId, type ReactNode } from "react";

type DecorationVariant = "generic" | "tournaments" | "teams" | "rules" | "faq" | "contacts" | "profile";
const scenes = {
  tournaments: { index: "01", label: "ТУРНИРЫ", image: "/page-objects/tournaments" },
  teams: { index: "02", label: "КОМАНДЫ", image: "/page-objects/teams" },
  rules: { index: "03", label: "ПРАВИЛА", image: "/page-objects/rules" },
  faq: { index: "04", label: "ПОМОЩЬ", image: "/page-objects/faq" },
  contacts: { index: "05", label: "КОНТАКТЫ", image: "/page-objects/contacts" },
  profile: { index: "06", label: "ПРОФИЛЬ", image: "/page-objects/profile" },
  generic: { index: "07", label: "PHYGITAL CORE", image: "/page-objects/profile" },
};

export function PageDecoration({ variant = "generic" }: { visual?: ReactNode; variant?: DecorationVariant }) {
  const { image } = scenes[variant], gradient = useId().replace(/:/g, "");
  return <div className={`header-scene scene-${variant}`} aria-hidden="true">
    <div className="scene-grid"/><div className="scene-glow"/>
    <picture className="scene-image"><source srcSet={`${image}.webp`} type="image/webp"/><img src={`${image}.png`} alt="" width={512} height={512} decoding="async"/></picture>
    <svg className="scene-connections" viewBox="0 0 540 320" fill="none">
      <defs><linearGradient id={gradient}><stop stopColor="#b34fff" stopOpacity="0"/><stop offset=".45" stopColor="#d96aff"/><stop offset="1" stopColor="#70dcff" stopOpacity=".5"/></linearGradient></defs>
      <path className="scene-route" stroke={`url(#${gradient})`} d={variant === "tournaments" ? "M0 180H95V110H180V160H285M40 255H95V210H180V160M285 160H405" : variant === "rules" ? "M0 180H100L145 135H245M45 235H130L170 195H290M95 70H165L210 115H300" : "M0 180H110L175 115H290L365 185H485M40 250H150L215 185H365M90 65H215L290 115"}/>
      <circle cx="365" cy="160" r="106" className="scene-orbit"/><circle cx="365" cy="160" r="128" className="scene-orbit scene-orbit-outer" strokeDasharray="3 15"/>
      {[ [110,180], [175,115], [215,185], [290,115], [365,185], [485,185] ].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={i===3?5:3} className={`scene-node node-${i}`}/>)}
    </svg>
    <span className="scene-corner corner-one"/><span className="scene-corner corner-two"/>
  </div>;
}

export function PageHeader({ eyebrow, title, description, visual, variant = "generic" }: { eyebrow: string; title: string; description: string; visual?: ReactNode; variant?: DecorationVariant }) {
  const inferred: DecorationVariant = variant !== "generic" ? variant : title === "Турниры" ? "tournaments" : title === "Команды" ? "teams" : title === "Правила" ? "rules" : title === "FAQ" ? "faq" : title === "Контакты" ? "contacts" : title === "Личный кабинет" ? "profile" : "generic";
  const scene = scenes[inferred];
  return <section className={`page-heading page-heading-v12 heading-${inferred}`}>
    <div className="page-heading-copy">
      <p className="page-index"><span>PHYGITAL</span><i/> {scene.index} <span className="page-index-label">/ {scene.label}</span></p>
      <h1>{title}</h1>
      <p className="page-tagline">{eyebrow}</p><p className="page-description">{description}</p>
    </div>
    <PageDecoration visual={visual} variant={inferred}/>
  </section>;
}
