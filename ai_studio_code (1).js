import * as THREE from 'three';

/**
 * Creates a complete 3D Block Player Character
 * @param {Object} options Configuration options for colors, numbers, and hair
 * @returns {THREE.Group} Three.js Object Group containing the block player
 */
export function createBlockCharacter(options = {}) {
  const group = new THREE.Group();

  // 1. Color Palette Definitions
  const jerseyColor = options.jerseyColor || '#ef4444'; // Red jersey
  const shortsColor = options.shortsColor || '#1e293b'; // Dark shorts
  const socksColor  = options.socksColor  || '#ef4444'; // Red socks
  const skinColor   = options.skinColor   || '#f9cbc5'; // Skin tone
  const hairColor   = options.hairColor   || '#231e21'; // Dark hair
  const shoesColor  = options.shoesColor  || '#10b981'; // Emerald cleats

  // 2. Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.45,
    metalness: 0.0,
  });

  const jerseyMat = new THREE.MeshStandardMaterial({
    color: jerseyColor,
    roughness: 0.35,
    metalness: 0.05,
  });

  const shortsMat = new THREE.MeshStandardMaterial({
    color: shortsColor,
    roughness: 0.35,
    metalness: 0.05,
  });

  const socksMat = new THREE.MeshStandardMaterial({
    color: socksColor,
    roughness: 0.35,
    metalness: 0.05,
  });

  const shoesMat = new THREE.MeshStandardMaterial({
    color: shoesColor,
    roughness: 0.2,
    metalness: 0.1,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.5,
    metalness: 0.05,
  });

  // -------------------------------------------------------------
  // 3. TORSO (Jersey Body)
  // -------------------------------------------------------------
  const torsoGeo = new THREE.BoxGeometry(0.6, 0.9, 0.35);
  const torso = new THREE.Mesh(torsoGeo, jerseyMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  // -------------------------------------------------------------
  // 4. SHORTS & INNER SPANDEX
  // -------------------------------------------------------------
  const shortsGeo = new THREE.BoxGeometry(0.62, 0.3, 0.37);
  const shorts = new THREE.Mesh(shortsGeo, shortsMat);
  shorts.position.y = 0.68;
  shorts.castShadow = true;
  shorts.receiveShadow = true;
  group.add(shorts);

  // -------------------------------------------------------------
  // 5. HEAD & FACE ASSEMBLY
  // -------------------------------------------------------------
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.5, 0); // Neck pivot point
  group.add(headGroup);

  // Head Block
  const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 0.175, 0);
  head.castShadow = true;
  head.receiveShadow = true;
  headGroup.add(head);

  // Face Features Container
  const faceGroup = new THREE.Group();
  faceGroup.position.set(0, 0.175, 0.176); // Mounted on front face of head

  // Eye Whites
  const eyeWhiteGeo = new THREE.BoxGeometry(0.08, 0.08, 0.01);
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeWhite.position.set(-0.08, 0.05, 0);
  faceGroup.add(leftEyeWhite);

  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rightEyeWhite.position.set(0.08, 0.05, 0);
  faceGroup.add(rightEyeWhite);

  // Pupils
  const pupilGeo = new THREE.BoxGeometry(0.04, 0.04, 0.012);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-0.08, 0.05, 0.002);
  faceGroup.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0.08, 0.05, 0.002);
  faceGroup.add(rightPupil);

  // Eyebrows
  const eyebrowGeo = new THREE.BoxGeometry(0.09, 0.02, 0.012);
  const eyebrowMat = new THREE.MeshBasicMaterial({ color: 0x1e1917 });

  const leftEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
  leftEyebrow.position.set(-0.08, 0.11, 0.002);
  faceGroup.add(leftEyebrow);

  const rightEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
  rightEyebrow.position.set(0.08, 0.11, 0.002);
  faceGroup.add(rightEyebrow);

  // Mouth
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x3a090b });
  const mouthGeo = new THREE.BoxGeometry(0.12, 0.02, 0.01);
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.06, 0.002);
  faceGroup.add(mouth);

  headGroup.add(faceGroup);

  // -------------------------------------------------------------
  // 6. HAIR STYLE (Top Spiky Block)
  // -------------------------------------------------------------
  const hairGroup = new THREE.Group();
  hairGroup.position.set(0, -1.46, 0);
  headGroup.add(hairGroup);

  const baseHairGeo = new THREE.BoxGeometry(0.38, 0.12, 0.38);
  const baseHair = new THREE.Mesh(baseHairGeo, hairMat);
  baseHair.position.y = 1.82;
  baseHair.castShadow = true;
  hairGroup.add(baseHair);

  // Spiky Fauxhawk Highlights
  const spikeGeo = new THREE.BoxGeometry(0.07, 0.14, 0.07);
  const spike = new THREE.Mesh(spikeGeo, hairMat);
  spike.position.set(0, 1.91, 0);
  spike.rotation.z = 0.2;
  spike.castShadow = true;
  hairGroup.add(spike);

  // -------------------------------------------------------------
  // 7. LEGS & CLEATS ASSEMBLY
  // -------------------------------------------------------------
  const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.2);

  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.16, 0.55, 0); // Hip pivot point

  const leftLeg = new THREE.Mesh(legGeo, socksMat);
  leftLeg.position.y = -0.275;
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  leftLegGroup.add(leftLeg);

  // Left Cleat Shoe
  const shoeGeo = new THREE.BoxGeometry(0.22, 0.09, 0.28);
  const leftShoe = new THREE.Mesh(shoeGeo, shoesMat);
  leftShoe.position.set(0, -0.5, 0.04);
  leftShoe.castShadow = true;
  leftLegGroup.add(leftShoe);

  group.add(leftLegGroup);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.16, 0.55, 0); // Hip pivot point

  const rightLeg = new THREE.Mesh(legGeo, socksMat);
  rightLeg.position.y = -0.275;
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  rightLegGroup.add(rightLeg);

  // Right Cleat Shoe
  const rightShoe = new THREE.Mesh(shoeGeo, shoesMat);
  rightShoe.position.set(0, -0.5, 0.04);
  rightShoe.castShadow = true;
  rightLegGroup.add(rightShoe);

  group.add(rightLegGroup);

  // -------------------------------------------------------------
  // 8. ARMS
  // -------------------------------------------------------------
  const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.38, 1.35, 0); // Shoulder pivot

  const leftArm = new THREE.Mesh(armGeo, jerseyMat);
  leftArm.position.y = -0.25;
  leftArm.castShadow = true;
  leftArmGroup.add(leftArm);
  group.add(leftArmGroup);

  // Right Arm
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.38, 1.35, 0); // Shoulder pivot

  const rightArm = new THREE.Mesh(armGeo, jerseyMat);
  rightArm.position.y = -0.25;
  rightArm.castShadow = true;
  rightArmGroup.add(rightArm);
  group.add(rightArmGroup);

  // Store references for animations (e.g. running, jumping, expressions)
  group.userData = {
    headGroup,
    leftArmGroup,
    rightArmGroup,
    leftLegGroup,
    rightLegGroup,
    mouth
  };

  return group;
}