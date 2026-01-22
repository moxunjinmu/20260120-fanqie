import { useCallback, useRef } from "react";
import { CHIME_NOTES, CHIME_VOLUME } from "../constants";

export const useChime = () => {
  const contextRef = useRef<AudioContext | null>(null);

  return useCallback((enabled: boolean) => {
    if (!enabled) return;
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    const context = contextRef.current;
    const now = context.currentTime;

    CHIME_NOTES.forEach((note, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.value = note.frequency;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, now + index * 0.1);
      gain.gain.linearRampToValueAtTime(CHIME_VOLUME, now + index * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + note.duration + 0.05);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + note.duration + 0.1);
    });
  }, []);
};
