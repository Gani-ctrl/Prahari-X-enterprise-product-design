import type { Asset, Mission, Personnel, ThreatReport } from "@/types";
import { formatDate } from "@/lib/utils";

export interface CommandBriefing {
  generatedAt: string;
  executiveSummary: string;
  missionStatus: string[];
  threatAssessment: string[];
  personnelReadiness: string;
  recommendation: string;
}

export function generateBriefing(missions: Mission[], threats: ThreatReport[], personnel: Personnel[], assets: Asset[]): CommandBriefing {
  const active = missions.filter((m) => m.status === "active");
  const critical = threats.filter((t) => t.status === "active" && (t.severity === "critical" || t.severity === "high"));
  const deployed = personnel.filter((p) => p.status === "deployed").length;
  const avgHealth = personnel.length ? Math.round(personnel.reduce((s, p) => s + p.healthScore, 0) / personnel.length) : 0;
  const deployedAssets = assets.filter((a) => a.status === "deployed").length;

  const executiveSummary =
    `As of ${formatDate(new Date())}, ${active.length} mission${active.length === 1 ? " is" : "s are"} active across the theatre, with ` +
    `${deployed} personnel and ${deployedAssets} assets currently deployed. ${critical.length} high-priority threat${critical.length === 1 ? "" : "s"} ` +
    `${critical.length === 1 ? "requires" : "require"} continued monitoring. Overall force health readiness stands at ${avgHealth}%.`;

  const missionStatus = active
    .slice(0, 5)
    .map((m) => `${m.code} — ${m.name}: ${m.progress}% complete, ${m.priority} priority, operating in ${m.region}.`);
  if (missionStatus.length === 0) missionStatus.push("No missions currently active.");

  const threatAssessment = critical
    .slice(0, 5)
    .map((t) => `${t.title} (${t.severity.toUpperCase()}) — ${t.region}, ${t.category} vector, AI confidence ${t.aiConfidence}%.`);
  if (threatAssessment.length === 0) threatAssessment.push("No critical or high-severity threats currently active.");

  const personnelReadiness =
    `${deployed} of ${personnel.length} personnel deployed. Average health score ${avgHealth}%. ` +
    `${personnel.filter((p) => p.status === "medical").length} personnel currently flagged for medical review.`;

  const recommendation =
    critical.length > 0
      ? `Recommend prioritizing reconnaissance and response assets toward ${critical[0].region} given the ${critical[0].severity} ${critical[0].category} threat. Continue standard rotation for all other sectors.`
      : "No immediate escalation required. Maintain standard operational tempo and continue scheduled readiness reviews.";

  return {
    generatedAt: new Date().toISOString(),
    executiveSummary,
    missionStatus,
    threatAssessment,
    personnelReadiness,
    recommendation,
  };
}
