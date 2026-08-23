# 🏆 ChoreQuest
### *Gamified Family Chore, Routine & Task Management for Home Assistant.*

[![Home Assistant Add-on](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)
[![Version](https://img.shields.io/badge/version-2.4.0-indigo.svg)](https://github.com/filidam89/chore-quest-addon)
[![Arch](https://img.shields.io/badge/arch-amd64%20%7C%20aarch64%20%7C%20armhf%20%7C%20armv7%20%7C%20i386-orange.svg)](https://github.com/filidam89/chore-quest-addon)

---

## 🌟 Overview

**ChoreQuest** is an advanced, gamified chore, routine, and task management system built specifically for **Home Assistant OS**. It transforms daily household chores into an engaging, collaborative experience for the entire family.

Runs **100% locally 24/7 inside Home Assistant OS**, with seamless integration via Ingress, customizable Lovelace dashboards, and deep sensor synchronization with Home Assistant.

---

## 📱 Core Features (v2.4.0)

### 1. ✂️ Split / Esecuzione Parziale & Data Personalizzabile
- **Esecuzione Parziale:** Possibilità opzionale di completare una faccenda parzialmente con calcolo proporzionale dei punti (25%, 50%, 75% o punti manuali) e nota descrittiva (es. *"Fatta solo metà"*).
- **Data & Ora Personalizzata:** Possibilità di modificare la data/ora effettiva di esecuzione rispetto a quella di default per registrare compiti svolti in precedenza.

### 2. 📅 Frequenza Routine in Giorni o Mesi
- Supporto per cadenze espresse in **Giorni** (es. ogni 3 o 7 giorni) o **Mesi** di calendario (es. ogni 1, 2, 3 o 6 mesi).

### 3. ✏️ Modifica Storico con Tracciamento & Audit Trail
- Pulsante di modifica per ogni elemento dello storico: permette di correggere punteggi, nomi, esecutori o date, richiedendo una **nota di spiegazione** e conservando la cronologia delle modifiche.

### 4. 👤 Cronologia Attività per Singolo Membro
- Cliccando su qualsiasi scheda membro nella Home viene visualizzato un popup dedicato con **tutte le sue attività dalla più recente alla più vecchia**, con punti guadagnati e dettagli.

### 5. 🔒 Preservazione Assoluta dei Dati Esistenti
- Gli aggiornamenti dell'Add-on non sovrascrivono né cancellano mai le attività, routine, categorie o storico salvati nel database.

---

## 📡 Home Assistant Sensors (Live Sync via Supervisor API)

ChoreQuest pubblica sensori ed entità binarie in tempo reale:

| Entità | Tipo | Descrizione |
| :--- | :--- | :--- |
| `sensor.chorequest_<membro>_points` | Sensore | Punti totali, del periodo, posizione in classifica, trofei e ultima attività |
| `sensor.chorequest_<membro>_pending_tasks` | Sensore | Conteggio e lista dei task in sospeso per quel membro |
| `sensor.chorequest_leaderboard` | Sensore | Vincitore attuale e classifica completa |
| `sensor.chorequest_due_routines` | Sensore | Totale routine da eseguire (scadute + in scadenza) |
| `sensor.chorequest_overdue_routines` | Sensore | Conteggio e lista delle sole routine scadute |
| `sensor.chorequest_warning_routines` | Sensore | Conteggio e lista delle routine in scadenza imminente |
| `sensor.chorequest_pending_tasks` | Sensore | Totale task singoli pendenti nella casa |
| `binary_sensor.chorequest_all_chores_done` | Sensore Binario | `on` quando non ci sono routine scadute (Tutto in ordine) |
| `binary_sensor.chorequest_has_overdue` | Sensore Binario | `on` quando ci sono routine scadute |
| `sensor.chorequest_summary` | Sensore | Riepilogo sintetico per notifiche o dashboard HA |

---

## 🚀 Installation & Update Guide (Home Assistant OS)

1. In Home Assistant, vai in **Impostazioni** ⚙️ ➔ **Add-on** ➔ **Store degli Add-on**.
2. Clicca sui **tre pallini in alto a destra (⋮)** ➔ **Controlla aggiornamenti** (oppure ricarica con `F5`).
3. Apri **ChoreQuest** e clicca su **Aggiorna (Update)** o **Ricostruisci (Rebuild)** alla versione **v2.4.0**.
4. Clicca su **AVVIA**!

---

## 🔒 Privacy & Persistence

* **100% Locale:** Nessun cloud o account esterno richiesto.
* **Persistenza Garantita:** Salvataggio automatico in `/data/family_punti.json`.

---

## 📄 License

MIT License © 2026 ChoreQuest
