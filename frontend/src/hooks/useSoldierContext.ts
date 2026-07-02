import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { assetsApi, missionsApi, personnelApi } from "@/services/api";
import type { Asset, Mission, Personnel } from "@/types";

interface SoldierContext {
  isLoading: boolean;
  personnel: Personnel | null;
  missions: Mission[];
  assets: Asset[];
}

/**
 * Resolves everything a soldier is allowed to see: their own roster record,
 * the missions they're assigned to (via squadIds), and the equipment
 * attached to those missions. Every Soldier portal page shares this one
 * data-scoping hook instead of re-implementing the filter.
 */
export function useSoldierContext(): SoldierContext {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<SoldierContext>({ isLoading: true, personnel: null, missions: [], assets: [] });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [personnelList, missionList, assetList] = await Promise.all([
        personnelApi.list(),
        missionsApi.list(),
        assetsApi.list(),
      ]);
      if (cancelled) return;
      const me = personnelList.find((p) => p.id === user?.personnelId) ?? null;
      const myMissions = me ? missionList.filter((m) => m.squadIds.includes(me.id)) : [];
      const myAssetIds = new Set(myMissions.flatMap((m) => m.equipmentIds));
      const myAssets = assetList.filter((a) => myAssetIds.has(a.id));
      setState({ isLoading: false, personnel: me, missions: myMissions, assets: myAssets });
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.personnelId]);

  return state;
}
