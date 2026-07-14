const { query } = require("../config/db");
const {
  getUserId,
  list_billing_plans_service,
  get_current_subscription_service,
  create_checkout_session_service,
  create_customer_portal_session_service,
  get_usage_summary_service,
  sync_stripe_webhook_service,
} = require("../services/14-billing_service");

function unauthorized(res) {
  return res.status(401).json({
    success: false,
    error: true,
    message: "Unauthorized.",
    status: 401,
  });
}

function ok(res, result, status = 200) {
  return res.status(status).json({
    ...result,
    status,
  });
}

function fail(res, error) {
  return res.status(500).json({
    success: false,
    error: true,
    message: error?.message || "Internal server error",
    status: 500,
  });
}

const list_billing_plans_controller = async (req, res) => {
  try {
    return ok(res, await list_billing_plans_service(query));
  } catch (error) {
    return fail(res, error);
  }
};

const get_current_subscription_controller = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    if (!userId) return unauthorized(res);

    return ok(res, await get_current_subscription_service(query, userId));
  } catch (error) {
    return fail(res, error);
  }
};

const create_checkout_session_controller = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    if (!userId) return unauthorized(res);

    const result = await create_checkout_session_service(
      query,
      userId,
      req.body?.planCode || req.body?.plan_code,
    );

    return ok(res, result, result.success ? 200 : 400);
  } catch (error) {
    return fail(res, error);
  }
};

const create_customer_portal_session_controller = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    if (!userId) return unauthorized(res);

    return ok(res, await create_customer_portal_session_service(query, userId));
  } catch (error) {
    return fail(res, error);
  }
};

const get_usage_summary_controller = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    if (!userId) return unauthorized(res);

    return ok(res, await get_usage_summary_service(query, userId));
  } catch (error) {
    return fail(res, error);
  }
};

const stripe_webhook_controller = async (req, res) => {
  try {
    let event = req.body;

    if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const signature = req.headers["stripe-signature"];

        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `Webhook signature verification failed: ${error.message}`,
          status: 400,
        });
      }
    } else if (Buffer.isBuffer(req.body)) {
      try {
        event = JSON.parse(req.body.toString("utf8"));
      } catch {
        event = {};
      }
    }

    return ok(res, await sync_stripe_webhook_service(query, event));
  } catch (error) {
    return fail(res, error);
  }
};

module.exports = {
  list_billing_plans_controller,
  get_current_subscription_controller,
  create_checkout_session_controller,
  create_customer_portal_session_controller,
  get_usage_summary_controller,
  stripe_webhook_controller,
};