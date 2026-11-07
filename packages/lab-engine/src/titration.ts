/** Ideal dilute strong acid/base 1:1, 25°C; volumes mL, concentrations mol/L. */
export const titrationModelVersion = 'ideal-strong-titration-ts-v1';
export type Acid = 'hcl' | 'hno3';
export type Base = 'naoh' | 'koh';
export const acids = { hcl: 'HCl', hno3: 'HNO₃' } as const;
export const bases = { naoh: 'NaOH', koh: 'KOH' } as const;
export interface TitrationParameters { acid: Acid; base: Base; baseVolume_ml: number }
export const defaultTitration: TitrationParameters = { acid: 'hcl', base: 'naoh', baseVolume_ml: 0 };
export function titrationReading({ acid, base, baseVolume_ml }: TitrationParameters) {
  if (!Object.hasOwn(acids, acid) || !Object.hasOwn(bases, base)) throw new RangeError('Unsupported solution');
  if (!Number.isFinite(baseVolume_ml) || baseVolume_ml < 0 || baseVolume_ml > 50) throw new RangeError('Base volume must be 0–50 mL');
  const acidMoles = 0.025 * 0.1;
  const baseMoles = baseVolume_ml / 1000 * 0.1;
  const totalVolume_ml = 25 + baseVolume_ml;
  const d = (acidMoles - baseMoles) / (totalVolume_ml / 1000);
  const s = Math.hypot(d, 2e-7);
  const hydrogen_mol_L = d >= 0 ? d / 2 + s / 2 : 1e-14 / (s / 2 - d / 2);
  const pH = -Math.log10(hydrogen_mol_L);
  const indicatorFraction = Math.max(0, Math.min(1, (pH - 8.2) / 1.8));
  const salt = { hcl: { naoh: 'NaCl', koh: 'KCl' }, hno3: { naoh: 'NaNO₃', koh: 'KNO₃' } }[acid][base];
  return { pH, hydrogen_mol_L, indicatorFraction, salt, totalVolume_ml,
    equation: `${acids[acid]} + ${bases[base]} → ${salt} + H₂O`,
    acidMoles, baseMoles, saltMoles: Math.min(acidMoles, baseMoles),
    remainingAcidMoles: Math.max(0, acidMoles - baseMoles), remainingBaseMoles: Math.max(0, baseMoles - acidMoles),
    equivalenceVolume_ml: 25,
    stage: Math.abs(acidMoles - baseMoles) <= 4 * Number.EPSILON * Math.max(acidMoles, baseMoles) ? 'equivalence' : acidMoles > baseMoles ? 'acid' : 'base',
  };
}
export function titrationCurve(parameters: TitrationParameters) {
  return Array.from({ length: 201 }, (_, index) => ({ volume: index / 4, pH: titrationReading({ ...parameters, baseVolume_ml: index / 4 }).pH }));
}
