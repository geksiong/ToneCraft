import { Preset } from '../types/pedal';

/**
 * Standard preset category definitions in preferred display order.
 */
export const PRESET_CATEGORY_ORDER = [
  '🎸 Vintage Rock & Blues',
  '🌌 Ambient, Shoegaze & Lo-Fi',
  '⚡ Heavy & Modern Metal',
  '🪩 Funk, Soul & Synth',
  '✨ Pristine Clean & Jazz',
  '🎸 Bass Rigs & Grooves',
  '🎙️ Vocal Studio & Auto-Tune',
  '💾 User Presets'
] as const;

export type PresetCategoryName = (typeof PRESET_CATEGORY_ORDER)[number] | string;

/**
 * Maps a preset ID or metadata to a standardized category label.
 */
const PRESET_ID_CATEGORY_MAP: Record<string, string> = {
  // Vintage Rock & Blues
  'guitar-hendrix-univibe-woodstock': '🎸 Vintage Rock & Blues',
  'guitar-brownface-harmonic-shimmer': '🎸 Vintage Rock & Blues',
  'hendrix-psychedelic': '🎸 Vintage Rock & Blues',
  'gilmour-lead': '🎸 Vintage Rock & Blues',
  'srv-texas-blues': '🎸 Vintage Rock & Blues',
  'vox-ac10-real-nam': '🎸 Vintage Rock & Blues',
  'vox-ac30-chime-breakup': '🎸 Vintage Rock & Blues',
  'klon-transparent-breakup': '🎸 Vintage Rock & Blues',

  // Ambient, Shoegaze & Lo-Fi
  'guitar-slowdive-shoegaze-bloom': '🌌 Ambient, Shoegaze & Lo-Fi',
  'guitar-cathedral-multi-octave-organ': '🌌 Ambient, Shoegaze & Lo-Fi',
  'guitar-lofi-vinyl-tape-chill': '🌌 Ambient, Shoegaze & Lo-Fi',
  'guitar-crystal-dimension-arpeggiator': '🌌 Ambient, Shoegaze & Lo-Fi',
  'guitar-shoegaze-granular-cloud': '🌌 Ambient, Shoegaze & Lo-Fi',
  'guitar-infinite-spectral-drone': '🌌 Ambient, Shoegaze & Lo-Fi',
  'ambient-dreamscape': '🌌 Ambient, Shoegaze & Lo-Fi',

  // Heavy & Modern Metal
  'metallica-thrash': '⚡ Heavy & Modern Metal',

  // Funk, Soul & Synth
  'guitar-funkadelic-talking-wah': '🪩 Funk, Soul & Synth',
  'guitar-cyberpunk-arcade-synth': '🪩 Funk, Soul & Synth',
  'polyphia-neo-sparkle': '🪩 Funk, Soul & Synth',

  // Pristine Clean & Jazz
  'roland-jc120-pristine-clean': '✨ Pristine Clean & Jazz',
  'warm-velvet-jazz-clean': '✨ Pristine Clean & Jazz',
  'country-nashville-clean': '✨ Pristine Clean & Jazz',
  'studio-di-pure-clean': '✨ Pristine Clean & Jazz',

  // Bass Rigs & Grooves
  'flea-slap-bass': '🎸 Bass Rigs & Grooves',
  'tool-justin-bass': '🎸 Bass Rigs & Grooves',

  // Vocal Studio & Auto-Tune
  'vocal-trap-hard-tune-autotune': '🎙️ Vocal Studio & Auto-Tune',
  'vocal-studio-pop': '🎙️ Vocal Studio & Auto-Tune',
  'vocal-cyberpunk-robot': '🎙️ Vocal Studio & Auto-Tune',
  'vocal-vintage-megaphone': '🎙️ Vocal Studio & Auto-Tune',
  'vocal-bohemian-choir': '🎙️ Vocal Studio & Auto-Tune',
  'vocal-studio-tube-strip': '🎙️ Vocal Studio & Auto-Tune',
  'vocal-edm-stutter-glitch': '🎙️ Vocal Studio & Auto-Tune'
};

/**
 * Returns the category for a given preset, supporting explicit preset.category,
 * curated ID mapping, or heuristic deduction for user-created presets.
 */
export function getPresetCategory(preset: Preset): string {
  // If user-created, community, imported, or shared preset
  if (preset.isCommunity || preset.id.startsWith('custom-') || preset.id.startsWith('imported-') || preset.id.startsWith('shared-')) {
    return '💾 User Presets';
  }

  // Curated explicit category field
  if (preset.category) {
    // Normalise to match full emoji header if matching short name
    for (const cat of PRESET_CATEGORY_ORDER) {
      if (cat.toLowerCase().includes(preset.category.toLowerCase())) {
        return cat;
      }
    }
    return preset.category;
  }

  // ID lookup table
  if (PRESET_ID_CATEGORY_MAP[preset.id]) {
    return PRESET_ID_CATEGORY_MAP[preset.id];
  }

  // Heuristic deduction based on instrument and genre
  if (preset.instrument === 'vocal') {
    return '🎙️ Vocal Studio & Auto-Tune';
  }

  if (preset.instrument === 'bass') {
    return '🎸 Bass Rigs & Grooves';
  }

  if (preset.genre === 'Metal') {
    return '⚡ Heavy & Modern Metal';
  }

  if (preset.genre === 'Shoegaze' || preset.genre === 'Ambient') {
    return '🌌 Ambient, Shoegaze & Lo-Fi';
  }

  if (preset.genre === 'Funk') {
    return '🪩 Funk, Soul & Synth';
  }

  if (preset.genre === 'Jazz') {
    return '✨ Pristine Clean & Jazz';
  }

  if (preset.genre === 'Pop') {
    return '🪩 Funk, Soul & Synth';
  }

  const tagStr = (preset.tags || []).join(' ').toLowerCase();
  const nameStr = (preset.name || '').toLowerCase();

  if (tagStr.includes('ambient') || tagStr.includes('reverb') || tagStr.includes('shoegaze') || nameStr.includes('ambient') || nameStr.includes('drone')) {
    return '🌌 Ambient, Shoegaze & Lo-Fi';
  }

  if (tagStr.includes('clean') || nameStr.includes('clean') || tagStr.includes('jazz')) {
    return '✨ Pristine Clean & Jazz';
  }

  if (tagStr.includes('metal') || tagStr.includes('djent') || tagStr.includes('high gain')) {
    return '⚡ Heavy & Modern Metal';
  }

  return '🎸 Vintage Rock & Blues';
}

export interface PresetCategoryGroup {
  category: string;
  presets: Preset[];
}

/**
 * Organizes an array of presets into sorted category groups for dropdowns.
 */
export function groupPresetsByCategory(presets: Preset[]): PresetCategoryGroup[] {
  const groupsMap = new Map<string, Preset[]>();

  for (const preset of presets) {
    const category = getPresetCategory(preset);
    if (!groupsMap.has(category)) {
      groupsMap.set(category, []);
    }
    groupsMap.get(category)!.push(preset);
  }

  const result: PresetCategoryGroup[] = [];

  // Add recognized categories in defined order
  for (const category of PRESET_CATEGORY_ORDER) {
    const list = groupsMap.get(category);
    if (list && list.length > 0) {
      result.push({
        category,
        presets: list
      });
      groupsMap.delete(category);
    }
  }

  // Add any remaining custom or dynamically created categories
  for (const [category, list] of groupsMap.entries()) {
    if (list.length > 0) {
      result.push({
        category,
        presets: list
      });
    }
  }

  return result;
}
