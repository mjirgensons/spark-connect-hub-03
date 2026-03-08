import { useState, useEffect, useRef, useCallback } from "react";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
}

interface UseVoiceInputReturn {
  isSupported: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceInput({ onTranscript }: UseVoiceInputOptions): UseVoiceInputReturn {
  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // Do NOT set recognition.lang — let browser auto-detect

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onTranscriptRef.current(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [SpeechRecognition]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  return { isSupported, isListening, startListening, stopListening };
}
