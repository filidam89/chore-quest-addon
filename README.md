# 🏆 ChoreQuest (v2.6.6)

> **Add-on Ufficiale Home Assistant per la Gamification e Gestione delle Faccende di Casa e Famiglia**

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)
![Version](https://img.shields.io/badge/Version-2.6.6-emerald.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Novità & Funzionalità Chiave v2.6.6

- 🕒 **Formattazione Fuso Orario nell'Audit Trail Modifiche:**
  - Risolto il disallineamento per cui la riga dell'attività mostrava l'orario locale (es. `Ieri 14:00`), mentre la riga delle modifiche registrate mostrava l'orario UTC calcolato dal server (es. `➔ 08/09 12:00`).
  - Il server ora memorizza i timestamp ISO originali nelle modifiche e il client li formatta con il fuso orario locale del dispositivo (es. `Data: Ieri 23:59 ➔ Ieri 14:00`), garantendo perfetta coerenza.
- 📅 **Risoluzione Bug Modifica Data Eventi & Timezone:**
  - Conversione precisa in formato ISO 8601 locale prima dell'invio al server e inizializzazione corretta del campo `datetime-local`.
  - Ricalcolo automatico della data di completamento delle routine collegate quando viene modificata la data di un'attività di routine nello storico.
- 🎯 **Risoluzione Bug Completamento Task Singoli in Sospeso:**
  - Cliccando su **"✓ Fatto"** o **"Segna come Fatto"** il task singolo viene immediatamente contrassegnato come completato e rimosso dalla vista e dai contatori.
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
3. Clicca su **Aggiorna (Update)** alla versione **v2.6.6** e avvia l'Add-on!
