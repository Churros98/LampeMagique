<script setup lang="ts">
import * as THREE from 'three';
import { objectPick, usePointer } from '@vueuse/core'
import { useBroadcastChannel } from '@vueuse/core';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Ref } from 'vue';

// Prépare le système de message vers le parent.
const {
  data,
} = useBroadcastChannel<{ x: number, y: number, z: number}, void>({ name: '3D' })

// Référence
const canvas : Ref<HTMLCanvasElement | undefined> = ref(undefined);

// Gestion de la souris.
const { x, y, pressure } = usePointer({
    target: canvas
});

const ratio = computed(() => { return canvas.value ? (canvas.value.clientWidth / canvas.value.clientHeight) : 1 })

// Préparation des éléments de ThreeJS.
const loader = new FBXLoader();
const scene = new THREE.Scene();
let renderer : THREE.WebGLRenderer | undefined = undefined;
let controleOrbite : OrbitControls | undefined = undefined;

// Chargement des modèles
const lampe = await loader.loadAsync("lampe.fbx");

console.log(lampe);

const [ support, bras1, bras2, cone, brashorizontal ] = lampe.children;

// Préparation des groupes et point spécifique pour la lampe en fonction des moteurs.
const groupe_M1 = new THREE.Group();
const groupe_M2 = new THREE.Group();
const groupe_M3 = new THREE.Group();
const groupe_M4 = new THREE.Group();
const groupe_Lampe = new THREE.Group();

groupe_M4.add(cone);
groupe_M3.add(bras2, groupe_M4);
groupe_M2.add(bras1, groupe_M3);
groupe_M1.add(brashorizontal, groupe_M2);
groupe_Lampe.add(support, groupe_M1);

const axesHelper = new THREE.AxesHelper( 100 );
axesHelper.position.set(groupe_M4.position.x, groupe_M4.position.y, groupe_M4.position.z);
scene.add( axesHelper );

// Préparation de la caméra.
const camera = new THREE.PerspectiveCamera( 75, ratio.value, 100, 5000 );
camera.position.set(0, 0, 1500);
camera.rotateY(- Math.PI / 4);
camera.rotateZ(- Math.PI / 4);
scene.add(camera);

// Préparation des interactions.
const pointeur = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
let objetVise : THREE.Intersection | undefined = undefined;
let objetClique : THREE.Intersection | undefined = undefined;

// Ajout de la lumière
const color = 0xFFFFFF;
const intensity = 5;
const light = new THREE.AmbientLight(color, intensity);
scene.add(light);

// Ajout de la grille
const gridHelper = new THREE.GridHelper( 20, 20 );
gridHelper.scale.set(100, 100, 100);
scene.add( gridHelper );

// Paramètrage de la scène
scene.background = new THREE.Color('#1F2640');

// Affichage de la lampe
groupe_Lampe.rotateX(-Math.PI / 2);
groupe_Lampe.position.set(0, -50, 0);
scene.add(groupe_Lampe);

// Mise à jour / Rendu
function animation() {
    // Récupére l'objet le plus proche
    raycaster.setFromCamera(pointeur, camera);
    const intersections = raycaster.intersectObjects( scene.children );
    objetVise = intersections.length ? intersections[0] : undefined

    if (objetClique) {
        console.log(data.value.z);
        const x = objetClique.object.position.x + data.value.x;
        const y = objetClique.object.position.y + data.value.y;
        const z = objetClique.object.position.z + data.value.z;

        axesHelper.position.set(x, y, z);
    }

    // Permet de naviguer dans la scene
    controleOrbite?.update();

    // Rendu de l'image
    renderer?.render(scene, camera);
}

// Lorsque le canvas est disponible, activer le rendu.
watch(canvas, () => {
    if (!canvas.value) return;

    renderer = new THREE.WebGLRenderer({
        canvas: canvas.value
    });

    renderer?.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false);
    controleOrbite = new OrbitControls( camera, renderer.domElement );

    renderer.setAnimationLoop(animation);
});

// Mise à jour du pointeur "2D" via les mouvements de souris
function mouvement_pointeur() {
    if (!canvas.value) return;
	pointeur.x = (x.value / canvas.value.clientWidth ) * 2 - 1;
	pointeur.y = - ( y.value / canvas.value.clientHeight ) * 2 + 1;
}

watch(x, mouvement_pointeur);
watch(y, mouvement_pointeur);

// Vérifie sur quel objet l'utilisateur a cliqué.
watch(pressure, () => {
    if (pressure.value <= 0) return;

    // Mettre ici les interactions
    objetClique = objetVise
})

// Mise à jour du canvas à la modification de la taille de la fenêtre.
watch(ratio, () => {
    if (canvas.value) renderer?.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false);

    camera.aspect = ratio.value;
    camera.updateProjectionMatrix();
})
</script>

<template>
    <canvas ref="canvas"/>
</template>

<style>
canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>