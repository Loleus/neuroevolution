
// ═══════════════════════════════════════════════════════════════
// PODMIENIONA KLASA NET (Wagi -3 do 3)
// ═══════════════════════════════════════════════════════════════
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
            // POPRAWKA: Inicjalizacja wag w zakresie (-3, 3)
            const r = 3.0;
            const init = () => (Math.random() * 2 - 1) * r;

            this.W1 = Array.from({ length: hiddenDim }, () =>
                Array.from({ length: inDim }, init)
            );
            this.b1 = Array.from({ length: hiddenDim }, init);

            this.W2 = Array.from({ length: outDim }, () =>
                Array.from({ length: hiddenDim }, init)
            );
            this.b2 = Array.from({ length: outDim }, init);
        }
    }

    forward(x) {
        const h = new Array(this.hiddenDim);
        for (let i = 0; i < this.hiddenDim; i++) {
            let sum = this.b1[i];
            for (let j = 0; j < this.inDim; j++) {
                sum += this.W1[i][j] * x[j];
            }
            // Zmiana na Tanh (lepiej działa przy dużych wagach -3,3)
            h[i] = Math.tanh(sum); 
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
// PODMIENIONA KLASA AGENT (Mechanizm Stagnacji)
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
        this.stagnation = 0; // NOWE: licznik braku postępu
        
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

        if (this.step % 3 === 0) {
            this.path.push({ x: this.x, y: this.y });
        }

        const s = sensors(this.x, this.y);
        const out = this.net.forward(s);

        const nx = this.x + out[0] * SPEED;
        const ny = this.y + out[1] * SPEED;

        if (collides(nx, ny, this.r)) {
            if (this.step < GRACE_PERIOD) return;
            this.warnings++;
            this.warningFlash = WARNING_FLASH_FRAMES;
            if (this.warnings >= MAX_WARNINGS) { this.dead = true; return; }
            return;
        }

        this.x = nx;
        this.y = ny;

        const distToGoal = Math.hypot(this.x - goal.x, this.y - goal.y);
        
        // NOWE: Mechanizm zabijania "zamrożonych" agentów
        if (distToGoal < this.minDist - 0.5) {
            this.minDist = distToGoal;
            this.stagnation = 0;
        } else {
            this.stagnation++;
            if (this.stagnation > 90) { this.dead = true; } 
        }

        if (distToGoal <= goal.r) this.reached = true;
    }

    computeFitness() {
        if (this.reached) {
            const speedBonus = Math.max(0, 1 - (this.step / STEP_LIMIT)) * 5;
            this.fitness = 15.0 + speedBonus;
            return this.fitness;
        }

        const progress = 1 - (this.minDist / START_TO_GOAL_DIST);
        let progressScore = Math.max(0, progress) * 7.0;

        // POPRAWKA: Kara za śmierć blisko celu (zapobiega głupim skrętom)
        if (this.dead && progress > 0.85) {
            progressScore *= 0.1; 
        }

        const survivalBonus = this.warnings < MAX_WARNINGS ? 0.3 * (MAX_WARNINGS - this.warnings) / MAX_WARNINGS : 0;
        this.fitness = progressScore + survivalBonus + (this.step / STEP_LIMIT) * 0.1;
        return Math.min(this.fitness, 14.9);
    }

    draw() {
        // ... (Tu Twoja funkcja draw bez zmian)
        if (this.isElite && !this.dead && this.path.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.reached ? 'rgba(46, 204, 113, 0.5)' : 'rgba(241, 196, 15, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y);
            ctx.stroke();
        }
        ctx.beginPath();
        if (this.warningFlash > 0 && this.warningFlash % 4 < 2) {
            ctx.fillStyle = '#ff6600';
            ctx.arc(this.x, this.y, this.r + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
        }
        ctx.fillStyle = this.reached ? '#2ecc71' : (this.dead ? '#161523' : (this.isElite ? '#f1c40f' : '#ecf0f1'));
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════
// PODMIENIONA FUNKCJA MUTACJI (Limit wag -3 do 3)
// ═══════════════════════════════════════════════════════════════
function mutateWeights(w) {
    const mutationStrength = 0.4; // Zwiększona siła, by szybciej wychodzić z drgawek

    function mutMatrix(M) {
        for (let i = 0; i < M.length; i++) {
            for (let j = 0; j < M[i].length; j++) {
                if (Math.random() < MUT_RATE) {
                    M[i][j] += randn() * mutationStrength;
                    // Clamp do zakresu (-3, 3)
                    if (M[i][j] > 3) M[i][j] = 3;
                    if (M[i][j] < -3) M[i][j] = -3;
                }
            }
        }
    }

    function mutVector(v) {
        for (let i = 0; i < v.length; i++) {
            if (Math.random() < MUT_RATE) {
                v[i] += randn() * mutationStrength;
                if (v[i] > 3) v[i] = 3;
                if (v[i] < -3) v[i] = -3;
            }
        }
    }

    mutMatrix(w.W1);
    mutVector(w.b1);
    mutMatrix(w.W2);
    mutVector(w.b2);
}
