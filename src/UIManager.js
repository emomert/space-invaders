export class UIManager {
    constructor() {
        this.scoreEl = document.getElementById('scoreValue');
        this.waveEl = document.getElementById('waveValue'); // Note: ID in HTML is 'waveValue' inside 'wave' div? No, let's check HTML.
        // HTML: <div id="wave">Wave: <span id="waveValue">1</span></div>

        this.ammoEl = document.getElementById('ammoValue');
        this.ammoMaxEl = document.getElementById('ammoMax');
        this.reloadEl = document.getElementById('reloadIndicator');

        this.dangerFill = document.getElementById('dangerFill');
        this.staminaFill = document.getElementById('staminaFill');

        this.gameOverEl = document.getElementById('gameOver');
        this.pauseMenuEl = document.getElementById('pauseMenu');
        this.instructionsEl = document.getElementById('instructions');
        this.loadingEl = document.getElementById('loading');

        this.finalScoreEl = document.getElementById('finalScore');
        this.finalWaveEl = document.getElementById('finalWave');
        this.enemiesKilledEl = document.getElementById('enemiesKilled');
        this.saveButton = document.getElementById('saveScoreButton');
    }

    hideLoading() {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
    }

    updateScore(score) {
        if (this.scoreEl) this.scoreEl.textContent = score.toLocaleString();
    }

    updateWave(wave) {
        const waveEl = document.getElementById('wave');
        if (waveEl) waveEl.innerHTML = `Wave: <span id="waveValue">${wave}</span>`;
    }

    updateAmmo(current, max, isReloading) {
        if (this.ammoEl) this.ammoEl.textContent = current;
        if (this.ammoMaxEl) this.ammoMaxEl.textContent = `/ ${max}`;
        if (this.reloadEl) this.reloadEl.textContent = isReloading ? 'Reloading...' : '';
    }

    updateDanger(distance) {
        if (!this.dangerFill) return;

        if (!isFinite(distance)) {
            this.dangerFill.style.width = '0%';
            this.dangerFill.style.background = 'linear-gradient(90deg, #00ffa3, #ffdd00, #ff0066)';
            return;
        }

        const maxDistance = 35;
        const danger = Math.min(1, Math.max(0, 1 - distance / maxDistance));
        this.dangerFill.style.width = `${danger * 100}%`;

        if (danger > 0.75) {
            this.dangerFill.style.background = '#ff2a6d';
        } else if (danger > 0.4) {
            this.dangerFill.style.background = '#ffb347';
        } else {
            this.dangerFill.style.background = '#00ffa3';
        }
    }

    updateStamina(current, max) {
        if (!this.staminaFill) return;
        const percent = (current / max) * 100;
        this.staminaFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }

    showGameOver(score, wave, killed) {
        if (this.gameOverEl) {
            this.gameOverEl.style.display = 'block';
            if (this.finalScoreEl) this.finalScoreEl.textContent = score.toLocaleString();
            if (this.finalWaveEl) this.finalWaveEl.textContent = wave;
            if (this.enemiesKilledEl) this.enemiesKilledEl.textContent = killed;
        }
        document.body.classList.remove('cursor-hidden');
        document.body.classList.add('game-over-cursor');
    }

    hideGameOver() {
        if (this.gameOverEl) this.gameOverEl.style.display = 'none';
        if (this.saveButton) {
            this.saveButton.disabled = false;
            this.saveButton.textContent = 'Save Score';
        }
        document.body.classList.remove('game-over-cursor');
    }

    showPauseMenu() {
        if (this.pauseMenuEl) this.pauseMenuEl.style.display = 'block';
        document.body.classList.remove('cursor-hidden');
    }

    hidePauseMenu() {
        if (this.pauseMenuEl) this.pauseMenuEl.style.display = 'none';
    }

    setInstructionsOpacity(opacity) {
        if (this.instructionsEl) this.instructionsEl.style.opacity = opacity;
    }

    toggleCursor(visible) {
        if (visible) {
            document.body.classList.remove('cursor-hidden');
        } else {
            document.body.classList.add('cursor-hidden');
        }
    }
}
