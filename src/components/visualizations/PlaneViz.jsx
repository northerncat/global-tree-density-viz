import React, {
    useEffect
} from 'react';

import * as THREE from 'three';

import * as GeoTIFF from 'geotiff';

function PlaneViz() {
    useEffect(() => {
        // === THREE.JS CODE START ===
        GeoTIFF.fromUrl('data/Crowther_Nature_Biome_Revision_01_WGS84_GeoTiff_downsampled.tif')
            .then(tiff => tiff.getImage())
            .then(image => {
                const width = image.getWidth();
                const height = image.getHeight();
                // const tileWidth = image.getTileWidth();
                // const tileHeight = image.getTileHeight();
                // const samplesPerPixel = image.getSamplesPerPixel();
                // const origin = image.getOrigin();
                // const reslution = image.getResolution();
                // const bbox = image.getBoundingBox();
                // console.log(width, height, tileWidth, tileHeight, samplesPerPixel, origin, resolution, bbox);
                // image.readRasters().then(raster => { console.log(raster); });
                // console.log(image.readRasters());


                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer();
                const orbitController = new OrbitControls(camera, renderer.domElement);
                orbitController.addEventListener('change', () => renderer.render(scene, camera));
                renderer.setSize(window.innerWidth, window.innerHeight);
                document.body.appendChild(renderer.domElement);

                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    wireframe: false,
                    opacity: 0.2,
                    transparent: true
                });

                const step = 5;
                const geometry = new THREE.PlaneBufferGeometry(width / 400.0, height / 400.0, width / step - 1, height / step - 1);
                const plane = new THREE.Mesh(geometry, material);
                scene.add(plane);
                camera.position.z = 5;

                let maxVal = 0;
                image.readRasters().then(raster => {
                    const planeVertices = geometry.attributes.position.array;
                    for (let c = 0; c < width; c += step) {
                        for (let r = 0; r < height; r += step) {
                            const originalValue = raster[0][r * width + c];
                            if (isNaN(originalValue) || originalValue < 0) continue;
                            const normalizedValue = Math.sqrt(originalValue) / 1000;
                            if (originalValue > maxVal) {
                                maxVal = originalValue;
                            }
                            planeVertices[(c / step + r / step / step * width) * 3 + 2] = normalizedValue;
                        }
                    }
                    console.log('Done! Max is', maxVal);
                    renderer.render(scene, camera);
                });
            });

    });

    return (
        <div
            className = "plane-viz"
        />
    );
}

export default PlaneViz;
