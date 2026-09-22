# 🏆 ChoreQuest (v2.8.1)

> **Add-on Ufficiale Home Assistant per la Gamification e Gestione delle Faccende di Casa e Famiglia**

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)
![Version](https://img.shields.io/badge/Version-2.8.1-emerald.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Novità & Funzionalità Chiave v2.8.1

- 🔔 **Scansione Multi-Livello Dispositivi & Entità Notifica Home Assistant:**
  - Compatibilità universale per qualsiasi installazione Home Assistant: rileva entità `notify.*`, smartphone Companion App tramite `device_tracker.*` e sensori batteria, e servizi del dominio `notify`.
  - **Aggiunta Servizi ed Entità Personalizzate con 1 Click**: Possibilità di aggiungere qualsiasi canale o entità di notifica (`notify.telegram`, `notify.alexa`, ecc.) direttamente dall'interfaccia.
  - **Supporto Invio Diretto & Fallback `notify.send_message`**: Massima compatibilità con le API recenti e classiche di Home Assistant.
  - **Badge Stato Connessione Live**: Feedback visivo immediato sullo stato di comunicazione con le API Home Assistant e il numero di dispositivi rilevati.
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
  - Permette su Android di personalizzare suonerie e modalità silenziosa in modo indipendente nelle impostazioni dell'app Home Assistant!
- 🎛️ **Menu Admin Riprogettato (No-Scroll Grid):**
  - Sostituita la barra a scorrimento orizzontale con una griglia compatta e responsive con 8 tasti sempre a portata di mano.
- 📊 **Ordinamento Cronologico Reale per Data/Ora:**
  - Cliccando sul nome o punteggio di un membro, l'elenco delle attività svolte viene ordinato rigorosamente per **data e ora effettiva di esecuzione** (`created_at`), recependo all'istante qualsiasi modifica oraria retroattiva o futura.
- ✏️ **Pulsante Modifica Diretto nelle Attività del Membro:**
  - Aggiunto il pulsante **"Modifica"** accanto a ogni singola riga nella modale delle attività del componente della famiglia.
- 🕒 **Formattazione Fuso Orario nell'Audit Trail Modifiche:**
  - L'audit trail delle modifiche formatta gli orari prima/dopo nel fuso orario locale del dispositivo.
- 👤 **Rilevamento Diretto del Nome Profilo Home Assistant (`hass.user.name`):**
  - Acquisizione del vero **Nome Profilo Visualizzato** (es. *"Daniele"*, *"Tablet Cucina"*, *"Mamma"*, *"Papà"*), ignorando lo username tecnico di login.
- ✨ **Libreria Icone & Emoji Immensa (450+ Icone):**
  - Oltre **300 Icone Material Design (MDI)** in 12 categorie e oltre **150 Emoji**.
- 🔄 **Controllo Aggiornamenti Live dal Menu Admin:** Verifica direttamente dall'app lo stato della versione su GitHub.
- 📅 **Posticipo Scadenza Routine:** Posticipa la scadenza con 1 tap (+1g, +3g, +1 sett o data personalizzata).
- ✂️ **Task Splitting Intelligente:** Completa una parte del compito (0 pt) e rinomina la parte rimanente.
- 🕒 **Data/Ora Esecuzione Opzionale:** Inserimento rapido delle faccende con selettore data/ora compresso sotto il pulsante calendario.
- 🔥 **Filtro Routine Urgenti & Alte:** Filtra con 1 tap le routine con priorità elevata o scadute.
- 📊 **Audit Trail & Storico Modifiche:** Ogni riga modificata nello storico mostra chi ha fatto la modifica, quando e perché.
- 🔄 **Sensori Home Assistant Real-Time:** Punti membri, routine in scadenza, task in sospeso e sensore binario `binary_sensor.chorequest_all_chores_done`.
- 💾 **Backup & Ripristino:** Esportazione e importazione JSON del database in qualsiasi momento.

---

## 🚀 Installazione & Aggiornamento su Home Assistant

1. Vai in **Impostazioni** ➔ **Add-on** ➔ **Store degli Add-on**.
2. Clicca sui tre pallini in alto a destra (**⋮**) ➔ **Controlla aggiornamenti** (o ricarica con `F5`).
3. Clicca su **Aggiorna (Update)** alla versione **v2.8.1** e avvia l'Add-on!
