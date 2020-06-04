import React, { useEffect, useState } from 'react';

import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

import * as GeoTIFF from 'geotiff';

import OrbitControls from '../../three-examples/OrbitControls';

import LoadingOverlay from 'react-loading-overlay';

const GLOBE_RADIUS = 6.0;

function GlobeViz() {
    let container;

    const [ isActive, setIsActive ] = useState(false);

    function sphericalCoordsToVector3(radius, phi, theta) {
        return new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(theta),
            Math.cos(phi) * Math.cos(theta)
        ).multiplyScalar(radius);
    }

    function getGeoTiffBbox(image) {
        const bbox = image.getBoundingBox();
        const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bbox;
        return { minLongitude, minLatitude, maxLongitude, maxLatitude };
    }

    function createOrbitControls(camera, domElement) {
        const orbitControls = new OrbitControls(camera, domElement);
        orbitControls.enablePan = false;
        orbitControls.minDistance = GLOBE_RADIUS * 1.2;
        orbitControls.maxDistance = GLOBE_RADIUS * 3;
        orbitControls.rotateSpeed = 0.4;
        return orbitControls;
    }

    function loadLights(scene) {
        const pointLight = new THREE.PointLight(0x404040, 1, 100);
        pointLight.position.set(0, GLOBE_RADIUS * 2.5, 0);
        const pointLight2 = new THREE.PointLight(0x404040, 1, 100);
        pointLight2.position.set(0, - GLOBE_RADIUS * 2.5, 0);

        scene.add(pointLight);
        scene.add(pointLight2);
        scene.add(new THREE.AmbientLight(0x808080));
    }

    function addOceanSphere(scene) {
        const oceanMaterial = new THREE.MeshPhongMaterial({
            color: 0x1E90FF,
        });
        const oceanSphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 360, 180);
        const oceanSphere = new THREE.Mesh(oceanSphereGeometry, oceanMaterial);
        scene.add(oceanSphere);
    }

    function addThreeGlobe(scene) {
        // globe image texture: https://commons.wikimedia.org/wiki/File:Earthmap1000x500.jpg
        // bump map: https://unpkg.com/three-globe@2.3.6/example/img/earth-topology.png
        const globe = new ThreeGlobe({ animateIn: false })
            .globeImageUrl('Earthmap1000x500.jpg')
            .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');
        globe.scale.set(GLOBE_RADIUS * 0.01, GLOBE_RADIUS * 0.01, GLOBE_RADIUS * 0.01);
        scene.add(globe);
        return globe;
    }

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = GLOBE_RADIUS * 3;

        const renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        const orbitControls = createOrbitControls(camera, renderer.domElement);
        orbitControls.addEventListener('change', () => renderer.render(scene, camera));

        const globe = addThreeGlobe(scene);

        let isPressed = false;
        function onMouseDown(event) {
            isPressed = true;
        }
        function onDocumentMouseMove(event) {
            var mouse = new THREE.Vector2();
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera( mouse, camera );
            var intersects = raycaster.intersectObjects( globe.children, true );

            if(intersects.length > 0 || isPressed) {
                document.body.style.cursor = "pointer";
            } else {
                document.body.style.cursor = "default";
            }
        }
        function onMouseUp(event) {
            isPressed = false;
        }
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onDocumentMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // addOceanSphere(scene);
        loadLights(scene);

        renderer.render(scene, camera);

        function getTreeDensityBlockMaterial() {
            return new THREE.ShaderMaterial({
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
        }

        function getBlockVertices(normalizedValue, minLat, minLong, maxLat, maxLong) {
            const vertices = [];
            const phi = minLong * Math.PI / 180.0;
            const theta = minLat * Math.PI / 180.0;
            const maxPhi = maxLong * Math.PI / 180.0;
            const maxTheta = maxLat * Math.PI / 180.0;

            const coords = [
                sphericalCoordsToVector3(GLOBE_RADIUS, phi, theta),
                sphericalCoordsToVector3(GLOBE_RADIUS, phi, maxTheta),
                sphericalCoordsToVector3(GLOBE_RADIUS, maxPhi, theta),
                sphericalCoordsToVector3(GLOBE_RADIUS, maxPhi, maxTheta),
                sphericalCoordsToVector3(GLOBE_RADIUS + normalizedValue, phi, theta),
                sphericalCoordsToVector3(GLOBE_RADIUS + normalizedValue, phi, maxTheta),
                sphericalCoordsToVector3(GLOBE_RADIUS + normalizedValue, maxPhi, theta),
                sphericalCoordsToVector3(GLOBE_RADIUS + normalizedValue, maxPhi, maxTheta),
            ];
            const indices = [
                0, 1, 2, 2, 1, 3, 0, 2, 4, 4, 2, 6, 2, 3, 6, 6, 3, 7, 3, 1, 7, 7, 1, 5, 1, 0, 5, 5, 0, 4, 4, 5, 6, 6, 5, 7
            ];
            indices.forEach(index => {
                const arr = coords[index].toArray();
                vertices.push(arr[0]);
                vertices.push(arr[1]);
                vertices.push(arr[2]);
            });
            return vertices;
        }

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

                const material = getTreeDensityBlockMaterial();

                image.readRasters().then(raster => {

                    const allBlocksGeometry = new THREE.BufferGeometry();
                    const allBlockVertices = [];
                    scene.add(new THREE.Mesh(allBlocksGeometry, material));

                    const step = 6;

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
                            const latitude = maxLatitude - r * rasterLatitudeFactor;
                            const nextLatitude = maxLatitude - (r + step) * rasterLatitudeFactor;

                            const blockVertices = getBlockVertices(normalizedValue, latitude, longitude, nextLatitude, nextLongitude);
                            blockVertices.forEach(coord => {
                                allBlockVertices.push(coord);
                            });
                        }
                    }

                    setIsActive(true);

                    allBlocksGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allBlockVertices), 3));
                    renderer.render(scene, camera);

                    console.log('Done! Max is', maxVal);
                });
            });

    });

    return (
        <LoadingOverlay
            active={!isActive}
            spinner
            text='Loading Data...'
        >
            <span
                className = "globe-viz"
                ref={element => container = element}
            />
        </LoadingOverlay>
    );
}

export default GlobeViz;
