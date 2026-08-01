const {
  add_meeting_usage_service,
} = require("./14-billing_service");

async function findMeetingForRoom(db_query, roomId) {
  const rows = await db_query(
    `
      SELECT id, room_id, des, meeting_url, shedular_user_id
      FROM meeting_schedules
      WHERE room_id = ?
      LIMIT 1
    `,
    [roomId],
  );

  return rows?.[0] || null;
}

async function getAttendanceBillingRow(db_query, attendanceId) {
  if (!attendanceId) return null;

  const rows = await db_query(
    `
      SELECT
        a.id,
        a.room_id,
        a.meeting_id,
        a.user_id,
        a.joined_at,
        a.left_at,
        a.duration_minutes,
        m.shedular_user_id AS meeting_owner_id
      FROM meeting_attendance a
      LEFT JOIN meeting_schedules m
        ON m.id = a.meeting_id OR m.room_id = a.room_id
      WHERE a.id = ?
      LIMIT 1
    `,
    [attendanceId],
  );

  return rows?.[0] || null;
}

async function recordMeetingUsageForAttendance(db_query, attendanceId) {
  try {
    const attendance = await getAttendanceBillingRow(
      db_query,
      attendanceId,
    );

    if (!attendance) return;

    const durationMinutes = Number(attendance.duration_minutes || 0);
    const hostUserId = String(attendance.meeting_owner_id || "");
    const attendeeUserId = String(attendance.user_id || "");

    // Only the host's own attendance contributes to the host's plan usage.
    // Guest attendance must never multiply a host's used meeting minutes.
    if (
      durationMinutes <= 0 ||
      !hostUserId ||
      hostUserId !== attendeeUserId
    ) {
      return;
    }

    await add_meeting_usage_service(
      db_query,
      hostUserId,
      durationMinutes,
    );
  } catch (error) {
    console.error("[Analytics] Unable to record meeting usage:", {
      attendanceId,
      message: error?.message,
    });
  }
}

const start_attendance_service = async (db_query, data) => {
  const { roomId, userId, userName } = data;

  if (!roomId || !userId) return null;

  const meeting = await findMeetingForRoom(db_query, roomId);

  const openRows = await db_query(
    `
      SELECT id
      FROM meeting_attendance
      WHERE room_id = ?
        AND user_id = ?
        AND left_at IS NULL
    `,
    [roomId, userId],
  );

  await db_query(
    `
      UPDATE meeting_attendance
      SET
        left_at = NOW(),
        duration_minutes = GREATEST(
          TIMESTAMPDIFF(MINUTE, joined_at, NOW()),
          0
        )
      WHERE room_id = ?
        AND user_id = ?
        AND left_at IS NULL
    `,
    [roomId, userId],
  );

  for (const row of openRows || []) {
    await recordMeetingUsageForAttendance(db_query, row.id);
  }

  const result = await db_query(
    `
      INSERT INTO meeting_attendance
      (
        room_id,
        meeting_id,
        user_id,
        user_name,
        joined_at
      )
      VALUES (?, ?, ?, ?, NOW())
    `,
    [
      roomId,
      meeting?.id || null,
      userId,
      userName || "Telefya user",
    ],
  );

  return result.insertId;
};

const finish_attendance_service = async (db_query, data) => {
  const { attendanceId, roomId, userId } = data;

  if (attendanceId) {
    await db_query(
      `
        UPDATE meeting_attendance
        SET
          left_at = NOW(),
          duration_minutes = GREATEST(
            TIMESTAMPDIFF(MINUTE, joined_at, NOW()),
            0
          )
        WHERE id = ?
          AND left_at IS NULL
      `,
      [attendanceId],
    );

    await recordMeetingUsageForAttendance(db_query, attendanceId);
    return true;
  }

  if (!roomId || !userId) return false;

  const rows = await db_query(
    `
      SELECT id
      FROM meeting_attendance
      WHERE room_id = ?
        AND user_id = ?
        AND left_at IS NULL
      ORDER BY joined_at DESC
      LIMIT 1
    `,
    [roomId, userId],
  );

  const targetAttendanceId = rows?.[0]?.id || null;

  await db_query(
    `
      UPDATE meeting_attendance
      SET
        left_at = NOW(),
        duration_minutes = GREATEST(
          TIMESTAMPDIFF(MINUTE, joined_at, NOW()),
          0
        )
      WHERE room_id = ?
        AND user_id = ?
        AND left_at IS NULL
      ORDER BY joined_at DESC
      LIMIT 1
    `,
    [roomId, userId],
  );

  if (targetAttendanceId) {
    await recordMeetingUsageForAttendance(
      db_query,
      targetAttendanceId,
    );
  }

  return true;
};

const get_analytics_summary_service = async (db_query, userId) => {
  const meetings = await db_query(
    `
      SELECT COUNT(*) AS total_meetings
      FROM meeting_schedules
      WHERE shedular_user_id = ?
    `,
    [userId],
  );

  const attendance = await db_query(
    `
      SELECT
        COUNT(DISTINCT CASE
          WHEN a.user_id <> m.shedular_user_id THEN a.user_id
          ELSE NULL
        END) AS total_attendees,
        COALESCE(
          SUM(
            CASE
              WHEN a.user_id = m.shedular_user_id
              THEN a.duration_minutes
              ELSE 0
            END
          ),
          0
        ) AS total_minutes
      FROM meeting_schedules m
      LEFT JOIN meeting_attendance a
        ON a.meeting_id = m.id OR a.room_id = m.room_id
      WHERE m.shedular_user_id = ?
    `,
    [userId],
  );

  const recordings = await db_query(
    `
      SELECT COUNT(*) AS recordings
      FROM meeting_recordings
      WHERE host_user_id = ?
        AND status <> 'deleted'
    `,
    [userId],
  );

  return {
    success: true,
    message: "Analytics summary retrieved successfully.",
    data: {
      total_meetings: Number(meetings?.[0]?.total_meetings || 0),
      total_attendees: Number(attendance?.[0]?.total_attendees || 0),
      total_minutes: Number(attendance?.[0]?.total_minutes || 0),
      recordings: Number(recordings?.[0]?.recordings || 0),
    },
  };
};

const list_attendance_reports_service = async (db_query, userId) => {
  const rows = await db_query(
    `
      SELECT
        a.id,
        COALESCE(m.des, CONCAT('Room ', a.room_id)) AS meeting_title,
        a.user_name AS attendee_name,
        u.email AS attendee_email,
        a.joined_at,
        a.left_at,
        a.duration_minutes
      FROM meeting_schedules m
      INNER JOIN meeting_attendance a
        ON a.meeting_id = m.id OR a.room_id = m.room_id
      LEFT JOIN users u
        ON u.user_id = a.user_id
      WHERE m.shedular_user_id = ?
      ORDER BY a.joined_at DESC
      LIMIT 500
    `,
    [userId],
  );

  return {
    success: true,
    message: "Attendance reports retrieved successfully.",
    data: rows,
  };
};

module.exports = {
  start_attendance_service,
  finish_attendance_service,
  get_analytics_summary_service,
  list_attendance_reports_service,
};