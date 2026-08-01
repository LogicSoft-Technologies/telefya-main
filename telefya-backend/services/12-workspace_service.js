const crypto = require("crypto");

function cleanString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function isValidMemberRole(value) {
  return value === "speaker" || value === "attendee";
}

function isActiveMemberStatus(status) {
  return status === "invited" || status === "accepted";
}

async function getOwnedMeeting(db_query, meetingId, hostUserId) {
  const rows = await db_query(
    `
      SELECT
        id,
        room_id,
        meeting_url,
        des,
        shedular_user_id,
        scheduled_for,
        status
      FROM meeting_schedules
      WHERE id = ?
        AND shedular_user_id = ?
      LIMIT 1
    `,
    [meetingId, hostUserId],
  );

  return rows?.[0] || null;
}

async function getMeetingMember(
  db_query,
  meetingId,
  userId,
  role,
  allowedStatuses = ["accepted"],
) {
  const conditions = [
    "meeting_id = ?",
    "user_id = ?",
  ];

  const values = [meetingId, userId];

  if (role) {
    conditions.push("member_role = ?");
    values.push(role);
  }

  if (allowedStatuses.length) {
    conditions.push(
      `status IN (${allowedStatuses.map(() => "?").join(", ")})`,
    );

    values.push(...allowedStatuses);
  }

  const rows = await db_query(
    `
      SELECT *
      FROM meeting_members
      WHERE ${conditions.join(" AND ")}
      LIMIT 1
    `,
    values,
  );

  return rows?.[0] || null;
}

async function listMemberMeetingsService(
  db_query,
  userId,
  memberRole,
) {
  const rows = await db_query(
    `
      SELECT
        m.id,
        m.room_id,
        m.meeting_url,
        m.des,
        m.shedular_user_id,
        m.time_zone,
        m.scheduled_for,
        m.status,
        m.started_at,
        m.ended_at,
        m.created_at,
        m.updated_at,
        mm.id AS membership_id,
        mm.member_role,
        mm.status AS member_status,
        mm.invited_at,
        mm.responded_at,
        CONCAT_WS(
          ' ',
          host.first_name,
          host.last_name
        ) AS host_name
      FROM meeting_members mm
      INNER JOIN meeting_schedules m
        ON m.id = mm.meeting_id
      LEFT JOIN users host
        ON host.user_id = m.shedular_user_id
      WHERE mm.user_id = ?
        AND mm.member_role = ?
        AND mm.status IN ('invited', 'accepted')
        AND m.status IN ('upcoming', 'live')
      ORDER BY
        CASE m.status
          WHEN 'live' THEN 0
          WHEN 'upcoming' THEN 1
          ELSE 2
        END,
        m.scheduled_for ASC
    `,
    [userId, memberRole],
  );

  return {
    success: true,
    message: "Assigned meetings retrieved successfully.",
    data: rows || [],
  };
}

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
    [userId],
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

const save_branding_service = async (db_query, userId, payload = {}) => {
  const workspaceName =
    cleanString(payload.workspace_name) || "Telefya Workspace";
  const primaryColor =
    cleanString(payload.primary_color) || "#0f6bff";
  const accentColor =
    cleanString(payload.accent_color) || "#20c997";
  const logoUrl = cleanString(payload.logo_url) || null;

  await db_query(
    `
      INSERT INTO workspace_branding
      (
        owner_user_id,
        workspace_name,
        primary_color,
        accent_color,
        logo_url
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        workspace_name = VALUES(workspace_name),
        primary_color = VALUES(primary_color),
        accent_color = VALUES(accent_color),
        logo_url = VALUES(logo_url)
    `,
    [userId, workspaceName, primaryColor, accentColor, logoUrl],
  );

  return get_branding_service(db_query, userId);
};

const list_meeting_members_service = async (
  db_query,
  hostUserId,
  meetingId,
) => {
  const meeting = await getOwnedMeeting(
    db_query,
    meetingId,
    hostUserId,
  );

  if (!meeting) {
    throw new Error("Meeting not found or access denied.");
  }

  const rows = await db_query(
    `
      SELECT
        mm.id,
        mm.meeting_id,
        mm.user_id,
        mm.member_role,
        mm.status,
        mm.invited_at,
        mm.responded_at,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_image
      FROM meeting_members mm
      INNER JOIN users u
        ON u.user_id = mm.user_id
      WHERE mm.meeting_id = ?
        AND mm.status <> 'removed'
      ORDER BY
        CASE mm.member_role
          WHEN 'speaker' THEN 0
          ELSE 1
        END,
        mm.invited_at DESC
    `,
    [meeting.id],
  );

  return {
    success: true,
    message: "Meeting members retrieved successfully.",
    data: {
      meeting,
      members: rows || [],
    },
  };
};

const invite_meeting_member_service = async (
  db_query,
  hostUserId,
  meetingId,
  payload = {},
) => {
  const meeting = await getOwnedMeeting(
    db_query,
    meetingId,
    hostUserId,
  );

  if (!meeting) {
    throw new Error("Meeting not found or access denied.");
  }

  const email = normalizeEmail(payload.email);
  const memberRole = cleanString(payload.member_role);

  if (!email) {
    throw new Error("Enter the email address of the person to invite.");
  }

  if (!isValidMemberRole(memberRole)) {
    throw new Error("Choose either speaker or attendee.");
  }

  const users = await db_query(
    `
      SELECT
        user_id,
        first_name,
        last_name,
        email
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
    `,
    [email],
  );

  const invitedUser = users?.[0];

  if (!invitedUser) {
    throw new Error(
      "No Telefya account was found for that email address.",
    );
  }

  if (String(invitedUser.user_id) === String(hostUserId)) {
    throw new Error("The meeting host cannot invite themselves.");
  }

  await db_query(
    `
      INSERT INTO meeting_members
      (
        meeting_id,
        user_id,
        member_role,
        status,
        invited_by_user_id,
        invited_at,
        responded_at
      )
      VALUES (?, ?, ?, 'invited', ?, NOW(), NULL)
      ON DUPLICATE KEY UPDATE
        member_role = VALUES(member_role),
        status = 'invited',
        invited_by_user_id = VALUES(invited_by_user_id),
        invited_at = NOW(),
        responded_at = NULL
    `,
    [
      meeting.id,
      invitedUser.user_id,
      memberRole,
      hostUserId,
    ],
  );

  return {
    success: true,
    message: "Invitation sent successfully.",
    data: {
      meeting_id: meeting.id,
      user_id: invitedUser.user_id,
      email: invitedUser.email,
      member_role: memberRole,
      status: "invited",
    },
  };
};

const remove_meeting_member_service = async (
  db_query,
  hostUserId,
  meetingId,
  memberId,
) => {
  const meeting = await getOwnedMeeting(
    db_query,
    meetingId,
    hostUserId,
  );

  if (!meeting) {
    throw new Error("Meeting not found or access denied.");
  }

  const result = await db_query(
    `
      UPDATE meeting_members
      SET status = 'removed',
          responded_at = NOW()
      WHERE id = ?
        AND meeting_id = ?
        AND status <> 'removed'
    `,
    [memberId, meeting.id],
  );

  if (!result.affectedRows) {
    throw new Error("Meeting member was not found.");
  }

  return {
    success: true,
    message: "Meeting member removed.",
    data: {
      id: Number(memberId),
      meeting_id: meeting.id,
      status: "removed",
    },
  };
};

const respond_to_meeting_invite_service = async (
  db_query,
  userId,
  memberId,
  payload = {},
) => {
  const status = cleanString(payload.status);

  if (status !== "accepted" && status !== "declined") {
    throw new Error("Choose accepted or declined.");
  }

  const result = await db_query(
    `
      UPDATE meeting_members
      SET status = ?,
          responded_at = NOW()
      WHERE id = ?
        AND user_id = ?
        AND status = 'invited'
    `,
    [status, memberId, userId],
  );

  if (!result.affectedRows) {
    throw new Error("Invitation not found or already handled.");
  }

  return {
    success: true,
    message:
      status === "accepted"
        ? "Invitation accepted."
        : "Invitation declined.",
    data: {
      id: Number(memberId),
      status,
    },
  };
};

const list_speaker_meetings_service = async (db_query, userId) =>
  listMemberMeetingsService(db_query, userId, "speaker");

const list_attendee_meetings_service = async (db_query, userId) =>
  listMemberMeetingsService(db_query, userId, "attendee");

const get_speaker_status_service = async (
  db_query,
  userId,
  meetingId,
) => {
  const member = await getMeetingMember(
    db_query,
    meetingId,
    userId,
    "speaker",
  );

  if (!member) {
    throw new Error("You are not assigned as a speaker for this meeting.");
  }

  const rows = await db_query(
    `
      SELECT
        meeting_id,
        user_id,
        is_ready,
        notes,
        created_at,
        updated_at
      FROM meeting_speaker_statuses
      WHERE meeting_id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [meetingId, userId],
  );

  return {
    success: true,
    message: "Speaker status retrieved successfully.",
    data:
      rows?.[0] || {
        meeting_id: Number(meetingId),
        user_id: userId,
        is_ready: false,
        notes: "",
      },
  };
};

const save_speaker_status_service = async (
  db_query,
  userId,
  payload = {},
) => {
  const meetingId = Number(payload.meeting_id);

  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    throw new Error("A valid meeting is required.");
  }

  const member = await getMeetingMember(
    db_query,
    meetingId,
    userId,
    "speaker",
  );

  if (!member) {
    throw new Error("You are not assigned as a speaker for this meeting.");
  }

  const isReady =
    payload.is_ready === true ||
    payload.is_ready === 1 ||
    payload.is_ready === "true";

  const notes = cleanString(payload.notes) || null;

  await db_query(
    `
      INSERT INTO meeting_speaker_statuses
      (
        meeting_id,
        user_id,
        is_ready,
        notes
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_ready = VALUES(is_ready),
        notes = VALUES(notes)
    `,
    [meetingId, userId, isReady, notes],
  );

  return get_speaker_status_service(db_query, userId, meetingId);
};

const list_speaker_materials_service = async (
  db_query,
  userId,
  meetingId,
) => {
  const member = await getMeetingMember(
    db_query,
    meetingId,
    userId,
    "speaker",
  );

  if (!member) {
    throw new Error("You are not assigned as a speaker for this meeting.");
  }

  const rows = await db_query(
    `
      SELECT
        id,
        meeting_id,
        user_id,
        title,
        file_url,
        file_name,
        file_type,
        created_at
      FROM meeting_speaker_materials
      WHERE meeting_id = ?
        AND user_id = ?
      ORDER BY created_at DESC
    `,
    [meetingId, userId],
  );

  return {
    success: true,
    message: "Speaker materials retrieved successfully.",
    data: rows || [],
  };
};

const create_speaker_material_service = async (
  db_query,
  userId,
  payload = {},
) => {
  const meetingId = Number(payload.meeting_id);
  const title = cleanString(payload.title);
  const fileUrl = cleanString(payload.file_url);

  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    throw new Error("A valid meeting is required.");
  }

  if (!title || !fileUrl) {
    throw new Error("Enter a material title and a valid URL.");
  }

  const member = await getMeetingMember(
    db_query,
    meetingId,
    userId,
    "speaker",
  );

  if (!member) {
    throw new Error("You are not assigned as a speaker for this meeting.");
  }

  const result = await db_query(
    `
      INSERT INTO meeting_speaker_materials
      (
        meeting_id,
        user_id,
        title,
        file_url,
        file_name,
        file_type
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      meetingId,
      userId,
      title,
      fileUrl,
      cleanString(payload.file_name) || null,
      cleanString(payload.file_type) || null,
    ],
  );

  return {
    success: true,
    message: "Speaker material saved successfully.",
    data: {
      id: result.insertId,
      meeting_id: meetingId,
    },
  };
};

const list_attendee_networking_service = async (
  db_query,
  userId,
) => {
  const rows = await db_query(
    `
      SELECT DISTINCT
        peer.user_id,
        peer.first_name,
        peer.last_name,
        peer.profile_image
      FROM meeting_members mine
      INNER JOIN meeting_members peerMember
        ON peerMember.meeting_id = mine.meeting_id
        AND peerMember.user_id <> mine.user_id
        AND peerMember.status = 'accepted'
      INNER JOIN users peer
        ON peer.user_id = peerMember.user_id
      WHERE mine.user_id = ?
        AND mine.member_role = 'attendee'
        AND mine.status = 'accepted'
      ORDER BY peer.first_name ASC, peer.last_name ASC
      LIMIT 100
    `,
    [userId],
  );

  return {
    success: true,
    message: "Meeting connections retrieved successfully.",
    data: rows || [],
  };
};

const list_certificates_service = async (db_query, userId) => {
  const rows = await db_query(
    `
      SELECT
        c.id,
        c.user_id,
        c.meeting_id,
        c.certificate_code,
        c.title,
        c.file_url,
        c.issued_at,
        c.created_at,
        m.des AS meeting_title
      FROM attendee_certificates c
      LEFT JOIN meeting_schedules m
        ON m.id = c.meeting_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `,
    [userId],
  );

  return {
    success: true,
    message: "Certificates retrieved successfully.",
    data: rows || [],
  };
};

const generate_certificate_service = async (
  db_query,
  userId,
  payload = {},
) => {
  const meetingId = Number(payload.meeting_id);

    const attendeeMember = await getMeetingMember(
    db_query,
    meetingId,
    userId,
    "attendee",
    ["accepted"],
  );

  if (!attendeeMember) {
    throw new Error(
      "You must accept this attendee invitation before requesting a certificate.",
    );
  }

  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    throw new Error("Choose a completed meeting.");
  }

  const attendedRows = await db_query(
    `
      SELECT
        m.id,
        m.des,
        a.duration_minutes
      FROM meeting_schedules m
      INNER JOIN meeting_attendance a
        ON a.meeting_id = m.id OR a.room_id = m.room_id
      WHERE m.id = ?
        AND a.user_id = ?
        AND a.left_at IS NOT NULL
        AND a.duration_minutes >= 1
      ORDER BY a.left_at DESC
      LIMIT 1
    `,
    [meetingId, userId],
  );

  const attendedMeeting = attendedRows?.[0];

  if (!attendedMeeting) {
    throw new Error(
      "A certificate is available after you attend and leave this meeting.",
    );
  }

  const existingRows = await db_query(
    `
      SELECT id, certificate_code
      FROM attendee_certificates
      WHERE user_id = ?
        AND meeting_id = ?
      LIMIT 1
    `,
    [userId, meetingId],
  );

  if (existingRows?.[0]) {
    return {
      success: true,
      message: "Certificate already issued.",
      data: existingRows[0],
    };
  }

  const certificateCode = `TELF-${crypto
    .randomBytes(8)
    .toString("hex")
    .toUpperCase()}`;

  const title =
    cleanString(payload.title) ||
    `${attendedMeeting.des || "Telefya meeting"} attendance certificate`;

  const result = await db_query(
    `
      INSERT INTO attendee_certificates
      (
        user_id,
        meeting_id,
        certificate_code,
        title,
        issued_at
      )
      VALUES (?, ?, ?, ?, NOW())
    `,
    [userId, meetingId, certificateCode, title],
  );

  return {
    success: true,
    message: "Certificate issued successfully.",
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
    [userId],
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
  list_meeting_members_service,
  invite_meeting_member_service,
  remove_meeting_member_service,
  respond_to_meeting_invite_service,
  list_speaker_meetings_service,
  list_attendee_meetings_service,
  get_speaker_status_service,
  save_speaker_status_service,
  list_speaker_materials_service,
  create_speaker_material_service,
  list_attendee_networking_service,
  list_certificates_service,
  generate_certificate_service,
  get_billing_overview_service,
};