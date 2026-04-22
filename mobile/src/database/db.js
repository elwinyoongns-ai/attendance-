import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('church.db');

// Promise wrapper around executeSql
const sql = (query, params = []) =>
  new Promise((resolve, reject) =>
    db.transaction(
      tx => tx.executeSql(query, params, (_, res) => resolve(res), (_, err) => { reject(err); return false; }),
      reject
    )
  );

const rows = (res) => res.rows._array;

export const initDB = async () => {
  await sql(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    group_name TEXT,
    joined_date TEXT DEFAULT (date('now')),
    is_active INTEGER DEFAULT 1
  )`);
  await sql(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'Sunday Service',
    date TEXT NOT NULL,
    notes TEXT
  )`);
  await sql(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    present INTEGER DEFAULT 0,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    UNIQUE(member_id, service_id)
  )`);
};

// ── Members ────────────────────────────────────────────────────────────────────

export const getMembers = async () =>
  rows(await sql('SELECT * FROM members WHERE is_active = 1 ORDER BY last_name, first_name'));

export const getMember = async (id) =>
  rows(await sql('SELECT * FROM members WHERE id = ?', [id]))[0];

export const addMember = (data) =>
  sql(
    'INSERT INTO members (first_name, last_name, email, phone, group_name, joined_date) VALUES (?, ?, ?, ?, ?, ?)',
    [data.first_name, data.last_name, data.email || null, data.phone || null, data.group_name || null, data.joined_date]
  );

export const updateMember = (id, data) =>
  sql(
    'UPDATE members SET first_name=?, last_name=?, email=?, phone=?, group_name=?, joined_date=? WHERE id=?',
    [data.first_name, data.last_name, data.email || null, data.phone || null, data.group_name || null, data.joined_date, id]
  );

export const removeMember = (id) =>
  sql('UPDATE members SET is_active = 0 WHERE id = ?', [id]);

export const getMemberAttendance = async (member_id) =>
  rows(await sql(
    `SELECT a.present, s.name, s.date, s.service_type
     FROM attendance a JOIN services s ON a.service_id = s.id
     WHERE a.member_id = ? ORDER BY s.date DESC LIMIT 20`,
    [member_id]
  ));

// ── Services ───────────────────────────────────────────────────────────────────

export const getServices = async () =>
  rows(await sql('SELECT * FROM services ORDER BY date DESC'));

export const getService = async (id) =>
  rows(await sql('SELECT * FROM services WHERE id = ?', [id]))[0];

export const addService = async (data) => {
  const res = await sql(
    'INSERT INTO services (name, service_type, date, notes) VALUES (?, ?, ?, ?)',
    [data.name, data.service_type, data.date, data.notes || null]
  );
  const serviceId = res.insertId;
  const members = rows(await sql('SELECT id FROM members WHERE is_active = 1'));
  for (const m of members) {
    await sql(
      'INSERT OR IGNORE INTO attendance (member_id, service_id, present) VALUES (?, ?, 0)',
      [m.id, serviceId]
    );
  }
  return serviceId;
};

export const deleteService = async (id) => {
  await sql('DELETE FROM attendance WHERE service_id = ?', [id]);
  await sql('DELETE FROM services WHERE id = ?', [id]);
};

// ── Attendance ─────────────────────────────────────────────────────────────────

export const getAttendance = async (service_id) =>
  rows(await sql(
    `SELECT a.member_id, a.present, m.first_name, m.last_name, m.group_name
     FROM attendance a JOIN members m ON a.member_id = m.id
     WHERE a.service_id = ? AND m.is_active = 1
     ORDER BY m.last_name, m.first_name`,
    [service_id]
  ));

export const saveAttendance = async (service_id, presentIds) => {
  const records = rows(await sql('SELECT member_id FROM attendance WHERE service_id = ?', [service_id]));
  for (const row of records) {
    await sql(
      'UPDATE attendance SET present = ? WHERE member_id = ? AND service_id = ?',
      [presentIds.has(row.member_id) ? 1 : 0, row.member_id, service_id]
    );
  }
};

// ── Dashboard / Reports ────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const memberRes = await sql('SELECT COUNT(*) as count FROM members WHERE is_active = 1');
  const serviceRes = await sql('SELECT COUNT(*) as count FROM services');
  const recent = rows(await sql(
    `SELECT s.name, s.date, s.service_type,
     COUNT(CASE WHEN a.present = 1 THEN 1 END) as present_count,
     COUNT(a.id) as total_count
     FROM services s LEFT JOIN attendance a ON s.id = a.service_id
     GROUP BY s.id ORDER BY s.date DESC LIMIT 5`
  ));
  return {
    memberCount: rows(memberRes)[0].count,
    serviceCount: rows(serviceRes)[0].count,
    recent,
  };
};

export const getMemberStats = async () =>
  rows(await sql(
    `SELECT m.id, m.first_name, m.last_name, m.group_name,
     COUNT(a.id) as total,
     SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) as present
     FROM members m LEFT JOIN attendance a ON m.id = a.member_id
     WHERE m.is_active = 1
     GROUP BY m.id ORDER BY present DESC`
  ));

export const getServiceStats = async () =>
  rows(await sql(
    `SELECT s.name, s.date,
     COUNT(CASE WHEN a.present = 1 THEN 1 END) as present_count,
     COUNT(a.id) as total_count
     FROM services s LEFT JOIN attendance a ON s.id = a.service_id
     GROUP BY s.id ORDER BY s.date DESC LIMIT 10`
  ));
