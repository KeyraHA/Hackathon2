import { apiFetch } from "./api";
import type { Sector, SectorStory, StoryStage, StoryVisual, StoryMetric } from "../types/sector.ts";

export function fetchSectors(): Promise<Sector[]> {
  return apiFetch<Sector[]>("/sectors");
}

export async function fetchSectorStory(sectorId: string): Promise<SectorStory> {
  const raw = await apiFetch<Record<string, unknown>>(`/sectors/${sectorId}/story`);
  return normalizeSectorStory(sectorId, raw);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : fallback;
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizeVisual(raw: unknown): StoryVisual {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const kindRaw = asString(pick(r, ["kind", "type"]), "gradient");
    const kind: StoryVisual["kind"] =
      kindRaw === "image" || kindRaw === "icon" ? kindRaw : "gradient";
    return {
      kind,
      value: asString(pick(r, ["value", "url", "imageUrl", "icon"]), "from-emerald-500 to-cyan-600"),
      accentColor: asString(pick(r, ["accentColor", "color"]), "") || undefined,
    };
  }
  if (typeof raw === "string") {
    return { kind: "gradient", value: raw };
  }
  return { kind: "gradient", value: "from-emerald-500 to-cyan-600" };
}

function normalizeMetrics(raw: unknown): StoryMetric[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      if (m && typeof m === "object") {
        const r = m as Record<string, unknown>;
        const label = asString(pick(r, ["label", "name", "key"]));
        const value = pick(r, ["value", "amount"]);
        if (!label || value === undefined) return null;
        return {
          label,
          value: typeof value === "number" || typeof value === "string" ? value : String(value),
        };
      }
      return null;
    })
    .filter((m): m is StoryMetric => m !== null);
}

function normalizeStage(raw: unknown, index: number): StoryStage | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = asString(pick(r, ["title", "heading", "name"]));
  const body = asString(pick(r, ["body", "text", "description", "narrative"]));
  if (!title && !body) return null;
  return {
    id: asString(pick(r, ["id", "stageId"]), `stage-${index}`),
    order: asNumber(pick(r, ["order", "index", "step"]), index),
    title: title || `Etapa ${index + 1}`,
    body,
    visual: normalizeVisual(pick(r, ["visual", "image", "media"])),
    metrics: normalizeMetrics(pick(r, ["metrics", "stats", "indicators"])),
  };
}

export function normalizeSectorStory(
  sectorId: string,
  raw: Record<string, unknown>
): SectorStory {
  const stagesRaw = pick(raw, ["stages", "chapters", "items", "story"]);
  const stages = Array.isArray(stagesRaw)
    ? stagesRaw
        .map((s, i) => normalizeStage(s, i))
        .filter((s): s is StoryStage => s !== null)
        .sort((a, b) => a.order - b.order)
    : [];

  return {
    sectorId,
    sectorName: asString(pick(raw, ["sectorName", "name"]), sectorId),
    summary: asString(pick(raw, ["summary", "description"]), "") || undefined,
    stages,
  };
}
