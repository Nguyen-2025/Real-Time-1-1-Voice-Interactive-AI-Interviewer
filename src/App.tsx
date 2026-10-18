/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  BookOpen,
  Volume2,
  Sparkles,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { CupsFrameworkModal } from './components/CupsFrameworkModal';
import {
  AudioPlayer,
  downsampleBuffer,
  float32ToBase64Pcm,
} from './utils/audioUtils';
import { GOOGLE_APM_OFFLINE_STEPS } from './utils/offlineInterviewEngine';

export default function App() {
  // Session & Media States
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isFrameworkOpen, setIsFrameworkOpen] = useState(false);

  // Connection & Mode Status
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineStepIndex, setOfflineStepIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // Two Separate Text Overlays
  // 1. User Transcription: Live speech-to-text transcript of user's voice (top-right bubble)
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // 2. AI Subtitle: Clean subtitles for AI mentor's responses (bottom overlay)
  const [aiSubtitle, setAiSubtitle] = useState<string>('');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const recognitionRef = useRef<any>(null);

  // Ref tracking to avoid stale closures in audio processing
  const isMutedRef = useRef(false);
  isMutedRef.current = isMuted;

  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;

  // Initialize webcam feed
  const startCamera = useCallback(async () => {
    try {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
    } catch (err: any) {
      console.warn('Camera access warning:', err);
      setCameraEnabled(false);
    }
  }, []);

  // Initialize webcam on mount
  useEffect(() => {
    startCamera();
    audioPlayerRef.current = new AudioPlayer();

    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [startCamera]);

  // Toggle Camera
  const toggleCamera = () => {
    if (cameraEnabled) {
      if (videoStreamRef.current) {
        videoStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setCameraEnabled(false);
    } else {
      if (videoStreamRef.current && videoStreamRef.current.getVideoTracks().length > 0) {
        videoStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
        setCameraEnabled(true);
      } else {
        startCamera();
      }
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  };

  // Setup Web Speech API for immediate low-latency local user speech recognition
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        if (isMutedRef.current) return;
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimText += event.results[i][0].transcript;
        }
        if (interimText.trim().length > 0) {
          setUserTranscript(interimText.trim());
          setIsUserSpeaking(true);
        }
      };

      recognition.onspeechend = () => {
        setIsUserSpeaking(false);
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('[SpeechRecognition] warning:', e.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still recording
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('[SpeechRecognition] Failed to start:', e);
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  // Stop the recording session
  const stopSession = useCallback(() => {
    setIsRecording(false);
    setConnectionStatus('idle');
    setIsAiSpeaking(false);
    setIsUserSpeaking(false);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    stopSpeechRecognition();
  }, [stopSpeechRecognition]);

  // Offline TTS Speaker
  const speakOfflineStep = useCallback((stepIdx: number) => {
    if (stepIdx >= GOOGLE_APM_OFFLINE_STEPS.length) return;
    const step = GOOGLE_APM_OFFLINE_STEPS[stepIdx];
    setAiSubtitle(step.coachQuestion);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(step.coachQuestion);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Advance to next offline step
  const nextOfflineStep = () => {
    const nextIdx = offlineStepIndex + 1;
    if (nextIdx < GOOGLE_APM_OFFLINE_STEPS.length) {
      setOfflineStepIndex(nextIdx);
      speakOfflineStep(nextIdx);
    } else {
      stopSession();
    }
  };

  // Start Offline practice session directly (0 API keys required)
  const startOfflineSession = async () => {
    setErrorMessage(null);
    setIsOfflineMode(true);
    setConnectionStatus('connected');
    setIsRecording(true);
    setOfflineStepIndex(0);
    setUserTranscript('');

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      audioStreamRef.current = audioStream;
    } catch (_) {}

    startSpeechRecognition();
    speakOfflineStep(0);
  };

  // Start the recording session & Gemini Live 1:1 Voice Connection
  const startSession = async () => {
    setErrorMessage(null);
    setConnectionStatus('connecting');
    setAiSubtitle('');
    setUserTranscript('');

    // Pre-initialize and resume audio playback context on user click gesture
    if (audioPlayerRef.current) {
      audioPlayerRef.current.initContext();
    }

    try {
      // 1. Microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = audioStream;

      // 2. Setup WebSocket connection to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Live] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            setConnectionStatus('connected');
            setIsRecording(true);
          } else if (data.type === 'audio' && data.audio) {
            setIsAiSpeaking(true);
            if (audioPlayerRef.current) {
              audioPlayerRef.current.playChunk(data.audio);
            }
          } else if (data.type === 'ai_transcript' && data.text) {
            // STRICT SEPARATION: AI transcription ONLY updates aiSubtitle
            setAiSubtitle(data.text);
            setIsAiSpeaking(true);
          } else if (data.type === 'user_transcript' && data.text) {
            // User transcription from Gemini Live
            setUserTranscript(data.text);
          } else if (data.type === 'interrupted') {
            if (audioPlayerRef.current) {
              audioPlayerRef.current.interrupt();
            }
            setIsAiSpeaking(false);
          } else if (data.type === 'turn_complete') {
            setIsAiSpeaking(false);
          } else if (data.type === 'error') {
            console.warn('[Live] Server notice, activating Local Practice Mode:', data.message);
            startOfflineSession();
          }
        } catch (err) {
          console.error('[Live] Message handling error:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[Live] WS Error, activating Local Practice Mode:', err);
        startOfflineSession();
      };

      ws.onclose = () => {
        console.log('[Live] WS Closed');
        if (isRecordingRef.current) {
          stopSession();
        }
      };

      // 3. Setup client audio capture and streaming to Gemini Live
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass();
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(audioStream);
      // 4096 buffer size gives ~90ms chunks
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || !isRecordingRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
          return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        // Downsample to 16,000 Hz for Gemini Live
        const pcm16k = downsampleBuffer(
          inputChannelData,
          inputCtx.sampleRate,
          16000
        );
        const base64 = float32ToBase64Pcm(pcm16k);

        wsRef.current.send(
          JSON.stringify({
            type: 'audio',
            audio: base64,
          })
        );
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      // 4. Start local SpeechRecognition for user transcription bubble
      startSpeechRecognition();
    } catch (err: any) {
      console.error('[Live] Failed to start practice session:', err);
      setErrorMessage(
        err?.message || 'Could not access microphone or connect to coach.'
      );
      setConnectionStatus('error');
      stopSession();
    }
  };

  // Toggle record button handler
  const handleRecordClick = () => {
    if (isRecording) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex flex-col justify-between p-3 sm:p-5 select-none font-['Helvetica_Neue',Helvetica,Arial,sans-serif] font-light">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between px-2 pt-1 pb-2">
        {/* App Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-normal tracking-tight text-gray-950">
                Google APM Coach
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-medium">
                CUPSPDM
              </span>
            </div>
            <p className="text-xs text-gray-400 font-light hidden sm:block">
              1:1 Real-Time Google APM Interview Prep • Zephyr
            </p>
          </div>
        </div>

        {/* Status indicator & Framework Button */}
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-700 text-xs tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live with Coach</span>
            </div>
          )}

          {connectionStatus === 'connecting' && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100/80 text-amber-700 text-xs tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Connecting...</span>
            </div>
          )}

          {/* CUPSPDM Framework Button */}
          <button
            onClick={() => setIsFrameworkOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-light tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
            aria-label="Open CUPSPDM Framework"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>CUPSPDM Framework</span>
          </button>
        </div>
      </header>

      {/* Main Webcam Area: Fills 65-70% of the screen */}
      <main className="w-full flex-1 flex items-center justify-center py-2 px-2">
        <div className="relative w-full max-w-4xl h-[67vh] sm:h-[68vh] rounded-3xl overflow-hidden bg-gray-950 shadow-2xl border border-gray-100 flex items-center justify-center">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
              cameraEnabled ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Camera Off Placeholder */}
          {!cameraEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-3">
                <VideoOff className="w-8 h-8 text-neutral-500" />
              </div>
              <p className="text-base text-neutral-300 font-light">
                Camera is turned off
              </p>
              <p className="text-xs text-neutral-500 mt-1 font-light max-w-xs">
                Your microphone and voice session will continue normally.
              </p>
            </div>
          )}

          {/* Top-Left: Coach Indicator & Voice Activity */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-light">Coach Zephyr</span>
              {isAiSpeaking && (
                <div className="flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-2.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-3.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" />
                </div>
              )}
            </div>
          </div>

          {/* TOP RIGHT TEXT OVERLAY: User Transcription Bubble ONLY */}
          {/* Note: As required, AI speaking transcription is NEVER shown in the top right. */}
          <div className="absolute top-4 right-4 z-20 max-w-[280px] sm:max-w-sm pointer-events-none">
            <div className="bg-neutral-800/85 backdrop-blur-md border border-white/15 text-white px-4 py-3 rounded-2xl shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-neutral-300 uppercase">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isUserSpeaking
                        ? 'bg-emerald-400 animate-pulse'
                        : isRecording
                        ? 'bg-neutral-400'
                        : 'bg-neutral-600'
                    }`}
                  />
                  <span>You (User)</span>
                </div>
                {isMuted && (
                  <span className="text-[10px] text-red-400 font-mono uppercase bg-red-950/60 px-1.5 py-0.5 rounded">
                    Muted
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-neutral-100 font-light leading-relaxed break-words min-h-[1.5rem]">
                {userTranscript ? (
                  userTranscript
                ) : isRecording ? (
                  <span className="text-neutral-400 italic font-light">
                    Listening to your response...
                  </span>
                ) : (
                  <span className="text-neutral-400 italic font-light">
                    Press the camera button to start your Google APM interview
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Starting Cue: Appears when not recording to guide user clearly */}
          {!isRecording && connectionStatus !== 'connecting' && (
            <div className="absolute bottom-28 z-20 flex flex-col items-center pointer-events-none animate-pulse">
              <div className="bg-white/95 backdrop-blur-md text-gray-900 text-xs px-4 py-2 rounded-full shadow-xl border border-gray-200 font-normal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Tap the shutter button below to start 1:1 Google APM practice</span>
              </div>
            </div>
          )}

          {/* Offline Next Step Control Button */}
          {isOfflineMode && isRecording && (
            <div className="absolute bottom-28 z-20 flex flex-col items-center">
              <button
                onClick={nextOfflineStep}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-normal shadow-2xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-blue-400/40"
              >
                <span>
                  Next Step ({offlineStepIndex + 1}/{GOOGLE_APM_OFFLINE_STEPS.length}):{' '}
                  {GOOGLE_APM_OFFLINE_STEPS[offlineStepIndex]?.phase.split('(')[0]}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* LOWER TEXT OVERLAY: AI Subtitles for the Mentor */}
          {aiSubtitle && (
            <div className="absolute bottom-28 left-4 right-4 z-20 flex justify-center pointer-events-none px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-black/80 backdrop-blur-md border border-white/15 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm md:text-base font-light tracking-wide text-center max-w-2xl shadow-2xl leading-relaxed flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
                <div>
                  <span className="text-blue-300 mr-2 font-normal">Coach Zephyr:</span>
                  {aiSubtitle}
                </div>
              </div>
            </div>
          )}

          {/* Error Message Toast inside video feed if any */}
          {errorMessage && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-red-950/90 border border-red-500/40 text-red-200 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2.5 backdrop-blur-md max-w-md shadow-2xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium text-red-100">{errorMessage}</span>
                <span className="text-[10px] text-red-300">
                  Please check microphone permission in your browser or open in a direct tab.
                </span>
              </div>
            </div>
          )}

          {/* Bottom Feed Controls:
              - Left: Mute/Unmute
              - Middle: iPhone Camera style record button
              - Right: Turn camera off/on
          */}
          <div className="absolute bottom-5 inset-x-0 z-20 flex items-center justify-center gap-6 sm:gap-10">
            {/* Left: Mute / Unmute Button */}
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer ${
                isMuted
                  ? 'bg-red-500/80 hover:bg-red-600 text-white border-red-400/50 shadow-red-500/20'
                  : 'bg-black/50 hover:bg-black/70 text-white border-white/20'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Middle: iPhone Camera Style Shutter / Record Button */}
            <button
              onClick={handleRecordClick}
              disabled={connectionStatus === 'connecting'}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-[3.5px] border-white p-1 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xl bg-black/25 backdrop-blur-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={isRecording ? 'Stop session' : 'Start Google APM practice'}
              aria-label={isRecording ? 'Stop session' : 'Start Google APM practice'}
            >
              {isRecording ? (
                /* Active / Recording: Red rounded square like iPhone recording video */
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-600 transition-all duration-300 shadow-md animate-pulse" />
              ) : (
                /* Idle: Clean white circle */
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white transition-all duration-300 shadow-inner" />
              )}
            </button>

            {/* Right: Turn Camera Off / On Button */}
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer ${
                !cameraEnabled
                  ? 'bg-neutral-800/90 hover:bg-neutral-700 text-amber-400 border-amber-400/40'
                  : 'bg-black/50 hover:bg-black/70 text-white border-white/20'
              }`}
              title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
              aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
            >
              {cameraEnabled ? (
                <Video className="w-5 h-5 text-white" />
              ) : (
                <VideoOff className="w-5 h-5 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Footer Note */}
      <footer className="w-full max-w-4xl mx-auto py-1 px-4 flex items-center justify-between text-[11px] text-gray-400 font-light">
        <span>Google APM Internship Prep • 45-Min Interview</span>
        <span className="font-mono text-gray-500 font-normal">CUPSPDM Standard</span>
      </footer>

      {/* CUPS Framework Modal Reminder */}
      <CupsFrameworkModal
        isOpen={isFrameworkOpen}
        onClose={() => setIsFrameworkOpen(false)}
      />
    </div>
  );
}
