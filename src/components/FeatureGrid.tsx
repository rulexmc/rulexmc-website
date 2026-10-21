import { NETWORK_FEATURES, type FeatureIcon } from "@/lib/site";
import { Icon, type IconName } from "./Icon";

const MAP: Record<FeatureIcon, IconName> = {
  portal: "portal", spark: "spark", trophy: "trophy", hud: "hud", devices: "devices", shield: "shield",
};

export function FeatureGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {NETWORK_FEATURES.map((f) => (
        <li key={f.title} className="card flex gap-4 p-6">
          <span className="icon-tile"><Icon name={MAP[f.icon]} className="h-6 w-6" /></span>
          <div>
            <h3 className="font-hud text-xl font-bold uppercase tracking-wider text-white">{f.title}</h3>
            <p className="mt-1.5 leading-relaxed text-bone-300">{f.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
