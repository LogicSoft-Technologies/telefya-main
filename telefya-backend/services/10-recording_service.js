const fs = require("fs/promises");
const path = require("path");

const RECORDINGS_DIR = process.env.RECORDINGS_DIR
  ? path.resolve(process.env.RECORDINGS_DIR)
  : path.join(process.cwd(), "recordings");

const VIDEO_EXTENSIONS = new Set([
  ".webm",
  ".mp4",
  ".mkv",
  ".mov",
]);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isManagedRecordingPath(filePath) {
  if (!filePath) return false;

  const resolvedDirectory = path.resolve(RECORDINGS_DIR);
  const resolvedFilePath = path.resolve(filePath);
  const relativePath = path.relative(
    resolvedDirectory,
    resolvedFilePath,
  );

  return Boolean(
    relativePath &&
      !relativePath.startsWith(`..${path.sep}`) &&
      relativePath !== ".." &&
      !path.isAbsolute(relativePath),
  );
}

function normalizeMeetingRecording(row) {
  return {
    id: row.id,
    recording_id: row.recording_id,
    room_id: row.room_id,
    meeting_id: row.meeting_id || null,
    host_user_id: row.host_user_id || null,
    title: row.title || row.room_id || "Telefya recording",
    status: row.status || "processing",
    file_name: row.file_name || null,
    file_path: null,
    mime_type: row.mime_type || "video/mp4",
    size_bytes: Number(row.size_bytes || 0),
    duration_seconds: Number(row.duration_seconds || 0),
    started_at: row.started_at || row.created_at || null,
    stopped_at: row.stopped_at || null,
    expires_at: row.expires_at || null,
    created_at: row.created_at || null,
  };
}

async function findRecordingFile(fileNameOrId) {
  if (!fileNameOrId || !(await pathExists(RECORDINGS_DIR))) {
    return null;
  }

  const files = await fs.readdir(RECORDINGS_DIR);

  const match = files.find((file) => {
    const extension = path.extname(file).toLowerCase();
    const id = path.parse(file).name;

    return (
      VIDEO_EXTENSIONS.has(extension) &&
      (id === fileNameOrId || file === fileNameOrId)
    );
  });

  if (!match) return null;

  const filePath = path.resolve(RECORDINGS_DIR, match);

  if (!isManagedRecordingPath(filePath)) {
    return null;
  }

  return {
    filePath,
    fileName: match,
  };
}

async function list_recordings_service(db_query, userId) {
  const rows = await db_query(
    `
      SELECT
        id,
        recording_id,
        room_id,
        meeting_id,
        host_user_id,
        title,
        CASE
          WHEN expires_at IS NOT NULL
            AND expires_at <= NOW()
            AND status = 'ready'
          THEN 'expired'
          ELSE status
        END AS status,
        file_name,
        mime_type,
        size_bytes,
        duration_seconds,
        started_at,
        stopped_at,
        expires_at,
        created_at
      FROM meeting_recordings
      WHERE host_user_id = ?
        AND status <> 'deleted'
      ORDER BY COALESCE(started_at, created_at) DESC
      LIMIT 200
    `,
    [userId],
  );

  return {
    success: true,
    message: "Recordings retrieved successfully.",
    data: (rows || []).map(normalizeMeetingRecording),
  };
}

async function get_recording_file_service(
  db_query,
  userId,
  recordingId,
) {
  const rows = await db_query(
    `
      SELECT
        recording_id,
        host_user_id,
        status,
        file_name,
        file_path,
        mime_type,
        expires_at
      FROM meeting_recordings
      WHERE recording_id = ?
        AND host_user_id = ?
        AND status = 'ready'
        AND (
          expires_at IS NULL OR expires_at > NOW()
        )
      LIMIT 1
    `,
    [recordingId, userId],
  );

  const row = rows?.[0];

  if (!row) {
    return null;
  }

  if (
    row.file_path &&
    isManagedRecordingPath(row.file_path) &&
    (await pathExists(row.file_path))
  ) {
    return {
      filePath: path.resolve(row.file_path),
      fileName: row.file_name || path.basename(row.file_path),
      mimeType: row.mime_type || "video/mp4",
    };
  }

  const fallbackFile = await findRecordingFile(
    row.file_name || recordingId,
  );

  if (!fallbackFile) {
    return null;
  }

  return {
    ...fallbackFile,
    mimeType: row.mime_type || "video/mp4",
  };
}

async function delete_recording_service(
  db_query,
  userId,
  recordingId,
) {
  const rows = await db_query(
    `
      SELECT recording_id, file_path
      FROM meeting_recordings
      WHERE recording_id = ?
        AND host_user_id = ?
        AND status <> 'deleted'
      LIMIT 1
    `,
    [recordingId, userId],
  );

  const row = rows?.[0];

  if (!row) {
    return {
      success: false,
      error: true,
      message: "Recording not found.",
    };
  }

  if (
    row.file_path &&
    isManagedRecordingPath(row.file_path) &&
    (await pathExists(row.file_path))
  ) {
    try {
      await fs.unlink(row.file_path);
    } catch (error) {
      console.error("[Recording] File deletion failed:", {
        recordingId,
        message: error?.message,
      });
    }
  }

  await db_query(
    `
      UPDATE meeting_recordings
      SET
        status = 'deleted',
        file_path = NULL
      WHERE recording_id = ?
        AND host_user_id = ?
    `,
    [recordingId, userId],
  );

  return {
    success: true,
    error: false,
    message: "Recording deleted successfully.",
  };
}

module.exports = {
  list_recordings_service,
  get_recording_file_service,
  delete_recording_service,
};