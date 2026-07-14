const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const dgram = require("dgram");
const { spawn } = require("child_process");
const crypto = require("crypto");

const RECORDINGS_DIR = process.env.RECORDINGS_DIR
  ? path.resolve(process.env.RECORDINGS_DIR)
  : path.join(process.cwd(), "recordings");

const RECORDING_RETENTION_DAYS = Number(
  process.env.RECORDING_RETENTION_DAYS || 30,
);

const activeRecordings = new Map();

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

function safeRoomTitle(roomId) {
  return `Telefya recording - ${roomId}`;
}

async function getFreeUdpPort() {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");

    socket.once("error", reject);

    socket.bind(0, "127.0.0.1", () => {
      const address = socket.address();
      const port = address.port;

      socket.close(() => resolve(port));
    });
  });
}

function getCodec(consumer) {
  const codec = consumer.rtpParameters.codecs[0];

  return {
    payloadType: codec.payloadType,
    mimeType: codec.mimeType,
    clockRate: codec.clockRate,
    channels: codec.channels,
    parameters: codec.parameters || {},
  };
}

function getCodecName(codec) {
  const codecName = codec.mimeType.split("/")[1] || "";

  if (codecName.toLowerCase() === "opus") return "opus";
  if (codecName.toLowerCase() === "vp8") return "VP8";
  if (codecName.toLowerCase() === "vp9") return "VP9";
  if (codecName.toLowerCase() === "h264") return "H264";

  return codecName;
}

function buildFmtp(parameters = {}) {
  return Object.entries(parameters)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${value}`)
    .join(";");
}

function buildSdp(streams, title) {
  const lines = [
    "v=0",
    "o=- 0 0 IN IP4 127.0.0.1",
    `s=${title}`,
    "c=IN IP4 127.0.0.1",
    "t=0 0",
    "a=tool:Telefya Recorder",
  ];

  streams.forEach((stream, index) => {
    const codec = stream.codec;
    const kind = stream.kind;
    const codecName = getCodecName(codec);

    lines.push(`m=${kind} ${stream.port} RTP/AVP ${codec.payloadType}`);
    lines.push(`a=mid:${kind}-${index}`);
    lines.push("a=recvonly");
    lines.push("a=rtcp-mux");
    lines.push(`a=rtcp:${stream.port} IN IP4 127.0.0.1`);

    if (kind === "audio") {
      lines.push(
        `a=rtpmap:${codec.payloadType} ${codecName}/${codec.clockRate}/${codec.channels || 2}`,
      );
    } else {
      lines.push(
        `a=rtpmap:${codec.payloadType} ${codecName}/${codec.clockRate}`,
      );
      lines.push("a=framerate:30");
    }

    const fmtp = buildFmtp(codec.parameters);

    if (fmtp) {
      lines.push(`a=fmtp:${codec.payloadType} ${fmtp}`);
    }
  });

  return `${lines.join("\r\n")}\r\n`;
}

function buildFfmpegArgs({ sdpPath, outputPath, audioCount, hasVideo }) {
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "info",
    "-protocol_whitelist",
    "file,udp,rtp",
    "-fflags",
    "+genpts+discardcorrupt",
    "-flags",
    "low_delay",
    "-use_wallclock_as_timestamps",
    "1",
    "-analyzeduration",
    "20000000",
    "-probesize",
    "20000000",
    "-max_delay",
    "500000",
    "-f",
    "sdp",
    "-i",
    sdpPath,
  ];

  if (audioCount > 1) {
    const audioInputs = Array.from(
      { length: audioCount },
      (_, index) => `[0:a:${index}]`,
    ).join("");

    args.push(
      "-filter_complex",
      `${audioInputs}amix=inputs=${audioCount}:duration=longest:dropout_transition=2[aout]`,
    );
  }

  if (hasVideo) {
    args.push("-map", "0:v:0?");
  }

  if (audioCount > 1) {
    args.push("-map", "[aout]");
  } else if (audioCount === 1) {
    args.push("-map", "0:a:0?");
  }

  if (hasVideo) {
    args.push(
      "-vf",
      "fps=30,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
      "-fps_mode",
      "cfr",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-tune",
      "zerolatency",
      "-profile:v",
      "main",
      "-level",
      "4.1",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "23",
      "-g",
      "60",
    );
  } else {
    args.push("-vn");
  }

  if (audioCount > 0) {
    args.push("-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2");
  } else {
    args.push("-an");
  }

  args.push(
    "-movflags",
    "+faststart",
    "-metadata",
    "title=Telefya Recording",
    "-metadata",
    "comment=Recorded by Telefya",
    outputPath,
  );

  return args;
}

function chooseRecordingProducers(producerInfos, hostUserId) {
  const audioProducers = producerInfos.filter((info) => info.kind === "audio");

  const videoProducers = producerInfos.filter((info) => info.kind === "video");

  const screenVideo = videoProducers.find((info) => {
    return Boolean(info.userData?.isScreen || info.userData?.appData?.isScreen);
  });

  const hostVideo = videoProducers.find((info) => {
    return info.userData?.userId === hostUserId;
  });

  const selectedVideo = screenVideo || hostVideo || videoProducers[0] || null;

  return {
    selected: selectedVideo
      ? [...audioProducers, selectedVideo]
      : [...audioProducers],
    audioCount: audioProducers.length,
    hasVideo: Boolean(selectedVideo),
    selectedVideo,
  };
}

async function closeItems(items) {
  for (const item of items) {
    try {
      if (!item.closed) item.close();
    } catch {}
  }
}

async function requestVideoKeyFrames(consumers) {
  const videoConsumers = consumers.filter((consumer) => consumer.kind === "video");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    for (const consumer of videoConsumers) {
      try {
        await consumer.requestKeyFrame();
      } catch {}
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

async function markRecordingFailed(db_query, recordingId, message) {
  await db_query(
    `
      UPDATE meeting_recordings
      SET status = 'failed',
          stopped_at = NOW()
      WHERE recording_id = ?
    `,
    [recordingId],
  );

  console.error(`[Recording ${recordingId}] ${message}`);
}

async function start_ffmpeg_recording_service({
  db_query,
  mediaSoupService,
  roomId,
  hostUserId,
}) {
  if (!roomId) {
    return {
      success: false,
      error: true,
      message: "roomId is required to start recording.",
    };
  }

  if (activeRecordings.has(roomId)) {
    return {
      success: false,
      error: true,
      message: "This room is already being recorded.",
    };
  }

  await ensureDir(RECORDINGS_DIR);

  const router = mediaSoupService.getRouter(roomId);
  const producerInfos = mediaSoupService.getRoomProducerInfos(roomId);

  const { selected, audioCount, hasVideo } = chooseRecordingProducers(
    producerInfos,
    hostUserId,
  );

  if (selected.length === 0) {
    return {
      success: false,
      error: true,
      message: "No media producers are available to record yet.",
    };
  }

  const recordingId = createId();
  const fileName = `${recordingId}.mp4`;
  const outputPath = path.join(RECORDINGS_DIR, fileName);
  const sdpPath = path.join(os.tmpdir(), `${recordingId}.sdp`);
  const startedAt = new Date();

  const transports = [];
  const consumers = [];
  const sdpStreams = [];

  await db_query(
    `
      INSERT INTO meeting_recordings
      (recording_id, room_id, host_user_id, status, file_name, file_path, mime_type, started_at, expires_at)
      VALUES (?, ?, ?, 'recording', ?, ?, 'video/mp4', NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))
    `,
    [
      recordingId,
      roomId,
      hostUserId || null,
      fileName,
      outputPath,
      RECORDING_RETENTION_DAYS,
    ],
  );

  try {
    for (const info of selected) {
      const port = await getFreeUdpPort();
      const transport =
        await mediaSoupService.createRecordingPlainTransport(roomId);

      await transport.connect({
        ip: "127.0.0.1",
        port,
      });

      const consumer = await transport.consume({
        producerId: info.producer.id,
        rtpCapabilities: router.rtpCapabilities,
        paused: true,
      });

      transports.push(transport);
      consumers.push(consumer);

      sdpStreams.push({
        kind: consumer.kind,
        port,
        codec: getCodec(consumer),
      });
    }

    await fsp.writeFile(sdpPath, buildSdp(sdpStreams, safeRoomTitle(roomId)));

    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    const ffmpegArgs = buildFfmpegArgs({
      sdpPath,
      outputPath,
      audioCount,
      hasVideo,
    });

    console.log(`[Recording ${recordingId}] Starting FFmpeg`, {
      roomId,
      outputPath,
      streams: sdpStreams.map((stream) => ({
        kind: stream.kind,
        port: stream.port,
        codec: stream.codec.mimeType,
      })),
    });

    const ffmpeg = spawn(ffmpegPath, ffmpegArgs, {
      windowsHide: true,
      stdio: ["pipe", "ignore", "pipe"],
    });

    let sawFrame = false;
    let stderrBuffer = "";
    let exited = false;

    ffmpeg.stderr.on("data", (data) => {
      const text = data.toString();
      stderrBuffer = `${stderrBuffer}${text}`.slice(-5000);

      if (text.includes("frame=") && !text.includes("frame=    0")) {
        sawFrame = true;
      }

      if (
        text.includes("frame=") ||
        text.includes("Input #") ||
        text.includes("Output #") ||
        text.includes("Stream #") ||
        text.includes("Error")
      ) {
        console.log(`[Recording ${recordingId}] ${text.trim()}`);
      }
    });

    ffmpeg.on("error", async (error) => {
      exited = true;
      activeRecordings.delete(roomId);
      await closeItems(consumers);
      await closeItems(transports);

      try {
        await fsp.unlink(sdpPath);
      } catch {}

      await markRecordingFailed(db_query, recordingId, error.message);
    });

    ffmpeg.on("exit", async (code, signal) => {
      exited = true;
      activeRecordings.delete(roomId);

      await closeItems(consumers);
      await closeItems(transports);

      try {
        await fsp.unlink(sdpPath);
      } catch {}

      const stat = fs.existsSync(outputPath) ? await fsp.stat(outputPath) : null;
      const hasUsableFile = Boolean(stat && stat.size > 20 * 1024);

      if ((code === 0 || code === 255 || signal === "SIGINT") && hasUsableFile) {
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startedAt.getTime()) / 1000),
        );

        await db_query(
          `
            UPDATE meeting_recordings
            SET status = 'ready',
                stopped_at = NOW(),
                file_path = ?,
                file_name = ?,
                size_bytes = ?,
                duration_seconds = ?,
                expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)
            WHERE recording_id = ?
          `,
          [
            outputPath,
            fileName,
            stat.size,
            durationSeconds,
            RECORDING_RETENTION_DAYS,
            recordingId,
          ],
        );

        console.log(`[Recording ${recordingId}] Ready`, {
          roomId,
          fileName,
          size: stat.size,
          durationSeconds,
        });
      } else {
        await db_query(
          `
            UPDATE meeting_recordings
            SET status = 'failed',
                stopped_at = NOW(),
                size_bytes = ?
            WHERE recording_id = ?
          `,
          [stat?.size || 0, recordingId],
        );

        console.error(`[Recording ${recordingId}] Failed`, {
          code,
          signal,
          sawFrame,
          size: stat?.size || 0,
          stderr: stderrBuffer,
        });
      }
    });

    activeRecordings.set(roomId, {
      recordingId,
      ffmpeg,
      consumers,
      transports,
      outputPath,
      fileName,
      startedAt,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (exited) {
      return {
        success: false,
        error: true,
        message: "Recording process exited before media started.",
      };
    }

    for (const consumer of consumers) {
      try {
        await consumer.resume();
      } catch (error) {
        console.warn(
          `[Recording ${recordingId}] Could not resume ${consumer.kind} consumer:`,
          error.message,
        );
      }
    }

    await requestVideoKeyFrames(consumers);

    return {
      success: true,
      message: "Recording started.",
      data: {
        recordingId,
        roomId,
        fileName,
        mimeType: "video/mp4",
        startedAt: startedAt.toISOString(),
      },
    };
  } catch (error) {
    activeRecordings.delete(roomId);

    await closeItems(consumers);
    await closeItems(transports);

    try {
      await fsp.unlink(sdpPath);
    } catch {}

    await markRecordingFailed(db_query, recordingId, error.message);

    return {
      success: false,
      error: true,
      message: error.message || "Unable to start recording.",
    };
  }
}

async function stop_ffmpeg_recording_service({ db_query, roomId }) {
  const active = activeRecordings.get(roomId);

  if (!active) {
    return {
      success: false,
      error: true,
      message: "No active recording found for this room.",
    };
  }

  await db_query(
    `
      UPDATE meeting_recordings
      SET status = 'processing',
          stopped_at = NOW()
      WHERE recording_id = ?
    `,
    [active.recordingId],
  );

  try {
    if (active.ffmpeg.stdin && !active.ffmpeg.stdin.destroyed) {
      active.ffmpeg.stdin.write("q");
      active.ffmpeg.stdin.end();
    } else {
      active.ffmpeg.kill("SIGINT");
    }
  } catch {
    try {
      active.ffmpeg.kill("SIGINT");
    } catch {}
  }

  return {
    success: true,
    message: "Recording is being finalized.",
    data: {
      recordingId: active.recordingId,
      roomId,
      fileName: active.fileName,
      mimeType: "video/mp4",
    },
  };
}

async function cleanup_expired_recordings_service(db_query) {
  const rows = await db_query(
    `
      SELECT recording_id, file_path
      FROM meeting_recordings
      WHERE expires_at IS NOT NULL
      AND expires_at < NOW()
      AND status IN ('ready', 'failed', 'expired')
    `,
  );

  for (const row of rows) {
    if (row.file_path && fs.existsSync(row.file_path)) {
      try {
        await fsp.unlink(row.file_path);
      } catch {}
    }

    await db_query(
      `
        UPDATE meeting_recordings
        SET status = 'deleted',
            file_path = NULL
        WHERE recording_id = ?
      `,
      [row.recording_id],
    );
  }

  return {
    success: true,
    message: "Expired recordings cleaned.",
    data: {
      deleted: rows.length,
    },
  };
}

function getActiveRecording(roomId) {
  const active = activeRecordings.get(roomId);

  if (!active) return null;

  return {
    recordingId: active.recordingId,
    roomId,
    fileName: active.fileName,
    outputPath: active.outputPath,
    startedAt: active.startedAt,
  };
}

module.exports = {
  start_ffmpeg_recording_service,
  stop_ffmpeg_recording_service,
  cleanup_expired_recordings_service,
  getActiveRecording,
};