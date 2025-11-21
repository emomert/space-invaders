import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUps = [];
        this.lastSpawnTime = 0;
        this.spawnRate = 15000; // Spawn every 15 seconds roughly

        // Shield Geometry
        this.shieldGeometry = new THREE.IcosahedronGeometry(0.5, 0);
        this.shieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x0088aa,
            emissiveIntensity: 0.5,
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });
    }

    spawn(time) {
        if (time - this.lastSpawnTime < this.spawnRate) return;

        // Cap max powerups
        if (this.powerUps.length >= 3) return;

        this.lastSpawnTime = time;

        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 30; // Closer than enemies usually
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        const mesh = new THREE.Mesh(this.shieldGeometry, this.shieldMaterial.clone());
        mesh.position.set(x, 1.5, z);

        // Add a point light to make it glow
        const light = new THREE.PointLight(0x00ffff, 1, 5);
        light.position.set(0, 0, 0);
        mesh.add(light);

        this.scene.add(mesh);

        this.powerUps.push({
            mesh: mesh,
            type: 'shield',
            rotationSpeed: 2 + Math.random(),
            spawnTime: time
        });
    }

    update(delta, playerPosition, playerHasShield) {
        const now = performance.now();
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];

            // Check duration (10 seconds)
            if (now - p.spawnTime > 10000) {
                this.removePowerUp(i);
                continue;
            }

            // Rotate
            p.mesh.rotation.y += delta * p.rotationSpeed;
            p.mesh.rotation.x += delta * 0.5;

            // Bob
            p.mesh.position.y = 1.5 + Math.sin(now * 0.003) * 0.3;

            // Check Collision
            const dist = p.mesh.position.distanceTo(playerPosition);
            if (dist < 2.0) {
                if (!playerHasShield) {
                    // Collect
                    this.removePowerUp(i);
                    return p.type;
                }
                // If player has shield, do nothing (don't collect)
            }
        }
        return null;
    }

    removePowerUp(index) {
        const p = this.powerUps[index];
        // Ensure light is removed (it's a child of mesh, so removing mesh should work, but let's be safe)
        if (p.mesh.children.length > 0) {
            p.mesh.remove(p.mesh.children[0]);
        }
        this.scene.remove(p.mesh);

        // Dispose material to be clean
        if (p.mesh.material) p.mesh.material.dispose();

        this.powerUps.splice(index, 1);
    }

    reset() {
        for (const p of this.powerUps) {
            this.scene.remove(p.mesh);
        }
        this.powerUps = [];
        this.lastSpawnTime = performance.now();
    }
}
