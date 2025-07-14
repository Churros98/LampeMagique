<script setup lang="ts">
import Visu from '~/components/visu.vue';


</script>

<template>
    <div class="flex flex-row h-full">
        <div class="basis-2/3 h-full" style="position: relative;">
            <Visu />
        </div>
        <div class="basis-1/3 h-full">
            <div class="row grid grid-flow-col justify-items-center content-center h-[50px] w-full" style="background-color: #040A1E; color: white;">
                <h1>Lampe Magique</h1>
            </div>
            <div class="row">02</div>
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