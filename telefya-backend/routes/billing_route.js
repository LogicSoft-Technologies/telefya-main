const express = require("express");
const auth_middleware = require("../middleware/auth_middleware");

const {
  list_billing_plans_controller,
  get_current_subscription_controller,
  create_checkout_session_controller,
  create_customer_portal_session_controller,
  get_usage_summary_controller,
} = require("../controllers/14-billing_controller");

const billing_router = express.Router();

billing_router.get("/plans", list_billing_plans_controller);
billing_router.get("/current", auth_middleware, get_current_subscription_controller);
billing_router.get("/usage", auth_middleware, get_usage_summary_controller);
billing_router.post("/checkout", auth_middleware, create_checkout_session_controller);
billing_router.post("/portal", auth_middleware, create_customer_portal_session_controller);

module.exports = billing_router;