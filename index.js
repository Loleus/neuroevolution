// ═══════════════════════════════════════════════════════════════
// STAŁE GEOMETRYCZNE
// ═══════════════════════════════════════════════════════════════
const W = 320, H = 320;
const WALL_THICK = 5;
const START_R = 6;
const AGENT_R = 3;
const GOAL_R = 12;

const start = { x: WALL_THICK + START_R + 2, y: H - WALL_THICK - START_R - 2 };
const goal = { x: W - WALL_THICK - START_R - 2, y: WALL_THICK + START_R + 2, r: GOAL_R };

const START_TO_GOAL_DIST = Math.hypot(goal.x - start.x, goal.y - start.y);
const DIAGONAL = Math.hypot(W, H);

// ═══════════════════════════════════════════════════════════════
// PARAMETRY NEUROEWOLUCJI
// ═══════════════════════════════════════════════════════════════
const POP_SIZE = 100;
let HIDDEN = 8;
let MUT_RATE = 0.1;
let ELITE_COUNT = 3;
let TOUR_SIZE = 7;
let TOUR_NO_REPEAT = true;

const STEP_LIMIT = 600;
const SPEED = 1.0;

// ═══════════════════════════════════════════════════════════════
// NOWE STAŁE - SYSTEM OSTRZEŻEŃ I ŚLEDZENIA
// ═══════════════════════════════════════════════════════════════
const MAX_WARNINGS = 3;
const GRACE_PERIOD = 50;
const WARNING_FLASH_FRAMES = 8;

let elitePaths = [];
let avgGradients = { W1: null, W2: null };
let generationStats = {
    avgFitness: 0,
    maxFitness: 0,
    aliveCount: POP_SIZE,
    reachedCount: 0
};

// ═══════════════════════════════════════════════════════════════
// ELEMENTY DOM
// ═══════════════════════════════════════════════════════════════
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

const popEl = document.getElementById('pop');
const genEl = document.getElementById('gen');
const bestEl = document.getElementById('best');
const hiddenEl = document.getElementById('hidden');
const hiddenValEl = document.getElementById('hiddenVal');
const mutRateEl = document.getElementById('mutRate');
const mutRateValEl = document.getElementById('mutRateVal');
const eliteEl = document.getElementById('elite');
const eliteValEl = document.getElementById('eliteVal');
const btnRestart = document.getElementById('restart');
const btnPause = document.getElementById('pause');
const tourSizeEl = document.getElementById('tourSize');
const tourSizeValEl = document.getElementById('tourSizeVal');
const tourNoRepeatEl = document.getElementById('tourNoRepeat');
const histCanvas = document.getElementById('hist');
const hctx = histCanvas ? histCanvas.getContext('2d') : null;

popEl.textContent = POP_SIZE;

// ═══════════════════════════════════════════════════════════════
// HANDLERY UI
// ═══════════════════════════════════════════════════════════════
hiddenEl.oninput = () => {
    HIDDEN = +hiddenEl.value;
    hiddenValEl.textContent = HIDDEN;
    resetPopulation(true);
};

mutRateEl.oninput = () => {
    MUT_RATE = +mutRateEl.value / 100;
    mutRateValEl.textContent = Math.round(MUT_RATE * 100) + '%';
};

eliteEl.oninput = () => {
    ELITE_COUNT = +eliteEl.value;
    eliteValEl.textContent = ELITE_COUNT;
};

tourSizeEl.oninput = () => {
    TOUR_SIZE = +tourSizeEl.value;
    tourSizeValEl.textContent = TOUR_SIZE;
};

tourNoRepeatEl.onchange = () => {
    TOUR_NO_REPEAT = tourNoRepeatEl.checked;
};

btnRestart.onclick = () => resetPopulation(true);

let paused = false;
btnPause.onclick = () => {
    paused = !paused;
    btnPause.textContent = paused ? 'Wznów' : 'Pauza';
};

// ═══════════════════════════════════════════════════════════════
// LABIRYNT
// ═══════════════════════════════════════════════════════════════
const walls = [
    { x: 0, y: 0, w: W, h: WALL_THICK },
    { x: 0, y: H - WALL_THICK, w: W, h: WALL_THICK },
    { x: 0, y: 0, w: WALL_THICK, h: H },
    { x: W - WALL_THICK, y: 0, w: WALL_THICK, h: H },
    { x: Math.round(W * 0.2), y: Math.round(H * 0.2), w: Math.round(W * 0.6), h: WALL_THICK },
    { x: Math.round(W * 0.2), y: Math.round(H * 0.2), w: WALL_THICK, h: Math.round(H * 0.6) },
    { x: Math.round(W * 0.4), y: Math.round(H * 0.55), w: Math.round(W * 0.4), h: WALL_THICK },
    { x: Math.round(W * 0.7), y: Math.round(H * 0.2), w: WALL_THICK, h: Math.round(H * 0.4) },
];

// ═══════════════════════════════════════════════════════════════
// DETEKCJA KOLIZJI
// ═══════════════════════════════════════════════════════════════
function collides(x, y, r = AGENT_R) {
    for (const w of walls) {
        const nearestX = Math.max(w.x, Math.min(x, w.x + w.w));
        const nearestY = Math.max(w.y, Math.min(y, w.y + w.h));
        const dx = x - nearestX;
        const dy = y - nearestY;
        if (dx * dx + dy * dy <= r * r) return true;
    }

    if (x < WALL_THICK + r || x > W - WALL_THICK - r ||
        y < WALL_THICK + r || y > H - WALL_THICK - r) {
        return true;
    }

    return false;
}

// ═══════════════════════════════════════════════════════════════
// SIEĆ NEURONOWA
// ═══════════════════════════════════════════════════════════════
function randn() {
    const u = Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u + 1e-10)) * Math.cos(2 * Math.PI * v);
}

class Net {
    constructor(inDim = 6, hiddenDim = HIDDEN, outDim = 2, weights = null) {
        this.inDim = inDim;
        this.hiddenDim = hiddenDim;
        this.outDim = outDim;

        if (weights) {
            this.W1 = weights.W1;
            this.b1 = weights.b1;
            this.W2 = weights.W2;
            this.b2 = weights.b2;
        } else {
            const scale1 = Math.sqrt(2.0 / (inDim + hiddenDim));
            const scale2 = Math.sqrt(2.0 / (hiddenDim + outDim));

            this.W1 = Array.from({ length: hiddenDim }, () =>
                Array.from({ length: inDim }, () => randn() * scale1)
            );
            this.b1 = Array.from({ length: hiddenDim }, () => 0);

            this.W2 = Array.from({ length: outDim }, () =>
                Array.from({ length: hiddenDim }, () => randn() * scale2)
            );
            this.b2 = Array.from({ length: outDim }, () => 0);
        }
    }

    forward(x) {
        const h = new Array(this.hiddenDim);
        for (let i = 0; i < this.hiddenDim; i++) {
            let sum = this.b1[i];
            for (let j = 0; j < this.inDim; j++) {
                sum += this.W1[i][j] * x[j];
            }
            h[i] = sum > 0 ? sum : 0;
        }

        const y = new Array(this.outDim);
        for (let i = 0; i < this.outDim; i++) {
            let sum = this.b2[i];
            for (let j = 0; j < this.hiddenDim; j++) {
                sum += this.W2[i][j] * h[j];
            }
            y[i] = Math.tanh(sum);
        }

        return y;
    }

    copyWeights() {
        return {
            W1: this.W1.map(row => [...row]),
            b1: [...this.b1],
            W2: this.W2.map(row => [...row]),
            b2: [...this.b2],
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// SENSORY
// ═══════════════════════════════════════════════════════════════
function rayDistance(x, y, dirX, dirY) {
    const step = 1.5;
    const maxDist = DIAGONAL;
    let dist = 0;
    let cx = x, cy = y;

    while (dist < maxDist) {
        cx += dirX * step;
        cy += dirY * step;
        dist += step;
        if (collides(cx, cy, 0.5)) break;
    }

    return Math.min(1.0, dist / maxDist);
}

function sensors(ax, ay) {
    const up = rayDistance(ax, ay, 0, -1);
    const down = rayDistance(ax, ay, 0, +1);
    const left = rayDistance(ax, ay, -1, 0);
    const right = rayDistance(ax, ay, +1, 0);

    const vx = goal.x - ax;
    const vy = goal.y - ay;
    const norm = Math.hypot(vx, vy) + 1e-8;
    const gx = vx / norm;
    const gy = vy / norm;

    return [up, down, left, right, gx, gy];
}

// ═══════════════════════════════════════════════════════════════
// AGENT
// ═══════════════════════════════════════════════════════════════
class Agent {
    constructor(net = null) {
        this.x = start.x;
        this.y = start.y;
        this.r = AGENT_R;
        this.dead = false;
        this.reached = false;
        this.step = 0;
        this.net = net || new Net();
        this.fitness = 0;
        this.minDist = START_TO_GOAL_DIST;
        this.warnings = 0;
        this.warningFlash = 0;
        this.path = [];
        this.isElite = false;
    }

    update() {
        if (this.dead || this.reached) return;

        if (this.step++ > STEP_LIMIT) {
            this.dead = true;
            return;
        }

        // Zapisuj ścieżkę co 3 kroki
        if (this.step % 3 === 0) {
            this.path.push({ x: this.x, y: this.y });
        }

        if (this.warningFlash > 0) this.warningFlash--;

        const s = sensors(this.x, this.y);
        const out = this.net.forward(s);

        const nx = this.x + out[0] * SPEED;
        const ny = this.y + out[1] * SPEED;

        // SYSTEM OSTRZEŻEŃ
        if (collides(nx, ny, this.r)) {
            // Okres ochronny na starcie
            if (this.step < GRACE_PERIOD) {
                const safeRadius = 8;
                for (let attempts = 0; attempts < 10; attempts++) {
                    const newX = start.x + (Math.random() - 0.5) * safeRadius;
                    const newY = start.y + (Math.random() - 0.5) * safeRadius;
                    if (!collides(newX, newY, this.r)) {
                        this.x = newX;
                        this.y = newY;
                        break;
                    }
                }
                return;
            }
            
            this.warnings++;
            this.warningFlash = WARNING_FLASH_FRAMES;
            
            if (this.warnings >= MAX_WARNINGS) {
                this.dead = true;
                return;
            }
            
            // Próba odbicia
            const escapeX = this.x - out[0] * SPEED * 0.8;
            const escapeY = this.y - out[1] * SPEED * 0.8;
            
            if (!collides(escapeX, escapeY, this.r)) {
                this.x = escapeX;
                this.y = escapeY;
            } else {
                // Ruch boczny
                const sideX1 = this.x + out[1] * SPEED * 0.5;
                const sideY1 = this.y - out[0] * SPEED * 0.5;
                const sideX2 = this.x - out[1] * SPEED * 0.5;
                const sideY2 = this.y + out[0] * SPEED * 0.5;
                
                if (!collides(sideX1, sideY1, this.r)) {
                    this.x = sideX1;
                    this.y = sideY1;
                } else if (!collides(sideX2, sideY2, this.r)) {
                    this.x = sideX2;
                    this.y = sideY2;
                }
            }
            return;
        }

        this.x = nx;
        this.y = ny;

        const distToGoal = Math.hypot(this.x - goal.x, this.y - goal.y);
        if (distToGoal < this.minDist) {
            this.minDist = distToGoal;
        }

        if (distToGoal <= goal.r) {
            this.reached = true;
        }
    }

    computeFitness() {
        if (this.reached) {
            const speedBonus = Math.max(0, 1 - (this.step / STEP_LIMIT));
            this.fitness = 10.0 + speedBonus;
            this.fitness += (STEP_LIMIT - this.step) / STEP_LIMIT * 0.1;
            return this.fitness;
        }
    
        const currentDist = Math.hypot(this.x - goal.x, this.y - goal.y);
        const bestProgress = 1 - (this.minDist / START_TO_GOAL_DIST);
        const currentProgress = 1 - (currentDist / START_TO_GOAL_DIST);
        // Ważona kombinacja: 60% najlepsza, 40% aktualna
        const progress = bestProgress * 0.6 + currentProgress * 0.4;
        const progressScore = Math.max(0, progress) * 8.0;
    
        const aliveBonus = this.dead ? 0 : 0.3;
        const exploreBonus = progress * (this.step / STEP_LIMIT) * 0.2;
        const survivalBonus = this.warnings < MAX_WARNINGS ? 0.2 * (MAX_WARNINGS - this.warnings) / MAX_WARNINGS : 0;
        // WAŻNE: Bonus za bycie blisko celu w końcowej fazie (zachęca do dalszego ruchu)
        const proximityBonus = currentProgress > 0.5 ? (currentProgress - 0.5) * 3.0 : 0;
    
        this.fitness = progressScore + aliveBonus + exploreBonus + survivalBonus + proximityBonus;
        this.fitness = Math.min(this.fitness, 9.90);
    
        return this.fitness;
    }

    draw() {
        // Ścieżka elity
        if (this.isElite && !this.dead && this.path.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.reached ? 'rgba(46, 204, 113, 0.5)' : 'rgba(241, 196, 15, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.stroke();
        }

        ctx.beginPath();
        
        // Miganie przy ostrzeżeniu
        if (this.warningFlash > 0 && this.warningFlash % 4 < 2) {
            ctx.fillStyle = this.warnings >= MAX_WARNINGS - 1 ? '#ff3300' : '#ff6600';
            ctx.arc(this.x, this.y, this.r + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
        }
        
        if (this.reached) {
            ctx.fillStyle = '#2ecc71';
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        } else if (this.dead) {
            ctx.fillStyle = '#161523';
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        } else if (this.isElite) {
            ctx.fillStyle = '#f1c40f';
            ctx.arc(this.x, this.y, this.r + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = '#c0a000';
            ctx.lineWidth = 1;
            ctx.arc(this.x, this.y, this.r + 1, 0, Math.PI * 2);
            ctx.stroke();
            return;
        } else {
            const warningIntensity = this.warnings / MAX_WARNINGS;
            const r = Math.floor(224 + warningIntensity * 31);
            const g = Math.floor(224 - warningIntensity * 140);
            const b = Math.floor(224 - warningIntensity * 140);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        }
        ctx.fill();

        // Kropki ostrzeżeń
        if (this.warnings > 0 && !this.dead && !this.reached) {
            for (let i = 0; i < this.warnings; i++) {
                ctx.beginPath();
                ctx.fillStyle = '#ff0000';
                const offsetX = (i - (this.warnings - 1) / 2) * 4;
                ctx.arc(this.x + offsetX, this.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// RYSOWANIE
// ═══════════════════════════════════════════════════════════════
function drawMaze() {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, W, H);

    ctx.beginPath();
    ctx.fillStyle = '#2ecc71';
    ctx.arc(goal.x, goal.y, goal.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#3498db';
    ctx.arc(start.x, start.y, START_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#777';
    for (const w of walls) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
    }
}

function drawElitePaths() {
    const colors = [
        'rgba(241, 196, 15, 0.3)',
        'rgba(231, 76, 60, 0.25)',
        'rgba(155, 89, 182, 0.2)'
    ];
    
    for (let i = 0; i < elitePaths.length && i < ELITE_COUNT; i++) {
        const path = elitePaths[i];
        if (path.length < 2) continue;
        
        ctx.beginPath();
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2 - i * 0.4;
        ctx.setLineDash([4, 4]);
        
        ctx.moveTo(path[0].x, path[0].y);
        for (let j = 1; j < path.length; j++) {
            ctx.lineTo(path[j].x, path[j].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        if (path.length > 0) {
            const last = path[path.length - 1];
            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length].replace(/[\d.]+\)$/, '0.6)');
            ctx.arc(last.x, last.y, 3 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawNetworkInfo() {
    const panelX = 5;
    const panelY = 5;
    const panelW = 90;
    const panelH = 58;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);
    
    ctx.font = '11px "Noto Sans"';

    ctx.fillStyle = generationStats.reachedCount > 0 ? '#e30606' : '#bbb';
    ctx.fillText(`Goal: ${generationStats.reachedCount}`, panelX + 4, panelY + 12);
    ctx.fillStyle = '#bbb';
    ctx.fillText(`Avg: ${generationStats.avgFitness.toFixed(2)}`, panelX + 4, panelY + 24);
    if (avgGradients.W1 !== null) {
        ctx.fillStyle = '#888';
        ctx.font = '8px "Noto Sans"';
        ctx.fillText('W1:', panelX + 4, panelY + 37);
        drawGradientBar(panelX + 22, panelY + 31, 62, 7, avgGradients.W1);
        
        ctx.fillText('W2:', panelX + 4, panelY + 51);
        drawGradientBar(panelX + 22, panelY + 45, 62, 7, avgGradients.W2);
    }
}

function drawGradientBar(x, y, w, h, magnitude) {
    const norm = Math.min(1, magnitude / 2);
    
    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    ctx.fillRect(x, y, w, h);
    
    let r, g, b;
    if (norm < 0.5) {
        const t = norm * 2;
        r = Math.floor(50 * t);
        g = Math.floor(150 + 105 * t);
        b = Math.floor(255 * (1 - t));
    } else {
        const t = (norm - 0.5) * 2;
        r = Math.floor(50 + 205 * t);
        g = Math.floor(255 * (1 - t));
        b = 0;
    }
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, w * norm, h);
    
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
}

// ═══════════════════════════════════════════════════════════════
// HISTOGRAM ROZKŁADU FITNESS
// ═══════════════════════════════════════════════════════════════
function drawFitnessHistogram(pop) {
    if (!hctx || !histCanvas) return;

    const bins = 20;
    const counts = new Array(bins).fill(0);

    let minF = Infinity, maxF = -Infinity;
    for (const a of pop) {
        const v = a.fitness;
        if (v < minF) minF = v;
        if (v > maxF) maxF = v;
    }

    const range = Math.max(1e-8, maxF - minF);
    for (const a of pop) {
        const norm = (a.fitness - minF) / range;
        const v = Math.max(0, Math.min(1, norm));
        let idx = Math.floor(v * bins);
        if (idx >= bins) idx = bins - 1;
        counts[idx]++;
    }

    const cw = histCanvas.width, ch = histCanvas.height;
    hctx.clearRect(0, 0, cw, ch);

    hctx.fillStyle = '#0b192b';
    hctx.fillRect(0, 0, cw, ch);

    const maxC = Math.max(1, ...counts);
    const barW = cw / bins;

    const gradient = hctx.createLinearGradient(0, 20, 0, ch - 20);
    gradient.addColorStop(0, '#22cd00');
    gradient.addColorStop(1, '#0060df');

    for (let i = 0; i < bins; i++) {
        const h = (counts[i] / maxC) * (ch - 40);
        const x = i * barW;
        const y = (ch - 20) - h;
        hctx.fillStyle = gradient;
        hctx.fillRect(x + 1, y, Math.max(1, barW - 2), h);
    }

    hctx.fillStyle = '#1ccf00';
    hctx.font = '12px sans-serif';
    hctx.textAlign = 'center';
    hctx.fillText('ROZKŁAD FITNESS', cw / 2, 15);
    hctx.font = '10px sans-serif';
    hctx.fillStyle = '#fff';
    const fmt = v => (v === 0 || Object.is(v, -0) ? 0 : v).toFixed(1);
    hctx.fillText(fmt(minF), barW * 0.5, ch - 6);
    hctx.fillText(fmt((minF + maxF) / 2), cw / 2, ch - 6);
    hctx.fillText(fmt(maxF), cw - barW * 0.6, ch - 6);
}

function computeAverageGradients(eliteAgents) {
    if (eliteAgents.length === 0) return;
    
    let sumW1 = 0, countW1 = 0;
    let sumW2 = 0, countW2 = 0;
    
    for (const agent of eliteAgents) {
        const net = agent.net;
        
        for (const row of net.W1) {
            for (const val of row) {
                sumW1 += val * val;
                countW1++;
            }
        }
        
        for (const row of net.W2) {
            for (const val of row) {
                sumW2 += val * val;
                countW2++;
            }
        }
    }
    
    avgGradients.W1 = Math.sqrt(sumW1 / countW1);
    avgGradients.W2 = Math.sqrt(sumW2 / countW2);
}

// ═══════════════════════════════════════════════════════════════
// OPERATORY GENETYCZNE - MUSZĄ BYĆ PRZED evolve()
// ═══════════════════════════════════════════════════════════════
function pickTournament(pop, k = TOUR_SIZE, noRepeat = TOUR_NO_REPEAT) {
    const n = pop.length;

    if (!noRepeat) {
        let best = null;
        for (let i = 0; i < k; i++) {
            const idx = Math.floor(Math.random() * n);
            const cand = pop[idx];
            if (!best || cand.fitness > best.fitness) {
                best = cand;
            }
        }
        return best;
    }

    const effectiveK = Math.min(k, n);
    const used = new Set();
    let best = null;

    while (used.size < effectiveK) {
        const idx = Math.floor(Math.random() * n);
        if (used.has(idx)) continue;
        used.add(idx);

        const cand = pop[idx];
        if (!best || cand.fitness > best.fitness) {
            best = cand;
        }
    }

    return best;
}

function crossoverWeights(w1, w2) {
    function mixMatrix(A, B) {
        return A.map((row, i) =>
            row.map((val, j) => (Math.random() < 0.5 ? val : B[i][j]))
        );
    }

    function mixVector(a, b) {
        return a.map((val, i) => (Math.random() < 0.5 ? val : b[i]));
    }

    return {
        W1: mixMatrix(w1.W1, w2.W1),
        b1: mixVector(w1.b1, w2.b1),
        W2: mixMatrix(w1.W2, w2.W2),
        b2: mixVector(w1.b2, w2.b2),
    };
}

function mutateWeights(w, multiplier = 1.) {
    const baseStrength = 0.3;
    const decayFactor = Math.exp(-generation / 500);
    const minStrength = 0.1;
    const baseMutationStrength = Math.max(minStrength, baseStrength * decayFactor * multiplier);
    
    // Oblicz średnie wartości bezwzględne wag dla każdej warstwy
    let sumW1 = 0, countW1 = 0;
    let sumW2 = 0, countW2 = 0;
    let sumB1 = 0, countB1 = 0;
    let sumB2 = 0, countB2 = 0;
    
    for (let i = 0; i < w.W1.length; i++) {
        for (let j = 0; j < w.W1[i].length; j++) {
            sumW1 += Math.abs(w.W1[i][j]);
            countW1++;
        }
    }
    for (let i = 0; i < w.W2.length; i++) {
        for (let j = 0; j < w.W2[i].length; j++) {
            sumW2 += Math.abs(w.W2[i][j]);
            countW2++;
        }
    }
    for (let i = 0; i < w.b1.length; i++) {
        sumB1 += Math.abs(w.b1[i]);
        countB1++;
    }
    for (let i = 0; i < w.b2.length; i++) {
        sumB2 += Math.abs(w.b2[i]);
        countB2++;
    }
    
    const avgW1 = sumW1 / countW1 || 0.38; // fallback do wartości początkowej
    const avgW2 = sumW2 / countW2 || 0.45;
    const avgB1 = sumB1 / countB1 || 0.0;
    const avgB2 = sumB2 / countB2 || 0.0;
    
    // Normalizacja mutacji względem średniej wartości warstwy
    const normW1 = baseMutationStrength * (avgW1 / 0.4); // 0.4 to referencyjna średnia
    const normW2 = baseMutationStrength * (avgW2 / 0.4);
    const normB1 = baseMutationStrength * (Math.max(avgB1, 0.1) / 0.1);
    const normB2 = baseMutationStrength * (Math.max(avgB2, 0.1) / 0.1);
    
    function mutMatrix(M, normalizedStrength) {
        for (let i = 0; i < M.length; i++) {
            for (let j = 0; j < M[i].length; j++) {
                if (Math.random() < MUT_RATE) {
                    // Bezwzględna mutacja znormalizowana względem średniej warstwy
                    M[i][j] += randn() * normalizedStrength;
                }
            }
        }
    }

    function mutVector(v, normalizedStrength) {
        for (let i = 0; i < v.length; i++) {
            if (Math.random() < MUT_RATE) {
                v[i] += randn() * normalizedStrength;
            }
        }
    }

    mutMatrix(w.W1, normW1);
    mutVector(w.b1, normB1);
    mutMatrix(w.W2, normW2);
    mutVector(w.b2, normB2);
}

// ═══════════════════════════════════════════════════════════════
// POPULACJA I EWOLUCJA
// ═══════════════════════════════════════════════════════════════
let population = [];
let generation = 0;
let bestFitness = 0;

function resetPopulation(hard = false) {
    if (hard) {
        generation = 0;
        elitePaths = [];
        avgGradients = { W1: null, W2: null };
        generationStats = { avgFitness: 0, maxFitness: 0, aliveCount: POP_SIZE, reachedCount: 0 };
        if (hctx && histCanvas) {
            hctx.clearRect(0, 0, histCanvas.width, histCanvas.height);
            hctx.fillStyle = '#0b192b';
            hctx.fillRect(0, 0, histCanvas.width, histCanvas.height);
        }
    }
    population = Array.from({ length: POP_SIZE }, () => new Agent(new Net(6, HIDDEN, 2)));
    bestFitness = 0;
    genEl.textContent = generation;
    bestEl.textContent = bestFitness.toFixed(3);
    if (hctx && histCanvas) {
        drawFitnessHistogram(population);
    }
}

function evolve() {
    let best = null;
    let totalFitness = 0;
    let aliveCount = 0;
    let reachedCount = 0;
    
    for (const agent of population) {
        agent.computeFitness();
        totalFitness += agent.fitness;
        if (!agent.dead) aliveCount++;
        if (agent.reached) reachedCount++;
        if (!best || agent.fitness > best.fitness) {
            best = agent;
        }
    }
    bestFitness = best.fitness;

    generationStats = {
        avgFitness: totalFitness / population.length,
        maxFitness: bestFitness,
        aliveCount: aliveCount,
        reachedCount: reachedCount
    };

    drawFitnessHistogram(population);

    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
    const nextGen = [];

    const eliteCount = generation > 50 ? Math.max(1, Math.floor(ELITE_COUNT * 0.7)) : ELITE_COUNT;
    
    elitePaths = [];
    for (let i = 0; i < eliteCount; i++) {
        if (sorted[i].path.length > 0) {
            elitePaths.push([...sorted[i].path]);
        }
    }
    
    computeAverageGradients(sorted.slice(0, eliteCount));

    for (let i = 0; i < eliteCount; i++) {
        const weights = sorted[i].net.copyWeights();
        if (sorted[i].fitness > 9.0 && !sorted[i].reached) {
            // Mała mutacja elity (5% normalnej siły) - tylko dla eksploracji
            const eliteMutationStrength = 0.05; // 5% normalnej mutacji
            mutateWeights(weights, eliteMutationStrength / 0.3); // Przeskaluj do odpowiedniej wartości
        }
        const eliteAgent = new Agent(new Net(6, HIDDEN, 2, weights));
        eliteAgent.isElite = true;
        nextGen.push(eliteAgent);
    }
    const stagnationFactor = bestFitness < 6.0 && generation > 30 ? 1.8 : 1.0;
    while (nextGen.length < POP_SIZE) {
        const parent1 = pickTournament(population);
        const parent2 = pickTournament(population);

        const childWeights = crossoverWeights(
            parent1.net.copyWeights(),
            parent2.net.copyWeights()
        );

        mutateWeights(childWeights, stagnationFactor);
        nextGen.push(new Agent(new Net(6, HIDDEN, 2, childWeights)));
    }

    population = nextGen;
    generation++;
    genEl.textContent = generation;
}

// ═══════════════════════════════════════════════════════════════
// PĘTLA GŁÓWNA
// ═══════════════════════════════════════════════════════════════
let frameCount = 0;

function loop() {
    drawMaze();
    drawElitePaths();

    for (const agent of population) {
        if (!paused) agent.update();
        agent.draw();
    }
    
    drawNetworkInfo();

    if (!paused) {
        frameCount++;
        
        let alive = 0, reached = 0;
        for (const a of population) {
            if (!a.dead) alive++;
            if (a.reached) reached++;
        }
        generationStats.aliveCount = alive;
        generationStats.reachedCount = reached;

        const allDone = population.every(a => a.dead || a.reached);
        const timeUp = frameCount >= STEP_LIMIT;
        popEl.textContent = alive;
        if (allDone || timeUp) {
            evolve();
            bestEl.textContent = bestFitness.toFixed(3);

            frameCount = 0;
            for (const agent of population) {
                agent.x = start.x;
                agent.y = start.y;
                agent.step = 0;
                agent.dead = false;
                agent.reached = false;
                agent.minDist = START_TO_GOAL_DIST;
                agent.warnings = 0;
                agent.warningFlash = 0;
                agent.path = [];
            }
        }
    }

    requestAnimationFrame(loop);
}

resetPopulation();
loop();
