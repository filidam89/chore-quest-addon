# 🏆 ChoreQuest (v2.6.2)

> **Add-on Ufficiale Home Assistant per la Gamification e Gestione delle Faccende di Casa e Famiglia**

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)
![Version](https://img.shields.io/badge/Version-2.6.2-emerald.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Novità & Funzionalità Chiave v2.6.2

- 👤 **Risoluzione del Nome Profilo Reale di Home Assistant (Friendly Name):**
  - Il sistema estrae il **Nome Profilo / Nome Visualizzato** reale di Home Assistant (es. *"Daniele"*, *"Tablet Cucina"*, *"Papà"*, *"Mamma"*) dalle entità `person.*` e dalla configurazione Auth di Home Assistant, anziché limitarsi al semplice username tecnico di login (es. *`filidam89`*).
  - Se il dispositivo è un tablet o un utente esterno, viene visualizzato con la sua icona dedicata (es. `📱 Tablet (Home Assistant)`).
  - L'autore viene associato a tutte le note, modifiche, split e creazioni di task.
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
3. Clicca su **Aggiorna (Update)** alla versione **v2.6.2** e avvia l'Add-on!
