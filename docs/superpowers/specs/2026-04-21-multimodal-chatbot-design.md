# Design Spec: Professional Minimalist Multimodal Chatbot
**Date**: 2026-04-21

## 1. Overview
A premium, professional AI assistant supporting text, image analysis, image generation, and voice interactions. Designed with a strict minimalist aesthetic (no glassmorphism).

## 2. Visual Theme & Atmosphere
- **Mood**: Refined, Efficient, High-end.
- **Palette**:
    - Background: `Slate-950` (#020617)
    - Foreground: `Slate-50` (#f8fafc)
    - Primary Accent: `Emerald-500` (#10b981) - Used for primary actions and active states.
    - Secondary: `Slate-800` (#1e293b) - Used for card surfaces.
    - Border: `Slate-800/50`
- **Typography**: 
    - Font: `Plus Jakarta Sans` (Sans-serif) for all text.
    - Hierarchy: Clean, bold headers; spacious line-height for body.
- **Shape**: Subtly rounded corners (`rounded-lg` / 8px). 1px solid borders.
- **Depth**: Minimal depth. Flat surfaces or very soft `shadow-sm`.

## 3. Architecture & Integration
- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS 4.
- **SDK**: OpenRouter SDK.
- **Endpoints**:
    - Coding/Text: `qwen/qwen3-32b`
    - Multimodal: `google/gemini-3-flash-preview`
    - T2A: `minimax/speech-02-turbo`
    - STT: `vaibhavs10/incredibly-fast-whisper`
    - Image Gen: `retro-diffusion/rd-plus`
- **Base URL**: `https://ai.hackclub.com/proxy/v1`

## 4. Component Structure
- **Main Layout**:
    - Sidebar: History (collapsible on mobile).
    - Chat Area: Centered, max-width container.
    - Input Bar: Fixed at bottom, expanding textarea, action icons.
- **Chat Elements**:
    - User Bubble: Emerald background, white text.
    - AI Bubble: Slate-800 background, Slate-50 text.
    - Media: 16:9 aspect ratio containers for images.
    - Audio: Minimal waveform or play/pause button with progress.
- **Settings**:
    - Voice Mode (PTT / Toggle).
    - Auto-play Audio toggle.
    - Clear conversation.

## 5. Interaction Patterns
- **Text**: Real-time streaming.
- **Images**: Drag-and-drop or upload. AI analyzes via Gemini-3.
- **Voice**: Mic button with active state visualization.
- **Generation**: Trigger via command (e.g., "/gen [prompt]") or button.

## 6. Security Audit Plan
- Use Environment Variables for API keys.
- Check for client-side key leakage.
- Validate inputs.
