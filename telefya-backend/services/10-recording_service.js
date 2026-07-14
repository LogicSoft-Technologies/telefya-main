const fs = require("fs/promises");
const path = require("path");

const RECORDINGS_DIR = process.env.RECORDINGS_DIR
  ? path.resolve(process.env.RECORDINGS_DIR)
  : path.join(process.cwd(), "recordings");

const VIDEO_EXTENSIONS = new Set([".webm", ".mp4", ".mkv", ".mov"]);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
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
    file_path: row.file_path || null,
    mime_type: row.mime_type || "video/mp4",
    size_bytes: row.size_bytes || 0,
    duration_seconds: row.duration_seconds || 0,
    started_at: row.started_at || row.created_at || null,
    stopped_at: row.stopped_at || null,
    expires_at: row.expires_at || null,
    created_at: row.created_at || null,
  };
}

async function listRecordingFiles() {
  if (!(await pathExists(RECORDINGS_DIR))) return [];

  const files = await fs.readdir(RECORDINGS_DIR, { withFileTypes: true });
  const recordings = [];

  for (const file of files) {
    if (!file.isFile()) continue;

    const ext = path.extname(file.name).toLowerCase();
    if (!VIDEO_EXTENSIONS.has(ext)) continue;

    const filePath = path.join(RECORDINGS_DIR, file.name);
    const stat = await fs.stat(filePath);
    const id = path.parse(file.name).name;

    recordings.push({
      id,
      recording_id: id,
      title: id.replace(/[-_]/g, " "),
      room_id: null,
      meeting_id: null,
      host_user_id: null,
      status: "ready",
      file_name: file.name,
      file_path: filePath,
      mime_type: ext === ".mp4" ? "video/mp4" : "video/webm",
      duration_seconds: 0,
      size_bytes: stat.size,
      started_at: stat.birthtime,
      stopped_at: stat.mtime,
      expires_at: null,
      created_at: stat.birthtime,
    });
  }

  return recordings.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function list_recordings_service(db_query, userId) {
  const rows = await db_query(
    `
      SELECT *
      FROM meeting_recordings
      WHERE host_user_id = ?
      AND status <> 'deleted'
      ORDER BY COALESCE(started_at, created_at) DESC
      LIMIT 200
    `,
    [userId],
  );

  if (rows?.length) {
    return {
      success: true,
      message: "Recordings retrieved successfully.",
      data: rows.map(normalizeMeetingRecording),
    };
  }

  return {
    success: true,
    message: "Recordings retrieved successfully.",
    data: [],
  };
}

async function findRecordingFile(recordingId) {
  if (!recordingId) return null;
  if (!(await pathExists(RECORDINGS_DIR))) return null;

  const files = await fs.readdir(RECORDINGS_DIR);

  const match = files.find((file) => {
    const ext = path.extname(file).toLowerCase();
    const id = path.parse(file).name;

    return VIDEO_EXTENSIONS.has(ext) && (id === recordingId || file === recordingId);
  });

  if (!match) return null;

  const filePath = path.join(RECORDINGS_DIR, match);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(path.resolve(RECORDINGS_DIR))) {
    return null;
  }

  return {
    filePath: resolved,
    fileName: match,
  };
}

async function get_recording_file_service(db_query, userId, recordingId) {
  const rows = await db_query(
    `
      SELECT *
      FROM meeting_recordings
      WHERE recording_id = ?
      AND host_user_id = ?
      AND status = 'ready'
      LIMIT 1
    `,
    [recordingId, userId],
  );

  const row = rows?.[0];

  if (row?.file_path) {
    const filePath = path.resolve(row.file_path);

    if (await pathExists(filePath)) {
      return {
        filePath,
        fileName: row.file_name || path.basename(filePath),
      };
    }
  }

  if (row?.file_name) {
    const file = await findRecordingFile(row.file_name);
    if (file) return file;
  }

  return findRecordingFile(recordingId);
}

async function delete_recording_service(db_query, userId, recordingId) {
  const rows = await db_query(
    `
      SELECT *
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

  if (row.file_path) {
    const filePath = path.resolve(row.file_path);

    if (await pathExists(filePath)) {
      try {
        await fs.unlink(filePath);
      } catch {}
    }
  }

  await db_query(
    `
      UPDATE meeting_recordings
      SET status = 'deleted',
          file_path = NULL
      WHERE recording_id = ?
      AND host_user_id = ?
    `,
    [recordingId, userId],
  );

  return {
    success: true,
    message: "Recording deleted successfully.",
  };
}

module.exports = {
  list_recordings_service,
  get_recording_file_service,
  delete_recording_service,
};