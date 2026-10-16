/**
 * @license
 * PulseGate Regional Facilities & Capability Directory (Modules 13, 14, 24, 44)
 * Facility Directory, Leaflet Interactive Map, Live Bed Census Updater & Stale Data Quality
 */

import React, { useState } from 'react';
import type { Facility } from '../../types/index.ts';
import { store } from '../../services/storeService.ts';
import { FacilitiesMap } from '../map/FacilitiesMap.tsx';
import { MapPin, Search, Edit3, Check, AlertTriangle, ShieldCheck, Phone, Clock } from 'lucide-react';

interface FacilityDirectoryViewProps {
  facilities: Facility[];
  onSelectFacilityForReferral?: (facility: Facility) => void;
}

export const FacilityDirectoryView: React.FC<FacilityDirectoryViewProps> = ({
  facilities,
  onSelectFacilityForReferral,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedFacility, setSelectedFacility] = useState<Facility>(facilities[0]);
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [newBedCount, setNewBedCount] = useState<number>(0);

  const filtered = facilities.filter((f) => {
    if (filterType !== 'ALL' && f.type !== filterType) return false;
    if (
      searchQuery &&
      !f.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.city.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.displayId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const handleUpdateBeds = (deptName: string) => {
    store.updateBedCount(selectedFacility.id, deptName, newBedCount);
    setEditingDeptIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono">
              REGIONAL DIRECTORY
            </span>
            <span className="text-xs text-slate-500">12 Verified Healthcare Nodes & Specialized Units</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Facility Directory & Capacity Census
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Inspect hospital capabilities, live emergency and ICU bed counts, and data freshness metrics across the regional referral grid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">Freshness threshold:</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border">
            &le; 120 mins
          </span>
        </div>
      </div>

      {/* Interactive Map Section */}
      <FacilitiesMap
        facilities={facilities}
        selectedFacilityId={selectedFacility.id}
        onSelectFacility={(fac) => setSelectedFacility(fac)}
      />

      {/* Directory Search & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search facility name, capability, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium"
          >
            <option value="ALL">All Facility Types</option>
            <option value="TERTIARY_ACADEMIC_CENTER">Tertiary Academic Center</option>
            <option value="REGIONAL_TRAUMA_CENTER">Regional Trauma Center</option>
            <option value="DISTRICT_SPECIALTY_HOSPITAL">District Specialty Hospital</option>
            <option value="COMMUNITY_HEALTH_CENTER">Community Health Center</option>
            <option value="SUB_DISTRICT_CLINIC">Sub-District Clinic</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          Showing {filtered.length} of {facilities.length} facilities
        </span>
      </div>

      {/* Two Column Layout: Facility List & Selected Facility Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Facility Cards */}
        <div className="space-y-3 lg:col-span-1 max-h-[640px] overflow-y-auto pr-1">
          {filtered.map((fac) => {
            const isSelected = fac.id === selectedFacility.id;
            const isStale = fac.dataFreshnessMinutes > 120;

            return (
              <div
                key={fac.id}
                onClick={() => setSelectedFacility(fac)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-teal-50/80 border-teal-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {fac.displayId}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      fac.operationalStatus === 'OPERATIONAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {fac.operationalStatus.replace('_', ' ')}
                  </span>
                </div>

                <strong className="text-xs font-semibold text-slate-900 block">{fac.name}</strong>
                <p className="text-[11px] text-slate-500">{fac.address}</p>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-600">🚗 {fac.estimatedDriveMinutes} mins ({fac.distanceKm} km)</span>
                  <span className={isStale ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                    ⏱ {fac.dataFreshnessMinutes}m ago {isStale && '⚠️'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Deep Inspector & Bed Capacity Simulator */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-teal-700 block">
                {selectedFacility.displayId} • {selectedFacility.type.replace('_', ' ')}
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-heading">{selectedFacility.name}</h3>
              <p className="text-xs text-slate-500">{selectedFacility.address}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedFacility.contactPhone}</span>
              </span>
            </div>
          </div>

          {/* Stale Warning Banner if applicable */}
          {selectedFacility.dataFreshnessMinutes > 120 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Data Stale Warning:</strong> Bed availability census was updated {selectedFacility.dataFreshnessMinutes} minutes ago (&gt;2 hrs). Please verify bed availability by phone before sending critical transfers.
              </span>
            </div>
          )}

          {/* Departments & Interactive Bed Census Simulator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Department Bed Census & Availability Simulator
              </h4>
              <span className="text-[11px] text-slate-500">
                Authorized facility coordinators can update census
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedFacility.departments.map((dept, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-medium block">{dept.name}</strong>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        dept.availableBeds > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {dept.status}
                    </span>
                  </div>

                  {editingDeptIndex === idx ? (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="number"
                        min="0"
                        max={dept.totalBeds}
                        value={newBedCount}
                        onChange={(e) => setNewBedCount(parseInt(e.target.value, 10) || 0)}
                        className="w-16 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateBeds(dept.name)}
                        className="px-2 py-1 rounded bg-teal-600 text-white font-semibold text-[11px]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDeptIndex(null)}
                        className="px-1.5 py-1 rounded bg-slate-200 text-slate-700 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-xl font-mono font-extrabold text-slate-900">
                          {dept.availableBeds}
                        </span>
                        <span className="text-slate-500 text-[11px]"> / {dept.totalBeds} beds</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDeptIndex(idx);
                          setNewBedCount(dept.availableBeds);
                        }}
                        className="p-1 text-slate-400 hover:text-teal-700 rounded transition-colors"
                        title="Simulate updating available beds"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/70">
                    Updated {dept.lastUpdatedMinutesAgo}m ago
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities Catalog */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 text-xs">
              Verified Clinical Capabilities ({selectedFacility.capabilities.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedFacility.capabilities.map((cap, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium border border-slate-200 flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-teal-600" />
                  <span>{cap}</span>
                </span>
              ))}
            </div>
          </div>

          {selectedFacility.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-700">Operational Notes:</strong> {selectedFacility.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
