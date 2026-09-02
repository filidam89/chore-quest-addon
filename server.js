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

function getDefaultCategories() {
  return [
    { id: "cat_bucato", name: "Bucato & Panni", icon: "mdi:washing-machine", order: 1 },
    { id: "cat_cucina", name: "Cucina & Pasti", icon: "mdi:silverware-clean", order: 2 },
    { id: "cat_pulizia", name: "Pulizia & Casa", icon: "mdi:vacuum", order: 3 },
    { id: "cat_personale", name: "Cura Personale & Altro", icon: "mdi:content-cut", order: 4 }
  ];
}

function getDefaultSpontaneousTasks() {
  return [
    // Bucato & Panni
    { id: "s_lavatrice", name: "Lavatrice", category: "Bucato & Panni", points: 5, icon: "mdi:washing-machine", priority: "medium", is_personal: false },
    { id: "s_stendere", name: "Stendere", category: "Bucato & Panni", points: 10, icon: "mdi:tshirt-crew", priority: "medium", is_personal: false },
    { id: "s_ritirare", name: "Ritirare", category: "Bucato & Panni", points: 5, icon: "mdi:tshirt-crew-outline", priority: "medium", is_personal: false },
    { id: "s_panni_posto", name: "Panni a posto", category: "Bucato & Panni", points: 10, icon: "mdi:hanger", priority: "medium", is_personal: false },
    
    // Cucina & Pasti
    { id: "s_cucinare", name: "Cucinare", category: "Cucina & Pasti", points: 12, icon: "mdi:stove", priority: "medium", is_personal: false },
    { id: "s_piatti", name: "Piatti", category: "Cucina & Pasti", points: 12, icon: "mdi:silverware-clean", priority: "medium", is_personal: false },
    { id: "s_macchina_caffe", name: "Macchina Caffè", category: "Cucina & Pasti", points: 8, icon: "mdi:coffee-maker", priority: "medium", is_personal: false },
    { id: "s_spesa", name: "Spesa", category: "Cucina & Pasti", points: 8, icon: "mdi:cart", priority: "medium", is_personal: false },
    
    // Pulizia & Casa
    { id: "s_bagno", name: "Bagno", category: "Pulizia & Casa", points: 20, icon: "mdi:toilet", priority: "medium", is_personal: false },
    { id: "s_polvere", name: "Polvere", category: "Pulizia & Casa", points: 15, icon: "mdi:vacuum", priority: "medium", is_personal: false },
    { id: "s_spolverare", name: "Spolverare", category: "Pulizia & Casa", points: 10, icon: "mdi:feather", priority: "medium", is_personal: false },
    { id: "s_vetri", name: "Vetri", category: "Pulizia & Casa", points: 15, icon: "mdi:window-closed", priority: "medium", is_personal: false },
    { id: "s_letto", name: "Letto", category: "Pulizia & Casa", points: 10, icon: "mdi:bed", priority: "medium", is_personal: false }
  ];
}

function getDefaultRoutineTasks(todayIso) {
  return [
    { id: "r_lenzuola", name: "Cambio lenzuola", category: "Bucato & Panni", points: 25, frequency_number: 7, frequency_unit: "days", frequency_days: 7, warning_days: 1, start_date: todayIso, schedule_type: "from_last", icon: "mdi:bed", priority: "medium", is_personal: false, assigned_member: "all" },
    { id: "r_bagno_profondo", name: "Pulizia profonda bagno", category: "Pulizia & Casa", points: 35, frequency_number: 5, frequency_unit: "days", frequency_days: 5, warning_days: 2, start_date: todayIso, schedule_type: "from_last", icon: "mdi:toilet", priority: "medium", is_personal: false, assigned_member: "all" },
    { id: "r_pavimenti", name: "Aspirapolvere & Lavaggio pavimenti", category: "Pulizia & Casa", points: 30, frequency_number: 3, frequency_unit: "days", frequency_days: 3, warning_days: 1, start_date: todayIso, schedule_type: "from_last", icon: "mdi:vacuum", priority: "medium", is_personal: false, assigned_member: "all" },
    { id: "r_barbiere", name: "Taglio capelli / Barbiere", category: "Cura Personale & Altro", points: 0, frequency_number: 1, frequency_unit: "months", frequency_days: 30, warning_days: 3, start_date: todayIso, schedule_type: "from_last", icon: "mdi:content-cut", priority: "medium", is_personal: true, assigned_member: "Papà" }
  ];
}

function loadData() {
  const todayIso = new Date().toISOString().split('T')[0];
  const defaultCategories = getDefaultCategories();
  const defaultSpontaneous = getDefaultSpontaneousTasks();
  const defaultRoutines = getDefaultRoutineTasks(todayIso);

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (!data.members) data.members = {};
      if (!data.categories || data.categories.length === 0) data.categories = defaultCategories;
      if (!data.spontaneous_tasks || data.spontaneous_tasks.length === 0) data.spontaneous_tasks = defaultSpontaneous;
      if (!data.routine_tasks || data.routine_tasks.length === 0) data.routine_tasks = defaultRoutines;
      if (!data.assigned_tasks) data.assigned_tasks = [];
      if (!data.single_tasks) data.single_tasks = [];
      if (!data.logs) data.logs = [];
      if (!data.settings) {
        data.settings = {
          leaderboard_period_mode: "calendar",
          primary_score_display: "weekly",
          theme_mode: "auto"
        };
      }
      if (!data.settings.primary_score_display) data.settings.primary_score_display = "weekly";
      if (!data.settings.leaderboard_period_mode) data.settings.leaderboard_period_mode = "calendar";
      if (!data.settings.theme_mode) data.settings.theme_mode = "auto";

      // Non-destructive schema enhancements for routine fields & frequency units
      data.routine_tasks.forEach(r => {
        if (!r.category) r.category = "Pulizia & Casa";
        if (!r.priority) r.priority = "medium";
        if (!r.schedule_type) r.schedule_type = 'from_last';
        if (!r.frequency_unit) r.frequency_unit = 'days';
        if (!r.frequency_number) r.frequency_number = parseInt(r.frequency_days) || 7;
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
        if (!st.category) st.category = "Bucato & Panni";
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
      primary_score_display: "weekly",
      theme_mode: "auto"
    },
    members: {
      "m_1": { id: "m_1", name: "Papà", icon: "👨‍💻", color: "#3b82f6" },
      "m_2": { id: "m_2", name: "Mamma", icon: "👩‍🎨", color: "#ec4899" }
    },
    categories: defaultCategories,
    spontaneous_tasks: defaultSpontaneous,
    routine_tasks: defaultRoutines,
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

// Helper to calculate routine next due date considering days or months
function calculateRoutineDueDate(r, baseDate, now) {
  const freqUnit = r.frequency_unit || 'days';
  const freqNum = parseInt(r.frequency_number || r.frequency_days) || (freqUnit === 'months' ? 1 : 7);

  let dueDate;
  if (baseDate) {
    const start = new Date(baseDate);
    if (freqUnit === 'months') {
      dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + freqNum);
    } else {
      dueDate = new Date(start.getTime() + (freqNum * 24 * 60 * 60 * 1000));
    }
  } else {
    const start = new Date(now);
    if (freqUnit === 'months') {
      dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + freqNum);
    } else {
      dueDate = new Date(start.getTime() + (freqNum * 24 * 60 * 60 * 1000));
    }
  }
  return dueDate;
}

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
      member_pending_tasks: [],
      last_activity: null,
      badges: []
    };
  });

  // Calculate pending single tasks with breakdown per member
  (appData.single_tasks || []).forEach(st => {
    if (st.status === 'pending') {
      const assignedList = Array.isArray(st.assigned_to) ? st.assigned_to : [st.assigned_to];
      const isShared = assignedList.includes('all') || assignedList.includes('Tutti') || assignedList.includes('Tutta la Famiglia') || assignedList.length > 1;

      const createdDate = new Date(st.created_at || now);
      const elapsedDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      let isFuture = false;
      let daysUntil = 0;
      if (st.due_date) {
        const dueDateObj = new Date(st.due_date + 'T23:59:59');
        const diffDays = Math.ceil((dueDateObj - now) / (1000 * 60 * 60 * 24));
        if (st.due_date > todayStr) {
          isFuture = true;
          daysUntil = diffDays;
        }
      }

      const taskSummary = {
        id: st.id,
        title: st.title,
        due_date: st.due_date,
        points: st.points || 0,
        category: st.category || 'Varie',
        priority: st.priority || 'medium',
        is_future: isFuture,
        days_until: daysUntil,
        elapsed_days: elapsedDays,
        is_shared: isShared
      };

      Object.values(stats).forEach(m => {
        if (assignedList.includes(m.name) || assignedList.includes('all') || assignedList.includes('Tutti') || assignedList.includes('Tutta la Famiglia')) {
          m.pending_single_tasks_count += 1;
          m.member_pending_tasks.push(taskSummary);
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

  // Evaluate Routine Due Statuses & Next Due Dates (supporting Days & Months, and Postponed Dates)
  const routineStatus = (appData.routine_tasks || []).map(r => {
    const warning = parseInt(r.warning_days) || 1;
    const freqUnit = r.frequency_unit || 'days';
    const freqNum = parseInt(r.frequency_number || r.frequency_days) || (freqUnit === 'months' ? 1 : 7);

    let dueDate;
    if (r.postponed_due_date && new Date(r.postponed_due_date + 'T23:59:59') > now) {
      dueDate = new Date(r.postponed_due_date + 'T23:59:59');
    } else if (r.schedule_type === 'from_last' && r.last_completed_at) {
      dueDate = calculateRoutineDueDate(r, r.last_completed_at, now);
    } else if (r.start_date) {
      dueDate = new Date(r.start_date + 'T23:59:59');
    } else {
      dueDate = calculateRoutineDueDate(r, null, now);
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

    const freqText = (freqUnit === 'months') ? `${freqNum} ${freqNum === 1 ? 'mese' : 'mesi'}` : `${freqNum} gg`;

    return {
      ...r,
      due_date: dueDate.toISOString(),
      days_remaining: diffDays,
      overdue_days: overdueDays,
      frequency_text: freqText,
      status,
      priority: r.priority || "medium"
    };
  }).sort((a, b) => a.days_remaining - b.days_remaining);

  // Pending single tasks with date consideration
  const pendingSingleTasks = (appData.single_tasks || [])
    .filter(t => t.status === 'pending')
    .map(t => {
      const createdDate = new Date(t.created_at || now);
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

// Comprehensive Home Assistant Sensors Synchronization via Supervisor API
async function syncToHomeAssistant() {
  const supervisorToken = process.env.SUPERVISOR_TOKEN;
  if (!supervisorToken) return;

  const haBase = "http://supervisor/core/api";
  const data = calculateStats();

  const overdueList = data.routine_tasks.filter(r => r.status === 'overdue');
  const warningList = data.routine_tasks.filter(r => r.status === 'warning');
  const overdueCount = overdueList.length;
  const warningCount = warningList.length;
  const pendingCount = data.pending_single_tasks.length;
  const isAllDone = (overdueCount === 0);

  // 1. Individual Member Sensors (Points & Assigned Pending Tasks)
  for (const m of data.leaderboard) {
    const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Points Sensor
    try {
      await fetch(`${haBase}/states/sensor.chorequest_${cleanName}_points`, {
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
            gap: m.gap_text,
            badges: m.badges.map(b => b.name),
            last_activity: m.last_activity ? `${m.last_activity.task_name} (+${m.last_activity.points}pt)` : null,
            icon: "mdi:trophy-award"
          }
        })
      });
    } catch (err) {}

    // Assigned Pending Tasks Sensor
    try {
      await fetch(`${haBase}/states/sensor.chorequest_${cleanName}_pending_tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: String(m.pending_single_tasks_count),
          attributes: {
            friendly_name: `ChoreQuest: Task Sospesi ${m.name}`,
            pending_count: m.pending_single_tasks_count,
            exclusive_count: m.exclusive_single_tasks_count,
            shared_count: m.shared_single_tasks_count,
            tasks: m.member_pending_tasks || [],
            icon: "mdi:clipboard-check-outline"
          }
        })
      });
    } catch (err) {}
  }

  // 2. Leaderboard Sensor
  try {
    await fetch(`${haBase}/states/sensor.chorequest_leaderboard`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: data.leaderboard[0] ? data.leaderboard[0].name : "Nessuno",
        attributes: {
          friendly_name: "ChoreQuest: Classifica & Vincitori",
          leader: data.leaderboard[0]?.name || "-",
          daily_winner: data.winners.daily?.name || "-",
          weekly_winner: data.winners.weekly?.name || "-",
          monthly_winner: data.winners.monthly?.name || "-",
          yearly_winner: data.winners.yearly?.name || "-",
          leaderboard: data.leaderboard.map(m => ({ rank: m.rank, name: m.name, weekly_points: m.weekly_points, total_points: m.total_points })),
          icon: "mdi:podium-gold"
        }
      })
    });
  } catch (err) {}

  // 3. Due Routines Combined Sensor
  try {
    await fetch(`${haBase}/states/sensor.chorequest_due_routines`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: String(overdueCount + warningCount),
        attributes: {
          friendly_name: "ChoreQuest: Routine da Eseguire (Scadute + In Scadenza)",
          total_due: overdueCount + warningCount,
          overdue_count: overdueCount,
          warning_count: warningCount,
          overdue_routines: overdueList.map(r => ({ name: r.name, overdue_days: r.overdue_days, assigned_to: r.assigned_member, category: r.category })),
          warning_routines: warningList.map(r => ({ name: r.name, days_remaining: r.days_remaining, assigned_to: r.assigned_member, category: r.category })),
          icon: "mdi:clock-alert-outline"
        }
      })
    });
  } catch (err) {}

  // 4. Specifically Overdue Routines Sensor
  try {
    await fetch(`${haBase}/states/sensor.chorequest_overdue_routines`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: String(overdueCount),
        attributes: {
          friendly_name: "ChoreQuest: Routine Scadute",
          overdue_count: overdueCount,
          routines: overdueList.map(r => ({ name: r.name, overdue_days: r.overdue_days, points: r.points, assigned_to: r.assigned_member, category: r.category })),
          icon: "mdi:alert-circle-outline"
        }
      })
    });
  } catch (err) {}

  // 5. Warning Routines Sensor (Approaching Due Date)
  try {
    await fetch(`${haBase}/states/sensor.chorequest_warning_routines`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: String(warningCount),
        attributes: {
          friendly_name: "ChoreQuest: Routine in Scadenza",
          warning_count: warningCount,
          routines: warningList.map(r => ({ name: r.name, days_remaining: r.days_remaining, points: r.points, assigned_to: r.assigned_member, category: r.category })),
          icon: "mdi:clock-outline"
        }
      })
    });
  } catch (err) {}

  // 6. Global Pending Single Tasks Sensor
  try {
    await fetch(`${haBase}/states/sensor.chorequest_pending_tasks`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: String(pendingCount),
        attributes: {
          friendly_name: "ChoreQuest: Task Singoli in Sospeso",
          pending_count: pendingCount,
          tasks: data.pending_single_tasks.map(t => ({ title: t.title, assigned_to: t.assigned_to, elapsed_days: t.elapsed_days, due_date: t.due_date, is_future: t.is_future, category: t.category })),
          icon: "mdi:format-list-checks"
        }
      })
    });
  } catch (err) {}

  // 7. Binary Sensor: All Chores Done (No overdue activities!)
  try {
    await fetch(`${haBase}/states/binary_sensor.chorequest_all_chores_done`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: isAllDone ? "on" : "off",
        attributes: {
          friendly_name: "ChoreQuest: Tutto in Ordine (Nessuna Routine Scaduta)",
          is_clean: isAllDone,
          overdue_count: overdueCount,
          warning_count: warningCount,
          pending_tasks_count: pendingCount,
          icon: isAllDone ? "mdi:check-decagram" : "mdi:alert-decagram"
        }
      })
    });
  } catch (err) {}

  // 8. Binary Sensor: Has Overdue Chores
  try {
    await fetch(`${haBase}/states/binary_sensor.chorequest_has_overdue`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: (overdueCount > 0) ? "on" : "off",
        attributes: {
          friendly_name: "ChoreQuest: Presenza di Routine Scadute",
          device_class: "problem",
          overdue_count: overdueCount,
          icon: (overdueCount > 0) ? "mdi:alert-circle" : "mdi:check-circle"
        }
      })
    });
  } catch (err) {}

  // 9. Summary Status Sensor
  let summaryText = "Tutto in ordine";
  if (overdueCount > 0 && warningCount > 0) {
    summaryText = `${overdueCount} scadute, ${warningCount} in scadenza`;
  } else if (overdueCount > 0) {
    summaryText = `${overdueCount} routine scadute`;
  } else if (warningCount > 0) {
    summaryText = `${warningCount} routine in scadenza`;
  } else if (pendingCount > 0) {
    summaryText = `${pendingCount} task in sospeso`;
  }

  try {
    await fetch(`${haBase}/states/sensor.chorequest_summary`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supervisorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: summaryText,
        attributes: {
          friendly_name: "ChoreQuest: Riepilogo Casa",
          overdue_count: overdueCount,
          warning_count: warningCount,
          pending_tasks_count: pendingCount,
          leader: data.leaderboard[0]?.name || "-",
          icon: isAllDone ? "mdi:home-heart" : "mdi:home-alert"
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

// API: Reset to Defaults
app.post('/api/admin/reset_defaults', (req, res) => {
  const todayIso = new Date().toISOString().split('T')[0];
  appData.categories = getDefaultCategories();
  appData.spontaneous_tasks = getDefaultSpontaneousTasks();
  appData.routine_tasks = getDefaultRoutineTasks(todayIso);
  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "reset", message: "Attività e categorie ripristinate secondo configurazione predefinita!" });
});

// API: Categories Management (CRUD & Order Move Up/Down)
app.post('/api/categories', (req, res) => {
  const { id, name, icon = "mdi:folder" } = req.body;
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

// API: Log Task (with support for custom execution date and notes)
app.post('/api/log', (req, res) => {
  const { 
    member, 
    members, 
    task_name, 
    points = 10, 
    task_type = "spontaneous", 
    category = "Generale", 
    priority = "medium", 
    is_personal = false, 
    created_by = "Utente", 
    execution_date, 
    is_partial = false, 
    partial_pct = 100, 
    partial_note = "", 
    update_routine_schedule = true 
  } = req.body;
  
  const targetMembers = Array.isArray(members) && members.length > 0 ? members : (member ? [member] : []);
  if (targetMembers.length === 0 || !task_name) return res.status(400).json({ error: "Missing parameters" });

  const totalPoints = is_personal ? 0 : (parseInt(points) || 0);
  const dividedPoints = is_personal ? 0 : Math.max(1, Math.round(totalPoints / targetMembers.length));

  const nowIso = new Date().toISOString();
  const effectiveExecDate = execution_date ? new Date(execution_date).toISOString() : nowIso;
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
      task_created_at: nowIso,
      is_personal: !!is_personal,
      is_partial: !!is_partial,
      partial_pct: is_partial ? (parseInt(partial_pct) || 50) : null,
      partial_note: is_partial ? (partial_note || "") : null,
      points: dividedPoints,
      edit_history: [],
      created_at: effectiveExecDate
    };
    appData.logs.push(newLog);
    createdLogs.push(newLog);
  });

  if (task_type === 'routine' && update_routine_schedule !== false) {
    const rout = appData.routine_tasks.find(r => r.name.toLowerCase() === task_name.toLowerCase() || r.id === task_name);
    if (rout) {
      rout.last_completed_at = effectiveExecDate;
      rout.last_completed_by = targetMembers.join(', ');
      rout.postponed_due_date = null; // Clear any postponement when completed
    }
  }

  if (task_type === 'single_task' || req.body.task_id) {
    const sId = req.body.task_id;
    let sTask = null;
    if (sId) {
      sTask = (appData.single_tasks || []).find(t => t.id === sId && t.status === 'pending');
    }
    if (!sTask) {
      sTask = (appData.single_tasks || []).find(t => t.title.toLowerCase() === task_name.toLowerCase() && t.status === 'pending');
    }
    if (sTask) {
      sTask.status = 'completed';
      sTask.completed_at = effectiveExecDate;
      sTask.completed_by = targetMembers.join(', ');
    }
  }

  saveData(appData);
  syncToHomeAssistant();
  res.status(201).json(createdLogs);
});

// API: Update Log Entry with Audit Trail & Accurate Timestamp Comparison
app.post('/api/logs/update', (req, res) => {
  const { id, task_name, points, created_at, member_name, note = "", edited_by = "Famiglia" } = req.body;
  if (!id) return res.status(400).json({ error: "ID required" });

  const log = (appData.logs || []).find(l => l.id === id);
  if (!log) return res.status(404).json({ error: "Log not found" });

  if (!log.edit_history) log.edit_history = [];

  const changes = [];
  if (task_name && task_name.trim() !== log.task_name) {
    changes.push(`Attività: "${log.task_name}" ➔ "${task_name.trim()}"`);
    log.task_name = task_name.trim();
  }
  if (points !== undefined && parseInt(points) !== parseInt(log.points)) {
    changes.push(`Punti: ${log.points}pt ➔ ${points}pt`);
    log.points = parseInt(points) || 0;
  }
  if (created_at) {
    const newTime = new Date(created_at).getTime();
    const oldTime = new Date(log.created_at).getTime();
    // Only register change if difference is greater than 60 seconds
    if (!isNaN(newTime) && Math.abs(newTime - oldTime) > 60000) {
      changes.push(`Data esecuzione modificata`);
      log.created_at = new Date(created_at).toISOString();
    }
  }
  if (member_name && member_name !== log.member_name) {
    changes.push(`Esecutore: ${log.member_name} ➔ ${member_name}`);
    log.member_name = member_name;
    const mObj = Object.values(appData.members).find(m => m.name.toLowerCase() === member_name.toLowerCase());
    if (mObj) log.member_id = mObj.id;
  }

  if (changes.length > 0 || note.trim()) {
    log.edit_history.push({
      edited_at: new Date().toISOString(),
      edited_by: edited_by || "Famiglia",
      note: note.trim() || "Modifica dati attività",
      changes_summary: changes.join(', ') || "Aggiunta nota"
    });
  }

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "updated", log });
});

// API: Delete Log Entry (Undo) & Restore Routine Previous Due Date
app.post('/api/logs/delete', (req, res) => {
  const { id } = req.body;
  if (id) {
    const logToDelete = (appData.logs || []).find(l => l.id === id);
    if (logToDelete) {
      appData.logs = appData.logs.filter(l => l.id !== id);

      if (logToDelete.task_type === 'routine') {
        const rout = (appData.routine_tasks || []).find(r => r.name.toLowerCase() === logToDelete.task_name.toLowerCase() || r.id === logToDelete.task_name);
        if (rout) {
          // Look for previous completion of this routine in remaining logs
          const prevLog = [...appData.logs].reverse().find(l => l.task_type === 'routine' && (l.task_name.toLowerCase() === rout.name.toLowerCase() || l.task_name === rout.id));
          if (prevLog) {
            rout.last_completed_at = prevLog.created_at;
            rout.last_completed_by = prevLog.member_name;
          } else {
            rout.last_completed_at = null;
            rout.last_completed_by = null;
          }
        }
      }

      saveData(appData);
      syncToHomeAssistant();
    }
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
      edit_history: [],
      created_at: nowIso
    });
  }

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "saved", task });
});

// API: Single Task Split (Split subtask awards 0 pt, full points remain on the parent task)
app.post('/api/single_tasks/split', (req, res) => {
  const { 
    id, 
    completed_title, 
    completed_by = "Famiglia", 
    remaining_title, 
    author = "Famiglia"
  } = req.body;

  const task = (appData.single_tasks || []).find(t => t.id === id && t.status === 'pending');
  if (!task) return res.status(404).json({ error: "Task non trovato" });

  const nowIso = new Date().toISOString();
  const workerList = Array.isArray(completed_by) ? completed_by : [completed_by || 'Famiglia'];

  // 1. Log the completed sub-part with 0 points (points will be awarded when the parent task finishes)
  workerList.forEach(wName => {
    let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === wName.toLowerCase());
    if (!memberObj) {
      memberObj = Object.values(appData.members)[0];
    }
    if (memberObj) {
      appData.logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        member_id: memberObj.id,
        member_name: memberObj.name,
        task_name: completed_title || `${task.title} (completata parte)`,
        task_type: 'single_task',
        category: task.category || "Varie",
        created_by: task.created_by || "Famiglia",
        task_created_at: task.created_at || nowIso,
        is_personal: true,
        is_partial: true,
        partial_pct: null,
        partial_note: `Splittato da: "${task.title}". Rimane da fare: "${remaining_title}" (I punti matureranno al completamento)`,
        points: 0,
        edit_history: [],
        created_at: nowIso
      });
    }
  });

  // 2. Update remaining task in pending list (PRESERVES the full original points of the task)
  const oldTitle = task.title;
  task.title = remaining_title || `${oldTitle} (rimanente)`;
  if (!task.notes) task.notes = [];
  task.notes.push({
    id: `n_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
    text: `✂️ Task splittato: "${completed_title}" eseguito da ${workerList.join(', ')}. Rimane da fare: "${task.title}".`,
    author: author || "Famiglia",
    created_at: nowIso
  });

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "split_success", task });
});

// API: Single Task Complete (awards full points)
app.post('/api/single_tasks/complete', (req, res) => {
  const { id, completed_by, members, created_by, execution_date } = req.body;
  const task = (appData.single_tasks || []).find(t => t.id === id && t.status === 'pending');
  if (task) {
    const nowIso = new Date().toISOString();
    const effectiveExecDate = execution_date ? new Date(execution_date).toISOString() : nowIso;
    task.status = 'completed';
    task.completed_at = effectiveExecDate;

    const workerList = Array.isArray(members) && members.length > 0 
      ? members 
      : (Array.isArray(completed_by) ? completed_by : [completed_by || 'Famiglia']);

    task.completed_by = workerList.join(', ');

    let totalPts = task.points || 0;
    const dividedPts = totalPts > 0 ? Math.max(1, Math.round(totalPts / workerList.length)) : 0;

    workerList.forEach(wName => {
      let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === wName.toLowerCase());
      if (!memberObj) {
        const mId = `m_${Date.now()}`;
        memberObj = { id: mId, name: wName, icon: "👤", color: "#6366f1" };
        appData.members[mId] = memberObj;
      }
      appData.logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        member_id: memberObj.id,
        member_name: memberObj.name,
        task_name: task.title,
        task_type: 'single_task',
        category: task.category || "Varie",
        created_by: created_by || task.created_by || "Famiglia",
        task_created_at: task.created_at || nowIso,
        is_personal: totalPts === 0,
        is_partial: false,
        points: dividedPts,
        edit_history: [],
        created_at: effectiveExecDate
      });
    });

    saveData(appData);
    syncToHomeAssistant();
    return res.json({ status: "completed", task });
  }
  res.status(404).json({ error: "Task not found or already completed" });
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
      edit_history: [],
      created_at: nowIso
    });

    saveData(appData);
    syncToHomeAssistant();
  }
  res.json({ status: "deleted" });
});

// API: Postpone Routine Due Date
app.post('/api/routine_tasks/postpone', (req, res) => {
  const { id, new_due_date, reason = "", author = "Famiglia" } = req.body;
  const rout = (appData.routine_tasks || []).find(r => r.id === id || r.name.toLowerCase() === (id || '').toLowerCase());

  if (!rout) return res.status(404).json({ error: "Routine non trovata" });

  const nowIso = new Date().toISOString();
  rout.postponed_due_date = new_due_date;

  let memberObj = Object.values(appData.members).find(m => m.name.toLowerCase() === (author || '').toLowerCase());
  const mId = memberObj ? memberObj.id : Object.keys(appData.members)[0] || 'm_1';
  const mName = memberObj ? memberObj.name : (author || 'Famiglia');

  appData.logs.push({
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    member_id: mId,
    member_name: mName,
    task_name: `📅 Posticipata routine "${rout.name}" al ${new_due_date}${reason ? ' • Motivo: ' + reason : ''}`,
    task_type: 'task_note',
    category: rout.category || "Routine",
    created_by: mName,
    task_created_at: nowIso,
    is_personal: true,
    points: 0,
    edit_history: [],
    created_at: nowIso
  });

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "postponed", routine: rout });
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
  const { id, name, points = 10, icon = "mdi:lightning-bolt", category = "Pulizia & Casa", priority = "medium", is_personal = false } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });

  const trimmedName = name.trim();
  const tId = id || `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const idx = appData.spontaneous_tasks.findIndex(t => t.id === tId || t.name.toLowerCase() === trimmedName.toLowerCase());
  const item = {
    id: tId,
    name: trimmedName,
    points: is_personal ? 0 : (parseInt(points) || 10),
    icon,
    category: category || "Pulizia & Casa",
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

// API: Save Routine Task (with Days or Months frequency units)
app.post('/api/routine_tasks', (req, res) => {
  const { 
    id, 
    name, 
    points = 20, 
    frequency_number, 
    frequency_unit = "days", 
    frequency_days, 
    warning_days = 1, 
    start_date, 
    schedule_type = "from_last", 
    icon = "mdi:calendar-sync", 
    category = "Routine", 
    priority = "medium", 
    is_personal = false, 
    assigned_member = "all" 
  } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });

  const trimmedName = name.trim();
  const tId = id || `r_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const idx = appData.routine_tasks.findIndex(t => t.id === tId || t.name.toLowerCase() === trimmedName.toLowerCase());
  
  const freqNum = parseInt(frequency_number || frequency_days) || (frequency_unit === 'months' ? 1 : 7);
  const approxDays = (frequency_unit === 'months') ? (freqNum * 30) : freqNum;

  const existingItem = idx >= 0 ? appData.routine_tasks[idx] : {};
  const item = {
    ...existingItem,
    id: tId,
    name: trimmedName,
    points: is_personal ? 0 : (parseInt(points) || 20),
    frequency_number: freqNum,
    frequency_unit: frequency_unit || "days",
    frequency_days: approxDays,
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
  const { leaderboard_period_mode, primary_score_display, theme_mode } = req.body;
  if (!appData.settings) appData.settings = {};
  if (leaderboard_period_mode) appData.settings.leaderboard_period_mode = leaderboard_period_mode;
  if (primary_score_display) appData.settings.primary_score_display = primary_score_display;
  if (theme_mode) appData.settings.theme_mode = theme_mode;

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "saved", settings: appData.settings });
});

// API: Check for Updates via GitHub Raw Config
app.get('/api/system/check_update', async (req, res) => {
  const currentVersion = "2.6.4";
  try {
    const githubRes = await fetch("https://raw.githubusercontent.com/filidam89/chore-quest-addon/main/config.yaml");
    if (githubRes.ok) {
      const text = await githubRes.text();
      const match = text.match(/version:\s*["']?([^"'\r\n]+)["']?/);
      const remoteVersion = match ? match[1] : currentVersion;
      return res.json({
        current_version: currentVersion,
        remote_version: remoteVersion,
        update_available: remoteVersion !== currentVersion,
        checked_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Error checking updates:", err);
  }
  res.json({
    current_version: currentVersion,
    remote_version: currentVersion,
    update_available: false,
    checked_at: new Date().toISOString()
  });
});

// API: Get Current Logged-in Home Assistant User & Person entities
app.get('/api/current_user', async (req, res) => {
  const supervisorToken = process.env.SUPERVISOR_TOKEN;
  
  const clientProfileParam = req.query.client_profile || req.query.ha_profile || null;

  // Collect all possible headers from Ingress and proxies
  const haUserId = req.headers['x-hass-user-id'] || 
                   req.headers['x-remote-user-id'] || 
                   req.headers['x-ingress-user'] || 
                   req.headers['x-remote-user'] || 
                   req.headers['x-forwarded-user'] || 
                   req.headers['remote-user'] || 
                   req.headers['x-ha-user'] || 
                   req.query.ha_user || 
                   null;

  const rawHeaderName = req.headers['x-hass-user-name'] || 
                        req.headers['x-ha-username'] || 
                        req.headers['x-remote-user-name'] || 
                        req.headers['x-user-name'] || 
                        null;

  let haProfileName = clientProfileParam || null;
  let haUsername = rawHeaderName;
  let detectedPersons = [];

  if (supervisorToken) {
    try {
      // 1. Check person.* entities from Home Assistant states (attributes.friendly_name is the Profile Name)
      const statesRes = await fetch("http://supervisor/core/api/states", {
        headers: { 'Authorization': `Bearer ${supervisorToken}` }
      });
      if (statesRes.ok) {
        const states = await statesRes.json();
        const persons = states.filter(s => s.entity_id && s.entity_id.startsWith('person.'));
        detectedPersons = persons.map(p => ({
          entity_id: p.entity_id,
          name: p.attributes.friendly_name || p.entity_id.replace('person.', ''),
          user_id: p.attributes.user_id || null,
          picture: p.attributes.entity_picture || null
        }));

        // Search by user_id first (most accurate for logged-in profile)
        if (haUserId) {
          const matchedPerson = detectedPersons.find(p => p.user_id === haUserId);
          if (matchedPerson && matchedPerson.name) {
            haProfileName = matchedPerson.name;
          }
        }

        // If not matched by user_id, check if person entity_id or name matches rawHeaderName
        if (!haProfileName && rawHeaderName) {
          const matchedPerson = detectedPersons.find(p => 
            p.entity_id.toLowerCase() === `person.${rawHeaderName.toLowerCase()}` ||
            p.name.toLowerCase() === rawHeaderName.toLowerCase()
          );
          if (matchedPerson && matchedPerson.name) {
            haProfileName = matchedPerson.name;
          }
        }
      }

      // 2. Try supervisor auth/users if still not resolved
      if (!haProfileName && haUserId) {
        try {
          const authRes = await fetch("http://supervisor/auth", {
            headers: { 'Authorization': `Bearer ${supervisorToken}` }
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            const users = authData.data?.users || authData.users || [];
            const foundUser = users.find(u => u.id === haUserId || u.username === haUserId || u.username === rawHeaderName);
            if (foundUser) {
              haProfileName = foundUser.name || foundUser.display_name || foundUser.friendly_name || null;
              if (foundUser.username) haUsername = foundUser.username;
            }
          }
        } catch (e) {}
      }

      // 3. Try supervisor/users or supervisor/core/api/config
      if (!haProfileName && haUserId) {
        try {
          const usersRes = await fetch("http://supervisor/users", {
            headers: { 'Authorization': `Bearer ${supervisorToken}` }
          });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            const users = usersData.data?.users || usersData.users || [];
            const foundUser = users.find(u => u.id === haUserId || u.username === haUserId || u.username === rawHeaderName);
            if (foundUser) {
              haProfileName = foundUser.name || foundUser.display_name || foundUser.friendly_name || null;
              if (foundUser.username) haUsername = foundUser.username;
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error("Error detecting HA profile:", e);
    }
  }

  // Final fallback
  let finalProfileName = haProfileName;
  if (!finalProfileName && rawHeaderName) {
    finalProfileName = rawHeaderName.charAt(0).toUpperCase() + rawHeaderName.slice(1);
  } else if (!finalProfileName && haUserId && !/^[0-9a-f]{20,}$/i.test(haUserId)) {
    finalProfileName = haUserId.charAt(0).toUpperCase() + haUserId.slice(1);
  }

  res.json({
    ha_user_id: haUserId,
    ha_user_name: finalProfileName,
    ha_profile_name: finalProfileName,
    ha_username: haUsername,
    detected_persons: detectedPersons,
    members: Object.values(appData.members || {})
  });
});

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 ChoreQuest Add-on server attivo su porta ${PORT}`);
});
