import { useEffect, useMemo, useRef, useState } from "react";
import { Radar as RadarIcon, Loader2, AlertTriangle, Crosshair as CrosshairIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMapLibreLoader } from "./useMapLibreLoader";
import { AOI_CENTER, circlePolygon, jitterCoords, locationToCoords, READINESS_META, type ReadinessLevel } from "./mapGeo";
import { createMarkerElement } from "./mapMarkers";
import { MapEntityPanel, type SelectedEntity } from "./MapEntityPanel";
import type { Asset, Assignment, Mission, PatrolRoute, Personnel, Squad, ThreatReport } from "@/types";

const SEVERITY_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };

// Free, keyless OSM raster basemap — no API key, no npm map-tile dependency.
// The dark "tactical" look is applied as a CSS filter on the rendered
// canvas only (not the DOM marker layer sitting on top of it), so the base
// terrain goes dark/inverted while marker glyphs keep their true colors.
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

type LayerKey = "bases" | "personnel" | "squads" | "vehicles" | "aircraft" | "missions" | "patrols" | "zones" | "threats" | "emergencies" | "weather" | "terrain";

const LAYER_LABELS: Record<LayerKey, string> = {
  bases: "Bases",
  personnel: "Soldiers",
  squads: "Squads",
  vehicles: "Vehicles & Drones",
  aircraft: "Aircraft",
  missions: "Missions",
  patrols: "Patrol Routes",
  zones: "Operational Zones",
  threats: "Threat Indicators",
  emergencies: "Emergencies",
  weather: "Weather",
  terrain: "Terrain",
};

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  bases: true,
  personnel: true,
  squads: true,
  vehicles: true,
  aircraft: false,
  missions: true,
  patrols: true,
  zones: true,
  threats: true,
  emergencies: true,
  weather: false,
  terrain: false,
};

export interface LiveOperationsMapProps {
  regions: string[];
  personnel: Personnel[];
  assets: Asset[];
  missions: Mission[];
  threats: ThreatReport[];
  patrolRoutes: PatrolRoute[];
  emergencyIncidents: { id: string; title: string; region: string }[];
  squads?: Squad[];
  assignments?: Assignment[];
}

const emptyFC = { type: "FeatureCollection" as const, features: [] as any[] };

export function LiveOperationsMap({
  regions,
  personnel,
  assets,
  missions,
  threats,
  patrolRoutes,
  emergencyIncidents,
  squads = [],
  assignments = [],
}: LiveOperationsMapProps) {
  const status = useMapLibreLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(DEFAULT_LAYERS);
  const [selected, setSelected] = useState<SelectedEntity | null>(null);
  const [readout, setReadout] = useState({ lng: AOI_CENTER[0], lat: AOI_CENTER[1], zoom: 5.2 });

  function toggleLayer(key: LayerKey) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ---- Map bootstrap (once MapLibre is loaded and the container exists) ----
  useEffect(() => {
    if (status !== "ready" || !containerRef.current || mapRef.current) return;
    const maplibregl = window.maplibregl;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: AOI_CENTER,
      zoom: 5.2,
      minZoom: 4,
      maxZoom: 15,
      attributionControl: true,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      // Dark tactical basemap treatment — filters the raster canvas only.
      const canvas = map.getCanvas();
      canvas.style.filter = "invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.15) saturate(0.6)";

      map.addSource("zones-source", { type: "geojson", data: emptyFC });
      map.addLayer({ id: "zones-fill", type: "fill", source: "zones-source", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.16 } });
      map.addLayer({ id: "zones-outline", type: "line", source: "zones-source", paint: { "line-color": ["get", "color"], "line-width": 1.4, "line-opacity": 0.75 } });

      map.addSource("patrol-source", { type: "geojson", data: emptyFC });
      map.addLayer({
        id: "patrol-lines",
        type: "line",
        source: "patrol-source",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#FFB020", "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.8 },
      });

      setMapReady(true);
    });

    map.on("move", () => {
      const c = map.getCenter();
      setReadout({ lng: c.lng, lat: c.lat, zoom: map.getZoom() });
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ---- Derived readiness per base/region ----
  const bases = useMemo(
    () =>
      regions.map((region) => {
        const regionThreats = threats.filter((t) => t.region === region && t.status !== "neutralized");
        const worst = regionThreats.reduce((w, t) => (SEVERITY_RANK[t.severity] > SEVERITY_RANK[w] ? t.severity : w), "low");
        const readiness: ReadinessLevel = worst === "critical" ? "red" : worst === "high" ? "orange" : worst === "medium" ? "yellow" : "green";
        const activeMissions = missions.filter((m) => m.region === region && m.status === "active");
        const stationed = personnel.filter((p) => p.location === region);
        const regionAssets = assets.filter((a) => a.location === region);
        return {
          region,
          readiness,
          point: locationToCoords(region),
          personnelCount: stationed.length,
          assetCount: regionAssets.length,
          activeMissions,
          commander: activeMissions[0]?.commanderName ?? null,
        };
      }),
    [regions, threats, missions, personnel, assets]
  );

  // ---- Rebuild map data (sources + DOM markers) whenever anything relevant changes ----
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const maplibregl = window.maplibregl;

    // Clear old markers before rebuilding.
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    function addMarker(coords: [number, number], opts: Parameters<typeof createMarkerElement>[0], onClick: () => void) {
      const el = createMarkerElement(opts);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick();
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(coords).addTo(map);
      markersRef.current.push(marker);
    }

    // Bases
    if (layers.bases) {
      bases.forEach((b) => {
        const meta = READINESS_META[b.readiness];
        addMarker(b.point, { shape: "ring", color: meta.color, glow: meta.glow, size: 22, pulse: b.readiness === "orange" || b.readiness === "red" }, () =>
          setSelected({ kind: "base", region: b.region, readiness: b.readiness, personnelCount: b.personnelCount, commander: b.commander, activeMissions: b.activeMissions, assetCount: b.assetCount })
        );
      });
    }

    // Soldiers
    if (layers.personnel) {
      personnel.forEach((p) => {
        const base = bases.find((b) => b.region === p.location) ?? bases[0];
        if (!base) return;
        const coords = jitterCoords(p.id, base.point, 0.06);
        const color = p.status === "deployed" ? "#5CB98C" : p.status === "medical" ? "#FF5470" : p.status === "leave" ? "#7A8699" : "#39A06E";
        addMarker(coords, { shape: "circle", color, glow: `${color}99`, size: 9, pulse: p.status === "deployed" }, () => {
          const weapon = assignments.find((a) => a.personnel.id === p.id && a.type === "weapon" && a.status === "active") ?? null;
          // Mission.squadIds is actually the ad-hoc personnel roster (the
          // PersonnelOnMission join, named "squad" for legacy reasons on the
          // backend — see mappers.ts mapMission) — a list of personnel IDs,
          // not Squad entity IDs. So this is a direct membership check.
          const mission = missions.find((m) => m.status === "active" && m.squadIds.includes(p.id)) ?? null;
          setSelected({ kind: "soldier", personnel: p, weapon, mission });
        });
      });
    }

    // Squads — placed near their first member's location.
    if (layers.squads) {
      squads.forEach((s) => {
        const memberLoc = s.members[0]?.personnel.location;
        const base = bases.find((b) => b.region === memberLoc) ?? bases[0];
        if (!base) return;
        const coords = jitterCoords(`squad-${s.id}`, base.point, 0.09);
        addMarker(coords, { shape: "ring", color: "#5CB98C", glow: "rgba(92,185,140,0.5)", size: 16 }, () => setSelected({ kind: "squad", squad: s }));
      });
    }

    // Vehicles & drones
    if (layers.vehicles) {
      assets
        .filter((a) => a.category === "vehicle" || a.category === "drone")
        .forEach((a) => {
          const coords = jitterCoords(a.id, locationToCoords(a.location), 0.05);
          const mission = missions.find((m) => m.id === a.assignedMissionId) ?? null;
          addMarker(coords, { shape: a.category === "drone" ? "diamond" : "square", color: "#FFB020", glow: "rgba(255,176,32,0.55)", size: 12 }, () =>
            setSelected({ kind: "vehicle", asset: a, mission })
          );
        });
    }

    // Active missions
    if (layers.missions) {
      missions
        .filter((m) => m.status === "active")
        .forEach((m) => {
          const coords = jitterCoords(`mission-${m.id}`, locationToCoords(m.region), 0.03);
          // m.squadIds is a personnel-ID roster (see note above), not Squad
          // entity IDs — resolve the named Squad, if any, via member overlap.
          const squad = squads.find((s) => s.members.some((mem) => m.squadIds.includes(mem.personnel.id))) ?? null;
          addMarker(coords, { shape: "ring", color: "#39A06E", glow: "rgba(57,160,110,0.6)", size: 20, pulse: true }, () => setSelected({ kind: "mission", mission: m, squad }));
        });
    }

    // Threat indicators
    if (layers.threats) {
      threats
        .filter((t) => t.status !== "neutralized")
        .forEach((t) => {
          const coords = jitterCoords(`threat-${t.id}`, locationToCoords(t.region), 0.05);
          const color = t.severity === "critical" ? "#FF5470" : t.severity === "high" ? "#FF8A3D" : "#FFB020";
          addMarker(coords, { shape: "diamond", color, glow: `${color}99`, size: 13, pulse: t.severity === "critical" || t.severity === "high" }, () => setSelected({ kind: "threat", threat: t }));
        });
    }

    // Emergency incidents
    if (layers.emergencies) {
      emergencyIncidents.forEach((e) => {
        const coords = jitterCoords(`incident-${e.id}`, locationToCoords(e.region), 0.04);
        addMarker(coords, { shape: "circle", color: "#FF5470", glow: "rgba(255,84,112,0.7)", size: 15, pulse: true }, () => setSelected({ kind: "incident", incident: e }));
      });
    }

    // Patrol route waypoints/checkpoints
    if (layers.patrols) {
      patrolRoutes.forEach((r) => {
        r.points.forEach((p) => {
          const coords = locationToCoords(p.location);
          addMarker(
            coords,
            { shape: p.kind === "checkpoint" ? "square" : "circle", color: p.status === "reached" ? "#2ECC8F" : "#FFB020", glow: "rgba(255,176,32,0.4)", size: 8 },
            () => setSelected({ kind: "waypoint", point: p, routeName: r.name })
          );
        });
      });
    }

    // ---- GeoJSON layers: zones + patrol lines ----
    const zoneFeatures: any[] = [];
    if (layers.zones) {
      bases.forEach((b) => {
        const meta = READINESS_META[b.readiness];
        zoneFeatures.push({ ...circlePolygon(b.point, 9), properties: { color: meta.color } });
      });
    }
    map.getSource("zones-source")?.setData({ type: "FeatureCollection", features: zoneFeatures });

    const patrolFeatures: any[] = [];
    if (layers.patrols) {
      patrolRoutes.forEach((r) => {
        const sorted = r.points.slice().sort((a, b) => a.sequence - b.sequence);
        if (sorted.length < 2) return;
        patrolFeatures.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: sorted.map((p) => locationToCoords(p.location)) },
          properties: { name: r.name },
        });
      });
    }
    map.getSource("patrol-source")?.setData({ type: "FeatureCollection", features: patrolFeatures });
  }, [mapReady, layers, bases, personnel, assets, missions, threats, patrolRoutes, emergencyIncidents, squads, assignments]);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink-0)]">
          <RadarIcon className="h-4 w-4 text-[color:var(--color-sentinel-400)]" />
          Live Operations Map
          <span className="ml-1 flex items-center gap-1 rounded-full bg-[color:var(--color-danger-500)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-danger-400)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-danger-500)]" /> Live
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(LAYER_LABELS) as LayerKey[]).map((key) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                layers[key]
                  ? "border-[color:var(--color-sentinel-500)]/40 bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]"
                  : "border-[color:var(--color-border-strong)] text-[color:var(--color-ink-4)] hover:text-[color:var(--color-ink-2)]"
              )}
            >
              {LAYER_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[440px] sm:h-[520px] lg:h-[640px]">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Tactical grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-[5] opacity-[0.22]"
          style={{
            backgroundImage: "linear-gradient(rgba(57,160,110,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,160,110,0.5) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />

        {/* Rotating radar sweep */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2">
          <div
            className="animate-radar-sweep h-full w-full rounded-full opacity-60"
            style={{ background: "conic-gradient(from 0deg, rgba(57,160,110,0.3), transparent 18%, transparent 100%)", transformOrigin: "center" }}
          />
        </div>

        {/* Scanning sweep line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-full overflow-hidden opacity-30">
          <div className="animate-scan-line h-px w-full bg-gradient-to-r from-transparent via-[color:var(--color-sentinel-400)] to-transparent" />
        </div>

        {/* Weather overlay (decorative — no live weather feed connected) */}
        {layers.weather && (
          <div
            className="pointer-events-none absolute inset-0 z-[6] opacity-40 mix-blend-screen"
            style={{ background: "radial-gradient(ellipse 60% 40% at 25% 30%, rgba(120,170,255,0.2), transparent), radial-gradient(ellipse 50% 35% at 75% 65%, rgba(120,170,255,0.16), transparent)" }}
          />
        )}

        {/* Terrain overlay (decorative — no elevation data source connected) */}
        {layers.terrain && (
          <div className="pointer-events-none absolute inset-0 z-[6] opacity-[0.12]" style={{ background: "radial-gradient(circle at 40% 45%, #8A6D3B 0%, transparent 55%)" }} />
        )}

        {/* HUD corner brackets */}
        {(["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"] as const).map((pos) => (
          <div key={pos} className={cn("pointer-events-none absolute z-[6] h-6 w-6 border-[color:var(--color-sentinel-500)]/50", pos)} />
        ))}

        {/* Aircraft empty-state note */}
        {layers.aircraft && (
          <div className="pointer-events-none absolute left-3 bottom-3 z-[6] rounded-lg border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)]/90 px-3 py-2 text-[11px] text-[color:var(--color-ink-3)]">
            No aircraft records in the database yet — this layer is ready and will populate automatically once aircraft assets exist.
          </div>
        )}

        {/* Coordinate / zoom HUD readout */}
        <div className="pointer-events-none absolute left-3 top-3 z-[6] rounded-lg border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)]/85 px-2.5 py-1.5 font-mono text-[10px] text-[color:var(--color-ink-3)]">
          <div>LAT {readout.lat.toFixed(3)} · LNG {readout.lng.toFixed(3)}</div>
          <div>ZOOM {readout.zoom.toFixed(1)}</div>
        </div>

        <MapEntityPanel entity={selected} onClose={() => setSelected(null)} />

        {status !== "ready" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[color:var(--color-surface-2)]">
            {status === "loading" ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-sentinel-400)]" />
                <p className="text-sm text-[color:var(--color-ink-3)]">Establishing satellite uplink…</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-[color:var(--color-danger-400)]" />
                <p className="text-sm text-[color:var(--color-ink-2)]">Could not load the map engine. Check your connection and reload.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[color:var(--color-border)] px-6 py-3 text-[11px] text-[color:var(--color-ink-3)]">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-[color:var(--color-sentinel-400)]" /> Base</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[color:var(--color-sentinel-400)]" /> Soldier</span>
        <span className="flex items-center gap-1.5"><CrosshairIcon className="h-3 w-3" /> Active mission</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-[color:var(--color-amber-400)]" style={{ borderRadius: 2 }} /> Vehicle</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rotate-45 bg-[color:var(--color-danger-400)]" /> Threat</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[color:var(--color-danger-500)]" /> Emergency</span>
      </div>
    </div>
  );
}
