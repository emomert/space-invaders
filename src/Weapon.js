import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Weapon {
    constructor(camera) {
        this.camera = camera;
        this.weaponHolder = new THREE.Group();
        this.weaponHolder.position.set(0, -0.18, -0.4);
        this.camera.add(this.weaponHolder);

        this.ammo = 15;
        this.maxAmmo = 15;
        this.isReloading = false;
        this.reloadDuration = 1500;
        this.reloadTimeout = null;

        this.loadWeaponModel();
    }

    loadWeaponModel() {
        // Clear existing
        while (this.weaponHolder.children.length > 0) {
            this.weaponHolder.remove(this.weaponHolder.children[0]);
        }

        const weaponGroup = new THREE.Group();

        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x050510
        });
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0x303050,
            metalness: 0.5,
            roughness: 0.4
        });
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.9
        });
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.6,
            transparent: true
        });
        const ventMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.9,
            roughness: 0.5
        });

        // Main Body (Sleek, elongated)
        const bodyGeo = new THREE.BoxGeometry(0.25, 0.35, 1.4);
        const body = new THREE.Mesh(bodyGeo, bodyMaterial);
        body.position.set(0.4, -0.25, -0.6);
        weaponGroup.add(body);

        // Top Barrel Shroud
        const shroudGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
        const shroud = new THREE.Mesh(shroudGeo, accentMaterial);
        shroud.rotation.x = Math.PI / 2;
        shroud.rotation.y = Math.PI / 8; // Rotate to have flat top
        shroud.position.set(0.4, -0.1, -0.8);
        weaponGroup.add(shroud);

        // Energy Core (Glowing center)
        const coreGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16);
        const core = new THREE.Mesh(coreGeo, glowMaterial);
        core.rotation.x = Math.PI / 2;
        core.position.set(0.4, -0.1, -0.8);
        weaponGroup.add(core);

        // Cooling Vents (Side panels)
        const ventGeo = new THREE.BoxGeometry(0.02, 0.1, 0.6);
        const leftVent = new THREE.Mesh(ventGeo, ventMaterial);
        leftVent.position.set(0.53, -0.25, -0.6);
        weaponGroup.add(leftVent);

        const rightVent = leftVent.clone();
        rightVent.position.set(0.27, -0.25, -0.6);
        weaponGroup.add(rightVent);

        // Stock (Angled)
        const stockGeo = new THREE.BoxGeometry(0.2, 0.25, 0.5);
        const stock = new THREE.Mesh(stockGeo, bodyMaterial);
        stock.position.set(0.4, -0.3, 0.1);
        stock.rotation.x = -0.2;
        weaponGroup.add(stock);

        // Grip
        const gripGeo = new THREE.BoxGeometry(0.1, 0.3, 0.15);
        const grip = new THREE.Mesh(gripGeo, accentMaterial);
        grip.position.set(0.4, -0.45, -0.1);
        grip.rotation.x = 0.3;
        weaponGroup.add(grip);

        // Trigger Guard
        const guardGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI);
        const guard = new THREE.Mesh(guardGeo, bodyMaterial);
        guard.rotation.y = Math.PI / 2;
        guard.position.set(0.4, -0.4, -0.1);
        weaponGroup.add(guard);

        // Holographic Sight
        const sightBaseGeo = new THREE.BoxGeometry(0.15, 0.05, 0.2);
        const sightBase = new THREE.Mesh(sightBaseGeo, accentMaterial);
        sightBase.position.set(0.4, 0.08, -0.4);
        weaponGroup.add(sightBase);

        const holoLensGeo = new THREE.PlaneGeometry(0.12, 0.12);
        const holoLens = new THREE.Mesh(holoLensGeo, glowMaterial);
        holoLens.position.set(0.4, 0.16, -0.4);
        holoLens.rotation.y = Math.PI; // Face player
        weaponGroup.add(holoLens);

        const lensFrameGeo = new THREE.BoxGeometry(0.16, 0.15, 0.02);
        // Create a frame by subtracting? No, just use thin boxes for frame
        const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.02), accentMaterial);
        leftFrame.position.set(0.47, 0.16, -0.4);
        weaponGroup.add(leftFrame);
        const rightFrame = leftFrame.clone();
        rightFrame.position.set(0.33, 0.16, -0.4);
        weaponGroup.add(rightFrame);

        // Muzzle Emitter
        const muzzleGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.15, 8);
        const muzzle = new THREE.Mesh(muzzleGeo, bodyMaterial);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0.4, -0.1, -1.45);
        weaponGroup.add(muzzle);

        // Under-barrel Battery/Capacitor
        const capGeo = new THREE.BoxGeometry(0.15, 0.1, 0.4);
        const capacitor = new THREE.Mesh(capGeo, accentMaterial);
        capacitor.position.set(0.4, -0.35, -1.0);
        weaponGroup.add(capacitor);

        // Cables
        const cableGeo = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
                new THREE.Vector3(0.4, -0.35, -0.8),
                new THREE.Vector3(0.45, -0.3, -0.5),
                new THREE.Vector3(0.4, -0.25, -0.3)
            ]),
            20, 0.015, 8, false
        );
        const cable = new THREE.Mesh(cableGeo, glowMaterial);
        weaponGroup.add(cable);

        weaponGroup.position.set(0, 0, 0);
        this.weaponHolder.add(weaponGroup);
    }

    triggerMuzzleFlash() {
        const flash = document.createElement('div');
        flash.className = 'muzzle-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 120);
    }

    canShoot() {
        return !this.isReloading && this.ammo > 0;
    }

    shoot() {
        if (!this.canShoot()) return false;
        this.ammo--;
        this.triggerMuzzleFlash();
        if (this.ammo === 0) {
            this.reload();
        }
        return true;
    }

    reload() {
        if (this.isReloading || this.ammo === this.maxAmmo) return;
        this.isReloading = true;

        this.reloadTimeout = setTimeout(() => {
            this.ammo = this.maxAmmo;
            this.isReloading = false;
            // Notify UI via callback or event if needed, but for now we'll let Game loop handle UI updates
        }, this.reloadDuration);
    }

    cancelReload() {
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
            this.reloadTimeout = null;
        }
        this.isReloading = false;
    }

    reset() {
        this.cancelReload();
        this.ammo = this.maxAmmo;
    }
}
