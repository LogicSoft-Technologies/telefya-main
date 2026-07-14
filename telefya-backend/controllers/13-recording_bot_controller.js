const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");
const { query } = require("../config/db");
const {
  add_recording_asset_usage_service,
} = require("../services/14-billing_service");

const RECORDINGS_DIR = process.env.RECORDINGS_DIR
  ? path.resolve(process.env.RECORDINGS_DIR)
  : path.join(process.cwd(), "recordings");

const RECORDER_BOT_SECRET =
  process.env.RECORDER_BOT_SECRET || "dev_recorder_secret";

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function verifyRecorderSecret(req) {
  const providedSecret = req.query.secret || req.headers["x-recorder-secret"];
  return providedSecret === RECORDER_BOT_SECRET;
}

function runFfmpegToMp4(inputPath, outputPath) {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpegPath,
      [
        "-y",
        "-i",
        inputPath,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      {
        windowsHide: true,
      },
    );

    child.stderr.on("data", (data) => {
      console.log(`[Recording finalize] ${data.toString()}`);
    });

    child.on("error", reject);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

async function getRecordingUsageContext(recordingId) {
  const rows = await query(
    `
      SELECT
        recording_id,
        host_user_id,
        started_at,
        stopped_at,
        TIMESTAMPDIFF(SECOND, started_at, COALESCE(stopped_at, NOW())) AS duration_seconds
      FROM meeting_recordings
      WHERE recording_id = ?
      LIMIT 1
    `,
    [recordingId],
  );

  return rows?.[0] || null;
}

async function recordBillingUsageForRecording(recordingId, sizeBytes) {
  try {
    const recording = await getRecordingUsageContext(recordingId);

    if (!recording?.host_user_id) return;

    const durationSeconds = Math.max(
      0,
      Number(recording.duration_seconds || 0),
    );

    await add_recording_asset_usage_service(query, recording.host_user_id, {
      duration_seconds: durationSeconds,
      size_bytes: sizeBytes,
    });
  } catch (error) {
    console.error("[Recording billing usage] Unable to record usage:", {
      recordingId,
      message: error?.message,
    });
  }
}

async function upload_recording_blob_controller(req, res) {
  try {
    if (!verifyRecorderSecret(req)) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Invalid recorder secret.",
        status: 403,
      });
    }

    const recordingId = req.params.recordingId;

    if (!recordingId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "recordingId is required.",
        status: 400,
      });
    }

    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Recording blob is empty.",
        status: 400,
      });
    }

    await ensureDir(RECORDINGS_DIR);

    const webmPath = path.join(RECORDINGS_DIR, `${recordingId}.webm`);
    const mp4Path = path.join(RECORDINGS_DIR, `${recordingId}.mp4`);
    const fileName = `${recordingId}.mp4`;

    await fsp.writeFile(webmPath, req.body);
    await runFfmpegToMp4(webmPath, mp4Path);

    const stat = await fsp.stat(mp4Path);

    await query(
      `
        UPDATE meeting_recordings
        SET status = 'ready',
            stopped_at = COALESCE(stopped_at, NOW()),
            file_path = ?,
            file_name = ?,
            mime_type = 'video/mp4',
            size_bytes = ?,
            duration_seconds = GREATEST(
              TIMESTAMPDIFF(SECOND, started_at, COALESCE(stopped_at, NOW())),
              0
            ),
            expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
        WHERE recording_id = ?
      `,
      [mp4Path, fileName, stat.size, recordingId],
    );

    await recordBillingUsageForRecording(recordingId, stat.size);

    try {
      await fsp.unlink(webmPath);
    } catch {}

    return res.status(200).json({
      success: true,
      error: false,
      message: "Recording uploaded and finalized.",
      status: 200,
      data: {
        recordingId,
        fileName,
        filePath: mp4Path,
        sizeBytes: stat.size,
      },
    });
  } catch (error) {
    console.error("Recording upload/finalize error:", error);

    const recordingId = req.params.recordingId;

    if (recordingId) {
      await query(
        `
          UPDATE meeting_recordings
          SET status = 'failed',
              stopped_at = NOW()
          WHERE recording_id = ?
        `,
        [recordingId],
      ).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Unable to finalize recording.",
      status: 500,
    });
  }
}

module.exports = {
  upload_recording_blob_controller,
};