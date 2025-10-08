<script setup lang="ts">
const targetX = ref(0);
const targetY = ref(0);
const targetZ = ref(0);

const angleM1 = ref(0);
const angleM2 = ref(0);
const angleM3 = ref(0);
const angleM4 = ref(0);

// Gestion des états
const inPause = ref(false);

// Gestion des différents menu
const inMenu = ref(false);
const menuMouvement = ref(false);
const menuLuminosite = ref(false)
const menuCamera = ref(false)

const fermerMenus = () => {
    inMenu.value = false
    menuMouvement.value = false
    menuLuminosite.value = false
    menuCamera.value = false
}

const ouvrirMouvement = () => {
    if (inMenu.value) return
    inMenu.value = true
    menuMouvement.value = true
}

const ouvrirLuminosite = () => {
    if (inMenu.value) return
    inMenu.value = true
    menuLuminosite.value = true
}

const ouvrirCamera= () => {
    if (inMenu.value) return
    inMenu.value = true
    menuCamera.value = true
}

// Affichage de l'erreur
const erreur = ref("");

// Permet de mettre à jour les angles dans la visualisation
const definirAngles = (jointsAngle: JointAngles[]) => {
    jointsAngle.forEach(joint => {
        console.log(joint);
    })
}

const deplacementAngles = () => {
    // Envoi des angles au serveur
}


const deverrouillage = () => {
    // Envoi de la commande de déverrouillage au serveur
}
</script>

<template>
    <div class="flex flex-row h-full">
        <!-- Vue 3D -->
        <div :class="inMenu ? 'basis-2/3' : 'basis-full'" class="w-full h-full" style="position: relative;">
            <Viewer :targetX="targetX" :targetY="targetY" :targetZ="targetZ" />
            <div v-if="erreur" class="absolute w-full text-center bg-pink-500 inset-x-0 bottom-0 p-8">
                <h1><strong>ERREUR: </strong> {{ erreur }}</h1>
            </div>

            <div class="absolute h-full right-0 p-4 text-4xl">
                <div v-if="!inMenu" class="flex flex-col">
                    <button v-on:click="ouvrirMouvement"><Icon name="lucide:move-3d" style="color: black" /></button>
                    <button v-on:click="ouvrirLuminosite"><Icon name="solar:sun-bold" style="color: black" /></button>
                    <button v-on:click="ouvrirCamera"><Icon name="material-symbols:camera-outline" style="color: black" /></button>
                </div>

                <div v-if="inMenu" class="flex flex-col">
                    <button v-on:click="fermerMenus"><Icon name="zondicons:close" style="color: black" /></button>
                </div>
            </div>
        </div>

        <!-- Menu de gestion des mouvements -->
        <Transition name="bounce">
            <div v-if="inMenu && menuMouvement" class="basis-1/3 h-full overflow-y-scroll">
                <div class="row p-4">
                    <h1 class="text-white text-xl">Gestion des mouvements</h1>

                    <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                        X
                        <input v-model.number="targetX" type="range" value="0" min="-500" max="500" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                    </label>

                    <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                        Y
                        <input v-model.number="targetY" type="range" value="0" min="-500" max="500" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                    </label>

                    <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                        Z
                        <input v-model.number="targetZ" type="range" value="0" min="-500" max="500" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                    </label>

                    <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                        M1
                        <input :disabled="!inPause" v-model.number="angleM1" type="range" value="0" min="-180" max="180" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                    </label>

                    <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                        M2
                        <input :disabled="!inPause" v-model.number="angleM2" type="range" value="0" min="-180" max="180" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                    </label>

                    <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                        M3
                        <input :disabled="!inPause" v-model.number="angleM3" type="range" value="0" min="-180" max="180" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                    </label>

                    <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                        M4
                        <input :disabled="!inPause" v-model.number="angleM4" type="range" value="0" min="-180" max="180" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                    </label>

                <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                        Mettre en pause la mise à jour de position
                        <input v-model="inPause" type="checkbox">
                    </label>

                    <div class="text-white">
                        <h2>Déplacement</h2>

                        <button class="block text-white rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 w-full" v-on:click="deplacementAngles">
                            Déplacement vers les angles
                        </button>

                        <h2>Avancé</h2>
                        <button class="block text-white rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 w-full" v-on:click="deverrouillage">
                            Déverrouillage moteurs
                        </button>
                    </div>
                </div>
            </div>
        </Transition>


        <!-- Menu de gestion de la luminosité -->
        <Transition name="bounce">
            <div v-if="inMenu && menuLuminosite" class="basis-1/3 h-full overflow-y-scroll">
                <div class="row p-4">
                    <h1 class="text-white text-xl">Gestion de la luminosité</h1>
                </div>
            </div>
        </Transition>

        <!-- Menu de gestion de la caméra -->
        <Transition name="bounce">
            <div v-if="inMenu && menuCamera" class="basis-1/3 h-full overflow-y-scroll">
                <div class="row p-4">
                    <h1 class="text-white text-xl">Gestion de la caméra</h1>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style>
button {
    margin-top: 10px;
    margin-bottom: 10px;
}
</style>