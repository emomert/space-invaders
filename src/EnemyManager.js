import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.pool = [];
        this.maxPoolSize = 50;

        // Shared Geometries and Materials for optimization
        this.geometry = new THREE.SphereGeometry(0.8, 16, 16);

        this.materials = {
            fast: new THREE.MeshStandardMaterial({
                color: 0xff3535,
                emissive: 0x2a0303,
                metalness: 0.15,
                roughness: 0.45
            }),
            bobbing: new THREE.MeshStandardMaterial({
                color: 0x35ff89,
                emissive: 0x04301a,
                metalness: 0.15,
                roughness: 0.45
            }),
            normal: new THREE.MeshStandardMaterial({
                color: 0x8f8f8f, // Base color, will be tinted per instance if needed, but for pooling we might stick to fixed types or clone materials if color variation is strict.
                emissive: 0x0a1b2f,
                metalness: 0.15,
                roughness: 0.45
            })
        };

        // Pre-populate pool
        for (let i = 0; i < 20; i++) {
            this.pool.push(this.createEnemyMesh());
        }

        this.lastSpawnTime = 0;
        this.spawnRate = 1500;
        this.enemySpeed = 0.045;
        this.wave = 1;

        this.tmpVec = new THREE.Vector3();
    }

    createEnemyMesh() {
        const mesh = new THREE.Mesh(this.geometry, this.materials.normal);
        mesh.castShadow = true;
        mesh.visible = false;
        this.scene.add(mesh);
        return mesh;
    }

    getFromPool() {
        if (this.pool.length > 0) {
            const mesh = this.pool.pop();
            mesh.visible = true;
            return mesh;
        }
        return this.createEnemyMesh(); // Expand pool if needed
    }

    returnToPool(enemy) {
        if (enemy.mesh) {
            enemy.mesh.visible = false;
            // Reset material to normal just in case, though we set it on spawn
            if (this.pool.length < this.maxPoolSize) {
                this.pool.push(enemy.mesh);
            } else {
                // If pool is full, actually dispose (rare)
                this.scene.remove(enemy.mesh);
            }
        }
    }

    spawn(time) {
        if (time - this.lastSpawnTime < this.spawnRate) return;
        if (this.enemies.length > 25) return;

        this.lastSpawnTime = time;

        const angle = Math.random() * Math.PI * 2;
        const distance = 35 + Math.random() * 15;
        const height = 1 + Math.random() * 2;

        const spawnFast = Math.random() < 0.18;
        const spawnBobbing = !spawnFast && Math.random() < 0.25;

        const mesh = this.getFromPool();

        // Set properties based on type
        if (spawnFast) {
            mesh.material = this.materials.fast;
        } else if (spawnBobbing) {
            mesh.material = this.materials.bobbing;
        } else {
            // For normal enemies, the original code had random HSL colors.
            // To keep performance high, we can either use a single material or clone.
            // Let's clone for normal to keep variety if desired, or just use a standard one.
            // For now, let's use the standard normal material to save draw calls/memory.
            mesh.material = this.materials.normal;
            // If we really want random colors, we'd need to clone material, which defeats some pooling purpose unless we pool materials too.
            // Let's stick to 3 types for now for better performance.
        }

        mesh.position.set(Math.cos(angle) * distance, height, Math.sin(angle) * distance);

        const enemy = {
            mesh: mesh,
            speed: (spawnFast ? this.enemySpeed * 1.9 : this.enemySpeed) + Math.random() * 0.01,
            health: 1,
            radius: 0.95,
            isFast: spawnFast,
            isBobbing: spawnBobbing,
            baseHeight: spawnBobbing ? Math.max(height, 1.6) : height,
            bobOffset: Math.random() * Math.PI * 2,
            bobAmplitude: 0.6 + Math.random() * 0.35,
            bobSpeed: 1.2 + Math.random() * 0.5
        };

        this.enemies.push(enemy);
    }

    update(delta, playerPosition, time) {
        if (this.enemies.length === 0) return Infinity;

        let closest = Infinity;
        const moveFactor = delta * 60;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Movement
            if (typeof enemy.baseHeight !== 'number') {
                enemy.baseHeight = Math.max(enemy.mesh.position.y, 1.6);
            }

            this.tmpVec.set(
                playerPosition.x - enemy.mesh.position.x,
                0,
                playerPosition.z - enemy.mesh.position.z
            );

            const horizontalDistance = this.tmpVec.length();
            if (horizontalDistance > 0.001) {
                this.tmpVec.normalize();
                enemy.mesh.position.addScaledVector(this.tmpVec, enemy.speed * moveFactor);
            }

            // Bobbing
            if (enemy.isBobbing) {
                const bob = Math.sin(time * enemy.bobSpeed + enemy.bobOffset) * enemy.bobAmplitude;
                enemy.mesh.position.y = Math.max(1.3, enemy.baseHeight + bob);
            } else {
                enemy.mesh.position.y = enemy.baseHeight;
            }

            enemy.mesh.lookAt(playerPosition);

            const dist = enemy.mesh.position.distanceTo(playerPosition);
            if (dist < closest) closest = dist;
        }

        return closest;
    }

    checkCollisions(rayOrigin, rayDirection) {
        let best = null;
        const enemyCenter = new THREE.Vector3();
        const closestPoint = new THREE.Vector3();
        const tmpVec = new THREE.Vector3();

        this.enemies.forEach(enemy => {
            enemyCenter.copy(enemy.mesh.position);
            tmpVec.copy(enemyCenter).sub(rayOrigin);
            const projection = tmpVec.dot(rayDirection);
            if (projection <= 0) return;

            closestPoint.copy(rayOrigin).addScaledVector(rayDirection, projection);
            const distSq = enemyCenter.distanceToSquared(closestPoint);
            const radius = enemy.radius || 0.9;

            if (distSq <= radius * radius) {
                const distanceFromPlayer = Math.sqrt(enemyCenter.distanceToSquared(rayOrigin));
                if (!best || distanceFromPlayer < best.distanceFromPlayer) {
                    best = {
                        enemy,
                        point: closestPoint.clone(),
                        distanceFromPlayer
                    };
                }
            }
        });
        return best;
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.enemies.splice(index, 1);
            this.returnToPool(enemy);
        }
    }

    reset() {
        // Return all active enemies to pool
        for (const enemy of this.enemies) {
            this.returnToPool(enemy);
        }
        this.enemies = [];
        this.wave = 1;
        this.spawnRate = 1500;
        this.enemySpeed = 0.045;
    }

    updateWave(wave) {
        this.wave = wave;
        this.spawnRate = Math.max(350, 1500 - (this.wave - 1) * 160);
        this.enemySpeed = 0.045 + (this.wave - 1) * 0.012;
    }
}
