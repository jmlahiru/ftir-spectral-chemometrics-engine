import { LibraryMatch } from '../types/ftir';

export interface LibraryEntry {
  name: string;
  group: string;
  class: string;
  min: number;
  max: number;
  intensity: string;
  notes?: string;
}

export const FTIR_SPECTRAL_LIBRARY: LibraryEntry[] = [
  // --- Hydrogen Stretching Region (3700 - 2500 cm⁻¹) ---
  {
    name: "Free O-H stretch",
    group: "Hydroxyl",
    class: "Alcohols & Phenols (free/non-bonded)",
    min: 3650,
    max: 3580,
    intensity: "Sharp, variable",
    notes: "Appears in dilute gas phase or non-polar solvents with non-associated hydroxyl groups."
  },
  {
    name: "H-bonded O-H stretch",
    group: "Hydroxyl",
    class: "Alcohols & Phenols (polymeric H-bonded)",
    min: 3550,
    max: 3200,
    intensity: "Very broad, strong",
    notes: "Characteristic broad envelope centered around ~3350 cm⁻¹ in liquid alcohols, carbohydrates, and moisture."
  },
  {
    name: "Primary Amine N-H stretch (Asymmetric & Symmetric doublet)",
    group: "Amine",
    class: "Primary Amines & Amides",
    min: 3500,
    max: 3300,
    intensity: "Medium doublet",
    notes: "Two distinct bands (~3400 & ~3300 cm⁻¹) corresponding to symmetric and asymmetric stretching."
  },
  {
    name: "Secondary Amine N-H stretch",
    group: "Amine",
    class: "Secondary Amines",
    min: 3350,
    max: 3310,
    intensity: "Medium, single band",
    notes: "Single sharp band around 3310-3350 cm⁻¹."
  },
  {
    name: "Carboxylic Acid O-H stretch",
    group: "Carboxyl",
    class: "Carboxylic Acid Dimers",
    min: 3300,
    max: 2500,
    intensity: "Extremely broad, strong",
    notes: "Superimposes on the aliphatic C-H stretching region (3000-2800 cm⁻¹), diagnostic for organic acids."
  },
  {
    name: "Terminal Alkyne ≡C-H stretch",
    group: "Alkyne",
    class: "Terminal Alkynes (RC≡CH)",
    min: 3335,
    max: 3260,
    intensity: "Sharp, strong",
    notes: "Very sharp absorption band due to sp C-H stretching."
  },
  {
    name: "Aromatic C-H stretch",
    group: "Aromatic",
    class: "Aromatic Hydrocarbons / Benzene rings",
    min: 3100,
    max: 3000,
    intensity: "Sharp, medium to weak",
    notes: "Multiple sharp peaks just above 3000 cm⁻¹ from sp2 C-H stretching."
  },
  {
    name: "Alkene =C-H stretch",
    group: "Alkene",
    class: "Alkenes / Vinyl groups",
    min: 3095,
    max: 3010,
    intensity: "Medium, sharp",
    notes: "Distinguishes unsaturated bonds from saturated alkyl groups."
  },
  {
    name: "Aliphatic C-H stretch (Asymmetric -CH3)",
    group: "Alkane",
    class: "Methyl groups",
    min: 2975,
    max: 2950,
    intensity: "Strong",
    notes: "Asymmetric stretching vibration of methyl carbons."
  },
  {
    name: "Aliphatic C-H stretch (Asymmetric -CH2-)",
    group: "Alkane",
    class: "Methylene groups (Polyethylene / Fatty Chains)",
    min: 2935,
    max: 2915,
    intensity: "Very strong",
    notes: "Dominant peak in polymers like PE, PP, and lipids at ~2920 cm⁻¹."
  },
  {
    name: "Aliphatic C-H stretch (Symmetric -CH3)",
    group: "Alkane",
    class: "Methyl groups",
    min: 2885,
    max: 2860,
    intensity: "Medium",
    notes: "Symmetric stretching of methyl carbons."
  },
  {
    name: "Aliphatic C-H stretch (Symmetric -CH2-)",
    group: "Alkane",
    class: "Methylene groups",
    min: 2865,
    max: 2840,
    intensity: "Strong",
    notes: "Characteristic companion peak to 2920 cm⁻¹, centered at ~2850 cm⁻¹."
  },
  {
    name: "Aldehyde C-H stretch (Fermi Resonance Doublet)",
    group: "Aldehyde",
    class: "Aliphatic / Aromatic Aldehydes",
    min: 2835,
    max: 2690,
    intensity: "Weak doublet (~2820 & ~2720 cm⁻¹)",
    notes: "Fermi resonance between C-H fundamental and overtones; diagnostic for aldehydes."
  },

  // --- Triple Bond & Cumulated Region (2500 - 2000 cm⁻¹) ---
  {
    name: "Atmospheric CO2 Asymmetric Stretch",
    group: "Carbon Dioxide",
    class: "Environmental / Purge Artifact",
    min: 2365,
    max: 2330,
    intensity: "Sharp doublet (~2360, ~2340 cm⁻¹)",
    notes: "Unpurged spectrometer background artifact from ambient air CO2."
  },
  {
    name: "Nitrile C≡N stretch",
    group: "Nitrile",
    class: "Aliphatic & Aromatic Nitriles",
    min: 2260,
    max: 2220,
    intensity: "Medium to strong, sharp",
    notes: "Unconjugated nitriles appear at ~2250 cm⁻¹; conjugated at ~2230 cm⁻¹."
  },
  {
    name: "Internal Alkyne -C≡C- stretch",
    group: "Alkyne",
    class: "Disubstituted Alkynes",
    min: 2260,
    max: 2190,
    intensity: "Weak to variable",
    notes: "Weak or absent if centrally symmetric due to zero dipole change."
  },
  {
    name: "Isocyanate -N=C=O asymmetric stretch",
    group: "Isocyanate",
    class: "Polyurethane precursors",
    min: 2275,
    max: 2250,
    intensity: "Very strong, broad",
    notes: "Crucial for tracking polyurethane curing and resin conversion."
  },
  {
    name: "Azide -N=N+=N- stretch",
    group: "Azide",
    class: "Azides (Organic / Inorganic)",
    min: 2160,
    max: 2120,
    intensity: "Strong, sharp",
    notes: "Common marker for click chemistry reactions."
  },
  {
    name: "Thiocyanate -S-C≡N stretch",
    group: "Thiocyanate",
    class: "Thiocyanates",
    min: 2175,
    max: 2140,
    intensity: "Strong",
    notes: "Sharp absorption band in cumulative double/triple bond region."
  },

  // --- Carbonyl Region (1900 - 1600 cm⁻¹) ---
  {
    name: "Acid Anhydride C=O stretch (Doublet)",
    group: "Anhydride",
    class: "Carboxylic Anhydrides",
    min: 1835,
    max: 1750,
    intensity: "Strong doublet (~1820 & ~1760 cm⁻¹)",
    notes: "Asymmetric and symmetric coupling between the two carbonyl groups."
  },
  {
    name: "Acid Chloride C=O stretch",
    group: "Acyl Halide",
    class: "Acid Halides",
    min: 1815,
    max: 1785,
    intensity: "Very strong",
    notes: "High frequency due to strong electronegative inductive pull of chlorine."
  },
  {
    name: "Ester C=O stretch (Aliphatic)",
    group: "Ester",
    class: "Aliphatic Esters (Biodiesel / Triglycerides / Acetates)",
    min: 1755,
    max: 1730,
    intensity: "Very strong",
    notes: "Benchmark peak for fatty acid methyl esters (FAME) and polyester resins (~1740-1745 cm⁻¹)."
  },
  {
    name: "Aldehyde C=O stretch",
    group: "Aldehyde",
    class: "Aliphatic Aldehydes",
    min: 1740,
    max: 1720,
    intensity: "Strong",
    notes: "Slightly higher frequency than ketones due to single alkyl substituent."
  },
  {
    name: "Ketone C=O stretch (Aliphatic open-chain)",
    group: "Ketone",
    class: "Ketones (Acetone, MEK, Cyclohexanone)",
    min: 1725,
    max: 1705,
    intensity: "Strong, sharp",
    notes: "Standard reference carbonyl at ~1715 cm⁻¹."
  },
  {
    name: "Carboxylic Acid C=O stretch (Dimer)",
    group: "Carboxyl",
    class: "Carboxylic Acids",
    min: 1725,
    max: 1700,
    intensity: "Strong",
    notes: "Associated with broad 3300-2500 cm⁻¹ O-H stretch; polymer oxidation marker."
  },
  {
    name: "Amide I band (Mainly C=O stretch)",
    group: "Amide",
    class: "Primary & Secondary Amides (Proteins / Nylon / Peptides)",
    min: 1690,
    max: 1630,
    intensity: "Very strong",
    notes: "Key marker for protein secondary structure: α-helix (~1650-1658 cm⁻¹), β-sheet (~1625-1640 cm⁻¹)."
  },
  {
    name: "Conjugated Alkene C=C stretch",
    group: "Alkene",
    class: "Conjugated Dienes & Polyenes",
    min: 1640,
    max: 1615,
    intensity: "Strong",
    notes: "Lowered wavenumber and increased dipole intensity compared to isolated C=C."
  },
  {
    name: "Isolated Alkene C=C stretch",
    group: "Alkene",
    class: "Unconjugated Alkenes",
    min: 1680,
    max: 1640,
    intensity: "Variable, medium to weak",
    notes: "Disubstituted trans or tetrasubstituted alkenes have weak intensity."
  },
  {
    name: "Aromatic C=C ring quadrant stretch",
    group: "Aromatic",
    class: "Benzene Ring Skeletal Vibration 1",
    min: 1615,
    max: 1580,
    intensity: "Variable, often split",
    notes: "Characteristic aromatic marker around ~1600 cm⁻¹."
  },

  // --- Nitrogen & Oxygen Fingerprint (1600 - 1200 cm⁻¹) ---
  {
    name: "Amide II band (N-H in-plane bend & C-N stretch)",
    group: "Amide",
    class: "Secondary Amides (Proteins / Polyamides)",
    min: 1570,
    max: 1515,
    intensity: "Strong",
    notes: "Coupled N-H in-plane bend and C-N stretch; sensitive to protein denaturation."
  },
  {
    name: "Nitro -NO2 asymmetric stretch",
    group: "Nitro",
    class: "Nitroalkanes & Nitroaromatics",
    min: 1560,
    max: 1500,
    intensity: "Very strong",
    notes: "Accompanied by symmetric stretch at 1360-1290 cm⁻¹."
  },
  {
    name: "Aromatic C=C semicircle ring stretch",
    group: "Aromatic",
    class: "Benzene Ring Skeletal Vibration 2",
    min: 1510,
    max: 1475,
    intensity: "Variable",
    notes: "Usually sharper and more intense in substituted aromatics."
  },
  {
    name: "Methylene -CH2- scissoring bend",
    group: "Alkane",
    class: "Aliphatic (PE standard reference band)",
    min: 1475,
    max: 1445,
    intensity: "Medium to strong",
    notes: "Centred at ~1465 cm⁻¹. Often used as internal reference standard for Carbonyl Index in polymer degradation."
  },
  {
    name: "Methyl -CH3 umbrella symmetric bend",
    group: "Alkane",
    class: "Methyl groups",
    min: 1390,
    max: 1365,
    intensity: "Medium",
    notes: "Centred at ~1375 cm⁻¹. Gem-dimethyl (isopropyl) splits into a doublet (~1385, 1370 cm⁻¹)."
  },
  {
    name: "Nitro -NO2 symmetric stretch",
    group: "Nitro",
    class: "Nitro compounds",
    min: 1365,
    max: 1290,
    intensity: "Strong",
    notes: "Symmetric counterpart to the 1550 cm⁻¹ band."
  },
  {
    name: "Sulfone O=S=O asymmetric stretch",
    group: "Sulfone",
    class: "Sulfones & Sulfonyl chlorides",
    min: 1350,
    max: 1300,
    intensity: "Very strong",
    notes: "Accompanied by symmetric stretch at 1160-1120 cm⁻¹."
  },
  {
    name: "Fluoroalkyl C-F stretch",
    group: "Fluorocarbon",
    class: "PTFE / Fluoropolymers",
    min: 1350,
    max: 1100,
    intensity: "Extremely strong, broad",
    notes: "Dominates spectrum of Teflon (PTFE, PVDF)."
  },
  {
    name: "Ester C-O stretch (Acetate / Aliphatic)",
    group: "Ester",
    class: "Esters & Lactones",
    min: 1260,
    max: 1150,
    intensity: "Very strong, broad",
    notes: "Strongest absorption in esters; often centered at ~1170-1240 cm⁻¹."
  },
  {
    name: "Alcohol C-O stretch (Tertiary alcohol)",
    group: "Alcohol",
    class: "Tertiary Alcohols",
    min: 1210,
    max: 1125,
    intensity: "Strong",
    notes: "Centred around ~1150 cm⁻¹ due to steric hinderance."
  },
  {
    name: "Ether C-O-C asymmetric stretch",
    group: "Ether",
    class: "Aliphatic Ethers (PEG, THF, Diethyl ether)",
    min: 1150,
    max: 1070,
    intensity: "Very strong",
    notes: "Prominent band at ~1110 cm⁻¹ in polyethylene glycol (PEG)."
  },
  {
    name: "Alcohol C-O stretch (Secondary alcohol)",
    group: "Alcohol",
    class: "Secondary Alcohols",
    min: 1125,
    max: 1030,
    intensity: "Strong",
    notes: "Centred at ~1100 cm⁻¹ (e.g., isopropanol)."
  },
  {
    name: "Alcohol C-O stretch (Primary alcohol)",
    group: "Alcohol",
    class: "Primary Alcohols",
    min: 1075,
    max: 1000,
    intensity: "Strong",
    notes: "Centred at ~1050 cm⁻¹ (e.g., ethanol, methanol)."
  },
  {
    name: "Siloxane Si-O-Si asymmetric stretch",
    group: "Silicone",
    class: "Polydimethylsiloxane (PDMS) / Silicates",
    min: 1100,
    max: 1000,
    intensity: "Extremely strong, broad doublet",
    notes: "Broad peak at 1020-1090 cm⁻¹, classic marker for silicones and silica."
  },
  {
    name: "Phosphate PO4(3-) stretch",
    group: "Phosphate",
    class: "Inorganic & Organic Phosphates / DNA backbone",
    min: 1100,
    max: 970,
    intensity: "Strong, broad",
    notes: "Essential for mineralized bone/hydroxyapatite and nucleic acids."
  },

  // --- Low-Wavenumber Fingerprint & Out-of-Plane (1000 - 400 cm⁻¹) ---
  {
    name: "Alkene =C-H out-of-plane bend (trans)",
    group: "Alkene",
    class: "trans-Disubstituted Alkenes",
    min: 980,
    max: 955,
    intensity: "Strong, sharp",
    notes: "Distinctive sharp band at 965-970 cm⁻¹; used to distinguish trans from cis fats."
  },
  {
    name: "Alkene =C-H out-of-plane bend (cis)",
    group: "Alkene",
    class: "cis-Disubstituted Alkenes",
    min: 730,
    max: 675,
    intensity: "Medium to strong",
    notes: "Broader than trans isomer band."
  },
  {
    name: "Aromatic C-H out-of-plane (para-substituted)",
    group: "Aromatic",
    class: "1,4-Disubstituted Benzene",
    min: 860,
    max: 800,
    intensity: "Strong, sharp",
    notes: "Single strong peak in 800-850 cm⁻¹ region."
  },
  {
    name: "Aromatic C-H out-of-plane (meta-substituted)",
    group: "Aromatic",
    class: "1,3-Disubstituted Benzene",
    min: 800,
    max: 750,
    intensity: "Strong",
    notes: "Often accompanied by another peak near 690 cm⁻¹."
  },
  {
    name: "Aromatic C-H out-of-plane (ortho-substituted)",
    group: "Aromatic",
    class: "1,2-Disubstituted Benzene",
    min: 770,
    max: 735,
    intensity: "Strong",
    notes: "Strong single band."
  },
  {
    name: "Aromatic C-H out-of-plane (Mono-substituted)",
    group: "Aromatic",
    class: "Monosubstituted Benzene (Toluene, Polystyrene)",
    min: 770,
    max: 730,
    intensity: "Strong pair with ~690 cm⁻¹",
    notes: "Two strong diagnostic bands: 750 cm⁻¹ and 695 cm⁻¹ (classic Polystyrene fingerprint)."
  },
  {
    name: "Methylene -(CH2)n- rocking band (n >= 4)",
    group: "Alkane",
    class: "Long-Chain Hydrocarbons / Polyethylene",
    min: 730,
    max: 715,
    intensity: "Medium doublet (720 & 730 cm⁻¹) in crystals",
    notes: "Characteristic doublet in crystalline polyethylene from orthorhombic unit cell splitting."
  },
  {
    name: "Aliphatic C-Cl stretch",
    group: "Halogen",
    class: "Alkyl Chlorides (PVC / Chloroform)",
    min: 785,
    max: 600,
    intensity: "Strong",
    notes: "Found at ~610-690 cm⁻¹ in Polyvinyl Chloride (PVC)."
  },
  {
    name: "Carbonate CO3(2-) out-of-plane bend",
    group: "Carbonate",
    class: "Calcium Carbonate / Calcite / Aragonite",
    min: 885,
    max: 870,
    intensity: "Sharp, strong",
    notes: "Sharp marker at ~875 cm⁻¹ for CaCO3 mineral filler."
  }
];

export function identifyPeak(wavenumber: number): LibraryMatch[] {
  const matches: LibraryMatch[] = [];

  for (const entry of FTIR_SPECTRAL_LIBRARY) {
    if (wavenumber >= entry.min && wavenumber <= entry.max) {
      const center = (entry.min + entry.max) / 2;
      const halfSpan = (entry.max - entry.min) / 2;
      const distance = Math.abs(wavenumber - center);
      const confidence = Math.max(30, Math.min(99, Math.round((1 - distance / halfSpan) * 100)));

      matches.push({
        ...entry,
        confidence
      });
    }
  }

  // Sort descending by confidence
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches;
}
