const express = require("express");
const get_user_profile_controller = require("../../controllers/05-update_user_profile_controller");
const update_user_profile_controller = require("../../controllers/05-update_user_profile_controller");
const user_logout_controller = require("../../controllers/06-logout-controller");
const auth_middleware = require("../../middleware/auth_middleware");

const loadMeetingControllers = () => {
  try {
    return require("../../controllers/07_meeting_controller");
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
    return require("../../controllers/07-meeting_controller");
  }
};

const {
  get_analytics_summary_controller,
  list_attendance_reports_controller,
} = require("../../controllers/09-analytics_controller");

const {
  schedule_meeting_controller,
  get_meeting_controller,
  delete_meeting_controller,
} = loadMeetingControllers();

const {
  list_recordings_controller,
  download_recording_controller,
  delete_recording_controller,
} = require("../../controllers/10-recording_controller");

const {
  list_admin_users_controller,
  get_branding_controller,
  save_branding_controller,
  get_speaker_status_controller,
  save_speaker_status_controller,
  list_speaker_materials_controller,
  create_speaker_material_controller,
  list_attendee_networking_controller,
  list_certificates_controller,
  generate_certificate_controller,
  get_billing_overview_controller,
} = require("../../controllers/12-workspace_controller");

const user_router = express.Router();

user_router.get("/profile", auth_middleware, get_user_profile_controller);
user_router.patch("/profile", auth_middleware, update_user_profile_controller);
user_router.put("/profile", auth_middleware, update_user_profile_controller);

user_router.post(
  "/schedule-meeting",
  auth_middleware,
  schedule_meeting_controller,
);

user_router.get("/get-meeting", auth_middleware, get_meeting_controller);

user_router.post("/delete-meeting", auth_middleware, delete_meeting_controller);

user_router.get(
  "/analytics/summary",
  auth_middleware,
  get_analytics_summary_controller,
);

user_router.get(
  "/analytics/attendance",
  auth_middleware,
  list_attendance_reports_controller,
);

user_router.get("/recordings", auth_middleware, list_recordings_controller);

user_router.get(
  "/recordings/:recordingId",
  auth_middleware,
  download_recording_controller,
);

user_router.delete(
  "/recordings/:recordingId",
  auth_middleware,
  delete_recording_controller,
);

user_router.get("/admin/users", auth_middleware, list_admin_users_controller);

user_router.get("/admin/branding", auth_middleware, get_branding_controller);
user_router.post("/admin/branding", auth_middleware, save_branding_controller);

user_router.get("/speaker/status", auth_middleware, get_speaker_status_controller);
user_router.post("/speaker/status", auth_middleware, save_speaker_status_controller);

user_router.get(
  "/speaker/materials",
  auth_middleware,
  list_speaker_materials_controller,
);

user_router.post(
  "/speaker/materials",
  auth_middleware,
  create_speaker_material_controller,
);

user_router.get(
  "/attendee/networking",
  auth_middleware,
  list_attendee_networking_controller,
);

user_router.get(
  "/attendee/certificates",
  auth_middleware,
  list_certificates_controller,
);

user_router.post(
  "/attendee/certificates/generate",
  auth_middleware,
  generate_certificate_controller,
);

user_router.get("/billing", auth_middleware, get_billing_overview_controller);

user_router.post("/logout", auth_middleware, user_logout_controller);
user_router.get("/logout", auth_middleware, user_logout_controller);

module.exports = user_router;