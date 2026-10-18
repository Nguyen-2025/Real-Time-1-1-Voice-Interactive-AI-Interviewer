/**
 * Offline Google APM Interview Engine
 * Fallback mode when running locally without an API key or when offline.
 * Guides candidates step-by-step through the 7-step CUPSPDM framework.
 */

export interface InterviewStep {
  id: string;
  phase: string;
  coachQuestion: string;
  nextStepDelayMs?: number;
}

export const GOOGLE_APM_OFFLINE_STEPS: InterviewStep[] = [
  {
    id: 'intro',
    phase: 'Phase 1: Warm Intro (60s)',
    coachQuestion:
      "Hi Trung, great to meet you! Thanks for jumping on today. Before we dive into our product challenge, could you give me a quick 60-second intro about yourself and what gets you excited about building products at Google?",
  },
  {
    id: 'product_vision_prompt',
    phase: 'Phase 2: Product Vision (C - Clarify)',
    coachQuestion:
      "Awesome to hear that, Trung. Let's jump into our main challenge: How would you improve Google Maps for people traveling together in a group? Walk me through how you clarify the goal, the scope, and connect this back to Google's mission.",
  },
  {
    id: 'user_groups',
    phase: 'Phase 2: Product Vision (U - User Ecosystem)',
    coachQuestion:
      "Great clarification. Now, who are the key user groups in this ecosystem? How would you segment them, and which single priority group will you focus on today, and why?",
  },
  {
    id: 'pain_points',
    phase: 'Phase 2: Product Vision (P - Pain Points)',
    coachQuestion:
      "Strong choice. Now, let's map out that group's journey. What are their top three acute pain points when planning and traveling together, and which one is the most critical to solve?",
  },
  {
    id: 'solutions',
    phase: 'Phase 2: Product Vision (S - 10x Solutions)',
    coachQuestion:
      "Clear prioritization. Now, let's brainstorm 3 creative, divergent solutions to tackle that critical pain point. Try to bring in at least one ambitious, 10x Google-caliber idea with multimodal AI.",
  },
  {
    id: 'prioritize_design',
    phase: 'Phase 2: Product Vision (P & D - Prioritize & Design)',
    coachQuestion:
      "I like the breadth there. How do you evaluate the trade-offs between those solutions, and which one is your winning MVP? Walk me through the step-by-step user journey and how it actually works.",
  },
  {
    id: 'metrics_risks',
    phase: 'Phase 2: Product Vision (M - Measurement & Risks)',
    coachQuestion:
      "Excellent walkthrough. What is your single North Star metric for this feature, what are your guardrail metrics to prevent unintended consequences, and what potential risks or edge cases do you foresee?",
  },
  {
    id: 'curveball_analysis',
    phase: 'Phase 3: The Curveball (Product Analysis & Root Cause)',
    coachQuestion:
      "Terrific design. Now, let's fast forward: We launched your MVP 4 weeks ago. This morning, your dashboard shows daily active engagement dropped by 18% in the UK. Walk me through your diagnostic tree and how you'd investigate this.",
  },
  {
    id: 'conclusion',
    phase: 'Phase 4: Wrap-Up',
    coachQuestion:
      "That was a very structured and rigorous root-cause breakdown, Trung. That wraps up our 45-minute practice session! You demonstrated strong CUPSPDM discipline and authentic Google PM instincts. Great job!",
  },
];
