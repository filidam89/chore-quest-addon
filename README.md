# 🏆 ChoreQuest (v2.6.4)

> **Add-on Ufficiale Home Assistant per la Gamification e Gestione delle Faccende di Casa e Famiglia**

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)
![Version](https://img.shields.io/badge/Version-2.6.4-emerald.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Novità & Funzionalità Chiave v2.6.4

- 🎯 **Risoluzione Bug Completamento Task Singoli in Sospeso:**
  - Risolto il problema per cui cliccando su **"✓ Fatto"** su un task singolo in sospeso venivano accreditati i punti ma il task rimaneva visibile nella lista dei task pendenti.
  - Ora il completamento trasmette correttamente l'ID del task all'endpoint `/api/single_tasks/complete` (e `/api/log` come doppio fallback), aggiornando all'istante lo stato del task in `completed` e rimuovendolo dalla lista dei compiti pendenti e dal badge dei task in sospeso.
  - Aggiunto anche il pulsante **"✓ Segna come Fatto"** direttamente all'interno della modale dei dettagli e note del task.
- 👤 **Rilevamento Diretto del Nome Profilo Home Assistant (`hass.user.name`):**
  - Il frontend estrae direttamente dal contesto Ingress del browser l'oggetto `window.parent.hass.user.name`, garantendo l'acquisizione del vero **Nome Profilo Visualizzato** (es. *"Daniele"*, *"Tablet Cucina"*, *"Mamma"*, *"Papà"*), ignorando lo username tecnico di login.
- ✨ **Libreria Icone & Emoji Immensa (450+ Icone):**
  - Oltre **300 Icone Material Design (MDI)** in 12 categorie e oltre **150 Emoji**.
- 🔄 **Controllo Aggiornamenti Live dal Menu Admin:** Verifica direttamente dall'app lo stato della versione su GitHub e le istruzioni di aggiornamento.
- 📅 **Posticipo Scadenza Routine:** Tocca qualsiasi routine in Home o nel Catalogo per posticipare la scadenza (+1g, +3g, +1 sett o data a scelta con motivazione).
- ✂️ **Task Splitting Intelligente:** Completa una parte del compito (0 pt) e rinomina la parte rimanente.
- 🕒 **Data/Ora Esecuzione Opzionale:** Inserimento rapido delle faccende con selettore data/ora compresso sotto il pulsante calendario.
- 🔥 **Filtro Routine Urgenti & Alte:** Filtra con 1 tap le routine con priorità elevata o scadute.
- 📱 **Pulsanti Home Solidi & Moderni:** Design piatto ad alto contrasto senza sfumature confuse.
- 📊 **Audit Trail & Storico Modifiche:** Ogni riga modificata nello storico mostra chi ha fatto la modifica, quando e perché.
- 🔄 **Sensori Home Assistant Real-Time:** Punti membri, routine in scadenza, task in sospeso e sensore binario `binary_sensor.chorequest_all_chores_done`.
- 💾 **Backup & Ripristino:** Esportazione e importazione JSON del database in qualsiasi momento.

---

## 🚀 Installazione & Aggiornamento su Home Assistant

1. Vai in **Impostazioni** ➔ **Add-on** ➔ **Store degli Add-on**.
2. Clicca sui tre pallini in alto a destra (**⋮**) ➔ **Controlla aggiornamenti** (o ricarica con `F5`).
3. Clicca su **Aggiorna (Update)** alla versione **v2.6.4** e avvia l'Add-on!
