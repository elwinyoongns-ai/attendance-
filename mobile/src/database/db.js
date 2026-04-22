import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('church.db');

export const initDB = async () => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      group_name TEXT,
      joined_date TEXT DEFAULT (date('now')),
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL DEFAULT 'Sunday Service',
      date TEXT NOT NULL,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      present INTEGER DEFAULT 0,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      UNIQUE(member_id, service_id)
    );
  `);
};

// ── Members ────────────────────────────────────────────────────────────────────

export const getMembers = () =>
  db.getAllAsync('SELECT * FROM members WHERE is_active = 1 ORDER BY last_name, first_name');

export const getMember = (id) =>
  db.getFirstAsync('SELECT * FROM members WHERE id = ?', [id]);

export const addMember = (data) =>
  db.runAsync(
    'INSERT INTO members (first_name, last_name, email, phone, group_name, joined_date) VALUES (?, ?, ?, ?, ?, ?)',
    [data.first_name, data.last_name, data.email || null, data.phone || null, data.group_name || null, data.joined_date]
  );

export const updateMember = (id, data) =>
  db.runAsync(
    'UPDATE members SET first_name=?, last_name=?, email=?, phone=?, group_name=?, joined_date=? WHERE id=?',
    [data.first_name, data.last_name, data.email || null, data.phone || null, data.group_name || null, data.joined_date, id]
  );

export const removeMember = (id) =>
  db.runAsync('UPDATE members SET is_active = 0 WHERE id = ?', [id]);

export const getMemberAttendance = (member_id) =>
  db.getAllAsync(
    `SELECT a.present, s.name, s.date, s.service_type
     FROM attendance a JOIN services s ON a.service_id = s.id
     WHERE a.member_id = ? ORDER BY s.date DESC LIMIT 20`,
    [member_id]
  );

// ── Services ───────────────────────────────────────────────────────────────────

export const getServices = () =>
  db.getAllAsync('SELECT * FROM services ORDER BY date DESC');

export const getService = (id) =>
  db.getFirstAsync('SELECT * FROM services WHERE id = ?', [id]);

export const addService = async (data) => {
  const result = await db.runAsync(
    'INSERT INTO services (name, service_type, date, notes) VALUES (?, ?, ?, ?)',
    [data.name, data.service_type, data.date, data.notes || null]
  );
  const members = await db.getAllAsync('SELECT id FROM members WHERE is_active = 1');
  for (const m of members) {
    await db.runAsync(
      'INSERT OR IGNORE INTO attendance (member_id, service_id, present) VALUES (?, ?, 0)',
      [m.id, result.lastInsertRowId]
    );
  }
  return result.lastInsertRowId;
};

export const deleteService = async (id) => {
  await db.runAsync('DELETE FROM attendance WHERE service_id = ?', [id]);
  await db.runAsync('DELETE FROM services WHERE id = ?', [id]);
};

// ── Attendance ─────────────────────────────────────────────────────────────────

export const getAttendance = (service_id) =>
  db.getAllAsync(
    `SELECT a.member_id, a.present, m.first_name, m.last_name, m.group_name
     FROM attendance a JOIN members m ON a.member_id = m.id
     WHERE a.service_id = ? AND m.is_active = 1
     ORDER BY m.last_name, m.first_name`,
    [service_id]
  );

export const saveAttendance = async (service_id, presentIds) => {
  const rows = await db.getAllAsync(
    'SELECT member_id FROM attendance WHERE service_id = ?', [service_id]
  );
  for (const row of rows) {
    await db.runAsync(
      'UPDATE attendance SET present = ? WHERE member_id = ? AND service_id = ?',
      [presentIds.has(row.member_id) ? 1 : 0, row.member_id, service_id]
    );
  }
};

// ── Dashboard / Reports ────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const members = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM members WHERE is_active = 1'
  );
  const services = await db.getFirstAsync('SELECT COUNT(*) as count FROM services');
  const recent = await db.getAllAsync(
    `SELECT s.name, s.date, s.service_type,
     COUNT(CASE WHEN a.present = 1 THEN 1 END) as present_count,
     COUNT(a.id) as total_count
     FROM services s LEFT JOIN attendance a ON s.id = a.service_id
     GROUP BY s.id ORDER BY s.date DESC LIMIT 5`
  );
  return { memberCount: members.count, serviceCount: services.count, recent };
};

export const getMemberStats = () =>
  db.getAllAsync(
    `SELECT m.id, m.first_name, m.last_name, m.group_name,
     COUNT(a.id) as total,
     SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) as present
     FROM members m LEFT JOIN attendance a ON m.id = a.member_id
     WHERE m.is_active = 1
     GROUP BY m.id ORDER BY present DESC`
  );

export const getServiceStats = () =>
  db.getAllAsync(
    `SELECT s.name, s.date,
     COUNT(CASE WHEN a.present = 1 THEN 1 END) as present_count,
     COUNT(a.id) as total_count
     FROM services s LEFT JOIN attendance a ON s.id = a.service_id
     GROUP BY s.id ORDER BY s.date DESC LIMIT 10`
  );
