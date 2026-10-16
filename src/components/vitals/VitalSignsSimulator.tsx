/**
 * @license
 * PulseGate Software-Only Vital Signs Simulator & Observation Collector
 * Module 11 - Absolute Hardware Independence with Clear Data Provenance
 */

import React, { useState } from 'react';
import type { VitalSignsObservations, DataSource } from '../../types/index.ts';
import { Activity, Zap, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface VitalSignsSimulatorProps {
  observations: VitalSignsObservations;
  onChange: (updated: VitalSignsObservations) => void;
  className?: string;
}

export const VitalSignsSimulator: React.FC<VitalSignsSimulatorProps> = ({
  observations,
  onChange,
  className = '',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('CUSTOM');

  const updateField = <K extends keyof VitalSignsObservations>(
    field: K,
    val: VitalSignsObservations[K]
  ) => {
    onChange({
      ...observations,
      [field]: val,
      dataSource: observations.dataSource === 'SIMULATED' ? 'SIMULATED' : 'MANUAL_ENTRY',
      measurementTimestamp: new Date().toISOString(),
    });
  };

  // Presets
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const now = new Date().toISOString();

    if (presetName === 'NORMAL') {
      onChange({
        spo2: 98,
        heartRate: 72,
        temperature: 36.8,
        respiratoryRate: 14,
        systolicBp: 120,
        diastolicBp: 80,
        consciousness: 'ALERT',
        onSupplementalOxygen: false,
        oxygenScale: 1,
        dataSource: 'SIMULATED',
        signalQuality: 'OPTIMAL',
        measurementTimestamp: now,
        notes: 'Simulated baseline stable physiological parameters.',
      });
    } else if (presetName === 'SEPSIS_CRITICAL') {
      onChange({
        spo2: 89,
        heartRate: 132,
        temperature: 39.5,
        respiratoryRate: 28,
        systolicBp: 78,
        diastolicBp: 48,
        consciousness: 'CONFUSION_NEW',
        onSupplementalOxygen: true,
        oxygenScale: 1,
        dataSource: 'SIMULATED',
        signalQuality: 'OPTIMAL',
        measurementTimestamp: now,
        notes: 'Severe septic shock profile with multi-organ hypoperfusion.',
      });
    } else if (presetName === 'COPD_HYPERCAPNIC') {
      onChange({
        spo2: 86,
        heartRate: 98,
        temperature: 37.2,
        respiratoryRate: 24,
        systolicBp: 130,
        diastolicBp: 85,
        consciousness: 'ALERT',
        onSupplementalOxygen: true,
        oxygenScale: 2, // Scale 2
        dataSource: 'SIMULATED',
        signalQuality: 'ACCEPTABLE',
        measurementTimestamp: now,
        notes: 'COPD exacerbation using SpO2 Scale 2 (target 88-92%).',
      });
    } else if (presetName === 'STROKE_HYPERTENSIVE') {
      onChange({
        spo2: 97,
        heartRate: 84,
        temperature: 36.9,
        respiratoryRate: 16,
        systolicBp: 182,
        diastolicBp: 104,
        consciousness: 'ALERT',
        onSupplementalOxygen: false,
        oxygenScale: 1,
        dataSource: 'SIMULATED',
        signalQuality: 'OPTIMAL',
        measurementTimestamp: now,
        notes: 'Hypertensive crisis presentation associated with acute stroke.',
      });
    } else if (presetName === 'INCOMPLETE') {
      onChange({
        spo2: 97,
        heartRate: 80,
        temperature: null, // missing
        respiratoryRate: null, // missing
        systolicBp: 125,
        diastolicBp: 80,
        consciousness: 'ALERT',
        onSupplementalOxygen: false,
        oxygenScale: 1,
        dataSource: 'SIMULATED',
        signalQuality: 'DEGRADED',
        measurementTimestamp: now,
        notes: 'Missing respiratory rate and temperature to test incomplete data safety rule.',
      });
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-5 ${className}`}>
      {/* Header and Provenance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Vital Signs & Physiological Observations</h3>
            <p className="text-xs text-slate-500">Collects or simulates 7 core parameters for Royal College of Physicians NEWS2</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
              observations.dataSource === 'SIMULATED'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SOURCE: {observations.dataSource}</span>
          </span>
        </div>
      </div>

      {/* Simulator Preset Bar */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Software Simulation Presets (No Hardware Required):</span>
          </span>
          <span className="text-slate-500 text-[11px]">Instant testing profiles</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset('NORMAL')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              selectedPreset === 'NORMAL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            Normal (NEWS2 = 0)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('SEPSIS_CRITICAL')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              selectedPreset === 'SEPSIS_CRITICAL'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white hover:bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            Critical Sepsis (NEWS2 = 18)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('COPD_HYPERCAPNIC')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              selectedPreset === 'COPD_HYPERCAPNIC'
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white hover:bg-teal-50 text-teal-800 border-teal-200'
            }`}
          >
            COPD (Scale 2 Target)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('STROKE_HYPERTENSIVE')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              selectedPreset === 'STROKE_HYPERTENSIVE'
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-white hover:bg-purple-50 text-purple-800 border-purple-200'
            }`}
          >
            Hypertensive Crisis
          </button>
          <button
            type="button"
            onClick={() => applyPreset('INCOMPLETE')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              selectedPreset === 'INCOMPLETE'
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            Incomplete Dataset (GRAY)
          </button>
        </div>
      </div>

      {/* Observation Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* 1. Oxygen Saturation */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
          <label className="font-semibold text-slate-700 block">
            SpO2 Saturation (%)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="40"
              max="100"
              placeholder="e.g. 98"
              value={observations.spo2 ?? ''}
              onChange={(e) =>
                updateField('spo2', e.target.value === '' ? null : parseInt(e.target.value, 10))
              }
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-slate-500 font-medium">%</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Normal: &ge;96%</span>
            <button
              type="button"
              onClick={() => updateField('spo2', null)}
              className="text-rose-600 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 2. Heart Rate */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
          <label className="font-semibold text-slate-700 block">
            Heart Rate (Pulse)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="20"
              max="260"
              placeholder="e.g. 72"
              value={observations.heartRate ?? ''}
              onChange={(e) =>
                updateField('heartRate', e.target.value === '' ? null : parseInt(e.target.value, 10))
              }
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-slate-500 font-medium">bpm</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Normal: 51-90 bpm</span>
            <button
              type="button"
              onClick={() => updateField('heartRate', null)}
              className="text-rose-600 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 3. Systolic Blood Pressure */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
          <label className="font-semibold text-slate-700 block">
            Systolic / Diastolic BP
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="40"
              max="300"
              placeholder="Sys"
              value={observations.systolicBp ?? ''}
              onChange={(e) =>
                updateField('systolicBp', e.target.value === '' ? null : parseInt(e.target.value, 10))
              }
              className="w-1/2 bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-slate-400">/</span>
            <input
              type="number"
              min="20"
              max="200"
              placeholder="Dia"
              value={observations.diastolicBp ?? ''}
              onChange={(e) =>
                updateField('diastolicBp', e.target.value === '' ? null : parseInt(e.target.value, 10))
              }
              className="w-1/2 bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Normal: 111-219 mmHg</span>
            <button
              type="button"
              onClick={() => {
                updateField('systolicBp', null);
                updateField('diastolicBp', null);
              }}
              className="text-rose-600 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 4. Respiratory Rate */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
          <label className="font-semibold text-slate-700 block">
            Respiratory Rate
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="4"
              max="70"
              placeholder="e.g. 16"
              value={observations.respiratoryRate ?? ''}
              onChange={(e) =>
                updateField('respiratoryRate', e.target.value === '' ? null : parseInt(e.target.value, 10))
              }
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-slate-500 font-medium">/min</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Normal: 12-20</span>
            <button
              type="button"
              onClick={() => updateField('respiratoryRate', null)}
              className="text-rose-600 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 5. Temperature */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
          <label className="font-semibold text-slate-700 block">
            Body Temperature (°C)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="30"
              max="45"
              placeholder="e.g. 36.8"
              value={observations.temperature ?? ''}
              onChange={(e) =>
                updateField('temperature', e.target.value === '' ? null : parseFloat(e.target.value))
              }
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-slate-500 font-medium">°C</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Normal: 36.1-38.0°C</span>
            <button
              type="button"
              onClick={() => updateField('temperature', null)}
              className="text-rose-600 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 6. Consciousness (ACVPU) */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
          <label className="font-semibold text-slate-700 block">
            Consciousness (ACVPU)
          </label>
          <select
            value={observations.consciousness || ''}
            onChange={(e) =>
              updateField(
                'consciousness',
                e.target.value === '' ? null : (e.target.value as any)
              )
            }
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-teal-500"
          >
            <option value="">-- Select Status --</option>
            <option value="ALERT">Alert (A - 0 pts)</option>
            <option value="CONFUSION_NEW">New Confusion (C - 3 pts)</option>
            <option value="VOICE">Responds to Voice (V - 3 pts)</option>
            <option value="PAIN">Responds to Pain (P - 3 pts)</option>
            <option value="UNRESPONSIVE">Unresponsive (U - 3 pts)</option>
          </select>
          <div className="text-[11px] text-slate-500 pt-1">
            Any non-Alert response scores 3 pts
          </div>
        </div>

        {/* 7. Supplemental Oxygen */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
          <label className="font-semibold text-slate-700 block">
            Supplemental Oxygen (O2)
          </label>
          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="suppO2"
                checked={observations.onSupplementalOxygen === false}
                onChange={() => updateField('onSupplementalOxygen', false)}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span>Room Air</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="suppO2"
                checked={observations.onSupplementalOxygen === true}
                onChange={() => updateField('onSupplementalOxygen', true)}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="font-medium text-teal-800">Prescribed O2</span>
            </label>
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            {observations.onSupplementalOxygen ? 'Scores 2 pts in NEWS2' : '0 pts'}
          </div>
        </div>

        {/* 8. Oxygen Scale Mode */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
          <label className="font-semibold text-slate-700 block">
            Target SpO2 Scale
          </label>
          <select
            value={observations.oxygenScale}
            onChange={(e) => updateField('oxygenScale', parseInt(e.target.value, 10) as 1 | 2)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-teal-500"
          >
            <option value={1}>Scale 1: Standard (&ge;96%)</option>
            <option value={2}>Scale 2: Hypercapnic / COPD (88-92%)</option>
          </select>
          <div className="text-[11px] text-slate-500 pt-1">
            Use Scale 2 only for confirmed hypercapnia risk
          </div>
        </div>
      </div>
    </div>
  );
};
