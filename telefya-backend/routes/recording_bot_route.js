const express = require("express");
const {
  upload_recording_blob_controller,
} = require("../controllers/13-recording_bot_controller");

const recording_bot_router = express.Router();

recording_bot_router.post(
  "/upload/:recordingId",
  express.raw({
    type: ["video/webm", "application/octet-stream"],
    limit: "2gb",
  }),
  upload_recording_blob_controller,
);

module.exports = recording_bot_router;