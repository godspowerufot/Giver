export interface CelebrationLines {
  headline: string;
  reply: string;
}

/** Spender → top recipient: savage Pidgin celebration. */
const RECIPIENT_ROASTS = [
  "My guy, you don collect my money pass NEPA collect light bill. Congrats o.",
  "Abeg, your account na my second BVN. Anytime money leave, e dey find you.",
  "Na you be the real landlord of my wallet. Rent dey clear sharp sharp.",
  "I check who I give most… e be you again. At this point just open POS for me.",
  "Omo, if giving money na exam, you don graduate with first class from my OPay.",
  "My debit column dey hail you like VIP. Even my balance dey fear your name.",
  "You no be thief, but my money dey salute you every week. Respect.",
  "Wetin I do you? Why my transfer history look like your CV?",
  "If love na money, you don marry my wallet long time. Soft life unlocked.",
  "Top recipient award goes to you. Trophy na this card — cash you don already collect.",
  "Bro/sis, calm down small. Leave last 2k for me, no be only you dey hungry.",
  "My statement read your name more than my own. Na you be the main character.",
];

/** Receiver → top sender: funny Pidgin thank-you. */
const SENDER_THANKS = [
  "Oga thank you o! Your credit dey hit my account like blessing wey no get expiry date.",
  "My guy, anytime your alert land, even my phone dey smile. God bless your hustle.",
  "Na you be my personal Central Bank. Interest rate? Pure vibes.",
  "Thank you! If money fit talk, e go say your name with bass voice.",
  "You dey send pass small small. My balance dey greet you before I even wake.",
  "Big man/woman thank you. Your transfer na the reason my chart no dey look like sadness.",
  "I no go lie — your money dey keep me standing. May your pocket never dry.",
  "Alert from you na my favourite ringtone. Keep that energy, chairman.",
  "Thank you o. You no just send money — you send hope, food, and small swagger.",
  "Top sender award: YOU. My account say make I tell you say e appreciate the sponsorship.",
  "God when? God now — and God look like your transfer. Thank you plenty.",
  "My credit column dey clap for you. Me sef dey clap. Make we clap together.",
];

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function buildCelebration(name: string, sharePct: number): CelebrationLines {
  const short = firstName(name);
  const reply = RECIPIENT_ROASTS[Math.floor(Math.random() * RECIPIENT_ROASTS.length)]!;
  return {
    headline: `${short}, you don win o`,
    reply:
      sharePct >= 1
        ? `${reply} (Na ${sharePct.toFixed(0)}% of my person transfers — no deny!)`
        : reply,
  };
}

export function buildThankYou(name: string, sharePct: number): CelebrationLines {
  const short = firstName(name);
  const reply = SENDER_THANKS[Math.floor(Math.random() * SENDER_THANKS.length)]!;
  return {
    headline: `${short}, thank you o`,
    reply:
      sharePct >= 1
        ? `${reply} (You be ${sharePct.toFixed(0)}% of wetin people send me — mad!)`
        : reply,
  };
}
