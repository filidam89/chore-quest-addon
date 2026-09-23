# 🏆 ChoreQuest (v2.8.3)

> **Add-on Ufficiale Home Assistant per la Gamification e Gestione delle Faccende di Casa e Famiglia**

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)
![Version](https://img.shields.io/badge/Version-2.8.3-emerald.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Novità & Funzionalità Chiave v2.8.3

- 🐛 **Polyfill Fetch Universale & Ripristino Chiamate Home Assistant**:
  - Risolto l'errore `fetch is not defined` su ambienti Alpine / Node < 18 nel container S6.
  - Implementato polyfill nativo autonomo con moduli `http`/`https`, gestione redirect HTTP (301, 302, 307, 308) e timeout, consentendo a `/states`, `/services`, sensori ChoreQuest e notifiche di funzionare istantaneamente.
- 🐳 **Aggiornamento Immagine Base Dockerfile**: Aggiornata a `ghcr.io/home-assistant/amd64-base:3.20` con supporto runtime moderno.
- 📱 **Supporto Multi-Dispositivo per Famiglia e per Membro (v2.8.2)**:
  - **Più dispositivi per membro**: Ogni membro della famiglia può ora associare più smartphone, tablet o canali di notifica contemporaneamente.
  - **Dispositivi multipli predefiniti di famiglia**: Spunta con contatore per i canali predefiniti.
- 🛠️ **Iniezione Token Supervisor Garantita & Diagnostica Live**:
  - Token rilevato via environment S6 e pulsante *"🩺 Diagnostica HA"* nel pannello Notifiche per verificare in tempo reale lo stato dei sensori e dei dispositivi.
  - **Dispositivi multipli predefiniti di famiglia**: Possibilità di selezionare più dispositivi come destinatari generali della famiglia (`default_services`).
- 🛠️ **Risoluzione Definitiva Iniezione Token Supervisor (S6 Container Overlay):**
  - Integrazione di `/usr/bin/with-contenv sh` in `run.sh` e lettura diretta dai file ambiente S6 (`/run/s6/container_environment/SUPERVISOR_TOKEN`) garantendo la disponibilità al 100% del token Supervisor in qualsiasi installazione Home Assistant OS o Supervised.
  - Doppia intestazione `Authorization: Bearer` e `X-Supervisor-Token`.
- 🔍 **Nuovo Strumento di Diagnostica Live Home Assistant:**
  - Pulsante dedicato *"Diagnostica HA"* nel pannello Notifiche che verifica in tempo reale la connessione alle API Home Assistant, la validità del token, lo stato di `/states` e `/services` e l'elenco esatto di tutte le entità e smartphone rilevati.
- 🧪 **Pannello Test Notifiche Avanzato:**
  - Test rapido dell'invio verso *Tutta la Famiglia*, *Membro Specifico* (tutti i suoi terminali) o *Singolo Dispositivo*.
- ⚙️ **Connessione Manuale Avanzata (Opzionale):**
  - Campi dedicati per specificare URL Home Assistant e Long-Lived Token personalizzati per utilizzi standalone fuori da Supervisor.
- 🔔 **Scansione Multi-Livello Dispositivi & Entità Notifica Home Assistant:**
  - Compatibilità universale per qualsiasi installazione Home Assistant: rileva entità `notify.*`, smartphone Companion App tramite `device_tracker.*` e sensori batteria, e servizi del dominio `notify`.
  - **Aggiunta Servizi ed Entità Personalizzate con 1 Click**: Possibilità di aggiungere qualsiasi canale o entità di notifica (`notify.telegram`, `notify.alexa`, ecc.) direttamente dall'interfaccia.
  - **Supporto Invio Diretto & Fallback `notify.send_message`**: Massima compatibilità con le API recenti e classiche di Home Assistant.
- 👥 **Preferenze di Notifica Granulari per Singolo Membro:**
  - Ogni utente sceglie liberamente il proprio dispositivo di notifica personale e può attivare/disattivare in modo indipendente:
    - 🌅 **Promemoria Mattina**: Riepilogo attività e routine in scadenza oggi.
    - 🌙 **Riepilogo Serale**: Punti guadagnati oggi, compiti fatti, posizione in classifica e faccende da terminare.
    - 🚨 **Avvisi Urgenze & Scadenze**: Notifiche ad alta priorità per faccende scadute.
    - 📋 **Nuovi Task Assegnati**: Avviso tempestivo sul cellulare quando viene assegnato un nuovo compito singolo.
- 🌙 **Riepilogo Serale Automatico (Evening Recap):**
  - Scheduler automatico serale (es. `20:30`) che congratula il membro per i punti totalizzati durante il giorno, visualizza la medaglia di classifica e ricorda eventuali compiti in sospeso prima di chiudere la giornata.
- 📱 **Canali di Notifica & Suonerie Differenziate (Android & iOS):**
  - `ChoreQuest_Urgent` (Priorità Alta / Suono persistente o sveglia per le faccende scadute).
  - `ChoreQuest_Reminders` (Priorità Standard / Notifica discreta per promemoria e preavvisi).
  - `ChoreQuest_General` (Notifica per nuovi compiti assegnati e vincitori settimanali).
- 🎛️ **Menu Admin Riprogettato (No-Scroll Grid):**
  - Griglia responsive con 8 tasti accessibili con 1 solo click.
- 📊 **Ordinamento Cronologico Reale per Data/Ora & Modifica Rapida.**
- 🔄 **Sensori Home Assistant Real-Time & Audit Trail Completo.**
- 💾 **Backup & Ripristino JSON.**

---

## 🚀 Installazione & Aggiornamento su Home Assistant

1. Vai in **Impostazioni** ➔ **Add-on** ➔ **Store degli Add-on**.
2. Clicca sui tre pallini in alto a destra (**⋮**) ➔ **Controlla aggiornamenti** (o ricarica con `F5`).
3. Clicca su **Aggiorna (Update)** alla versione **v2.8.3** e riavvia l'Add-on!
