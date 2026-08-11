export interface CelebrationLines {
  headline: string;
  reply: string;
}

const REPLIES = [
  "My wallet filed a missing-person report and listed your name as the last known location.",
  "You're not on my payroll… but somehow you're in the budget every week.",
  "If loyalty points existed for receiving my transfers, you'd be platinum by now.",
  "I checked who I give the most. Spoiler: it was you. Again.",
  "My statement read like a love letter — and somehow every chapter was you.",
  "Congrats! You won 'Most Likely to Appear on My Debit Column.' Trophy pending.",
  "I told my money to behave. It said your name and left.",
  "You're my top recipient. At this point, OPay should just rename my account after you.",
  "Not saying you're expensive… but my charts made a shrine in your honor.",
  "If giving were a sport, you'd be my season MVP. Unpaid. Obviously.",
  "I open Giver for insights. I stay for the reminder that you're winning.",
  "You're #1. My savings account asked for a restraining order.",
];

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function buildCelebration(name: string, sharePct: number): CelebrationLines {
  const short = firstName(name);
  const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)]!;
  return {
    headline: `${short}, you're my top recipient`,
    reply:
      sharePct >= 1
        ? `${reply} (That's ${sharePct.toFixed(0)}% of my person transfers — no notes.)`
        : reply,
  };
}

const THANKS = [
  "Thank you. My account balance smiles every time your name shows up as a credit.",
  "You're the reason my 'Transfer in' chart looks this good. Truly.",
  "Official thank-you note: you send the most, and my wallet noticed.",
  "If gratitude had a bank transfer, I'd send it back — with interest.",
  "You're my top sender. My statement said thank you before I could.",
  "Big thanks. You keep showing up in the credit column like a legend.",
  "Thank you for funding my plot twists. My charts agree.",
  "You're #1 on people who send me money. Consider this my receipt of appreciation.",
  "Grateful doesn't cover it — but this card will have to do.",
  "Thank you. Whenever money comes in, I check the name… and smile when it's you.",
  "You send the most. I notice. I'm saying thank you out loud now.",
  "My top sender award goes to you. Trophy is this thank-you card. Enjoy.",
];

export function buildThankYou(name: string, sharePct: number): CelebrationLines {
  const short = firstName(name);
  const reply = THANKS[Math.floor(Math.random() * THANKS.length)]!;
  return {
    headline: `${short}, thank you`,
    reply:
      sharePct >= 1
        ? `${reply} (You're ${sharePct.toFixed(0)}% of what people sent me — wild.)`
        : reply,
  };
}
