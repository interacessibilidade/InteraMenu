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
let speechRequestToken = 0;
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

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
  if (!isSpeechSupported() || activeItemId !== itemId) return "idle";

  const synth = window.speechSynthesis;
  if (synth.paused) return "paused";
  if (synth.speaking || synth.pending) return "playing";

  return "idle";
}

function clearSpeechState() {
  activeItemId = null;
  emitSpeechStatus({ activeItemId: null, state: "idle" });
}

function cancelSpeech() {
  speechRequestToken += 1;

  if (!isSpeechSupported()) return;

  window.speechSynthesis.cancel();
  clearSpeechState();
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

async function speakText({ itemId, text, lang, fallbackLang = "en-US" }: UseSpeechSynthesisOptions) {
  if (!isSpeechSupported() || !text.trim()) {
    clearSpeechState();
    return;
  }

  cancelSpeech();
  const requestToken = speechRequestToken;
  const synth = window.speechSynthesis;
  const voices = await ensureVoicesLoaded();

  if (requestToken !== speechRequestToken) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = findBestVoice(voices, lang, fallbackLang);

  utterance.lang = resolveUtteranceLang(voices, lang, selectedVoice, fallbackLang);
  utterance.rate = 0.95;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => {
    if (requestToken !== speechRequestToken) return;
    activeItemId = itemId;
    emitSpeechStatus({ activeItemId: itemId, state: "playing" });
  };

  utterance.onpause = () => {
    if (requestToken !== speechRequestToken || activeItemId !== itemId) return;
    emitSpeechStatus({ activeItemId: itemId, state: "paused" });
  };

  utterance.onresume = () => {
    if (requestToken !== speechRequestToken || activeItemId !== itemId) return;
    emitSpeechStatus({ activeItemId: itemId, state: "playing" });
  };

  utterance.onend = () => {
    if (requestToken !== speechRequestToken || activeItemId !== itemId) return;
    clearSpeechState();
  };

  utterance.onerror = () => {
    if (requestToken !== speechRequestToken || activeItemId !== itemId) return;
    clearSpeechState();
  };

  activeItemId = itemId;
  emitSpeechStatus({ activeItemId: itemId, state: "playing" });
  synth.speak(utterance);
}

async function toggleSpeech(options: UseSpeechSynthesisOptions) {
  if (!isSpeechSupported()) return;

  const synth = window.speechSynthesis;

  if (activeItemId === options.itemId && (synth.speaking || synth.pending || synth.paused)) {
    if (synth.paused) {
      synth.resume();
      emitSpeechStatus({ activeItemId: options.itemId, state: "playing" });
      return;
    }

    synth.pause();
    emitSpeechStatus({ activeItemId: options.itemId, state: "paused" });
    return;
  }

  await speakText(options);
}

export function useSpeechSynthesis({ itemId, text, lang, fallbackLang = "en-US" }: UseSpeechSynthesisOptions) {
  const isSupported = isSpeechSupported();
  const [audioState, setAudioState] = useState<SpeechPlaybackState>(() => getSpeechStateForItem(itemId));

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