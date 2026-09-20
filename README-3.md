# Fysiktest for 1.g

En selvrettende fysiktest til 1.g med 1.904 spørgsmål i syv emner:

- bevægelse og kræfter
- energi
- varme og temperatur
- elektricitet
- bølger og lys
- atomfysik og radioaktivitet
- astronomi og verdensbilledet

Der er fem spørgsmålstyper:

- **Multiple choice** (1.118 spørgsmål).
- **Indtast tal** (173): eleven skriver tal og vælger enhed. Siden kender typiske fejl og giver målrettet respons, fx "du har glemt at omregne minutter til sekunder" eller "svaret er 10³ gange for lille".
- **Aflæs diagram** (570): et diagram tegnes over spørgsmålet, og eleven aflæser og regner. Svaret er enten multiple choice eller et tal. Diagrammerne er:
  - (v,t)- og (s,t)-grafer
  - kinetisk energi aflæst på en (v,t)-graf
  - opvarmningskurver med smeltning
  - kredsløbsdiagrammer i serie og parallel
  - bølgegrafer
  - henfaldskurver
  - HR-diagrammer
- **Tilpas linje** (13): eleven tilpasser en linje i et Hubble-diagram, aflæser hældningen og finder H₀ og universets alder. Et af diagrammerne viser Hubbles egne data fra 1929.
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
- `"tol"` i `facit` ændrer tolerancen, fx `0.05` ved aflæsning af en kurve.
- Siden kender disse enheder: J, kJ, MJ, kWh, W, kW, N, A, mA, V, Ω, Hz, kHz, MHz, GHz, THz, m, cm, km, nm, s, minutter, timer, døgn, år, m/s, km/h, m/s², °C og Bq.

**Diagrammer** (valgfrit felt på mc- og tal-spørgsmål). Siden tegner diagrammet over svaret ud fra disse data:

```js
"diagram":{"type":"linje","x":{"max":8,"trin":1,"navn":"t (s)"},"y":{"min":0,"max":16,"trin":4,"navn":"v (m/s)"},"punkter":[[0,0],[2,12],[5,12],[7,0]]}
"diagram":{"type":"henfald","A0":800,"T":8,"enhed":"minutter"}
"diagram":{"type":"boelge","A":2,"lambda":2}          // A i cm, lambda i m
"diagram":{"type":"kredsloeb","kobling":"parallel","R":[30,60],"U":24}
"diagram":{"type":"hr","stjerner":[{"navn":"A","T":15000,"L":0.003}, …]}   // L i forhold til Solen
```
`"fast_orden":true` bevarer rækkefølgen af svarene, fx Stjerne A–D.

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

## Resultater på e-mail

Testen kan sende hvert rettet resultat til læreren, både som e-mail og som en række i et Google-regneark. Det sker gennem en lille Google Apps Script-webapp på lærerens egen Google-konto. Koden ligger i `resultater-apps-script.gs`.

### Opsætning (ca. 10 minutter, kun én gang)

1. Opret et nyt, tomt Google-regneark, fx "Fysiktest – resultater".
2. Vælg **Udvidelser → Apps Script** (Extensions → Apps Script).
3. Slet det, der står i editoren, og indsæt hele indholdet af `resultater-apps-script.gs`.
4. Ret om nødvendigt e-mailadressen i linjen `const MODTAGER = …`, og tryk på gem-ikonet.
5. Vælg **Implementer → Ny implementering** (Deploy → New deployment).
6. Klik på tandhjulet, og vælg **Webapp**. Indstil:
   - **Udfør som:** Mig (Execute as: Me)
   - **Hvem har adgang:** Alle (Who has access: Anyone)
7. Tryk **Implementer**, og giv tilladelse, når Google spørger. Google advarer om, at appen ikke er verificeret. Det er normalt for ens egne scripts. Vælg **Avanceret → Gå til … (usikker)**, og tillad adgangen.
8. Kopiér webapp-adressen. Den ender på `/exec`.
9. Åbn `fysiktest.html`, og indsæt adressen øverst i scriptet:
   ```js
   const RESULTAT_URL = "https://script.google.com/macros/s/……/exec";
   ```
10. Læg den rettede `fysiktest.html` op på GitHub.

Når adressen står der, skal eleverne skrive navn og e-mail, før de kan starte. Når `RESULTAT_URL` er tom, forsvinder e-mailfeltet, og intet sendes.

### Hvad sendes

- **E-mailen** har emnelinjen "Fysiktest: navn – point/antal (procent)". Den indeholder resultatet pr. emne og hvert spørgsmål med elevens svar og facit. "Svar" i mailprogrammet går direkte til eleven.
- **Regnearket** får én række pr. test med tidspunkt, navn, e-mail, form, point, procent, resultat pr. emne og id'erne på de forkerte spørgsmål.

### Godt at vide

- Google begrænser, hvor mange e-mails et script må sende pr. døgn. For en almindelig Gmail-konto er det omkring 100. Regnearket får alle resultater uanset loftet.
- Hvis du senere retter i scriptet, skal du vælge **Implementer → Administrer implementeringer → Rediger → Ny version**. Så bevarer adressen sin værdi.
- Testen rettes i elevens browser. En teknisk kyndig elev vil derfor kunne sende et falsk resultat. Til selvtest og øvelse betyder det ikke noget, men testen egner sig ikke til karaktergivning.
