# Selvrettende test – otte fag på stx

En samling selvrettende tests, der følger de danske stx-læreplaner. Alle tests bruger samme program (samme retning, forklaringer, prøveform og afsendelse af resultater) med hver sin database af spørgsmål og hver sine tegnefunktioner.

| Fag | Side | Database | Spørgsmål |
|---|---|---|---|
| Fysik C, B, A | `fysiktest.html?niveau=C/B/A` | `spoergsmaal.js` | 887 / 2.839 / 3.572 |
| Astronomi C | `fysiktest.html?niveau=astro` | `spoergsmaal.js` | 1.168 |
| Kemi | `kemi.html` | `kemi.js` | 343 |
| Biologi | `biologi.html` | `biologi.js` | 1.001 |
| Historie | `historie.html` | `historie.js` | 308 |
| Samfundsfag | `samfundsfag.html` | `samfundsfag.js` | 1.228 |
| Religion | `religion.html` | `religion.js` | 1.015 |
| Dansk | `dansk.html` | `dansk.js` | 1.197 |
| Engelsk | `engelsk.html` | `engelsk.js` | 1.017 |
| Matematik | `matematik.html` | `matematik.js` | 2.017 |

Desuden fire tests på **grundskoleniveau** (folkeskolen), med enklere sprog end stx-testene ovenfor:

| Fag | Side | Database | Spørgsmål |
|---|---|---|---|
| Naturfag (7.-9. kl.) | `naturfag.html` | `naturfag.js` | 1.601 |
| Kristendomskundskab | `kristendomskundskab.html` | `kristendomskundskab.js` | 1.001 |
| Engelsk (grundskole) | `engelsk-grundskole.html` | `engelsk-grundskole.js` | 1.001 |
| Dansk (grundskole) | `dansk-grundskole.html` | `dansk-grundskole.js` | 1.003 |
| Matematik (grundskole) | `matematik-grundskole.html` | `matematik-grundskole.js` | 1.292 |

`testoversigt.html` samler links til alle femten tests (ti på stx-niveau og fem på grundskoleniveau). `index.html` (din hjemmeside) linker til oversigten.

Nedenfor beskrives først fysik/astronomi-testen i detaljer (den ældste og mest udbyggede), og til sidst kommer et fælles afsnit om de seks andre fag.

---

# Fysiktest – Fysik C, B og A samt Astronomi C (stx)

En selvrettende test med 3.794 spørgsmål, der følger læreplanerne for fysik på stx (Fysik C 2017, Fysik B 2024, Fysik A 2017) og valgfaget Astronomi C (2017).

## Niveauer

Eleven vælger niveau på startsiden, eller man linker direkte:

| Link | Indhold |
|---|---|
| `fysiktest.html?niveau=C` | Kernestoffet i Fysik C |
| `fysiktest.html?niveau=B` | Kernestoffet i Fysik B (inkl. C) |
| `fysiktest.html?niveau=A` | Kernestoffet i Fysik A (inkl. B og C) |
| `fysiktest.html?niveau=astro` | Astronomi C (valgfag) |
| `fysiktest.html` | Alle spørgsmål |

Supplerende stof (fx prismer, regnbuen, hyperbelbaner, HR-diagrammer) kan slås til og fra. Emneknapperne følger læreplanens områder: Verdensbilledet, Energi, Bølger, lyd og lys, Atomer, kvantefysik og radioaktivitet, Elektriske kredsløb, Mekanik samt Elektriske og magnetiske felter.

Astronomi C har sine egne emneknapper efter læreplanen: Stjernehimlen og himmelfænomener, Verdensbilledets historie, Solsystemet, Planeter og exoplaneter, Mælkevejen og galakser, Afstande i universet, Big Bang og universets udvikling, Stjerners liv samt Mørkt stof og sorte huller. Et spørgsmål hører til astronomitesten, når det har feltet `"astro"` med et af disse områder. Spørgsmål med `"kunAstro": true` indgår kun i astronomitesten.

Hvert spørgsmål har felterne `"niveau"` (det laveste niveau, hvor det er kernestof), `"omraade"` (læreplanens område) og eventuelt `"suppl": true`.

## Emner

Spørgsmålene dækker bl.a.:

- bevægelse og kræfter
- energi
- varme og temperatur
- elektricitet
- bølger og lys
- atomfysik og radioaktivitet
- astronomi og verdensbilledet

Der er seks spørgsmålstyper:

- **Multiple choice** (1.118 spørgsmål).
- **Indtast tal** (173): eleven skriver tal og vælger enhed. Siden kender typiske fejl og giver målrettet respons, fx "du har glemt at omregne minutter til sekunder" eller "svaret er 10³ gange for lille".
- **Aflæs diagram** (1.701): en figur tegnes over spørgsmålet, og eleven aflæser, tolker og regner. Svaret er enten multiple choice eller et tal. Figurerne er:
  - bevægelse: bevægelsesligningerne med tilhørende (s,t)-, (v,t)- og (a,t)-grafer, "hvilken graf passer?", lodret kast, skråplaner, penduler (måling af g, grafmetode, sammenligning af længder og masser), fjedre i serie og parallel, Hookes lov og dens gyldighed, elastisk energi og fjederpendulet
  - energi og varme: opvarmningskurver
  - elektricitet: kredsløbsdiagrammer
  - bølger og lys: bølgegrafer, linser, lysbrydning, prismer (strålegang, afbøjning, minimumafbøjning), totalrefleksion, regnbuen, prisme og gitter, laser med gitter og Youngs dobbeltspalte
  - atomfysik: Bohrs brintmodel, energidiagrammer med overgange, linjespektre og henfaldskurver
  - astronomi: stjernespektre, rødforskydning, Keplers tre love (banens mål, arealer og omløbstider), hyperbelbaner for interstellare objekter som ʻOumuamua, 2I/Borisov og 3I/ATLAS, modeller af solsystemet og HR-diagrammer
- **Tilpas linje** (13): eleven tilpasser en linje i et Hubble-diagram, aflæser hældningen og finder H₀ og universets alder. Et af diagrammerne viser Hubbles egne data fra 1929.
- **Tilpas bane** (40): eleven indstiller excentricitet og periheldistance med skydere, så en ellipse eller hyperbel går gennem observerede kometpositioner, og afgør derefter, om kometen er bundet til Solen.
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
- Siden kender disse enheder: J, kJ, MJ, kWh, W, kW, N, A, mA, V, Ω, eV, km/s, Hz, kHz, MHz, GHz, THz, m, mm, cm, km, nm, AU, s, minutter, timer, døgn, år, m/s, km/h, m/s², °C, Bq, N/m og ° (grader). Enheden "" bruges til rene tal som brydningsindeks.

**Diagrammer** (valgfrit felt på mc- og tal-spørgsmål). Siden tegner diagrammet over svaret ud fra disse data:

```js
"diagram":{"type":"linje","x":{"max":8,"trin":1,"navn":"t (s)"},"y":{"min":0,"max":16,"trin":4,"navn":"v (m/s)"},"punkter":[[0,0],[2,12],[5,12],[7,0]]}
"diagram":{"type":"henfald","A0":800,"T":8,"enhed":"minutter"}
"diagram":{"type":"boelge","A":2,"lambda":2}          // A i cm, lambda i m
"diagram":{"type":"kredsloeb","kobling":"parallel","R":[30,60],"U":24}
"diagram":{"type":"hr","stjerner":[{"navn":"A","T":15000,"L":0.003}, …]}   // L i forhold til Solen
"diagram":{"type":"spektrum","strips":[{"navn":"Brint","art":"emission","linjer":[410.2,434.0,486.1,656.3]}, …]}   // art: emission eller absorption
"diagram":{"type":"bane","e":0.8,"punkter":[{"navn":"A","E":0}, …]}      // E = excentrisk anomali i grader; eller "sektorer":[[-20,20],[160,200]]
"diagram":{"type":"solsystem","model":"helio","planeter":[…],"mark":"Mars"}  // model: helio, geo eller tycho
"diagram":{"type":"linse","f":10,"a":25}                                  // cm
"diagram":{"type":"brydning","i":40,"r":25,"medie2":"Glas"}               // "vis_r":false viser ? i stedet
"diagram":{"type":"prisme","bogstaver":["A","B","C","D"]}                 // fra mindst til mest afbøjet
"diagram":{"type":"skraaplan","h":1.5,"vinkel":30,"objekt":"kugle"}       // eller "planer":[{…},{…}] for to planer
"diagram":{"type":"pendul","L":1.5,"vinkel":30,"punkter":true}
"diagram":{"type":"fjeder","m":0.2,"dx":8}                                // eller "pendul":true med "m" og "k"
"diagram":{"type":"bane","e":0.97,"maal":{"q":"0,59 AU","Q":"35,1 AU"}}    // Keplers 1. og 3. lov
"diagram":{"type":"bane","e":0.6,"sektorer":[[-6,6],[162,198]],"sektortekst":["20 døgn","?"]}   // Keplers 2. lov; sektorer i grader middelanomali
"diagram":{"type":"gitter","N":600,"lambda":633,"L":"1,00 m","x":"43,0 cm"}  // "skjulN":true skjuler antallet af linjer
"diagram":{"type":"dobbeltspalte","lambda":633,"d":"0,25 mm","L":"2,00 m","k":4,"afstand":"20,3 mm"}   // k = antal mellemrum mellem markeringerne
"diagram":{"type":"prismevej","A":60,"i":45,"n":1.52,"delta":"= ?"}      // strålegang beregnes med brydningsloven
"diagram":{"type":"totalref","medie":"Vand","n":1.33}                   // eller "mode":"prisme" for retvinklet prisme
"diagram":{"type":"regnbue"}   {"type":"regnbuegeo","sol":20}   {"type":"prismegitter"}
"diagram":{"type":"hyperbel","e":1.5,"q":1,"delta":"= ?"}              // eller "baner":[{e,q,navn}, …] for flere baner
"diagram":{"type":"undvig","r":"2 AU","v":"33,7 km/s"}
"diagram":{"type":"pendler","pendler":[{"navn":"A","L":1,"m":0.5}, …]}
"diagram":{"type":"fjedre","kobling":"serie","k":[20,30],"m":0.2}
"diagram":{"type":"energiniveau","overgange":[{"fra":3,"til":2,"navn":"A"}],"farvet":true}   // "til":"inf" = ionisering
"diagram":{"type":"bohrmodel","fra":3,"til":2}
"diagram":{"type":"maanefaser","labels":"ABCDEFGH"}   {"type":"maane","fase":45}   {"type":"formoerkelse","art":"sol"|"maane"}
"diagram":{"type":"aarstider","labels":"ABCD"}   {"type":"solhoejde","h":57,"sted":"Grenaa"}   {"type":"retrograd"}   {"type":"komethale","haler":true}
"diagram":{"type":"stjernebillede","ra0":12.4,"dec0":56,"stjerner":[[RA timer, dec grader, størrelsesklasse, "etiket"], …],"streger":[[0,1], …]}
"diagram":{"type":"hz","dmax":2,"inner":0.95,"outer":1.67,"planeter":[{"a":1,"n":"A"}]}   {"type":"galakse","art":"spiral"|"bjaelke"|"elliptisk"|"irregulaer"}
"diagram":{"type":"maelkevej"}   {"type":"tidslinje","punkter":[{"s":sekunder,"n":"A"}]}   {"type":"stjerneudvikling","skjul":4}   {"type":"planet","navn":"Mars",…}
"diagram":{"type":"linje", …, "kurver":[{"p":[[x,y],…],"navn":"målt"}, …]}      // flere kurver med signaturforklaring
"diagram":{"type":"linje", …, "maal":[[x,y],…], "kurve":[[x,y],…], "fyld":x, "etiketter":[[x,y,"A"],…]}   // målepunkter, skravering, mærkede punkter
"diagram":{"type":"suvat","v0":10,"a":-5,"t1":2}                       // tegner (s,t)-, (v,t)- og (a,t)-graf
"diagram":{"type":"grafmatch","givet":"v","spurgt":"s","bev":"brems","kand":["hvile","brems","konst","acc"]}
                                    // bevægelser: hvile, konst, bagl, acc, acc2, brems (og arate til a-grafer)
```

**keglesnit** (Tilpas bane)
```js
"e":1.5, "q":1, "punkter":[[x,y], …]        // i AU; Solen i (0,0), perihel på den positive x-akse
```
Svaret godkendes, når e og q er inden for ca. 6–8 %, og banetypen er rigtig.
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

1. Gå til **script.google.com**, og vælg **Nyt projekt**. (Du kan også åbne et Google-regneark og vælge **Udvidelser → Apps Script**. Så gemmes resultaterne i netop det regneark.)
2. Giv projektet et navn, fx "Fysiktest".
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

Apps Script-editoren virker bedst på en computer. På mobil skal du åbne script.google.com i browseren og slå **Computerversion** til (Request desktop site). Regnearks-appen har ikke menuen Udvidelser.

Når adressen står der, skal eleverne skrive navn og e-mail, før de kan starte. Når `RESULTAT_URL` er tom, forsvinder e-mailfeltet, og intet sendes.

### Hvad sendes

- **E-mailen** har emnelinjen "Fysiktest: navn – point/antal (procent)". Den indeholder resultatet pr. emne og hvert spørgsmål med elevens svar og facit. "Svar" i mailprogrammet går direkte til eleven.
- **Regnearket** ("Fysiktest – resultater" i dit Google Drev) får én række pr. test med tidspunkt, navn, e-mail, form, point, procent, resultat pr. emne og id'erne på de forkerte spørgsmål.

### Godt at vide

- Google begrænser, hvor mange e-mails et script må sende pr. døgn. For en almindelig Gmail-konto er det omkring 100. Regnearket får alle resultater uanset loftet.
- Hvis du senere retter i scriptet, skal du vælge **Implementer → Administrer implementeringer → Rediger → Ny version**. Så bevarer adressen sin værdi.
- Testen rettes i elevens browser. En teknisk kyndig elev vil derfor kunne sende et falsk resultat. Til selvtest og øvelse betyder det ikke noget, men testen egner sig ikke til karaktergivning.


---

## Kemi, biologi, samfundsfag, matematik, dansk og engelsk

Disse seks fag bruger samme program som fysiktesten (samme HTML og JavaScript-motor, kaldet `app.js` i udviklingen), men hver side er bygget uden fysikkens tegnefunktioner og uden niveauvalget, så filerne er langt mindre (ca. 80 kB mod fysiktestens langt større fil).

### Kemi (`kemi.html` / `kemi.js`)
Atomets opbygning og periodesystemet, kemisk binding, mol og støkiometri, syrer og baser (herunder pH og titrering), redoxreaktioner og elektrokemi, organisk kemi, reaktionshastighed og ligevægt samt eksperimentelt arbejde og sikkerhed (faremærkning).

Diagramtyper: `atom` (atommodel med skaller), `phskala` (pH-skala med markør), `titrering` (titrerudstyr), `molekyle` (kugle-pind-model).

### Biologi (`biologi.html` / `biologi.js`)
Cellebiologi, genetik og molekylærbiologi (DNA, proteinsyntese, mitose/meiose som rækkefølgeopgaver), evolution, menneskets fysiologi, økologi (fødekæder, energipyramide, bestandsvækst), mikrobiologi og immunforsvar samt bioteknologi.

Diagramtyper: `celle` (dyre-/plantecelle), `dna` (dobbelthelix med baseparring), `foedekaede`, `pyramide` (økologisk pyramide), `punnett` (krydsningsskema), `hjerte` (hjertets fire kamre), `enzym` (nøgle-lås-model). Bruger desuden `funktion` (se matematik) til vækstkurver og enzymaktivitet.

### Samfundsfag (`samfundsfag.html` / `samfundsfag.js`)
Politik og demokrati (magtens tredeling, Folketingets behandling af et lovforslag, det politiske spektrum), økonomi (udbud/efterspørgsel, BNP, inflation, skat, Lorenzkurven), sociologi, international politik (FN, EU, NATO) samt metode og videnskabsteori.

Diagramtyper: `institution` (proceskæde), `politisk` (venstre-højre-spektrum, samme tegnefunktion som i historie), `forsyning` (udbuds-/efterspørgselskurver), `lorenz` (Lorenzkurve).

### Matematik (`matematik.html` / `matematik.js`)
Tal og algebra (ligninger, andengradsligninger, potenser, logaritmer), funktioner (lineære, andengrads, eksponentielle), geometri og trigonometri (Pythagoras, sinus-/cosinusrelationerne, enhedscirklen), differential- og integralregning, statistik og sandsynlighed samt vektorer.

Diagramtyper: `funktion` (generel graf, genbruger `"linje"`-motoren med `kurver`), `retvinklet` (retvinklet trekant med mærkede sider/vinkel), `enhedscirkel`.

### Fælles for alle fire
Alle bruger multiple choice, indtast-tal (med samme enhedstjek og fejlgenkendelse som fysiktesten) og formatet **`orden`** (sæt i rækkefølge – bruges bl.a. til Folketingets lovbehandling, EU's historie, mitosens faser og Jesu liv):
```js
{"format":"orden", "spoergsmaal":"Sæt … i rækkefølge.", "elementer":[{"t":"…","aar":"…"}, …]}
```
Se hovedafsnittet ovenfor for den fulde beskrivelse af `orden`-formatet og af `"linje"`-diagrammets `kurve`/`kurver`/`maal`/`etiketter`-felter, som genbruges af alle fire fag.

### Kendte forenklinger
- **Kemi:** Ionladningerne i "Ionforbindelsers formel" er udledt af gruppenummeret efter en fast tabel og dækker ikke overgangsmetallernes variable ladninger (fx Fe²⁺/Fe³⁺).
- **Biologi:** Bestandsvækstens tal er opdigtede eksempler, ikke målte data.
- **Samfundsfag:** Udbuds- og efterspørgselskurverne er lineære eksempler til at illustrere metoden, ikke virkelige danske tal.
- **Matematik:** Alle opgaver er rene regneopgaver uden tekstet kontekst (ingen "hvor mange æbler har Peter").

Som med de øvrige fag: gennemgå gerne spørgsmålene, før de bruges i undervisning – databaserne er skrevet ud fra almindelig faglig viden uden opslag i en bestemt lærebog.


### Dansk (`dansk.html` / `dansk.js`)
Sprog og sprogrigtighed (ordklasser, sætningsled, kommaregler, sprogsociologi), retorik og argumentation (de retoriske appelformer, Toulmins model, retoriske figurer, avisgenrer), litteraturhistorie (perioder fra middelalder til nyeste litteratur), litterær analyse og genrer (fortællertyper, komposition, lyrikkens virkemidler), medier og kommunikation (kommunikationsmodellen, nyhedskriterier, journalistiske genrer) samt skriftlig fremstilling.

Diagramtyper: `saetning` (sætningsanalyse med markerede led), `retorik` (den retoriske trekant), `kommunikation` (afsender/budskab/modtager-model), `genrehjul` (seks genrer i et hjul), samt `tidsakse` (genbrugt fra historie) til litteraturhistorien.

### Engelsk (`engelsk.html` / `engelsk.js`)
Hele testen er på engelsk. Grammar and vocabulary (irregular verbs, conditionals, commonly confused words), literary history and analysis (perioder fra renæssancen til i dag, kendte forfattere og værker, litterære begreber), culture and society (det britiske og amerikanske styre, kultur og historie), rhetoric and text analysis (appelformerne, retoriske figurer, logiske fejlslutninger) samt language and language use (dialekter, sociolekter, World Englishes).

Genbruger `retorik` (den retoriske trekant, med engelske labels via `svar`/`spoergsmaal`-teksten) og `tidsakse` fra de øvrige fag.

---

## Naturfag, kristendomskundskab, engelsk og dansk (grundskole)

De fire grundskoletests bruger samme program og motor som stx-testene, men databaserne er skrevet i et enklere sprog og til et yngre niveau (typisk 7.-9. klasse). De er tænkt som en start – ligesom kemi og biologi oprindeligt startede i mindre skala, før de senere blev udvidet til 1000+ spørgsmål.

### Naturfag (`naturfag.html` / `naturfag.js`)
Biologi (celler, krop og organer, økosystemer og fødekæder, dyregrupper), geografi (Danmarks og verdens geografi, plader og vulkaner, vejr og klima, ressourcer og bæredygtighed) samt fysik/kemi (atomer og stoffers opbygning, tilstandsformer, kemiske reaktioner, kræfter og bevægelse, elektricitet, lys og lyd).

Diagramtyper: `foedekaede` og `pyramide` (begge genbrugt fra biologi), `atom` (genbrugt fra kemi, her brugt til at vise elektronskaller).

### Kristendomskundskab (`kristendomskundskab.html` / `kristendomskundskab.js`)
Bibelske fortællinger (Det Gamle og Det Nye Testamente, herunder Jesu liv som en rækkefølgeopgave), kristendommens historie og danske traditioner (fra Harald Blåtand til folkekirken og kirkeårets højtider), andre religioner og livsopfattelser (islam, jødedom, hinduisme, buddhisme, ateisme) samt etik og filosofi (den gyldne regel, empati, mobning, retfærdighed).

Ingen tegninger endnu – testen bruger kun multiple choice og rækkefølgeopgaver (`orden`).

### Engelsk, grundskole (`engelsk-grundskole.html` / `engelsk-grundskole.js`)
Ordforråd inden for dagligdags emner (dyr, familie, mad, skole, farver, tal, ugedage, måneder, tøj, vejr), grundlæggende grammatik (to be, nutid, flertal, a/an, komparativ, ejestedord, spørgeord, præpositioner), hverdagssamtaler og talemåder samt engelsktalende lande og kultur.

### Dansk, grundskole (`dansk-grundskole.html` / `dansk-grundskole.js`)
Ordklasser og retstavning, sætninger og sætningsled (med tegnet sætningsanalyse), læseforståelse og tekstforståelse, eventyr/fortælling og genrer (med genrehjul og en rækkefølgeopgave om fortællingens opbygning) samt mundtlig og skriftlig kommunikation (med kommunikationsmodellen).

Diagramtyper: `saetning`, `kommunikation`, `genrehjul` – alle genbrugt fra den engelske og danske stx-test.

### Kendte forenklinger
Sprog og faglige detaljer er bevidst forenklet i forhold til stx-testene – fx er kirkehistorien og naturfagsbegreberne holdt på et niveau, der passer til grundskolens Fælles Mål, uden den tekniske dybde fra ungdomsuddannelserne.

### Matematik, grundskole (`matematik-grundskole.html` / `matematik-grundskole.js`)
Tal og regning (de fire regningsarter, brøker, procent, negative tal, afrunding), geometri (trekanter med Pythagoras, rektangler, kvadrater og cirkler – areal og omkreds, vinkelsum), funktioner og grafer (lineære funktioner, koordinatsystemet) samt statistik og sandsynlighed (gennemsnit, median, søjlediagrammer, grundlæggende sandsynlighed).

Diagramtyper: `retvinklet` (retvinklet trekant, genbrugt fra stx-matematik, her brugt til Pythagoras og trekantareal), `funktion` (lineære grafer), `soejlediagram` (søjlediagrammer til statistik).

### Opdatering: naturfag, kristendomskundskab, dansk og engelsk (grundskole) er nu udvidet til 1000+
Alle fire oprindelige grundskolefag er sidenhen udvidet fra deres første, mindre udgave til over 1000 spørgsmål hver, efter samme opskrift som stx-fagene: store begrebsbanker med to spørgsmålsretninger pr. begreb, brede talgitre til regneopgaverne, og – for naturfag især – en bred vifte af genbrugte tegninger: fødekæder, energipyramide, atommodeller, celletegninger, hjertets fire kamre, molekylemodeller, pH-skala, søjlediagrammer og elektriske kredsløb. Kristendomskundskab genbruger religionsfagets symboler, kirkeårshjul, islams fem søjler, kirke-/moskégrundplaner og tidsakser. Dansk (grundskole) bruger sætningsanalyse, kommunikationsmodellen, genrehjulet og en tidsakse for børnelitteraturens historie.
