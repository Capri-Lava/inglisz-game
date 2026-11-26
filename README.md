# Inglisz Game

Turowy pojedynek na słówka w stylu brytyjskiego komiksu, w ramce czerwonej budki telefonicznej.
King Arthur kontra Nigel Bumble. Dobra odpowiedź to Twój cios, zła odpowiedź to cios przeciwnika.

- Słówka: rozdział „Człowiek” z podręcznika (`js/words.js`). Podkreślone słówka padają częściej.
- Tłumaczenie na zmianę: PL → EN i EN → PL. Odpowiedzi celowo bywają mylące (tight / tights, reliable / responsible…).
- Czas na odpowiedź zaczyna się od 1, 2 lub 3 s i skraca o 5% z każdym pytaniem.
- Wszystko działa w przeglądarce, bez instalacji. Grafika rysowana w pikselach, muzyka i efekty z syntezatora (WebAudio).

Uruchomienie lokalnie: otwórz `index.html` albo `python3 -m http.server` i wejdź na `http://localhost:8000`.

Nowe słówka: dopisz linijki w `js/words.js` w formacie `angielski|polski|kategoria|*` (gwiazdka = ważne).
