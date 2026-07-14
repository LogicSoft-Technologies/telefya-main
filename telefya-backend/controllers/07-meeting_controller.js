const { query } = require("../config/db");
const {
  schedule_meeting_service,
  get_meeting_service,
  delete_meeting_service,
} = require("../services/08_meeting_service");
const {
  getUserId,
  get_current_subscription_service,
} = require("../services/14-billing_service");

const getAuthenticatedUserId = (req) =>
  getUserId(req.user) || req.user?.user || req.user?.id || req.user?.userId;

function unauthorized(res) {
  return res.status(401).json({
    success: false,
    error: true,
    message: "Authenticated user is required.",
    status: 401,
  });
}

function billingUnavailableResponse(res, error) {
  return res.status(500).json({
    success: false,
    error: true,
    message: error?.message || "Unable to verify billing access.",
    status: 500,
  });
}

async function getBillingContext(userId) {
  const result = await get_current_subscription_service(query, userId);
  return result?.data || null;
}

const schedule_meeting_controller = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) return unauthorized(res);

    let subscription;

    try {
      subscription = await getBillingContext(userId);
    } catch (error) {
      return billingUnavailableResponse(res, error);
    }

    const scheduled = await schedule_meeting_service(query, {
      ...req.body,
      user_id: userId,
      billing_plan: subscription?.plan_code || "free",
      max_participants: subscription?.limits?.max_participants,
      max_meeting_minutes: subscription?.limits?.max_meeting_minutes,
      recording_enabled: subscription?.limits?.recording_enabled,
    });

    return res.status(200).json({
      error: false,
      message: scheduled.message,
      status: 200,
      success: true,
      data: {
        ...scheduled.data,
        billing: subscription,
      },
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

const get_meeting_controller = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) return unauthorized(res);

    const [scheduled, subscription] = await Promise.all([
      get_meeting_service(query, userId),
      getBillingContext(userId).catch(() => null),
    ]);

    return res.status(200).json({
      ...scheduled,
      status: 200,
      billing: subscription,
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

const delete_meeting_controller = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) return unauthorized(res);

    const scheduled = await delete_meeting_service(query, userId, req.body);

    if (scheduled.success) {
      return res.status(200).json({
        ...scheduled,
        status: 200,
      });
    }

    return res.status(400).json({
      ...scheduled,
      status: 400,
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
  schedule_meeting_controller,
  get_meeting_controller,
  delete_meeting_controller,
};