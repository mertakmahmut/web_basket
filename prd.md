# Flappy Bird-Inspired 2D Web Game - Product Requirements Document (PRD)

## Overview
A simple, addictive 2D web game where the player controls a bird, navigating it through gaps between pipes by clicking or tapping to make the bird "flap" and avoid obstacles. The goal is to achieve the highest possible score.

---

## Done

- [x] **Game Concept Defined**  
  The core gameplay loop and mechanics are inspired by Flappy Bird.
- [x] **Game Mechanics**
  - Bird movement (gravity, flap/jump on click/tap)
  - Pipe generation (randomized gaps, movement)
  - Collision detection (bird with pipes and ground)
  - Scoring system (increment score when passing pipes)
  - Game over logic (reset, restart)
  - Game speed increases smoothly and transparently as the player scores, for gradual difficulty ramp-up
  - Improved pipe hitbox: true circle-rectangle collision for fairness
- [x] **Game Loop**
  - Efficient update and render cycles
- [x] **Input Handling**
  - Mouse click and touch support
- [x] **Score Display**
  - Real-time score during gameplay
  - Animated score when it increases
  - 'New!' badge for new high score
- [x] **Sound Effects**
  - Flap sound
  - Score sound
  - Collision/game over sound
- [x] **High Score Tracking** (local storage)
- [x] **Pause/Resume Functionality**
- [x] **Sound On/Off Toggle**
- [x] **Start Screen & Game Over Screen**
  - Game title, start button, final score, high score, restart button, sound toggle
- [x] **UI/Visual Polish**
  - Pipe shadows and outlines for depth and separation
  - Sea reflection/gradient for realism
  - Smoother basketball character rendering (no shadow/outline)
  - Semi-transparent overlays and animated transitions for start/game over screens

---

## To Be Done

### 1. Game Design
- [ ] **Game Art & Assets**
  - Bird sprite (animation for flapping)
  - Pipe sprites (top and bottom)
  - Background (sky, clouds, ground)
  - UI elements (score, start/restart buttons)

### 2. Technical Implementation
- [ ] **Technology Stack**
  - HTML5 Canvas or WebGL for rendering
  - JavaScript (or TypeScript) for game logic
  - Responsive design for desktop and mobile

### 3. Additional Features (Optional)
- [ ] **Share Score (social media integration)**

### 4. Testing & Deployment
- [ ] **Cross-browser Testing**
- [ ] **Performance Optimization**
- [ ] **Deployment (e.g., GitHub Pages, Vercel, Netlify)**

---

## Notes
- Keep the game simple and lightweight for fast loading and smooth performance.
- Focus on addictive, easy-to-learn gameplay.

---

## Version History
- v0.1: PRD created
- v0.2: Core gameplay, scoring, and collision completed
- v0.3: Sound effects, high score, pause/resume, sound toggle, and UI polish completed
- v0.4: Smooth, transparent game speed increase based on score
- v0.5: UI polish (animated score, new badge, pipe shadows/outlines, sea reflection), improved hitbox, smoother basketball rendering
