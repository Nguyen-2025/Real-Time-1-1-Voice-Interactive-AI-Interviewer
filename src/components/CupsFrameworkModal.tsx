import React, { useState } from 'react';
import {
  X,
  Compass,
  Users,
  AlertTriangle,
  Lightbulb,
  Sliders,
  Layers,
  BarChart3,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Target,
  Bot,
} from 'lucide-react';

interface CupsFrameworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CupsFrameworkModal: React.FC<CupsFrameworkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'cupspdm' | 'google_tracks'>('cupspdm');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-8 relative text-gray-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest uppercase font-mono text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-medium">
                Google APM Internship Prep
              </span>
            </div>
            <h2 className="text-2xl font-light tracking-tight text-gray-950 mt-1">
              The 7-Step CUPSPDM Framework
            </h2>
            <p className="text-xs text-gray-500 font-light mt-0.5">
              Structured playbook for the 45-minute Google APM first-round interview
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-gray-100/80 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('cupspdm')}
            className={`px-4 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'cupspdm'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            CUPSPDM Framework (7 Steps)
          </button>
          <button
            onClick={() => setActiveTab('google_tracks')}
            className={`px-4 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'google_tracks'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            3 Google 45-Min Tracks
          </button>
        </div>

        {/* Tab 1: The 7 Steps of CUPSPDM */}
        {activeTab === 'cupspdm' && (
          <div className="mt-5 space-y-3.5">
            {/* 1. Clarify */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-950 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-blue-600" />
                      C — Clarify
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">Step 1</span>
                  </div>
                  <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                    Repeat and rephrase the prompt to ensure alignment. Define the scope, boundaries (geography, platform, constraints), and explicitly connect the problem back to the company’s mission and vision (e.g. Google: <em>"Organize the world’s information and make it universally accessible and useful"</em>).
                  </p>
                </div>
              </div>
            </div>

            {/* 2. User */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-950 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      U — User Ecosystem & Personas
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">Step 2</span>
                  </div>
                  <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                    Identify the full target user ecosystem (e.g., consumers, businesses, creators, visually impaired users). Segment them into 2–3 MECE personas, then select <strong>one priority user group</strong> with clear justification (market size, acute unaddressed pain, strategic alignment).
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Problem */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      P — Problem & Pain Points
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">Step 3</span>
                  </div>
                  <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                    Map out the day-in-the-life journey of the prioritized user. Pinpoint 3 specific friction points, analyze why current alternatives fall short, and prioritize the single most critical problem to solve.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Solutions */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-950 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      S — Solutions (Divergent & 10x)
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">Step 4</span>
                  </div>
                  <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                    Brainstorm 3 creative, distinct solutions. Aim for a Google "10x" mindset: 1) Practical/Incremental, 2) Ambitious AI/Technology-driven (e.g., multimodal Gemini integration), and 3) Ecosystem/Platform solution.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Prioritize */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5">
                  5
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-950 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      P — Prioritize & Evaluate Trade-offs
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">Step 5</span>
                  </div>
                  <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                    Evaluate your solutions objectively using a 2x2 or criteria matrix (Impact on User vs Engineering Feasibility / Effort / Risk). Pick the winning solution and defend your choice against reasonable alternatives.
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Design */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5">
                  6
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-950 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600" />
                      D — Design & User Journey Deep Dive
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">Step 6</span>
                  </div>
                  <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                    Walk through the end-to-end user experience, UI components, entry points, and technical architecture (e.g. how the AI or cloud pipeline operates). Describe the MVP experience step-by-step.
                  </p>
                </div>
              </div>
            </div>

            {/* 7. Measurement & Risks */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5">
                  7
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-950 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-rose-600" />
                      M — Measurement, Risks & Guardrails
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">Step 7</span>
                  </div>
                  <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                    Define 1 <strong>North Star Metric</strong> (e.g., successful weekly bookings), 2 supporting input metrics, and 1 crucial <strong>Guardrail / Counter-Metric</strong> (e.g., cancellation rate, app latency). Identify privacy, hallucination, or cannibalization risks and mitigation plans.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: The 3 Google Interview Focus Areas */}
        {activeTab === 'google_tracks' && (
          <div className="mt-5 space-y-4">
            {/* Area 1: Product Vision */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-900 font-medium text-sm">
                <Target className="w-4 h-4 text-blue-600" />
                Track 1: Product Vision (Design from Scratch & 10x Innovation)
              </div>
              <p className="text-xs text-blue-950/80 font-light mt-1 leading-relaxed">
                Focuses on user empathy, creative breadth, accessibility, and 10x Google thinking. Apply the full <strong>CUPSPDM</strong> framework here.
              </p>
              <div className="mt-2.5 space-y-1 text-xs text-blue-900/90 font-light bg-white/70 p-2.5 rounded-xl border border-blue-100/60">
                <div>• <em>"How would you improve restaurant search in Google Maps?"</em></div>
                <div>• <em>"If you were to build the next great feature for Google Search, what would it be?"</em></div>
                <div>• <em>"How would you design an alarm clock for a person with a visual impairment?"</em></div>
              </div>
            </div>

            {/* Area 2: Product Analysis */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-2 text-amber-900 font-medium text-sm">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                Track 2: Product Analysis (Root-Cause Investigation & Estimation)
              </div>
              <p className="text-xs text-amber-950/80 font-light mt-1 leading-relaxed">
                Tests analytical rigor, diagnostic frameworks, and mental math. Structure: Clarify → Form hypothesis tree (External vs Internal, Technical vs Seasonal, Regional vs Platform) → Propose diagnostic checks.
              </p>
              <div className="mt-2.5 space-y-1 text-xs text-amber-900/90 font-light bg-white/70 p-2.5 rounded-xl border border-amber-100/60">
                <div>• <em>"As a Gmail PM on Monday, received emails dropped 15% last weekend. What do you do?"</em></div>
                <div>• <em>"You notice a 30% sudden change in usage of your product, what would you investigate?"</em></div>
                <div>• <em>"Estimation: How many messages per second does Gmail receive globally?"</em></div>
              </div>
            </div>

            {/* Area 3: Strategic Insights */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-900 font-medium text-sm">
                <Compass className="w-4 h-4 text-purple-600" />
                Track 3: Strategic Insights (Market Entry, Growth & Monetization)
              </div>
              <p className="text-xs text-purple-950/80 font-light mt-1 leading-relaxed">
                Tests business acumen, company moat, and ecosystem synergy. Structure: Market size/TAM → Competitor landscape → Google's unfair advantage → Build vs Partner vs Buy → Monetization model.
              </p>
              <div className="mt-2.5 space-y-1 text-xs text-purple-900/90 font-light bg-white/70 p-2.5 rounded-xl border border-purple-100/60">
                <div>• <em>"Should Google offer a StubHub competitor to sell sports & concert tickets?"</em></div>
                <div>• <em>"How would you monetize Google Lens or Google Photos more effectively?"</em></div>
                <div>• <em>"How would you grow YouTube Shorts engagement in emerging markets?"</em></div>
              </div>
            </div>

            {/* AI Fluency Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed font-light">
                <span className="font-medium text-emerald-950">Google APM Advantage (AI Product Integration):</span> Demonstrate awareness of modern AI/multimodal capabilities (Gemini, context windows, latency, hallucinations) and ethical AI principles (privacy, transparency, bias).
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-mono">
            CUPSPDM • Google APM 45-Min Standard
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-light transition-all cursor-pointer"
          >
            Ready to Practice
          </button>
        </div>
      </div>
    </div>
  );
};
