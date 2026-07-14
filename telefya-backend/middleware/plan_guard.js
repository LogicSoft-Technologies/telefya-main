const { query } = require("../config/db");
const {
  getUserId,
  get_current_subscription_service,
} = require("../services/14-billing_service");

function requireFeature(featureName) {
  return async (req, res, next) => {
    try {
      const userId = getUserId(req.user);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "Unauthorized.",
          status: 401,
        });
      }

      const result = await get_current_subscription_service(query, userId);
      const subscription = result.data;
      const enabled = Boolean(subscription?.limits?.[featureName]);

      if (!enabled) {
        return res.status(402).json({
          success: false,
          error: true,
          message: "Your current plan does not include this feature.",
          status: 402,
          data: {
            feature: featureName,
            plan: subscription?.plan_code,
          },
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: true,
        message: error?.message || "Unable to verify plan access.",
        status: 500,
      });
    }
  };
}

function attachSubscription() {
  return async (req, res, next) => {
    try {
      const userId = getUserId(req.user);

      if (userId) {
        const result = await get_current_subscription_service(query, userId);
        req.subscription = result.data;
      }

      next();
    } catch {
      next();
    }
  };
}

module.exports = {
  requireFeature,
  attachSubscription,
};