const jwt = require("jsonwebtoken");

const socketAuthMiddleware = async (socket, next) => {
  try {
    const tokenFromAuth =
      socket.handshake.auth?.token ||
      socket.handshake.auth?.accessToken;

    const tokenFromQuery = socket.handshake.query?.token;
    const authHeader = socket.handshake.headers?.authorization;

    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : tokenFromAuth || tokenFromQuery;

    if (!bearerToken) {
      return next(new Error("Unauthorized: socket token missing"));
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      return next(new Error("Socket auth secret missing"));
    }

    const decoded = jwt.verify(bearerToken, process.env.ACCESS_TOKEN_SECRET);

    const userId =
      decoded?.user ||
      decoded?.user_id ||
      decoded?.id ||
      decoded?.userId;

    if (!userId) {
      return next(new Error("Unauthorized: invalid socket token"));
    }

    socket.user = decoded;
    socket.userId = userId;

    return next();
  } catch (err) {
    console.error("[Socket.IO Auth Error]", err.message || err);
    return next(new Error("Authentication failed"));
  }
};

module.exports = socketAuthMiddleware;