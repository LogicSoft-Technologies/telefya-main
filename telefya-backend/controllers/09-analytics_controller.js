const { query } = require("../config/db");
const {
  get_analytics_summary_service,
  list_attendance_reports_service,
} = require("../services/09-analytics_service");

const getUserId = (req) =>
  req.user?.user || req.user?.user_id || req.user?.id || req.user?.email;

const get_analytics_summary_controller = async (req, res) => {
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

    const result = await get_analytics_summary_service(query, userId);
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

const list_attendance_reports_controller = async (req, res) => {
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

    const result = await list_attendance_reports_service(query, userId);
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

module.exports = {
  get_analytics_summary_controller,
  list_attendance_reports_controller,
};