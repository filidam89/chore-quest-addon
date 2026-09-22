# 🏆 ChoreQuest (v2.7.0)

> **Add-on Ufficiale Home Assistant per la Gamification e Gestione delle Faccende di Casa e Famiglia**

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)
![Version](https://img.shields.io/badge/Version-2.7.0-emerald.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Novità & Funzionalità Chiave v2.7.0

- 🔔 **Notifiche Native Home Assistant Gestite Direttamente dall'Add-on:**
  - Nessuna automazione complicata da creare in Home Assistant: ChoreQuest interroga i servizi `notify.*` nativi e invia notifiche mirate e tempestive.
  - **Mappatura Membri ➔ Smartphone Personali:** Associa ogni componente della famiglia al proprio dispositivo mobile (es. `notify.mobile_app_iphone_filippo`, `notify.mobile_app_pixel_mamma`) o al canale generale di casa.
  - **Canali di Notifica & Suonerie Differenziate (Android & iOS):**
    - `ChoreQuest_Urgent` (Priorità Alta / Suono persistente o sveglia per le faccende scadute).
    - `ChoreQuest_Reminders` (Priorità Standard / Notifica discreta per promemoria e preavvisi).
    - `ChoreQuest_General` (Notifica per nuovi compiti assegnati e vincitori settimanali).
    - Permette su Android di personalizzare suonerie e modalità silenziosa in modo indipendente nelle impostazioni dell'app Home Assistant!
  - **Flag Criterio Notifiche Granulare:**
    - Per ogni routine o task singolo puoi impostare:
      - 🔔 *Giorno di scadenza e se scaduta* (Default)
      - ⏰ *Preavviso (1 giorno prima), giorno di scadenza e se scaduta*
      - 🚨 *Solo se scaduta / urgente*
      - 🔕 *Nessuna notifica (Disattivata)*
  - **Promemoria Giornaliero Schedulato:** Invio automatico ad orario personalizzabile (es. `08:30`).
  - **Notifiche Istantanee per Assegnazione Task e Vincitore Settimanale:** Invio immediato al membro incaricato.
  - **Pannello Test Notifiche Live:** Prova l'invio immediato verso qualsiasi smartphone con feedback visivo.

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
3. Clicca su **Aggiorna (Update)** alla versione **v2.7.0** e avvia l'Add-on!
