<script setup lang="ts">
import * as THREE from 'three';
import URDFLoader from 'urdf-loader';
import { XacroLoader } from 'xacro-parser';
import type { URDFRobot } from 'urdf-loader';
import { usePointer } from '@vueuse/core'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { JointAngles } from '~/utils/messages';

const props = defineProps<{
    targetX: number,
    targetY: number,
    targetZ: number,
    jointAngles?: JointAngles[]
}>();

// Référence
const canvas = useTemplateRef("canvas");

// Gestion de la souris.
const { x, y, pressure } = usePointer({
    target: canvas
});

const ratio = computed(() => { return canvas.value ? (canvas.value.clientWidth / canvas.value.clientHeight) : 1 })

// Préparation des éléments de ThreeJS.
const manager = new THREE.LoadingManager();
const loader = new URDFLoader( manager );
loader.packages = {
    packageName : './ros'            // The equivalent of a (list of) ROS package(s):// directory
};

const scene = new THREE.Scene();
const renderer = shallowRef<THREE.WebGLRenderer | undefined>();
const controleOrbite = shallowRef<OrbitControls | undefined>();

// Debug
const axesHelper = new THREE.AxesHelper( 200 );
scene.add(axesHelper);

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
gridHelper.position.set(0, 0, 0);
scene.add( gridHelper );

// Paramètrage de la scène
scene.background = new THREE.Color('#F6E6B1');

// Repère cinématique
const offset = new THREE.Vector3(0,0,0);
const targetPos = reactive(new THREE.Vector3(0, 0, 0))
const geometry = new THREE.SphereGeometry( 30, 32, 16 ); 
const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } ); 
const target = new THREE.Mesh( geometry.clone(), material.clone() );
target.position.set(offset.x, offset.y, offset.z);
scene.add( target );

// Ajout du robot
const url = "./ros/Bras_description/urdf/Bras.xarco";
const xacroLoader = new XacroLoader();
xacroLoader.load(url, xml => {

    const urdfLoader = new URDFLoader();
    urdfLoader.workingPath = THREE.LoaderUtils.extractUrlBase( url );

    const robot = urdfLoader.parse( xml );
    scene.add( robot );

}, err => {
    console.error(err);
});

// Mise à jour positionnel de la visée
watch(() => props.targetX, (x) => {
    targetPos.setX(x)
})

watch(() => props.targetY, (y) => {
    targetPos.setY(y)
})

watch(() => props.targetZ, (z) => {
    targetPos.setZ(z)
})

watch(targetPos, () => {
    target.position.set(targetPos.x + offset.x, targetPos.y + offset.y, targetPos.z + offset.z);
})

watch(() => props.jointAngles, (angles) => {
    angles?.forEach((name, angle) => {
        // TODO : Rotate the joints
    })
})

// Mise à jour / Rendu
function animation() {
    // Récupére l'objet le plus proche
    raycaster.setFromCamera(pointeur, camera);
    const intersections = raycaster.intersectObjects( scene.children );
    objetVise = intersections.length ? intersections[0] : undefined

    // Permet de naviguer dans la scene
    controleOrbite.value?.update();

    // Rendu de l'image
    renderer.value?.render(scene, camera);
}

// Lorsque le DOM est disponible, activer le rendu de la scène 3D.
onMounted(() => {
    if (!canvas.value) return;

    renderer.value = new THREE.WebGLRenderer({
        canvas: canvas.value,
        antialias: true,
    });

    renderer.value?.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false);
    controleOrbite.value = new OrbitControls( camera, renderer.value.domElement );

    renderer.value.setAnimationLoop(animation);
});

// Mise à jour du pointeur "2D" via les mouvements de souris
watch([x, y], () => {
    if (!canvas.value) return;
	pointeur.x = (x.value / canvas.value.clientWidth ) * 2 - 1;
	pointeur.y = - ( y.value / canvas.value.clientHeight ) * 2 + 1;
});

// Vérifie sur quel objet l'utilisateur a cliqué.
watch(pressure, () => {
    if (pressure.value <= 0) return;

    // Mettre ici les interactions
    objetClique = objetVise
})

// Mise à jour du canvas à la modification de la taille de la fenêtre.
watch(ratio, () => {
    if (canvas.value) renderer.value?.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false);

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