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
      if (!data.members) data.members = {};
      if (!data.spontaneous_tasks) data.spontaneous_tasks = [];
      if (!data.routine_tasks) data.routine_tasks = [];
      if (!data.assigned_tasks) data.assigned_tasks = [];
      if (!data.logs) data.logs = [];
      if (!data.settings) {
        data.settings = {
          leaderboard_period_mode: "calendar" // "calendar" (Oggi, Settimana, Mese, Anno) or "rolling" (Ultimi 1gg, 7gg, 30gg, 365gg)
        };
      }

      // Migrations for routine fields
      const todayIso = new Date().toISOString().split('T')[0];
      data.routine_tasks.forEach(r => {
        if (!r.schedule_type) r.schedule_type = 'from_last';
        if (r.warning_days === undefined) r.warning_days = 1;
        if (!r.start_date) r.start_date = todayIso;
      });

      return data;
    } catch (e) {
      console.error("Error reading database:", e);
    }
  }

  const todayIso = new Date().toISOString().split('T')[0];
  return {
    settings: {
      leaderboard_period_mode: "calendar"
    },
    members: {
      "m_1": { id: "m_1", name: "Papà", icon: "👨‍💻", color: "#6366f1" },
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
      { id: "r_1", name: "Cambio lenzuola", category: "Bucato", points: 25, frequency_days: 7, warning_days: 1, start_date: todayIso, schedule_type: "from_last", icon: "🛏️" },
      { id: "r_2", name: "Aspirapolvere & Lavaggio pavimenti", category: "Pulizia", points: 30, frequency_days: 3, warning_days: 1, start_date: todayIso, schedule_type: "from_last", icon: "🧹" },
      { id: "r_3", name: "Pulizia profonda bagno", category: "Pulizia", points: 35, frequency_days: 5, warning_days: 2, start_date: todayIso, schedule_type: "from_last", icon: "🧼" }
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

// Calculate comprehensive period stats
function calculateStats() {
  const now = new Date();
  const periodMode = appData.settings?.leaderboard_period_mode || "calendar";

  let startDaily, startWeekly, startMonthly, startYearly;

  if (periodMode === "calendar") {
    startDaily = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    startWeekly = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    startMonthly = new Date(now.getFullYear(), now.getMonth(), 1);
    startYearly = new Date(now.getFullYear(), 0, 1);
  } else {
    // Rolling mode (Last 24h, Last 7d, Last 30d, Last 365d)
    startDaily = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    startWeekly = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    startMonthly = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    startYearly = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
  }

  const stats = {};
  Object.values(appData.members).forEach(m => {
    stats[m.id] = {
      ...m,
      total_points: 0,
      daily_points: 0,
      weekly_points: 0,
      monthly_points: 0,
      yearly_points: 0,
      completed_count: 0,
      recent_tasks: [],
      badges: []
    };
  });

  const memberTaskLogs = {};
  (appData.logs || []).forEach(log => {
    const m = stats[log.member_id];
    if (m) {
      const pts = parseInt(log.points) || 0;
      const created = new Date(log.created_at);
      m.total_points += pts;
      m.completed_count += 1;

      if (created >= startDaily) m.daily_points += pts;
      if (created >= startWeekly) m.weekly_points += pts;
      if (created >= startMonthly) m.monthly_points += pts;
      if (created >= startYearly) m.yearly_points += pts;

      if (!memberTaskLogs[m.id]) memberTaskLogs[m.id] = [];
      memberTaskLogs[m.id].push(log);
    }
  });

  // Attach last 3 tasks for each member
  Object.keys(stats).forEach(mId => {
    const logs = memberTaskLogs[mId] || [];
    stats[mId].recent_tasks = logs.slice(-3).reverse();
  });

  const sorted = Object.values(stats).sort((a, b) => b.weekly_points - a.weekly_points || b.total_points - a.total_points);
  sorted.forEach((m, idx) => {
    m.rank = idx + 1;
    if (m.rank === 1 && m.weekly_points > 0) m.badges.push({ name: "👑 Campione Settimana" });
    if (m.completed_count >= 10) m.badges.push({ name: "⭐ Super Aiutante" });
    if (m.total_points >= 100) m.badges.push({ name: "🏆 Master della Casa" });
  });

  // Winners per period
  const getWinner = (key) => {
    const s = [...sorted].sort((a, b) => b[key] - a[key]);
    return s[0] && s[0][key] > 0 ? { name: s[0].name, icon: s[0].icon, points: s[0][key] } : null;
  };

  const winners = {
    daily: getWinner('daily_points'),
    weekly: getWinner('weekly_points'),
    monthly: getWinner('monthly_points'),
    yearly: getWinner('yearly_points')
  };

  // Evaluate Routine Due Statuses
  const routineStatus = (appData.routine_tasks || []).map(r => {
    const freq = parseInt(r.frequency_days) || 7;
    const warning = parseInt(r.warning_days) || 1;
    let baseDate = r.last_completed_at ? new Date(r.last_completed_at) : (r.start_date ? new Date(r.start_date) : now);
    
    // Target due date
    const dueDate = new Date(baseDate.getTime() + (freq * 24 * 60 * 60 * 1000));
    const diffMs = dueDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status = "ok"; // "ok", "warning", "overdue"
    let overdueDays = 0;

    if (diffDays < 0) {
      status = "overdue";
      overdueDays = Math.abs(diffDays);
    } else if (diffDays <= warning) {
      status = "warning";
    }

    return {
      ...r,
      due_date: dueDate.toISOString(),
      days_remaining: diffDays,
      overdue_days: overdueDays,
      status
    };
  });

  return {
    members: stats,
    leaderboard: sorted,
    winners,
    spontaneous_tasks: appData.spontaneous_tasks,
    routine_tasks: routineStatus,
    pending_assigned: (appData.assigned_tasks || []).filter(t => t.status === 'pending'),
    settings: appData.settings,
    logs: (appData.logs || [])
  };
}

// Generic Home Assistant Sync via Supervisor API
async function syncToHomeAssistant() {
  const supervisorToken = process.env.SUPERVISOR_TOKEN;
  if (!supervisorToken) return;

  const haBase = "http://supervisor/core/api";
  const data = calculateStats();

  // 1. Member points sensors
  for (const m of data.leaderboard) {
    const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const sensorUrl = `${haBase}/states/sensor.chorequest_${cleanName}_points`;
    const lastTask = m.recent_tasks[0];
    try {
      await fetch(sensorUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: String(m.total_points),
          attributes: {
            friendly_name: `ChoreQuest: Punti ${m.name}`,
            daily_points: m.daily_points,
            weekly_points: m.weekly_points,
            monthly_points: m.monthly_points,
            yearly_points: m.yearly_points,
            total_points: m.total_points,
            rank: m.rank,
            badges: m.badges.map(b => b.name),
            last_task_name: lastTask ? lastTask.task_name : null,
            last_task_time: lastTask ? lastTask.created_at : null,
            icon: "mdi:star-circle"
          }
        })
      });
    } catch (err) {}
  }

  // 2. Leaderboard & Winners Sensor
  try {
    await fetch(`${haBase}/states/sensor.chorequest_leaderboard`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: data.leaderboard[0] ? data.leaderboard[0].name : "Nessuno",
        attributes: {
          friendly_name: "ChoreQuest: Classifica",
          leader: data.leaderboard[0]?.name || "-",
          daily_winner: data.winners.daily?.name || "-",
          weekly_winner: data.winners.weekly?.name || "-",
          monthly_winner: data.winners.monthly?.name || "-",
          yearly_winner: data.winners.yearly?.name || "-",
          leaderboard: data.leaderboard.map(m => ({ rank: m.rank, name: m.name, weekly_points: m.weekly_points, total_points: m.total_points })),
          icon: "mdi:trophy"
        }
      })
    });
  } catch (err) {}

  // 3. Due Routines Sensor
  const overdueList = data.routine_tasks.filter(r => r.status === 'overdue');
  const warningList = data.routine_tasks.filter(r => r.status === 'warning');
  try {
    await fetch(`${haBase}/states/sensor.chorequest_due_routines`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: String(overdueList.length + warningList.length),
        attributes: {
          friendly_name: "ChoreQuest: Routine in Scadenza",
          overdue_count: overdueList.length,
          warning_count: warningList.length,
          overdue_routines: overdueList.map(r => ({ name: r.name, overdue_days: r.overdue_days })),
          warning_routines: warningList.map(r => ({ name: r.name, days_remaining: r.days_remaining })),
          icon: "mdi:clock-alert-outline"
        }
      })
    });
  } catch (err) {}

  // 4. Pending Tasks Sensor
  try {
    await fetch(`${haBase}/states/sensor.chorequest_pending_tasks`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: String(data.pending_assigned.length),
        attributes: {
          friendly_name: "ChoreQuest: Compiti Assegnati in Sospeso",
          pending_tasks: data.pending_assigned.map(t => ({ task_name: t.task_name, from: t.from_member, to: t.to_member, points: t.points })),
          icon: "mdi:clipboard-check-outline"
        }
      })
    });
  } catch (err) {}
}

// Initial Sync
syncToHomeAssistant();

// API: Stats & Data
app.get('/api/stats', (req, res) => {
  const statsData = calculateStats();
  res.json(statsData);
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
    appData.members[mId].name = trimmedName;
    appData.members[mId].icon = icon;
    appData.members[mId].color = color;
  } else {
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
  const { id, name, points = 20, frequency_days = 7, warning_days = 1, start_date, schedule_type = "from_last", icon = "🔄", category = "Routine" } = req.body;
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
    warning_days: parseInt(warning_days) || 1,
    start_date: start_date || existingItem.start_date || new Date().toISOString().split('T')[0],
    schedule_type: schedule_type || "from_last",
    icon,
    category
  };

  if (idx >= 0) appData.routine_tasks[idx] = item;
  else appData.routine_tasks.push(item);

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "saved", item });
});

// API: Delete Routine Task
app.post('/api/routine_tasks/delete', (req, res) => {
  const { id } = req.body;
  appData.routine_tasks = appData.routine_tasks.filter(t => t.id !== id);
  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "deleted" });
});

// API: Save Settings
app.post('/api/settings', (req, res) => {
  const { leaderboard_period_mode } = req.body;
  if (leaderboard_period_mode) {
    if (!appData.settings) appData.settings = {};
    appData.settings.leaderboard_period_mode = leaderboard_period_mode;
    saveData(appData);
    syncToHomeAssistant();
  }
  res.json({ status: "saved", settings: appData.settings });
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 ChoreQuest Add-on server attivo su porta ${PORT}`);
});
