export function disposeMaterial(material) {
    if (Array.isArray(material)) {
        material.forEach(mat => {
            if (mat && typeof mat.dispose === 'function') {
                mat.dispose();
            }
        });
    } else if (material && typeof material.dispose === 'function') {
        material.dispose();
    }
}

export function disposeMesh(mesh, scene) {
    if (!mesh) return;
    if (scene) scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    disposeMaterial(mesh.material);
}
