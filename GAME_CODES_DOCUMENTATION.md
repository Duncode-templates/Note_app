# FOOTBALL FREE KICK SIMULATOR - GAME CODES & MECHANICS DOCUMENTATION

This document provides a comprehensive technical breakdown of the core game physics, 3D trajectory calculation, player animations, facial expressions, ball movement equations, and goalkeeper AI in the Football Free Kick Simulator codebase.

---

## 1. 3D TRAJECTORY PREVIEW & AIMING SYSTEM (`stadium.js` & `physics.js`)

The trajectory preview is rendered in real-time as a 3D Aqua Glowing Ribbon that dynamically adapts to user aim, curve, and wind settings.

### 1.1 Trajectory Simulation Math (`physics.js` -> `simulatePhysicsTrajectory`)

The trajectory path is generated using a forward Euler integration simulation loop that steps through time (`dt = 0.02s` per step, up to 150 steps):

```javascript
export function simulatePhysicsTrajectory(ballPos, kickAngle, curveValue, forceVal) {
  const points = [];
  const goalLineX = state.goalLineX || 41.5;
  const speed = calculateSpeedFromPower(forceVal); // Converts % power (15-100) to m/s
  const radAngle = (kickAngle * Math.PI) / 180;
  
  // Calculate launch direction vector
  const dirToGoal = new THREE.Vector3(goalLineX - ballPos.x, 0, -ballPos.z);
  const baseAngle = Math.atan2(dirToGoal.z, dirToGoal.x);
  const totalAngle = baseAngle + radAngle;

  // Convert curve value (-80 to +80) to Y-axis spin rate (rad/s)
  const clampedCurve = Math.max(-80, Math.min(80, curveValue));
  let spinY = (clampedCurve / 80.0) * 35.0;

  // Additional topspin for dipping free kicks
  let spinZ = forceVal > 20 ? -3.0 - (forceVal / 25.0) : 0;

  // Target elevation angle solver
  let radElev = solveTargetElevationAngle(forceVal, speed, totalAngle, ballPos, spinY, spinZ, goalLineX);

  // Initial launch velocity components
  const vx = Math.cos(radElev) * Math.cos(totalAngle) * speed;
  const vz = Math.cos(radElev) * Math.sin(totalAngle) * speed;
  const vy = Math.sin(radElev) * speed;

  const p = ballPos.clone();
  const v = new THREE.Vector3(vx, vy, vz);
  const s = new THREE.Vector3(0, spinY, spinZ);

  // Step simulation forward
  const dt = 0.02;
  const g = 14.72; // Gravity constant
  const dragCoeff = 0.00025; // Air resistance coefficient

  for (let step = 0; step < 150; step++) {
    // 1. Air drag force
    const relVx = v.x - state.stadiumWindX;
    const relVz = v.z - state.stadiumWindZ;
    const relVMag = Math.sqrt(relVx * relVx + v.y * v.y + relVz * relVz);
    
    v.x -= relVx * relVMag * dragCoeff;
    v.y -= v.y * relVMag * dragCoeff;
    v.z -= relVz * relVMag * dragCoeff;

    // 2. Gravity
    v.y -= g * dt;

    // 3. Magnus Effect Curve (horizontal bend)
    const magnusZ = s.y * v.x * 0.032 * dt;
    v.z += magnusZ;

    // 4. Topspin dip force past defensive wall
    if (p.x >= ballPos.x + calculateDynamicWallDistance(ballPos, goalLineX)) {
      v.y -= (dipPowerFactor * v.x * 0.52) * dt;
    }

    // Spin decay
    s.y *= Math.exp(-0.25 * dt);
    s.z *= Math.exp(-0.25 * dt);

    p.addScaledVector(v, dt);
    points.push(p.clone());

    if (p.x >= goalLineX || p.y <= 0.02) break;
  }

  return { points, launchVel: new THREE.Vector3(vx, vy, vz), launchSpin: new THREE.Vector3(0, spinY, spinZ) };
}
```

### 1.2 3D Aqua Trajectory Ribbon Mesh (`stadium.js` -> `updateAquaTrajectory3D`)

The predicted 3D trajectory points are converted into smooth tube geometries using Catmull-Rom spline curves:

```javascript
export function updateAquaTrajectory3D(ballPos, kickAngle, curveValue, forceVal, isVisible) {
  const sim = simulatePhysicsTrajectory(ballPos, kickAngle, curveValue, 75); // Fixed preview force
  const points = sim.points;

  // Catmull-Rom curve generation
  const path = new THREE.CatmullRomCurve3(points);
  const numSegs = Math.min(50, points.length * 2);

  // Core Glowing Line (Thin inner tube)
  aquaTrajectoryCoreLineMesh.geometry = new THREE.TubeGeometry(path, numSegs, 0.022, 8, false);

  // Outer Glow Aura (Wider translucent tube)
  aquaTrajectoryGlowLineMesh.geometry = new THREE.TubeGeometry(path, numSegs, 0.052, 8, false);

  // Pitch Ground Projection Shadow
  const shadowPoints = points.map(p => new THREE.Vector3(p.x, 0.02, p.z));
  aquaTrajectoryShadowMesh.geometry = new THREE.BufferGeometry().setFromPoints(shadowPoints);
}
```

---

## 2. BALL FLIGHT PHYSICS & COLLISION ENGINE (`physics.js` & `script.js`)

When the kicker strikes the ball, the live ball physics loop updates the position, spin, trajectory swerve, and rigid-body collisions per frame:

### 2.1 Flight Mechanics Loop

```javascript
if (state.isBallMoving) {
  // 1. Air Friction Damping
  state.ballVel.x -= state.ballVel.x * 0.015 * delta;
  state.ballVel.y -= state.ballVel.y * 0.015 * delta;
  state.ballVel.z -= state.ballVel.z * 0.015 * delta;

  // 2. Gravitational Acceleration
  state.ballVel.y -= 9.81 * 1.5 * delta; // 14.715 m/s²

  // 3. Magnus Effect Side Swerve
  state.ballVel.z += state.ballSpin.y * 0.25 * delta;

  // 4. Euler Position Integration
  state.ballPos.addScaledVector(state.ballVel, delta);

  // 5. Ground Pitch Bounce Solver
  if (state.ballPos.y <= state.ballRadius) {
    state.ballPos.y = state.ballRadius;
    state.ballVel.y = -state.ballVel.y * 0.65; // Coefficient of restitution
    
    // Grass Friction Damping
    if (Math.abs(state.ballVel.y) < 0.6) {
      state.ballVel.y = 0;
      state.ballVel.x *= 0.94;
      state.ballVel.z *= 0.94;
    }
  }
}
```

### 2.2 Goalpost & Crossbar Rigid-Body Collision Solver

The engine uses a 3D line segment distance solver (`getClosestPointOnSegment`) to detect exact sphere-cylinder contacts with posts and crossbars:

```javascript
const goalSegments = [
  { start: leftPostStart, end: leftPostEnd },     // Left Goal Post
  { start: rightPostStart, end: rightPostEnd },   // Right Goal Post
  { start: crossbarStart, end: crossbarEnd }      // Crossbar
];

for (const seg of goalSegments) {
  const closest = getClosestPointOnSegment(state.ballPos, seg.start, seg.end);
  const dist = state.ballPos.distanceTo(closest);
  const minDist = state.ballRadius + postRadius;

  if (dist < minDist) {
    // Normal vector reflection
    const normal = new THREE.Vector3().subVectors(state.ballPos, closest).normalize();
    const dot = state.ballVel.dot(normal);
    
    if (dot < 0) {
      state.ballVel.sub(normal.multiplyScalar(1.7 * dot)); // Bouncy elastic reflection
    }
    triggerPostImpactFeedback(state.ballPos);
  }
}
```

---

## 3. PLAYER ANIMATIONS, RUNUPS & EXPRESSIONS (`script.js` & `character.js`)

### 3.1 Organic Curved Run-up Approach Math

Professional free-kick takers run up in a smooth curved arc rather than a rigid straight line:

```javascript
if (isApproachingBall && kickerPlayer) {
  const progress = Math.min(runupTimer / runupDuration, 1.0);

  // Linear base position
  const basePos = new THREE.Vector3().lerpVectors(kickerStartPosition, kickerTargetPosition, progress);

  // Perpendicular curved offset peaking at progress = 0.5
  const runupDir = new THREE.Vector3().subVectors(kickerTargetPosition, kickerStartPosition);
  const perp = new THREE.Vector3(-runupDir.z, 0, runupDir.x).normalize();
  const curvePeak = 1.35; // Maximum width of curved approach (meters)
  const curveOffset = Math.sin(progress * Math.PI) * curvePeak * curveSign;
  
  basePos.addScaledVector(perp, curveOffset);
  kickerPlayer.position.copy(basePos);

  // Body Bobbing & Forward Sprint Lean
  kickerPlayer.position.y = -0.05 + Math.abs(Math.sin(runupTimer * 18)) * 0.085;
  kickerPlayer.rotation.x = 0.18 + Math.sin(progress * Math.PI) * 0.06;

  // High Frequency Limb Pumping
  const legSwing = Math.sin(runupTimer * 18) * 0.82;
  const armSwing = Math.cos(runupTimer * 18) * 0.95;

  if (kickerPlayer.userData.leftLegGroup) kickerPlayer.userData.leftLegGroup.rotation.x = legSwing;
  if (kickerPlayer.userData.rightLegGroup) kickerPlayer.userData.rightLegGroup.rotation.x = -legSwing;
  if (kickerPlayer.userData.leftArmGroup) kickerPlayer.userData.leftArmGroup.rotation.x = -armSwing;
  if (kickerPlayer.userData.rightArmGroup) kickerPlayer.userData.rightArmGroup.rotation.x = armSwing;
}
```

### 3.2 Dynamic Follow-Through Kick Animation

Upon ball contact (`strikeSoccerBall`), the kicker executes a dynamic strike follow-through:

```javascript
if (isFollowThrough && kickerPlayer) {
  const ftProgress = Math.min(followThroughTimer / 0.55, 1.0);
  
  // Striking leg swings high forward and across
  kickerPlayer.userData.rightLegGroup.rotation.x = -Math.PI / 2.1 * Math.sin(ftProgress * Math.PI / 2);
  kickerPlayer.userData.rightLegGroup.rotation.y = -Math.PI / 6 * Math.sin(ftProgress * Math.PI / 2);

  // Opposite arm thrown wide for body balance
  kickerPlayer.userData.leftArmGroup.rotation.x = -Math.PI / 3;
  kickerPlayer.userData.leftArmGroup.rotation.z = -Math.PI / 2.2 * Math.sin(ftProgress * Math.PI / 2);

  // Hip twist and jump on strike impact
  kickerPlayer.position.y = 0.35 * Math.sin(ftProgress * Math.PI);
  kickerPlayer.rotation.x = -0.22 * Math.sin(ftProgress * Math.PI / 2);
}
```

### 3.3 3D Facial Expressions & Human Eye Mechanics (`character.js` -> `animateCharactersPlayfully`)

Players feature 3D eyes, brows, micro head-tilts, and blinking engines:

```javascript
// Blink System Engine
hs.blinkTimer -= delta;
if (hs.blinkTimer <= 0) {
  hs.blinkDuration = 0.12; // 120ms eye blink
  hs.blinkTimer = Math.random() * 4.0 + 2.0; // Next blink in 2-6s
}

// Procedural Expressions (Happy, Sad, Neutral, Focused, Nervous, Confident)
export function setPlayerExpression(player, type) {
  player.userData.targetExpression = type; // Triggers smooth lerp of eyebrows and mouth mesh
}
```

---

## 4. GOALKEEPER MECHANICS, AI & SAVE LOGIC (`physics.js`)

### 4.1 Shot Trajectory Traversal & Prediction

When a shot is executed, the goalkeeper calculates the ball's arrival coordinates at the goal line:

```javascript
defenderBots.forEach((bot) => {
  if (bot.userData.role === 'goalkeeper') {
    bot.userData.diveTargetZ = finalDiveZ;
    bot.userData.predictedZAtGoal = predictedZ;
    bot.userData.predictedYAtGoal = predictedY;
    bot.userData.hasReacted = false;
  }
});
```

### 4.2 Goalkeeper Dive & Catch Reaction

The goalkeeper evaluates shot difficulty, reaction delay based on AI skill tier, and executes horizontal dives or aerial catches:

```javascript
if (ud.role === 'goalkeeper') {
  // Lateral movement toward predicted save target
  const diveProgress = Math.min(ud.diveTimer / ud.diveDuration, 1.0);
  player.position.z = THREE.MathUtils.lerp(ud.initialZ, ud.diveTargetZ, diveProgress);

  // Aerial dive elevation curve
  if (ud.predictedYAtGoal > 1.2) {
    player.position.y = -0.05 + Math.sin(diveProgress * Math.PI) * (ud.predictedYAtGoal * 0.85);
    player.rotation.z = (ud.diveTargetZ < player.position.z ? 1 : -1) * (Math.PI / 3) * Math.sin(diveProgress * Math.PI);
  }

  // Catch vs Parry Collision Check
  if (player.position.distanceTo(state.ballPos) < 1.1) {
    if (ud.isMustCatch) {
      ud.isCarryingBall = true;
      state.isBallMoving = false; // Goalkeeper holds ball securely
    } else {
      state.ballVel.x *= -0.3; // Parry reflection away from net
    }
  }
}
```

---

## 5. SUMMARY OF CORE FILES

| File | Primary Responsibility |
| :--- | :--- |
| **`script.js`** | Main render loop, UI event listeners, kicker runup state machine, match flow control. |
| **`physics.js`** | Flight physics equations, Magnus effect, goal post rigid-body collisions, goalkeeper AI logic. |
| **`stadium.js`** | 3D stadium scenery, lighting, turf textures, 3D Aqua Trajectory Ribbon geometry. |
| **`character.js`** | 3D player models, blocky character rigs, jersey textures, facial expressions & eyes. |
