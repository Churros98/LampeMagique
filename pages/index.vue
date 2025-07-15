<script setup lang="ts">
import Visu from '~/components/visu.vue';
import { useBroadcastChannel } from '#imports';

const XAx: Ref<number> = ref(0);
const YAx: Ref<number> = ref(0);
const ZAx: Ref<number> = ref(0);

// Prépare le système de message vers le parent.
const {
  post,
} = useBroadcastChannel<void, { x: number, y: number, z: number}>({ name: '3D' })


function envoyerSurScene() {
    const message = {
        x: XAx.value,
        y: YAx.value,
        z: ZAx.value,
    };

    post(message);
}

watch(XAx, envoyerSurScene);
watch(YAx, envoyerSurScene);
watch(ZAx, envoyerSurScene);
</script>

<template>
    <div class="flex flex-row h-full">
        <div class="basis-2/3 h-full" style="position: relative;">
            <Visu />
        </div>
        <div class="basis-1/3 h-full">
            <div class="row p-4">
                <label for="X" class="block mb-2 text-sm font-medium text-gray-900 text-white">X:</label>
                <input v-model="XAx" id="X" type="range" value="50" min="0" max="2000" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">

                <label for="Y" class="block mb-2 text-sm font-medium text-gray-900 text-white">Y:</label>
                <input v-model="YAx" id="Y" type="range" value="50" min="0" max="2000" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">

                <label for="Z" class="block mb-2 text-sm font-medium text-gray-900 text-white">Z:</label>
                <input v-model="ZAx" id="Z" type="range" value="50" min="0" max="2000" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
            </div>
        </div>
    </div>
</template>

<style>
#visualisation {
    display: block;
    position: relative;
    width: 500px;
    height: 500px;
    background-color: black;
}
</style>