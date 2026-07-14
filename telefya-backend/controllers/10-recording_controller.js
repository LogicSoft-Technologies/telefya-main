const { query } = require("../config/db");
const {
  list_recordings_service,
  get_recording_file_service,
  delete_recording_service,
} = require("../services/10-recording_service");

const getUserId = (req) =>
  req.user?.user || req.user?.user_id || req.user?.id || req.user?.email;

const list_recordings_controller = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized.",
        status: 401,
      });
    }

    const result = await list_recordings_service(query, userId);
    return res.status(200).json({ ...result, status: 200 });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Internal server error",
      status: 500,
    });
  }
};

const download_recording_controller = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { recordingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized.",
        status: 401,
      });
    }

    const file = await get_recording_file_service(query, userId, recordingId);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Recording not found.",
        status: 404,
      });
    }

    return res.download(file.filePath, file.fileName);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Internal server error",
      status: 500,
    });
  }
};

const delete_recording_controller = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { recordingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized.",
        status: 401,
      });
    }

    const result = await delete_recording_service(query, userId, recordingId);

    return res.status(result.success ? 200 : 404).json({
      ...result,
      status: result.success ? 200 : 404,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Internal server error",
      status: 500,
    });
  }
};

module.exports = {
  list_recordings_controller,
  download_recording_controller,
  delete_recording_controller,
};