<script setup lang="ts">
import * as THREE from 'three';
import { usePointer } from '@vueuse/core'
import { chargerModeles } from '../utils/modeles'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Référence
const canvas : Ref<HTMLCanvasElement | undefined> = ref(undefined);

// Gestion de la souris.
const { x, y, pressure } = usePointer({
    target: canvas
});

const ratio = computed(() => { return canvas.value ? (canvas.value.clientWidth / canvas.value.clientHeight) : 1 })

// Préparation des éléments de ThreeJS.
const scene = new THREE.Scene();
let renderer : THREE.WebGLRenderer | undefined = undefined;
let controleOrbite : OrbitControls | undefined = undefined;

// Chargement des modèles
const [ lampe ] = await chargerModeles();

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
lampe.rotateX(-Math.PI / 2);
lampe.position.set(0, -50, 0);
scene.add(lampe);

// Mise à jour / Rendu
function animation() {
    // Récupére l'objet le plus proche
    raycaster.setFromCamera(pointeur, camera);
    const intersections = raycaster.intersectObjects( scene.children );
    if (intersections.length > 0) {
        let distance = Number.MAX_VALUE;
        for (const objet of intersections) {
            if (objet.distance < distance) {
                objetVise = objet
                distance = objet.distance
            }
        }
    } else {
        objetVise = undefined
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

    console.log(pointeur);
}

watch(x, mouvement_pointeur);
watch(y, mouvement_pointeur);

// Vérifie sur quel objet l'utilisateur a cliqué.
watch(pressure, () => {
    if (pressure.value <= 0) return;

    if (objetVise) {
        if (objetVise.object.name == "Bureau") {
            lampe.position.set(objetVise.point.x, objetVise.point.y + (-80), objetVise.point.z);
        }
    }
})

// Mise à jour du canvas à la modification de la taille de la fenêtre.
watch(ratio, () => {
    if (canvas.value) renderer?.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false);

    camera.aspect = ratio.value;
    camera.updateProjectionMatrix();

    console.log(`Width: ${canvas.value?.clientWidth} Height: ${canvas.value?.clientHeight}`)
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