export type NoiseType = "rain" | "cafe" | "fire";

export interface Settings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  autoStartNext: boolean;
  soundEnabled: boolean;
  whiteNoiseEnabled: boolean;
  whiteNoiseType: NoiseType;
  miniMode: boolean;
  minimizeToTray: boolean;
}
