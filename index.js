// // ═══════════════════════════════════════════════════════════════
// // STAŁE GEOMETRYCZNE
// // ═══════════════════════════════════════════════════════════════
// const W = 280, H = 280;
// const WALL_THICK = 5;
// const START_R = 6;      // promień markera startu i celu
// const AGENT_R = 3;      // promień agenta
// const GOAL_R = 12;      // promień strefy celu (do osiągnięcia)

// // Pozycje w narożnikach
// const start = { x: WALL_THICK + START_R + 2, y: H - WALL_THICK - START_R - 2 };
// const goal = { x: W - WALL_THICK - START_R - 2, y: WALL_THICK + START_R + 2, r: GOAL_R };

// // Dystans referencyjny do normalizacji fitness
// const START_TO_GOAL_DIST = Math.hypot(goal.x - start.x, goal.y - start.y);
// const DIAGONAL = Math.hypot(W, H);

// // ═══════════════════════════════════════════════════════════════
// // PARAMETRY NEUROEWOLUCJI
// // ═══════════════════════════════════════════════════════════════
// const POP_SIZE = 100;
// let HIDDEN = 8;
// let MUT_RATE = 0.1;
// let ELITE_COUNT = 3;
// let TOUR_SIZE = 5;
// let TOUR_NO_REPEAT = true;

// const STEP_LIMIT = 600;   // mniej kroków dla mniejszego canvasa
// const SPEED = 1.0;        // wolniej = precyzyjniej

// // ═══════════════════════════════════════════════════════════════
// // ELEMENTY DOM
// // ═══════════════════════════════════════════════════════════════
// const cv = document.getElementById('cv');
// const ctx = cv.getContext('2d');

// const popEl = document.getElementById('pop');
// const genEl = document.getElementById('gen');
// const bestEl = document.getElementById('best');
// const hiddenEl = document.getElementById('hidden');
// const hiddenValEl = document.getElementById('hiddenVal');
// const mutRateEl = document.getElementById('mutRate');
// const mutRateValEl = document.getElementById('mutRateVal');
// const eliteEl = document.getElementById('elite');
// const eliteValEl = document.getElementById('eliteVal');
// const btnRestart = document.getElementById('restart');
// const btnPause = document.getElementById('pause');
// const tourSizeEl = document.getElementById('tourSize');
// const tourSizeValEl = document.getElementById('tourSizeVal');
// const tourNoRepeatEl = document.getElementById('tourNoRepeat');

// popEl.textContent = POP_SIZE;

// // ═══════════════════════════════════════════════════════════════
// // HANDLERY UI
// // ═══════════════════════════════════════════════════════════════
// hiddenEl.oninput = () => {
//     HIDDEN = +hiddenEl.value;
//     hiddenValEl.textContent = HIDDEN;
//     resetPopulation(true);
// };

// mutRateEl.oninput = () => {
//     MUT_RATE = +mutRateEl.value / 100;
//     mutRateValEl.textContent = Math.round(MUT_RATE * 100) + '%';
// };

// eliteEl.oninput = () => {
//     ELITE_COUNT = +eliteEl.value;
//     eliteValEl.textContent = ELITE_COUNT;
// };

// tourSizeEl.oninput = () => {
//     TOUR_SIZE = +tourSizeEl.value;
//     tourSizeValEl.textContent = TOUR_SIZE;
// };

// tourNoRepeatEl.onchange = () => {
//     TOUR_NO_REPEAT = tourNoRepeatEl.checked;
// };

// btnRestart.onclick = () => resetPopulation(true);

// let paused = false;
// btnPause.onclick = () => {
//     paused = !paused;
//     btnPause.textContent = paused ? 'Wznów' : 'Pauza';
// };

// // ═══════════════════════════════════════════════════════════════
// // LABIRYNT - proporcjonalny układ
// // ═══════════════════════════════════════════════════════════════
// const walls = [
//     // ══ Ściany zewnętrzne ══
//     { x: 0, y: 0, w: W, h: WALL_THICK },                    // góra
//     { x: 0, y: H - WALL_THICK, w: W, h: WALL_THICK },       // dół
//     { x: 0, y: 0, w: WALL_THICK, h: H },                    // lewo
//     { x: W - WALL_THICK, y: 0, w: WALL_THICK, h: H },       // prawo

//     // wewnętrzne, prosty układ w środku canvasu
//     {
//         x: Math.round(W * 0.2),
//         y: Math.round(H * 0.2),
//         w: Math.round(W * 0.6),
//         h: WALL_THICK
//     },
//     { x: Math.round(W * 0.2), y: Math.round(H * 0.2), w: WALL_THICK, h: Math.round(H * 0.6) },
//     { x: Math.round(W * 0.4), y: Math.round(H * 0.55), w: Math.round(W * 0.4), h: WALL_THICK },
//     { x: Math.round(W * 0.7), y: Math.round(H * 0.2), w: WALL_THICK, h: Math.round(H * 0.4) },
// ];

// // ═══════════════════════════════════════════════════════════════
// // RYSOWANIE
// // ═══════════════════════════════════════════════════════════════
// function drawMaze() {
//     // Tło
//     ctx.fillStyle = '#333';
//     ctx.fillRect(0, 0, W, H);

//     // Cel (zielony okrąg)
//     ctx.beginPath();
//     ctx.fillStyle = '#2ecc71';
//     ctx.arc(goal.x, goal.y, goal.r, 0, Math.PI * 2);
//     ctx.fill();

//     // Start (niebieski okrąg)
//     ctx.beginPath();
//     ctx.fillStyle = '#3498db';
//     ctx.arc(start.x, start.y, START_R, 0, Math.PI * 2);
//     ctx.fill();

//     // Ściany
//     ctx.fillStyle = '#777';
//     for (const w of walls) {
//         ctx.fillRect(w.x, w.y, w.w, w.h);
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// // DETEKCJA KOLIZJI
// // Sprawdza czy okrąg (x,y,r) koliduje z którąkolwiek ścianą
// // Algorytm: znajdź najbliższy punkt prostokąta do środka okręgu
// // ═══════════════════════════════════════════════════════════════
// function collides(x, y, r = AGENT_R) {
//     for (const w of walls) {
//         // Najbliższy punkt na prostokącie do punktu (x, y)
//         const nearestX = Math.max(w.x, Math.min(x, w.x + w.w));
//         const nearestY = Math.max(w.y, Math.min(y, w.y + w.h));

//         // Dystans od środka okręgu do najbliższego punktu
//         const dx = x - nearestX;
//         const dy = y - nearestY;

//         if (dx * dx + dy * dy <= r * r) return true;
//     }

//     // Dodatkowe sprawdzenie granic (margines bezpieczeństwa)
//     if (x < WALL_THICK + r || x > W - WALL_THICK - r ||
//         y < WALL_THICK + r || y > H - WALL_THICK - r) {
//         return true;
//     }

//     return false;
// }

// // ═══════════════════════════════════════════════════════════════
// // SIEĆ NEURONOWA
// // Architektura: 6 → HIDDEN → 2
// // Wejścia: [ray_up, ray_down, ray_left, ray_right, goal_dx, goal_dy]
// // Wyjścia: [move_dx, move_dy] ∈ [-1, 1] (tanh)
// // ═══════════════════════════════════════════════════════════════

// // Generator liczb z rozkładu normalnego (Box-Muller)
// function randn() {
//     const u = Math.random();
//     const v = Math.random();
//     return Math.sqrt(-2 * Math.log(u + 1e-10)) * Math.cos(2 * Math.PI * v);
// }

// class Net {
//     constructor(inDim = 6, hiddenDim = HIDDEN, outDim = 2, weights = null) {
//         this.inDim = inDim;
//         this.hiddenDim = hiddenDim;
//         this.outDim = outDim;

//         if (weights) {
//             // Kopiuj istniejące wagi
//             this.W1 = weights.W1;
//             this.b1 = weights.b1;
//             this.W2 = weights.W2;
//             this.b2 = weights.b2;
//         } else {
//             // Inicjalizacja Xavier/Glorot - lepsza zbieżność
//             const scale1 = Math.sqrt(2.0 / (inDim + hiddenDim));
//             const scale2 = Math.sqrt(2.0 / (hiddenDim + outDim));

//             this.W1 = Array.from({ length: hiddenDim }, () =>
//                 Array.from({ length: inDim }, () => randn() * scale1)
//             );
//             this.b1 = Array.from({ length: hiddenDim }, () => 0);

//             this.W2 = Array.from({ length: outDim }, () =>
//                 Array.from({ length: hiddenDim }, () => randn() * scale2)
//             );
//             this.b2 = Array.from({ length: outDim }, () => 0);
//         }
//     }

//     forward(x) {
//         // Warstwa ukryta: ReLU(W1 · x + b1)
//         const h = new Array(this.hiddenDim);
//         for (let i = 0; i < this.hiddenDim; i++) {
//             let sum = this.b1[i];
//             for (let j = 0; j < this.inDim; j++) {
//                 sum += this.W1[i][j] * x[j];
//             }
//             h[i] = sum > 0 ? sum : 0;  // ReLU
//         }

//         // Warstwa wyjściowa: tanh(W2 · h + b2)
//         const y = new Array(this.outDim);
//         for (let i = 0; i < this.outDim; i++) {
//             let sum = this.b2[i];
//             for (let j = 0; j < this.hiddenDim; j++) {
//                 sum += this.W2[i][j] * h[j];
//             }
//             y[i] = Math.tanh(sum);  // tanh → [-1, 1]
//         }

//         return y;
//     }

//     copyWeights() {
//         return {
//             W1: this.W1.map(row => [...row]),
//             b1: [...this.b1],
//             W2: this.W2.map(row => [...row]),
//             b2: [...this.b2],
//         };
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// // SENSORY - raycasting
// // Zwraca znormalizowaną odległość do ściany w danym kierunku
// // ═══════════════════════════════════════════════════════════════
// function rayDistance(x, y, dirX, dirY) {
//     const step = 1.5;  // mały krok dla precyzji w małym canvasie
//     const maxDist = DIAGONAL;
//     let dist = 0;
//     let cx = x, cy = y;

//     while (dist < maxDist) {
//         cx += dirX * step;
//         cy += dirY * step;
//         dist += step;

//         if (collides(cx, cy, 0.5)) break;
//     }

//     // Normalizacja do [0, 1]: 0 = blisko ściany, 1 = daleko
//     return Math.min(1.0, dist / maxDist);
// }

// function sensors(ax, ay) {
//     // Ray-casting w 4 kierunkach
//     const up = rayDistance(ax, ay, 0, -1);
//     const down = rayDistance(ax, ay, 0, +1);
//     const left = rayDistance(ax, ay, -1, 0);
//     const right = rayDistance(ax, ay, +1, 0);

//     // Wektor do celu (znormalizowany do jednostkowego)
//     const vx = goal.x - ax;
//     const vy = goal.y - ay;
//     const norm = Math.hypot(vx, vy) + 1e-8;
//     const gx = vx / norm;  // ∈ [-1, 1]
//     const gy = vy / norm;  // ∈ [-1, 1]

//     return [up, down, left, right, gx, gy];
// }

// // ═══════════════════════════════════════════════════════════════
// // AGENT
// // ═══════════════════════════════════════════════════════════════
// class Agent {
//     constructor(net = null) {
//         this.x = start.x;
//         this.y = start.y;
//         this.r = AGENT_R;
//         this.dead = false;
//         this.reached = false;
//         this.step = 0;
//         this.net = net || new Net();
//         this.fitness = 0;
//         this.minDist = START_TO_GOAL_DIST;  // śledzenie najlepszego postępu
//     }

//     update() {
//         if (this.dead || this.reached) return;

//         if (this.step++ > STEP_LIMIT) {
//             this.dead = true;
//             return;
//         }

//         // Odczytaj sensory i wykonaj forward pass
//         const s = sensors(this.x, this.y);
//         const out = this.net.forward(s);

//         // Oblicz nową pozycję
//         const nx = this.x + out[0] * SPEED;
//         const ny = this.y + out[1] * SPEED;

//         // Sprawdź kolizję
//         if (collides(nx, ny, this.r)) {
//             this.dead = true;
//             return;
//         }

//         // Zaktualizuj pozycję
//         this.x = nx;
//         this.y = ny;

//         // Śledź minimalny dystans do celu
//         const distToGoal = Math.hypot(this.x - goal.x, this.y - goal.y);
//         if (distToGoal < this.minDist) {
//             this.minDist = distToGoal;
//         }

//         // Sprawdź osiągnięcie celu
//         if (distToGoal <= goal.r) {
//             this.reached = true;
//         }
//     }

//     computeFitness() {
//         // Jeśli osiągnął cel: baza + umiarkowany bonus za szybkość
//         if (this.reached) {
//             // Bazowy wysoki fitness (zostawiamy 10) + speedBonus maksymalnie 2 → max = 12
//             const speedBonus = Math.max(0, 1 - (this.step / STEP_LIMIT)) * 2;
//             this.fitness = 10.0 + speedBonus;
//             // Opcjonalne drobne rozróżnienie między bardzo szybkimi a umiarkowanymi
//             this.fitness += (STEP_LIMIT - this.step) / STEP_LIMIT * 0.1;
//             return this.fitness;
//         }

//         // Dla nieosiągniętych: ocena postępu względem start→cel
//         const progress = 1 - (this.minDist / START_TO_GOAL_DIST);
//         const progressScore = Math.max(0, progress) * 7.0; // skala 0..7

//         // Mały bonus za przeżycie i eksplorację, ale tak, by nie przekroczyć 10
//         const aliveBonus = this.dead ? 0 : 0.5;
//         const exploreBonus = (this.step / STEP_LIMIT) * 0.5;

//         this.fitness = progressScore + aliveBonus + exploreBonus;

//         // Upewnij się, że nieosiągnięci pozostają poniżej progu 10
//         this.fitness = Math.min(this.fitness, 9.99);

//         return this.fitness;
//     }


//     draw() {
//         ctx.beginPath();
//         if (this.reached) {
//             ctx.fillStyle = '#2ecc71';  // zielony - cel osiągnięty
//         } else if (this.dead) {
//             ctx.fillStyle = '#aa4444';  // czerwony - martwy
//         } else {
//             ctx.fillStyle = '#e0e0e0';  // biały - żywy
//         }
//         ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
//         ctx.fill();
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// // POPULACJA I OPERATORY GENETYCZNE
// // ═══════════════════════════════════════════════════════════════
// let population = [];
// let generation = 0;
// let bestFitness = 0;

// function resetPopulation(hard = false) {
//     if (hard) generation = 0;
//     population = Array.from({ length: POP_SIZE },
//         () => new Agent(new Net(6, HIDDEN, 2))
//     );
//     bestFitness = 0;
//     genEl.textContent = generation;
//     bestEl.textContent = bestFitness.toFixed(3);
// }

// // ═══ SELEKCJA TURNIEJOWA ═══
// // Losuje k osobników i zwraca najlepszego
// function pickTournament(pop, k = TOUR_SIZE, noRepeat = TOUR_NO_REPEAT) {
//     const n = pop.length;

//     if (!noRepeat) {
//         // Z powtórzeniami - prostsze i szybsze
//         let best = null;
//         for (let i = 0; i < k; i++) {
//             const idx = Math.floor(Math.random() * n);
//             const cand = pop[idx];
//             if (!best || cand.fitness > best.fitness) {
//                 best = cand;
//             }
//         }
//         return best;
//     }

//     // Bez powtórzeń - więcej różnorodności
//     const effectiveK = Math.min(k, n);
//     const used = new Set();
//     let best = null;

//     while (used.size < effectiveK) {
//         const idx = Math.floor(Math.random() * n);
//         if (used.has(idx)) continue;
//         used.add(idx);

//         const cand = pop[idx];
//         if (!best || cand.fitness > best.fitness) {
//             best = cand;
//         }
//     }

//     return best;
// }

// // ═══ KRZYŻOWANIE WLAG (uniform crossover) ═══
// function crossoverWeights(w1, w2) {
//     function mixMatrix(A, B) {
//         return A.map((row, i) =>
//             row.map((val, j) => (Math.random() < 0.5 ? val : B[i][j]))
//         );
//     }

//     function mixVector(a, b) {
//         return a.map((val, i) => (Math.random() < 0.5 ? val : b[i]));
//     }

//     return {
//         W1: mixMatrix(w1.W1, w2.W1),
//         b1: mixVector(w1.b1, w2.b1),
//         W2: mixMatrix(w1.W2, w2.W2),
//         b2: mixVector(w1.b2, w2.b2),
//     };
// }

// // ═══ MUTACJA WAG ═══
// // Każda waga ma szansę MUT_RATE na dodanie szumu gaussowskiego
// function mutateWeights(w) {
//     const mutationStrength = 0.2;

//     function mutMatrix(M) {
//         for (let i = 0; i < M.length; i++) {
//             for (let j = 0; j < M[i].length; j++) {
//                 if (Math.random() < MUT_RATE) {
//                     M[i][j] += randn() * mutationStrength;
//                 }
//             }
//         }
//     }

//     function mutVector(v) {
//         for (let i = 0; i < v.length; i++) {
//             if (Math.random() < MUT_RATE) {
//                 v[i] += randn() * mutationStrength;
//             }
//         }
//     }

//     mutMatrix(w.W1);
//     mutVector(w.b1);
//     mutMatrix(w.W2);
//     mutVector(w.b2);
// }

// // ═══ EWOLUCJA - TWORZENIE NOWEJ GENERACJI ═══
// function evolve() {
//     // Oblicz fitness dla wszystkich
//     let best = null;
//     for (const agent of population) {
//         agent.computeFitness();
//         if (!best || agent.fitness > best.fitness) {
//             best = agent;
//         }
//     }
//     bestFitness = best.fitness;

//     // Sortuj malejąco po fitness
//     const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
//     const nextGen = [];

//     // ELITARYZM: kopiuj najlepszych bez zmian
//     const eliteCount = Math.min(ELITE_COUNT, sorted.length);
//     for (let i = 0; i < eliteCount; i++) {
//         const weights = sorted[i].net.copyWeights();
//         nextGen.push(new Agent(new Net(6, HIDDEN, 2, weights)));
//     }

//     // REPRODUKCJA: selekcja + krzyżowanie + mutacja
//     while (nextGen.length < POP_SIZE) {
//         const parent1 = pickTournament(population);
//         const parent2 = pickTournament(population);

//         const childWeights = crossoverWeights(
//             parent1.net.copyWeights(),
//             parent2.net.copyWeights()
//         );

//         mutateWeights(childWeights);

//         nextGen.push(new Agent(new Net(6, HIDDEN, 2, childWeights)));
//     }

//     population = nextGen;
//     generation++;
//     genEl.textContent = generation;
// }

// // ═══════════════════════════════════════════════════════════════
// // PĘTLA GŁÓWNA
// // ═══════════════════════════════════════════════════════════════
// let frameCount = 0;

// function loop() {
//     // Rysuj labirynt
//     drawMaze();

//     // Aktualizuj i rysuj agentów
//     for (const agent of population) {
//         if (!paused) agent.update();
//         agent.draw();
//     }

//     if (!paused) {
//         frameCount++;

//         // Sprawdź koniec generacji
//         const allDone = population.every(a => a.dead || a.reached);
//         const timeUp = frameCount >= STEP_LIMIT;

//         if (allDone || timeUp) {
//             // Ewolucja
//             evolve();
//             bestEl.textContent = bestFitness.toFixed(3);

//             // Reset dla nowej generacji
//             frameCount = 0;
//             for (const agent of population) {
//                 agent.x = start.x;
//                 agent.y = start.y;
//                 agent.step = 0;
//                 agent.dead = false;
//                 agent.reached = false;
//                 agent.minDist = START_TO_GOAL_DIST;
//             }
//         }
//     }

//     requestAnimationFrame(loop);
// }

// // ═══════════════════════════════════════════════════════════════
// // START
// // ═══════════════════════════════════════════════════════════════
// resetPopulation();
// loop();


















// // ═══════════════════════════════════════════════════════════════
// // STAŁE GEOMETRYCZNE
// // ═══════════════════════════════════════════════════════════════
// const W = 280, H = 280;
// const WALL_THICK = 5;
// const START_R = 6;      // promień markera startu i celu
// const AGENT_R = 3;      // promień agenta
// const GOAL_R = 12;      // promień strefy celu (do osiągnięcia)

// // Pozycje w narożnikach
// const start = { x: WALL_THICK + START_R + 2, y: H - WALL_THICK - START_R - 2 };
// const goal = { x: W - WALL_THICK - START_R - 2, y: WALL_THICK + START_R + 2, r: GOAL_R };

// // Dystans referencyjny do normalizacji fitness
// const START_TO_GOAL_DIST = Math.hypot(goal.x - start.x, goal.y - start.y);
// const DIAGONAL = Math.hypot(W, H);

// // ═══════════════════════════════════════════════════════════════
// // PARAMETRY NEUROEWOLUCJI
// // ═══════════════════════════════════════════════════════════════
// const POP_SIZE = 100;
// let HIDDEN = 8;
// let MUT_RATE = 0.1;
// let ELITE_COUNT = 3;
// let TOUR_SIZE = 5;
// let TOUR_NO_REPEAT = true;

// const STEP_LIMIT = 600;   // mniej kroków dla mniejszego canvasa
// const SPEED = 1.0;        // wolniej = precyzyjniej

// // ═══════════════════════════════════════════════════════════════
// // NOWE STAŁE - SYSTEM OSTRZEŻEŃ I ŚLEDZENIA
// // ═══════════════════════════════════════════════════════════════
// const MAX_WARNINGS = 3;           // ile kolizji zanim agent zginie
// const GRACE_PERIOD = 50;          // kroki ochronne na starcie
// const WARNING_FLASH_FRAMES = 8;   // czas migania ostrzeżenia

// // Bufor ścieżek elity (przechowuje historię pozycji najlepszych)
// let elitePaths = [];              // tablica tablic [{x, y}, ...]
// let avgGradients = { W1: null, W2: null };  // uśrednione gradienty/magnitude
// let generationStats = {
//     avgFitness: 0,
//     maxFitness: 0,
//     aliveCount: 0,
//     reachedCount: 0
// };

// // ═══════════════════════════════════════════════════════════════
// // ELEMENTY DOM
// // ═══════════════════════════════════════════════════════════════
// const cv = document.getElementById('cv');
// const ctx = cv.getContext('2d');

// const popEl = document.getElementById('pop');
// const genEl = document.getElementById('gen');
// const bestEl = document.getElementById('best');
// const hiddenEl = document.getElementById('hidden');
// const hiddenValEl = document.getElementById('hiddenVal');
// const mutRateEl = document.getElementById('mutRate');
// const mutRateValEl = document.getElementById('mutRateVal');
// const eliteEl = document.getElementById('elite');
// const eliteValEl = document.getElementById('eliteVal');
// const btnRestart = document.getElementById('restart');
// const btnPause = document.getElementById('pause');
// const tourSizeEl = document.getElementById('tourSize');
// const tourSizeValEl = document.getElementById('tourSizeVal');
// const tourNoRepeatEl = document.getElementById('tourNoRepeat');

// popEl.textContent = POP_SIZE;

// // ═══════════════════════════════════════════════════════════════
// // HANDLERY UI
// // ═══════════════════════════════════════════════════════════════
// hiddenEl.oninput = () => {
//     HIDDEN = +hiddenEl.value;
//     hiddenValEl.textContent = HIDDEN;
//     resetPopulation(true);
// };

// mutRateEl.oninput = () => {
//     MUT_RATE = +mutRateEl.value / 100;
//     mutRateValEl.textContent = Math.round(MUT_RATE * 100) + '%';
// };

// eliteEl.oninput = () => {
//     ELITE_COUNT = +eliteEl.value;
//     eliteValEl.textContent = ELITE_COUNT;
// };

// tourSizeEl.oninput = () => {
//     TOUR_SIZE = +tourSizeEl.value;
//     tourSizeValEl.textContent = TOUR_SIZE;
// };

// tourNoRepeatEl.onchange = () => {
//     TOUR_NO_REPEAT = tourNoRepeatEl.checked;
// };

// btnRestart.onclick = () => resetPopulation(true);

// let paused = false;
// btnPause.onclick = () => {
//     paused = !paused;
//     btnPause.textContent = paused ? 'Wznów' : 'Pauza';
// };

// // ═══════════════════════════════════════════════════════════════
// // LABIRYNT - proporcjonalny układ
// // ═══════════════════════════════════════════════════════════════
// const walls = [
//     // ══ Ściany zewnętrzne ══
//     { x: 0, y: 0, w: W, h: WALL_THICK },                    // góra
//     { x: 0, y: H - WALL_THICK, w: W, h: WALL_THICK },       // dół
//     { x: 0, y: 0, w: WALL_THICK, h: H },                    // lewo
//     { x: W - WALL_THICK, y: 0, w: WALL_THICK, h: H },       // prawo

//     // wewnętrzne, prosty układ w środku canvasu
//     {
//         x: Math.round(W * 0.2),
//         y: Math.round(H * 0.2),
//         w: Math.round(W * 0.6),
//         h: WALL_THICK
//     },
//     { x: Math.round(W * 0.2), y: Math.round(H * 0.2), w: WALL_THICK, h: Math.round(H * 0.6) },
//     { x: Math.round(W * 0.4), y: Math.round(H * 0.55), w: Math.round(W * 0.4), h: WALL_THICK },
//     { x: Math.round(W * 0.7), y: Math.round(H * 0.2), w: WALL_THICK, h: Math.round(H * 0.4) },
// ];

// // ═══════════════════════════════════════════════════════════════
// // RYSOWANIE
// // ═══════════════════════════════════════════════════════════════
// function drawMaze() {
//     // Tło
//     ctx.fillStyle = '#333';
//     ctx.fillRect(0, 0, W, H);

//     // Cel (zielony okrąg)
//     ctx.beginPath();
//     ctx.fillStyle = '#2ecc71';
//     ctx.arc(goal.x, goal.y, goal.r, 0, Math.PI * 2);
//     ctx.fill();

//     // Start (niebieski okrąg)
//     ctx.beginPath();
//     ctx.fillStyle = '#3498db';
//     ctx.arc(start.x, start.y, START_R, 0, Math.PI * 2);
//     ctx.fill();

//     // Ściany
//     ctx.fillStyle = '#777';
//     for (const w of walls) {
//         ctx.fillRect(w.x, w.y, w.w, w.h);
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// // RYSOWANIE ŚCIEŻEK POPRZEDNIEJ ELITY ("duchy")
// // ═══════════════════════════════════════════════════════════════
// function drawElitePaths() {
//     const colors = [
//         'rgba(241, 196, 15, 0.3)',   // złoty - najlepsza
//         'rgba(231, 76, 60, 0.25)',   // czerwony - druga
//         'rgba(155, 89, 182, 0.2)'    // fioletowy - trzecia
//     ];
    
//     for (let i = 0; i < elitePaths.length && i < ELITE_COUNT; i++) {
//         const path = elitePaths[i];
//         if (path.length < 2) continue;
        
//         ctx.beginPath();
//         ctx.strokeStyle = colors[i % colors.length];
//         ctx.lineWidth = 2 - i * 0.4;
//         ctx.setLineDash([4, 4]);
        
//         ctx.moveTo(path[0].x, path[0].y);
//         for (let j = 1; j < path.length; j++) {
//             ctx.lineTo(path[j].x, path[j].y);
//         }
//         ctx.stroke();
//         ctx.setLineDash([]);
        
//         // Oznacz koniec ścieżki małym kółkiem
//         if (path.length > 0) {
//             const last = path[path.length - 1];
//             ctx.beginPath();
//             ctx.fillStyle = colors[i % colors.length].replace('0.3', '0.6').replace('0.25', '0.5').replace('0.2', '0.4');
//             ctx.arc(last.x, last.y, 3 - i * 0.5, 0, Math.PI * 2);
//             ctx.fill();
//         }
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// // RYSOWANIE INFORMACJI O SIECI NEURONOWEJ
// // ═══════════════════════════════════════════════════════════════
// function drawNetworkInfo() {
//     const panelX = 5;
//     const panelY = 5;
//     const panelW = 90;
//     const panelH = 95;
    
//     // Półprzezroczyste tło panelu
//     ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
//     ctx.fillRect(panelX, panelY, panelW, panelH);
    
//     // Ramka
//     ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
//     ctx.lineWidth = 1;
//     ctx.strokeRect(panelX, panelY, panelW, panelH);
    
//     ctx.font = '9px monospace';
//     ctx.fillStyle = '#fff';
    
//     // Statystyki generacji
//     ctx.fillStyle = '#f1c40f';
//     ctx.fillText(`Gen: ${generation}`, panelX + 4, panelY + 12);
    
//     ctx.fillStyle = '#2ecc71';
//     ctx.fillText(`Goal: ${generationStats.reachedCount}`, panelX + 4, panelY + 24);
    
//     ctx.fillStyle = '#3498db';
//     ctx.fillText(`Alive: ${generationStats.aliveCount}`, panelX + 4, panelY + 36);
    
//     ctx.fillStyle = '#bbb';
//     ctx.fillText(`Avg: ${generationStats.avgFitness.toFixed(2)}`, panelX + 4, panelY + 48);
    
//     ctx.fillStyle = '#e74c3c';
//     ctx.fillText(`Best: ${generationStats.maxFitness.toFixed(2)}`, panelX + 4, panelY + 60);
    
//     // Wizualizacja średniego magnitude wag
//     if (avgGradients.W1 !== null) {
//         ctx.fillStyle = '#888';
//         ctx.font = '7px monospace';
//         ctx.fillText('W1:', panelX + 4, panelY + 72);
//         drawGradientBar(panelX + 22, panelY + 66, 62, 7, avgGradients.W1);
        
//         ctx.fillText('W2:', panelX + 4, panelY + 84);
//         drawGradientBar(panelX + 22, panelY + 78, 62, 7, avgGradients.W2);
//     }
// }

// function drawGradientBar(x, y, w, h, magnitude) {
//     // Normalizuj magnitude do [0, 1] (zakładamy max ~2.0)
//     const norm = Math.min(1, magnitude / 2);
    
//     // Tło paska
//     ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
//     ctx.fillRect(x, y, w, h);
    
//     // Gradient od niebieskiego (niski) przez zielony do czerwonego (wysoki)
//     let r, g, b;
//     if (norm < 0.5) {
//         // niebieski -> zielony
//         const t = norm * 2;
//         r = Math.floor(50 * t);
//         g = Math.floor(150 + 105 * t);
//         b = Math.floor(255 * (1 - t));
//     } else {
//         // zielony -> czerwony
//         const t = (norm - 0.5) * 2;
//         r = Math.floor(50 + 205 * t);
//         g = Math.floor(255 * (1 - t));
//         b = 0;
//     }
    
//     ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
//     ctx.fillRect(x, y, w * norm, h);
    
//     // Ramka
//     ctx.strokeStyle = '#666';
//     ctx.lineWidth = 1;
//     ctx.strokeRect(x, y, w, h);
    
//     // Wartość liczbowa
//     ctx.fillStyle = '#fff';
//     ctx.font = '6px monospace';
//     ctx.fillText(magnitude.toFixed(2), x + w + 2, y + 6);
// }

// // Oblicz uśredniony "gradient" (magnitude wag) najlepszych sieci
// function computeAverageGradients(eliteAgents) {
//     if (eliteAgents.length === 0) return;
    
//     let sumW1 = 0, countW1 = 0;
//     let sumW2 = 0, countW2 = 0;
    
//     for (const agent of eliteAgents) {
//         const net = agent.net;
        
//         // Suma kwadratów wag W1
//         for (const row of net.W1) {
//             for (const val of row) {
//                 sumW1 += val * val;
//                 countW1++;
//             }
//         }
        
//         // Suma kwadratów wag W2
//         for (const row of net.W2) {
//             for (const val of row) {
//                 sumW2 += val * val;
//                 countW2++;
//             }
//         }
//     }
    
//     // RMS (Root Mean Square) jako miara magnitude
//     avgGradients.W1 = Math.sqrt(sumW1 / countW1);
//     avgGradients.W2 = Math.sqrt(sumW2 / countW2);
// }

// // ═══════════════════════════════════════════════════════════════
// // DETEKCJA KOLIZJI
// // Sprawdza czy okrąg (x,y,r) koliduje z którąkolwiek ścianą
// // Algorytm: znajdź najbliższy punkt prostokąta do środka okręgu
// // ═══════════════════════════════════════════════════════════════
// function collides(x, y, r = AGENT_R) {
//     for (const w of walls) {
//         // Najbliższy punkt na prostokącie do punktu (x, y)
//         const nearestX = Math.max(w.x, Math.min(x, w.x + w.w));
//         const nearestY = Math.max(w.y, Math.min(y, w.y + w.h));

//         // Dystans od środka okręgu do najbliższego punktu
//         const dx = x - nearestX;
//         const dy = y - nearestY;

//         if (dx * dx + dy * dy <= r * r) return true;
//     }

//     // Dodatkowe sprawdzenie granic (margines bezpieczeństwa)
//     if (x < WALL_THICK + r || x > W - WALL_THICK - r ||
//         y < WALL_THICK + r || y > H - WALL_THICK - r) {
//         return true;
//     }

//     return false;
// }

// // ═══════════════════════════════════════════════════════════════
// // SIEĆ NEURONOWA
// // Architektura: 6 → HIDDEN → 2
// // Wejścia: [ray_up, ray_down, ray_left, ray_right, goal_dx, goal_dy]
// // Wyjścia: [move_dx, move_dy] ∈ [-1, 1] (tanh)
// // ═══════════════════════════════════════════════════════════════

// // Generator liczb z rozkładu normalnego (Box-Muller)
// function randn() {
//     const u = Math.random();
//     const v = Math.random();
//     return Math.sqrt(-2 * Math.log(u + 1e-10)) * Math.cos(2 * Math.PI * v);
// }

// class Net {
//     constructor(inDim = 6, hiddenDim = HIDDEN, outDim = 2, weights = null) {
//         this.inDim = inDim;
//         this.hiddenDim = hiddenDim;
//         this.outDim = outDim;

//         if (weights) {
//             // Kopiuj istniejące wagi
//             this.W1 = weights.W1;
//             this.b1 = weights.b1;
//             this.W2 = weights.W2;
//             this.b2 = weights.b2;
//         } else {
//             // Inicjalizacja Xavier/Glorot - lepsza zbieżność
//             const scale1 = Math.sqrt(2.0 / (inDim + hiddenDim));
//             const scale2 = Math.sqrt(2.0 / (hiddenDim + outDim));

//             this.W1 = Array.from({ length: hiddenDim }, () =>
//                 Array.from({ length: inDim }, () => randn() * scale1)
//             );
//             this.b1 = Array.from({ length: hiddenDim }, () => 0);

//             this.W2 = Array.from({ length: outDim }, () =>
//                 Array.from({ length: hiddenDim }, () => randn() * scale2)
//             );
//             this.b2 = Array.from({ length: outDim }, () => 0);
//         }
//     }

//     forward(x) {
//         // Warstwa ukryta: ReLU(W1 · x + b1)
//         const h = new Array(this.hiddenDim);
//         for (let i = 0; i < this.hiddenDim; i++) {
//             let sum = this.b1[i];
//             for (let j = 0; j < this.inDim; j++) {
//                 sum += this.W1[i][j] * x[j];
//             }
//             h[i] = sum > 0 ? sum : 0;  // ReLU
//         }

//         // Warstwa wyjściowa: tanh(W2 · h + b2)
//         const y = new Array(this.outDim);
//         for (let i = 0; i < this.outDim; i++) {
//             let sum = this.b2[i];
//             for (let j = 0; j < this.hiddenDim; j++) {
//                 sum += this.W2[i][j] * h[j];
//             }
//             y[i] = Math.tanh(sum);  // tanh → [-1, 1]
//         }

//         return y;
//     }

//     copyWeights() {
//         return {
//             W1: this.W1.map(row => [...row]),
//             b1: [...this.b1],
//             W2: this.W2.map(row => [...row]),
//             b2: [...this.b2],
//         };
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// // SENSORY - raycasting
// // Zwraca znormalizowaną odległość do ściany w danym kierunku
// // ═══════════════════════════════════════════════════════════════
// function rayDistance(x, y, dirX, dirY) {
//     const step = 1.5;  // mały krok dla precyzji w małym canvasie
//     const maxDist = DIAGONAL;
//     let dist = 0;
//     let cx = x, cy = y;

//     while (dist < maxDist) {
//         cx += dirX * step;
//         cy += dirY * step;
//         dist += step;

//         if (collides(cx, cy, 0.5)) break;
//     }

//     // Normalizacja do [0, 1]: 0 = blisko ściany, 1 = daleko
//     return Math.min(1.0, dist / maxDist);
// }

// function sensors(ax, ay) {
//     // Ray-casting w 4 kierunkach
//     const up = rayDistance(ax, ay, 0, -1);
//     const down = rayDistance(ax, ay, 0, +1);
//     const left = rayDistance(ax, ay, -1, 0);
//     const right = rayDistance(ax, ay, +1, 0);

//     // Wektor do celu (znormalizowany do jednostkowego)
//     const vx = goal.x - ax;
//     const vy = goal.y - ay;
//     const norm = Math.hypot(vx, vy) + 1e-8;
//     const gx = vx / norm;  // ∈ [-1, 1]
//     const gy = vy / norm;  // ∈ [-1, 1]

//     return [up, down, left, right, gx, gy];
// }

// // ═══════════════════════════════════════════════════════════════
// // AGENT
// // ═══════════════════════════════════════════════════════════════
// class Agent {
//     constructor(net = null) {
//         this.x = start.x;
//         this.y = start.y;
//         this.r = AGENT_R;
//         this.dead = false;
//         this.reached = false;
//         this.step = 0;
//         this.net = net || new Net();
//         this.fitness = 0;
//         this.minDist = START_TO_GOAL_DIST;  // śledzenie najlepszego postępu
        
//         // ═══ NOWE POLA ═══
//         this.warnings = 0;                    // licznik ostrzeżeń
//         this.warningFlash = 0;                // timer migania
//         this.path = [];                       // historia pozycji
//         this.lastActivations = { h: [], out: [] };  // ostatnie aktywacje
//         this.isElite = false;                 // czy należy do elity
//     }

//     update() {
//         if (this.dead || this.reached) return;

//         if (this.step++ > STEP_LIMIT) {
//             this.dead = true;
//             return;
//         }

//         // Zapisz pozycję do ścieżki (co 3 kroki dla wydajności)
//         if (this.step % 3 === 0) {
//             this.path.push({ x: this.x, y: this.y });
//         }

//         // Zmniejsz timer migania
//         if (this.warningFlash > 0) this.warningFlash--;

//         // Odczytaj sensory i wykonaj forward pass z zapisem aktywacji
//         const s = sensors(this.x, this.y);
//         const out = this.forwardWithActivations(s);

//         // Oblicz nową pozycję
//         const nx = this.x + out[0] * SPEED;
//         const ny = this.y + out[1] * SPEED;

//         // ═══ SYSTEM OSTRZEŻEŃ O KOLIZJI ═══
//         if (collides(nx, ny, this.r)) {
//             // Okres ochronny na starcie - teleportuj do bezpiecznej pozycji
//             if (this.step < GRACE_PERIOD) {
//                 // Losowe przesunięcie w bezpiecznej strefie startowej
//                 const safeRadius = 8;
//                 let attempts = 0;
//                 while (attempts < 10) {
//                     const newX = start.x + (Math.random() - 0.5) * safeRadius;
//                     const newY = start.y + (Math.random() - 0.5) * safeRadius;
//                     if (!collides(newX, newY, this.r)) {
//                         this.x = newX;
//                         this.y = newY;
//                         break;
//                     }
//                     attempts++;
//                 }
//                 return;
//             }
            
//             // Po okresie ochronnym - system ostrzeżeń
//             this.warnings++;
//             this.warningFlash = WARNING_FLASH_FRAMES;
            
//             if (this.warnings >= MAX_WARNINGS) {
//                 this.dead = true;
//                 return;
//             }
            
//             // Przy ostrzeżeniu - próbuj odepchnąć się od ściany
//             // Znajdź kierunek "ucieczki" (przeciwny do kierunku ruchu)
//             const escapeX = this.x - out[0] * SPEED * 0.8;
//             const escapeY = this.y - out[1] * SPEED * 0.8;
            
//             if (!collides(escapeX, escapeY, this.r)) {
//                 this.x = escapeX;
//                 this.y = escapeY;
//             } else {
//                 // Jeśli nie można uciec do tyłu, spróbuj ruch boczny
//                 const sideX1 = this.x + out[1] * SPEED * 0.5;
//                 const sideY1 = this.y - out[0] * SPEED * 0.5;
//                 const sideX2 = this.x - out[1] * SPEED * 0.5;
//                 const sideY2 = this.y + out[0] * SPEED * 0.5;
                
//                 if (!collides(sideX1, sideY1, this.r)) {
//                     this.x = sideX1;
//                     this.y = sideY1;
//                 } else if (!collides(sideX2, sideY2, this.r)) {
//                     this.x = sideX2;
//                     this.y = sideY2;
//                 }
//                 // Jeśli żaden ruch nie jest możliwy, zostań w miejscu
//             }
//             return;
//         }

//         // Zaktualizuj pozycję (brak kolizji)
//         this.x = nx;
//         this.y = ny;

//         // Śledź minimalny dystans do celu
//         const distToGoal = Math.hypot(this.x - goal.x, this.y - goal.y);
//         if (distToGoal < this.minDist) {
//             this.minDist = distToGoal;
//         }

//         // Sprawdź osiągnięcie celu
//         if (distToGoal <= goal.r) {
//             this.reached = true;
//         }
//     }

//     // Forward pass z zapisem aktywacji (do wizualizacji)
//     forwardWithActivations(x) {
//         const net = this.net;
//         const h = new Array(net.hiddenDim);
        
//         for (let i = 0; i < net.hiddenDim; i++) {
//             let sum = net.b1[i];
//             for (let j = 0; j < net.inDim; j++) {
//                 sum += net.W1[i][j] * x[j];
//             }
//             h[i] = sum > 0 ? sum : 0;  // ReLU
//         }

//         const y = new Array(net.outDim);
//         for (let i = 0; i < net.outDim; i++) {
//             let sum = net.b2[i];
//             for (let j = 0; j < net.hiddenDim; j++) {
//                 sum += net.W2[i][j] * h[j];
//             }
//             y[i] = Math.tanh(sum);  // tanh → [-1, 1]
//         }

//         // Zapisz aktywacje do wizualizacji
//         this.lastActivations = { h: h.slice(), out: y.slice() };
        
//         return y;
//     }

//     computeFitness() {
//         // Jeśli osiągnął cel: baza + umiarkowany bonus za szybkość
//         if (this.reached) {
//             const speedBonus = Math.max(0, 1 - (this.step / STEP_LIMIT)) * 2;
//             this.fitness = 10.0 + speedBonus;
//             this.fitness += (STEP_LIMIT - this.step) / STEP_LIMIT * 0.1;
//             return this.fitness;
//         }

//         // Dla nieosiągniętych: ocena postępu względem start→cel
//         const progress = 1 - (this.minDist / START_TO_GOAL_DIST);
//         const progressScore = Math.max(0, progress) * 7.0; // skala 0..7

//         // Mały bonus za przeżycie i eksplorację
//         const aliveBonus = this.dead ? 0 : 0.5;
//         const exploreBonus = (this.step / STEP_LIMIT) * 0.5;
        
//         // ═══ NOWY BONUS ═══ - premia za przetrwanie ostrzeżeń (mniej kolizji = lepiej)
//         const survivalBonus = this.warnings < MAX_WARNINGS ? 0.3 * (MAX_WARNINGS - this.warnings) / MAX_WARNINGS : 0;

//         this.fitness = progressScore + aliveBonus + exploreBonus + survivalBonus;

//         // Upewnij się, że nieosiągnięci pozostają poniżej progu 10
//         this.fitness = Math.min(this.fitness, 9.99);

//         return this.fitness;
//     }

//     draw() {
//         // Rysuj aktualną ścieżkę dla żywej elity
//         if (this.isElite && !this.dead && this.path.length > 1) {
//             ctx.beginPath();
//             ctx.strokeStyle = this.reached ? 'rgba(46, 204, 113, 0.5)' : 'rgba(241, 196, 15, 0.4)';
//             ctx.lineWidth = 1.5;
//             ctx.moveTo(this.path[0].x, this.path[0].y);
//             for (let i = 1; i < this.path.length; i++) {
//                 ctx.lineTo(this.path[i].x, this.path[i].y);
//             }
//             ctx.stroke();
//         }

//         ctx.beginPath();
        
//         // ═══ WIZUALIZACJA OSTRZEŻEŃ ═══
//         if (this.warningFlash > 0) {
//             // Miganie na pomarańczowo/czerwono
//             const flashIntensity = this.warningFlash % 4 < 2;
//             if (flashIntensity) {
//                 ctx.fillStyle = this.warnings >= MAX_WARNINGS - 1 ? '#ff3300' : '#ff6600';
//                 ctx.arc(this.x, this.y, this.r + 3, 0, Math.PI * 2);
//                 ctx.fill();
//                 ctx.beginPath();
//             }
//         }
        
//         // Główne ciało agenta
//         if (this.reached) {
//             ctx.fillStyle = '#2ecc71';  // zielony - cel osiągnięty
//             ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
//         } else if (this.dead) {
//             ctx.fillStyle = '#aa4444';  // czerwony - martwy
//             ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
//         } else if (this.isElite) {
//             // Elita - złoty kolor z obwódką
//             ctx.fillStyle = '#f1c40f';
//             ctx.arc(this.x, this.y, this.r + 1, 0, Math.PI * 2);
//             ctx.fill();
//             ctx.beginPath();
//             ctx.strokeStyle = '#c0a000';
//             ctx.lineWidth = 1;
//             ctx.arc(this.x, this.y, this.r + 1, 0, Math.PI * 2);
//             ctx.stroke();
//             return; // Już narysowane
//         } else {
//             // Zwykły agent - kolor zależny od liczby ostrzeżeń
//             const warningIntensity = this.warnings / MAX_WARNINGS;
//             const r = Math.floor(224 + warningIntensity * 31);
//             const g = Math.floor(224 - warningIntensity * 140);
//             const b = Math.floor(224 - warningIntensity * 140);
//             ctx.fillStyle = `rgb(${r},${g},${b})`;
//             ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
//         }
//         ctx.fill();

//         // Wskaźnik ostrzeżeń (małe czerwone kropki nad agentem)
//         if (this.warnings > 0 && !this.dead && !this.reached) {
//             for (let i = 0; i < this.warnings; i++) {
//                 ctx.beginPath();
//                 ctx.fillStyle = '#ff0000';
//                 const offsetX = (i - (this.warnings - 1) / 2) * 4;
//                 ctx.arc(this.x + offsetX, this.y - 6, 1.5, 0, Math.PI * 2);
//                 ctx.fill();
//             }
//         }
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// // POPULACJA I OPERATORY GENETYCZNE
// // ═══════════════════════════════════════════════════════════════
// let population = [];
// let generation = 0;
// let bestFitness = 0;

// function resetPopulation(hard = false) {
//     if (hard) {
//         generation = 0;
//         elitePaths = [];
//         avgGradients = { W1: null, W2: null };
//         generationStats = {
//             avgFitness: 0,
//             maxFitness: 0,
//             aliveCount: POP_SIZE,
//             reachedCount: 0
//         };
//     }
//     population = Array.from({ length: POP_SIZE },
//         () => new Agent(new Net(6, HIDDEN, 2))
//     );
//     bestFitness = 0;
//     genEl.textContent = generation;
//     bestEl.textContent = bestFitness.toFixed(3);
// }

// // ═══ SELEKCJA TURNIEJOWA ═══
// // Losuje k osobników i zwraca najlepszego
// function pickTournament(pop, k = TOUR_SIZE, noRepeat = TOUR_NO_REPEAT) {
//     const n = pop.length;

//     if (!noRepeat) {
//         // Z powtórzeniami - prostsze i szybsze
//         let best = null;
//         for (let i = 0; i < k; i++) {
//             const idx = Math.floor(Math.random() * n);
//             const cand = pop[idx];
//             if (!best || cand.fitness > best.fitness) {
//                 best = cand;
//             }
//         }
//         return best;
//     }

//     // Bez powtórzeń - więcej różnorodności
//     const effectiveK = Math.min(k, n);
//     const used = new Set();
//     let best = null;

//     while (used.size < effectiveK) {
//         const idx = Math.floor(Math.random() * n);
//         if (used.has(idx)) continue;
//         used.add(idx);

//         const cand = pop[idx];
//         if (!best || cand.fitness > best.fitness) {
//             best = cand;
//         }
//     }

//     return best;
// }

// // ═══ KRZYŻOWANIE WLAG (uniform crossover) ═══
// function crossoverWeights(w1, w2) {
//     function mixMatrix(A, B) {
//         return A.map((row, i) =>
//             row.map((val, j) => (Math.random() < 0.5 ? val : B[i][j]))
//         );
//     }

//     function mixVector(a, b) {
//         return a.map((val, i) => (Math.random() < 0.5 ? val : b[i]));
//     }

//     return {
//         W1: mixMatrix(w1.W1, w2.W1),
//         b1: mixVector(w1.b1, w2.b1),
//         W2: mixMatrix(w1.W2, w2.W2),
//         b2: mixVector(w1.b2, w2.b2),
//     };
// }

// // ═══ MUTACJA WAG ═══
// // Każda waga ma szansę MUT_RATE na dodanie szumu gaussowskiego
// function mutateWeights(w) {
//     const mutationStrength = 0.2;

//     function mutMatrix(M) {
//         for (let i = 0; i < M.length; i++) {
//             for (let j = 0; j < M[i].length; j++) {
//                 if (Math.random() < MUT_RATE) {
//                     M[i][j] += randn() * mutationStrength;
//                 }
//             }
//         }
//     }

//     function mutVector(v) {
//         for (let i = 0; i < v.length; i++) {
//             if (Math.random() < MUT_RATE) {
//                 v[i] += randn() * mutationStrength;
//             }
//         }
//     }

//     mutMatrix(w.W1);
//     mutVector(w.b1);
//     mutMatrix(w.W2);
//     mutVector(w.b2);
// }

// // ═══ EWOLUCJA - TWORZENIE NOWEJ GENERACJI ═══
// function evolve() {
//     // Oblicz fitness dla wszystkich
//     let best = null;
//     let totalFitness = 0;
//     let aliveCount = 0;
//     let reachedCount = 0;
    
//     for (const agent of population) {
//         agent.computeFitness();
//         totalFitness += agent.fitness;
//         if (!agent.dead) aliveCount++;
//         if (agent.reached) reachedCount++;
//         if (!best || agent.fitness > best.fitness) {
//             best = agent;
//         }
//     }
//     bestFitness = best.fitness;

//     // ═══ AKTUALIZUJ STATYSTYKI ═══
//     generationStats = {
//         avgFitness: totalFitness / population.length,
//         maxFitness: bestFitness,
//         aliveCount: aliveCount,
//         reachedCount: reachedCount
//     };

//     // Sortuj malejąco po fitness
//     const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
//     const nextGen = [];

//     // ═══ ZAPISZ ŚCIEŻKI ELITY ═══
//     const eliteCount = Math.min(ELITE_COUNT, sorted.length);
//     elitePaths = [];
//     for (let i = 0; i < eliteCount; i++) {
//         if (sorted[i].path.length > 0) {
//             elitePaths.push([...sorted[i].path]);
//         }
//     }
    
//     // ═══ OBLICZ ŚREDNIE MAGNITUDE WAG ELITY ═══
//     computeAverageGradients(sorted.slice(0, eliteCount));

//     // ELITARYZM: kopiuj najlepszych bez zmian
//     for (let i = 0; i < eliteCount; i++) {
//         const weights = sorted[i].net.copyWeights();
//         const eliteAgent = new Agent(new Net(6, HIDDEN, 2, weights));
//         eliteAgent.isElite = true;  // Oznacz jako elitę
//         nextGen.push(eliteAgent);
//     }

//     // REPRODUKCJA: selekcja + krzyżowanie + mutacja
//     while (nextGen.length < POP_SIZE) {
//         const parent1 = pickTournament(population);
//         const parent2 = pickTournament(population);

//         const childWeights = crossoverWeights(
//             parent1.net.copyWeights(),
//             parent2.net.copyWeights()
//         );

//         mutateWeights(childWeights);

//         nextGen.push(new Agent(new Net(6, HIDDEN, 2, childWeights)));
//     }

//     population = nextGen;
//     generation++;
//     genEl.textContent = generation;
// }

// // ═══════════════════════════════════════════════════════════════
// // PĘTLA GŁÓWNA
// // ═══════════════════════════════════════════════════════════════
// let frameCount = 0;

// function loop() {
//     // Rysuj labirynt
//     drawMaze();
    
//     // ═══ RYSUJ ŚCIEŻKI POPRZEDNIEJ ELITY (jako "duchy") ═══
//     drawElitePaths();

//     // Aktualizuj i rysuj agentów
//     for (const agent of population) {
//         if (!paused) agent.update();
//         agent.draw();
//     }
    
//     // ═══ RYSUJ PANEL INFORMACYJNY ═══
//     drawNetworkInfo();

//     if (!paused) {
//         frameCount++;
        
//         // ═══ AKTUALIZUJ STATYSTYKI NA ŻYWO ═══
//         let alive = 0, reached = 0;
//         for (const a of population) {
//             if (!a.dead) alive++;
//             if (a.reached) reached++;
//         }
//         generationStats.aliveCount = alive;
//         generationStats.reachedCount = reached;

//         // Sprawdź koniec generacji
//         const allDone = population.every(a => a.dead || a.reached);
//         const timeUp = frameCount >= STEP_LIMIT;

//         if (allDone || timeUp) {
//             // Ewolucja
//             evolve();
//             bestEl.textContent = bestFitness.toFixed(3);

//             // Reset dla nowej generacji
//             frameCount = 0;
//             for (const agent of population) {
//                 agent.x = start.x;
//                 agent.y = start.y;
//                 agent.step = 0;
//                 agent.dead = false;
//                 agent.reached = false;
//                 agent.minDist = START_TO_GOAL_DIST;
//                 agent.warnings = 0;
//                 agent.warningFlash = 0;
//                 agent.path = [];
//             }
//         }
//     }

//     requestAnimationFrame(loop);
// }

// // ═══════════════════════════════════════════════════════════════
// // START
// // ═══════════════════════════════════════════════════════════════
// resetPopulation();
// loop();
















// // ═══════════════════════════════════════════════════════════════
// // STAŁE GEOMETRYCZNE
// // ═══════════════════════════════════════════════════════════════
// const W = 280, H = 280;
// const WALL_THICK = 5;
// const START_R = 6;
// const AGENT_R = 3;
// const GOAL_R = 12;

// const start = { x: WALL_THICK + START_R + 2, y: H - WALL_THICK - START_R - 2 };
// const goal = { x: W - WALL_THICK - START_R - 2, y: WALL_THICK + START_R + 2, r: GOAL_R };

// const START_TO_GOAL_DIST = Math.hypot(goal.x - start.x, goal.y - start.y);
// const DIAGONAL = Math.hypot(W, H);

// // ═══════════════════════════════════════════════════════════════
// // PARAMETRY
// // ═══════════════════════════════════════════════════════════════
// const POP_SIZE = 100;
// let HIDDEN = 8;
// let MUT_RATE = 0.1;
// let ELITE_COUNT = 3;
// let TOUR_SIZE = 5;
// let TOUR_NO_REPEAT = true;

// const STEP_LIMIT = 600;
// const SPEED = 1.0;

// // ═══════════════════════════════════════════════════════════════
// // ELEMENTY DOM + HANDLERY (oryginalne)
// // ═══════════════════════════════════════════════════════════════
// const cv = document.getElementById('cv');
// const ctx = cv.getContext('2d');

// const popEl = document.getElementById('pop');
// const genEl = document.getElementById('gen');
// const bestEl = document.getElementById('best');
// const hiddenEl = document.getElementById('hidden');
// const hiddenValEl = document.getElementById('hiddenVal');
// const mutRateEl = document.getElementById('mutRate');
// const mutRateValEl = document.getElementById('mutRateVal');
// const eliteEl = document.getElementById('elite');
// const eliteValEl = document.getElementById('eliteVal');
// const btnRestart = document.getElementById('restart');
// const btnPause = document.getElementById('pause');
// const tourSizeEl = document.getElementById('tourSize');
// const tourSizeValEl = document.getElementById('tourSizeVal');
// const tourNoRepeatEl = document.getElementById('tourNoRepeat');

// popEl.textContent = POP_SIZE;

// hiddenEl.oninput = () => { HIDDEN = +hiddenEl.value; hiddenValEl.textContent = HIDDEN; resetPopulation(true); };
// mutRateEl.oninput = () => { MUT_RATE = +mutRateEl.value / 100; mutRateValEl.textContent = Math.round(MUT_RATE * 100) + '%'; };
// eliteEl.oninput = () => { ELITE_COUNT = +eliteEl.value; eliteValEl.textContent = ELITE_COUNT; };
// tourSizeEl.oninput = () => { TOUR_SIZE = +tourSizeEl.value; tourSizeValEl.textContent = TOUR_SIZE; };
// tourNoRepeatEl.onchange = () => { TOUR_NO_REPEAT = tourNoRepeatEl.checked; };

// btnRestart.onclick = () => resetPopulation(true);
// let paused = false;
// btnPause.onclick = () => { paused = !paused; btnPause.textContent = paused ? 'Wznów' : 'Pauza'; };

// // ═══════════════════════════════════════════════════════════════
// // LABIRYNT + KOLIZJE
// // ═══════════════════════════════════════════════════════════════
// const walls = [
//     { x: 0, y: 0, w: W, h: WALL_THICK },
//     { x: 0, y: H - WALL_THICK, w: W, h: WALL_THICK },
//     { x: 0, y: 0, w: WALL_THICK, h: H },
//     { x: W - WALL_THICK, y: 0, w: WALL_THICK, h: H },
//     { x: Math.round(W * 0.2), y: Math.round(H * 0.2), w: Math.round(W * 0.6), h: WALL_THICK },
//     { x: Math.round(W * 0.2), y: Math.round(H * 0.2), w: WALL_THICK, h: Math.round(H * 0.6) },
//     { x: Math.round(W * 0.4), y: Math.round(H * 0.55), w: Math.round(W * 0.4), h: WALL_THICK },
//     { x: Math.round(W * 0.7), y: Math.round(H * 0.2), w: WALL_THICK, h: Math.round(H * 0.4) },
// ];

// function collides(x, y, r = AGENT_R) {
//     for (const w of walls) {
//         const nx = Math.max(w.x, Math.min(x, w.x + w.w));
//         const ny = Math.max(w.y, Math.min(y, w.y + w.h));
//         if ((x - nx)**2 + (y - ny)**2 <= r * r) return true;
//     }
//     return (x < WALL_THICK + r || x > W - WALL_THICK - r || y < WALL_THICK + r || y > H - WALL_THICK - r);
// }

// function randn() {
//     const u = Math.random(), v = Math.random();
//     return Math.sqrt(-2 * Math.log(u + 1e-10)) * Math.cos(2 * Math.PI * v);
// }

// // Net, sensors, rayDistance (bez zmian)
// class Net {
//     constructor(inDim = 6, hiddenDim = HIDDEN, outDim = 2, weights = null) {
//         this.inDim = inDim; this.hiddenDim = hiddenDim; this.outDim = outDim;
//         if (weights) {
//             this.W1 = weights.W1; this.b1 = weights.b1;
//             this.W2 = weights.W2; this.b2 = weights.b2;
//         } else {
//             const s1 = Math.sqrt(2/(inDim+hiddenDim)), s2 = Math.sqrt(2/(hiddenDim+outDim));
//             this.W1 = Array.from({length:hiddenDim},()=>Array.from({length:inDim},()=>randn()*s1));
//             this.b1 = new Array(hiddenDim).fill(0);
//             this.W2 = Array.from({length:outDim},()=>Array.from({length:hiddenDim},()=>randn()*s2));
//             this.b2 = new Array(outDim).fill(0);
//         }
//     }
//     forward(x) {
//         const h = this.W1.map((row,i)=>{let s=this.b1[i]; for(let j=0;j<6;j++)s+=row[j]*x[j]; return s>0?s:0;});
//         return this.W2.map((row,i)=>{let s=this.b2[i]; for(let j=0;j<h.length;j++)s+=row[j]*h[j]; return Math.tanh(s);});
//     }
//     copyWeights() { return {W1:this.W1.map(r=>[...r]), b1:[...this.b1], W2:this.W2.map(r=>[...r]), b2:[...this.b2]}; }
// }

// function rayDistance(x, y, dx, dy) {
//     let d=0, cx=x, cy=y;
//     while(d < DIAGONAL){ cx+=dx*1.5; cy+=dy*1.5; d+=1.5; if(collides(cx,cy,0.5)) break; }
//     return Math.min(1, d/DIAGONAL);
// }

// function sensors(ax, ay) {
//     return [
//         rayDistance(ax, ay, 0, -1),
//         rayDistance(ax, ay, 0, 1),
//         rayDistance(ax, ay, -1, 0),
//         rayDistance(ax, ay, 1, 0),
//         (goal.x - ax) / (Math.hypot(goal.x - ax, goal.y - ay) + 1e-8),
//         (goal.y - ay) / (Math.hypot(goal.x - ax, goal.y - ay) + 1e-8)
//     ];
// }

// // Agent – z modyfikacjami
// class Agent {
//     constructor(net = null) {
//         this.x = start.x; this.y = start.y;
//         this.dead = false; this.reached = false;
//         this.step = 0; this.fitness = 0; this.minDist = START_TO_GOAL_DIST;
//         this.net = net || new Net();
//         this.collisionWarnings = 3;
//         this.trail = [];
//         this.lastOutput = [0, 0];
//     }

//     update() {
//         if (this.dead || this.reached) return;
//         if (this.step++ > STEP_LIMIT) { this.dead = true; return; }

//         const s = sensors(this.x, this.y);
//         this.lastOutput = this.net.forward(s);

//         const nx = this.x + this.lastOutput[0] * SPEED;
//         const ny = this.y + this.lastOutput[1] * SPEED;

//         if (collides(nx, ny)) {
//             this.collisionWarnings--;
//             if (this.collisionWarnings <= 0) this.dead = true;
//             return;
//         }

//         this.x = nx; this.y = ny;
//         this.trail.push({x:this.x, y:this.y});
//         if (this.trail.length > 180) this.trail.shift();

//         const d = Math.hypot(this.x - goal.x, this.y - goal.y);
//         if (d < this.minDist) this.minDist = d;
//         if (d <= goal.r) this.reached = true;
//     }

//     computeFitness() {
//         if (this.reached) {
//             const speedBonus = Math.max(0, 1 - (this.step / STEP_LIMIT)) * 2;
//             this.fitness = 10 + speedBonus + (STEP_LIMIT - this.step) / STEP_LIMIT * 0.1;
//             return this.fitness;
//         }
//         const progress = 1 - (this.minDist / START_TO_GOAL_DIST);
//         this.fitness = Math.max(0, progress) * 7 + (this.dead ? 0 : 0.5);
//         this.fitness = Math.min(this.fitness, 9.99);
//         return this.fitness;
//     }

//     draw() {
//         ctx.beginPath();
//         ctx.fillStyle = this.reached ? '#2ecc71' : this.dead ? '#aa4444' : '#e0e0e0';
//         ctx.arc(this.x, this.y, AGENT_R, 0, Math.PI*2);
//         ctx.fill();

//         if (!this.dead && !this.reached && this.collisionWarnings < 3) {
//             ctx.strokeStyle = `rgba(231,76,60,${(3-this.collisionWarnings)*0.45})`;
//             ctx.lineWidth = 3.5;
//             ctx.beginPath();
//             ctx.arc(this.x, this.y, AGENT_R + 7, 0, Math.PI*2);
//             ctx.stroke();
//         }

//         if (!this.dead && !this.reached) {
//             ctx.strokeStyle = '#f1c40f';
//             ctx.lineWidth = 2;
//             ctx.beginPath();
//             ctx.moveTo(this.x, this.y);
//             ctx.lineTo(this.x + this.lastOutput[0]*22, this.y + this.lastOutput[1]*22);
//             ctx.stroke();
//         }
//     }
// }

// // Zmienne
// let population = [];
// let generation = 0;
// let bestFitness = 0;
// let eliteTrails = [];

// // Funkcje ewolucyjne
// function resetPopulation(hard = false) {
//     if (hard) generation = 0;
//     population = Array.from({length: POP_SIZE}, () => new Agent());
//     eliteTrails = [];
//     bestFitness = 0;
//     genEl.textContent = generation;
//     bestEl.textContent = bestFitness.toFixed(3);
// }

// function pickTournament(pop, k = TOUR_SIZE, noRepeat = TOUR_NO_REPEAT) {
//     if (!noRepeat) {
//         let best = null;
//         for (let i = 0; i < k; i++) {
//             const cand = pop[Math.floor(Math.random() * pop.length)];
//             if (!best || cand.fitness > best.fitness) best = cand;
//         }
//         return best;
//     }
//     // wersja z noRepeat (oryginalna)
//     const used = new Set();
//     let best = null;
//     while (used.size < Math.min(k, pop.length)) {
//         const idx = Math.floor(Math.random() * pop.length);
//         if (used.has(idx)) continue;
//         used.add(idx);
//         const cand = pop[idx];
//         if (!best || cand.fitness > best.fitness) best = cand;
//     }
//     return best;
// }

// function crossoverWeights(w1, w2) {
//     const mix = (a,b) => a.map((v,i) => Math.random()<0.5 ? v : b[i]);
//     return {
//         W1: w1.W1.map((row,i) => row.map((v,j) => Math.random()<0.5 ? v : w2.W1[i][j])),
//         b1: mix(w1.b1, w2.b1),
//         W2: w1.W2.map((row,i) => row.map((v,j) => Math.random()<0.5 ? v : w2.W2[i][j])),
//         b2: mix(w1.b2, w2.b2)
//     };
// }

// function mutateWeights(w) {
//     const str = 0.22;
//     w.W1.forEach(row => row.forEach((_,j)=>{if(Math.random()<MUT_RATE) row[j] += randn()*str;}));
//     w.b1.forEach((_,i)=>{if(Math.random()<MUT_RATE) w.b1[i] += randn()*str;});
//     w.W2.forEach(row => row.forEach((_,j)=>{if(Math.random()<MUT_RATE) row[j] += randn()*str;}));
//     w.b2.forEach((_,i)=>{if(Math.random()<MUT_RATE) w.b2[i] += randn()*str;});
// }

// function evolve() {
//     population.forEach(a => a.computeFitness());
//     const sorted = [...population].sort((a,b)=> b.fitness - a.fitness);
//     bestFitness = sorted[0].fitness;

//     eliteTrails = sorted.slice(0, ELITE_COUNT).map(a => [...a.trail]);

//     const nextGen = [];
//     for (let i = 0; i < ELITE_COUNT; i++) {
//         nextGen.push(new Agent(new Net(6, HIDDEN, 2, sorted[i].net.copyWeights())));
//     }
//     while (nextGen.length < POP_SIZE) {
//         const p1 = pickTournament(population);
//         const p2 = pickTournament(population);
//         const child = crossoverWeights(p1.net.copyWeights(), p2.net.copyWeights());
//         mutateWeights(child);
//         nextGen.push(new Agent(new Net(6, HIDDEN, 2, child)));
//     }
//     population = nextGen;
//     generation++;
//     genEl.textContent = generation;
//     bestEl.textContent = bestFitness.toFixed(3);
// }

// // Rysowanie
// function drawMaze() {
//     ctx.fillStyle = '#333'; ctx.fillRect(0,0,W,H);
//     ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(goal.x,goal.y,goal.r,0,Math.PI*2); ctx.fill();
//     ctx.fillStyle = '#3498db'; ctx.beginPath(); ctx.arc(start.x,start.y,START_R,0,Math.PI*2); ctx.fill();
//     ctx.fillStyle = '#777';
//     for (const w of walls) ctx.fillRect(w.x, w.y, w.w, w.h);
// }

// function drawEliteTrails() {
//     ctx.lineWidth = 2.1;
//     for (let i = 0; i < eliteTrails.length; i++) {
//         const t = eliteTrails[i];
//         if (t.length < 3) continue;
//         ctx.strokeStyle = `hsla(${200 + i*55}, 90%, 65%, 0.7)`;
//         ctx.beginPath();
//         ctx.moveTo(t[0].x, t[0].y);
//         for (let j = 1; j < t.length; j++) ctx.lineTo(t[j].x, t[j].y);
//         ctx.stroke();
//     }
// }

// // Pętla
// let frameCount = 0;
// function loop() {
//     drawMaze();
//     drawEliteTrails();

//     for (const a of population) {
//         if (!paused) a.update();
//         a.draw();
//     }

//     if (!paused) {
//         frameCount++;
//         if (population.every(a => a.dead || a.reached) || frameCount >= STEP_LIMIT) {
//             evolve();
//             frameCount = 0;
//             population.forEach(a => {
//                 a.x = start.x; a.y = start.y;
//                 a.dead = false; a.reached = false;
//                 a.step = 0; a.minDist = START_TO_GOAL_DIST;
//                 a.collisionWarnings = 3;
//                 a.trail = [];
//             });
//         }
//     }
//     requestAnimationFrame(loop);
// }

// // Start
// resetPopulation();
// loop();
















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
        
        // NOWE POLA
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
            const speedBonus = Math.max(0, 1 - (this.step / STEP_LIMIT)) * 2;
            this.fitness = 10.0 + speedBonus;
            this.fitness += (STEP_LIMIT - this.step) / STEP_LIMIT * 0.1;
            return this.fitness;
        }

        const progress = 1 - (this.minDist / START_TO_GOAL_DIST);
        const progressScore = Math.max(0, progress) * 7.0;

        const aliveBonus = this.dead ? 0 : 0.5;
        const exploreBonus = (this.step / STEP_LIMIT) * 0.5;
        const survivalBonus = this.warnings < MAX_WARNINGS ? 0.3 * (MAX_WARNINGS - this.warnings) / MAX_WARNINGS : 0;

        this.fitness = progressScore + aliveBonus + exploreBonus + survivalBonus;
        this.fitness = Math.min(this.fitness, 9.99);

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
    const panelH = 95;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);
    
    ctx.font = '11px "Noto Sans"';
    
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`Gen: ${generation}`, panelX + 4, panelY + 12);
    
    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`Goal: ${generationStats.reachedCount}`, panelX + 4, panelY + 24);
    
    ctx.fillStyle = '#3498db';
    ctx.fillText(`Alive: ${generationStats.aliveCount}`, panelX + 4, panelY + 36);
    
    ctx.fillStyle = '#bbb';
    ctx.fillText(`Avg: ${generationStats.avgFitness.toFixed(2)}`, panelX + 4, panelY + 48);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillText(`Best: ${generationStats.maxFitness.toFixed(2)}`, panelX + 4, panelY + 60);
    
    if (avgGradients.W1 !== null) {
        ctx.fillStyle = '#888';
        ctx.font = '8px "Noto Sans"';
        ctx.fillText('W1:', panelX + 4, panelY + 74);
        drawGradientBar(panelX + 22, panelY + 68, 62, 7, avgGradients.W1);
        
        ctx.fillText('W2:', panelX + 4, panelY + 86);
        drawGradientBar(panelX + 22, panelY + 80, 62, 7, avgGradients.W2);
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

function mutateWeights(w) {
    const mutationStrength = 0.2;

    function mutMatrix(M) {
        for (let i = 0; i < M.length; i++) {
            for (let j = 0; j < M[i].length; j++) {
                if (Math.random() < MUT_RATE) {
                    M[i][j] += randn() * mutationStrength;
                }
            }
        }
    }

    function mutVector(v) {
        for (let i = 0; i < v.length; i++) {
            if (Math.random() < MUT_RATE) {
                v[i] += randn() * mutationStrength;
            }
        }
    }

    mutMatrix(w.W1);
    mutVector(w.b1);
    mutMatrix(w.W2);
    mutVector(w.b2);
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
    }
    population = Array.from({ length: POP_SIZE }, () => new Agent(new Net(6, HIDDEN, 2)));
    bestFitness = 0;
    genEl.textContent = generation;
    bestEl.textContent = bestFitness.toFixed(3);
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

    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
    const nextGen = [];

    const eliteCount = Math.min(ELITE_COUNT, sorted.length);
    
    elitePaths = [];
    for (let i = 0; i < eliteCount; i++) {
        if (sorted[i].path.length > 0) {
            elitePaths.push([...sorted[i].path]);
        }
    }
    
    computeAverageGradients(sorted.slice(0, eliteCount));

    for (let i = 0; i < eliteCount; i++) {
        const weights = sorted[i].net.copyWeights();
        const eliteAgent = new Agent(new Net(6, HIDDEN, 2, weights));
        eliteAgent.isElite = true;
        nextGen.push(eliteAgent);
    }

    while (nextGen.length < POP_SIZE) {
        const parent1 = pickTournament(population);
        const parent2 = pickTournament(population);

        const childWeights = crossoverWeights(
            parent1.net.copyWeights(),
            parent2.net.copyWeights()
        );

        mutateWeights(childWeights);
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

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════
resetPopulation();
loop();
