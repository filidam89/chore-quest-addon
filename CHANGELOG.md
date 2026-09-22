# Changelog - ChoreQuest

Tutte le novità, miglioramenti e correzioni introdotte nelle versioni di ChoreQuest.

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
