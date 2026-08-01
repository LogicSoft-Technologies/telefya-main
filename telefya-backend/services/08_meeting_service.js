const cleanString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

function toMysqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function parseScheduledDate(value) {
  const date = new Date(cleanString(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error("Please provide a valid meeting date and time.");
  }

  if (date.getTime() < Date.now() - 60_000) {
    throw new Error("A meeting cannot be scheduled in the past.");
  }

  return date;
}

function getRoomId(meetingUrl) {
  const rawUrl = cleanString(meetingUrl);

  if (!rawUrl) {
    throw new Error("Meeting link is required.");
  }

  let pathname = rawUrl;

  try {
    pathname = new URL(rawUrl).pathname;
  } catch {
    pathname = rawUrl.split("?")[0];
  }

  const parts = pathname
    .split("/")
    .map((part) => decodeURIComponent(part).trim())
    .filter(Boolean);

  const liveIndex = parts.lastIndexOf("live");
  const roomId =
    liveIndex >= 0 ? parts[liveIndex + 1] : parts.at(-1);

  if (!/^[a-zA-Z0-9_-]{3,120}$/.test(roomId || "")) {
    throw new Error("Meeting link does not contain a valid room ID.");
  }

  return roomId;
}

const schedule_meeting_service = async (db_query, payload) => {
  const { date, timeZone, path, user_id, des } = payload;

  const userId = cleanString(user_id);
  const meetingUrl = cleanString(path);
  const meetingTimeZone = cleanString(timeZone);
  const description = cleanString(des, "Telefya meeting");

  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  if (!meetingTimeZone || !meetingUrl || !date) {
    throw new Error(
      "Timezone, date and meeting link are required.",
    );
  }

  const scheduledDate = parseScheduledDate(date);
  const roomId = getRoomId(meetingUrl);

  const meeting = {
    meeting_url: meetingUrl,
    room_id: roomId,
    time_zone: meetingTimeZone,
    scheduled_for: toMysqlDateTime(scheduledDate),
    shedular_user_id: userId,
    des: description,
    status: "upcoming",
    started_at: null,
    ended_at: null,
  };

  const result = await db_query(
    `
      INSERT INTO meeting_schedules
      (
        meeting_url,
        room_id,
        time_zone,
        scheduled_for,
        shedular_user_id,
        des,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      meeting.meeting_url,
      meeting.room_id,
      meeting.time_zone,
      meeting.scheduled_for,
      meeting.shedular_user_id,
      meeting.des,
      meeting.status,
    ],
  );

  if (!result.affectedRows) {
    throw new Error("Failed to schedule the meeting.");
  }

  return {
    success: true,
    error: false,
    message: "Meeting scheduled successfully.",
    data: {
      id: result.insertId,
      ...meeting,
    },
  };
};

const get_meeting_service = async (db_query, user_id) => {
  const userId = cleanString(user_id);

  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  const result = await db_query(
    `
      SELECT
        id,
        meeting_url,
        room_id,
        des,
        shedular_user_id,
        time_zone,
        scheduled_for,
        status,
        started_at,
        ended_at,
        created_at,
        updated_at
      FROM meeting_schedules
      WHERE shedular_user_id = ?
      ORDER BY
        CASE status
          WHEN 'upcoming' THEN 0
          WHEN 'live' THEN 1
          WHEN 'ended' THEN 2
          ELSE 3
        END ASC,
        scheduled_for ASC,
        created_at DESC
    `,
    [userId],
  );

  return {
    success: true,
    error: false,
    message: "Meetings retrieved successfully.",
    data: result,
  };
};

const normalizeMeetingIds = (payload) => {
  const ids = Array.isArray(payload)
    ? payload
    : payload?.meetingIds;

  if (!Array.isArray(ids)) return [];

  return [...new Set(ids)]
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const delete_meeting_service = async (
  db_query,
  user_id,
  payload,
) => {
  const userId = cleanString(user_id);
  const ids = normalizeMeetingIds(payload);

  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  if (!ids.length) {
    return {
      success: false,
      error: true,
      message: "Please provide meeting IDs.",
    };
  }

  const result = await db_query(
    `
      DELETE FROM meeting_schedules
      WHERE id IN (${ids.map(() => "?").join(", ")})
      AND shedular_user_id = ?
    `,
    [...ids, userId],
  );

  return {
    success: result.affectedRows > 0,
    error: result.affectedRows === 0,
    message:
      result.affectedRows > 0
        ? "Scheduled meeting deleted successfully."
        : "No matching meetings were deleted.",
  };
};

module.exports = {
  schedule_meeting_service,
  get_meeting_service,
  delete_meeting_service,
};