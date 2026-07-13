export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",

  lobby: "/lobby",
  liveDemo: "/live/demo",
  speaker: "/speaker",
  host: "/host",
  attendee: "/attendee",
  admin: "/admin",
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.verifyEmail,
];

export const PLATFORM_ROUTES = [
  ROUTES.lobby,
  ROUTES.speaker,
  ROUTES.host,
  ROUTES.attendee,
  ROUTES.admin,
];