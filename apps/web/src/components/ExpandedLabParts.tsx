import React from "react";

export interface LabSliderProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  presets?: number[];
}

/**
 * Simple range slider used by the pendulum lab.
 * It matches the usage in `PendulumLab.tsx`.
 */
export const LabSlider: React.FC<LabSliderProps> = ({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
  presets,
}) => (
  <label className="parameter">
    <span>
      {label} <output>{value}{unit}</output>
    </span>
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
    />
    {presets && (
      <div className="preset-row">
        {presets.map(p => (
          <button
            key={p}
            type="button"
            className={`preset-pill ${Math.abs(value - p) < 0.01 ? "active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}{unit}
          </button>
        ))}
      </div>
    )}
  </label>
);
