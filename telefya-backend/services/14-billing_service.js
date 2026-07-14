const PLAN_CODES = ["free", "pro", "business", "enterprise"];

const PLAN_DEFINITIONS = [
  {
    code: "free",
    name: "Free",
    description: "For individuals testing Telefya.",
    price_cents_monthly: 0,
    currency: "usd",
    interval: "month",
    max_meeting_minutes: 40,
    max_participants: 4,
    monthly_recording_minutes: 0,
    storage_gb: 0,
    recording_enabled: false,
    analytics_enabled: false,
    priority_support: false,
    sort_order: 1,
  },
  {
    code: "pro",
    name: "Pro",
    description: "For growing teams that need recording and longer calls.",
    price_cents_monthly: 800,
    currency: "usd",
    interval: "month",
    max_meeting_minutes: 300,
    max_participants: 50,
    monthly_recording_minutes: 500,
    storage_gb: 25,
    recording_enabled: true,
    analytics_enabled: true,
    priority_support: false,
    sort_order: 2,
  },
  {
    code: "business",
    name: "Business",
    description: "For organizations running larger meetings and events.",
    price_cents_monthly: 1600,
    currency: "usd",
    interval: "month",
    max_meeting_minutes: 720,
    max_participants: 100,
    monthly_recording_minutes: 2000,
    storage_gb: 100,
    recording_enabled: true,
    analytics_enabled: true,
    priority_support: true,
    sort_order: 3,
  },
  {
    code: "enterprise",
    name: "Enterprise",
    description: "Custom controls, support, and limits for large teams.",
    price_cents_monthly: null,
    currency: "usd",
    interval: "month",
    max_meeting_minutes: 1440,
    max_participants: 500,
    monthly_recording_minutes: 10000,
    storage_gb: 1000,
    recording_enabled: true,
    analytics_enabled: true,
    priority_support: true,
    sort_order: 4,
  },
];

function getUserId(reqUser) {
  return reqUser?.user || reqUser?.user_id || reqUser?.id || reqUser?.email;
}

function normalizePlan(row) {
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    price_cents_monthly: Number(row.price_cents_monthly || 0),
    currency: row.currency || "usd",
    interval: row.interval_unit || row.interval || "month",
    max_meeting_minutes: Number(row.max_meeting_minutes || 0),
    max_participants: Number(row.max_participants || 0),
    monthly_recording_minutes: Number(row.monthly_recording_minutes || 0),
    storage_gb: Number(row.storage_gb || 0),
    recording_enabled: Boolean(row.recording_enabled),
    analytics_enabled: Boolean(row.analytics_enabled),
    priority_support: Boolean(row.priority_support),
    sort_order: Number(row.sort_order || 0),
  };
}

function getStripePriceId(planCode) {
  const map = {
    free: process.env.STRIPE_PRICE_FREE,
    pro: process.env.STRIPE_PRICE_PRO,
    business: process.env.STRIPE_PRICE_BUSINESS,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };

  return map[planCode] || "";
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;

  try {
    const stripe = require("stripe");
    return stripe(process.env.STRIPE_SECRET_KEY);
  } catch {
    return null;
  }
}

function getCurrentUsagePeriod() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: periodStart.toISOString().slice(0, 10),
    end: periodEnd.toISOString().slice(0, 10),
  };
}

function toPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.ceil(parsed);
}

function bytesFromGb(gb) {
  return Number(gb || 0) * 1024 * 1024 * 1024;
}

async function ensure_billing_tables_service(db_query) {
  await db_query(`
    CREATE TABLE IF NOT EXISTS billing_plans (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      price_cents_monthly INT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'usd',
      interval_unit ENUM('month','year') NOT NULL DEFAULT 'month',
      max_meeting_minutes INT NOT NULL DEFAULT 40,
      max_participants INT NOT NULL DEFAULT 4,
      monthly_recording_minutes INT NOT NULL DEFAULT 0,
      storage_gb INT NOT NULL DEFAULT 0,
      recording_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      analytics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      priority_support BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await db_query(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL UNIQUE,
      plan_code VARCHAR(50) NOT NULL DEFAULT 'free',
      provider VARCHAR(50) NOT NULL DEFAULT 'manual',
      provider_customer_id VARCHAR(255) NULL,
      provider_subscription_id VARCHAR(255) NULL,
      provider_price_id VARCHAR(255) NULL,
      status ENUM('free','incomplete','trialing','active','past_due','unpaid','cancelled','expired') NOT NULL DEFAULT 'free',
      current_period_start DATETIME NULL,
      current_period_end DATETIME NULL,
      cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
      trial_ends_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_subscription_plan (plan_code),
      INDEX idx_subscription_status (status)
    );
  `);

  await db_query(`
    CREATE TABLE IF NOT EXISTS billing_usage_periods (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      meeting_minutes_used INT NOT NULL DEFAULT 0,
      recording_minutes_used INT NOT NULL DEFAULT 0,
      storage_bytes_used BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_usage_user_period (user_id, period_start, period_end)
    );
  `);

  await db_query(`
    CREATE TABLE IF NOT EXISTS billing_events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(100) NULL,
      provider VARCHAR(50) NOT NULL DEFAULT 'system',
      event_type VARCHAR(120) NOT NULL,
      provider_event_id VARCHAR(255) NULL UNIQUE,
      payload JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db_query(`
    CREATE TABLE IF NOT EXISTS billing_invoices (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
      provider_invoice_id VARCHAR(255) NULL UNIQUE,
      amount_cents INT NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'usd',
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      invoice_url TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await seed_billing_plans_service(db_query);
}

async function seed_billing_plans_service(db_query) {
  for (const plan of PLAN_DEFINITIONS) {
    await db_query(
      `
        INSERT INTO billing_plans
        (
          code,
          name,
          description,
          price_cents_monthly,
          currency,
          interval_unit,
          max_meeting_minutes,
          max_participants,
          monthly_recording_minutes,
          storage_gb,
          recording_enabled,
          analytics_enabled,
          priority_support,
          sort_order,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          price_cents_monthly = VALUES(price_cents_monthly),
          currency = VALUES(currency),
          interval_unit = VALUES(interval_unit),
          max_meeting_minutes = VALUES(max_meeting_minutes),
          max_participants = VALUES(max_participants),
          monthly_recording_minutes = VALUES(monthly_recording_minutes),
          storage_gb = VALUES(storage_gb),
          recording_enabled = VALUES(recording_enabled),
          analytics_enabled = VALUES(analytics_enabled),
          priority_support = VALUES(priority_support),
          sort_order = VALUES(sort_order),
          is_active = TRUE
      `,
      [
        plan.code,
        plan.name,
        plan.description,
        plan.price_cents_monthly,
        plan.currency,
        plan.interval,
        plan.max_meeting_minutes,
        plan.max_participants,
        plan.monthly_recording_minutes,
        plan.storage_gb,
        plan.recording_enabled ? 1 : 0,
        plan.analytics_enabled ? 1 : 0,
        plan.priority_support ? 1 : 0,
        plan.sort_order,
      ],
    );
  }
}

async function ensure_usage_period_service(db_query, userId) {
  await ensure_billing_tables_service(db_query);

  const { start, end } = getCurrentUsagePeriod();

  await db_query(
    `
      INSERT INTO billing_usage_periods
      (user_id, period_start, period_end)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE user_id = user_id
    `,
    [userId, start, end],
  );

  return { start, end };
}

async function list_billing_plans_service(db_query) {
  await ensure_billing_tables_service(db_query);

  const rows = await db_query(`
    SELECT *
    FROM billing_plans
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, price_cents_monthly ASC
  `);

  return {
    success: true,
    error: false,
    message: "Billing plans retrieved successfully.",
    data: rows.map(normalizePlan),
  };
}

async function ensure_free_subscription_service(db_query, userId) {
  await ensure_billing_tables_service(db_query);

  await db_query(
    `
      INSERT INTO user_subscriptions
      (user_id, plan_code, provider, status, current_period_start, current_period_end)
      VALUES (?, ?, 'system', 'free', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
      ON DUPLICATE KEY UPDATE
        user_id = user_id
    `,
    [userId, process.env.BILLING_FREE_PLAN || "free"],
  );
}

async function get_current_subscription_service(db_query, userId) {
  await ensure_free_subscription_service(db_query, userId);

  const rows = await db_query(
    `
      SELECT
        s.*,
        p.name AS plan_name,
        p.description AS plan_description,
        p.price_cents_monthly,
        p.currency,
        p.interval_unit,
        p.max_meeting_minutes,
        p.max_participants,
        p.monthly_recording_minutes,
        p.storage_gb,
        p.recording_enabled,
        p.analytics_enabled,
        p.priority_support
      FROM user_subscriptions s
      JOIN billing_plans p ON p.code = s.plan_code
      WHERE s.user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  const row = rows?.[0];

  return {
    success: true,
    error: false,
    message: "Billing subscription retrieved successfully.",
    data: {
      user_id: userId,
      plan_code: row.plan_code,
      plan_name: row.plan_name,
      status: row.status,
      provider: row.provider,
      current_period_start: row.current_period_start,
      current_period_end: row.current_period_end,
      cancel_at_period_end: Boolean(row.cancel_at_period_end),
      limits: {
        max_meeting_minutes: Number(row.max_meeting_minutes || 0),
        max_participants: Number(row.max_participants || 0),
        monthly_recording_minutes: Number(row.monthly_recording_minutes || 0),
        storage_gb: Number(row.storage_gb || 0),
        recording_enabled: Boolean(row.recording_enabled),
        analytics_enabled: Boolean(row.analytics_enabled),
        priority_support: Boolean(row.priority_support),
      },
    },
  };
}

async function activate_free_plan_service(db_query, userId) {
  await ensure_billing_tables_service(db_query);

  await db_query(
    `
      INSERT INTO user_subscriptions
      (user_id, plan_code, provider, status, current_period_start, current_period_end)
      VALUES (?, 'free', 'system', 'free', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
      ON DUPLICATE KEY UPDATE
        plan_code = 'free',
        provider = 'system',
        status = 'free',
        provider_price_id = NULL,
        current_period_start = NOW(),
        current_period_end = DATE_ADD(NOW(), INTERVAL 1 MONTH),
        cancel_at_period_end = FALSE
    `,
    [userId],
  );

  return get_current_subscription_service(db_query, userId);
}

async function create_checkout_session_service(db_query, userId, planCode) {
  await ensure_billing_tables_service(db_query);

  const code = String(planCode || "").toLowerCase();

  if (!PLAN_CODES.includes(code)) {
    return {
      success: false,
      error: true,
      message: "Invalid billing plan.",
    };
  }

  if (code === "free") {
    const subscription = await activate_free_plan_service(db_query, userId);

    return {
      success: true,
      error: false,
      message: "Free plan activated.",
      data: {
        url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing/success?plan=free`,
        subscription: subscription.data,
      },
    };
  }

  const priceId = getStripePriceId(code);
  const stripe = getStripeClient();

  if (!stripe || !priceId) {
    return {
      success: true,
      error: false,
      message:
        "Stripe is not configured yet. Billing checkout is ready for configuration.",
      data: {
        url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing/success?plan=${encodeURIComponent(code)}&mode=setup-required`,
        setupRequired: true,
      },
    };
  }

  const successUrl =
    process.env.BILLING_SUCCESS_URL ||
    `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing/success`;

  const cancelUrl =
    process.env.BILLING_CANCEL_URL ||
    `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing/cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      planCode: code,
    },
    subscription_data: {
      metadata: {
        userId,
        planCode: code,
      },
    },
  });

  await db_query(
    `
      INSERT INTO billing_events
      (user_id, provider, event_type, provider_event_id, payload)
      VALUES (?, 'stripe', 'checkout.session.created', ?, ?)
    `,
    [userId, session.id, JSON.stringify({ planCode: code })],
  ).catch(() => {});

  return {
    success: true,
    error: false,
    message: "Checkout session created.",
    data: {
      url: session.url,
      sessionId: session.id,
    },
  };
}

async function create_customer_portal_session_service(db_query, userId) {
  await ensure_free_subscription_service(db_query, userId);

  const rows = await db_query(
    `
      SELECT provider_customer_id
      FROM user_subscriptions
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  const customerId = rows?.[0]?.provider_customer_id;
  const stripe = getStripeClient();

  if (!stripe || !customerId) {
    return {
      success: true,
      error: false,
      message: "Billing portal is not configured yet.",
      data: {
        url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing`,
        setupRequired: true,
      },
    };
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing`,
  });

  return {
    success: true,
    error: false,
    message: "Billing portal session created.",
    data: {
      url: portal.url,
    },
  };
}

async function get_usage_summary_service(db_query, userId) {
  const { start, end } = await ensure_usage_period_service(db_query, userId);

  const rows = await db_query(
    `
      SELECT *
      FROM billing_usage_periods
      WHERE user_id = ?
      AND period_start = ?
      AND period_end = ?
      LIMIT 1
    `,
    [userId, start, end],
  );

  return {
    success: true,
    error: false,
    message: "Usage summary retrieved successfully.",
    data: rows?.[0] || {
      user_id: userId,
      period_start: start,
      period_end: end,
      meeting_minutes_used: 0,
      recording_minutes_used: 0,
      storage_bytes_used: 0,
    },
  };
}

async function add_meeting_usage_service(db_query, userId, minutes) {
  const safeMinutes = toPositiveInt(minutes);

  if (!userId || safeMinutes <= 0) {
    return {
      success: true,
      error: false,
      message: "No meeting usage to record.",
    };
  }

  const { start, end } = await ensure_usage_period_service(db_query, userId);

  await db_query(
    `
      UPDATE billing_usage_periods
      SET meeting_minutes_used = meeting_minutes_used + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
      AND period_start = ?
      AND period_end = ?
    `,
    [safeMinutes, userId, start, end],
  );

  await db_query(
    `
      INSERT INTO billing_events
      (user_id, provider, event_type, payload)
      VALUES (?, 'system', 'usage.meeting_minutes_added', ?)
    `,
    [
      userId,
      JSON.stringify({
        minutes: safeMinutes,
        period_start: start,
        period_end: end,
      }),
    ],
  ).catch(() => {});

  return get_usage_summary_service(db_query, userId);
}

async function add_recording_usage_service(db_query, userId, minutes) {
  const safeMinutes = toPositiveInt(minutes);

  if (!userId || safeMinutes <= 0) {
    return {
      success: true,
      error: false,
      message: "No recording usage to record.",
    };
  }

  const { start, end } = await ensure_usage_period_service(db_query, userId);

  await db_query(
    `
      UPDATE billing_usage_periods
      SET recording_minutes_used = recording_minutes_used + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
      AND period_start = ?
      AND period_end = ?
    `,
    [safeMinutes, userId, start, end],
  );

  await db_query(
    `
      INSERT INTO billing_events
      (user_id, provider, event_type, payload)
      VALUES (?, 'system', 'usage.recording_minutes_added', ?)
    `,
    [
      userId,
      JSON.stringify({
        minutes: safeMinutes,
        period_start: start,
        period_end: end,
      }),
    ],
  ).catch(() => {});

  return get_usage_summary_service(db_query, userId);
}

async function add_storage_usage_service(db_query, userId, bytes) {
  const safeBytes = toPositiveInt(bytes);

  if (!userId || safeBytes <= 0) {
    return {
      success: true,
      error: false,
      message: "No storage usage to record.",
    };
  }

  const { start, end } = await ensure_usage_period_service(db_query, userId);

  await db_query(
    `
      UPDATE billing_usage_periods
      SET storage_bytes_used = storage_bytes_used + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
      AND period_start = ?
      AND period_end = ?
    `,
    [safeBytes, userId, start, end],
  );

  await db_query(
    `
      INSERT INTO billing_events
      (user_id, provider, event_type, payload)
      VALUES (?, 'system', 'usage.storage_bytes_added', ?)
    `,
    [
      userId,
      JSON.stringify({
        bytes: safeBytes,
        period_start: start,
        period_end: end,
      }),
    ],
  ).catch(() => {});

  return get_usage_summary_service(db_query, userId);
}

async function add_recording_asset_usage_service(db_query, userId, data = {}) {
  const minutes =
    data.duration_seconds != null
      ? Math.ceil(Number(data.duration_seconds || 0) / 60)
      : data.duration_minutes;

  await add_recording_usage_service(db_query, userId, minutes);
  return add_storage_usage_service(db_query, userId, data.size_bytes || 0);
}

async function get_usage_entitlement_service(db_query, userId) {
  const [subscription, usage] = await Promise.all([
    get_current_subscription_service(db_query, userId),
    get_usage_summary_service(db_query, userId),
  ]);

  const limits = subscription.data?.limits || {};
  const usageData = usage.data || {};

  const recordingLimit = Number(limits.monthly_recording_minutes || 0);
  const storageLimitBytes = bytesFromGb(limits.storage_gb || 0);

  return {
    success: true,
    error: false,
    message: "Billing entitlement retrieved successfully.",
    data: {
      subscription: subscription.data,
      usage: usageData,
      remaining: {
        recording_minutes:
          recordingLimit > 0
            ? Math.max(
                0,
                recordingLimit - Number(usageData.recording_minutes_used || 0),
              )
            : 0,
        storage_bytes:
          storageLimitBytes > 0
            ? Math.max(
                0,
                storageLimitBytes - Number(usageData.storage_bytes_used || 0),
              )
            : 0,
      },
      exceeded: {
        recording_minutes:
          recordingLimit > 0
            ? Number(usageData.recording_minutes_used || 0) >= recordingLimit
            : !Boolean(limits.recording_enabled),
        storage:
          storageLimitBytes > 0
            ? Number(usageData.storage_bytes_used || 0) >= storageLimitBytes
            : Number(usageData.storage_bytes_used || 0) > 0,
      },
    },
  };
}

async function sync_stripe_webhook_service(db_query, event) {
  await ensure_billing_tables_service(db_query);

  await db_query(
    `
      INSERT INTO billing_events
      (user_id, provider, event_type, provider_event_id, payload)
      VALUES (?, 'stripe', ?, ?, ?)
      ON DUPLICATE KEY UPDATE provider_event_id = provider_event_id
    `,
    [
      event?.data?.object?.metadata?.userId || null,
      event.type,
      event.id,
      JSON.stringify(event),
    ],
  ).catch(() => {});

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata?.userId;
    const planCode = session.metadata?.planCode;

    if (userId && planCode) {
      await db_query(
        `
          INSERT INTO user_subscriptions
          (
            user_id,
            plan_code,
            provider,
            provider_customer_id,
            provider_subscription_id,
            status,
            current_period_start,
            current_period_end
          )
          VALUES (?, ?, 'stripe', ?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
          ON DUPLICATE KEY UPDATE
            plan_code = VALUES(plan_code),
            provider = 'stripe',
            provider_customer_id = VALUES(provider_customer_id),
            provider_subscription_id = VALUES(provider_subscription_id),
            status = 'active',
            current_period_start = NOW(),
            current_period_end = DATE_ADD(NOW(), INTERVAL 1 MONTH)
        `,
        [userId, planCode, session.customer || null, session.subscription || null],
      );
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.paused"
  ) {
    const subscription = event.data.object;

    await db_query(
      `
        UPDATE user_subscriptions
        SET status = 'cancelled',
            plan_code = 'free',
            cancel_at_period_end = FALSE
        WHERE provider_subscription_id = ?
      `,
      [subscription.id],
    );
  }

  if (
    event.type === "invoice.payment_failed" ||
    event.type === "customer.subscription.updated"
  ) {
    const object = event.data.object;

    if (object?.id) {
      const status =
        object.status === "active" || object.status === "trialing"
          ? object.status
          : object.status === "past_due"
            ? "past_due"
            : null;

      if (status) {
        await db_query(
          `
            UPDATE user_subscriptions
            SET status = ?
            WHERE provider_subscription_id = ?
          `,
          [status, object.id],
        );
      }
    }
  }

  return {
    success: true,
    error: false,
    message: "Webhook processed.",
  };
}

module.exports = {
  ensure_billing_tables_service,
  seed_billing_plans_service,
  list_billing_plans_service,
  get_current_subscription_service,
  activate_free_plan_service,
  create_checkout_session_service,
  create_customer_portal_session_service,
  get_usage_summary_service,
  add_meeting_usage_service,
  add_recording_usage_service,
  add_storage_usage_service,
  add_recording_asset_usage_service,
  get_usage_entitlement_service,
  sync_stripe_webhook_service,
  getUserId,
};