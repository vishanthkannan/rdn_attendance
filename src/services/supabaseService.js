import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

/**
 * Fetch all groups, workers, attendance records, and closed weeks from Supabase
 */
export async function fetchAllCloudData() {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [workersRes, attendanceRes, closedWeeksRes] = await Promise.all([
      supabase.from('workers').select('*').order('created_at', { ascending: true }),
      supabase.from('daily_attendance').select('*'),
      supabase.from('closed_weeks').select('*')
    ]);

    if (workersRes.error) throw workersRes.error;
    if (attendanceRes.error) throw attendanceRes.error;
    if (closedWeeksRes.error) throw closedWeeksRes.error;

    // Transform workers
    const masons = (workersRes.data || []).map((w) => ({
      id: w.id,
      groupId: w.group_id,
      groupName: w.group_name,
      name: w.name,
      category: w.category,
      wage: Number(w.wage) || 0
    }));

    // Transform attendance into { [weekKey]: { [workerId]: { [date]: { attendance, borrowed } } } }
    const attendance = {};
    (attendanceRes.data || []).forEach((row) => {
      const weekKey = row.week_start;
      const workerId = row.worker_id;
      const dateStr = row.attendance_date;

      if (!attendance[weekKey]) attendance[weekKey] = {};
      if (!attendance[weekKey][workerId]) attendance[weekKey][workerId] = {};

      attendance[weekKey][workerId][dateStr] = {
        attendance: Number(row.attendance) || 0,
        borrowed: Number(row.borrowed) || 0
      };
    });

    const closedWeeks = (closedWeeksRes.data || []).map((cw) => cw.week_id);

    return {
      masons,
      attendance,
      closedWeeks
    };
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to local data:', err);
    return null;
  }
}

/**
 * Upsert a single day's attendance / advance in Supabase
 */
export async function saveAttendanceCellCloud({ weekStart, workerId, attendanceDate, attendance, borrowed }) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase
      .from('daily_attendance')
      .upsert(
        {
          week_start: weekStart,
          worker_id: workerId,
          attendance_date: attendanceDate,
          attendance: Number(attendance) || 0,
          borrowed: Number(borrowed) || 0,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'worker_id,attendance_date' }
      );

    if (error) throw error;
  } catch (err) {
    console.error('Error saving attendance cell to Supabase:', err);
  }
}

/**
 * Save multiple days (whole week) in batch to Supabase
 */
export async function saveWholeWeekCloud({ weekStart, workerId, dayValues }) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const rows = Object.entries(dayValues).map(([dateStr, val]) => ({
      week_start: weekStart,
      worker_id: workerId,
      attendance_date: dateStr,
      attendance: Number(val.attendance) || 0,
      borrowed: Number(val.borrowed) || 0,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('daily_attendance')
      .upsert(rows, { onConflict: 'worker_id,attendance_date' });

    if (error) throw error;
  } catch (err) {
    console.error('Error saving whole week to Supabase:', err);
  }
}

/**
 * Add a new employee group with its 3 workers to Supabase
 */
export async function addEmployeeGroupCloud({ groupId, groupName, workers }) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // 1. Insert Group
    const { error: groupError } = await supabase
      .from('worker_groups')
      .upsert({ id: groupId, name: groupName }, { onConflict: 'id' });

    if (groupError) throw groupError;

    // 2. Insert Workers
    const workerRows = workers.map((w) => ({
      id: w.id,
      group_id: groupId,
      group_name: groupName,
      name: w.name,
      category: w.category,
      wage: Number(w.wage) || 0
    }));

    const { error: workerError } = await supabase
      .from('workers')
      .upsert(workerRows, { onConflict: 'id' });

    if (workerError) throw workerError;
  } catch (err) {
    console.error('Error adding employee group to Supabase:', err);
  }
}

/**
 * Update worker wage in Supabase
 */
export async function updateWorkerWageCloud(workerId, wage) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase
      .from('workers')
      .update({ wage: Number(wage) || 0 })
      .eq('id', workerId);

    if (error) throw error;
  } catch (err) {
    console.error('Error updating worker wage in Supabase:', err);
  }
}

/**
 * Delete an individual worker from Supabase
 */
export async function deleteWorkerCloud(workerId) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // Delete attendance rows first
    await supabase
      .from('daily_attendance')
      .delete()
      .eq('worker_id', workerId);

    // Delete worker record
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting worker in Supabase:', err);
  }
}

/**
 * Delete an entire group from Supabase (cascades to workers and attendance)
 */
export async function deleteGroupCloud(groupId) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // 1. Find all workers in this group
    const { data: groupWorkers } = await supabase
      .from('workers')
      .select('id')
      .eq('group_id', groupId);

    if (groupWorkers && groupWorkers.length > 0) {
      const workerIds = groupWorkers.map((w) => w.id);
      // Delete daily attendance for all workers in group
      await supabase
        .from('daily_attendance')
        .delete()
        .in('worker_id', workerIds);
    }

    // 2. Delete all workers in group
    await supabase
      .from('workers')
      .delete()
      .eq('group_id', groupId);

    // 3. Delete the group itself
    const { error } = await supabase
      .from('worker_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting group in Supabase:', err);
  }
}

/**
 * Toggle Week Closure in Supabase
 */
export async function toggleClosedWeekCloud(weekId, isClosed) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    if (isClosed) {
      const { error } = await supabase
        .from('closed_weeks')
        .upsert({ week_id: weekId }, { onConflict: 'week_id' });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('closed_weeks')
        .delete()
        .eq('week_id', weekId);
      if (error) throw error;
    }
  } catch (err) {
    console.error('Error toggling closed week in Supabase:', err);
  }
}

/**
 * Upload all current local state to Supabase (Initial Migration / Sync helper)
 */
export async function syncLocalDataToSupabase(masons, attendance, closedWeeks) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  }

  // 1. Collect unique groups
  const groupsMap = {};
  masons.forEach((w) => {
    const gId = w.groupId || `group-${w.groupName}`;
    groupsMap[gId] = { id: gId, name: w.groupName || w.name };
  });

  const groupRows = Object.values(groupsMap);
  const { error: gErr } = await supabase
    .from('worker_groups')
    .upsert(groupRows, { onConflict: 'id' });
  if (gErr) throw gErr;

  // 2. Upload Workers
  const workerRows = masons.map((w) => ({
    id: w.id,
    group_id: w.groupId || `group-${w.groupName}`,
    group_name: w.groupName || w.name,
    name: w.name,
    category: w.category || 'Worker',
    wage: Number(w.wage) || 0
  }));

  const { error: wErr } = await supabase
    .from('workers')
    .upsert(workerRows, { onConflict: 'id' });
  if (wErr) throw wErr;

  // 3. Upload Attendance Rows
  const attendanceRows = [];
  Object.keys(attendance).forEach((weekKey) => {
    const weekData = attendance[weekKey] || {};
    Object.keys(weekData).forEach((workerId) => {
      const workerDates = weekData[workerId] || {};
      Object.keys(workerDates).forEach((dateStr) => {
        const item = workerDates[dateStr];
        if (item && (item.attendance > 0 || item.borrowed > 0)) {
          attendanceRows.push({
            week_start: weekKey,
            worker_id: workerId,
            attendance_date: dateStr,
            attendance: Number(item.attendance) || 0,
            borrowed: Number(item.borrowed) || 0
          });
        }
      });
    });
  });

  if (attendanceRows.length > 0) {
    const { error: attErr } = await supabase
      .from('daily_attendance')
      .upsert(attendanceRows, { onConflict: 'worker_id,attendance_date' });
    if (attErr) throw attErr;
  }

  // 4. Upload Closed Weeks
  if (closedWeeks.length > 0) {
    const cwRows = closedWeeks.map((id) => ({ week_id: id }));
    const { error: cwErr } = await supabase
      .from('closed_weeks')
      .upsert(cwRows, { onConflict: 'week_id' });
    if (cwErr) throw cwErr;
  }

  return { success: true };
}

/**
 * Subscribe to realtime changes across workers, daily_attendance, worker_groups, and closed_weeks tables.
 * Enables instant multi-device live sync without requiring page refreshes.
 * Returns a cleanup function that unsubscribes when called.
 */
export function subscribeToRealtimeChanges({
  onAttendanceChange,
  onWorkerChange,
  onGroupChange,
  onClosedWeekChange
}) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('rdn-attendance-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'daily_attendance' },
      (payload) => {
        if (onAttendanceChange) onAttendanceChange(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'workers' },
      (payload) => {
        if (onWorkerChange) onWorkerChange(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'worker_groups' },
      (payload) => {
        if (onGroupChange) onGroupChange(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'closed_weeks' },
      (payload) => {
        if (onClosedWeekChange) onClosedWeekChange(payload);
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to live database changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Realtime] Channel error:', err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

