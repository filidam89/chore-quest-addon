const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9006;

// Persistent data directory
const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'family_punti.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

function loadData() {
  const todayIso = new Date().toISOString().split('T')[0];

  const defaultCategories = [
    { id: "cat_cucina", name: "Cucina & Spesa", icon: "🍳", order: 1 },
    { id: "cat_pulizia", name: "Pulizia & Casa", icon: "🧹", order: 2 },
    { id: "cat_bucato", name: "Bucato & Panni", icon: "🧺", order: 3 },
    { id: "cat_manutenzione", name: "Manutenzione & Auto", icon: "🔧", order: 4 },
    { id: "cat_personale", name: "Cura Personale", icon: "💈", order: 5 }
  ];

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (!data.members) data.members = {};
      if (!data.categories || data.categories.length === 0) data.categories = defaultCategories;
      if (!data.spontaneous_tasks) data.spontaneous_tasks = [];
      if (!data.routine_tasks) data.routine_tasks = [];
      if (!data.assigned_tasks) data.assigned_tasks = [];
      if (!data.single_tasks) data.single_tasks = [];
      if (!data.logs) data.logs = [];
      if (!data.settings) {
        data.settings = {
          leaderboard_period_mode: "calendar",
          primary_score_display: "weekly"
        };
      }
      if (!data.settings.primary_score_display) data.settings.primary_score_display = "weekly";
      if (!data.settings.leaderboard_period_mode) data.settings.leaderboard_period_mode = "calendar";

      // Migrations for routine fields & priorities
      data.routine_tasks.forEach(r => {
        if (!r.category) r.category = "Pulizia & Casa";
        if (!r.priority) r.priority = "medium";
        if (!r.schedule_type) r.schedule_type = 'from_last';
        if (r.warning_days === undefined) r.warning_days = 1;
        if (!r.start_date) r.start_date = todayIso;
        if (r.is_personal === undefined) r.is_personal = false;
        if (r.is_personal) r.points = 0;
        if (!r.assigned_member) r.assigned_member = 'all';
      });

      // Migrations for spontaneous tasks
      data.spontaneous_tasks.forEach(s => {
        if (!s.category) s.category = "Generale";
        if (!s.priority) s.priority = "medium";
        if (s.is_personal === undefined) s.is_personal = false;
      });

      // Migrations for single tasks
      data.single_tasks.forEach(st => {
        if (!st.category) st.category = "Varie";
        if (!st.priority) st.priority = "medium";
        if (!st.notes) st.notes = [];
        if (!st.due_date) st.due_date = st.created_at ? st.created_at.split('T')[0] : todayIso;
      });

      // Ensure categories have clean sequential order without duplicate order numbers
      data.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      data.categories.forEach((c, idx) => { c.order = idx + 1; });

      return data;
    } catch (e) {
      console.error("Error reading database:", e);
    }
  }

  return {
    settings: {
      leaderboard_period_mode: "calendar",
      primary_score_display: "weekly"
    },
    members: {
      "m_1": { id: "m_1", name: "Papà", icon: "👨‍💻", color: "#3b82f6" },
      "m_2": { id: "m_2", name: "Mamma", icon: "👩‍🎨", color: "#ec4899" }
    },
    categories: defaultCategories,
    spontaneous_tasks: [
      { id: "s_1", name: "Fare la lavatrice", category: "Bucato & Panni", points: 15, icon: "🧺", priority: "medium", is_personal: false },
      { id: "s_2", name: "Lavare i piatti / Svuotare lavastoviglie", category: "Cucina & Spesa", points: 10, icon: "🍽️", priority: "medium", is_personal: false },
      { id: "s_3", name: "Preparare il pranzo / cena", category: "Cucina & Spesa", points: 20, icon: "🍳", priority: "medium", is_personal: false },
      { id: "s_4", name: "Portare fuori la spazzatura", category: "Pulizia & Casa", points: 10, icon: "🗑️", priority: "medium", is_personal: false },
      { id: "s_5", name: "Fare la spesa", category: "Cucina & Spesa", points: 25, icon: "🛒", priority: "medium", is_personal: false }
    ],
    routine_tasks: [
      { id: "r_1", name: "Cambio lenzuola", category: "Bucato & Panni", points: 25, frequency_days: 7, warning_days: 1, start_date: todayIso, schedule_type: "from_last", icon: "🛏️", priority: "medium", is_personal: false, assigned_member: "all" },
      { id: "r_2", name: "Aspirapolvere & Lavaggio pavimenti", category: "Pulizia & Casa", points: 30, frequency_days: 3, warning_days: 1, start_date: todayIso, schedule_type: "from_last", icon: "🧹", priority: "medium", is_personal: false, assigned_member: "all" },
      { id: "r_3", name: "Pulizia profonda bagno", category: "Pulizia & Casa", points: 35, frequency_days: 5, warning_days: 2, start_date: todayIso, schedule_type: "from_last", icon: "🧼", priority: "medium", is_personal: false, assigned_member: "all" },
      { id: "r_4", name: "Taglio capelli / Barbiere", category: "Cura Personale", points: 0, frequency_days: 21, warning_days: 3, start_date: todayIso, schedule_type: "from_last", icon: "💈", priority: "medium", is_personal: true, assigned_member: "Papà" }
    ],
    single_tasks: [],
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

// Calculate comprehensive period stats, diffs, categories and ADHD candidate weights
function calculateStats() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const periodMode = appData.settings?.leaderboard_period_mode || "calendar";
  const primaryDisplay = appData.settings?.primary_score_display || "weekly";

  let startDaily, startWeekly, startMonthly, startYearly;

  if (periodMode === "calendar") {
    startDaily = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = (now.getDay() + 6) % 7;
    startWeekly = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    startMonthly = new Date(now.getFullYear(), now.getMonth(), 1);
    startYearly = new Date(now.getFullYear(), 0, 1);
  } else {
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
      completed_single_tasks_count: 0,
      pending_single_tasks_count: 0,
      exclusive_single_tasks_count: 0,
      shared_single_tasks_count: 0,
      last_activity: null,
      badges: []
    };
  });

  // Calculate pending single tasks (exclusive vs shared)
  (appData.single_tasks || []).forEach(st => {
    if (st.status === 'pending') {
      const assignedList = Array.isArray(st.assigned_to) ? st.assigned_to : [st.assigned_to];
      const isShared = assignedList.includes('all') || assignedList.includes('Tutti') || assignedList.includes('Tutta la Famiglia') || assignedList.length > 1;

      Object.values(stats).forEach(m => {
        if (assignedList.includes(m.name) || assignedList.includes('all') || assignedList.includes('Tutti') || assignedList.includes('Tutta la Famiglia')) {
          m.pending_single_tasks_count += 1;
          if (isShared) {
            m.shared_single_tasks_count += 1;
          } else {
            m.exclusive_single_tasks_count += 1;
          }
        }
      });
    }
  });

  // Track task execution details (for spontaneous, routine and single tasks)
  const taskLastLogs = {};
  const memberLastLogs = {};

  (appData.logs || []).forEach(log => {
    const m = stats[log.member_id];
    if (m) {
      const pts = parseInt(log.points) || 0;
      const created = new Date(log.created_at);

      if (log.task_type === 'single_task') {
        m.completed_single_tasks_count += 1;
      }

      if (!log.is_personal && pts > 0) {
        m.total_points += pts;
        m.completed_count += 1;

        if (created >= startDaily) m.daily_points += pts;
        if (created >= startWeekly) m.weekly_points += pts;
        if (created >= startMonthly) m.monthly_points += pts;
        if (created >= startYearly) m.yearly_points += pts;
      }

      if (log.task_type !== 'task_note' && log.task_type !== 'task_deleted') {
        memberLastLogs[m.id] = log;
      }
    }

    if (log.task_name && log.task_type !== 'task_note' && log.task_type !== 'task_deleted') {
      taskLastLogs[log.task_name.toLowerCase()] = log;
    }
  });

  Object.keys(stats).forEach(mId => {
    stats[mId].last_activity = memberLastLogs[mId] || null;
  });

  const scoreKeyMap = {
    daily: "daily_points",
    weekly: "weekly_points",
    monthly: "monthly_points",
    yearly: "yearly_points",
    total: "total_points"
  };
  const activeSortKey = scoreKeyMap[primaryDisplay] || "weekly_points";

  const sorted = Object.values(stats).sort((a, b) => b[activeSortKey] - a[activeSortKey] || b.total_points - a.total_points);
  
  const leaderScore = sorted[0] ? sorted[0][activeSortKey] : 0;
  const leaderName = sorted[0] ? sorted[0].name : "-";

  sorted.forEach((m, idx) => {
    m.rank = idx + 1;
    m.is_leader = (idx === 0 && m[activeSortKey] > 0);

    if (idx === 0) {
      const runnerUpScore = sorted[1] ? sorted[1][activeSortKey] : 0;
      m.gap_text = sorted[1] ? `+${leaderScore - runnerUpScore} pt su ${sorted[1].name}` : `In testa`;
    } else {
      const diff = leaderScore - m[activeSortKey];
      m.gap_text = `-${diff} pt da ${leaderName}`;
    }

    if (m.rank === 1 && m[activeSortKey] > 0) m.badges.push({ name: "👑 In Testa" });
    if (m.completed_count >= 10) m.badges.push({ name: "⭐ Super Aiutante" });
    if (m.total_points >= 100) m.badges.push({ name: "🏆 Master della Casa" });
  });

  // Period Winners
  const getWinner = (key) => {
    const s = [...sorted].sort((a, b) => b[key] - a[key]);
    return s[0] && s[0][key] > 0 ? { name: s[0].name, icon: s[0].icon, points: s[0][key] } : null;
  };

  const winners = {
    daily: getWinner('daily_points'),
    weekly: getWinner('weekly_points'),
    monthly: getWinner('monthly_points'),
    yearly: getWinner('yearly_points'),
    total: getWinner('total_points')
  };

  // Enhance spontaneous tasks with last execution details & days ago
  const enhancedSpontaneousTasks = (appData.spontaneous_tasks || []).map(t => {
    const lastLog = taskLastLogs[t.name.toLowerCase()];
    let lastExecText = "Mai eseguita";
    let lastExecDays = 999;
    let lastPerformer = null;

    if (lastLog) {
      const logDate = new Date(lastLog.created_at);
      const daysAgo = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
      lastExecDays = daysAgo;
      lastPerformer = lastLog.member_name;
      if (daysAgo === 0) {
        lastExecText = `Oggi (${lastPerformer})`;
      } else if (daysAgo === 1) {
        lastExecText = `Ieri (${lastPerformer})`;
      } else {
        lastExecText = `${daysAgo}gg fa (${lastPerformer})`;
      }
    }

    return {
      ...t,
      last_executed_text: lastExecText,
      last_executed_days: lastExecDays,
      last_performer: lastPerformer,
      priority: t.priority || "medium"
    };
  });

  // Evaluate Routine Due Statuses & Next Due Dates
  const routineStatus = (appData.routine_tasks || []).map(r => {
    const freq = parseInt(r.frequency_days) || 7;
    const warning = parseInt(r.warning_days) || 1;
    let dueDate;
    if (r.schedule_type === 'from_last' && r.last_completed_at) {
      dueDate = new Date(new Date(r.last_completed_at).getTime() + (freq * 24 * 60 * 60 * 1000));
    } else if (r.start_date) {
      dueDate = new Date(r.start_date);
    } else {
      dueDate = new Date(now.getTime() + (freq * 24 * 60 * 60 * 1000));
    }

    const diffMs = dueDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status = "ok";
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
      status,
      priority: r.priority || "medium"
    };
  }).sort((a, b) => a.days_remaining - b.days_remaining);

  // Pending single tasks with date consideration
  const pendingSingleTasks = (appData.single_tasks || [])
    .filter(t => t.status === 'pending')
    .map(t => {
      const createdDate = new Date(t.created_at);
      const elapsedDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      
      let isFuture = false;
      let daysUntil = 0;

      if (t.due_date) {
        const dueDateObj = new Date(t.due_date + 'T23:59:59');
        const diffMs = dueDateObj - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (t.due_date > todayStr) {
          isFuture = true;
          daysUntil = diffDays;
        }
      }

      return {
        ...t,
        elapsed_days: elapsedDays,
        is_future: isFuture,
        days_until: daysUntil,
        status_symbol: isFuture ? '📅' : '⚠️',
        priority: t.priority || "medium",
        notes: t.notes || []
      };
    })
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  // Sort categories by clean sequential order
  const sortedCategories = [...(appData.categories || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return {
    members: stats,
    leaderboard: sorted,
    winners,
    categories: sortedCategories,
    pending_single_tasks: pendingSingleTasks,
    spontaneous_tasks: enhancedSpontaneousTasks,
    routine_tasks: routineStatus,
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

  for (const m of data.leaderboard) {
    const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const sensorUrl = `${haBase}/states/sensor.chorequest_${cleanName}_points`;
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
            pending_tasks_count: m.pending_single_tasks_count,
            shared_tasks_count: m.shared_single_tasks_count,
            exclusive_tasks_count: m.exclusive_single_tasks_count,
            completed_single_tasks_count: m.completed_single_tasks_count,
            rank: m.rank,
            gap: m.gap_text,
            badges: m.badges.map(b => b.name),
            last_activity: m.last_activity ? `${m.last_activity.task_name} (+${m.last_activity.points}pt)` : null,
            icon: "mdi:star-circle"
          }
        })
      });
    } catch (err) {}
  }

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
          overdue_routines: overdueList.map(r => ({ name: r.name, overdue_days: r.overdue_days, assigned_to: r.assigned_member })),
          warning_routines: warningList.map(r => ({ name: r.name, days_remaining: r.days_remaining, assigned_to: r.assigned_member })),
          icon: "mdi:clock-alert-outline"
        }
      })
    });
  } catch (err) {}

  try {
    await fetch(`${haBase}/states/sensor.chorequest_pending_tasks`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: String(data.pending_single_tasks.length),
        attributes: {
          friendly_name: "ChoreQuest: Task Singoli in Sospeso",
          pending_count: data.pending_single_tasks.length,
          tasks: data.pending_single_tasks.map(t => ({ title: t.title, assigned_to: t.assigned_to, elapsed_days: t.elapsed_days, due_date: t.due_date, is_future: t.is_future })),
          icon: "mdi:clipboard-alert-outline"
        }
      })
    });
  } catch (err) {}
}

syncToHomeAssistant();

// API: Stats & Data
app.get('/api/stats', (req, res) => {
  const statsData = calculateStats();
  res.json(statsData);
});

// API: Backup Download
app.get('/api/backup', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  res.setHeader('Content-Disposition', `attachment; filename="chorequest_backup_${dateStr}.json"`);
  res.send(JSON.stringify(appData, null, 2));
});

// API: Restore Backup
app.post('/api/restore', (req, res) => {
  const backupData = req.body;
  if (!backupData || !backupData.members) {
    return res.status(400).json({ error: "Backup file non valido o corrotto" });
  }

  appData = backupData;
  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "restored", message: "Database ripristinato con successo!" });
});

// API: Categories Management (CRUD & Order Move Up/Down)
app.post('/api/categories', (req, res) => {
  const { id, name, icon = "📁" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });

  const trimmedName = name.trim();
  const catId = id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  if (!appData.categories) appData.categories = [];
  const idx = appData.categories.findIndex(c => c.id === catId || c.name.toLowerCase() === trimmedName.toLowerCase());

  if (idx >= 0) {
    appData.categories[idx].name = trimmedName;
    appData.categories[idx].icon = icon;
  } else {
    const nextOrder = appData.categories.length + 1;
    appData.categories.push({
      id: catId,
      name: trimmedName,
      icon,
      order: nextOrder
    });
  }

  saveData(appData);
  res.json({ status: "saved", categories: appData.categories });
});

// Move category order Up or Down
app.post('/api/categories/reorder', (req, res) => {
  const { id, direction } = req.body; // direction: 'up' or 'down'
  if (!appData.categories) appData.categories = [];

  appData.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  const idx = appData.categories.findIndex(c => c.id === id);

  if (idx >= 0) {
    if (direction === 'up' && idx > 0) {
      const temp = appData.categories[idx];
      appData.categories[idx] = appData.categories[idx - 1];
      appData.categories[idx - 1] = temp;
    } else if (direction === 'down' && idx < appData.categories.length - 1) {
      const temp = appData.categories[idx];
      appData.categories[idx] = appData.categories[idx + 1];
      appData.categories[idx + 1] = temp;
    }
    // Reindex 1 to N
    appData.categories.forEach((c, i) => { c.order = i + 1; });
    saveData(appData);
  }

  res.json({ status: "reordered", categories: appData.categories });
});

app.post('/api/categories/delete', (req, res) => {
  const { id } = req.body;
  if (id) {
    appData.categories = (appData.categories || []).filter(c => c.id !== id);
    appData.categories.forEach((c, i) => { c.order = i + 1; });
    saveData(appData);
  }
  res.json({ status: "deleted" });
});

// API: Log Task (with priority)
app.post('/api/log', (req, res) => {
  const { member, members, task_name, points = 10, task_type = "spontaneous", category = "Generale", priority = "medium", is_personal = false, created_by = "Utente", task_created_at } = req.body;
  
  const targetMembers = Array.isArray(members) && members.length > 0 ? members : (member ? [member] : []);
  if (targetMembers.length === 0 || !task_name) return res.status(400).json({ error: "Missing parameters" });

  const totalPoints = is_personal ? 0 : (parseInt(points) || 0);
  const dividedPoints = is_personal ? 0 : Math.max(1, Math.round(totalPoints / targetMembers.length));

  const nowIso = new Date().toISOString();
  const createdLogs = [];

  targetMembers.forEach(mName => {
    let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === mName.toLowerCase());
    if (!memberObj) {
      const mId = `m_${Date.now()}`;
      memberObj = { id: mId, name: mName, icon: "👤", color: "#6366f1" };
      appData.members[mId] = memberObj;
    }

    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newLog = {
      id: logId,
      member_id: memberObj.id,
      member_name: memberObj.name,
      task_name,
      task_type,
      category: category || "Generale",
      priority: priority || "medium",
      created_by: created_by || "Utente",
      task_created_at: task_created_at || nowIso,
      is_personal: !!is_personal,
      points: dividedPoints,
      created_at: nowIso
    };
    appData.logs.push(newLog);
    createdLogs.push(newLog);
  });

  if (task_type === 'routine') {
    const rout = appData.routine_tasks.find(r => r.name.toLowerCase() === task_name.toLowerCase() || r.id === task_name);
    if (rout) {
      rout.last_completed_at = nowIso;
      rout.last_completed_by = targetMembers.join(', ');
    }
  }

  saveData(appData);
  syncToHomeAssistant();
  res.status(201).json(createdLogs);
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

// API: Single Task Create (with priority & category)
app.post('/api/single_tasks', (req, res) => {
  const { title, assigned_to = ["all"], points = 0, due_date, category = "Varie", priority = "medium", created_by = "Famiglia" } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Title required" });

  const assignedList = Array.isArray(assigned_to) ? assigned_to : [assigned_to];
  const nowIso = new Date().toISOString();
  const newTask = {
    id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title: title.trim(),
    assigned_to: assignedList.length > 0 ? assignedList : ["all"],
    points: parseInt(points) || 0,
    due_date: due_date || nowIso.split('T')[0],
    category: category || "Varie",
    priority: priority || "medium",
    created_by: created_by || "Famiglia",
    status: 'pending',
    notes: [],
    created_at: nowIso
  };

  if (!appData.single_tasks) appData.single_tasks = [];
  appData.single_tasks.push(newTask);

  saveData(appData);
  syncToHomeAssistant();
  res.status(201).json(newTask);
});

// API: Add Note & Update Date on Single Task
app.post('/api/single_tasks/note', (req, res) => {
  const { id, note_text, new_due_date, author = "Famiglia" } = req.body;
  const task = (appData.single_tasks || []).find(t => t.id === id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  const nowIso = new Date().toISOString();
  if (!task.notes) task.notes = [];

  let historyNoteDetails = [];

  if (note_text && note_text.trim()) {
    const newNote = {
      id: `n_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
      text: note_text.trim(),
      author: author || "Famiglia",
      created_at: nowIso
    };
    task.notes.push(newNote);
    historyNoteDetails.push(`Nota: "${note_text.trim()}"`);
  }

  if (new_due_date && new_due_date !== task.due_date) {
    const oldDate = task.due_date;
    task.due_date = new_due_date;
    historyNoteDetails.push(`Spostata data da ${oldDate} a ${new_due_date}`);
  }

  if (historyNoteDetails.length > 0) {
    let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === (author || '').toLowerCase());
    const mId = memberObj ? memberObj.id : Object.keys(appData.members)[0] || 'm_1';
    const mName = memberObj ? memberObj.name : (author || 'Famiglia');

    appData.logs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      member_id: mId,
      member_name: mName,
      task_name: `📝 ${task.title} - ${historyNoteDetails.join(' • ')}`,
      task_type: 'task_note',
      category: task.category || "Varie",
      created_by: mName,
      task_created_at: nowIso,
      is_personal: true,
      points: 0,
      created_at: nowIso
    });
  }

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "saved", task });
});

// API: Single Task Complete
app.post('/api/single_tasks/complete', (req, res) => {
  const { id, completed_by } = req.body;
  const task = (appData.single_tasks || []).find(t => t.id === id && t.status === 'pending');
  if (task) {
    const nowIso = new Date().toISOString();
    task.status = 'completed';
    task.completed_at = nowIso;
    task.completed_by = completed_by || 'Famiglia';

    const workerList = Array.isArray(completed_by) ? completed_by : [completed_by || 'Famiglia'];
    const totalPts = task.points || 0;
    const dividedPts = totalPts > 0 ? Math.max(1, Math.round(totalPts / workerList.length)) : 0;

    workerList.forEach(wName => {
      let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === wName.toLowerCase());
      if (memberObj) {
        appData.logs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          member_id: memberObj.id,
          member_name: memberObj.name,
          task_name: task.title,
          task_type: 'single_task',
          category: task.category || "Varie",
          created_by: task.created_by || "Famiglia",
          task_created_at: task.created_at || nowIso,
          is_personal: totalPts === 0,
          points: dividedPts,
          created_at: nowIso
        });
      }
    });

    saveData(appData);
    syncToHomeAssistant();
  }
  res.json({ status: "completed" });
});

// API: Single Task Delete with confirmation & audit log
app.post('/api/single_tasks/delete', (req, res) => {
  const { id, author = "Famiglia" } = req.body;
  const task = (appData.single_tasks || []).find(t => t.id === id);

  if (task) {
    const nowIso = new Date().toISOString();
    appData.single_tasks = appData.single_tasks.filter(t => t.id !== id);

    let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === (author || '').toLowerCase());
    const mId = memberObj ? memberObj.id : Object.keys(appData.members)[0] || 'm_1';
    const mName = memberObj ? memberObj.name : (author || 'Famiglia');

    appData.logs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      member_id: mId,
      member_name: mName,
      task_name: `🗑️ Eliminato task singolo: "${task.title}"`,
      task_type: 'task_deleted',
      category: task.category || "Varie",
      created_by: mName,
      task_created_at: task.created_at || nowIso,
      is_personal: true,
      points: 0,
      created_at: nowIso
    });

    saveData(appData);
    syncToHomeAssistant();
  }
  res.json({ status: "deleted" });
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
  const { id, name, points = 10, icon = "⚡", category = "Generale", priority = "medium", is_personal = false } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });

  const trimmedName = name.trim();
  const tId = id || `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const idx = appData.spontaneous_tasks.findIndex(t => t.id === tId || t.name.toLowerCase() === trimmedName.toLowerCase());
  const item = {
    id: tId,
    name: trimmedName,
    points: is_personal ? 0 : (parseInt(points) || 10),
    icon,
    category: category || "Generale",
    priority: priority || "medium",
    is_personal: !!is_personal
  };

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

// API: Save Routine Task (with Category & Priority)
app.post('/api/routine_tasks', (req, res) => {
  const { id, name, points = 20, frequency_days = 7, warning_days = 1, start_date, schedule_type = "from_last", icon = "🔄", category = "Routine", priority = "medium", is_personal = false, assigned_member = "all" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });

  const trimmedName = name.trim();
  const tId = id || `r_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const idx = appData.routine_tasks.findIndex(t => t.id === tId || t.name.toLowerCase() === trimmedName.toLowerCase());
  
  const existingItem = idx >= 0 ? appData.routine_tasks[idx] : {};
  const item = {
    ...existingItem,
    id: tId,
    name: trimmedName,
    points: is_personal ? 0 : (parseInt(points) || 20),
    frequency_days: parseInt(frequency_days) || 7,
    warning_days: parseInt(warning_days) || 1,
    start_date: start_date || existingItem.start_date || new Date().toISOString().split('T')[0],
    schedule_type: schedule_type || "from_last",
    icon,
    category: category || "Routine",
    priority: priority || "medium",
    is_personal: !!is_personal,
    assigned_member: assigned_member || "all"
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
  const { leaderboard_period_mode, primary_score_display } = req.body;
  if (!appData.settings) appData.settings = {};
  if (leaderboard_period_mode) appData.settings.leaderboard_period_mode = leaderboard_period_mode;
  if (primary_score_display) appData.settings.primary_score_display = primary_score_display;

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "saved", settings: appData.settings });
});

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 ChoreQuest Add-on server attivo su porta ${PORT}`);
});
