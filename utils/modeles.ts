import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { mod } from 'three/tsl';

const loader = new FBXLoader();

export async function chargerModeles() {
    return await Promise.all([
        loader.loadAsync("lampe.fbx"),
    ]);
}