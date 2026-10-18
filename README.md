# APM Product Sense Coach (CUPSPDM)

> **Real-Time 1:1 Voice-Interactive AI Interviewer for Google APM Candidates**  
> Powered by **Gemini Live API (`gemini-3.8-live`)**, **Zephyr Voice**, and the **7-Step CUPSPDM Framework**.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React%2019-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Gemini Live API](https://img.shields.io/badge/Gemini%20Live%20API-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=flat&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## Executive Summary

**APM Product Sense Coach** is a production-grade, single-screen web application designed to simulate the high-stakes, 45-minute first-round **Google Associate Product Manager (APM) Internship interview**. 

Instead of typing or interacting with a generic chatbot, candidates practice face-to-face via a live mirrored webcam feed and engage in real-time, bidirectional voice dialogue with an authentic AI interviewer (**Coach Zephyr**, acting as a Senior Product Manager at Google).

The coach drives the interview, challenges candidates on edge cases, enforces MECE user segmentation, and guides them step-by-step through the structured **CUPSPDM Framework**.

---

## Key Features

- **⚡ Real-Time Bidirectional Voice (Gemini Live API)**:
  - Low-latency full-duplex audio conversation powered by `gemini-3.8-live` with the expressive **Zephyr** prebuilt voice.
  - Native interruptibility: if the user interrupts or starts speaking, audio playback halts immediately with zero jitter.
- **📐 Built-In 7-Step CUPSPDM Framework**:
  - Dynamically guides candidates through **C**larify, **U**ser Ecosystem, **P**roblem Prioritization, **S**olutions (10x ideas), **P**rioritize & Trade-offs, **D**esign & User Journey, and **M**easurement & Risks.
  - Interactive top-right framework modal detailing actionable tips and the **3 Core Google APM 45-Minute Interview Tracks** (*Product Vision, Product Analysis & Metric Drops, and Strategic Insights*).
- ** Dual-Mode Architecture (Cloud Live + Offline Local Mode)**:
  - **Cloud Live Mode**: Full-duplex WebSocket connection streaming 16kHz PCM audio to Gemini Live and receiving 24kHz PCM audio.
  - **Local Offline Fallback Mode**: If running locally without an API key or offline, the app seamlessly falls back to the browser's built-in `webkitSpeechRecognition` (STT) and `window.speechSynthesis` (TTS) to provide a complete 9-step guided interview loop with zero external dependencies.
- **🪞 Minimalist Camera Feed & iPhone Shutter UX**:
  - Mirrored webcam feed occupying 65–70% of the viewport with minimalist Helvetica Neue Light typography.
  - Circular shutter button mimicking the iOS camera interface (transitions to a red pulsing square during live sessions).
  - One-tap controls for mic mute/unmute and camera toggle.
- **💬 Strict Text Overlay Separation**:
  - **Top-Right Bubble**: Dedicated exclusively to real-time speech-to-text transcript of the *user's* voice.
  - **Bottom Subtitle Bar**: Elegant, subtle subtitle overlay specifically for *Coach Zephyr's* spoken guidance.

---

## System Architecture & Data Flow

```
┌───────────────────────────────────────────────────────────────┐
│                      Client (Browser SPA)                     │
│                                                               │
│   ┌──────────────────┐           ┌────────────────────────┐   │
│   │  Webcam Video    │           │ User STT Bubble        │   │
│   │  (getUserMedia)  │           │ (webkitSpeechRecog)    │   │
│   └──────────────────┘           └────────────────────────┘   │
│            ▲                                                  │
│            │ (16kHz PCM mic capture)                          │
│            ▼                                                  │
│   ┌──────────────────┐           ┌────────────────────────┐   │
│   │ ScriptProcessor  │           │ AI Subtitle & Audio    │   │
│   │ Resampler / PCM  │           │ (AudioContext 24kHz)   │   │
│   └────────┬─────────┘           └──────────▲─────────────┘   │
└────────────┼────────────────────────────────┼─────────────────┘
             │                                │
             │ JSON { type: "audio", pcm }    │ JSON { audio, text }
             ▼                                │
┌─────────────────────────────────────────────┼─────────────────┐
│              Full-Stack Backend (server.ts / Node.js)         │
│                                                               │
│   ┌─────────────────────────────────────────┴─────────────┐   │
│   │               Express + WebSocketServer               │   │
│   │               Path: /live                             │   │
│   └─────────────────────────┬─────────────────────────────┘   │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              │ Bidirectional Live Session
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                    Google GenAI Cloud Engine                  │
│                                                               │
│        Model: gemini-3.8-live                                 │
│        Voice: Zephyr                                          │
│        Modalities: [Modality.AUDIO]                           │
│        Input: audio/pcm;rate=16000                            │
│        Output: audio/pcm;rate=24000                           │
└───────────────────────────────────────────────────────────────┘
```

---

## The CUPSPDM Framework

| Stage | Step | Focus in Google APM Interviews |
|---|---|---|
| **C** | **Clarify** | Repeat prompt, bound the scope (geo, platform), and connect to Google's mission (*"Organize world's info..."*). |
| **U** | **User Ecosystem** | Identify MECE user segments and prioritize ONE group with data-backed justification. |
| **P** | **Problem & Pain Points** | Map user journey, extract 3 acute pain points, and select the #1 bottleneck. |
| **S** | **Solutions** | Brainstorm 3 distinct solutions including at least one ambitious, 10x GenAI-powered concept. |
| **P** | **Prioritize** | Evaluate solutions on an Impact vs. Feasibility / Risk matrix; defend the chosen MVP. |
| **D** | **Design Deep Dive** | Detail the MVP functionality, UI entry points, and technical/AI architecture. |
| **M** | **Measurement & Risks** | Define 1 North Star Metric, supporting input KPIs, 1 Guardrail counter-metric, and edge-case mitigations. |

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Motion, Lucide Icons.
- **Audio Processing**: Web Audio API (`AudioContext`, `AudioBufferSourceNode`, `ScriptProcessorNode`), Float32 to Int16 PCM little-endian encoders, Linear Resampling.
- **Backend**: Node.js, Express, `ws` (WebSocket Server), `tsx`.
- **AI Integration**: `@google/genai` TypeScript SDK connecting to `gemini-3.8-live`.

---

## Quickstart & Local Setup

### 1. Prerequisites
- Node.js (version 18 or higher)
- npm or pnpm

### 2. Clone and Install
```bash
git clone https://github.com/your-username/apm-product-sense-coach.git
cd apm-product-sense-coach
npm install
```

### 3. Choose Running Mode

#### Option A: Full AI Live Mode (With Free Gemini API Key)
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey) (No credit card required).
2. Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="AIzaSyYourKeyHere"
   PORT=3000
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in Chrome/Edge, allow camera and microphone permissions, and tap the white camera shutter button.

#### Option B: Zero-API Offline Mode (100% Free / No Key Required)
1. Do not configure `.env`. Simply run:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000). The app will automatically initialize the **Local Offline Practice Engine**, using the browser's native text-to-speech and speech recognition to guide you through the 7 steps of CUPSPDM.

---

## Security & Privacy

- **No Secrets in Client Code**: All Gemini API credentials reside server-side in Node.js environment variables.
- **Git-Ignored Secrets**: `.env` and `.env.*` files are explicitly excluded in `.gitignore` to prevent secret leakage.
- **Ephemeral Streaming**: Webcam and microphone streams are processed purely in-memory and are never stored or logged.

---

## License
Distributed under the Apache-2.0 License.
