# Računi za normiran s.p. brez DDV

Statična spletna aplikacija za pripravo računov za normiranega samostojnega podjetnika, ki ni v sistemu DDV. Podatki se shranjujejo lokalno v brskalniku.

## Funkcionalnosti

- vnos podatkov izdajatelja, naročnika in računa,
- dinamične postavke z izračunom zneskov brez DDV,
- privzeta klavzula za malega davčnega zavezanca,
- tiskanje oziroma shranjevanje v PDF prek brskalnika,
- lokalno shranjevanje, JSON uvoz/izvoz in CSV izvoz.

## Zagon

```bash
npm run dev
```

Za produkcijski paket:

```bash
npm run build
```

## Opomba

Aplikacija ni pravni, davčni ali računovodski nasvet. Pred izdajo računov preverite pravilnost podatkov, klavzule in obveznih sestavin računa pri računovodji ali pristojnem organu. Pri gotovinskih plačilih preverite obveznosti davčnega potrjevanja računov.
