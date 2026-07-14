const list_admin_users_service = async (db_query) => {
  const users = await db_query(`
    SELECT
      user_id,
      first_name,
      last_name,
      email,
      phone_number,
      role,
      country,
      state,
      city,
      is_verified,
      created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 500
  `);

  return {
    success: true,
    message: "Users retrieved successfully.",
    data: users,
  };
};

const get_branding_service = async (db_query, userId) => {
  const rows = await db_query(
    `
      SELECT *
      FROM workspace_branding
      WHERE owner_user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return {
    success: true,
    message: "Branding retrieved successfully.",
    data:
      rows[0] || {
        workspace_name: "Telefya Workspace",
        primary_color: "#0f6bff",
        accent_color: "#20c997",
        logo_url: null,
      },
  };
};

const save_branding_service = async (db_query, userId, payload) => {
  const workspaceName = payload.workspace_name || "Telefya Workspace";
  const primaryColor = payload.primary_color || "#0f6bff";
  const accentColor = payload.accent_color || "#20c997";
  const logoUrl = payload.logo_url || null;

  await db_query(
    `
      INSERT INTO workspace_branding
      (owner_user_id, workspace_name, primary_color, accent_color, logo_url)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        workspace_name = VALUES(workspace_name),
        primary_color = VALUES(primary_color),
        accent_color = VALUES(accent_color),
        logo_url = VALUES(logo_url)
    `,
    [userId, workspaceName, primaryColor, accentColor, logoUrl]
  );

  return get_branding_service(db_query, userId);
};

const get_speaker_status_service = async (db_query, userId) => {
  const rows = await db_query(
    `
      SELECT *
      FROM speaker_statuses
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return {
    success: true,
    message: "Speaker status retrieved successfully.",
    data:
      rows[0] || {
        user_id: userId,
        is_ready: false,
        approval_status: "pending",
        notes: null,
      },
  };
};

const save_speaker_status_service = async (db_query, userId, payload) => {
  await db_query(
    `
      INSERT INTO speaker_statuses
      (user_id, is_ready, approval_status, notes)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_ready = VALUES(is_ready),
        approval_status = VALUES(approval_status),
        notes = VALUES(notes)
    `,
    [
      userId,
      Boolean(payload.is_ready),
      payload.approval_status || "pending",
      payload.notes || null,
    ]
  );

  return get_speaker_status_service(db_query, userId);
};

const list_speaker_materials_service = async (db_query, userId) => {
  const rows = await db_query(
    `
      SELECT *
      FROM speaker_materials
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return {
    success: true,
    message: "Speaker materials retrieved successfully.",
    data: rows,
  };
};

const create_speaker_material_service = async (db_query, userId, payload) => {
  const result = await db_query(
    `
      INSERT INTO speaker_materials
      (user_id, title, file_url, file_name, file_type)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      userId,
      payload.title || payload.file_name || "Speaker material",
      payload.file_url,
      payload.file_name || null,
      payload.file_type || null,
    ]
  );

  return {
    success: true,
    message: "Speaker material saved successfully.",
    data: {
      id: result.insertId,
    },
  };
};

const list_attendee_networking_service = async (db_query, userId) => {
  const rows = await db_query(
    `
      SELECT
        user_id,
        first_name,
        last_name,
        email,
        country,
        state,
        city
      FROM users
      WHERE user_id <> ?
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [userId]
  );

  return {
    success: true,
    message: "Networking attendees retrieved successfully.",
    data: rows,
  };
};

const list_certificates_service = async (db_query, userId) => {
  const rows = await db_query(
    `
      SELECT *
      FROM attendee_certificates
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return {
    success: true,
    message: "Certificates retrieved successfully.",
    data: rows,
  };
};

const generate_certificate_service = async (db_query, userId, payload) => {
  const certificateCode = `TELF-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  const result = await db_query(
    `
      INSERT INTO attendee_certificates
      (user_id, meeting_id, certificate_code, title, issued_at)
      VALUES (?, ?, ?, ?, NOW())
    `,
    [
      userId,
      payload.meeting_id || null,
      certificateCode,
      payload.title || "Telefya Attendance Certificate",
    ]
  );

  return {
    success: true,
    message: "Certificate generated successfully.",
    data: {
      id: result.insertId,
      certificate_code: certificateCode,
    },
  };
};

const get_billing_overview_service = async (db_query, userId) => {
  const rows = await db_query(
    `
      SELECT *
      FROM billing_profiles
      WHERE owner_user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return {
    success: true,
    message: "Billing overview retrieved successfully.",
    data:
      rows[0] || {
        plan_name: "Free",
        billing_status: "inactive",
        seats: 1,
        renews_at: null,
      },
  };
};

module.exports = {
  list_admin_users_service,
  get_branding_service,
  save_branding_service,
  get_speaker_status_service,
  save_speaker_status_service,
  list_speaker_materials_service,
  create_speaker_material_service,
  list_attendee_networking_service,
  list_certificates_service,
  generate_certificate_service,
  get_billing_overview_service,
};