import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Storage helpers ────────────────────────────────────────────────────────────

const get = async (key) => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch { return []; }
};

const save = (key, data) => AsyncStorage.setItem(key, JSON.stringify(data));

const nextId = (items) =>
  items.length === 0 ? 1 : Math.max(...items.map(i => i.id)) + 1;

// ── Init ───────────────────────────────────────────────────────────────────────

export const initDB = async () => {
  if (!(await AsyncStorage.getItem('members')))   await save('members', []);
  if (!(await AsyncStorage.getItem('services')))  await save('services', []);
  if (!(await AsyncStorage.getItem('attendance'))) await save('attendance', []);
};

// ── Members ────────────────────────────────────────────────────────────────────

export const getMembers = async () => {
  const members = await get('members');
  return members
    .filter(m => m.is_active !== false)
    .sort((a, b) => a.last_name.localeCompare(b.last_name));
};

export const getMember = async (id) => {
  const members = await get('members');
  return members.find(m => m.id === id);
};

export const addMember = async (data) => {
  const members = await get('members');
  const member = { ...data, id: nextId(members), is_active: true };
  await save('members', [...members, member]);
  return member;
};

export const updateMember = async (id, data) => {
  const members = await get('members');
  await save('members', members.map(m => m.id === id ? { ...m, ...data } : m));
};

export const removeMember = async (id) => {
  const members = await get('members');
  await save('members', members.map(m => m.id === id ? { ...m, is_active: false } : m));
};

export const getMemberAttendance = async (member_id) => {
  const [attendance, services] = await Promise.all([get('attendance'), get('services')]);
  return attendance
    .filter(a => a.member_id === member_id)
    .map(a => ({ ...a, ...services.find(s => s.id === a.service_id) }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 20);
};

// ── Services ───────────────────────────────────────────────────────────────────

export const getServices = async () => {
  const services = await get('services');
  return services.sort((a, b) => b.date.localeCompare(a.date));
};

export const getService = async (id) => {
  const services = await get('services');
  return services.find(s => s.id === id);
};

export const addService = async (data) => {
  const services = await get('services');
  const serviceId = nextId(services);
  await save('services', [...services, { ...data, id: serviceId }]);

  const [members, attendance] = await Promise.all([get('members'), get('attendance')]);
  const activeMembers = members.filter(m => m.is_active !== false);
  let idCounter = attendance.length > 0 ? Math.max(...attendance.map(a => a.id)) + 1 : 1;
  const newRows = activeMembers.map(m => ({
    id: idCounter++,
    member_id: m.id,
    service_id: serviceId,
    present: false,
  }));
  await save('attendance', [...attendance, ...newRows]);
  return serviceId;
};

export const deleteService = async (id) => {
  const [services, attendance] = await Promise.all([get('services'), get('attendance')]);
  await save('services', services.filter(s => s.id !== id));
  await save('attendance', attendance.filter(a => a.service_id !== id));
};

// ── Attendance ─────────────────────────────────────────────────────────────────

export const getAttendance = async (service_id) => {
  const [attendance, members] = await Promise.all([get('attendance'), get('members')]);
  const activeIds = new Set(members.filter(m => m.is_active !== false).map(m => m.id));
  return attendance
    .filter(a => a.service_id === service_id && activeIds.has(a.member_id))
    .map(a => ({ ...a, ...members.find(m => m.id === a.member_id) }))
    .sort((a, b) => a.last_name.localeCompare(b.last_name));
};

export const saveAttendance = async (service_id, presentIds) => {
  const attendance = await get('attendance');
  await save(
    'attendance',
    attendance.map(a =>
      a.service_id === service_id ? { ...a, present: presentIds.has(a.member_id) } : a
    )
  );
};

// ── Dashboard / Reports ────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const [members, services, attendance] = await Promise.all([
    get('members'), get('services'), get('attendance'),
  ]);
  const activeMembers = members.filter(m => m.is_active !== false);
  const recent = services
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map(s => {
      const rows = attendance.filter(a => a.service_id === s.id);
      return { ...s, present_count: rows.filter(a => a.present).length, total_count: rows.length };
    });
  return { memberCount: activeMembers.length, serviceCount: services.length, recent };
};

export const getMemberStats = async () => {
  const [members, attendance] = await Promise.all([get('members'), get('attendance')]);
  return members
    .filter(m => m.is_active !== false)
    .map(m => {
      const rows = attendance.filter(a => a.member_id === m.id);
      return { ...m, total: rows.length, present: rows.filter(a => a.present).length };
    })
    .sort((a, b) => b.present - a.present);
};

export const getServiceStats = async () => {
  const [services, attendance] = await Promise.all([get('services'), get('attendance')]);
  return services
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .map(s => {
      const rows = attendance.filter(a => a.service_id === s.id);
      return { ...s, present_count: rows.filter(a => a.present).length, total_count: rows.length };
    });
};
