const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://localhost:5173",
  "http://localhost:8090",
  "http://localhost:80",
  "http://63.141.255.177",
  "http://69.30.204.61:80",
  "https://69.30.204.61:443",
  "https://meet.bornwithwealth.com",
];

const envOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envOrigins])
);

function normalizeOrigin(origin) {
  return origin?.replace(/\/$/, "");
}

function isOriginAllowed(origin) {
  if (!origin) return true;

  const cleanOrigin = normalizeOrigin(origin);

  return allowedOrigins.map(normalizeOrigin).includes(cleanOrigin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

module.exports = {
  corsOptions,
  allowedOrigins,
  isOriginAllowed,
};