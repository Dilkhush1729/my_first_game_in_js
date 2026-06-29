const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    // Pause game
    if (e.key.toLowerCase() === "p") {
        paused = !paused;
    }

    // Restart after Game Over
    if (e.key.toLowerCase() === "r" && gameOver) {
        restartGame();
    }

    if (e.code === "Space") {
        gameStarted = true;
    }

    if (e.key.toLowerCase() === "f") {

        if (!document.fullscreenElement) {

            document.documentElement.requestFullscreen();

        } else {

            document.exitFullscreen();
        }
    }

});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});


["up", "left", "down", "right"].forEach(id => {

    const button =
        document.getElementById(id);

    button.addEventListener("touchstart", () => {

        switch (id) {

            case "up":
                keys["w"] = true;
                break;

            case "down":
                keys["s"] = true;
                break;

            case "left":
                keys["a"] = true;
                break;

            case "right":
                keys["d"] = true;
                break;
        }
    });

    button.addEventListener("touchend", () => {

        keys["w"] = false;
        keys["a"] = false;
        keys["s"] = false;
        keys["d"] = false;
    });
});


// ================= PLAYER =================


let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

}, { passive: true });


canvas.addEventListener("touchend", (e) => {

    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;

    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;

    // Reset previous movement
    keys["w"] = false;
    keys["a"] = false;
    keys["s"] = false;
    keys["d"] = false;

    // Ignore very small swipes
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    // Horizontal swipe
    if (Math.abs(dx) > Math.abs(dy)) {

        if (dx > 0) {
            keys["d"] = true; // right
        } else {
            keys["a"] = true; // left
        }

    }
    // Vertical swipe
    else {

        if (dy > 0) {
            keys["s"] = true; // down
        } else {
            keys["w"] = true; // up
        }
    }

    // Stop movement after a short time
    setTimeout(() => {
        keys["w"] = false;
        keys["a"] = false;
        keys["s"] = false;
        keys["d"] = false;
    }, 200);

}, { passive: true });


class Player {
    constructor() {
        this.x = 400;
        this.y = 300;
        this.size = 20;
        this.speed = 4;
    }

    update() {

        let moveSpeed = doubleSpeed ? this.speed * 2 : this.speed;

        if (!reverseControls) {

            if (keys["w"] || keys["arrowup"]) this.y -= moveSpeed;
            if (keys["s"] || keys["arrowdown"]) this.y += moveSpeed;
            if (keys["a"] || keys["arrowleft"]) this.x -= moveSpeed;
            if (keys["d"] || keys["arrowright"]) this.x += moveSpeed;

        } else {

            if (keys["w"] || keys["arrowup"]) this.y += moveSpeed;
            if (keys["s"] || keys["arrowdown"]) this.y -= moveSpeed;
            if (keys["a"] || keys["arrowleft"]) this.x += moveSpeed;
            if (keys["d"] || keys["arrowright"]) this.x -= moveSpeed;
        }

        // Arena boundaries
        this.x = Math.max(0, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.size, this.y));

        // Record current frame
        currentRecording.push({
            x: this.x,
            y: this.y
        });
    }

    draw() {

        if (damageCooldown > 0) {

            if (Math.floor(Date.now() / 100) % 2 === 0) {
                return;
            }
        }

        ctx.fillStyle = "cyan";
        ctx.shadowColor = "cyan";
        ctx.shadowBlur = 15;

        ctx.fillRect(this.x, this.y, this.size, this.size);

        ctx.shadowBlur = 0;
    }
}


// ================= CLONE =================

class Clone {
    constructor(recording, color) {
        this.recording = recording;
        this.frame = 0;

        this.x = recording[0]?.x || 0;
        this.y = recording[0]?.y || 0;

        this.size = 20;
        this.color = color;

        this.trail = [];
    }

    update() {

        if (this.recording.length === 0) return;

        const data = this.recording[this.frame];

        this.x = data.x;
        this.y = data.y;

        this.trail.push({
            x: this.x,
            y: this.y
        });

        if (this.trail.length > 20) {
            this.trail.shift();
        }

        this.frame++;

        // Loop forever
        if (this.frame >= this.recording.length) {
            this.frame = 0;
        }
    }

    draw() {

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {

            const point = this.trail[i];

            ctx.globalAlpha = i / this.trail.length * 0.4;

            ctx.fillStyle = this.color;

            ctx.fillRect(
                point.x + 5,
                point.y + 5,
                10,
                10
            );
        }

        // Draw clone
        ctx.globalAlpha = 0.5;

        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        ctx.fillRect(this.x, this.y, this.size, this.size);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// ================= CRYSTAL =================

class Crystal {

    constructor() {

        this.size = 12;

        this.x = Math.random() * (canvas.width - this.size);
        this.y = Math.random() * (canvas.height - this.size);

        this.rotation = 0;
    }

    update() {
        this.rotation += 0.05;
    }

    draw() {

        ctx.save();

        ctx.translate(
            this.x + this.size / 2,
            this.y + this.size / 2
        );

        ctx.rotate(this.rotation);

        ctx.fillStyle = "#00ffff";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 20;

        ctx.beginPath();

        ctx.moveTo(0, -this.size / 2);
        ctx.lineTo(this.size / 2, 0);
        ctx.lineTo(0, this.size / 2);
        ctx.lineTo(-this.size / 2, 0);

        ctx.closePath();
        ctx.fill();

        ctx.restore();

        ctx.shadowBlur = 0;
    }
}

// ================= HAZARD =================

class Hazard {

    constructor() {

        this.size = 25;

        this.x = Math.random() * (canvas.width - this.size);
        this.y = Math.random() * (canvas.height - this.size);

        this.dx = (Math.random() - 0.5) * 4;
        this.dy = (Math.random() - 0.5) * 4;
    }

    update() {

        this.x += this.dx;
        this.y += this.dy;

        // Bounce off walls
        if (this.x <= 0 || this.x + this.size >= canvas.width) {
            this.dx *= -1;
        }

        if (this.y <= 0 || this.y + this.size >= canvas.height) {
            this.dy *= -1;
        }
    }

    draw() {

        ctx.fillStyle = "red";
        ctx.shadowColor = "red";
        ctx.shadowBlur = 20;

        ctx.beginPath();

        ctx.arc(
            this.x + this.size / 2,
            this.y + this.size / 2,
            this.size / 2,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

// ================================ Create Boss =================

class Boss {

    constructor() {

        this.size = 60;

        this.x = canvas.width / 2 - 30;
        this.y = 100;

        this.health = 20;

        this.dx = 4;
    }

    update() {

        this.x += this.dx;

        if (
            this.x <= 0 ||
            this.x + this.size >= canvas.width
        ) {
            this.dx *= -1;
        }

        // Damage player on touch
        if (
            damageCooldown <= 0 &&
            isColliding(player, this)
        ) {

            health--;

            damageCooldown = 1.5;
            screenShake = 25;

            createExplosion(
                player.x,
                player.y,
                "red"
            );

            if (health <= 0) {
                gameOver = true;
            }
        }
    }

    draw() {

        ctx.fillStyle = "#ff00ff";

        ctx.shadowColor = "#ff00ff";
        ctx.shadowBlur = 30;

        ctx.fillRect(
            this.x,
            this.y,
            this.size,
            this.size
        );

        // Boss HP bar
        ctx.fillStyle = "red";

        ctx.fillRect(
            this.x,
            this.y - 15,
            this.size,
            8
        );

        ctx.fillStyle = "lime";

        ctx.fillRect(
            this.x,
            this.y - 15,
            (this.health / 20) * this.size,
            8
        );

        ctx.shadowBlur = 0;
    }
}

// ============ Paricle class =================

class Particle {

    constructor(x, y, color) {

        this.x = x;
        this.y = y;

        this.size = Math.random() * 6 + 2;

        this.dx = (Math.random() - 0.5) * 6;
        this.dy = (Math.random() - 0.5) * 6;

        this.life = 1;

        this.color = color;
    }

    update() {

        this.x += this.dx;
        this.y += this.dy;

        this.life -= 0.02;
    }

    draw() {

        ctx.globalAlpha = this.life;

        ctx.fillStyle = this.color;

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// ================= GAME VARIABLES =================

const player = new Player();

let clones = [];

let currentRecording = [];

let cloneColors = [
    "#ff00ff",
    "#ff4444",
    "#44ff44",
    "#ffff44",
    "#00ffff",
    "#ff8800"
];

let cloneTimer = 0;
let lastTime = performance.now();
let crystals = [];
let score = 0;

const MAX_CRYSTALS = 5;


let health = 3;
let gameOver = false;

let hazards = [];

let damageCooldown = 0;

let round = 1;
let roundTimer = 0;

let currentEvent = "None";
let eventTimer = 0;
let eventDuration = 0;

let reverseControls = false;
let doubleSpeed = false;
let blackout = false;

let paused = false;

let screenShake = 0;

let highScore = localStorage.getItem("shadowEchoHighScore") || 0;

let gameStarted = false;

let particles = [];

let achievements =
    JSON.parse(
        localStorage.getItem("shadowAchievements")
    ) || {

        firstClone: false,
        score100: false,
        survive5Rounds: false
    };

let bosses = [];
let bossActive = false;


document.getElementById("highScore").textContent = highScore;
document.getElementById("health").textContent = health;
document.getElementById("round").textContent = round;


// ================= CLONE CREATION =================

function createClone() {

    // debugger;

    // Need enough data before creating
    if (currentRecording.length < 60) return;

    // Deep copy recording
    const recordingCopy = structuredClone(currentRecording);

    const color =
        cloneColors[Math.floor(Math.random() * cloneColors.length)];

    clones.push(
        new Clone(recordingCopy, color)
    );

    playSound("clone");

    // Start recording next 10 seconds
    currentRecording = [];

    document.getElementById("clones").textContent = clones.length;
}

// ================= Collision function =================

function isColliding(a, b) {

    return (
        a.x < b.x + b.size &&
        a.x + a.size > b.x &&
        a.y < b.y + b.size &&
        a.y + a.size > b.y
    );
}

//=============== Spawn crystals automatically =================

function spawnCrystals() {

    while (crystals.length < MAX_CRYSTALS) {

        crystals.push(
            new Crystal()
        );
    }
}

//================= Update crystals =================

function updateCrystals() {

    crystals.forEach((crystal, crystalIndex) => {

        crystal.update();

        // Player collection
        if (isColliding(player, crystal)) {

            crystals.splice(crystalIndex, 1);

            score += 10;

            createExplosion(
                crystal.x,
                crystal.y,
                "#00ffff"
            );

            updateHighScore();

            playSound("collect");

            document.getElementById("score").textContent = score;

            return;
        }

        // Clone collection
        clones.forEach(clone => {

            if (isColliding(clone, crystal)) {

                crystals.splice(crystalIndex, 1);

                score += 5;

                document.getElementById("score").textContent = score;
            }
        });
    });
}

//================= Draw crystals =================

function drawCrystals() {

    crystals.forEach(crystal => {
        crystal.draw();
    });
}

//================= Spawn hazards =================

function spawnHazards() {

    while (hazards.length < 3) {
        hazards.push(new Hazard());
    }
}


//================= Update hazards =================

function updateHazards(delta) {

    if (damageCooldown > 0) {
        damageCooldown -= delta;
    }

    hazards.forEach(hazard => {

        hazard.update();

        if (
            damageCooldown <= 0 &&
            isColliding(player, hazard)
        ) {

            health--;
            screenShake = 15;
            damageCooldown = 1.5;
            playSound("damage");

            document.getElementById("health").textContent = health;

            if (health <= 0) {
                gameOver = true;
                playSound("gameOver");
            }
        }
    });


}

//================= Draw hazards =================

function drawHazards() {

    hazards.forEach(hazard => {
        hazard.draw();
    });
}

//================= Add Game Over Screen =================

function drawGameOver() {

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "55px Arial";
    ctx.fillText(
        "GAME OVER",
        canvas.width / 2,
        240
    );

    ctx.font = "30px Arial";

    ctx.fillText(
        "Final Score: " + score,
        canvas.width / 2,
        320
    );

    ctx.fillText(
        "Press R to Restart",
        canvas.width / 2,
        380
    );
}


//================= Update Rounds =================

function updateRounds(delta) {

    roundTimer += delta;

    // Every 20 seconds
    if (roundTimer >= 20) {

        round++;

        if (round % 5 === 0 && !bossActive) {

            bosses.push(new Boss());

            bossActive = true;
        }

        roundTimer = 0;

        document.getElementById("round").textContent = round;

        // Increase difficulty
        hazards.push(new Hazard());

        console.log("Round:", round);
    }
}

//================= Clone Damage =================

function checkCloneDamage(delta) {

    if (damageCooldown > 0) return;

    clones.forEach(clone => {

        if (isColliding(player, clone)) {

            health--;
            createExplosion(
                player.x,
                player.y,
                "red"
            );
            screenShake = 15;

            damageCooldown = 1.5;

            playSound("damage");

            document.getElementById("health").textContent = health;

            if (health <= 0) {
                gameOver = true;
                playSound("gameOver");
            }
        }
    });
}

//================= Event System =================

function updateEvents(delta) {

    eventTimer += delta;

    // Trigger a new event every 30 seconds
    if (eventTimer >= 30 && currentEvent === "None") {

        eventTimer = 0;

        const events = [
            "Reverse Controls",
            "Double Speed",
            "Blackout"
        ];

        currentEvent =
            events[Math.floor(Math.random() * events.length)];

        document.getElementById("event").textContent = currentEvent;

        eventDuration = 10;

        switch (currentEvent) {

            case "Reverse Controls":
                reverseControls = true;
                break;

            case "Double Speed":
                doubleSpeed = true;
                break;

            case "Blackout":
                blackout = true;
                break;
        }
    }

    // Countdown active event
    if (currentEvent !== "None") {

        eventDuration -= delta;

        if (eventDuration <= 0) {

            reverseControls = false;
            doubleSpeed = false;
            blackout = false;

            currentEvent = "None";

            document.getElementById("event").textContent = currentEvent;
        }
    }
}


// =======================  particle explosions ===========

function createExplosion(x, y, color) {

    for (let i = 0; i < 20; i++) {

        particles.push(
            new Particle(x, y, color)
        );
    }
}

// =============== Update and draw particles ================

function updateParticles() {

    particles = particles.filter(
        particle => particle.life > 0
    );

    particles.forEach(particle => {
        particle.update();
    });
}

function drawParticles() {

    particles.forEach(particle => {
        particle.draw();
    });
}

// ============== Update and draw bosses ===========

function updateBosses() {

    bosses.forEach((boss, index) => {

        boss.update();

        // Clones damage boss
        clones.forEach(clone => {

            if (isColliding(clone, boss)) {

                boss.health -= 0.05;

                if (boss.health <= 0) {

                    createExplosion(
                        boss.x,
                        boss.y,
                        "#ff00ff"
                    );

                    score += 100;

                    updateHighScore();

                    bosses.splice(index, 1);

                    bossActive = false;
                }
            }
        });
    });
}

function drawBosses() {

    bosses.forEach(boss => boss.draw());
}






// ================= BACKGROUND GRID =================

function drawGrid() {

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 40) {

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 40) {

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// ================================= Creating a Sound Manager =================

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {

        case "collect":
            oscillator.frequency.value = 700;
            break;

        case "damage":
            oscillator.frequency.value = 150;
            break;

        case "clone":
            oscillator.frequency.value = 400;
            break;

        case "gameOver":
            oscillator.frequency.value = 80;
            break;
    }

    oscillator.type = "square";

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.2
    );

    oscillator.start();

    oscillator.stop(audioContext.currentTime + 0.2);
}

// ================================= Save High Score =================

function updateHighScore() {

    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "shadowEchoHighScore",
            highScore
        );

        document.getElementById("highScore").textContent =
            highScore;
    }
}

// ================================= Add Achievement =================

function checkAchievements() {

    if (!achievements.firstClone &&
        clones.length >= 1) {

        achievements.firstClone = true;
        localStorage.setItem(
            "shadowAchievements",
            JSON.stringify(achievements)
        );

        alert("Achievement Unlocked: First Echo!");
    }

    if (!achievements.score100 &&
        score >= 100) {

        achievements.score100 = true;
        localStorage.setItem(
            "shadowAchievements",
            JSON.stringify(achievements)
        );

        alert("Achievement Unlocked: Crystal Hunter!");
    }

    if (!achievements.survive5Rounds &&
        round >= 5) {

        achievements.survive5Rounds = true;
        localStorage.setItem(
            "shadowAchievements",
            JSON.stringify(achievements)
        );
        alert("Achievement Unlocked: Survivor!");
    }
}

// ================================ Draw Start Screen =================

function drawStartScreen() {

    ctx.fillStyle = "#050816";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "cyan";

    ctx.font = "60px Arial";

    ctx.fillText(
        "SHADOW ECHO",
        canvas.width / 2,
        180
    );

    ctx.font = "30px Arial";

    ctx.fillText(
        "Press SPACE to Start",
        canvas.width / 2,
        320
    );

    ctx.font = "22px Arial";

    ctx.fillText(
        "Move: WASD / Arrows",
        canvas.width / 2,
        420
    );

    ctx.fillText(
        "Pause: P",
        canvas.width / 2,
        460
    );
}

// ================================= RESTART GAME =================

function restartGame() {

    score = 0;
    health = 3;
    round = 1;

    gameOver = false;

    clones = [];
    crystals = [];
    hazards = [];

    cloneTimer = 0;
    roundTimer = 0;

    currentEvent = "None";

    reverseControls = false;
    doubleSpeed = false;
    blackout = false;

    player.x = 400;
    player.y = 300;

    document.getElementById("score").textContent = score;
    document.getElementById("health").textContent = health;
    document.getElementById("round").textContent = round;
    document.getElementById("clones").textContent = 0;
    document.getElementById("event").textContent = "None";

    requestAnimationFrame(gameLoop);
}




// ================= GAME LOOP =================

function gameLoop(timestamp) {

    if (!gameStarted) {

        drawStartScreen();

        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameOver) {

        drawGameOver();
        return;
    }

    if (paused) {

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "PAUSED",
            canvas.width / 2,
            canvas.height / 2
        );

        // Restore the screen shake transformation
        ctx.restore();
        checkAchievements();
        requestAnimationFrame(gameLoop);
        return;
    }

    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    cloneTimer += delta;
    // console.log("Clone timer:", cloneTimer);

    // Create a clone every 10 seconds
    if (cloneTimer >= 10) {

        // debugger;

        console.log("Creating clone...");

        createClone();

        cloneTimer = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    if (screenShake > 0) {

        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;

        ctx.translate(dx, dy);

        screenShake *= 0.9;
    }

    drawGrid();
    spawnCrystals();
    updateCrystals();
    drawCrystals();
    updateParticles();
    drawParticles();

    spawnHazards();
    updateHazards(delta);
    updateBosses();
    checkCloneDamage(delta);
    updateRounds(delta);
    updateEvents(delta);
    drawHazards();
    drawBosses();


    player.update();
    // console.log(currentRecording.length);

    // Update and draw all clones
    for (let clone of clones) {
        clone.update();
        clone.draw();
    }

    player.draw();

    requestAnimationFrame(gameLoop);
}


if (blackout) {

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Small light around player
    ctx.save();

    ctx.globalCompositeOperation = "destination-out";

    ctx.beginPath();
    ctx.arc(
        player.x + player.size / 2,
        player.y + player.size / 2,
        80,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

requestAnimationFrame(gameLoop);