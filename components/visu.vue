<script setup lang="ts">
import * as THREE from 'three';
import { usePointer } from '@vueuse/core'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cinematique } from '#imports';

const props = defineProps<{
    x: number,
    y: number,
    z: number,
}>();

const emit = defineEmits<{
    definirErreur: [texte: string]
}>();

// Référence
const canvas = useTemplateRef("canvas");

// Gestion de la souris.
const { x, y, pressure } = usePointer({
    target: canvas
});

const ratio = computed(() => { return canvas.value ? (canvas.value.clientWidth / canvas.value.clientHeight) : 1 })

// Préparation des éléments de ThreeJS.
const loader = new FBXLoader();
const scene = new THREE.Scene();
const renderer = shallowRef<THREE.WebGLRenderer | undefined>();
const controleOrbite = shallowRef<OrbitControls | undefined>();

// Debug
const axesHelper = new THREE.AxesHelper( 200 );
scene.add(axesHelper);

// Chargement du modèle
const lampe = await loader.loadAsync("lampe.fbx");
const [ support, bras1, bras2, cone, brashorizontal ] = lampe.children;

// Récupére les coordonnées réel pour calcul des deltas.
const conePos = new THREE.Vector3(0, 0, 0);
const bras1Pos = new THREE.Vector3(0, 0, 0);
const bras2Pos = new THREE.Vector3(0, 0, 0);
const brashorizontalPos = new THREE.Vector3(0, 0, 0);

cone.getWorldPosition(conePos);
bras1.getWorldPosition(bras1Pos);
bras2.getWorldPosition(bras2Pos);
brashorizontal.getWorldPosition(brashorizontalPos);

// Préparation des groupes et point spécifique pour la lampe en fonction des moteurs.
const groupe_M1 = new THREE.Group();
const groupe_M2 = new THREE.Group();
const groupe_M3 = new THREE.Group();
const groupe_M4 = new THREE.Group();
const groupe_Lampe = new THREE.Group();

groupe_Lampe.add(support, groupe_M1);
groupe_Lampe.position.set(0, 0, 0);

groupe_M1.add(brashorizontal, groupe_M2);
groupe_M1.position.set(brashorizontalPos.x, brashorizontalPos.y, brashorizontalPos.z);

groupe_M2.add(bras1, groupe_M3);
groupe_M2.position.set(bras1Pos.x - brashorizontalPos.x, bras1Pos.y - brashorizontalPos.y, bras1Pos.z - brashorizontalPos.z);

groupe_M3.add(bras2, groupe_M4);
groupe_M3.position.set(bras2Pos.x - bras1Pos.x, bras2Pos.y - bras1Pos.y, bras2Pos.z - bras1Pos.z);

groupe_M4.add(cone);
groupe_M4.position.set(conePos.x - bras2Pos.x, conePos.y - bras2Pos.y, conePos.z - bras2Pos.z);

cone.position.set(0,0,0);
bras2.position.set(0,0,0);
bras1.position.set(0,0,0);
brashorizontal.position.set(0,0,0);
support.position.set(0,0,0);

groupe_Lampe.rotateX(-Math.PI / 2);

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

// Affichage de la lampe
scene.add(groupe_Lampe);

// Repère cinématique
const offset = new THREE.Vector3(0,0,0);
groupe_M1.getWorldPosition(offset);
const targetPos = reactive(new THREE.Vector3(0, 0, 0))
const geometry = new THREE.SphereGeometry( 30, 32, 16 ); 
const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } ); 
const target = new THREE.Mesh( geometry.clone(), material.clone() );
target.position.set(offset.x, offset.y, offset.z);
scene.add( target );

// Mise à jour positionnel de la visée
watch(() => props.x, (x) => {
    targetPos.setX(x)
})

watch(() => props.y, (y) => {
    targetPos.setY(y)
})

watch(() => props.z, (z) => {
    targetPos.setZ(z)
})


watch(targetPos, () => {
    target.position.set(targetPos.x + offset.x, targetPos.y + offset.y, targetPos.z + offset.z);
    try {
        const { m1, m2, m3 } = cinematiqueInverse(targetPos);
        groupe_M1.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), (-m1 * (Math.PI/180)));
        groupe_M2.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), (m2 * (Math.PI/180)));
        groupe_M3.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), (m3 * (Math.PI/180)));
        emit('definirErreur', '');
    } catch (err) {
        console.error(err as string)
        emit('definirErreur', err as string);
    }
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