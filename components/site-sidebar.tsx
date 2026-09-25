import { NavTree } from "@/components/nav-tree";
import type { TrackGroup } from "@/lib/types";

export function SiteSidebar({ groups }: { groups: TrackGroup[] }) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-border py-6 pr-4 lg:block">
      <NavTree groups={groups} />
    </aside>
  );
}
