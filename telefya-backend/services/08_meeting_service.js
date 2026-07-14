const cleanString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const schedule_meeting_service = async (db_query, payload) => {
  const { date, timeZone, path, user_id, des } = payload;

  const userId = cleanString(user_id);
  const meetingUrl = cleanString(path);
  const meetingDate = cleanString(date);
  const meetingTimeZone = cleanString(timeZone);
  const description = cleanString(des, "Telefya meeting");

  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  if (!meetingTimeZone || !meetingUrl || !meetingDate) {
    throw new Error("Timezone, date and meeting url are required.");
  }

  const meeting = {
    meeting_url: meetingUrl,
    time_zone: `${meetingDate} ${meetingTimeZone}`,
    shedular_user_id: userId,
    des: description,
  };

  const query = `
    INSERT INTO meeting_schedules (meeting_url, time_zone, shedular_user_id, des)
    VALUES (?, ?, ?, ?)
  `;

  const result = await db_query(query, [
    meeting.meeting_url,
    meeting.time_zone,
    meeting.shedular_user_id,
    meeting.des,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("Failed to schedule the meeting.");
  }

  return {
    success: true,
    error: false,
    message: "Meeting scheduled successfully.",
    data: meeting,
  };
};

const get_meeting_service = async (db_query, user_id) => {
  const userId = cleanString(user_id);

  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  const query = `
    SELECT *
    FROM meeting_schedules
    WHERE shedular_user_id = ?
    ORDER BY created_at DESC
  `;

  const result = await db_query(query, [userId]);

  return {
    success: true,
    error: false,
    message: "Meetings retrieved successfully.",
    data: result,
  };
};

const normalizeMeetingIds = (payload) => {
  const ids = Array.isArray(payload) ? payload : payload?.meetingIds;

  if (!Array.isArray(ids)) return [];

  return [...new Set(ids)]
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const delete_meeting_service = async (db_query, user_id, payload) => {
  const userId = cleanString(user_id);
  const ids = normalizeMeetingIds(payload);

  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  if (ids.length === 0) {
    return {
      success: false,
      error: true,
      message: "Please provide meeting IDs.",
    };
  }

  const query = `
    DELETE FROM meeting_schedules
    WHERE id IN (${ids.map(() => "?").join(", ")})
    AND shedular_user_id = ?
  `;

  const result = await db_query(query, [...ids, userId]);

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