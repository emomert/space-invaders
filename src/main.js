import { Game } from './Game.js';

window.addEventListener('load', () => {
    window.game = new Game();
});

// Expose global functions for HTML buttons (Restart, Resume)
window.restartGame = () => {
    if (window.game) window.game.restartGame();
};

window.resumeGame = () => {
    if (window.game) window.game.resumeGame();
};
