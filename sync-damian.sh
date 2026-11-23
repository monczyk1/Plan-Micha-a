#!/bin/sh
# Wersja Damiana (…/damian/) to ta sama aplikacja – po każdej zmianie index.html lub sw.js uruchom ten skrypt.
# Aplikacja sama rozpoznaje adres /damian/ i używa wtedy planu Damiana i osobnego miejsca na dane.
cd "$(dirname "$0")" && cp index.html sw.js damian/ && echo "Skopiowano do damian/"
