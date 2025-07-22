<script setup lang="ts">
const X = ref(0);
const Y = ref(0);
const Z = ref(0);

const erreur = ref("");
const definirErreur = (texte: string) => { erreur.value = texte }
</script>

<template>
    <div class="flex flex-row h-full">
        <div class="basis-2/3 h-full" style="position: relative;">
            <Visu :x="X" :y="Y" :z="Z" v-on:definir-erreur="definirErreur" />
            <div v-if="erreur" class="absolute w-full text-center bg-pink-500 inset-x-0 bottom-0 p-8">
                <h1><strong>ERREUR: </strong> {{ erreur }}</h1>
            </div>
        </div>

        <div class="basis-1/3 h-full">
            <div class="row p-4">
                <h1 class="text-white text-xl">Pilotage manuel</h1>

                <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                    X
                    <input v-model.number="X" type="range" value="0" min="-500" max="500" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                </label>

                <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                    Y
                    <input v-model.number="Y" type="range" value="0" min="-500" max="500" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                </label>

                <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                    Z
                    <input v-model.number="Z" type="range" value="0" min="-500" max="500" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                </label>
            </div>
        </div>
    </div>
</template>