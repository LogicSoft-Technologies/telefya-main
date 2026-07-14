require("dotenv").config();
const { corsOptions, allowedOrigins } = require("./config/corsOptions");
const express = require("express");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const path = require("path");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { creeateDBandTables, query } = require("./config/db");
const fs = require("fs");
const auth_router = require("./routes/auth_route");
const user_router = require("./routes/users/routes");
const { FileUploader } = require("./lib/fileUploader");
const auth_middleware = require("./middleware/auth_middleware");
const { save_profile_image } = require("./services/05-user_profile");
const responseObject = require("./lib/responseObject");
const socketAuthMiddleware = require("./middleware/socket_auth_middleware");
const mediasoupSocket = require("./mediasoupSocket");
const recording_bot_router = require("./routes/recording_bot_route");
const billing_router = require("./routes/billing_route");
const {
  stripe_webhook_controller,
} = require("./controllers/14-billing_controller");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger-doc");

const { getRecording } = require("./mediasoupServer2");

const redisConf = {
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  ...(process.env.REDIS_USER && { username: process.env.REDIS_USER }),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const createServer = () => {
  const app = express();

  app.set("trust proxy", "127.0.0.1");

  app.use(
    "/api/v2/bww-api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec),
  );

  const logDirectory = path.join(__dirname, ".", "logs");

  if (!fs.existsSync(logDirectory)) {
    try {
      fs.mkdirSync(logDirectory);
    } catch (err) {
      console.error(
        `Failed to create log directory at ${logDirectory}:`,
        err.message,
      );
    }
  }

  const accessLogStream = rfs.createStream("access.log", {
    interval: "1d",
    path: logDirectory,
    maxFiles: 7,
  });

  app.use(morgan("combined", { stream: accessLogStream }));

  app.use((req, res, next) => {
    next();
  });

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(cookieParser());


app.post(
  "/api/v2/billing/webhook",
  express.raw({ type: "application/json" }),
  stripe_webhook_controller,
);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.disable("x-powered-by");

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const xForwardedFor = req.get("X-Forwarded-For");
      return xForwardedFor ? xForwardedFor.split(",")[0].trim() : req.ip;
    },
    skip: (req) => {
      return (
        req.path.startsWith("/socket.io") ||
        req.path.startsWith("/class_meeting") ||
        req.path.startsWith("/conf_meeting")
      );
    },
    handler: (req, res) => {
      return res.status(429).json({
        error: true,
        message: "Too many try attempts. Please try again later.",
        status: 429,
      });
    },
  });

  app.use("/api/v2/auth", limiter, auth_router);
  app.use("/api/v2/user", user_router);
  app.use("/api/v2/billing", billing_router);

  app.get("/api/v2/health", (req, res) => {
    res.status(200).json({ status: "Server is running" });
  });

  const publicPath = path.join(__dirname, "public");
  app.use(express.static(publicPath));

  const fileUploader = new FileUploader({
    fieldName: "image",
    storagePath: "./public/images2",
    maxSizeMB: 10,
    maxWidth: 5000,
    maxHeight: 5000,
    validExts: ["png", "jpg", "jpeg", "gif", "webp"],
  });

  app.post("/api/v2/user/upload-file", auth_middleware, (req, res) => {
    fileUploader.upload(req, res, {
      isSingle: true,
      resize: [{ width: 500, height: 500 }],
      callback: (err, result) => {
        if (err) {
          return res.status(400).json({
            error: true,
            message: err.message || "File upload failed",
            details: err.messages || [],
          });
        }

        (async () => {
          const image = result.data?.[0].path;
          const output = await save_profile_image(req.user.user, image, {
            query,
            responseObject,
          });

          return res.status(output?.status).json({ ...output, image });
        })();
      },
    });
  });

  app.get("/api/v2/recordings/:recordingId", async (req, res) => {
    try {
      const recordingId = req.params.recordingId;
      const recording = await getRecording(recordingId);

      if (!recording || !fs.existsSync(recording.filePath)) {
        return res
          .status(404)
          .json({ error: "Recording not found " + recordingId });
      }

      const fileName = path.basename(recording.filePath);

      res.download(recording.filePath, fileName, (err) => {
        if (err) {
          res.status(500).json({ error: "Failed to download recording" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/v2/recordings/:recordingId/thumbnail", async (req, res) => {
    try {
      const recordingId = req.params.recordingId;
      const recording = await getRecording(recordingId);

      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      const thumbnailPath = recording.filePath.replace(
        /\.[^/.]+$/,
        "_thumb.jpg",
      );

      if (!fs.existsSync(thumbnailPath)) {
        return res.status(404).json({ error: "Thumbnail not found" });
      }

      res.sendFile(thumbnailPath, (err) => {
        if (err) {
          res.status(500).json({ error: "Failed to download thumbnail" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.use("/api/v2/recording-bot", recording_bot_router);

  app.use("*", (req, res) => {
    res.status(404).json({
      error: true,
      message: "Route not found",
      status: 404,
    });
  });

  return app;
};

const startServer = async (app, port = process.env.PORT || 5000) => {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });

  const pubClient = createClient(redisConf);
  pubClient.on("error", (err) => console.error("Redis Pub Client Error:", err));
  await pubClient.connect();

  const subClient = pubClient.duplicate();
  subClient.on("error", (err) => console.error("Redis Sub Client Error:", err));
  await subClient.connect();

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.engine.on("connection_error", (err) => {
    console.error("[Socket.IO Engine Error]", {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  const mediaSoupIO = io.of("/conf_meeting");

  mediaSoupIO.use((socket, next) => {
    const isRecorderBot = socket.handshake.query?.recorderBot === "true";

    if (isRecorderBot) {
      return next();
    }

    return socketAuthMiddleware(socket, next);
  });

  mediaSoupIO.on("connection", (socket) => {
    console.log("[Socket.IO] connected to /conf_meeting", {
      socketId: socket.id,
      userId: socket.userId,
      origin: socket.handshake.headers.origin,
    });
  });

  await mediasoupSocket(mediaSoupIO, pubClient, subClient);

  return { server, io };
};

if (require.main === module) {
  (async () => await creeateDBandTables())();

  setTimeout(() => {
    const app = createServer();
    startServer(app);
  }, 100);
}