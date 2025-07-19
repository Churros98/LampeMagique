import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/Addons.js';
import type { mat3 } from 'three/src/nodes/TSL.js';

//
// Attention : 1 point = 1mm réel.
//

export function cinematique(angles: {
    m1: number,
    m2: number,
    m3: number,
}) {
    // Longueurs en mm
    const brasHorizontalL = 70;   // Longueur du bras horizontal (entre M1 et M2)
    const brasL = 320;            // Longueur des segments M2-M3 et M3-M4

    // Conversion des angles en radians
    const radian = {
        m1: THREE.MathUtils.degToRad(angles.m1),
        m2: THREE.MathUtils.degToRad(-angles.m2),
        m3: THREE.MathUtils.degToRad(-angles.m3),
        correction: THREE.MathUtils.degToRad(95.36),  // Correction spécifique du système
    };

    // Position d'origine (M1)
    const origin = new THREE.Vector3(0, 0, 0);

    // Position de M2 (après translation en X)
    const pivotM2 = origin.clone().add(new THREE.Vector3(brasHorizontalL, 0, 0));

    // Position de M3 (rotation dans le plan XY)
    const angleM2Total = radian.m2 + radian.correction;
    const pivotM3 = pivotM2.clone().add(new THREE.Vector3(
        brasL * Math.cos(angleM2Total),
        brasL * Math.sin(angleM2Total),
        0
    ));

    // Position de M4 (rotation cumulative m2 + m3)
    const angleM3Total = angleM2Total + radian.m3;
    const pivotM4 = pivotM3.clone().add(new THREE.Vector3(
        brasL * Math.cos(angleM3Total),
        brasL * Math.sin(angleM3Total),
        0
    ));

    // Rotation du système autour de Y (angle m1)
    const finalPosition = pivotM4.clone().applyAxisAngle(
        new THREE.Vector3(0, 1, 0), radian.m1
    );

    return finalPosition;
}
export function cinematiqueInverse(position: THREE.Vector3): {
    m1: number,
    m2: number,
    m3: number,
} {
    const brasHorizontalL = 70;
    const brasL = 320;
    const correction = THREE.MathUtils.degToRad(95.36);

    const constraints = {
        m1: { min: -180, max: 180 },
        m2: { min: -180, max: 180 },
        m3: { min: -180, max: 180 }
    };

    function clampAngle(angle: number, min: number, max: number): number {
        return Math.max(min, Math.min(angle, max));
    }

    // Étape 1 : angle M1 (rotation horizontale)
    const m1Rad = Math.atan2(position.z, position.x);

    // Étape 2 : ramener au plan XY
    const horizontalDistance = Math.sqrt(position.x ** 2 + position.z ** 2);
    const localTarget = new THREE.Vector2(horizontalDistance - brasHorizontalL, position.y);
    const d = localTarget.length();

    // Vérification de la portée
    if (d > 3 * brasL) {
        throw new Error("Position hors de portée du bras.");
    }

    const angleToTarget = Math.atan2(localTarget.y, localTarget.x);
    const cosM3 = (d * d - 2 * brasL * brasL) / (2 * brasL * brasL);
    const m3RadBase = Math.acos(THREE.MathUtils.clamp(cosM3, -1, 1));

    // Deux configurations possibles
    const solutions = [];

    // ---- Solution 1: elbow-down ----
    {
        const alpha = Math.acos(
            THREE.MathUtils.clamp((d * d + brasL * brasL - brasL * brasL) / (2 * d * brasL), -1, 1)
        );
        const m2Rad = angleToTarget - alpha;
        const m3Rad = m3RadBase;

        const m2Deg = -THREE.MathUtils.radToDeg(m2Rad - correction);
        const m3Deg = -THREE.MathUtils.radToDeg(m3Rad);
        const m1Deg = THREE.MathUtils.radToDeg(m1Rad);

        if (
            m1Deg >= constraints.m1.min && m1Deg <= constraints.m1.max &&
            m2Deg >= constraints.m2.min && m2Deg <= constraints.m2.max &&
            m3Deg >= constraints.m3.min && m3Deg <= constraints.m3.max
        ) {
            solutions.push({ m1: m1Deg, m2: m2Deg, m3: m3Deg });
        }
    }

    // ---- Solution 2: elbow-up ----
    {
        const alpha = Math.acos(
            THREE.MathUtils.clamp((d * d + brasL * brasL - brasL * brasL) / (2 * d * brasL), -1, 1)
        );
        const m2Rad = angleToTarget + alpha;
        const m3Rad = -m3RadBase;

        const m2Deg = -THREE.MathUtils.radToDeg(m2Rad - correction);
        const m3Deg = -THREE.MathUtils.radToDeg(m3Rad);
        const m1Deg = THREE.MathUtils.radToDeg(m1Rad);

        if (
            m1Deg >= constraints.m1.min && m1Deg <= constraints.m1.max &&
            m2Deg >= constraints.m2.min && m2Deg <= constraints.m2.max &&
            m3Deg >= constraints.m3.min && m3Deg <= constraints.m3.max
        ) {
            solutions.push({ m1: m1Deg, m2: m2Deg, m3: m3Deg });
        }
    }

    // Choix de la solution
    if (solutions.length === 0) {
        //throw new Error("Aucune configuration ne respecte les contraintes.");
        return { m1: 0, m2: 0, m3: 0}
    }

    // Retourner la première solution valide (tu peux affiner ce choix)
    return solutions[0];
}
