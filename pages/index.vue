<script setup lang="ts">
import { Vector3 } from 'three';
import type { Angles, Contraintes, EventMessage } from '~/utils/messages';

const targetX = ref(0);
const targetY = ref(0);
const targetZ = ref(0);

const angleM1 = ref(0);
const angleM2 = ref(0);
const angleM3 = ref(0);
const angleM4 = ref(0);

// Gestion des états
const inSim = ref(false);
const inCal = ref(false);
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

// Connexion au backend
const { status, data, send, close } = useWebSocket('ws://lampe.local:8765', {
    autoReconnect: {
        retries: 3,
        delay: 1000,
        onFailed() {
            erreur.value = "La connexion avec la lampe a échouée."
        },
    },
})

// Permet de mettre à jour les angles dans la visualisation
const definirAngles = (angles: Angles) => {
    angleM1.value = angles.m1
    angleM2.value = angles.m2
    angleM3.value = angles.m3
    angleM4.value = angles.m4
}

// Permet de demander une calibration
const startCal = () => {
    const eventFrame: EventMessage = {
        name: "startCal",
        data: undefined
    }

    send(JSON.stringify(eventFrame))
} 

const stopCal = () => {
    const eventFrame: EventMessage = {
        name: "stopCal",
        data: undefined
    }

    send(JSON.stringify(eventFrame))
} 

// Permet le déplacement de la lampe au coordonnées demandée.
const deplacementCineInverse = () => {
    try { 
        const { m1, m2, m3 } = cinematiqueInverse(new Vector3(targetX.value, targetY.value, targetZ.value));

        const event: EventMessage = {
            name: 'MAJAngles',
            data: {
                m1: m1,
                m2: m2,
                m3: m3,
                m4: 0
            }
        }
        erreur.value = ""
        send(JSON.stringify(event))
    } catch (e) {
        erreur.value = e as string
    }
}

const deplacementAngles = () => {
    const event: EventMessage = {
        name: 'MAJAngles',
        data: {
            m1: angleM1.value,
            m2: angleM2.value,
            m3: angleM3.value,
            m4: angleM4.value
        }
    }

    inPause.value = false;

    erreur.value = ""
    send(JSON.stringify(event))
}

// Permet de simuler un mouvement
const simulation = () => {
    try { 
        const { m1, m2, m3 } = cinematiqueInverse(new Vector3(targetX.value, targetY.value, targetZ.value));

        const angles: Angles = {
            m1: m1,
            m2: m2,
            m3: m3,
            m4: 0
        }

        definirAngles(angles)

        inSim.value = true
        erreur.value = ""
    } catch (e) {
        erreur.value = e as string
    }
}

// Permet de fermer la simulation
const finSimulation = () => {
    inSim.value = false
}

const deverrouillage = () => {
        const event: EventMessage = {
            name: 'deverrouillageMoteurs',
            data: undefined
        }

        send(JSON.stringify(event))
}

// Réception des données renvoyée par le serveur et redistribution
watch(data, (frame) => {
    const eventFrame = JSON.parse(frame) as EventMessage
    switch (eventFrame.name) {
        case 'MAJAngles':  {
            if (inPause.value) break;
            if (!inSim.value) definirAngles(eventFrame.data as Angles) 
            break;
        }

        case 'MAJContraintes': {
            definirContraintes(eventFrame.data as Contraintes)
            break;
        }

        case 'startCal': {
            inCal.value = true;
            break;
        }

        case 'stopCal': {
            inCal.value = false;
            break;
        }

        case 'contrainteMecanique': {
            erreur.value = "Atteinte de la contrainte mécanique. Ordre annulé."
            break;
        }

        default: {
            console.warn(`Message inconnu: ${eventFrame.name}`) 
        }
    }
})
</script>

<template>
    <div class="flex flex-row h-full">
        <!-- Vue 3D -->
        <div :class="inMenu ? 'basis-2/3' : 'basis-full'" class="w-full h-full" style="position: relative;">
            <Visu :targetX="targetX" :targetY="targetY" :targetZ="targetZ" :angleM1="angleM1" :angleM2="angleM2" :angleM3="angleM3" :angleM4="angleM4"/>
            <div v-if="erreur" class="absolute w-full text-center bg-pink-500 inset-x-0 bottom-0 p-8">
                <h1><strong>ERREUR: </strong> {{ erreur }}</h1>
            </div>
            <div v-if="inSim && !inCal" class="absolute w-full text-white text-2xl text-center bg-green-500 inset-x-0 top-0 p-4">
                <h1>Simulation</h1>
            </div>

            <div v-if="inCal" class="absolute w-full text-white text-2xl text-center bg-green-500 inset-x-0 top-0 p-4">
                <h1>Calibration en cours ...</h1>
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

                    <div v-if="!inSim && !inCal" class="text-white">
                        <h2>Déplacement</h2>

                        <button class="block text-white rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 w-full" v-on:click="deplacementCineInverse">
                            Déplacement vers le point
                        </button>

                        <button class="block text-white rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 w-full" v-on:click="deplacementAngles">
                            Déplacement vers les angles
                        </button>

                        <h2>Simulation</h2>
                        <button class="block text-white rounded-lg bg-green-500 hover:bg-green-600 px-4 py-2 w-full" v-on:click="simulation">
                            Simulation de déplacement vers le point
                        </button>

                        <h2>Avancé</h2>
                        <button class="block text-white rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 w-full" v-on:click="deverrouillage">
                            Déverrouillage moteurs
                        </button>

                        <button v-if="!inCal" class="block text-white rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 w-full" v-on:click="startCal">
                            Démarrer la calibration
                        </button>
                    </div>

                    <div v-if="inSim">
                        <button class="block text-white rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 w-full" v-on:click="finSimulation">
                            Fin de la simulation
                        </button>
                    </div>

                    <div v-if="inCal">
                        <button class="block text-white rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 w-full" v-on:click="stopCal">
                            Arrêter la calibration
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