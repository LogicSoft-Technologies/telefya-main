const jwt = require("jsonwebtoken");

function getTokenUserId(decoded) {
  const embeddedUser = decoded?.user;

  const candidates = [
    embeddedUser?.user_id,
    embeddedUser?.id,
    embeddedUser?.userId,
    typeof embeddedUser === "string" ||
    typeof embeddedUser === "number"
      ? embeddedUser
      : null,
    decoded?.user_id,
    decoded?.id,
    decoded?.userId,
  ];

  const userId = candidates.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim(),
  );

  return userId ? String(userId).trim() : "";
}

const socketAuthMiddleware = async (socket, next) => {
  try {
    const tokenFromAuth =
      socket.handshake.auth?.token ||
      socket.handshake.auth?.accessToken;

    const tokenFromQuery = socket.handshake.query?.token;
    const authHeader = socket.handshake.headers?.authorization;

    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : tokenFromAuth || tokenFromQuery;

    if (!bearerToken) {
      return next(
        new Error("Unauthorized: socket token missing"),
      );
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      return next(new Error("Socket auth secret missing"));
    }

    const decoded = jwt.verify(
      bearerToken,
      process.env.ACCESS_TOKEN_SECRET,
    );

    const userId = getTokenUserId(decoded);

    if (!userId) {
      return next(
        new Error("Unauthorized: invalid socket token"),
      );
    }

    socket.user = decoded;
    socket.userId = userId;

    return next();
  } catch (error) {
    console.error(
      "[Socket.IO Auth Error]",
      error.message || error,
    );

    return next(new Error("Authentication failed"));
  }
};

module.exports = socketAuthMiddleware;