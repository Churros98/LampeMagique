<script setup lang="ts">
const M1 = ref(0);
const M2 = ref(0);
const M3 = ref(0);
const M4 = ref(0);
</script>

<template>
    <div class="flex flex-row h-full">
        <div class="basis-2/3 h-full" style="position: relative;">
            <Visu :m1="M1" :m2="M2" :m3="M3" :m4="M4"/>
        </div>
        <div class="basis-1/3 h-full">
            <div class="row p-4">
                <h1 class="text-white text-xl">Pilotage manuel</h1>

                <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                    M1
                    <input v-model.number="M1" type="range" value="0" min="-180" max="180" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                </label>

                <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                    M2
                    <input v-model.number="M2" type="range" value="0" min="-180" max="180" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                </label>

                <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                    M3
                    <input v-model.number="M3" type="range" value="0" min="-180" max="180" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                </label>
            
                <label class="block mb-2 text-sm font-medium text-gray-900 text-white">
                    M4
                    <input v-model.number="M4" type="range" value="0" min="-180" max="180" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"> 
                </label>
            </div>
        </div>
    </div>
</template>