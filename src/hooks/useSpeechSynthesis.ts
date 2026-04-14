import { useCallback, useEffect, useState } from "react";

export type SpeechPlaybackState = "idle" | "playing" | "paused";

interface UseSpeechSynthesisOptions {
  itemId: string;
  text: string;
  lang: string;
  fallbackLang?: string;
}

interface SpeechStatusDetail {
  activeItemId: string | null;
  state: SpeechPlaybackState;
}

const SPEECH_STATUS_EVENT = "menu:speech-status";

const voiceHints: Record<string, string[]> = {
  "pt-BR": ["pt-br", "portuguese", "português", "brazil", "brasil", "luciana", "felipe"],
  "en-US": ["en-us", "english", "inglês", "america", "united states", "samantha", "daniel", "alex"],
  "es-ES": ["es-es", "spanish", "español", "castilian", "jorge", "monica", "paulina", "helena"],
  "fr-FR": ["fr-fr", "french", "français", "francais", "thomas", "amelie", "marie"],
};

let activeItemId: string | null = null;
let activeState: SpeechPlaybackState = "idle";
let speechRequestToken = 0;
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

// For mobile resume workaround: store the text/position info
let pausedOptions: UseSpeechSynthesisOptions | null = null;
let pausedCharIndex = 0;

function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function emitSpeechStatus(detail: SpeechStatusDetail) {
  if (!isSpeechSupported()) return;
  window.dispatchEvent(new CustomEvent<SpeechStatusDetail>(SPEECH_STATUS_EVENT, { detail }));
}

function normalizeLang(lang: string) {
  return lang.toLowerCase();
}

function sortVoicesByPriority(voices: SpeechSynthesisVoice[]) {
  return [...voices].sort(
    (a, b) => Number(b.default) - Number(a.default) || Number(b.localService) - Number(a.localService)
  );
}

function getMatchingVoices(voices: SpeechSynthesisVoice[], targetLang: string) {
  const normalizedTarget = normalizeLang(targetLang);
  const langPrefix = normalizedTarget.split("-")[0];

  const exactMatches = sortVoicesByPriority(
    voices.filter((voice) => normalizeLang(voice.lang) === normalizedTarget)
  );
  if (exactMatches.length > 0) return exactMatches;

  const prefixMatches = sortVoicesByPriority(
    voices.filter((voice) => {
      const voiceLang = normalizeLang(voice.lang);
      return voiceLang === langPrefix || voiceLang.startsWith(`${langPrefix}-`);
    })
  );
  if (prefixMatches.length > 0) return prefixMatches;

  const hints = voiceHints[targetLang] ?? [];

  return sortVoicesByPriority(
    voices.filter((voice) => {
      const searchableVoice = `${voice.name} ${voice.lang} ${voice.voiceURI}`.toLowerCase();
      return hints.some((hint) => searchableVoice.includes(hint));
    })
  );
}

function findBestVoice(voices: SpeechSynthesisVoice[], targetLang: string, fallbackLang: string) {
  return getMatchingVoices(voices, targetLang)[0] ?? getMatchingVoices(voices, fallbackLang)[0] ?? null;
}

function resolveUtteranceLang(
  voices: SpeechSynthesisVoice[],
  targetLang: string,
  selectedVoice: SpeechSynthesisVoice | null,
  fallbackLang: string
) {
  if (selectedVoice?.lang) return selectedVoice.lang;

  const normalizedTarget = normalizeLang(targetLang);
  const langPrefix = normalizedTarget.split("-")[0];
  const hasCompatibleVoice = voices.some((voice) => {
    const voiceLang = normalizeLang(voice.lang);
    return voiceLang === normalizedTarget || voiceLang === langPrefix || voiceLang.startsWith(`${langPrefix}-`);
  });

  return hasCompatibleVoice ? targetLang : fallbackLang;
}

function getSpeechStateForItem(itemId: string): SpeechPlaybackState {
  return activeItemId === itemId ? activeState : "idle";
}

function setSpeechState(itemId: string | null, state: SpeechPlaybackState) {
  activeItemId = itemId;
  activeState = state;
  emitSpeechStatus({ activeItemId: itemId, state });
}

function clearSpeechState() {
  pausedOptions = null;
  pausedCharIndex = 0;
  setSpeechState(null, "idle");
}

function cancelSpeech() {
  speechRequestToken += 1;

  if (!isSpeechSupported()) return;

  window.speechSynthesis.cancel();
  clearSpeechState();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitFor(check: () => boolean, attempts = 8, interval = 120) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (check()) return true;
    await wait(interval);
  }

  return check();
}

async function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return [];

  const synth = window.speechSynthesis;
  const availableVoices = synth.getVoices();
  if (availableVoices.length > 0) return availableVoices;

  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;

    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(voices);
    };

    const handleVoicesChanged = () => {
      const updatedVoices = synth.getVoices();
      if (updatedVoices.length > 0) finish(updatedVoices);
    };

    const timeoutId = window.setTimeout(() => finish(synth.getVoices()), 1500);

    synth.addEventListener("voiceschanged", handleVoicesChanged);
    handleVoicesChanged();
  }).finally(() => {
    voicesPromise = null;
  });

  return voicesPromise;
}

async function speakText(options: UseSpeechSynthesisOptions, startFromChar = 0) {
  if (!isSpeechSupported() || !options.text.trim()) {
    clearSpeechState();
    return;
  }

  // Cancel any existing speech without clearing our paused state yet
  speechRequestToken += 1;
  const requestToken = speechRequestToken;
  const synth = window.speechSynthesis;
  synth.cancel();
  await wait(40);

  const voices = await ensureVoicesLoaded();

  if (requestToken !== speechRequestToken) return;

  // Use substring from startFromChar for resume functionality
  const textToSpeak = startFromChar > 0 ? options.text.substring(startFromChar) : options.text;
  if (!textToSpeak.trim()) {
    clearSpeechState();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  const selectedVoice = findBestVoice(voices, options.lang, options.fallbackLang || "en-US");

  utterance.lang = resolveUtteranceLang(voices, options.lang, selectedVoice, options.fallbackLang || "en-US");
  utterance.rate = 0.95;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Track character position for resume workaround
  utterance.onboundary = (event) => {
    if (requestToken !== speechRequestToken) return;
    pausedCharIndex = startFromChar + event.charIndex;
  };

  utterance.onstart = () => {
    if (requestToken !== speechRequestToken) return;
    pausedOptions = options;
    setSpeechState(options.itemId, "playing");
  };

  utterance.onpause = () => {
    if (requestToken !== speechRequestToken || activeItemId !== options.itemId) return;
    setSpeechState(options.itemId, "paused");
  };

  utterance.onresume = () => {
    if (requestToken !== speechRequestToken || activeItemId !== options.itemId) return;
    setSpeechState(options.itemId, "playing");
  };

  utterance.onend = () => {
    if (requestToken !== speechRequestToken || activeItemId !== options.itemId) return;
    clearSpeechState();
  };

  utterance.onerror = (event) => {
    // "interrupted" is expected when we cancel to re-speak
    if (event.error === "interrupted") return;
    if (requestToken !== speechRequestToken || activeItemId !== options.itemId) return;
    clearSpeechState();
  };

  pausedOptions = options;
  pausedCharIndex = startFromChar;
  setSpeechState(options.itemId, "playing");
  synth.speak(utterance);
}

async function pauseSpeech(itemId: string) {
  if (!isSpeechSupported()) return;

  const synth = window.speechSynthesis;
  synth.pause();

  const paused = await waitFor(() => synth.paused || getSpeechStateForItem(itemId) === "paused");

  if (paused) {
    setSpeechState(itemId, "paused");
    return;
  }

  cancelSpeech();
}

async function resumeSpeech(itemId: string) {
  if (!isSpeechSupported()) return;

  const synth = window.speechSynthesis;
  synth.resume();

  const resumed = await waitFor(
    () => !synth.paused && (synth.speaking || synth.pending || getSpeechStateForItem(itemId) === "playing"),
    10,
    120
  );

  if (resumed) {
    setSpeechState(itemId, "playing");
    return;
  }

  if (pausedOptions?.itemId === itemId) {
    await speakText(pausedOptions, pausedCharIndex);
    return;
  }

  clearSpeechState();
}

async function toggleSpeech(options: UseSpeechSynthesisOptions) {
  if (!isSpeechSupported()) return;

  const synth = window.speechSynthesis;
  const sourceChanged = pausedOptions?.itemId === options.itemId && (pausedOptions.text !== options.text || pausedOptions.lang !== options.lang);

  if (activeItemId === options.itemId && !sourceChanged) {
    if (activeState === "paused" || synth.paused) {
      await resumeSpeech(options.itemId);
      return;
    }

    if (activeState === "playing" || (synth.speaking && !synth.paused)) {
      await pauseSpeech(options.itemId);
      return;
    }
  }

  if (activeItemId && activeItemId !== options.itemId) {
    cancelSpeech();
  }

  if (sourceChanged) {
    cancelSpeech();
  }

  pausedCharIndex = 0;
  await speakText(options);
}

export function useSpeechSynthesis({ itemId, text, lang, fallbackLang = "en-US" }: UseSpeechSynthesisOptions) {
  const isSupported = isSpeechSupported();
  const [audioState, setAudioState] = useState<SpeechPlaybackState>(() => getSpeechStateForItem(itemId));

  // Cancel speech when language changes while this item is playing
  useEffect(() => {
    if (isSupported && activeItemId === itemId) {
      cancelSpeech();
    }
  }, [lang]);

  useEffect(() => {
    if (!isSupported) {
      setAudioState("idle");
      return;
    }

    const handleSpeechStatus = (event: Event) => {
      const detail = (event as CustomEvent<SpeechStatusDetail>).detail;
      setAudioState(detail.activeItemId === itemId ? detail.state : "idle");
    };

    window.addEventListener(SPEECH_STATUS_EVENT, handleSpeechStatus as EventListener);
    setAudioState(getSpeechStateForItem(itemId));

    return () => {
      window.removeEventListener(SPEECH_STATUS_EVENT, handleSpeechStatus as EventListener);

      if (activeItemId === itemId) {
        cancelSpeech();
      }
    };
  }, [isSupported, itemId]);

  const togglePlayback = useCallback(async () => {
    if (!isSupported) return;

    await toggleSpeech({ itemId, text, lang, fallbackLang });
  }, [fallbackLang, isSupported, itemId, lang, text]);

  return {
    audioState,
    isSupported,
    togglePlayback,
  };
}
