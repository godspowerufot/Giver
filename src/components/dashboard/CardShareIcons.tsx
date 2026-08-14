"use client";

import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-zinc-500/40 text-white backdrop-blur-sm transition hover:bg-zinc-400/50 hover:text-white disabled:opacity-35";

function GmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4.2-8 5-8-5V6l8 5 8-5v2.2z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7zm0 2.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6zM17.8 6.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export type CardShareHandlers = {
  onWhatsApp: () => void;
  onGmail: () => void;
  onInstagram: () => void;
  onX: () => void;
  disabled?: boolean;
};

export function CardShareIcons({
  onWhatsApp,
  onGmail,
  onInstagram,
  onX,
  disabled = false,
}: CardShareHandlers) {
  return (
    <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5">
      <button
        type="button"
        className={iconBtn}
        disabled={disabled}
        onClick={onWhatsApp}
        aria-label="Share on WhatsApp"
        title="WhatsApp"
      >
        <WhatsAppIcon className="h-[15px] w-[15px]" />
      </button>
      <button
        type="button"
        className={iconBtn}
        disabled={disabled}
        onClick={onGmail}
        aria-label="Share by Gmail"
        title="Gmail"
      >
        <GmailIcon />
      </button>
      <button
        type="button"
        className={iconBtn}
        disabled={disabled}
        onClick={onInstagram}
        aria-label="Share to Instagram"
        title="Instagram"
      >
        <InstagramIcon />
      </button>
      <button
        type="button"
        className={iconBtn}
        disabled={disabled}
        onClick={onX}
        aria-label="Share on X"
        title="X"
      >
        <XIcon />
      </button>
    </div>
  );
}
