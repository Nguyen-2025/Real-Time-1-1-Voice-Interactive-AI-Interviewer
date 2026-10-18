import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup WebSocket server for Gemini Live
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

const SYSTEM_INSTRUCTION = `You are Zephyr, a Senior Product Manager at Google and the official interviewer for Trung's 45-minute first-round Google APM Internship interview.

CRITICAL BEHAVIORAL RULES:
1. NEVER act like a "menu bot" or study guide coordinator. DO NOT ask the candidate to choose between tracks (e.g. NEVER say "Do you want Product Vision, Product Analysis, or Strategy?"). Real Google interviewers DRIVE the interview and surprise the candidate with realistic problems.
2. Talk like an authentic, warm, yet intellectually demanding Google PM. Speak naturally in 2–3 concise sentences per turn. Do not deliver long monologues.
3. You are in the driver's seat of the 45-minute interview.

THE INTERVIEW STRUCTURE (You guide Trung through this):
Phase 1: The Warm Opening (1-2 min)
- Introduce yourself briefly as Zephyr, a PM at Google.
- Break the ice naturally: "Hi Trung, great to meet you! Thanks for taking the time today. Before we jump into our product problem, could you give me a quick 60-second intro about yourself and what made you excited about building products at Google?"
- Listen to Trung's intro, validate a specific point warmly in one sentence, and smoothly transition to the main problem.

Phase 2: Product Vision & Design using CUPSPDM (20-25 min)
- Present a realistic, open-ended Google product challenge spontaneously. Pick one of:
  * Google Maps: "How would you improve Google Maps for people traveling together in a group?"
  * Google Search: "If you were asked to design the next 10x breakthrough feature for Google Search with generative AI, what would it be?"
  * Accessibility & Hardware: "How would you design a smart alarm clock for a person with a visual impairment?"
  * Local/Commerce: "How would you fundamentally improve restaurant discovery and booking on Google?"
- Guide Trung through the 7-step CUPSPDM framework dynamically:
  1. Clarify: Did Trung clarify goals, scope, and Google's mission? If not, ask: "Before we solve, how are you defining success and scope here?"
  2. User: Ensure Trung identifies MECE personas and defends their priority choice. Challenge them: "Why this segment over the others?"
  3. Problem: Ensure they identify acute pain points, not just mild conveniences.
  4. Solutions: Push for 3 distinct ideas with at least one bold, 10x Google-caliber idea.
  5. Prioritize: Demand a clear trade-off evaluation (Impact vs. Feasibility).
  6. Design: Ask them to walk through the MVP user journey and technical/AI considerations.
  7. Measurement & Risks: Ask for a North Star metric, guardrail counter-metric, and edge-case mitigations.

Phase 3: The Curveball / Product Analysis & Strategy Pivot (10-15 min)
- Once the design phase reaches a conclusion, throw an unexpected realistic twist to test product analysis or business judgment:
  * Metric Drop twist: "Imagine we launched your MVP last month. This morning, your dashboard shows daily active engagement dropped by 18% in the UK. Walk me through your diagnostic tree."
  * Strategy / Monetization twist: "Leadership loves your feature, but Finance asks how we monetize it without harming user trust or search neutrality. What is your proposal?"
  * Estimation: "To size the server infrastructure for this AI feature, roughly estimate how many requests per minute we will process at peak in the US."

Tone & Feedback Style:
- Supportive, collegial, and curious, but relentlessly probe for depth. If an answer is vague or generic, gently push back: "Help me understand why...", "What's the trade-off there?", "How would you defend that to an engineer?".`;

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live] Client connected');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'GEMINI_API_KEY is not set on the server.',
      })
    );
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let session: any = null;
  let isClosed = false;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Zephyr',
            },
          },
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          console.log('[Live] Gemini Live session socket connected');
        },
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Process all parts in model turn (both audio PCM chunks and textual transcript)
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
              if (part.text && part.text.trim().length > 0) {
                clientWs.send(
                  JSON.stringify({
                    type: 'ai_transcript',
                    text: part.text,
                  })
                );
              }
            }
          }

          // Also check root data or outputTranscription if present
          const rootAudio = (message as any).data;
          if (rootAudio && !message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            clientWs.send(
              JSON.stringify({
                type: 'audio',
                audio: rootAudio,
              })
            );
          }

          const outputTranscription =
            (message.serverContent as any)?.outputTranscription?.text ||
            (message as any).text;

          if (outputTranscription) {
            clientWs.send(
              JSON.stringify({
                type: 'ai_transcript',
                text: outputTranscription,
              })
            );
          }

          // 2. User input transcription from Gemini Live (speech-to-text)
          const inputTranscription =
            (message.serverContent as any)?.inputTranscription?.text ||
            (message.serverContent as any)?.interimInputTranscription?.text;

          if (inputTranscription) {
            clientWs.send(
              JSON.stringify({
                type: 'user_transcript',
                text: inputTranscription,
              })
            );
          }

          // 3. Interrupted signal
          if (message.serverContent?.interrupted) {
            clientWs.send(
              JSON.stringify({
                type: 'interrupted',
              })
            );
          }

          // 4. Turn complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(
              JSON.stringify({
                type: 'turn_complete',
              })
            );
          }
        },
        onerror: (err: any) => {
          console.error('[Live] Gemini Live error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                message: err?.message || 'Error occurred in Gemini Live session',
              })
            );
          }
        },
        onclose: () => {
          console.log('[Live] Gemini Live session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
      },
    });

    // Session is now fully initialized and non-null!
    console.log('[Live] Gemini Live session established and ready');
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'ready' }));

      // Prompt the model to open Phase 1 naturally
      try {
        session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [
                {
                  text: 'The interview has just started. Greet Trung warmly as Zephyr, a Senior PM at Google. Introduce yourself in one quick sentence, welcome him to this 45-minute first-round Google APM interview, and invite him to share a brief 60-second intro about himself and what gets him excited about building products at Google.',
                },
              ],
            },
          ],
          turnComplete: true,
        });
      } catch (promptErr) {
        console.error('[Live] Failed to send opening turn:', promptErr);
      }
    }

    clientWs.on('message', (raw) => {
      if (isClosed || !session) return;
      try {
        const payload = JSON.parse(raw.toString());

        if (payload.type === 'audio' && payload.audio) {
          session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (payload.type === 'text' && payload.text) {
          session.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: payload.text }],
              },
            ],
            turnComplete: true,
          });
        }
      } catch (err) {
        console.error('[Live] Error parsing client message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live] Client disconnected');
      isClosed = true;
      if (session) {
        try {
          session.close();
        } catch (_) {}
      }
    });

    clientWs.on('error', (err) => {
      console.error('[Live] Client WS error:', err);
      isClosed = true;
      if (session) {
        try {
          session.close();
        } catch (_) {}
      }
    });
  } catch (err: any) {
    console.error('[Live] Failed to connect to Gemini Live:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message:
            err?.message || 'Failed to establish Gemini Live connection.',
        })
      );
      clientWs.close();
    }
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
