# Fysiktest for 1.g

En selvrettende fysiktest til 1.g med 1.334 spørgsmål i syv emner:

- bevægelse og kræfter
- energi
- varme og temperatur
- elektricitet
- bølger og lys
- atomfysik og radioaktivitet
- astronomi og verdensbilledet

Der er fire spørgsmålstyper:

- **Multiple choice** (1.118 spørgsmål).
- **Indtast tal** (173): eleven skriver tal og vælger enhed. Siden kender typiske fejl og giver målrettet respons, fx "du har glemt at omregne minutter til sekunder" eller "svaret er 10³ gange for lille".
- **Graf** (13): eleven tilpasser en linje i et Hubble-diagram, aflæser hældningen og finder H₀ og universets alder. Et af diagrammerne viser Hubbles egne data fra 1929.
- **Isolér** (30): eleven bygger en brøk af brikker for at isolere en størrelse i en formel.

## Filer

| Fil | Indhold |
|---|---|
| `fysiktest.html` | Selve testen (layout og program) |
| `spoergsmaal.js` | Databasen med alle spørgsmål, svar og forklaringer |

De to filer skal ligge i samme mappe. Siden virker både på GitHub Pages og når man åbner `fysiktest.html` direkte fra computeren.

## Fælles felter

Alle spørgsmål har disse felter:

| Felt | Betydning |
|---|---|
| `id` | Entydigt id, fx `ast-136` |
| `emne` | Emnet. Et nyt emnenavn giver automatisk et nyt emne på startsiden. |
| `type` | Samler varianter af samme opgave. En test tager højst én af hver type, før typen gentages, og "Øv de forkerte igen" giver en ny variant. `"Begreb"` betyder et enkeltstående spørgsmål. |
| `format` | `mc` (standard, kan udelades), `tal`, `graf` eller `isoler` |
| `spoergsmaal` | Spørgsmålsteksten |
| `forklaring` | Forklaringen, som vises efter retning |

HTML som `<sup>`, `<sub>`, `<b>` og `<i>` kan bruges i teksterne.

## Felter for hver spørgsmålstype

**mc**
```js
"svar":["rigtigt svar","forkert","forkert","forkert"]
```
Det rigtige svar står altid først. Siden blander rækkefølgen for eleven.

**tal**
```js
"facit":{"vaerdi":360000,"enhed":"J","tekst":"3,6·10<sup>5</sup> J"},
"enheder":["J","kJ","MJ","kWh","W","N"],
"fejl":[{"vaerdi":6000,"enhed":"J","tekst":"Du har vist regnet med minutter …"}]
```
- Svaret godkendes inden for 2 %, uanset hvilken enhed med samme dimension eleven vælger. Både 360 kJ og 360000 J er altså rigtige.
- En enhed med forkert dimension (fx W i stedet for J) giver sin egen besked.
- Siden kender disse enheder: J, kJ, MJ, kWh, W, kW, N, A, mA, V, Ω, Hz, kHz, MHz, GHz, THz, m, nm og s.

**graf**
```js
"punkter":[[afstand i Mpc, hastighed i km/s], …]
```
Den bedste linje gennem (0,0) og tolerancen beregnes af siden selv.

**isoler**
```js
"ligning":"U = R·I", "maal":"I", "fliser":["U","R","I","2"], "taeller":["U"], "naevner":["R"]
```
En tom nævner betyder 1. Brikkerne i `fliser` skal have forskellige navne.
