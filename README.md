**Neuroewolucja** to technika uczenia maszynowego, która łączy dwie fundamentalne idee:
- **Sieci neuronowe** – matematyczne modele inspirowane budową mózgu, zdolne do uczenia się zadań poprzez dostosowywanie wag pomiędzy neuronami.
- **Algorytmy genetyczne** – metody optymalizacji inspirowane ewolucją biologiczną, gdzie populacja rozwiązań ewoluuje poprzez selekcję, krzyżowanie i mutację.

W neuroewolucji **wagi sieci neuronowej** traktowane są jako **genotyp** (zestaw cech dziedziczonych), a **jakość rozwiązania** (np. zdolność do przejścia labiryntu) jako **fitness** (przystosowanie). Populacja sieci neuronowych ewoluuje, by coraz lepiej rozwiązywać postawione zadanie.

### Zalety w porównaniu do samodzielnej sieci neuronowej
| Aspekt | Sieć neuronowa (uczenie gradientowe) | Neuroewolucja |
|--------|--------------------------------------|---------------|
| **Wymagania wstępne** | Potrzebuje zestawu danych treningowych (wejście–wyjście) | **Nie potrzebuje danych** – uczy się przez interakcję ze środowiskiem |
| **Problem gradientu** | Wymaga różniczkowalnej funkcji celu; łatwo utknąć w minimum lokalnym | **Nie używa gradientu** – przeszukuje przestrzeń rozwiązań globalnie |
| **Odporność na szum** | Często wrażliwa na zakłócenia w danych | **Bardziej odporna** – różnorodność populacji pomaga znaleźć stabilne rozwiązania |
| **Eksploracja** | Zwykle eksploruje wokół początkowego punktu | **Eksploruje szeroko** dzięki mutacjom i krzyżowaniu |

### Zalety w porównaniu do samodzielnego algorytmu genetycznego
| Aspekt | Algorytm genetyczny (bez sieci) | Neuroewolucja |
|--------|----------------------------------|---------------|
| **Reprezentacja rozwiązania** | Zwykle wektor liczb (geny) | **Sieć neuronowa** – zdolna do przetwarzania złożonych danych sensorycznych |
| **Generalizacja** | Rozwiązanie dopasowane do konkretnego przypadku | Sieć może **uogólniać** na podobne sytuacje (np. inne układy ścian) |
| **Ciągłość przestrzeni** | Dyskretne lub ciągłe geny | Wagowa przestrzeń ciągła – **płynne dostosowanie** zachowania |
| **Zdolność adaptacyjna** | Stały zestaw reguł | Sieć może **dynamicznie reagować** na zmieniające się warunki |

Neuroewolucja łączy **elastyczność sieci neuronowych** w przetwarzaniu danych z **globalnymi możliwościami przeszukiwania algorytmów genetycznych**. Jest szczególnie przydatna, gdy:
- Nie mamy danych treningowych (uczenie przez wzmocnienie),
- Przestrzeń rozwiązań jest wielowymiarowa i pełna minimów lokalnych,
- Potrzebujemy rozwiązania odpornego na zmiany środowiska.

---

## Architektura symulacji

### 1. Środowisko – labirynt
- Wymiary: 320×320 pikseli
- Stałe elementy: zewnętrzne ściany + wewnętrzne przeszkody
- **Start** (niebieskie kółko) – pozycja początkowa agentów
- **Cel** (zielone kółko) – punkt docelowy (promień 12 px)

### 2. Agent – inteligentny poruszający się obiekt
- Reprezentowany przez kółko o promieniu 3 px
- Wyposażony w **sieć neuronową** i **system sensorów**
- Może otrzymywać ostrzeżenia kolizji (maks. 3), po których ginie

### 3. Sieć neuronowa agenta
- **Warstwa wejściowa:** 6 neuronów:
  - 4 sensory odległości od ścian (góra, dół, lewo, prawo)
  - 2 składowe znormalizowanego wektora do celu (kierunek)
- **Warstwa ukryta:** konfigurowalna (domyślnie 8 neuronów), funkcja aktywacji ReLU
- **Warstwa wyjściowa:** 2 neurony – prędkość w osi X i Y (zakres [-1,1] via tanh)
- **Inicjalizacja wag:** He (Kaiming) – zapewnia stabilność na starcie

### 4. Algorytm genetyczny
- **Populacja:** 100 agentów
- **Selekcja:** turniejowa (domyślnie 20 uczestników, opcja bez powtórzeń)
- **Krzyżowanie:** jednopunktowe (losowy wybór wag od rodziców)
- **Mutacja:** Gausowska z **normalizowaną siłą** – siła mutacji jest automatycznie skalowana przez średnią wartość bezwzględną wag w danej warstwie
- **Elityzm:** najlepsze osobniki przechodzą do następnej generacji (domyślnie 3)
- **Funkcja fitness:** opisana poniżej

### 5. Funkcja przystosowania (fitness)
Fitness mierzy, jak dobrze agent radzi sobie z zadaniem. Maksymalna wartość: **10.0**.

Składniki fitness:
- **Dotarcie do celu:** +10.0 + bonus za szybkość
- **Postęp w kierunku celu:** nagroda za zmniejszenie odległości (najlepsza i aktualna)
- **Bonus za przeżycie:** +0.3 jeśli agent żyje
- **Bonus za eksplorację:** zachęta do ruchu w późniejszych krokach
- **Bonus za unikanie kolizji:** zmniejsza się z każdym ostrzeżeniem
- **Bonus za bliskość celu w końcowej fazie:** zachęta do „dokończenia” zadania

Funkcja jest **wypukłą kombinacją** powyższych składników, co zapewnia stabilną ewolucję.

---

## Elementy wizualizacji i kontrolki

### Panel główny (labirynt)
![Labirynt](https://via.placeholder.com/320x320/333/777?text=Labirynt)
- **Niebieskie kółko** – start
- **Zielone kółko** – cel
- **Szare prostokąty** – ściany labiryntu
- **Kolorowe kropki** – agenci:
  - **Szare** – zwykły agent
  - **Żółte** – elita (najlepsi w populacji)
  - **Zielone** – agent, który dotarł do celu
  - **Czarne** – martwy agent
  - **Czerwone kropki** nad agentem – liczba ostrzeżeń kolizji

### Ścieżki elity
- **Żółte, przerywane linie** – pokazują trasy, którymi poruszały się najlepsze agenty w poprzedniej generacji
- **Kolorowe punkty na końcach** – ostatnie pozycje elit

### Panel informacyjny na labiryncie
W lewym górnym rogu znajduje się mały panel z kluczowymi metrykami:
- **Goal:** liczba agentów, które dotarły do celu w bieżącej generacji
- **W1, W2:** paski wskazujące średnią wartość wag warstwy 1 i 2 (większa wartość = silniejsze połączenia)
- **σ:** odchylenie standardowe fitness w populacji
- **W2/W1:** stosunek średnich wag – wskazuje, która warstwa ma większe znaczenie

### Histogram rozkładu fitness
Wykres słupkowy pod labiryntem pokazuje **rozkład wartości fitness** w populacji. Oś X: przedziały fitness (0–10), oś Y: liczba agentów w przedziale. Kolory od zielonego do niebieskiego.

### Kontrolki parametrów (prawa kolumna)

#### 1. Kontrolki symulacji
- **Przycisk „Restart”** – rozpoczyna ewolucję od nowa (zeruje wszystkie pokolenia)
- **Przycisk „Pauza/Wznów”** – wstrzymuje/wznawia symulację
- **Suwak prędkości** – reguluje szybkość ruchu agentów (0.5x – 1.0x)

#### 2. Parametry neuroewolucji
- **Neurony ukryte** (2–20) – liczba neuronów w warstwie ukrytej sieci
- **Współczynnik mutacji** (1%–30%) – prawdopodobieństwo mutacji pojedynczej wagi
- **Liczba elitarna** (1–10) – ile najlepszych agentów przechodzi bez zmian do następnej generacji
- **Rozmiar turnieju** (5–50) – liczba uczestników w każdym turnieju selekcji
- **Turniej bez powtórzeń** – checkbox zapobiegający wielokrotnemu udziałowi tego samego agenta w turnieju

#### 3. Informacje o sieci neuronowej
- **Warstwa ukryta** – aktualna liczba neuronów
- **Wejścia/wyjścia** – struktura sieci
- **Średnie wartości wag** W1 i W2 – średnia geometryczna wartości bezwzględnych wag danej warstwy
- **Stosunek W2/W1** – wskazuje, czy sieć „koncentruje się” bardziej na warstwie wyjściowej (W2 > W1) czy ukrytej (W1 > W2)
- **Odchylenie std. fitness** – miara zróżnicowania przystosowania w populacji
- **Osiągnęło cel** – liczba agentów, które dotarły do celu w bieżącej generacji

---

## Opis parametrów i statystyk

### 1. Wagi sieci neuronowej (W1, W2)
- **W1** – macierz wag łączących warstwę wejściową z ukrytą. Rozmiar: `hidden × 6`
- **W2** – macierz wag łączących warstwę ukrytą z wyjściową. Rozmiar: `2 × hidden`
- **Interpretacja wartości**: Wagi są inicjalizowane małymi liczbami losowymi z rozkładu normalnego. W trakcie ewolucji wartości bezwzględne wag rosną, gdy sieć „uczy się” silnych połączeń.

### 2. Stosunek wag W2/W1
- **W2/W1 ≈ 1** – obie warstwy mają podobny wpływ na wynik
- **W2/W1 > 1** – warstwa wyjściowa ma większe znaczenie (częste w późnych fazach ewolucji)
- **W2/W1 < 1** – warstwa ukryta dominuje (wczesna faza, sieć uczy się abstrakcyjnych reprezentacji)

**Przykład**: Jeśli W2/W1 = 1.5, oznacza to, że średnia wartość wag w warstwie wyjściowej jest 1.5× większa niż w warstwie ukrytej – sieć „podejmuje decyzje” głównie na podstawie ostatniej warstwy.

### 3. Odchylenie standardowe fitness (σ)

Odchylenie standardowe fitness mierzy **zróżnicowanie przystosowania** w populacji:

$$\sigma_f = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(f_i - \bar{f})^2}$$

gdzie $f_i$ to fitness i-tego agenta, a $\bar{f} = \frac{1}{N}\sum f_i$ to średni fitness.

**Interpretacja wartości:**

| Zakres σ | Opis | Co to oznacza dla ewolucji |
|----------|------|---------------------------|
| **σ < 1** | Niskie | Populacja jednorodna – większość agentów ma podobny fitness. Może wskazywać na stagnację lub że wszyscy są jednakowo słabi. |
| **1 < σ < 2.5** | Optymalne | Zdrowa różnorodność – algorytm skutecznie selekcjonuje lepszych od gorszych. Ewolucja postępuje. |
| **σ > 2.5** | Wysokie | Duże zróżnicowanie – silna selekcja działa. Może być okres przełomowy (wielkie różnice między najlepszymi a najgorszymi). |

**Uwaga:** Wartości fitness są w zakresie 0–10, więc σ = 2 oznacza, że typowy agent różni się od średniej o około 20% maksymalnego możliwego fitness.

### 4. Liczba agentów, które osiągnęły cel
- **0** – żaden agent jeszcze nie dotarł (wczesna faza ewolucji)
- **1–10** – pojedyncze sukcesy
- **>10** – algorytm znalazł dobre rozwiązanie, które jest kopiowane w populacji

### 5. Siła mutacji i jej normalizacja
Siła mutacji jest obliczana według wzoru:

$$\sigma_{mut} = \max(0.1, 0.3 \cdot multiplier \cdot e^{-g/500}) \cdot \frac{\bar{|w|}}{0.4}$$

gdzie:
- $g$ – numer pokolenia
- $\bar{|w|}$ – średnia wartość bezwzględna wag w danej warstwie
- $0.4$ – referencyjna wartość początkowa (z inicjalizacji He)

**Kluczowa obserwacja:** Choć wykładniczy czynnik $e^{-g/500}$ zmniejsza bazową siłę mutacji, to **normalizacja przez średnią wartość wag** kompensuje ten spadek. Gdy wagi rosną (co naturalnie dzieje się podczas ewolucji), siła mutacji również rośnie proporcjonalnie. Dzięki temu mutacja jest **skalowana względem aktualnej skali sieci** – niezależnie od tego, czy wagi są małe (start) czy duże (po wielu pokoleniach), perturbacja jest zawsze proporcjonalna.

**Wynik:** Siła mutacji utrzymuje się na stabilnym poziomie poniżej wartości maksymalnej, ale **rośnie wraz z wagami**, zapewniając ciągłą eksplorację nawet w późnych fazach ewolucji.

---

### Sygnały problemów
- **Stagnacja** – fitness nie rośnie przez >50 pokoleń, σ bardzo niskie
  - *Rozwiązanie*: zwiększ współczynnik mutacji, włącz turniej bez powtórzeń
- **Przedwczesna zbieżność** – populacja jednorodna, ale fitness niski
  - *Rozwiązanie*: zmniejsz liczbę elit, zwiększ rozmiar turnieju
- **Brak postępu** – agenty ciągle giną na tej samej przeszkodzie
  - *Rozwiązanie*: zwiększ liczbę neuronów ukrytych, zmniejsz prędkość

---

**Jak obliczane są średnie wartości wag?**

Średnie wartości wag dla pasków gradientowych są obliczane jako **RMS (Root Mean Square)**:

$$\text{RMS}(W) = \sqrt{\frac{1}{N}\sum_{i,j} w_{ij}^2}$$

gdzie suma obejmuje wszystkie wagi w danej warstwie. Używamy RMS zamiast prostej średniej arytmetycznej, ponieważ:
- Uwzględnia zarówno dodatnie, jak i ujemne wagi
- Jest miarą "energii" lub "siły" połączeń
- Jest naturalną miarą w kontekście inicjalizacji He/Kaiming




**Dlaczego warto śledzić te wskaźniki?**
- **Rosnące W1/W2** – sieć „uczy się" silniejszych reprezentacji
- **W2/W1 bliskie 1** – równowaga między warstwami
- **W2/W1 > 1.5** – warstwa wyjściowa dominuje (często w fazie eksploatacji)
- **Wysokie σ** – duża różnorodność, silna selekcja
- **Niskie σ** – populacja jednorodna, ryzyko stagnacji

### Dostosowanie parametrów
- Wszystkie parametry można zmieniać **w trakcie działania** symulacji
- Zmiana liczby neuronów ukrytych lub prędkości powoduje **restart populacji**
- Pozostałe zmiany (mutacja, elity, turniej) obowiązują od **następnej generacji**

---

## Słownik pojęć

| Termin | Definicja (dla matematyka) | Analogia biologiczna |
|--------|----------------------------|----------------------|
| **Sieć neuronowa** | Funkcja $f: \mathbb{R}^n \to \mathbb{R}^m$ złożona z warstw liniowych przeplatanych nieliniowościami | Mózg – neurony połączone synapsami |
| **Waga (weight)** | Współczynnik $w_{ij}$ w transformacji liniowej między warstwami | Siła połączenia między neuronami |
| **Fitness** | Skalarna funkcja celu $J(\theta)$ mierząca jakość rozwiązania | Przystosowanie osobnika do środowiska |
| **Selekcja turniejowa** | Wybór najlepszego z $k$ losowych osobników | Turniej – zwycięzca przechodzi dalej |
| **Krzyżowanie (crossover)** | Losowa kombinacja genotypów dwóch rodziców | Rekombinacja chromosomów |
| **Mutacja** | Dodanie szumu Gaussa do wagi z prawdopodobieństwem $p_m$ | Losowa zmiana w DNA |
| **Elityzm** | Zachowanie $e$ najlepszych rozwiązań bez zmian | Ochrona gatunków zagrożonych |
| **Odchylenie standardowe fitness** | $\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^N (f_i - \bar{f})^2}$ | Miara zróżnicowania w populacji |
| **Stosunek wag** | $r = \frac{\|W_2\|}{\|W_1\|}$ gdzie $\|W\|$ to norma Frobeniusa | Stosunek siły połączeń między warstwami |

---

