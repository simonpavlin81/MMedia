# Razpisnik AI

Statična predstavitvena spletna stran za AI asistenta, ki slovenskim podjetjem pomaga pri iskanju, razumevanju in pripravi prijav na javne razpise.

## Vsebina

- pristajalna stran z opisom koristi,
- sekcija funkcij za razpisni proces,
- interaktivni demo klepetalnik, ki odgovarja na podlagi razpisov iz `razpisi.js`,
- povezave do uradnih slovenskih in evropskih razpisnih virov.

## Lokalni zagon

Projekt ne potrebuje namestitve odvisnosti. Za najbolj zanesljivo delovanje zaženite preprost lokalni strežnik:

```bash
python3 -m http.server 8000
```

Nato odprite <http://localhost:8000>.

## Dodajanje razpisov v ozadje

Razpisi so shranjeni v `razpisi.js` v polju `window.RAZPISI`. Za nov razpis dodajte nov objekt z naslednjimi podatki:

- `id`, `naziv`, `področje`, `naročnik`, `rok`, `vrednost`, `upravičenci`,
- `ključneBesede`, `pogoji`, `dokazila`,
- `priloge`, kjer je lahko več PDF prilog v obliki `{ naziv, url, opis }`,
- `povzetek`.

Ko datoteko shranite in stran osvežite, bo asistent uporabljal nove razpise in PDF priloge pri iskanju in odgovorih.

## Nadgradnja v pravega AI asistenta

Datoteka `app.js` trenutno izvaja lokalno iskanje po razpisih v brskalniku. Za produkcijsko uporabo dodajte zaledni API, ki varno kliče izbran LLM, indeksira razpisno dokumentacijo, podpira nalaganje PDF-jev in hrani profil podjetja za preverjanje upravičenosti.
