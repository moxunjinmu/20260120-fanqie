import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "./tauri";
import { minutesToSeconds } from "./time";
import type { AppStateSnapshot, Settings } from "../types";

const STORE_FILE = "pomodoro-store.json";
const STORAGE_KEY = "pomodoro_state";

let storePromise: ReturnType<typeof load> | null = null;

const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartNext: false,
  soundEnabled: true,
  whiteNoiseEnabled: false,
  whiteNoiseType: "rain",
  miniMode: false,
  minimizeToTray: true,
};

const DEFAULT_SNAPSHOT: AppStateSnapshot = {
  tasks: [],
  currentTaskId: null,
  settings: DEFAULT_SETTINGS,
  history: {},
  phase: "work",
  remainingSeconds: minutesToSeconds(DEFAULT_SETTINGS.workMinutes),
  status: "idle",
  workSessionsSinceLongBreak: 0,
};

const getStore = async () => {
  if (!storePromise) {
    storePromise = load(STORE_FILE, {
      autoSave: false,
      defaults: DEFAULT_SNAPSHOT as unknown as Record<string, unknown>,
    });
  }
  return storePromise;
};

export const loadState = async (): Promise<AppStateSnapshot | null> => {
  if (isTauri()) {
    const store = await getStore();
    const data = await store.get<AppStateSnapshot>(STORAGE_KEY);
    return data ?? null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppStateSnapshot;
  } catch {
    return null;
  }
};

export const saveState = async (state: AppStateSnapshot) => {
  if (isTauri()) {
    const store = await getStore();
    await store.set(STORAGE_KEY, state);
    await store.save();
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
