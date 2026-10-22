import type { Metric } from "@/lib/stats/types";
import type { IconName } from "./Icon";

export const METRIC_ICON: Record<Metric, IconName> = {
  kills: "sword", hearts: "heart", playtime: "clock", balance: "coins", level: "spark", deaths: "skull",
};
