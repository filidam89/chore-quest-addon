# Changelog - ChoreQuest

Tutte le novità, miglioramenti e correzioni introdotte nelle versioni di ChoreQuest.

---

## [2.8.4] - 2026-09-23

### ✨ Novità
- **Ricerca e Filtro Rapido Dispositivi di Notifica**:
  - **Famiglia**: Aggiunta barra di ricerca live per filtrare istantaneamente i dispositivi predefiniti digitando qualsiasi parola chiave (es. "pixel", "giulia", "tablet", "alexa").
  - **Singoli Membri**: Aggiunta barra di ricerca dedicata in ogni scheda membro per individuare e associare subito i dispositivi personali anche in case con decine di dispositivi.
  - **Pannello di Test**: Aggiunto campo di ricerca istantaneo sul selettore del dispositivo per i test manuali.
  - **Tasti Rapidi "Tutti" / "Nessuno"**: Aggiunti pulsanti per selezionare o deselezionare con un click tutti i dispositivi (anche filtrati) per la famiglia e per ogni membro.

### 🐛 Correzioni Bug
- **Risoluzione Automatica e Priorità Servizi `notify.mobile_app_*`**:
  - Risolto il mancato recapito delle notifiche quando veniva selezionata l'entità `notify.<dispositivo>` anziché il servizio `notify.mobile_app_<dispositivo>`. L'API ora mappa e indirizza automaticamente qualsiasi chiamata verso il servizio corretto registrato dall'app Home Assistant Companion.
  - Deduplicazione intelligente della lista dispositivi: eliminati i duplicati non funzionanti e assegnati i friendly name ufficiali (es. *"Pixel 7"*, *"Samsung A40 Giulia"*, *"11T Pro"*, *"Galaxy Watch7"*) ai servizi `mobile_app_*`.
- **Correzione Notifiche Persistenti (`notify.persistent_notification`)**:
  - Ripulito il payload inviato a `persistent_notification/create` rimuovendo i parametri `data` incompatibili con lo schema di Home Assistant, eliminando l'errore 400 Bad Request.
- **Retrocompatibilità e Auto-Aliasing**:
  - Qualsiasi configurazione già salvata nel database contenente `notify.<dispositivo>` viene automaticamente normalizzata ed eseguita verso `notify.mobile_app_<dispositivo>`.

---

## [2.8.3] - 2026-09-23

### 🐛 Correzioni Bug
- **Polyfill Fetch Universale (Node.js & Alpine Container)**: Risolto l'errore `fetch is not defined` che impediva al backend Node.js dell'add-on di comunicare con gli endpoint Home Assistant (`/states` e `/services`). Implementato un polyfill nativo autonomo basato sui moduli standard `http` e `https` di Node.js, che garantisce il funzionamento di `fetch` su qualsiasi versione di Node (Node 14, 16, 18, 20, 22) e qualsiasi base Alpine senza dipendenze npm esterne.
- **Risoluzione Chiamate API Home Assistant**: Ora tutte le chiamate interne verso `/states`, `/services`, l'aggiornamento dei sensori virtuali di ChoreQuest, l'invio delle notifiche e l'endpoint `/api/debug/ha` completano con successo le richieste HTTP verso il Supervisor `http://supervisor/core/api`.
- **Supporto Redirect HTTP/HTTPS & Timeout**: Il motore di richiesta gestisce automaticamente i reindirizzamenti (301, 302, 307, 308) e applica protezioni di timeout contro blocchi di rete.

### ⚡ Miglioramenti
- **Aggiornamento Immagine Base Dockerfile**: Aggiornata l'immagine base predefinita a `ghcr.io/home-assistant/amd64-base:3.20` per fornire runtime Alpine e Node.js moderni.
- **Rilevamento Versione Dinamico**: L'endpoint `/api/system/check_update` legge ora in tempo reale la versione da `package.json` anziché usare una costante statica.

---

## [2.8.2] - 2026-09-22

### ✨ Novità & Multi-Dispositivo per Famiglia e Membri
- **Supporto Multi-Dispositivo Completo**:
  - **Membri della Famiglia**: Ogni membro può ora associare contemporaneamente **più smartphone, tablet e canali** (es. iPhone personale + Tablet Android + Notifica Persistente HA). Tutti i dispositivi selezionati riceveranno in parallelo promemoria, riepiloghi serali e avvisi per nuove faccende assegnate.
  - **Dispositivi Predefiniti Famiglia**: La famiglia può ora selezionare una lista multipla di dispositivi predefiniti (`default_services`), con contatore dinamico e fallback automatico per i membri che scelgono di utilizzare le impostazioni generali.
- **Risoluzione Definitiva Connessione Supervisor & Iniezione Token S6**:
  - Risolto il mancato passaggio delle variabili d'ambiente in ambienti Docker HA Add-on tramite `/usr/bin/with-contenv sh` in `run.sh`.
  - Motore di fallback a 4 livelli per il recupero del token Supervisor (`process.env.SUPERVISOR_TOKEN`, `process.env.HASSIO_TOKEN`, `/run/s6/container_environment/SUPERVISOR_TOKEN`, `/var/run/s6/container_environment/SUPERVISOR_TOKEN`, token Long-Lived manuale).
  - Invio simultaneo delle intestazioni `Authorization: Bearer` e `X-Supervisor-Token`.
- **Nuovo Strumento di Diagnostica Live Home Assistant**:
  - Nuovo endpoint API `/api/debug/ha` e modale interattivo *"Diagnostica HA"* accessibile con un click dalla barra Notifiche, che mostra in tempo reale stato del token, sorgente, risposta degli endpoint `/states` e `/services` ed elenco di tutte le entità e smartphone rilevati.
- **Pannello Test Notifiche Multi-Target**:
  - Possibilità di testare istantaneamente l'invio verso:
    - 📢 *Tutta la Famiglia* (tutti i dispositivi di default);
    - 👤 *Membro Specifico* (tutti i dispositivi associati a quell'utente);
    - 📱 *Singolo Dispositivo* specifico.
- **Connessione Manuale Avanzata (Opzionale)**:
  - Possibilità di inserire nelle impostazioni un URL personalizzato Home Assistant e un Token di Accesso a Lungo Termine per installazioni esterne o standalone.

---

## [2.8.1] - 2026-09-22

### ✨ Novità & Rilevamento Esteso Dispositivi
- **Scansione Multi-Livello Dispositivi Mobile & Entità**: Rilevamento unificato e universale per qualsiasi istanza di Home Assistant:
  - Scansione diretta entità `notify.*` da `/states`.
  - Riconoscimento automatico di tutti gli smartphone e tablet collegati tramite l'app Companion da `device_tracker.*` e sensori batteria `sensor.*_battery_level` (con mappatura automatica a `notify.mobile_app_<nome_dispositivo>` e recupero del `friendly_name` ufficiale).
  - Scansione servizi registrati sotto il dominio `notify` da `/services`.
- **Aggiunta Servizi ed Entità Personalizzate con 1 Click**: Nuovo pulsante *"Aggiungi Servizio Manuale"* che permette all'utente di inserire qualsiasi ID entità o servizio di notifica (`notify.telegram`, `notify.alexa_media_*`, gruppi personalizzati, ecc.), rendendoli immediatamente disponibili nei selettori di tutta la famiglia.
- **Supporto Invio Diretto & Fallback Modern Entity Platform**: Gestione automatica dell'invio sia tramite endpoint di servizio `/services/notify/<servizio>` che con l'azione universale `notify.send_message` con target entity_id, garantendo compatibilità totale con le ultime versioni di Home Assistant 2024/2025/2026.
- **Badge di Stato Connessione Live**: Indicatore dinamico in tempo reale nella sezione Notifiche che mostra lo stato di connessione alle API Home Assistant e il numero esatto di dispositivi ed entità rilevati.

---

## [2.8.0] - 2026-09-22

### ✨ Novità
- **Scansione Reale Servizi & Dispositivi Notifica Home Assistant**: Rilevamento automatico di tutte le entità `notify.*` e dei dispositivi mobile reali (`mobile_app_*`) tramite le API Supervisor (`/states` e `/services`), con visualizzazione dei nomi amichevoli reali (`friendly_name`). Eliminati tutti i dispositivi fittizi/placeholder di test.
- **Preferenze Granulari per Membro della Famiglia**: Ogni utente può associare il proprio dispositivo personale e personalizzare in modo indipendente i 4 interruttori di notifica:
  - 🌅 *Promemoria Mattina* (avviso quotidiano sulle attività della giornata).
  - 🌙 *Riepilogo Serale* (bilancio dei punti guadagnati, classifica e task da completare).
  - 🚨 *Avvisi Urgenze & Scadenze* (faccende scadute o ad alta priorità).
  - 📋 *Nuovi Task Assegnati* (notifica istantanea all'assegnazione di un nuovo compito).
- **Riepilogo Serale Automatico (Evening Recap)**: Motore di riepilogo serale a orario programmabile (default `20:30`) che calcola per ogni membro:
  - Punti guadagnati oggi e compiti completati durante la giornata.
  - Posizione e medaglia nella classifica settimanale (🥇, 🥈, 🥉).
  - Conteggio faccende in sospeso o scadute da terminare prima di andare a dormire.
- **Riprogettazione Menu Navigazione Admin (No Scroll)**: Sostituita la barra a scorrimento orizzontale con una griglia CSS responsive pulita ed elegante (`grid-cols-2 sm:grid-cols-4 lg:grid-cols-8`) che rende accessibili tutti gli 8 pannelli di amministrazione con 1 solo click senza dover scorrere.

### 🛠️ Miglioramenti & Correzioni
- **Pannello Test Notifiche Completo**: Aggiunta la possibilità di simulare ed inviare notifiche di prova per Riepilogo Serale, Promemoria Mattina, Allarme Urgente e Notifica Generica verso qualsiasi dispositivo selezionato.
- **Struttura Dati Notifiche Flessibile**: Salvataggio e migrazione automatica delle impostazioni di notifica e dei flag individuali `members_config` all'interno del database JSON.

---

## [2.7.0] - 2026-09-22

### ✨ Novità & Notifiche Native Home Assistant
- **Motore Notifiche Diretto**: Invio nativo delle notifiche tramite Supervisor API (`notify.*`) senza necessità di creare automazioni esterne in Home Assistant.
- **Mappatura Membri ➔ Dispositivi**: Associazione individuale di ciascun membro della famiglia al proprio dispositivo smartphone/tablet personale o al servizio generale di famiglia (`notify.notify`).
- **Canali Android & Priorità iOS Dedicati**:
  - `ChoreQuest_Urgent` (Priorità Alta per compiti scaduti con possibilità di impostare suonerie/allarmi persistenti su Android).
  - `ChoreQuest_Reminders` (Priorità Standard per promemoria mattutini e compiti in scadenza).
  - `ChoreQuest_General` (Per nuove assegnazioni compiti e vincitori settimanali).
- **Criteri di Notifica Granulari**: Selezione della policy di notifica per ciascuna routine e task singolo (*Preavviso + Scadenza*, *Solo Scadenza & Scadute*, *Solo se Scaduta*, *Disattivata*).
- **Promemoria Giornaliero Schedulato**: Invio programmato a orario configurabile (es. `08:30`) con riepilogo personalizzato per membro e protezione anti-duplicati.
- **Notifiche Istantanee**: Avviso immediato sul cellulare all'assegnazione di un nuovo task singolo.
- **Pannello Test Notifiche Live**: Strumento integrato nella sezione Admin per inviare notifiche di prova immediate.

### 🛠️ Miglioramenti & Correzioni
- **Ordinamento Cronologico**: L'elenco delle attività del singolo membro ordina rigorosamente per data e orario effettivo di esecuzione, recependo modifiche orarie retroattive.
- **Modifica Rapida**: Aggiunto il pulsante "Modifica" accanto a ogni singola riga nella cronologia delle attività del membro.
- **Audit Trail & Fuso Orario**: Formattazione locale corretta delle date e degli orari negli audit log delle modifiche.
- **Rilevamento Profilo HA**: Acquisizione precisa del nome profilo visualizzato di Home Assistant (`hass.user.name`).

---

## [2.6.0] - 2026-09-08

### ✨ Novità
- **Audit Trail Completo**: Registrazione e visualizzazione dello storico di tutte le modifiche apportate alle attività.
- **Integrazione Profilo Utente**: Tracciamento di chi compie le modifiche e le registrazioni.
- **Selezione Data/Ora Flessibile**: Possibilità di retrodatare o programmare le registrazioni e i task.

---

## [2.5.0] - 2026-08-20

### ✨ Novità
- **Task Splitting**: Possibilità di dividere un compito in più parti completando la prima parte a 0 punti.
- **Posticipo Scadenze Routine**: Pulsanti rapidi per posticipare la scadenza di una routine (+1g, +3g, +1sett).
- **Libreria Icone Estesa**: Oltre 450 icone MDI e set completo di emoji.
- **Filtri Rapidi**: Filtro per routine urgenti e compiti ad alta priorità.

---

## [2.0.0] - 2026-08-01

### ✨ Novità
- **Rilascio Ufficiale Add-on Home Assistant**: Architettura Node.js autonoma con Ingress e sincronizzazione sensori Core API.
