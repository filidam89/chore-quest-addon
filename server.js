const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

// Universal fetch polyfill for Node.js environments lacking global fetch (e.g. Node < 18 on Alpine 3.16)
if (typeof fetch !== 'function' || typeof globalThis.fetch !== 'function') {
  function makeFetchPolyfill() {
    return function fetchPolyfill(input, init = {}, redirectCount = 0) {
      return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
          return reject(new Error('Too many redirects'));
        }
        try {
          const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : input.toString());
          const parsedUrl = new URL(urlStr);
          const isHttps = parsedUrl.protocol === 'https:';
          const client = isHttps ? https : http;

          const headers = { ...(init.headers || {}) };
          let body = init.body;
          if (body && typeof body === 'object' && !(body instanceof Buffer)) {
            body = JSON.stringify(body);
          }
          if (body && !headers['Content-Length'] && !headers['content-length']) {
            headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
          }

          const reqOptions = {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: (init.method || 'GET').toUpperCase(),
            headers: headers,
            timeout: init.timeout || 15000
          };

          const req = client.request(reqOptions, (res) => {
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
              const redirectUrl = new URL(res.headers.location, parsedUrl).toString();
              res.resume();
              return resolve(fetchPolyfill(redirectUrl, init, redirectCount + 1));
            }

            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
              const buffer = Buffer.concat(chunks);
              const textContent = buffer.toString('utf8');
              const ok = res.statusCode >= 200 && res.statusCode < 300;

              const responseObj = {
                ok,
                status: res.statusCode,
                statusText: res.statusMessage,
                headers: {
                  get(hName) {
                    return res.headers[hName.toLowerCase()];
                  }
                },
                text: async () => textContent,
                json: async () => {
                  try {
                    return JSON.parse(textContent);
                  } catch (e) {
                    throw new Error('JSON parse error: ' + e.message);
                  }
                }
              };
              resolve(responseObj);
            });
          });

          req.on('timeout', () => {
            req.destroy(new Error('Request timed out: ' + urlStr));
          });

          req.on('error', err => reject(err));
          if (body) req.write(body);
          req.end();
        } catch (err) {
          reject(err);
        }
      });
    };
  }

  const poly = makeFetchPolyfill();
  globalThis.fetch = poly;
  global.fetch = poly;
}

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
    { id: "r_lenzuola", name: "Cambio lenzuola", category: "Bucato & Panni", points: 25, frequency_number: 7, frequency_unit: "days", frequency_days: 7, warning_days: 1, start_date: todayIso, schedule_type: "from_last", icon: "mdi:bed", priority: "medium", is_personal: false, assigned_member: "all", notification_policy: "scadenza" },
    { id: "r_bagno_profondo", name: "Pulizia profonda bagno", category: "Pulizia & Casa", points: 35, frequency_number: 5, frequency_unit: "days", frequency_days: 5, warning_days: 2, start_date: todayIso, schedule_type: "from_last", icon: "mdi:toilet", priority: "medium", is_personal: false, assigned_member: "all", notification_policy: "scadenza" },
    { id: "r_pavimenti", name: "Aspirapolvere & Lavaggio pavimenti", category: "Pulizia & Casa", points: 30, frequency_number: 3, frequency_unit: "days", frequency_days: 3, warning_days: 1, start_date: todayIso, schedule_type: "from_last", icon: "mdi:vacuum", priority: "medium", is_personal: false, assigned_member: "all", notification_policy: "scadenza" },
    { id: "r_barbiere", name: "Taglio capelli / Barbiere", category: "Cura Personale & Altro", points: 0, frequency_number: 1, frequency_unit: "months", frequency_days: 30, warning_days: 3, start_date: todayIso, schedule_type: "from_last", icon: "mdi:content-cut", priority: "medium", is_personal: true, assigned_member: "Papà", notification_policy: "scadenza" }
  ];
}

function loadData() {
  const todayIso = new Date().toISOString().split('T')[0];
  const defaultCategories = getDefaultCategories();
  const defaultSpontaneous = getDefaultSpontaneousTasks();
  const defaultRoutines = getDefaultRoutineTasks(todayIso);

  const defaultNotificationsSettings = {
    enabled: true,
    default_service: "notify.notify",
    default_services: ["notify.notify"],
    custom_services: [],
    ha_url: "",
    ha_token: "",
    morning_reminder_enabled: true,
    morning_reminder_time: "08:30",
    evening_recap_enabled: true,
    evening_recap_time: "20:30",
    notify_on_task_assigned: true,
    notify_on_winner: true,
    channels: {
      urgent: "ChoreQuest_Urgent",
      reminders: "ChoreQuest_Reminders",
      general: "ChoreQuest_General"
    },
    member_services: {}, // legacy fallback
    members_config: {}, // { [mId]: { enabled: true, service: "", services: [], use_family_defaults: false, morning_reminder: true, evening_recap: true, urgent_alerts: true, task_assigned: true } }
    last_morning_date: null,
    last_evening_date: null
  };

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

      // Notifications settings migration
      if (!data.settings.notifications) {
        data.settings.notifications = { ...defaultNotificationsSettings };
      } else {
        if (data.settings.notifications.enabled === undefined) data.settings.notifications.enabled = true;
        if (data.settings.notifications.morning_reminder_enabled === undefined) data.settings.notifications.morning_reminder_enabled = (data.settings.notifications.daily_reminder_enabled !== false);
        if (!data.settings.notifications.morning_reminder_time) data.settings.notifications.morning_reminder_time = data.settings.notifications.reminder_time || "08:30";
        if (data.settings.notifications.evening_recap_enabled === undefined) data.settings.notifications.evening_recap_enabled = true;
        if (!data.settings.notifications.evening_recap_time) data.settings.notifications.evening_recap_time = "20:30";
        if (!data.settings.notifications.default_service) data.settings.notifications.default_service = "notify.notify";
        if (!Array.isArray(data.settings.notifications.default_services) || data.settings.notifications.default_services.length === 0) {
          data.settings.notifications.default_services = [data.settings.notifications.default_service || "notify.notify"];
        }
        if (!Array.isArray(data.settings.notifications.custom_services)) data.settings.notifications.custom_services = [];
        if (!data.settings.notifications.member_services) data.settings.notifications.member_services = {};
        if (!data.settings.notifications.members_config) data.settings.notifications.members_config = {};
        if (data.settings.notifications.notify_on_task_assigned === undefined) data.settings.notifications.notify_on_task_assigned = true;
        if (data.settings.notifications.notify_on_winner === undefined) data.settings.notifications.notify_on_winner = true;
        if (!data.settings.notifications.channels) {
          data.settings.notifications.channels = { ...defaultNotificationsSettings.channels };
        } else {
          if (!data.settings.notifications.channels.urgent) data.settings.notifications.channels.urgent = "ChoreQuest_Urgent";
          if (!data.settings.notifications.channels.reminders) data.settings.notifications.channels.reminders = "ChoreQuest_Reminders";
          if (!data.settings.notifications.channels.general) data.settings.notifications.channels.general = "ChoreQuest_General";
        }
      }

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
        if (!r.notification_policy) r.notification_policy = 'scadenza';
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
        if (!st.notification_policy) st.notification_policy = 'scadenza';
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
      theme_mode: "auto",
      notifications: defaultNotificationsSettings
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
        if (!memberLastLogs[m.id] || new Date(log.created_at).getTime() > new Date(memberLastLogs[m.id].created_at).getTime()) {
          memberLastLogs[m.id] = log;
        }
      }
    }

    if (log.task_name && log.task_type !== 'task_note' && log.task_type !== 'task_deleted') {
      const key = log.task_name.toLowerCase();
      if (!taskLastLogs[key] || new Date(log.created_at).getTime() > new Date(taskLastLogs[key].created_at).getTime()) {
        taskLastLogs[key] = log;
      }
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

// ==================== HOME ASSISTANT INTEGRATION HELPERS ====================

function getSupervisorToken() {
  if (process.env.SUPERVISOR_TOKEN && process.env.SUPERVISOR_TOKEN.trim()) {
    return process.env.SUPERVISOR_TOKEN.trim();
  }
  if (process.env.HASSIO_TOKEN && process.env.HASSIO_TOKEN.trim()) {
    return process.env.HASSIO_TOKEN.trim();
  }
  // Try reading directly from S6 container environment files
  try {
    const s6Paths = [
      '/run/s6/container_environment/SUPERVISOR_TOKEN',
      '/var/run/s6/container_environment/SUPERVISOR_TOKEN',
      '/run/s6-rc/container_environment/SUPERVISOR_TOKEN',
      '/run/s6/container_environment/HASSIO_TOKEN'
    ];
    for (const p of s6Paths) {
      if (fs.existsSync(p)) {
        const tok = fs.readFileSync(p, 'utf8').trim();
        if (tok) return tok;
      }
    }
  } catch (e) {
    // ignore
  }
  // Optional fallback: manual Long-Lived Access Token in settings
  if (appData?.settings?.notifications?.ha_token && appData.settings.notifications.ha_token.trim()) {
    return appData.settings.notifications.ha_token.trim();
  }
  return null;
}

function getHomeAssistantBaseUrl() {
  if (appData?.settings?.notifications?.ha_url && appData.settings.notifications.ha_url.trim()) {
    let u = appData.settings.notifications.ha_url.trim().replace(/\/+$/, '');
    if (!u.endsWith('/api')) u = `${u}/api`;
    return u;
  }
  return "http://supervisor/core/api";
}

function getHaHeaders(token = getSupervisorToken()) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Supervisor-Token'] = token;
  }
  return headers;
}

function getFamilyNotificationServices() {
  const notifSettings = appData?.settings?.notifications || {};
  if (Array.isArray(notifSettings.default_services) && notifSettings.default_services.length > 0) {
    const list = notifSettings.default_services.filter(s => s && s !== 'none' && s !== 'disabled');
    if (list.length > 0) return list;
  }
  if (notifSettings.default_service && notifSettings.default_service !== 'none' && notifSettings.default_service !== 'disabled') {
    return [notifSettings.default_service];
  }
  return ["notify.notify"];
}

function getMemberNotificationServices(memberId) {
  const notifSettings = appData?.settings?.notifications || {};
  const mCfg = notifSettings.members_config?.[memberId] || {};

  if (mCfg.use_family_defaults === true) {
    return getFamilyNotificationServices();
  }

  if (Array.isArray(mCfg.services) && mCfg.services.length > 0) {
    const list = mCfg.services.filter(s => s && s !== 'none' && s !== 'disabled');
    if (list.length > 0) return list;
  }

  if (mCfg.service && mCfg.service !== 'none' && mCfg.service !== 'disabled') {
    return [mCfg.service];
  }

  const legacySrv = notifSettings.member_services?.[memberId];
  if (legacySrv && legacySrv !== 'none' && legacySrv !== 'disabled') {
    return [legacySrv];
  }

  return getFamilyNotificationServices();
}

// Comprehensive Home Assistant Sensors Synchronization via Supervisor API
async function syncToHomeAssistant() {
  const supervisorToken = getSupervisorToken();
  if (!supervisorToken) return;

  const haBase = getHomeAssistantBaseUrl();
  const haHeaders = getHaHeaders(supervisorToken);
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

// ==================== HOME ASSISTANT NATIVE NOTIFICATIONS ENGINE ====================

// Invio a singolo servizio / entità Home Assistant
async function sendSingleHomeAssistantNotification({ service, title, message, channelType = 'general', extraData = {} }) {
  const supervisorToken = getSupervisorToken();
  const haBase = getHomeAssistantBaseUrl();
  const notifSettings = appData?.settings?.notifications || {};

  const targetService = (typeof service === 'string' && service.trim()) ? service.trim() : "notify.notify";
  if (!targetService || targetService === 'none' || targetService === 'disabled') {
    return { success: false, reason: "Servizio di notifica disattivato o non valido", target: targetService };
  }

  const channels = notifSettings.channels || {
    urgent: "ChoreQuest_Urgent",
    reminders: "ChoreQuest_Reminders",
    general: "ChoreQuest_General"
  };

  let channelName = channels.general || "ChoreQuest_General";
  let importance = "default";
  let priority = "high";
  let interruptionLevel = "active";

  if (channelType === 'urgent') {
    channelName = channels.urgent || "ChoreQuest_Urgent";
    importance = "high";
    priority = "high";
    interruptionLevel = "time-sensitive";
  } else if (channelType === 'reminders') {
    channelName = channels.reminders || "ChoreQuest_Reminders";
    importance = "default";
    priority = "default";
    interruptionLevel = "active";
  }

  const payload = {
    title: title || "ChoreQuest",
    message: message || "",
    data: {
      channel: channelName,
      importance: importance,
      priority: priority,
      ttl: 0,
      push: {
        "interruption-level": interruptionLevel
      },
      tag: extraData.tag || `chorequest_${channelType}`,
      group: "ChoreQuest",
      url: "/chorequest",
      clickAction: "/chorequest",
      ...extraData
    }
  };

  if (!supervisorToken) {
    console.log(`[Notification MOCK] Target: ${targetService} | Title: "${title}" | Message: "${message}" | Channel: ${channelName}`);
    return { success: true, mocked: true, target: targetService };
  }

  try {
    let srvName = targetService.trim();
    let url;
    let callPayload = { ...payload };

    if (srvName === 'notify.persistent_notification') {
      url = `${haBase}/services/persistent_notification/create`;
      callPayload.notification_id = extraData.tag || `chorequest_${Date.now()}`;
    } else if (srvName.startsWith('notify.')) {
      const subSrv = srvName.replace(/^notify\./, '');
      url = `${haBase}/services/notify/${subSrv}`;
    } else if (srvName.includes('.')) {
      const parts = srvName.split('.');
      url = `${haBase}/services/${parts[0]}/${parts[1]}`;
    } else {
      url = `${haBase}/services/notify/${srvName}`;
    }

    let response = await fetch(url, {
      method: 'POST',
      headers: getHaHeaders(supervisorToken),
      body: JSON.stringify(callPayload)
    });

    // Fallback: Se la chiamata diretta a /services/notify/<srv> fallisce con 400/404, prova con notify.send_message (modern HA entity platform)
    if (!response.ok && (response.status === 400 || response.status === 404) && srvName.startsWith('notify.')) {
      console.log(`[Notification Retry] Tentativo con notify.send_message per entità ${srvName}...`);
      const fallbackUrl = `${haBase}/services/notify/send_message`;
      const fallbackPayload = {
        target: {
          entity_id: srvName
        },
        title: payload.title,
        message: payload.message,
        data: payload.data
      };
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: getHaHeaders(supervisorToken),
        body: JSON.stringify(fallbackPayload)
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Notification ERROR] Target: ${targetService} - Status: ${response.status} - ${errText}`);
      return { success: false, error: errText, status: response.status, target: targetService };
    }

    console.log(`[Notification SENT] Target: ${targetService} (${channelName})`);
    return { success: true, target: targetService };
  } catch (err) {
    console.error(`[Notification EXCEPTION] Target: ${targetService}:`, err);
    return { success: false, error: err.message, target: targetService };
  }
}

// Invio a destinazioni multiple (array di servizi o singolo servizio)
async function sendHomeAssistantNotification({ service, title, message, channelType = 'general', extraData = {} }) {
  const notifSettings = appData?.settings?.notifications || {};
  if (notifSettings.enabled === false) {
    return { success: false, reason: "Notifiche disattivate nelle impostazioni" };
  }

  let targets = [];
  if (Array.isArray(service)) {
    targets = service.filter(s => s && s !== 'none' && s !== 'disabled');
  } else if (typeof service === 'string' && service.trim() && service !== 'none' && service !== 'disabled') {
    targets = [service.trim()];
  } else {
    targets = getFamilyNotificationServices();
  }

  if (targets.length === 0) {
    return { success: false, reason: "Nessun servizio di notifica valido selezionato" };
  }

  targets = Array.from(new Set(targets));

  const results = await Promise.all(targets.map(srv =>
    sendSingleHomeAssistantNotification({ service: srv, title, message, channelType, extraData })
  ));

  const anySuccess = results.some(r => r.success);
  return {
    success: anySuccess,
    targets: targets,
    results: results
  };
}

// 🌅 Promemoria Mattutino Programmato (Faccende di oggi & in scadenza)
async function checkAndSendDailyReminders() {
  const notifSettings = appData?.settings?.notifications;
  if (!notifSettings || notifSettings.enabled === false || notifSettings.morning_reminder_enabled === false) return;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const currentHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const targetTime = notifSettings.morning_reminder_time || notifSettings.reminder_time || "08:30";
  if (currentHHMM !== targetTime) return;
  if (notifSettings.last_morning_date === todayIso) return;

  console.log(`[Notification Scheduler] Inizio invio promemoria mattutino per ${todayIso} alle ${currentHHMM}...`);
  notifSettings.last_morning_date = todayIso;
  saveData(appData);

  const stats = calculateStats();
  const membersConfig = notifSettings.members_config || {};

  for (const m of Object.values(appData.members || {})) {
    const mCfg = membersConfig[m.id] || {};
    if (mCfg.enabled === false) continue; // utente ha disattivato notifiche
    if (mCfg.morning_reminder === false) continue; // utente ha disattivato promemoria mattutino

    const targetServices = getMemberNotificationServices(m.id);
    if (!targetServices || targetServices.length === 0) continue;

    // 1. Routine assegnate a questo membro o alla famiglia
    const memberRoutines = stats.routine_tasks.filter(r => {
      const isAssigned = (r.assigned_member === 'all' || r.assigned_member === m.name);
      if (!isAssigned) return false;
      const policy = r.notification_policy || 'scadenza';
      if (policy === 'nulla') return false;
      if (policy === 'scaduta') return r.status === 'overdue';
      if (policy === 'scadenza') return r.status === 'overdue' || r.days_remaining === 0;
      if (policy === 'preavviso') return r.status === 'overdue' || r.status === 'warning' || r.days_remaining <= (r.warning_days || 1);
      return false;
    });

    const overdueRoutines = memberRoutines.filter(r => r.status === 'overdue');
    const todayRoutines = memberRoutines.filter(r => r.days_remaining === 0);
    const warningRoutines = memberRoutines.filter(r => r.status === 'warning' && r.days_remaining > 0);

    // 2. Task singoli in sospeso assegnati a questo membro o famiglia
    const memberSingleTasks = stats.pending_single_tasks.filter(st => {
      const assignedList = Array.isArray(st.assigned_to) ? st.assigned_to : [st.assigned_to];
      const isAssigned = (assignedList.includes('all') || assignedList.includes('Tutti') || assignedList.includes('Tutta la Famiglia') || assignedList.includes(m.name));
      if (!isAssigned) return false;
      const policy = st.notification_policy || 'scadenza';
      if (policy === 'nulla') return false;
      if (policy === 'scaduta') return st.due_date && st.due_date < todayIso;
      if (policy === 'scadenza') return st.due_date && st.due_date <= todayIso;
      if (policy === 'preavviso') return !st.is_future || st.days_until <= 1;
      return false;
    });

    const overdueTasks = memberSingleTasks.filter(st => st.due_date && st.due_date < todayIso);
    const todayTasks = memberSingleTasks.filter(st => st.due_date === todayIso);
    const warningTasks = memberSingleTasks.filter(st => st.due_date && st.due_date > todayIso && st.days_until <= 1);

    // Invia avviso urgente per compiti scaduti se abilitato
    const totalOverdue = overdueRoutines.length + overdueTasks.length;
    if (totalOverdue > 0 && mCfg.urgent_alerts !== false) {
      const urgentNames = [
        ...overdueRoutines.map(r => `• ${r.name} (${r.overdue_days}gg fa, +${r.points}pt)`),
        ...overdueTasks.map(t => `• ${t.title} (+${t.points}pt)`)
      ].slice(0, 5);

      await sendHomeAssistantNotification({
        service: targetServices,
        title: `🚨 ChoreQuest: ${totalOverdue} Faccende Scadute!`,
        message: `Ciao ${m.name}, hai ${totalOverdue} attività scadute in attesa:\n${urgentNames.join('\n')}`,
        channelType: 'urgent',
        extraData: { tag: `chorequest_urgent_${m.id}` }
      });
    }

    // Invia promemoria del giorno (oggi & preavviso)
    const totalReminders = todayRoutines.length + todayTasks.length + warningRoutines.length + warningTasks.length;
    if (totalReminders > 0) {
      const reminderNames = [
        ...todayRoutines.map(r => `• ${r.name} (Oggi, +${r.points}pt)`),
        ...todayTasks.map(t => `• ${t.title} (Oggi, +${t.points}pt)`),
        ...warningRoutines.map(r => `• ${r.name} (tra ${r.days_remaining}gg)`),
        ...warningTasks.map(t => `• ${t.title} (tra ${t.days_until}gg)`)
      ].slice(0, 5);

      await sendHomeAssistantNotification({
        service: targetServices,
        title: `🌅 ChoreQuest: Buongiorno ${m.name}! (${totalReminders} attività)`,
        message: `Ecco le tue faccende in programma per oggi:\n${reminderNames.join('\n')}`,
        channelType: 'reminders',
        extraData: { tag: `chorequest_morning_${m.id}` }
      });
    }
  }
}

// 🌙 Riepilogo Serale Programmato (Punti fatti oggi, classifica e stato faccende)
async function checkAndSendEveningRecap() {
  const notifSettings = appData?.settings?.notifications;
  if (!notifSettings || notifSettings.enabled === false || notifSettings.evening_recap_enabled === false) return;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const currentHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const targetTime = notifSettings.evening_recap_time || "20:30";
  if (currentHHMM !== targetTime) return;
  if (notifSettings.last_evening_date === todayIso) return;

  console.log(`[Notification Scheduler] Inizio invio riepilogo serale per ${todayIso} alle ${currentHHMM}...`);
  notifSettings.last_evening_date = todayIso;
  saveData(appData);

  const stats = calculateStats();
  const membersConfig = notifSettings.members_config || {};

  // Calcola punti fatti oggi per ciascun membro dai logs
  const todayLogs = (appData.logs || []).filter(l => l.created_at && l.created_at.startsWith(todayIso));

  for (const m of Object.values(appData.members || {})) {
    const mCfg = membersConfig[m.id] || {};
    if (mCfg.enabled === false) continue;
    if (mCfg.evening_recap === false) continue;

    const targetServices = getMemberNotificationServices(m.id);
    if (!targetServices || targetServices.length === 0) continue;

    const mTodayLogs = todayLogs.filter(l => l.member_name === m.name && !l.is_personal && l.points > 0);
    const todayPts = mTodayLogs.reduce((acc, l) => acc + (parseInt(l.points) || 0), 0);
    const todayTasksCount = mTodayLogs.length;

    // Posizione e punti settimanali
    const memberStat = stats.members[m.id] || {};
    const weeklyPts = memberStat.weekly_points || 0;
    const rankIndex = stats.leaderboard.findIndex(item => item.id === m.id);
    const rank = rankIndex >= 0 ? rankIndex + 1 : 1;
    const rankMedal = (rank === 1) ? '🥇 1° posto' : (rank === 2) ? '🥈 2° posto' : (rank === 3) ? '🥉 3° posto' : `#${rank}`;

    // Attività rimaste in sospeso per questo membro
    const memberPendingTasks = stats.pending_single_tasks.filter(st => {
      const assigned = Array.isArray(st.assigned_to) ? st.assigned_to : [st.assigned_to];
      return assigned.includes('all') || assigned.includes(m.name);
    });
    const overdueRoutines = stats.routine_tasks.filter(r => (r.assigned_member === 'all' || r.assigned_member === m.name) && r.status === 'overdue');
    const totalRemaining = memberPendingTasks.length + overdueRoutines.length;

    let pointsMsg = "";
    if (todayTasksCount > 0) {
      pointsMsg = `✨ Oggi hai completato ${todayTasksCount} ${todayTasksCount === 1 ? 'attività' : 'attività'} guadagnando +${todayPts} pt!`;
    } else {
      pointsMsg = `💤 Nessuna attività registrata oggi.`;
    }

    let standingMsg = `🏆 Settimana: ${weeklyPts} pt (${rankMedal} in classifica)`;
    let houseMsg = (totalRemaining === 0) 
      ? `🎉 Tutto in ordine, nessuna faccenda in sospeso!` 
      : `⚠️ ${totalRemaining} ${totalRemaining === 1 ? 'attività rimasta' : 'attività rimaste'} in sospeso per domani.`;

    const recapMessage = `Ciao ${m.name}!\n${pointsMsg}\n${standingMsg}\n${houseMsg}`;

    await sendHomeAssistantNotification({
      service: targetServices,
      title: `🌙 ChoreQuest: Riepilogo Serale`,
      message: recapMessage,
      channelType: 'reminders',
      extraData: { tag: `chorequest_evening_${m.id}` }
    });
  }
}

// Scheduler: controllo ogni 30 secondi
setInterval(() => {
  checkAndSendDailyReminders().catch(e => console.error("Error in checkAndSendDailyReminders:", e));
  checkAndSendEveningRecap().catch(e => console.error("Error in checkAndSendEveningRecap:", e));
}, 30000);

// API: Rilevamento Completo e Robusto dei Servizi ed Entità Notifica Home Assistant
app.get('/api/notifications/services', async (req, res) => {
  const supervisorToken = getSupervisorToken();
  const haBase = getHomeAssistantBaseUrl();
  const discoveredMap = new Map();
  let connectedToHa = false;

  // 1. Servizi base sempre garantiti
  discoveredMap.set("notify.notify", {
    id: "notify.notify",
    name: "📢 Broadcast Famiglia (notify.notify - Tutti i telefoni)",
    icon: "📢",
    type: "broadcast"
  });
  discoveredMap.set("notify.persistent_notification", {
    id: "notify.persistent_notification",
    name: "💬 Notifica Persistente (Interfaccia Home Assistant)",
    icon: "💬",
    type: "system"
  });

  // 2. Includi servizi personalizzati salvati dall'utente nel DB
  const customServices = appData?.settings?.notifications?.custom_services || [];
  if (Array.isArray(customServices)) {
    customServices.forEach(cs => {
      if (cs && cs.id) {
        discoveredMap.set(cs.id, {
          id: cs.id,
          name: cs.name || `⚙️ ${cs.id}`,
          icon: "📱",
          type: "custom"
        });
      }
    });
  }

  // 3. Includi eventuali servizi già assegnati nei default o nei membri
  const defServices = appData?.settings?.notifications?.default_services || [];
  if (Array.isArray(defServices)) {
    defServices.forEach(s => {
      if (s && s !== 'none' && s !== 'disabled' && !discoveredMap.has(s)) {
        discoveredMap.set(s, {
          id: s,
          name: `📢 ${s}`,
          icon: "📢",
          type: "family_configured"
        });
      }
    });
  }

  const memberServices = appData?.settings?.notifications?.member_services || {};
  Object.values(memberServices).forEach(srv => {
    if (srv && srv !== 'none' && srv !== 'disabled' && !discoveredMap.has(srv)) {
      discoveredMap.set(srv, {
        id: srv,
        name: `📱 ${srv}`,
        icon: "📱",
        type: "configured"
      });
    }
  });

  const membersConfig = appData?.settings?.notifications?.members_config || {};
  Object.values(membersConfig).forEach(mCfg => {
    if (Array.isArray(mCfg.services)) {
      mCfg.services.forEach(srv => {
        if (srv && srv !== 'none' && srv !== 'disabled' && !discoveredMap.has(srv)) {
          discoveredMap.set(srv, {
            id: srv,
            name: `📱 ${srv}`,
            icon: "📱",
            type: "member_configured"
          });
        }
      });
    }
  });

  if (supervisorToken) {
    // 4. Scansione Entità Reali da /states (notify.*, device_tracker.*, sensor.*_battery_level, person.*)
    try {
      const statesRes = await fetch(`${haBase}/states`, {
        headers: getHaHeaders(supervisorToken)
      });
      if (statesRes.ok) {
        connectedToHa = true;
        const states = await statesRes.json();

        // 4a. Entità notify.*
        states.forEach(s => {
          if (s.entity_id && s.entity_id.startsWith('notify.')) {
            const friendly = s.attributes?.friendly_name || s.entity_id.replace('notify.', '');
            discoveredMap.set(s.entity_id, {
              id: s.entity_id,
              name: `📱 ${friendly} (${s.entity_id})`,
              icon: "📱",
              type: "entity"
            });
          }
        });

        // 4b. Dispositivi Mobile da device_tracker.* (Home Assistant Companion App)
        states.forEach(s => {
          if (s.entity_id && s.entity_id.startsWith('device_tracker.')) {
            const slug = s.entity_id.replace('device_tracker.', '');
            const targetNotifyService = `notify.mobile_app_${slug}`;
            const friendly = s.attributes?.friendly_name || slug.replace(/_/g, ' ');
            if (!discoveredMap.has(targetNotifyService)) {
              discoveredMap.set(targetNotifyService, {
                id: targetNotifyService,
                name: `📱 ${friendly} (${targetNotifyService})`,
                icon: "📱",
                type: "mobile_device"
              });
            }
          }
        });

        // 4c. Dispositivi Mobile da sensor.*_battery_level
        states.forEach(s => {
          if (s.entity_id && s.entity_id.startsWith('sensor.') && s.entity_id.endsWith('_battery_level')) {
            const devSlug = s.entity_id.replace('sensor.', '').replace('_battery_level', '');
            const targetNotifyService = `notify.mobile_app_${devSlug}`;
            let friendly = s.attributes?.friendly_name || devSlug;
            friendly = friendly.replace(/Livello batteria/i, '').replace(/Battery Level/i, '').trim() || devSlug;
            if (!discoveredMap.has(targetNotifyService)) {
              discoveredMap.set(targetNotifyService, {
                id: targetNotifyService,
                name: `📱 ${friendly} (${targetNotifyService})`,
                icon: "📱",
                type: "mobile_device"
              });
            }
          }
        });
      }
    } catch (e) {
      console.error("Error fetching notification states:", e);
    }

    // 5. Scansione Servizi Registrati sotto il dominio notify da /services
    try {
      const resp = await fetch(`${haBase}/services`, {
        headers: getHaHeaders(supervisorToken)
      });
      if (resp.ok) {
        connectedToHa = true;
        const domains = await resp.json();
        const notifyDomain = domains.find(d => d.domain === 'notify');
        if (notifyDomain && notifyDomain.services) {
          Object.entries(notifyDomain.services).forEach(([srvKey, srvInfo]) => {
            const fullId = `notify.${srvKey}`;
            const srvTitle = srvInfo?.name || srvKey.replace(/^mobile_app_/, '').replace(/_/g, ' ');
            const cleanTitle = srvTitle.charAt(0).toUpperCase() + srvTitle.slice(1);
            if (!discoveredMap.has(fullId)) {
              discoveredMap.set(fullId, {
                id: fullId,
                name: `📱 ${cleanTitle} (${fullId})`,
                icon: "📱",
                type: "service"
              });
            }
          });
        }
      }
    } catch (e) {
      console.error("Error discovering notify services:", e);
    }
  }

  const servicesList = Array.from(discoveredMap.values());

  res.json({
    connected_to_ha: connectedToHa,
    discovered_count: servicesList.length,
    services: servicesList,
    current_settings: appData?.settings?.notifications || {}
  });
});

// API: Diagnostica Connessione Home Assistant
app.get('/api/debug/ha', async (req, res) => {
  const token = getSupervisorToken();
  const haBase = getHomeAssistantBaseUrl();
  const envSuper = !!process.env.SUPERVISOR_TOKEN;
  const envHassio = !!process.env.HASSIO_TOKEN;
  let s6TokenFound = false;
  try {
    if (fs.existsSync('/run/s6/container_environment/SUPERVISOR_TOKEN') ||
        fs.existsSync('/var/run/s6/container_environment/SUPERVISOR_TOKEN') ||
        fs.existsSync('/run/s6-rc/container_environment/SUPERVISOR_TOKEN')) {
      s6TokenFound = true;
    }
  } catch (e) {}

  const debug = {
    has_token: !!token,
    token_preview: token ? `${token.substring(0, 6)}...${token.slice(-4)}` : null,
    sources: {
      env_SUPERVISOR_TOKEN: envSuper,
      env_HASSIO_TOKEN: envHassio,
      s6_container_env: s6TokenFound,
      custom_ha_token: !!appData?.settings?.notifications?.ha_token
    },
    ha_base_url: haBase,
    ha_states_ok: false,
    ha_services_ok: false,
    states_count: 0,
    notify_entities_found: [],
    notify_services_found: [],
    mobile_devices_found: [],
    errors: {}
  };

  if (token) {
    try {
      const statesRes = await fetch(`${haBase}/states`, { headers: getHaHeaders(token) });
      debug.ha_states_ok = statesRes.ok;
      debug.states_status = statesRes.status;
      if (statesRes.ok) {
        const states = await statesRes.json();
        debug.states_count = states.length;
        debug.notify_entities_found = states
          .filter(s => s.entity_id && s.entity_id.startsWith('notify.'))
          .map(s => ({ id: s.entity_id, name: s.attributes?.friendly_name || s.entity_id }));
        debug.mobile_devices_found = states
          .filter(s => s.entity_id && (s.entity_id.startsWith('device_tracker.') || (s.entity_id.startsWith('sensor.') && s.entity_id.endsWith('_battery_level'))))
          .map(s => ({ id: s.entity_id, name: s.attributes?.friendly_name || s.entity_id }))
          .slice(0, 15);
      } else {
        debug.errors.states = await statesRes.text();
      }
    } catch (e) {
      debug.errors.states = e.message;
    }

    try {
      const srvRes = await fetch(`${haBase}/services`, { headers: getHaHeaders(token) });
      debug.ha_services_ok = srvRes.ok;
      debug.services_status = srvRes.status;
      if (srvRes.ok) {
        const domains = await srvRes.json();
        const notifyDomain = domains.find(d => d.domain === 'notify');
        if (notifyDomain && notifyDomain.services) {
          debug.notify_services_found = Object.keys(notifyDomain.services).map(k => `notify.${k}`);
        }
      } else {
        debug.errors.services = await srvRes.text();
      }
    } catch (e) {
      debug.errors.services = e.message;
    }
  }

  res.json(debug);
});

// API: Aggiungi Servizio / Entità Notifica Personalizzata
app.post('/api/notifications/custom_service', (req, res) => {
  const { service_id, name } = req.body;
  if (!service_id || !service_id.trim()) return res.status(400).json({ error: "Service ID required" });

  let sId = service_id.trim();
  if (!sId.includes('.')) sId = `notify.${sId}`;

  if (!appData.settings) appData.settings = {};
  if (!appData.settings.notifications) appData.settings.notifications = {};
  if (!Array.isArray(appData.settings.notifications.custom_services)) {
    appData.settings.notifications.custom_services = [];
  }

  const existingIdx = appData.settings.notifications.custom_services.findIndex(s => s.id === sId);
  const sName = (name && name.trim()) ? name.trim() : `📱 ${sId}`;

  if (existingIdx >= 0) {
    appData.settings.notifications.custom_services[existingIdx].name = sName;
  } else {
    appData.settings.notifications.custom_services.push({ id: sId, name: sName });
  }

  saveData(appData);
  res.json({ status: "ok", custom_services: appData.settings.notifications.custom_services });
});

// API: Salvataggio Impostazioni Notifiche
app.post('/api/notifications/settings', (req, res) => {
  const newSettings = req.body;
  if (!appData.settings) appData.settings = {};
  if (!appData.settings.notifications) appData.settings.notifications = {};

  const existing = appData.settings.notifications;

  appData.settings.notifications = {
    ...existing,
    ...newSettings,
    channels: {
      ...existing.channels,
      ...(newSettings.channels || {})
    },
    members_config: {
      ...existing.members_config,
      ...(newSettings.members_config || {})
    },
    member_services: {
      ...existing.member_services,
      ...(newSettings.member_services || {})
    },
    default_services: Array.isArray(newSettings.default_services) && newSettings.default_services.length > 0 
      ? newSettings.default_services 
      : (existing.default_services || [newSettings.default_service || existing.default_service || "notify.notify"])
  };

  saveData(appData);
  syncToHomeAssistant();
  res.json({ status: "saved", notifications: appData.settings.notifications });
});

// API: Invio Notifica di Test Immediata (Supporta: family, member, o singolo servizio)
app.post('/api/notifications/test', async (req, res) => {
  const { service, target_type, member_id, channel_type, test_type, member_name, title, message } = req.body;

  let targetServices = [];
  if (target_type === 'family') {
    targetServices = getFamilyNotificationServices();
  } else if (target_type === 'member' && member_id) {
    targetServices = getMemberNotificationServices(member_id);
  } else if (service) {
    targetServices = Array.isArray(service) ? service : [service];
  } else {
    targetServices = getFamilyNotificationServices();
  }

  let finalTitle = title;
  let finalMessage = message;
  let finalChannel = channel_type || "urgent";

  if (test_type === 'evening_recap') {
    finalTitle = finalTitle || `🌙 ChoreQuest: Riepilogo Serale (Test)`;
    const mName = member_name || Object.values(appData.members || {})[0]?.name || "Filippo";
    finalMessage = finalMessage || `Ciao ${mName}!\n✨ Oggi hai completato 4 attività guadagnando +45 pt!\n🏆 Settimana: 120 pt (🥇 1° posto in classifica)\n🎉 Tutto in ordine, nessuna faccenda in sospeso!`;
    finalChannel = "reminders";
  } else if (test_type === 'morning_reminder') {
    finalTitle = finalTitle || `🌅 ChoreQuest: Buongiorno (Test)`;
    const mName = member_name || Object.values(appData.members || {})[0]?.name || "Filippo";
    finalMessage = finalMessage || `Ciao ${mName}, ecco le tue attività in programma per oggi:\n• Lavatrice (Oggi, +5pt)\n• Cambio lenzuola (Oggi, +25pt)`;
    finalChannel = "reminders";
  } else if (test_type === 'urgent') {
    finalTitle = finalTitle || `🚨 ChoreQuest: 2 Faccende Scadute! (Test)`;
    finalMessage = finalMessage || `Attenzione: ci sono 2 attività scadute da completare:\n• Pulizia profonda bagno (scaduta da 1gg, +35pt)\n• Aspirapolvere (scaduta da 2gg, +30pt)`;
    finalChannel = "urgent";
  } else {
    finalTitle = finalTitle || "ChoreQuest: Test Notifiche";
    finalMessage = finalMessage || "Questo è un messaggio di test da ChoreQuest! Canale configurato correttamente. 🏆";
  }

  const result = await sendHomeAssistantNotification({
    service: targetServices,
    title: finalTitle,
    message: finalMessage,
    channelType: finalChannel,
    extraData: { tag: `chorequest_test_${Date.now()}` }
  });
  res.json({ ...result, tested_services: targetServices, test_type, channel: finalChannel });
});

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

  const detailedChanges = [];
  const textChanges = [];

  if (task_name && task_name.trim() !== log.task_name) {
    detailedChanges.push({ type: 'task_name', old_val: log.task_name, new_val: task_name.trim() });
    textChanges.push(`Attività: "${log.task_name}" ➔ "${task_name.trim()}"`);
    log.task_name = task_name.trim();
  }
  if (points !== undefined && parseInt(points) !== parseInt(log.points)) {
    detailedChanges.push({ type: 'points', old_val: log.points, new_val: parseInt(points) || 0 });
    textChanges.push(`Punti: ${log.points}pt ➔ ${parseInt(points) || 0}pt`);
    log.points = parseInt(points) || 0;
  }
  if (created_at) {
    const newTime = new Date(created_at).getTime();
    const oldTime = new Date(log.created_at).getTime();
    // Only register change if difference is greater than 60 seconds
    if (!isNaN(newTime) && Math.abs(newTime - oldTime) > 60000) {
      detailedChanges.push({ type: 'date', old_val: log.created_at, new_val: new Date(created_at).toISOString() });
      textChanges.push(`Data esecuzione modificata`);
      log.created_at = new Date(created_at).toISOString();
    }
  }
  if (member_name && member_name !== log.member_name) {
    detailedChanges.push({ type: 'member_name', old_val: log.member_name, new_val: member_name });
    textChanges.push(`Esecutore: ${log.member_name} ➔ ${member_name}`);
    log.member_name = member_name;
    const mObj = Object.values(appData.members).find(m => m.name.toLowerCase() === member_name.toLowerCase());
    if (mObj) log.member_id = mObj.id;
  }

  if (detailedChanges.length > 0 || note.trim()) {
    log.edit_history.push({
      edited_at: new Date().toISOString(),
      edited_by: edited_by || "Famiglia",
      note: note.trim() || "Modifica dati attività",
      changes: detailedChanges,
      changes_summary: textChanges.join(', ') || "Aggiunta nota"
    });
  }

  // If this log is a routine, recalculate the routine's latest execution date & assignee
  if (log.task_type === 'routine') {
    const rout = (appData.routine_tasks || []).find(r => r.name.toLowerCase() === log.task_name.toLowerCase() || r.id === log.task_name);
    if (rout) {
      const routineLogs = (appData.logs || []).filter(l => l.task_type === 'routine' && (l.task_name.toLowerCase() === rout.name.toLowerCase() || l.task_name === rout.id));
      if (routineLogs.length > 0) {
        routineLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        rout.last_completed_at = routineLogs[0].created_at;
        rout.last_completed_by = routineLogs[0].member_name;
      }
    }
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

// API: Single Task Create (with priority, category & notification policy)
app.post('/api/single_tasks', (req, res) => {
  const { 
    title, 
    assigned_to = ["all"], 
    points = 0, 
    due_date, 
    category = "Varie", 
    priority = "medium", 
    created_by = "Famiglia", 
    notification_policy = "scadenza" 
  } = req.body;

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
    notification_policy: notification_policy || "scadenza",
    status: 'pending',
    notes: [],
    created_at: nowIso
  };

  if (!appData.single_tasks) appData.single_tasks = [];
  appData.single_tasks.push(newTask);

  saveData(appData);
  syncToHomeAssistant();

  // Instant notification on new task assignment
  const notifCfg = appData.settings?.notifications;
  if (notifCfg && notifCfg.enabled && notifCfg.notify_on_task_assigned && notification_policy !== 'nulla') {
    const isSharedAll = assignedList.includes('all') || assignedList.includes('Tutti') || assignedList.includes('Tutta la Famiglia');
    if (isSharedAll) {
      const familyServices = getFamilyNotificationServices();
      sendHomeAssistantNotification({
        service: familyServices,
        title: `📋 Nuovo Task Famiglia: ${newTask.title}`,
        message: `Assegnato a tutta la famiglia da ${newTask.created_by}. Scadenza: ${newTask.due_date}. Punti in palio: +${newTask.points}pt!`,
        channelType: 'general'
      }).catch(e => console.error("Error sending task notification:", e));
    } else {
      assignedList.forEach(mName => {
        const mObj = Object.values(appData.members || {}).find(m => m.name.toLowerCase() === mName.toLowerCase());
        const mCfg = (mObj && notifCfg.members_config?.[mObj.id]) ? notifCfg.members_config[mObj.id] : null;
        if (mCfg && (mCfg.enabled === false || mCfg.task_assigned === false)) return;
        const targetServices = mObj ? getMemberNotificationServices(mObj.id) : getFamilyNotificationServices();
        if (targetServices && targetServices.length > 0) {
          sendHomeAssistantNotification({
            service: targetServices,
            title: `📋 Nuovo Task Assegnato: ${newTask.title}`,
            message: `Ciao ${mName}, ti è stato assegnato un nuovo task da ${newTask.created_by}. Scadenza: ${newTask.due_date}. Punti: +${newTask.points}pt!`,
            channelType: 'general'
          }).catch(e => console.error("Error sending task notification:", e));
        }
      });
    }
  }

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

// API: Save Routine Task (with Days or Months frequency units & notification policy)
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
    assigned_member = "all",
    notification_policy = "scadenza"
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
    assigned_member: assigned_member || "all",
    notification_policy: notification_policy || existingItem.notification_policy || "scadenza"
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
  let currentVersion = "2.8.3";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    if (pkg.version) currentVersion = pkg.version;
  } catch (e) {}
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
  const supervisorToken = getSupervisorToken();
  const haBase = getHomeAssistantBaseUrl();
  
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
      const statesRes = await fetch(`${haBase}/states`, {
        headers: getHaHeaders(supervisorToken)
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
