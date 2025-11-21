import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Player {
    constructor(scene, camera, domElement) {
        this.scene = scene;
        this.camera = camera;
        this.domElement = domElement;

        this.pitchObject = new THREE.Object3D();
        this.yawObject = new THREE.Object3D();

        this.pitchObject.add(camera);
        this.yawObject.add(this.pitchObject);
        this.yawObject.position.set(0, 2, 0);
        this.scene.add(this.yawObject);

        this.moveState = { forward: false, back: false, left: false, right: false, run: false };
        this.moveVector = new THREE.Vector3();
        this.worldMoveVector = new THREE.Vector3();

        this.baseMoveSpeed = 6;
        this.sprintMultiplier = 1.8;

        // Jumping & Gravity
        this.velocityY = 0;
        this.gravity = 30;
        this.jumpStrength = 12;
        this.canJump = false;
        this.playerHeight = 2; // Eye level

        this.maxStamina = 100;
        this.stamina = this.maxStamina;
        this.staminaDrainRate = 32;
        this.staminaRegenRate = 18;

        this.isPointerLocked = false;
        this.hasShield = false;

        this.setupEventListeners();
    }

    activateShield() {
        this.hasShield = true;
        // Visual effect could be added here, e.g. a HUD overlay or sound
    }

    deactivateShield() {
        this.hasShield = false;
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.domElement;
        });
    }

    handleMouseMove(event) {
        if (!this.isPointerLocked) return;
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        this.yawObject.rotation.y -= movementX * 0.0025;
        this.pitchObject.rotation.x -= movementY * 0.0025;
        const limit = Math.PI / 2 - 0.05;
        this.pitchObject.rotation.x = Math.max(-limit, Math.min(limit, this.pitchObject.rotation.x));
    }

    handleKeyDown(event) {
        if (this.isTextInputTarget(event.target)) return;
        switch (event.code) {
            case 'KeyW': this.moveState.forward = true; break;
            case 'KeyS': this.moveState.back = true; break;
            case 'KeyA': this.moveState.left = true; break;
            case 'KeyD': this.moveState.right = true; break;
            case 'Space':
                if (this.canJump) {
                    this.velocityY = this.jumpStrength;
                    this.canJump = false;
                }
                break;
            case 'ShiftLeft':
            case 'ShiftRight': this.moveState.run = true; break;
        }
    }

    handleKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveState.forward = false; break;
            case 'KeyS': this.moveState.back = false; break;
            case 'KeyA': this.moveState.left = false; break;
            case 'KeyD': this.moveState.right = false; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.moveState.run = false; break;
        }
    }

    isTextInputTarget(target) {
        if (!target) return false;
        const tag = target.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    }

    update(delta) {
        if (!this.isPointerLocked) return false;

        // Stamina Logic
        let isRunning = false;

        // Movement Logic
        if (this.moveState.forward || this.moveState.back || this.moveState.left || this.moveState.right) {
            this.moveVector.set(0, 0, 0);
            if (this.moveState.forward) this.moveVector.z -= 1;
            if (this.moveState.back) this.moveVector.z += 1;
            if (this.moveState.left) this.moveVector.x -= 1;
            if (this.moveState.right) this.moveVector.x += 1;

            if (this.moveVector.lengthSq() > 0) {
                this.moveVector.normalize();
                this.worldMoveVector.copy(this.moveVector);
                this.worldMoveVector.applyQuaternion(this.yawObject.quaternion);
                this.worldMoveVector.y = 0;

                if (this.worldMoveVector.lengthSq() > 0) {
                    this.worldMoveVector.normalize();

                    const wantsRun = this.moveState.run && this.stamina > 0.5;
                    const speed = wantsRun ? this.baseMoveSpeed * this.sprintMultiplier : this.baseMoveSpeed;
                    const distance = speed * delta;

                    this.yawObject.position.addScaledVector(this.worldMoveVector, distance);

                    // Boundary Check (Arena Radius 50)
                    const distanceFromCenter = Math.sqrt(this.yawObject.position.x ** 2 + this.yawObject.position.z ** 2);
                    if (distanceFromCenter > 49) {
                        const angle = Math.atan2(this.yawObject.position.z, this.yawObject.position.x);
                        this.yawObject.position.x = Math.cos(angle) * 49;
                        this.yawObject.position.z = Math.sin(angle) * 49;
                    }

                    isRunning = wantsRun;
                }
            }
        }

        // Gravity & Jumping
        this.velocityY -= this.gravity * delta;
        this.yawObject.position.y += this.velocityY * delta;

        // Floor Collision
        if (this.yawObject.position.y <= this.playerHeight) {
            this.yawObject.position.y = this.playerHeight;
            this.velocityY = 0;
            this.canJump = true;
        }

        // Update Stamina
        if (isRunning) {
            this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * delta);
            if (this.stamina <= 0) this.moveState.run = false;
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * delta);
        }

        return isRunning;
    }

    getPosition() {
        return this.yawObject.position;
    }

    reset() {
        this.yawObject.position.set(0, 2, 0);
        this.stamina = this.maxStamina;
        this.moveState.run = false;
    }
}
