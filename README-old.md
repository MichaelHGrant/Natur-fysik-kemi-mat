# Fysiktest for 1.g

En selvrettende multiple choice-test i fysik til 1.g med 1.118 spørgsmål i syv emner:

- bevægelse og kræfter
- energi
- varme og temperatur
- elektricitet
- bølger og lys
- atomfysik og radioaktivitet
- astronomi og verdensbilledet

## Filer

| Fil | Indhold |
|---|---|
| `fysiktest.html` | Selve testen (layout og program) |
| `spoergsmaal.js` | Databasen med alle spørgsmål, svar og forklaringer |

De to filer skal ligge i samme mappe. Siden virker både på GitHub Pages og når man åbner `fysiktest.html` direkte fra computeren.

## Sådan ser et spørgsmål ud

Hvert spørgsmål står på én linje i `spoergsmaal.js`:

```js
{"id":"ast-136","emne":"Astronomi og verdensbilledet","type":"Parallakse",
 "spoergsmaal":"Proxima Centauri har parallaksen 0,768″ …",
 "svar":["1,3 pc","0,77 pc","4,2 pc","0,65 pc"],
 "forklaring":"d = 1 / 0,768 ≈ 1,3 pc …"}
```

- **Det rigtige svar står altid først** i `svar`. Siden blander rækkefølgen for eleven.
- `svar` skal have 2–4 muligheder.
- `emne` bestemmer, hvilket emne spørgsmålet hører til. Et nyt emnenavn giver automatisk et nyt emne på startsiden.
- `type` samler varianter af samme opgave, fx `"Ohms lov: strøm"`. En test tager højst ét spørgsmål af hver type, før typen bruges igen. Under "Øv de forkerte igen" får eleven en anden variant af samme type.
- `type: "Begreb"` betyder et enkeltstående spørgsmål.
- HTML som `<sup>`, `<sub>` og `<i>` kan bruges i teksterne, fx `10<sup>8</sup>`.

## Nyt spørgsmål

Kopiér en linje i `spoergsmaal.js`, giv den et nyt `id`, ret teksterne, og husk kommaet mellem linjerne.
