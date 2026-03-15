
const neko = document.getElementById('neko');

// Audio elements
const awakeSound = document.getElementById('awake-sound');
const idleSounds = [
    document.getElementById('idle1-sound'),
    document.getElementById('idle2-sound'),
    document.getElementById('idle3-sound'),
];
const sleepSound = document.getElementById('sleep-sound');

// --- Core State ---
let state = 'sleep';
let frame = 1;
let frameCount = 0;
const frameRate = 12;

// --- Position & Movement ---
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;
let targetX = x;
let targetY = y;
const speed = 2.2;
const stoppingDistance = 10;
const cursorOffset = window.innerHeight * 0.03;

// --- Time-based State Management ---
let stateEntryTime = 0;
let lastMoveTime = Date.now();

// --- Event Listener ---
// document.addEventListener('mousemove', (e) => {
//     targetX = e.clientX - 16;
//     targetY = e.clientY - 16 + cursorOffset;
//     lastMoveTime = Date.now(); // Update the last move time
// });
document.addEventListener('mousemove', (e) => {
    const offset = 10; // distance from cursor

    const dx = e.clientX - x;
    const dy = e.clientY - y;
    const angle = Math.atan2(dy, dx);

    // place cat slightly behind cursor direction
    targetX = e.clientX - Math.cos(angle) * offset;
    targetY = e.clientY - Math.sin(angle) * offset;

    lastMoveTime = Date.now();
});

// --- Sound Logic ---
function playSound(sound, volume = 1.0) {
    if (sound) {
        sound.volume = volume;
        sound.currentTime = 0;
        sound.play().catch(e => console.error("Audio play failed:", e));
    }
}

// --- State Transition Helper ---
function enterState(newState) {
    state = newState;
    stateEntryTime = Date.now();
}

// --- Main Animation Loop ---
function update() {
    const now = Date.now();
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // --- Global Sleep Check ---
    if (now - lastMoveTime > 30000 && state !== 'sleep') {
        playSound(sleepSound, 0.5);
        enterState('sleep');
    }

    // --- STATE MACHINE ---
    switch (state) {
        case 'sleep':
            if (distance > stoppingDistance) {
                playSound(awakeSound, 0.5);
                enterState('moving');
            } else if (now - stateEntryTime > 20000) { // Wake up after 20s
                playSound(awakeSound, 0.5);
                enterState('awake');
            }
            break;

        case 'awake':
            // If the mouse moves far enough, start chasing it.
            if (distance > stoppingDistance) {
                enterState('moving');
            }
            // After a short rest, maybe do a random action.
            else if (now - stateEntryTime > 3000 + Math.random() * 4000) { // 3-7s
                const idleActions = ['yawn', 'wash'];
                const nextAction = idleActions[Math.floor(Math.random() * idleActions.length)];
                enterState(nextAction);
            }
            break;

        case 'moving':
            // If the cat reaches its target, start settling down.
            if (distance < stoppingDistance) {
                enterState('settling');
            } else {
                // Move towards the target.
                const currentSpeed = distance > 100 ? speed * 1.5 : speed;
                const angle = Math.atan2(dy, dx);
                x += Math.cos(angle) * currentSpeed;
                y += Math.sin(angle) * currentSpeed;
            }
            break;

        case 'settling':
            // If the mouse moves again, start chasing it.
            if (distance > stoppingDistance) {
                enterState('moving');
            }
            // After the 'down' animation, go to a restful 'awake' state.
            else if (now - stateEntryTime > 1500) { // 1.5s for settling animation
                enterState('awake');
            }
            break;

        case 'yawn':
        case 'wash':
            // After the idle action animation finishes, return to being awake.
            if (now - stateEntryTime > 2000) { // 2s for idle animations
                enterState('awake');
            }
            break;
    }

    // --- ANIMATION & RENDERING ---
    frameCount++;
    if (frameCount >= frameRate) {
        frameCount = 0;
        frame = frame === 1 ? 2 : 1;
    }

    let spriteName = state;
    if (state === 'moving') {
        const angle = Math.atan2(dy, dx);
        const angleDeg = (angle * 180 / Math.PI + 360) % 360;
        if (angleDeg > 337.5 || angleDeg <= 22.5) spriteName = 'right';
        else if (angleDeg > 22.5 && angleDeg <= 67.5) spriteName = 'downright';
        else if (angleDeg > 67.5 && angleDeg <= 112.5) spriteName = 'down';
        else if (angleDeg > 112.5 && angleDeg <= 157.5) spriteName = 'downleft';
        else if (angleDeg > 157.5 && angleDeg <= 202.5) spriteName = 'left';
        else if (angleDeg > 202.5 && angleDeg <= 247.5) spriteName = 'upleft';
        else if (angleDeg > 247.5 && angleDeg <= 292.5) spriteName = 'up';
        else spriteName = 'upright';
    } else if (state === 'settling') {
        spriteName = 'awake';
    }

    const twoFrameStates = ['up', 'left', 'right', 'upleft', 'upright', 'downleft', 'downright', 'scratch', 'down', 'wash', 'yawn', 'sleep'];
    if (twoFrameStates.includes(spriteName)) {
        spriteName += frame;
    }

    neko.src = `assets/${spriteName}.png`;
    neko.style.left = x + 'px';
    neko.style.top = y + 'px';

    requestAnimationFrame(update);
}

// --- Initial Setup ---
function init() {
    const nav = document.querySelector('nav');
    const navRect = nav.getBoundingClientRect();

    const catSize = 35; // same as CSS width
    const padding = 10; // small spacing from edge

    // position cat at rightmost side of navbar
    x = navRect.right - catSize - padding;
    y = navRect.top + (navRect.height / 2) - (catSize / 2);

    targetX = x;
    targetY = y;

    const enableAudio = () => {
        document.removeEventListener('mousemove', enableAudio);
        document.removeEventListener('click', enableAudio);

        const emptySound = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        emptySound.play().catch(() => {});
    }

    document.addEventListener('mousemove', enableAudio);
    document.addEventListener('click', enableAudio);

    stateEntryTime = Date.now();
    update();
}
init();
