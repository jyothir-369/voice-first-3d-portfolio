# Voice Portfolio

**Talk to My Work** - A voice-first 3D portfolio application

## Features

- 🎤 Voice input with Web Speech API
- 🔊 Voice output with speech synthesis
- 🌊 Real-time 3D dot-wave terrain visualization
- 📦 Interactive 3D objects that appear during conversation
- 🌓 Automatic dark/light theme support
- ♿ Accessible controls and keyboard navigation
- 📱 Mobile responsive

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env` (for Phase 6 AI backend)

## Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Testing

Run unit tests:

```bash
npm test
```

Run E2E tests:

```bash
npm run test:e2e
```

## Project Structure

```
voice-portfolio/
├── src/
│   ├── main.ts           # Application entry point
│   ├── types.ts          # TypeScript type definitions
│   ├── ui/               # UI controls and DOM manipulation
│   ├── voice/            # Speech recognition and synthesis
│   ├── engine/           # Conversation logic and knowledge base
│   ├── scene/            # 3D terrain rendering
│   ├── stage/            # 3D object stage and animations
│   └── styles/           # CSS styles
├── content/              # Content files (Phase 0)
├── tests/                # Test files
└── public/               # Static assets
```

## Browser Support

- ✅ Chrome/Edge (full features including voice recognition)
- ✅ Safari (voice recognition supported)
- ⚠️  Firefox (limited - no Web Speech API recognition)

## Phase Status

- [x] Phase 0: Discovery and Content
- [x] Phase 1: Foundation and Project Setup
- [ ] Phase 2: Voice Input and Output Layer
- [ ] Phase 3: 3D Scene (Dot-Wave Terrain)
- [ ] Phase 4: 3D Object Stage
- [ ] Phase 5: Conversation Engine (Rules)
- [ ] Phase 6: AI Backend (Real Answers)
- [ ] Phase 7: Content, UI Polish and Branding
- [ ] Phase 8: Accessibility, Privacy and Legal
- [ ] Phase 9: Performance and Cross-Browser
- [ ] Phase 10: Testing and Quality Assurance
- [ ] Phase 11: Deployment, Analytics and Launch
- [ ] Phase 12: Post-Launch Operation and Roadmap

## License

Private - All Rights Reserved
