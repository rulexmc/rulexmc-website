import { getConfig } from "@/lib/config";
import { DatabaseStatsProvider } from "./database";
import { SampleStatsProvider } from "./sample";
import type { StatsProvider } from "./types";

export * from "./types";

let db: DatabaseStatsProvider | null = null;
let sample: SampleStatsProvider | null = null;

export function getStatsProvider(): StatsProvider {
  if (getConfig().statsProvider === "sample") return (sample ??= new SampleStatsProvider());
  return (db ??= new DatabaseStatsProvider());
}
