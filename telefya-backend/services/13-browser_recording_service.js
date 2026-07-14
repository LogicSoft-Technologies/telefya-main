const path = require("path");
const crypto = require("crypto");
const { chromium } = require("playwright");

const RECORDINGS_DIR = process.env.RECORDINGS_DIR
  ? path.resolve(process.env.RECORDINGS_DIR)
  : path.join(process.cwd(), "recordings");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const RECORDER_BOT_SECRET =
  process.env.RECORDER_BOT_SECRET || "dev_recorder_secret";

const activeRecorders = new Map();

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

async function getRecordingStatus(db_query, recordingId) {
  try {
    const rows = await db_query(
      `
        SELECT status
        FROM meeting_recordings
        WHERE recording_id = ?
        LIMIT 1
      `,
      [recordingId],
    );

    return rows?.[0]?.status || null;
  } catch {
    return null;
  }
}

async function markRecordingFailed(db_query, recordingId) {
  await db_query(
    `
      UPDATE meeting_recordings
      SET status = 'failed',
          stopped_at = COALESCE(stopped_at, NOW())
      WHERE recording_id = ?
      AND status != 'ready'
    `,
    [recordingId],
  ).catch(() => {});
}

async function finalizeRecorderInBackground({ db_query, roomId, active }) {
  active.finalizing = true;

  try {
    if (!active.page.isClosed()) {
      await active.page.evaluate(() => window.telefyaStopRecording());
    }

    if (!active.page.isClosed()) {
      await active.page.waitForFunction(
        () => window.telefyaRecorderUploaded === true,
        { timeout: 240000 },
      );
    }

    const status = await getRecordingStatus(db_query, active.recordingId);

    if (status !== "ready") {
      console.warn(
        `[Recorder ${active.recordingId}] finalize finished but DB status is ${status || "unknown"}`,
      );
    }
  } catch (error) {
    const status = await getRecordingStatus(db_query, active.recordingId);

    if (status === "ready") {
      console.log(
        `[Recorder ${active.recordingId}] browser closed after successful upload`,
      );
    } else {
      console.error(`[Recorder ${active.recordingId}] finalize error:`, error);
      await markRecordingFailed(db_query, active.recordingId);
    }
  } finally {
    try {
      await active.browser.close();
    } catch {}

    activeRecorders.delete(roomId);
  }
}

async function start_browser_recording_service({
  db_query,
  roomId,
  hostUserId,
  hostUserName,
}) {
  if (!roomId) {
    return {
      success: false,
      error: true,
      message: "roomId is required.",
    };
  }

  const existing = activeRecorders.get(roomId);

  if (existing) {
    return {
      success: true,
      error: false,
      message: existing.finalizing
        ? "Recording is already being finalized."
        : "Recording is already running.",
      data: {
        recordingId: existing.recordingId,
        roomId,
        fileName: existing.fileName,
        mimeType: "video/mp4",
        startedAt: new Date(existing.startedAt).toISOString(),
        alreadyRecording: true,
        finalizing: Boolean(existing.finalizing),
      },
    };
  }

  const recordingId = createId();
  const fileName = `${recordingId}.mp4`;
  const outputPath = path.join(RECORDINGS_DIR, fileName);

  await db_query(
    `
      INSERT INTO meeting_recordings
      (
        recording_id,
        room_id,
        host_user_id,
        title,
        status,
        file_name,
        file_path,
        mime_type,
        started_at,
        expires_at
      )
      VALUES (?, ?, ?, ?, 'recording', ?, ?, 'video/mp4', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))
    `,
    [
      recordingId,
      roomId,
      hostUserId || null,
      `Telefya recording - ${roomId}`,
      fileName,
      outputPath,
    ],
  );

  const url = new URL(`/recording/${encodeURIComponent(roomId)}`, FRONTEND_URL);
  url.searchParams.set("recordingId", recordingId);
  url.searchParams.set("secret", RECORDER_BOT_SECRET);
  url.searchParams.set("hostUserId", hostUserId || "");
  url.searchParams.set("hostUserName", hostUserName || "Host");

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--use-fake-ui-for-media-stream",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
    ],
  });

  const context = await browser.newContext({
    viewport: {
      width: 1280,
      height: 720,
    },
    deviceScaleFactor: 1,
    permissions: ["camera", "microphone"],
  });

  const page = await context.newPage();

  page.on("console", (message) => {
    console.log(`[Recorder ${recordingId}]`, message.text());
  });

  page.on("pageerror", (error) => {
    console.error(`[Recorder ${recordingId}] page error:`, error.message);
  });

  try {
    await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForFunction(
      () =>
        window.telefyaRecorderReady === true &&
        typeof window.telefyaStartRecording === "function",
      {
        timeout: 90000,
      },
    );

    const active = {
      recordingId,
      browser,
      context,
      page,
      outputPath,
      fileName,
      startedAt: Date.now(),
      finalizing: false,
    };

    activeRecorders.set(roomId, active);

    await page.evaluate(() => window.telefyaStartRecording());

    return {
      success: true,
      error: false,
      message: "Recording started.",
      data: {
        recordingId,
        roomId,
        fileName,
        mimeType: "video/mp4",
        startedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    try {
      await browser.close();
    } catch {}

    activeRecorders.delete(roomId);
    await markRecordingFailed(db_query, recordingId);

    throw error;
  }
}

async function stop_browser_recording_service({ db_query, roomId }) {
  const active = activeRecorders.get(roomId);

  if (!active) {
    return {
      success: false,
      error: true,
      message: "No active recording found for this room.",
    };
  }

  if (active.finalizing) {
    return {
      success: true,
      error: false,
      message: "Recording is already being finalized.",
      data: {
        recordingId: active.recordingId,
        roomId,
        fileName: active.fileName,
        mimeType: "video/mp4",
        finalizing: true,
      },
    };
  }

  active.finalizing = true;

  await db_query(
    `
      UPDATE meeting_recordings
      SET status = 'processing',
          stopped_at = NOW()
      WHERE recording_id = ?
      AND status != 'ready'
    `,
    [active.recordingId],
  );

  finalizeRecorderInBackground({ db_query, roomId, active });

  return {
    success: true,
    error: false,
    message: "Recording is being finalized.",
    data: {
      recordingId: active.recordingId,
      roomId,
      fileName: active.fileName,
      mimeType: "video/mp4",
    },
  };
}

async function force_stop_browser_recording(roomId) {
  const active = activeRecorders.get(roomId);
  if (!active) return;

  if (active.finalizing) return;

  try {
    await active.browser.close();
  } catch {}

  activeRecorders.delete(roomId);
}

function get_active_browser_recording(roomId) {
  const active = activeRecorders.get(roomId);
  if (!active) return null;

  return {
    recordingId: active.recordingId,
    roomId,
    fileName: active.fileName,
    outputPath: active.outputPath,
    startedAt: active.startedAt,
    finalizing: Boolean(active.finalizing),
  };
}

module.exports = {
  start_browser_recording_service,
  stop_browser_recording_service,
  force_stop_browser_recording,
  get_active_browser_recording,
};