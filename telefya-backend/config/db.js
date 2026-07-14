// backend/config/db.js
const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool({
  connectionLimit: parseInt(process.env.CONNECTION_LIMIT, 10),
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

function closePool() {
  return new Promise((resolve, reject) => {
    pool.end((err) => {
      if (err) return reject(err);
      console.log("MySQL pool closed");
      resolve();
    });
  });
}

const createDB = async () => {
  try {
    const initConnection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    initConnection.connect((err) => {
      if (err) {
        console.log("Initial connection error:", err);
        return false;
      }

      initConnection.query(
        `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`,
        (err) => {
          if (err) {
            console.log("Database creation error:", err);
            initConnection.end();
            return false;
          }

          console.log("Database created or already exists");
          pool.config.connectionConfig.database = process.env.DB_NAME;
          initConnection.end();
        },
      );
    });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

function query(sql, args) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) return reject(err);

      connection.query(sql, args, (err, rows) => {
        connection.release();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  });
}

const createUsersTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone_number VARCHAR(30) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  role ENUM('Admin','SuperAdmin', 'Marketer', 'Instructor','Student', 'User') NOT NULL DEFAULT 'User',
  country VARCHAR(120),
  state VARCHAR(120),
  city VARCHAR(120),
  profile_image VARCHAR(255),
  email_verified_at TIMESTAMP NULL,
  email_verification_token VARCHAR(255),
  verification_otp VARCHAR(10),
  is_verified BOOLEAN DEFAULT FALSE,
  remember_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createMeetingAttendanceTableQuery = `
CREATE TABLE IF NOT EXISTS meeting_attendance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(120) NOT NULL,
  meeting_id BIGINT NULL,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(255),
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME NULL,
  duration_minutes INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_attendance_room (room_id),
  INDEX idx_attendance_user (user_id),
  INDEX idx_attendance_joined_at (joined_at)
);
`;

const createRefreshTableQuery = `
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  token_hash VARCHAR(512) UNIQUE NOT NULL,
  ip_address VARCHAR(20),
  user_agent VARCHAR(225),
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
`;

const createStudentsTableQuery = `
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  course VARCHAR(100) NOT NULL,
  discount_received BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const createOtpsTableQuery = `
CREATE TABLE IF NOT EXISTS otps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user BIGINT NOT NULL,
  otp VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE
);
`;

const createMeetingRecordTableQuery = `
CREATE TABLE IF NOT EXISTS meeting_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(120) UNIQUE NOT NULL,
  meeting_participant JSON,
  presenter JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_meeting_id (room_id)
);
`;

const createMeetingRecordingsTableQuery = `
CREATE TABLE IF NOT EXISTS meeting_recordings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recording_id VARCHAR(100) UNIQUE NOT NULL,
  room_id VARCHAR(255) NOT NULL,
  meeting_id BIGINT NULL,
  host_user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NULL,
  status ENUM('recording','processing','ready','failed','expired','deleted') NOT NULL DEFAULT 'recording',
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  file_name VARCHAR(255) NULL,
  file_path TEXT NULL,
  mime_type VARCHAR(100) DEFAULT 'video/mp4',
  size_bytes BIGINT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  started_at DATETIME NULL,
  stopped_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room_id (room_id),
  INDEX idx_host_user_id (host_user_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
);
`;

const createWorkspaceBrandingTableQuery = `
CREATE TABLE IF NOT EXISTS workspace_branding (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_user_id VARCHAR(100) NOT NULL UNIQUE,
  workspace_name VARCHAR(255) NOT NULL DEFAULT 'Telefya Workspace',
  primary_color VARCHAR(20) NOT NULL DEFAULT '#0f6bff',
  accent_color VARCHAR(20) NOT NULL DEFAULT '#20c997',
  logo_url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createSpeakerStatusesTableQuery = `
CREATE TABLE IF NOT EXISTS speaker_statuses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL UNIQUE,
  is_ready BOOLEAN DEFAULT FALSE,
  approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createSpeakerMaterialsTableQuery = `
CREATE TABLE IF NOT EXISTS speaker_materials (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NULL,
  file_name VARCHAR(255) NULL,
  file_type VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createAttendeeCertificatesTableQuery = `
CREATE TABLE IF NOT EXISTS attendee_certificates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  meeting_id BIGINT NULL,
  certificate_code VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NULL,
  issued_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createBillingProfilesTableQuery = `
CREATE TABLE IF NOT EXISTS billing_profiles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_user_id VARCHAR(100) NOT NULL UNIQUE,
  plan_name VARCHAR(100) DEFAULT 'Free',
  billing_status ENUM('inactive','active','past_due','cancelled') DEFAULT 'inactive',
  seats INT DEFAULT 1,
  renews_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createBillingPlansTableQuery = `
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_billing_plans_code (code),
  INDEX idx_billing_plans_active (is_active)
);
`;

const createUserSubscriptionsTableQuery = `
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
  INDEX idx_subscription_status (status),
  INDEX idx_subscription_provider_customer (provider_customer_id),
  INDEX idx_subscription_provider_subscription (provider_subscription_id)
);
`;

const createBillingUsagePeriodsTableQuery = `
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
  UNIQUE KEY uniq_usage_user_period (user_id, period_start, period_end),
  INDEX idx_usage_user (user_id)
);
`;

const createBillingEventsTableQuery = `
CREATE TABLE IF NOT EXISTS billing_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'system',
  event_type VARCHAR(120) NOT NULL,
  provider_event_id VARCHAR(255) NULL UNIQUE,
  payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_billing_events_user (user_id),
  INDEX idx_billing_events_type (event_type)
);
`;

const createBillingInvoicesTableQuery = `
CREATE TABLE IF NOT EXISTS billing_invoices (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
  provider_invoice_id VARCHAR(255) NULL UNIQUE,
  amount_cents INT NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  invoice_url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_billing_invoices_user (user_id),
  INDEX idx_billing_invoices_status (status)
);
`;

const createMeetingVideoRecord = `
CREATE TABLE IF NOT EXISTS video_recordings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id CHAR(120) UNIQUE NOT NULL,
  host_id VARCHAR(255) NOT NULL,
  host_name VARCHAR(255) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration INT,
  file_path TEXT,
  file_name VARCHAR(255),
  file_size BIGINT,
  thumbnail_path TEXT,
  s3_url TEXT,
  status VARCHAR(50) DEFAULT 'recording',
  recording_type VARCHAR(20),
  quality VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES meeting_records(room_id) ON DELETE CASCADE
);
`;

const recordMeetingParticipants = `
CREATE TABLE IF NOT EXISTS recording_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recording_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  joined_at DATETIME NOT NULL,
  left_at DATETIME,
  FOREIGN KEY (recording_id) REFERENCES video_recordings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createMeetingScheduelTableQuery = `
CREATE TABLE IF NOT EXISTS meeting_schedules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  meeting_url VARCHAR(220) NOT NULL,
  des VARCHAR(220),
  shedular_user_id VARCHAR(50) NOT NULL,
  time_zone VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_schedular_id (shedular_user_id),
  FOREIGN KEY (shedular_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
`;

const seedBillingPlansQuery = `
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
VALUES
('free', 'Free', 'For individuals testing Telefya.', 0, 'usd', 'month', 40, 4, 0, 0, FALSE, FALSE, FALSE, 1, TRUE),
('pro', 'Pro', 'For growing teams that need recording and longer calls.', 800, 'usd', 'month', 300, 50, 500, 25, TRUE, TRUE, FALSE, 2, TRUE),
('business', 'Business', 'For organizations running larger meetings and events.', 1600, 'usd', 'month', 720, 100, 2000, 100, TRUE, TRUE, TRUE, 3, TRUE),
('enterprise', 'Enterprise', 'Custom controls, support, and limits for large teams.', NULL, 'usd', 'month', 1440, 500, 10000, 1000, TRUE, TRUE, TRUE, 4, TRUE)
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
  is_active = VALUES(is_active);
`;

async function createUsersTable() {
  try {
    await query(createUsersTableQuery);
    console.log("Users table created successfully");
  } catch (error) {
    console.error("Error creating Users table:", error);
  }
}

async function createSchedularTable() {
  try {
    await query(createMeetingScheduelTableQuery);
    console.log("meeting_schedules table created successfully");
  } catch (error) {
    console.error("Error creating meeting_schedules table:", error);
  }
}

async function createRefreshTable() {
  try {
    await query(createRefreshTableQuery);
    console.log("Session table created successfully");
  } catch (error) {
    console.error("Error creating Session table:", error);
  }
}

async function createStudentsTable() {
  try {
    await query(createStudentsTableQuery);
    console.log("Students table created successfully");
  } catch (error) {
    console.error("Error creating Students table:", error);
  }
}

async function createOtpsTable() {
  try {
    await query(createOtpsTableQuery);
    console.log("OTPs table created successfully");
  } catch (error) {
    console.error("Error creating OTPs table:", error);
  }
}

async function createMeetingRecordsTable() {
  try {
    await query(createMeetingRecordTableQuery);
    console.log("meeting record table created successfully");
  } catch (error) {
    console.error("Error creating meeting table:", error);
  }
}

async function createMeetingRecordingsTable() {
  try {
    await query(createMeetingRecordingsTableQuery);
    console.log("meeting_recordings table created successfully");
  } catch (error) {
    console.error("Error creating meeting_recordings table:", error);
  }
}

async function createMeetingAttendanceTable() {
  try {
    await query(createMeetingAttendanceTableQuery);
    console.log("meeting_attendance table created successfully");
  } catch (error) {
    console.error("Error creating meeting attendance table:", error);
  }
}

async function createMeetingVideoRecordTable() {
  try {
    await query(createMeetingVideoRecord);
    await query(recordMeetingParticipants);
    console.log(
      "video_recordings and recording_participants tables created successfully",
    );
  } catch (error) {
    console.error("Error creating meeting video record table:", error);
  }
}

async function createWorkspaceFeatureTables() {
  try {
    await query(createWorkspaceBrandingTableQuery);
    console.log("workspace_branding table created successfully");

    await query(createSpeakerStatusesTableQuery);
    console.log("speaker_statuses table created successfully");

    await query(createSpeakerMaterialsTableQuery);
    console.log("speaker_materials table created successfully");

    await query(createAttendeeCertificatesTableQuery);
    console.log("attendee_certificates table created successfully");

    await query(createBillingProfilesTableQuery);
    console.log("billing_profiles table created successfully");
  } catch (error) {
    console.error("Error creating workspace feature tables:", error);
  }
}

async function createBillingTables() {
  try {
    await query(createBillingPlansTableQuery);
    console.log("billing_plans table created successfully");

    await query(createUserSubscriptionsTableQuery);
    console.log("user_subscriptions table created successfully");

    await query(createBillingUsagePeriodsTableQuery);
    console.log("billing_usage_periods table created successfully");

    await query(createBillingEventsTableQuery);
    console.log("billing_events table created successfully");

    await query(createBillingInvoicesTableQuery);
    console.log("billing_invoices table created successfully");

    await query(seedBillingPlansQuery);
    console.log("billing plans seeded successfully");
  } catch (error) {
    console.error("Error creating billing tables:", error);
  }
}

const creeateDBandTables = async () => {
  const hasDB = await createDB();

  if (hasDB) {
    setTimeout(async () => {
      await createUsersTable();
      await createSchedularTable();
      await createRefreshTable();
      await createStudentsTable();
      await createOtpsTable();
      await createMeetingRecordsTable();
      await createMeetingVideoRecordTable();
      await createMeetingAttendanceTable();
      await createMeetingRecordingsTable();
      await createWorkspaceFeatureTables();
      await createBillingTables();
    }, 5);
  }
};

module.exports = { creeateDBandTables, closePool, query };