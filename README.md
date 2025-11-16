# Space Defender

Space Defender is a browser-based first-person survival shooter inspired by classic space-invader tension. It blends a cinematic landing screen with a fully interactive arena built with Three.js so you can fight waves of neon-tinted drones right inside the browser without plug-ins or installs.

## Gameplay Loop
- Launch `index.html` to read the briefing, browse your local high-scores, and jump into the arena.
- Survive as long as you can in `game.html`, kiting enemies around the circular floor while keeping your energy rifle charged and your stamina topped up.
- Rack up points by eliminating enemies (100 base points + distance bonuses) and save your run to the local leaderboard when you fall.

## Controls
- `Mouse` - look around (click the canvas to lock pointer)
- `W / A / S / D` - strafe and advance/retreat
- `Shift` - sprint while stamina allows
- `Left Click` - fire the rifle
- `Esc` - release the pointer lock

## Features
- **Stylized landing hub** with animated background, responsive layout, and high-score list persisted in `localStorage`.
- **Pointer-lock FPS gameplay** rendered with custom lighting, volumetric fog, and glow-accented weapon geometry built directly in code.
- **Dynamic enemy waves** that alter color palettes, acceleration, and attack speed as the wave counter increases.
- **Score tracking & sharing**: distance-based scoring, wave summary modal, and save-to-leaderboard flow with optional player names.
- **Responsive UI overlays** including HUD crosshair, score panel, stamina/health indicators, pause/game-over states, and a retro start countdown.

## Built With
- [Three.js](https://threejs.org/) for accelerated 3D rendering, particles, lighting, and spatial math.
- Vanilla HTML5, CSS3, and JavaScript modules for layouts, menus, controls, and state management.
- Custom art stored in `resources/` (arena background, crosshair, hero weapon textures, and reference 3D files for the sci-fi rifle).

## Project Structure
```
Space_Invader_Shooter/
|-- index.html      # Landing screen, instructions, leaderboard
|-- game.html       # Three.js arena, gameplay logic, HUD
|-- landing.html    # Redirect helper for legacy entry points
`-- resources/      # Textures, UI assets, weapon reference models
```

## Getting Started
1. Clone or download this repo.
2. Open `index.html` in any modern desktop browser (Chrome, Edge, Brave, Firefox). For the smoothest pointer-lock experience you can also serve the folder via a lightweight static server (`npx serve`, `python -m http.server`, etc.) and visit `http://localhost:PORT`.
3. Click `START GAME`, lock your mouse, and fight off the endless wave of invaders.

Enjoy defending the orbiting station, and feel free to fork the project with your own arenas, enemy types, or weapon experiments!
