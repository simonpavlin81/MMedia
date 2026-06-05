# Razpisnik AI

Statična predstavitvena spletna stran za AI asistenta, ki slovenskim podjetjem pomaga pri iskanju, razumevanju in pripravi prijav na javne razpise.

## Vsebina

- pristajalna stran z opisom koristi,
- sekcija funkcij za razpisni proces,
- interaktivni demo klepetalnik,
- povezave do uradnih slovenskih in evropskih razpisnih virov.

## Lokalni zagon

Projekt ne potrebuje namestitve odvisnosti. Odprite `index.html` v brskalniku ali zaženite preprost lokalni strežnik:

```bash
python3 -m http.server 8000
```

Nato odprite <http://localhost:8000>.

## Nadgradnja v pravega AI asistenta

Datoteka `app.js` trenutno uporablja lokalna demo pravila. Za produkcijsko uporabo dodajte zaledni API, ki varno kliče izbran LLM, indeksira razpisno dokumentacijo in hrani profil podjetja za preverjanje upravičenosti.
