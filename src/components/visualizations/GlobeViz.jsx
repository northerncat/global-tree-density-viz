import React, {
    useEffect
} from 'react';

import * as THREE from 'three';

import * as GeoTIFF from 'geotiff';

import OrbitControls from '../../three-examples/OrbitControls';


function GlobeViz() {

    function sphericalCoordsToVector3(radius, phi, theta) {
        return new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            -Math.sin(theta),
            Math.cos(phi) * Math.cos(theta)
        ).multiplyScalar(radius);
    }

    function getGeoTiffBbox(image) {
        const bbox = image.getBoundingBox();
        const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bbox;
        return { minLongitude, minLatitude, maxLongitude, maxLatitude };
    }

    function loadLights(scene) {
        const pointLight = new THREE.PointLight(0x404040, 1, 100);
        pointLight.position.set(0, 15, 0);
        const pointLight2 = new THREE.PointLight(0x404040, 1, 100);
        pointLight2.position.set(0, -15, 0);

        scene.add(pointLight);
        scene.add(pointLight2);
        scene.add(new THREE.AmbientLight(0x808080));
    }

    function addOceanSphere(scene) {
        const oceanMaterial = new THREE.MeshPhongMaterial({
            color: 0x1E90FF,
        });
        const oceanSphereGeometry = new THREE.SphereGeometry(6, 360, 180);
        const oceanSphere = new THREE.Mesh(oceanSphereGeometry, oceanMaterial);
        scene.add(oceanSphere);
    }

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(0x000000));
        const orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.minDistance = 9.0;
        orbitControls.maxDistance = 20.0;
        orbitControls.addEventListener('change', () => renderer.render(scene, camera));
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        addOceanSphere(scene);
        loadLights(scene);

        camera.position.z = 20;
        renderer.render(scene, camera);

        // === THREE.JS CODE START ===
        GeoTIFF.fromUrl('data/Crowther_Nature_Biome_Revision_01_WGS84_GeoTiff_downsampled.tif')
            .then(tiff => tiff.getImage())
            .then(image => {
                const width = image.getWidth();
                const height = image.getHeight();
                const { minLongitude, minLatitude, maxLongitude, maxLatitude } = getGeoTiffBbox(image);

                const rasterLongitudeFactor = (maxLongitude - minLongitude) / width;
                const rasterLatitudeFactor = (maxLatitude - minLatitude) / height;
                let maxVal = 0;

                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        groundRadius: { value: 6.0 },
                        groundColor: new THREE.Uniform(new THREE.Color(0x6B8E23)),
                        skyColor: new THREE.Uniform(new THREE.Color(0x00ff00)),
                    },
                    vertexShader: `
                        varying vec3 globalPosition;
                        void main() {
                          globalPosition = position;
                          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                        }
                    `,
                    fragmentShader: `
                        varying vec3 globalPosition;
                        uniform float groundRadius;
                        uniform vec3 groundColor;
                        uniform vec3 skyColor;

                        void main() {
                            float distToOrigin = distance(globalPosition, vec3(0, 0, 0));
                            gl_FragColor = vec4(mix(groundColor, skyColor, distToOrigin - groundRadius), 1.0);
                        }
                    `,
                });

                image.readRasters().then(raster => {

                    const allBlocksGeometry = new THREE.BufferGeometry();
                    const allBlockVertices = [];
                    scene.add(new THREE.Mesh(allBlocksGeometry, material));

                    const step = 3;

                    for (let c = 0; c < width; c += step) {
                        for (let r = 0; r < height; r += step) {
                            const originalValue = raster[0][r * width + c];
                            if (isNaN(originalValue) || originalValue < 0) continue;
                            if (originalValue > maxVal) {
                                maxVal = originalValue;
                            }
                            const normalizedValue = Math.sqrt(originalValue) / 500;

                            const longitude = c * rasterLongitudeFactor + minLongitude;
                            const nextLongitude = (c + step) * rasterLongitudeFactor + minLongitude;
                            const latitude = r * rasterLatitudeFactor + minLatitude;
                            const nextLatitude = (r + step) * rasterLatitudeFactor + minLatitude;

                            const phi = longitude * Math.PI / 180.0;
                            const theta = latitude * Math.PI / 180.0;
                            const maxPhi = nextLongitude * Math.PI / 180.0;
                            const maxTheta = nextLatitude * Math.PI / 180.0;

                            const coords = [
                                sphericalCoordsToVector3(6, phi, theta),
                                sphericalCoordsToVector3(6, phi, maxTheta),
                                sphericalCoordsToVector3(6, maxPhi, theta),
                                sphericalCoordsToVector3(6, maxPhi, maxTheta),
                                sphericalCoordsToVector3(6 + normalizedValue, phi, theta),
                                sphericalCoordsToVector3(6 + normalizedValue, phi, maxTheta),
                                sphericalCoordsToVector3(6 + normalizedValue, maxPhi, theta),
                                sphericalCoordsToVector3(6 + normalizedValue, maxPhi, maxTheta),
                            ];
                            const indices = [
                                0, 1, 2, 2, 1, 3, 0, 2, 4, 4, 2, 6, 2, 3, 6, 6, 3, 7, 3, 1, 7, 7, 1, 5, 1, 0, 5, 5, 0, 4, 4, 5, 6, 6, 5, 7
                            ];
                            indices.forEach(index => {
                                const arr = coords[index].toArray();
                                allBlockVertices.push(arr[0]);
                                allBlockVertices.push(arr[1]);
                                allBlockVertices.push(arr[2]);
                            });
                        }
                    }

                    allBlocksGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allBlockVertices), 3));
                    renderer.render(scene, camera);

                    console.log('Done! Max is', maxVal);
                });
            });

    });

    return (
        <div
            className = "globe-viz"
        />
    );
}

export default GlobeViz;
