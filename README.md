# Neuroewolucja: Nawigacja w Labiryncie

Algorytm genetyczny optymalizuje wagi sieci neuronowej (MLP) sterującej agentem w labiryncie 2D. Brak backpropagation.

## Architektura

### Sieć (MLP Feed-Forward)

Topologia: 6 → HIDDEN (ReLU) → 2 (Tanh)

**Wejścia (6):** 4 raycasty do ścian (znormalizowane 0–1), 2 składowe znormalizowanego wektora kierunku do celu.

**Wyjścia (2):** wektor prędkości (dx, dy) w zakresie [-1, 1]. Ruch agenta co krok: pozycja += wyjście × SPEED.

**Inicjalizacja wag:** He-like z mianownikiem fan\_in + fan\_out.

### Algorytm Genetyczny

**Selekcja** — turniejowa: k losowych osobników, wygrywa najlepszy fitness. Opcja bez powtórzeń.

**Krzyżowanie** — uniform: każda waga dziedziczona 50/50 od rodzica A lub B.

**Mutacja** — adaptacyjna Gaussa. Siła skalowana do średniej wartości bezwzględnej wag w warstwie. Decay wykładniczy względem numeru generacji, kompensowany wzrostem wag. Mnożnik stagnacji ×1.8 przy niskim fitness po 30. generacji.

**Elita** — top N osobników kopiowanych wprost. Opcjonalna mikro-mutacja (5% siły) przy wysokim fitness bez osiągnięcia celu.

### Fitness (maks. 10.0)

Dotarcie do celu: +10.0 + bonus za szybkość (mniej kroków = więcej). Postęp: kombinacja najlepszego osiągniętego dystansu (60%) i aktualnego (40%), skalowana ×8.0. Przeżycie: +0.3 za brak śmierci. Eksploracja: bonus proporcjonalny do postępu i numeru kroku. Bezpieczeństwo: maleje z każdym ostrzeżeniem kolizji. Proksymalność: dodatkowy bonus powyżej 50% postępu, zachęta do dokończenia trasy.

## Parametry

**Neurony ukryte** (2–64) — zmiana wymusza restart. **Prędkość** (0.5–2.0) — mnożnik wyjścia sieci, działa co krok, bez restartu. **Mutacja** (1%–50%), **Elita** (0–7), **Rozmiar turnieju** (5–50), **Bez powtórzeń** — zmiany obowiązują od następnego pokolenia.

Stałe: populacja 100, limit kroków 600, promień agenta 3 px, promień celu 12 px, grubość ścian 5 px, maks. ostrzeżeń 3, okres ochronny 50 kroków.

## Diagnostyka (overlay na canvas)

Paski W1/W2 — RMS wag warstw. Stosunek W2/W1 — balans siły warstw. σ — odchylenie standardowe fitness. Licznik dotarć do celu. Histogram rozkładu fitness. Ścieżki elity z poprzedniej generacji.

## Stack

HTML5 Canvas, vanilla JS, requestAnimationFrame.
