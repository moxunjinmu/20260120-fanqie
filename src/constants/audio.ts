import type { NoiseType } from "../types";

export const NOISE_FILTER_FREQUENCY: Record<NoiseType, number> = {
  rain: 800,
  cafe: 1200,
  fire: 400,
};

export const CHIME_NOTES = [
  { frequency: 523.25, duration: 0.15 }, // C5
  { frequency: 659.25, duration: 0.15 }, // E5
  { frequency: 783.99, duration: 0.3 },  // G5
];

export const AUDIO_VOLUME = 0.3;
export const CHIME_VOLUME = 0.2;
