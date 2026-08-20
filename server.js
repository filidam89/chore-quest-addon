const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9006;

// Determine persistent data path (inside HA Add-on, /data is mounted persistently)
const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'family_punti.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

function loadData() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // Migrations / defaults
      if (!data.members) data.members = {};
      if (!data.spontaneous_tasks) data.spontaneous_tasks = [];
      if (!data.routine_tasks) data.routine_tasks = [];
      if (!data.assigned_tasks) data.assigned_tasks = [];
      if (!data.logs) data.logs = [];

      // Ensure schedule_type exists in routine tasks
      data.routine_tasks.forEach(r => {
        if (!r.schedule_type) r.schedule_type = 'from_last'; // 'from_last' or 'fixed'
      });
      return data;
    } catch (e) {
      console.error("Error reading database:", e);
    }
  }
  // Generic initial state
  return {
    members: {
      "m_1": { id: "m_1", name: "Papà", icon: "👨‍💻", color: "#3b82f6" },
      "m_2": { id: "m_2", name: "Mamma", icon: "👩‍🎨", color: "#ec4899" }
    },
    spontaneous_tasks: [
      { id: "s_1", name: "Fare la lavatrice", category: "Bucato", points: 15, icon: "🧺" },
      { id: "s_2", name: "Lavare i piatti / Svuotare lavastoviglie", category: "Cucina", points: 10, icon: "🍽️" },
      { id: "s_3", name: "Preparare il pranzo / cena", category: "Cucina", points: 20, icon: "🍳" },
      { id: "s_4", name: "Portare fuori la spazzatura", category: "Pulizia", points: 10, icon: "🗑️" },
      { id: "s_5", name: "Fare la spesa", category: "Casa", points: 25, icon: "🛒" }
    ],
    routine_tasks: [
      { id: "r_1", name: "Cambio lenzuola", category: "Bucato", points: 25, frequency_days: 7, schedule_type: "from_last", icon: "🛏️" },
      { id: "r_2", name: "Aspirapolvere & Lavaggio pavimenti", category: "Pulizia", points: 30, frequency_days: 3, schedule_type: "from_last", icon: "🧹" },
      { id: "r_3", name: "Pulizia profonda bagno", category: "Pulizia", points: 35, frequency_days: 5, schedule_type: "from_last", icon: "🧼" }
    ],
    assigned_tasks: [],
    logs: []
  };
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error("Error saving database:", e);
  }
}

let appData = loadData();

// Generic Home Assistant Sync via Supervisor API
async function syncToHomeAssistant() {
  const supervisorToken = process.env.SUPERVISOR_TOKEN;
  if (!supervisorToken) return;

  const haBase = "http://supervisor/core/api";
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {};
  Object.values(appData.members).forEach(m => {
    stats[m.id] = { ...m, total_points: 0, weekly_points: 0, monthly_points: 0, completed_count: 0, badges: [] };
  });

  (appData.logs || []).forEach(log => {
    const m = stats[log.member_id];
    if (m) {
      const pts = parseInt(log.points) || 0;
      const created = new Date(log.created_at);
      m.total_points += pts;
      m.completed_count += 1;
      if (created >= startOfWeek) m.weekly_points += pts;
      if (created >= startOfMonth) m.monthly_points += pts;
    }
  });

  const sorted = Object.values(stats).sort((a, b) => b.weekly_points - a.weekly_points || b.total_points - a.total_points);
  sorted.forEach((m, idx) => {
    m.rank = idx + 1;
    if (m.rank === 1 && m.weekly_points > 0) m.badges.push({ name: "👑 Campione della Settimana" });
    if (m.completed_count >= 10) m.badges.push({ name: "⭐ Super Aiutante" });
  });

  // Push member sensors
  for (const m of sorted) {
    const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const sensorUrl = `${haBase}/states/sensor.family_${cleanName}_points`;
    try {
      await fetch(sensorUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: String(m.total_points),
          attributes: {
            friendly_name: `Punti ${m.name}`,
            weekly_points: m.weekly_points,
            monthly_points: m.monthly_points,
            total_points: m.total_points,
            rank: m.rank,
            badges: m.badges.map(b => b.name),
            icon: "mdi:star-circle"
          }
        })
      });
    } catch (err) {}
  }

  // Push leaderboard sensor
  try {
    await fetch(`${haBase}/states/sensor.family_leaderboard`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: sorted[0] ? sorted[0].name : "Nessuno",
        attributes: {
          friendly_name: "Classifica Famiglia Punti",
          leaderboard: sorted.map(m => ({ rank: m.rank, name: m.name, weekly_points: m.weekly_points, total_points: m.total_points })),
          icon: "mdi:trophy"
        }
      })
    });
  } catch (err) {}
}

// Initial Sync
syncToHomeAssistant();

// API: Stats & Data
app.get('/api/stats', (req, res) => {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {};
  Object.values(appData.members).forEach(m => {
    stats[m.id] = { ...m, total_points: 0, weekly_points: 0, monthly_points: 0, completed_count: 0, badges: [] };
  });

  (appData.logs || []).forEach(log => {
    const m = stats[log.member_id];
    if (m) {
      const pts = parseInt(log.points) || 0;
      const created = new Date(log.created_at);
      m.total_points += pts;
      m.completed_count += 1;
      if (created >= startOfWeek) m.weekly_points += pts;
      if (created >= startOfMonth) m.monthly_points += pts;
    }
  });

  const sorted = Object.values(stats).sort((a, b) => b.weekly_points - a.weekly_points || b.total_points - a.total_points);
  sorted.forEach((m, idx) => {
    m.rank = idx + 1;
    if (m.rank === 1 && m.weekly_points > 0) m.badges.push({ name: "👑 Campione della Settimana" });
    if (m.completed_count >= 10) m.badges.push({ name: "⭐ Super Aiutante" });
  });

  const pending = (appData.assigned_tasks || []).filter(t => t.status === 'pending');

  res.json({
    members: stats,
    leaderboard: sorted,
    spontaneous_tasks: appData.spontaneous_tasks,
    routine_tasks: appData.routine_tasks,
    pending_assigned: pending,
    logs: (appData.logs || [])
  });
});

// API: Log Task
app.post('/api/log', (req, res) => {
  const { member, task_name, points = 10, task_type = "spontaneous" } = req.body;
  if (!member || !task_name) return res.status(400).json({ error: "Missing parameters" });

  let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === member.toLowerCase());
  if (!memberObj) {
    const mId = `m_${Date.now()}`;
    memberObj = { id: mId, name: member, icon: "👤", color: "#6366f1" };
    appData.members[mId] = memberObj;
  }

  const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const newLog = {
    id: logId,
    member_id: memberObj.id,
    member_name: memberObj.name,
    task_name,
    task_type,
    points: parseInt(points) || 10,
    created_at: new Date().toISOString()
  };
  appData.logs.push(newLog);

  if (task_type === 'routine') {
    const rout = appData.routine_tasks.find(r => r.name.toLowerCase() === task_name.toLowerCase() || r.id === task_name);
    if (rout) {
      rout.last_completed_at = new Date().toISOString();
      rout.last_completed_by = memberObj.name;
    }
  }

  saveData(appData);
  syncToHomeAssistant();
  res.status(201).json(newLog);
});

// API: Delete Log Entry (Undo)
app.post('/api/logs/delete', (req, res) => {
  const { id } = req.body;
  if (id) {
    appData.logs = appData.logs.filter(l => l.id !== id);
    saveData(appData);
    syncToHomeAssistant();
  }
  res.json({ status: "deleted" });
});

// API: Assign Task
app.post('/api/assign', (req, res) => {
  const { from_member, to_member, task_name, points = 10 } = req.body;
  if (!from_member || !to_member || !task_name) return res.status(400).json({ error: "Missing parameters" });

  const newTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    from_member,
    to_member,
    task_name,
    points: parseInt(points) || 10,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  appData.assigned_tasks.push(newTask);
  saveData(appData);
  syncToHomeAssistant();
  res.status(201).json(newTask);
});

// API: Complete Assigned Task
app.post('/api/complete_assigned', (req, res) => {
  const { task_id, completed_by } = req.body;
  const task = (appData.assigned_tasks || []).find(t => t.id === task_id && t.status === 'pending');
  if (task) {
    task.status = 'completed';
    task.completed_at = new Date().toISOString();
    const worker = completed_by || task.to_member;

    let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === worker.toLowerCase());
    if (memberObj) {
      appData.logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        member_id: memberObj.id,
        member_name: memberObj.name,
        task_name: task.task_name,
        task_type: 'assigned',
        points: task.points,
        created_at: new Date().toISOString()
      });
    }
    saveData(appData);
    syncToHomeAssistant();
  }
  res.json({ status: "completed" });
});

// API: Save / Add Member
app.post('/api/members', (req, res) => {
  const { id, name, icon = "👤", color = "#6366f1" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });

  const trimmedName = name.trim();
  let mId = id;

  if (mId && appData.members[mId]) {
    // Update existing member
    appData.members[mId].name = trimmedName;
    appData.members[mId].icon = icon;
    appData.members[mId].color = color;
  } else {
    // Check if name already exists
    const existing = Object.values(appData.members).find(m => m.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      existing.icon = icon;
      existing.color = color;
      mId = existing.id;
    } else {
      mId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      appData.members[mId] = { id: mId, name: trimmedName, icon, color };
    }
  }

  saveData(appData);
  syncToHomeAssistant();
  res.status(200).json(appData.members[mId]);
});

// API: Delete Member
app.post('/api/members/delete', (req, res) => {
  const { id } = req.body;
  if (id && appData.members[id]) {
    delete appData.members[id];
    saveData(appData);
    syncToHomeAssistant();
  }
  res.json({ status: "deleted" });
});

// API: Save Spontaneous Task
app.post('/api/spontaneous_tasks', (req, res) => {
  const { id, name, points = 10, icon = "⚡", category = "Generale" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });

  const trimmedName = name.trim();
  const tId = id || `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const idx = appData.spontaneous_tasks.findIndex(t => t.id === tId || t.name.toLowerCase() === trimmedName.toLowerCase());
  const item = { id: tId, name: trimmedName, points: parseInt(points) || 10, icon, category };

  if (idx >= 0) appData.spontaneous_tasks[idx] = item;
  else appData.spontaneous_tasks.push(item);

  saveData(appData);
  res.json({ status: "saved", item });
});

// API: Delete Spontaneous Task
app.post('/api/spontaneous_tasks/delete', (req, res) => {
  const { id } = req.body;
  appData.spontaneous_tasks = appData.spontaneous_tasks.filter(t => t.id !== id);
  saveData(appData);
  res.json({ status: "deleted" });
});

// API: Save Routine Task
app.post('/api/routine_tasks', (req, res) => {
  const { id, name, points = 20, frequency_days = 7, schedule_type = "from_last", icon = "🔄", category = "Routine" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });

  const trimmedName = name.trim();
  const tId = id || `r_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const idx = appData.routine_tasks.findIndex(t => t.id === tId || t.name.toLowerCase() === trimmedName.toLowerCase());
  
  const existingItem = idx >= 0 ? appData.routine_tasks[idx] : {};
  const item = {
    ...existingItem,
    id: tId,
    name: trimmedName,
    points: parseInt(points) || 20,
    frequency_days: parseInt(frequency_days) || 7,
    schedule_type: schedule_type || "from_last",
    icon,
    category
  };

  if (idx >= 0) appData.routine_tasks[idx] = item;
  else appData.routine_tasks.push(item);

  saveData(appData);
  res.json({ status: "saved", item });
});

// API: Delete Routine Task
app.post('/api/routine_tasks/delete', (req, res) => {
  const { id } = req.body;
  appData.routine_tasks = appData.routine_tasks.filter(t => t.id !== id);
  saveData(appData);
  res.json({ status: "deleted" });
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 ChoreQuest Add-on server attivo su porta ${PORT}`);
});
