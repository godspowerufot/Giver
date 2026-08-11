import type { PersonAggregate, Recommendation } from "@/lib/types";

const DOMINANCE_WARN = 0.25;
const DOMINANCE_CRITICAL = 0.4;
const SUGGESTED_CAP_SHARE = 0.15;

export function buildRecommendations(
  recipients: PersonAggregate[],
  totalTransferSent: number,
): Recommendation[] {
  const recs: Recommendation[] = [];
  if (!recipients.length || totalTransferSent <= 0) {
    return [
      {
        id: "empty",
        severity: "info",
        title: "Upload a statement to unlock insights",
        body: "Once person-to-person transfers are detected, Giver will show who dominates your giving and suggest spend caps.",
      },
    ];
  }

  const top = recipients[0];
  if (top.shareOfSent >= DOMINANCE_CRITICAL) {
    const cap = totalTransferSent * SUGGESTED_CAP_SHARE;
    recs.push({
      id: `critical-${top.name}`,
      severity: "critical",
      person: top.name,
      title: `${top.name} dominates your outflow`,
      body: `${(top.shareOfSent * 100).toFixed(0)}% of person transfers went here. Cap the next cycle near ₦${cap.toLocaleString("en-NG", { maximumFractionDigits: 0 })} (~${(SUGGESTED_CAP_SHARE * 100).toFixed(0)}% of transfer spend) and redirect the rest.`,
    });
  } else if (top.shareOfSent >= DOMINANCE_WARN) {
    recs.push({
      id: `warn-${top.name}`,
      severity: "warn",
      person: top.name,
      title: `Heavy concentration on ${top.name}`,
      body: `About ${(top.shareOfSent * 100).toFixed(0)}% of transfer spend sits with one person. Spread support across 2–3 people next month to reduce dependency risk.`,
    });
  }

  const topThreeShare = recipients
    .slice(0, 3)
    .reduce((sum, r) => sum + r.shareOfSent, 0);
  if (topThreeShare >= 0.7 && recipients.length >= 3) {
    recs.push({
      id: "top-three",
      severity: "warn",
      title: "Top three recipients hold most of the pie",
      body: `${(topThreeShare * 100).toFixed(0)}% of transfer spend is locked to three names. Set a soft weekly envelope per person so smaller asks still get through.`,
    });
  }

  const frequent = recipients.filter((r) => r.sentCount >= 5 && r.shareOfSent < 0.15);
  if (frequent.length) {
    const name = frequent[0].name;
    recs.push({
      id: `freq-${name}`,
      severity: "info",
      person: name,
      title: `Frequent small sends to ${name}`,
      body: `${frequent[0].sentCount} transfers add up quietly. Batch into one or two planned sends to keep giving clearer.`,
    });
  }

  if (!recs.length) {
    recs.push({
      id: "healthy",
      severity: "info",
      title: "Spending looks evenly spread",
      body: "No single recipient is dominating transfer outflow. Keep reviewing monthly as volumes change.",
    });
  }

  return recs;
}
