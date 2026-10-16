/**
 * @license
 * PulseGate Interactive Facilities Map & Routing Visualizer
 * Built with Leaflet, React, custom markers, and capability overlays
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Facility, FacilityMatchResult } from '../../types/index.ts';

interface FacilitiesMapProps {
  facilities: Facility[];
  matchResults?: FacilityMatchResult[];
  selectedFacilityId?: string;
  onSelectFacility?: (facility: Facility) => void;
  userClinicCoordinates?: { lat: number; lng: number; name: string };
  className?: string;
}

export const FacilitiesMap: React.FC<FacilitiesMapProps> = ({
  facilities,
  matchResults = [],
  selectedFacilityId,
  onSelectFacility,
  userClinicCoordinates = { lat: 13.1007, lng: 77.5963, name: 'Yelahanka Sub-District Clinic' },
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [filterCapability, setFilterCapability] = useState<string>('ALL');
  const [filterEligibleOnly, setFilterEligibleOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946], // Bangalore Regional Hub
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polylines whenever facilities, matchResults or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    // 1. Add Current User Clinic Marker
    if (userClinicCoordinates) {
      const clinicIcon = L.divIcon({
        className: 'custom-clinic-icon',
        html: `
          <div style="background-color: #0284c7; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 14px;">
            🏥
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const clinicMarker = L.marker([userClinicCoordinates.lat, userClinicCoordinates.lng], {
        icon: clinicIcon,
        zIndexOffset: 1000,
      }).addTo(markersGroup);

      clinicMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="color: #0284c7;">📍 Referring Clinic</strong><br/>
          <strong>${userClinicCoordinates.name}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">Assessment Intake Origin</span>
        </div>
      `);
    }

    // 2. Filter facilities
    const filtered = facilities.filter((f) => {
      if (filterCapability !== 'ALL' && !f.capabilities.includes(filterCapability)) {
        return false;
      }
      if (filterEligibleOnly && matchResults.length > 0) {
        const match = matchResults.find((m) => m.facility.id === f.id);
        if (!match || !match.isEligible) return false;
      }
      return true;
    });

    // 3. Add Facility Markers
    filtered.forEach((fac) => {
      const match = matchResults.find((m) => m.facility.id === fac.id);
      const isSelected = fac.id === selectedFacilityId;
      const isEligible = match ? match.isEligible : true;

      let bgColor = '#10b981'; // Green: Operational
      if (!isEligible || fac.operationalStatus === 'TEMPORARILY_UNAVAILABLE' || fac.operationalStatus === 'CLOSED') {
        bgColor = '#64748b'; // Gray: Ineligible or Unavailable
      } else if (fac.dataFreshnessMinutes > 120) {
        bgColor = '#f59e0b'; // Amber: Stale census
      } else if (match && match.matchScore >= 80) {
        bgColor = '#0d9488'; // Teal: Top Match
      }

      const markerHtml = `
        <div style="background-color: ${bgColor}; color: white; width: ${isSelected ? '38px' : '30px'}; height: ${isSelected ? '38px' : '30px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: ${isSelected ? '4px solid #38bdf8' : '2px solid white'}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 12px; transition: all 0.2s;">
          ${fac.displayId.slice(0, 3)}
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-facility-marker',
        html: markerHtml,
        iconSize: isSelected ? [38, 38] : [30, 30],
        iconAnchor: isSelected ? [19, 19] : [15, 15],
      });

      const marker = L.marker([fac.latitude, fac.longitude], { icon }).addTo(markersGroup);

      marker.on('click', () => {
        if (onSelectFacility) {
          onSelectFacility(fac);
        }
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; max-width: 260px; line-height: 1.4;">
          <div style="font-size: 11px; font-weight: 600; color: ${bgColor}; margin-bottom: 2px;">
            ${fac.displayId} • ${fac.type.replace('_', ' ')}
          </div>
          <strong style="font-size: 13px; color: #0f172a;">${fac.name}</strong>
          <div style="color: #475569; font-size: 11px; margin-top: 4px;">
            ${fac.address}
          </div>
          <div style="margin-top: 6px; padding: 4px 6px; background: #f1f5f9; border-radius: 4px; font-size: 11px;">
            🚗 Transit: <strong>~${fac.estimatedDriveMinutes} mins</strong> (${fac.distanceKm} km)<br/>
            ⏱ Data Freshness: <strong>${fac.dataFreshnessMinutes}m ago</strong>
          </div>
          ${
            match
              ? `<div style="margin-top: 6px; font-size: 11px; font-weight: 600; color: ${match.isEligible ? '#059669' : '#e11d48'};">
                  ${match.isEligible ? '✓ Eligible for Referral' : '✗ Ineligible: ' + match.exclusionReasons[0]}
                </div>`
              : ''
          }
        </div>
      `;
      marker.bindPopup(popupContent);

      // If this is the selected facility, draw simulated referral route polyline!
      if (isSelected && userClinicCoordinates) {
        const latlngs: [number, number][] = [
          [userClinicCoordinates.lat, userClinicCoordinates.lng],
          [(userClinicCoordinates.lat + fac.latitude) / 2 + 0.015, (userClinicCoordinates.lng + fac.longitude) / 2 - 0.015],
          [fac.latitude, fac.longitude],
        ];

        const route = L.polyline(latlngs, {
          color: isEligible ? '#0284c7' : '#94a3b8',
          weight: 4,
          dashArray: isEligible ? '6, 8' : '2, 6',
          opacity: 0.85,
        }).addTo(map);
        routeLineRef.current = route;
      }
    });
  }, [facilities, matchResults, selectedFacilityId, filterCapability, filterEligibleOnly, userClinicCoordinates]);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className={`relative flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Top Filter & View Controls */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Capability:</span>
          <select
            value={filterCapability}
            onChange={(e) => setFilterCapability(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="ALL">All Capabilities (12)</option>
            <option value="24/7 Cardiac Catheterization Lab (Cath Lab)">24/7 Cath Lab (PCI)</option>
            <option value="Acute Stroke Unit">Acute Stroke Unit</option>
            <option value="24/7 CT / Neuro-Imaging">24/7 CT Neuro-Imaging</option>
            <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
            <option value="High Flow Nasal Cannula / Mechanical Ventilation">Ventilator / Pulmonology</option>
            <option value="Blood Bank / Transfusion Service">Blood Bank</option>
          </select>

          {matchResults.length > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer ml-2 text-slate-700 font-medium select-none">
              <input
                type="checkbox"
                checked={filterEligibleOnly}
                onChange={(e) => setFilterEligibleOnly(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Eligible candidates only ({matchResults.filter((m) => m.isEligible).length})</span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-200 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'MAP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View ({facilities.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Map or List Area */}
      {viewMode === 'MAP' ? (
        <div className="relative w-full h-[480px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Floating Legend (Bottom-Left) */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl p-2.5 shadow-lg text-[11px] text-slate-700 space-y-1 z-10 max-w-xs pointer-events-auto">
            <div className="font-semibold text-slate-900 text-xs mb-1">Facility Map Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0d9488]" />
              <span>Top Referral Match / Verified Beds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span>Operational Hospital</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span>Stale Bed Data (&gt;120m ago)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#64748b]" />
              <span>Ineligible / Lacks Required Capability</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
              <span>Origin Clinic (You are here)</span>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible List View */
        <div className="p-4 overflow-y-auto max-h-[480px] divide-y divide-slate-100">
          {facilities.map((fac) => {
            const match = matchResults.find((m) => m.facility.id === fac.id);
            const isSelected = fac.id === selectedFacilityId;

            return (
              <div
                key={fac.id}
                onClick={() => onSelectFacility && onSelectFacility(fac)}
                className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isSelected ? 'bg-teal-50 border border-teal-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {fac.displayId}
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900">{fac.name}</h4>
                    {match && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          match.isEligible
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {match.isEligible ? `Eligible (Score: ${match.matchScore})` : 'Ineligible'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{fac.address}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-600 font-medium">🚗 {fac.estimatedDriveMinutes} mins ({fac.distanceKm} km)</span>
                    <span className="text-slate-400">•</span>
                    <span className={fac.dataFreshnessMinutes > 120 ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                      ⏱ Freshness: {fac.dataFreshnessMinutes}m ago
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-teal-700 font-medium">{fac.capabilities.length} capabilities</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectFacility) onSelectFacility(fac);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isSelected ? 'Selected Destination' : 'Select Destination'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Facility Bottom Banner */}
      {selectedFacility && (
        <div className="bg-slate-900 text-white p-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-teal-400 font-medium text-[11px]">Selected Destination Facility:</div>
            <div className="font-semibold text-sm text-white">{selectedFacility.name}</div>
            <div className="text-slate-400 text-[11px]">
              {selectedFacility.address} • Estimated Transit: {selectedFacility.estimatedDriveMinutes} mins
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-xs">
              Phone: <strong className="text-white">{selectedFacility.contactPhone}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
