import { useCallback, useRef } from "react";
import type { NoiseType } from "../types";
import { NOISE_FILTER_FREQUENCY, AUDIO_VOLUME } from "../constants";

export const useWhiteNoise = () => {
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  const ensureContext = () => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  };

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (filterRef.current) {
      filterRef.current.disconnect();
      filterRef.current = null;
    }
  }, []);

  const start = useCallback(
    (type: NoiseType) => {
      const context = ensureContext();
      stop();

      const bufferSize = context.sampleRate * 2;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * AUDIO_VOLUME;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = NOISE_FILTER_FREQUENCY[type];

      source.connect(filter);
      filter.connect(context.destination);

      sourceRef.current = source;
      filterRef.current = filter;
      source.start(0);
    },
    [stop],
  );

  return { start, stop };
};
