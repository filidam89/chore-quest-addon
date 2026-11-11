# 🏆 ChoreQuest (v2.9.0)

> **Add-on Ufficiale Home Assistant per la Gamification e Gestione delle Faccende di Casa e Famiglia**

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)
![Version](https://img.shields.io/badge/Version-2.9.0-emerald.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Novità & Funzionalità Chiave v2.9.0

- 🌟 **Nuova Funzione "Oggi è la Giornata del..." (Focus Stanze & Spazi Casa):**
  - Stimolo quotidiano a prendersi cura di uno spazio o stanza diversa con un mini-task veloce (5 minuti) per tutta la famiglia.
  - Elenco di stanze e ambienti configurabile liberamente in Admin (*Cucina, Salotto, Bagno, Camera da letto, Ingresso, Balcone, Ripostiglio, Studio*).
- 🎲 **Rotazione Intelligente Senza Ripetizioni Consecutive:**
  - L'algoritmo tiene conto dell'ultima esecuzione per favorire gli ambienti meno curati ed **evita rigorosamente che la stessa stanza si ripeta per 2 giorni consecutivi**, anche se il giorno precedente non è stata svolta da nessuno.
  - Pulsante Reroll rapido (`🎲`) per cambiare stanza per la giornata odierna se necessario.
- 👥 **Completamento per Singolo Membro & Classifica Focus Dedicata:**
  - Ciascun membro della famiglia può flaggare il completamento per se stesso e conquistare i punti extra (+10 pt).
  - Podio e classifica a parte *"Giornata del..."* con totale stanze completate e serie di giorni consecutivi attivi (**streak 🔥**).
- 🔔 **Integrazione Notifiche Home Assistant & Sensore HA:**
  - Il promemoria mattutino include in apertura lo stimolo del giorno: `🌟 Oggi è la giornata del: [Stanza] (+X pt)! \n💡 [Suggerimento]`.
  - Il riepilogo serale riporta se l'attività è stata completata dal membro o dagli altri familiari.
  - Nuovo evento di test dedicato nel pannello Notifiche HA.
  - Nuovo sensore Home Assistant: `sensor.chorequest_daily_focus`.
- 📱 **Interazione Immediata da Card Membro & Home:**
  - Widget prominente in Home con chip veloci di completamento per ciascun membro.
  - Toccando il nome di un componente familiare, il modale mostra subito in evidenza il banner *"Attività del Giorno"* con pulsante diretto **`[ Fatta ✓ ]`**.
- 📜 **Modifiche a Posteriori Garantite:**
  - I completamenti vengono archiviati come log `daily_focus` con pieno supporto alle modifiche a posteriori (data, punti, esecutore, note) e cancellazione con tracciamento audit.

---

## 🚀 Novità Versione Precedente v2.8.7

- 📜 **Storico Esecuzioni della Routine con Dettaglio Cronologico:**
  - Cliccando su qualsiasi routine o attività in scadenza (es. *Barbiere*, *Cambio Lenzuola*), il modale mostra ora la cronologia completa dei completamenti passati con data e ora esatta, chi l'ha svolta (con avatar e badge utente), punti assegnati e note registrate.
  - Aggiunto il pulsante rapido *"📜 Storico"* anche nella schermata di gestione amministrativa delle routine.
  - Nuovo endpoint API dedicato `GET /api/routine_tasks/history?id=...&name=...`.
- 📅 **Routine a Giorno Intero per Default (All-Day Standard):**
  - Risolto il disallineamento orario: le routine standard vengono gestite a giorno di calendario (`YYYY-MM-DD`). Durante l'intera giornata odierna il badge mostra con chiarezza e coerenza **`🟡 Scade oggi`** (`days_remaining = 0`), senza scattare anzitempo in scaduto o mostrare inesattamente "Fra 1 gg".
- ⏰ **Orario di Scadenza Opzionale per Routine:**
  - Possibilità opzionale di definire un orario specifico (`HH:MM`) se l'attività va svolta tassativamente entro una certa ora, mostrando in tempo reale `🟡 Scade oggi (entro le HH:MM)`.

---

## 🚀 Novità Versione Precedente v2.8.6

- ⏰ **Orari Promemoria e Riepiloghi Indipendenti per Singolo Utente:**
  - Gli orari e i controlli di attivazione non sono più globali: ogni membro della famiglia configura liberamente i propri orari indipendenti nella propria scheda personale:
    - 🌅 **Orario Mattina personalizzato** (es. `07:30` per gli adulti, `08:30` per i figli).
    - 🌙 **Orario Sera personalizzato** (es. `20:30` o `21:30`).
  - Toggle dedicato per profilo (*"🔔 Abilita Notifiche <Nome>"*) per escludere o includere un utente in 1 click.
- 🌙 **Notifica di Riepilogo Serale Arricchita & Gamificata:**
  - Elenco compiti scaduti con conteggio esatto dei giorni: `• <nome> (scaduta da X giorni, +Y pt)`.
  - Attività completate oggi con dettaglio dei singoli punti conquistati.
  - Podio settimanale con medaglia e indicazione del distacco o vantaggio rispetto agli altri membri.
  - Anteprima delle faccende in programma per domani e complimenti personalizzati.
- 🚫 **Stop Definitivo a Notifiche Non Impostate (Niente Broadcast Indesiderati):**
  - Eliminato qualsiasi fallback automatico al broadcast `notify.notify`. Se nessun dispositivo è selezionato, il sistema non invia nulla.
- 📢 **Sezione Dispositivi Famiglia Semplificata & Focalizzata:**
  - Rimossi i campi ridondanti: la scheda famiglia gestisce ora esclusivamente la selezione e ricerca rapida dei dispositivi comuni per compiti aperti a tutta la casa.
- 🛡️ **Risoluzione Blocco "Caricamento stato connessione HA..." & Timeout Robusti:**
  - Aggiunti timeout rigidi (`AbortSignal.timeout`) su tutte le interazioni con l'API Supervisor e Home Assistant, con riscontro visivo immediato anche in caso di rete lenta o modalità Standalone.

- 🔍 **Ricerca e Filtro Istantaneo Dispositivi:**
  - **Famiglia**: Nuova barra di ricerca live e tasti "Tutti" / "Nessuno" per filtrare e associare i dispositivi predefiniti.
  - **Membri**: Barra di ricerca integrata in ogni scheda utente per trovare subito smartphone e tablet personali tra decine di dispositivi.
  - **Pannello di Test**: Campo di ricerca rapida sul dropdown di selezione dispositivo.
- 📱 **Risoluzione Automatica e Priorità Servizi `notify.mobile_app_*`:**
  - Risolto il problema del mancato invio quando si selezionava l'entità anziché il servizio dell'app Companion. L'API mappa automaticamente `notify.<dispositivo>` al relativo servizio funzionante `notify.mobile_app_<dispositivo>`.
  - Deduplicazione e friendly name reali da Home Assistant (es. *"Pixel 7"*, *"Samsung A40 Giulia"*, *"11T Pro"*, *"Galaxy Watch7"*).
- 💬 **Correzione Notifiche Persistenti (`notify.persistent_notification`)**:
  - Rimossi i campi non compatibili nel payload verso `persistent_notification/create`, garantendo la creazione istantanea della notifica sulla dashboard di HA.
- 🐛 **Polyfill Fetch Universale (v2.8.3)**: Motore HTTP/HTTPS nativo indipendente da versioni di Node o Alpine.
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
3. Clicca su **Aggiorna (Update)** alla versione **v2.8.6** e riavvia l'Add-on!
