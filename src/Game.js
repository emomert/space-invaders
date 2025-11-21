import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Player } from './Player.js';
import { Weapon } from './Weapon.js';
import { EnemyManager } from './EnemyManager.js';
import { UIManager } from './UIManager.js';
import { AudioManager } from './AudioManager.js';
import { PowerUpManager } from './PowerUpManager.js';
import { disposeMaterial } from './Utils.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.player = null;
        this.weapon = null;
        this.enemyManager = null;
        this.uiManager = new UIManager();
        this.audioManager = new AudioManager();
        // PowerUpManager instantiated in init

        this.particles = [];

        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;

        this.gameRunning = false;
        this.isPaused = false;
        this.isGameOver = false;

        this.init();
    }

    init() {
        this.uiManager.hideLoading();

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x04060d, 15, 90);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x04060d);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameCanvas').appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // Environment
        this.setupEnvironment();

        // Components
        this.player = new Player(this.scene, this.camera, this.renderer.domElement);
        this.weapon = new Weapon(this.camera);
        this.enemyManager = new EnemyManager(this.scene);
        this.powerUpManager = new PowerUpManager(this.scene);

        // Events
        window.addEventListener('resize', () => this.handleResize());
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());

        // UI Init
        this.uiManager.updateAmmo(this.weapon.ammo, this.weapon.maxAmmo, false);
        this.uiManager.updateScore(0);
        this.uiManager.updateWave(1);

        // Start Loop
        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x0f1a2d, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x66e0ff, 0.8);
        directionalLight.position.set(0, 40, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 120;
        directionalLight.shadow.camera.left = -80;
        directionalLight.shadow.camera.right = 80;
        directionalLight.shadow.camera.top = 80;
        directionalLight.shadow.camera.bottom = -80;
        this.scene.add(directionalLight);
        this.scene.add(directionalLight.target);

        const pointLight1 = new THREE.PointLight(0x0ff5ff, 0.5, 40);
        pointLight1.position.set(10, 5, 10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x0ff5ff, 0.5, 40);
        pointLight2.position.set(-10, 5, -10);
        this.scene.add(pointLight2);
    }

    setupEnvironment() {
        const floorGeometry = new THREE.CircleGeometry(50, 64);
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x0f1729,
            emissive: 0x05070c,
            shininess: 40,
            specular: 0x111111
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        this.createStarfield();
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 3000;
        const posArray = new Float32Array(starsCount * 3);
        const colorArray = new Float32Array(starsCount * 3);

        for (let i = 0; i < starsCount * 3; i += 3) {
            // Random position in a sphere
            const r = 200 + Math.random() * 400; // Distance from center
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            posArray[i] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i + 2] = r * Math.cos(phi);

            // Star colors (White, Blueish, Goldish)
            const colorType = Math.random();
            if (colorType > 0.9) { // Gold
                colorArray[i] = 1;
                colorArray[i + 1] = 0.8;
                colorArray[i + 2] = 0.4;
            } else if (colorType > 0.7) { // Blue
                colorArray[i] = 0.5;
                colorArray[i + 1] = 0.7;
                colorArray[i + 2] = 1;
            } else { // White
                colorArray[i] = 1;
                colorArray[i + 1] = 1;
                colorArray[i + 2] = 1;
            }
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            fog: false
        });

        this.starfield = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.starfield);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleMouseDown(event) {
        if (event.button !== 0) return;
        if (event.target !== this.renderer.domElement) return;
        if (this.isGameOver) return;

        if (!this.player.isPointerLocked) {
            this.renderer.domElement.requestPointerLock();
            this.resumeGame();
            return;
        }

        this.attemptShoot();
    }

    handleKeyDown(event) {
        if (event.code === 'KeyR') {
            this.weapon.reload();
            this.uiManager.updateAmmo(this.weapon.ammo, this.weapon.maxAmmo, this.weapon.isReloading);
        } else if (event.code === 'Escape') {
            if (this.isPaused) this.resumeGame();
            else if (!this.isGameOver) this.pauseGame();
        } else if (event.code === 'KeyP') {
            if (this.isPaused) this.resumeGame();
            else this.pauseGame();
        } else if (event.code === 'Space') {
            if (this.isGameOver) this.restartGame();
        }
    }

    handlePointerLockChange() {
        const isLocked = document.pointerLockElement === this.renderer.domElement;
        this.player.isPointerLocked = isLocked;

        if (!isLocked && !this.isPaused && !this.isGameOver && this.gameRunning) {
            this.pauseGame();
        }

        if (isLocked) {
            this.audioManager.startMusic();
        }
    }

    attemptShoot() {
        if (!this.gameRunning || this.isPaused || this.isGameOver) return;

        if (this.weapon.shoot()) {
            this.uiManager.updateAmmo(this.weapon.ammo, this.weapon.maxAmmo, this.weapon.isReloading);
            this.audioManager.playGunSound();

            // Raycast
            const rayDirection = new THREE.Vector3();
            this.camera.getWorldDirection(rayDirection);
            const hit = this.enemyManager.checkCollisions(this.player.getPosition(), rayDirection);

            if (hit) {
                this.handleEnemyHit(hit.enemy, hit.point, hit.distanceFromPlayer);
            }
        } else {
            this.uiManager.updateAmmo(this.weapon.ammo, this.weapon.maxAmmo, this.weapon.isReloading);
        }
    }

    handleEnemyHit(enemy, point, distance) {
        enemy.health -= 1;
        this.createImpactBurst(point);

        if (enemy.health <= 0) {
            this.enemyManager.removeEnemy(enemy);
            this.score += 100 + Math.floor(distance * 6);
            this.enemiesKilled++;
            this.uiManager.updateScore(this.score);

            // Wave Progression
            const targetWave = Math.floor(this.enemiesKilled / 8) + 1;
            if (targetWave > this.wave) {
                this.wave = targetWave;
                this.enemyManager.updateWave(this.wave);
                this.uiManager.updateWave(this.wave);
            }
        }
    }

    createImpactBurst(position) {
        const particleGeometry = new THREE.SphereGeometry(0.06, 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8a5c,
            transparent: true,
            opacity: 0.9
        });

        for (let i = 0; i < 10; i++) {
            const particle = new THREE.Mesh(particleGeometry.clone(), particleMaterial.clone());
            particle.position.copy(position);
            this.scene.add(particle);
            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
                ),
                life: 0.4,
                maxLife: 0.4
            });
        }
        particleGeometry.dispose();
        particleMaterial.dispose();
    }

    updateParticles(delta) {
        this.particles = this.particles.filter(particle => {
            particle.life -= delta;
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                disposeMaterial(particle.mesh.material);
                if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                return false;
            }
            particle.mesh.position.addScaledVector(particle.velocity, delta * 6);
            particle.mesh.material.opacity = Math.max(0, particle.life / particle.maxLife);
            return true;
        });
    }

    pauseGame() {
        if (this.isPaused || this.isGameOver) return;
        this.isPaused = true;
        this.gameRunning = false;
        this.uiManager.showPauseMenu();
        if (document.pointerLockElement) document.exitPointerLock();
    }

    resumeGame() {
        if (this.isGameOver) return;
        this.isPaused = false;
        this.gameRunning = true;
        this.uiManager.hidePauseMenu();
        this.uiManager.setInstructionsOpacity(0);
        this.enemyManager.lastSpawnTime = performance.now(); // Prevent instant spawn

        // Re-acquire pointer lock
        this.renderer.domElement.requestPointerLock();
        this.audioManager.resume();
    }

    restartGame() {
        this.weapon.reset();
        this.player.reset();
        this.enemyManager.reset();

        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.gameRunning = true;

        this.uiManager.hideGameOver();
        this.uiManager.hidePauseMenu();
        this.uiManager.updateScore(0);
        this.uiManager.updateWave(1);
        this.uiManager.updateAmmo(this.weapon.ammo, this.weapon.maxAmmo, false);
        this.uiManager.updateDanger(Infinity);
        this.uiManager.updateStamina(this.player.stamina, this.player.maxStamina);

        this.enemyManager.lastSpawnTime = performance.now();
        this.renderer.domElement.requestPointerLock();
        this.audioManager.startMusic();
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.gameRunning = false;
        this.weapon.cancelReload();
        if (document.pointerLockElement) document.exitPointerLock();
        this.uiManager.showGameOver(this.score, this.wave, this.enemiesKilled);
        this.uiManager.setupScoreSaving(this.score, this.wave, this.enemiesKilled);
    }

    playGunSound() {
        // Deprecated: Use audioManager
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.elapsedTime;

        // Game Logic
        if (this.gameRunning && !this.isPaused && !this.isGameOver) {
            // Rotate Starfield
            if (this.starfield) {
                this.starfield.rotation.y += delta * 0.02;
                this.starfield.rotation.x += delta * 0.005;
            }

            // Player
            const isRunning = this.player.update(delta);
            this.uiManager.updateStamina(this.player.stamina, this.player.maxStamina);

            // PowerUps
            this.powerUpManager.spawn(performance.now());
            const collectedType = this.powerUpManager.update(delta, this.player.getPosition(), this.player.hasShield);
            if (collectedType === 'shield') {
                this.player.activateShield();
                this.uiManager.updateShield(true);
            }

            // Enemies
            this.enemyManager.spawn(performance.now());
            const closestDist = this.enemyManager.update(delta, this.player.getPosition(), time);
            this.uiManager.updateDanger(closestDist);

            if (closestDist <= 1.5) {
                if (this.player.hasShield) {
                    // Consume shield
                    this.player.deactivateShield();
                    this.uiManager.updateShield(false);

                    // Find and remove the hitting enemy
                    const hittingEnemy = this.enemyManager.getClosestEnemy(this.player.getPosition());
                    if (hittingEnemy && hittingEnemy.mesh.position.distanceTo(this.player.getPosition()) <= 1.6) {
                        this.enemyManager.removeEnemy(hittingEnemy);
                        this.createImpactBurst(hittingEnemy.mesh.position);
                    }
                } else {
                    this.gameOver();
                }
            }

            // Weapon UI sync (reloading animation)
            if (this.weapon.isReloading) {
                this.uiManager.updateAmmo(this.weapon.ammo, this.weapon.maxAmmo, true);
            }
        }

        this.updateParticles(delta);
        this.renderer.render(this.scene, this.camera);
    }
}
