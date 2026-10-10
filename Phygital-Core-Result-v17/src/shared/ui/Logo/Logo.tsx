"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
export function Logo({ variant = "header" }: { variant?: "header" | "footer" }) {
  return (
    <Link className={`logo logo-${variant}`} href="/" aria-label="Phygital Core — главная">
      <img
        className="brand-logo-image"
        src={variant === "footer" ? "/brand-logo-footer.webp" : "/brand-logo-header.webp"}
        alt=""
      />
      <span>
        Phygital
        <br />
        Core
      </span>
    </Link>
  );
}
