# Neuroewolucja: Nawigacja w Labiryncie

Symulacja ewolucji sieci neuronowej sterującej agentem w środowisku 2D. Projekt wykorzystuje algorytm genetyczny do optymalizacji wag sieci bez użycia propagacji wstecznej (backpropagation).

## 🏗 Architektura Systemu

### 1. Środowisko (Labirynt)
*   **Wymiary:** 320×320 px.
*   **Struktura:** Stałe ściany zewnętrzne oraz wewnętrzne przeszkody definiowane tablicą współrzędnych.
*   **Punkty kontrolne:**
    *   **Start:** Pozycja początkowa wszystkich agentów w generacji.
    *   **Cel:** Strefa docelowa o promieniu 12 px. Dotarcie kończy epizod dla danego agenta z sukcesem.

### 2. Agent i Sensoryka
Agent jest reprezentowany jako obiekt kołowy (promień 3 px) wyposażony w sieć neuronową.
*   **Wejścia sieci (6 neuronów):**
    1.  Odległość do ściany w górę (znormalizowana 0–1).
    2.  Odległość do ściany w dół.
    3.  Odległość do ściany w lewo.
    4.  Odległość do ściany w prawo.
    5.  Wektor kierunku do celu (składowa X, znormalizowana).
    6.  Wektor kierunku do celu (składowa Y, znormalizowana).
*   **Wyjścia sieci (2 neurony):**
    *   Prędkość w osi X (`dx`) i Y (`dy`). Wartości z zakresu `[-1, 1]` (aktywacja `tanh`).
*   **System ostrzeżeń:**
    *   Agent posiada licznik kolizji (`MAX_WARNINGS = 3`).
    *   Po przekroczeniu limitu agent ginie.
    *   Okres ochronny (`GRACE_PERIOD = 50` kroków) na starcie zapobiega natychmiastowej śmierci przy respawnie.

### 3. Sieć Neuronowa (MLP)
Jednokierunkowa sieć typu Feed-Forward bez pamięci (brak RNN/LSTM).
*   **Topologia:** `6 (Input) → HIDDEN (ReLU) → 2 (Output/Tanh)`
*   **Warstwa ukryta:** Konfigurowalna liczba neuronów (domyślnie 8). Funkcja aktywacji: `ReLU`.
*   **Inicjalizacja wag:** Rozkład normalny skalowany metodą He-like (uwzględniającą fan-in i fan-out), co zapewnia stabilność sygnału na początku ewolucji.

---

## 🧬 Algorytm Genetyczny

Ewolucja odbywa się w dyskretnych pokoleniach. Cała populacja jest oceniana, a następnie tworzone jest nowe pokolenie na podstawie wyników.

### Parametry Konfiguracyjne
| Parametr | Zakres / Wartość | Opis wpływu |
| :--- | :--- | :--- |
| **Neurony ukryte** | 2 – 64 | Złożoność modelu decyzyjnego. Zmiana wymaga restartu populacji. |
| **Mutacja** | 1% – 50% | Prawdopodobieństwo zmiany pojedynczej wagi. |
| **Elita** | 0 – 7 | Liczba najlepszych agentów kopiowanych bezpośrednio do następnego pokolenia. |
| **Rozmiar turnieju** | 5 – 50 | Liczba losowych kandydatów rywalizujących o miejsce rodzica. |
| **Turniej bez powtórzeń** | Tak/Nie | Czy ten sam agent może być wylosowany wielokrotnie w jednym turnieju. |
| **Prędkość symulacji** | 0.5x – 2.0x | Mnożnik prędkości ruchu agentów (tylko wizualne/przyspieszenie czasu). |

### Operatory Ewolucyjne

#### 1. Selekcja Turniejowa
Dla każdego miejsca w nowym pokoleniu (poza elitą) przeprowadzany jest turniej:
*   Losowanych jest `k` agentów z obecnej populacji.
*   Wygrywa osobnik o najwyższym Fitness.
*   Opcja `TOUR_NO_REPEAT` wymusza unikalność uczestników turnieju.

#### 2. Krzyżowanie (Crossover)
Metoda jednopunktowa na poziomie wag (Uniform Crossover):
*   Dla każdej wagi i biasu dziecka, wartość jest dziedziczona z prawdopodobieństwem 50% od Rodzica A lub Rodzica B.

#### 3. Adaptacyjna Mutacja Gaussa
Kluczowy mechanizm zapobiegający stagnacji i eksplozji wag. Siła mutacji nie jest stała.
*   **Skalowanie:** Siła mutacji jest dynamicznie dostosowywana do średniej wartości bezwzględnej wag w danej warstwie (`avg(|w|)`).
*   **Decay:** Bazowa siła mutacji maleje wykładniczo wraz z numerem pokolenia (`e^{-generation/500}`), ale jest kompensowana przez wzrost wag w trakcie nauki.
*   **Stagnacja:** Jeśli fitness najlepszego agenta jest niski po 30. pokoleniu, wprowadzany jest mnożnik zwiększający siłę mutacji (exploration boost).
*   **Mutacja Elity:** Najlepsi agenci (Elita) podlegają bardzo słabej mutacji (5% standardowej siły), aby utrzymać jakość rozwiązania przy jednoczesnej mikro-eksploracji.

---

## 📊 Funkcja Fitness (Ocena)

Maksymalny możliwy wynik to **10.0**. Funkcja jest złożona z kilku składników ważonych, aby nagradzać nie tylko cel, ale też postęp i bezpieczeństwo.

### Składniki oceny:
1.  **Sukces (Dotarcie do celu):**
    *   Baza: `+10.0`.
    *   Bonus za szybkość: Dodatkowe punkty za mniejszą liczbę kroków potrzebnych do osiągnięcia celu.
2.  **Postęp (Progress):**
    *   Nagroda za zmniejszenie dystansu do celu względem startu.
    *   Wzór: Kombinacja liniowa najlepszego osiągniętego dystansu (60% wagi) i aktualnego dystansu (40% wagi).
3.  **Przeżycie:**
    *   Stały bonus `+0.3` dla agentów, które nie zginęły do końca limitu kroków.
4.  **Eksploracja:**
    *   Bonus proporcjonalny do postępu i liczby wykonanych kroków (nagradza ruch w późnej fazie epizodu).
5.  **Bezpieczeństwo:**
    *   Kara za ostrzeżenia o kolizji. Im więcej ostrzeżeń, tym niższy bonus przetrwania.
6.  **Proksymalność (Końcówka gry):**
    *   Dodatkowy bonus dla agentów, które znajdują się bardzo blisko celu (>50% postępu), zachęcający do "dokończenia" zadania zamiast krążenia.

---

## 🖥 Interfejs i Wizualizacja

Panel boczny i overlay na canvasie dostarczają danych telemetrycznych w czasie rzeczywistym.

### Statystyki Pokolenia
*   **Populacja:** Liczba żywych agentów w bieżącym kroku.
*   **Generacja:** Numer obecnej generacji.
*   **Naj./Śr. Fit:** Maksymalny i średni fitness w populacji.
*   **Histogram:** Rozkład fitnessu w populacji (słupkowy wykres częstotliwości).

### Diagnostyka Sieci (Overlay na Canvas)
W lewym górnym rogu symulacji wyświetlany jest panel diagnostyczny:
*   **Goal:** Licznik agentów, które osiągnęły cel w tej generacji.
*   **Paski Wag (W1 / W2):** Wizualizacja średniej geometrycznej (RMS) wartości wag w warstwach.
    *   Kolor paska zmienia się od niebieskiego (niskie wagi) do zielonego/czerwonego (wysokie wagi).
    *   Służy do monitorowania, czy sieć "uczy się" (wagi rosną) czy degeneruje.
*   **Stosunek W2/W1:** Iloraz siły wag warstwy wyjściowej do ukrytej.
    *   Wartość > 1 sugeruje dominację warstwy wyjściowej (faza eksploatacji).
    *   Wartość < 1 sugeruje dominację warstwy ukrytej (faza ekstrakcji cech).
*   **σ (Odchylenie standardowe):** Miara różnorodności fitnessu w populacji.
    *   Niskie σ (< 1.0) może oznaczać stagnację lub przedwczesną zbieżność.
    *   Wysokie σ oznacza silną selekcję i duże różnice między osobnikami.

### Ścieżki Elity
Na mapie rysowane są ścieżki najlepszych agentów z poprzednich pokoleń (Elita):
*   **Kolor:** Zależny od sukcesu (zielony - cel osiągnięty, żółty - w trakcie).
*   **Styl:** Linia przerywana, pozwalająca prześledzić historię decyzji najlepszych osobników.

---

## ⚙️ Szczegóły Implementacyjne

*   **Limit kroków:** `STEP_LIMIT = 600` na epizod.
*   **Detekcja kolizji:** Raycasting dla sensorów + test przecięcia okręgu z prostokątem dla ruchu.
*   **Renderowanie:** HTML5 Canvas API.
*   **Pętla główna:** `requestAnimationFrame` z obsługą pauzy i przyspieszenia czasu.
*   **Reset:** Zmiana architektury sieci (liczba neuronów) lub prędkości bazowej wymusza twardy reset (`hard reset`) całej symulacji. Zmiana parametrów GA (mutacja, elita) działa od kolejnego pokolenia.
```