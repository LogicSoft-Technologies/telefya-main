const { query } = require("../config/db");
const service = require("../services/12-workspace_service");

function getUserId(req) {
  return (
    req.user?.user ||
    req.user?.user_id ||
    req.user?.id ||
    req.user?.userId ||
    req.user?.email ||
    null
  );
}

function requireUser(req, res) {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      error: true,
      message: "Unauthorized.",
      status: 401,
    });

    return null;
  }

  return String(userId);
}

function getPositiveInteger(value) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function ok(res, result, status = 200) {
  return res.status(status).json({
    ...result,
    status,
  });
}

function fail(res, error) {
  const message = error?.message || "Internal server error";

  const isRequestError =
    message.includes("required") ||
    message.includes("valid") ||
    message.includes("not found") ||
    message.includes("access denied") ||
    message.includes("not assigned") ||
    message.includes("already handled") ||
    message.includes("Choose") ||
    message.includes("No Telefya account") ||
    message.includes("cannot invite") ||
    message.includes("available after");

  return res.status(isRequestError ? 400 : 500).json({
    success: false,
    error: true,
    message,
    status: isRequestError ? 400 : 500,
  });
}

/*
 * This endpoint is intentionally closed until the dedicated,
 * role-protected admin API is created.
 */
const list_admin_users_controller = async (_req, res) =>
  res.status(403).json({
    success: false,
    error: true,
    message: "This endpoint is only available through the admin portal.",
    status: 403,
  });

const get_branding_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.get_branding_service(query, userId),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const save_branding_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.save_branding_service(
        query,
        userId,
        req.body,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const list_meeting_members_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    const meetingId = getPositiveInteger(req.params.meetingId);

    if (!userId) return;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "A valid meeting is required.",
        status: 400,
      });
    }

    return ok(
      res,
      await service.list_meeting_members_service(
        query,
        userId,
        meetingId,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const invite_meeting_member_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    const meetingId = getPositiveInteger(req.params.meetingId);

    if (!userId) return;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "A valid meeting is required.",
        status: 400,
      });
    }

    return ok(
      res,
      await service.invite_meeting_member_service(
        query,
        userId,
        meetingId,
        req.body,
      ),
      201,
    );
  } catch (error) {
    return fail(res, error);
  }
};

const remove_meeting_member_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    const meetingId = getPositiveInteger(req.params.meetingId);
    const memberId = getPositiveInteger(req.params.memberId);

    if (!userId) return;

    if (!meetingId || !memberId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "A valid meeting member is required.",
        status: 400,
      });
    }

    return ok(
      res,
      await service.remove_meeting_member_service(
        query,
        userId,
        meetingId,
        memberId,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const respond_to_meeting_invite_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    const memberId = getPositiveInteger(req.params.memberId);

    if (!userId) return;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "A valid invitation is required.",
        status: 400,
      });
    }

    return ok(
      res,
      await service.respond_to_meeting_invite_service(
        query,
        userId,
        memberId,
        req.body,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const list_speaker_meetings_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.list_speaker_meetings_service(query, userId),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const list_attendee_meetings_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.list_attendee_meetings_service(query, userId),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const get_speaker_status_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    const meetingId = getPositiveInteger(req.query.meetingId);

    if (!userId) return;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "A valid meeting is required.",
        status: 400,
      });
    }

    return ok(
      res,
      await service.get_speaker_status_service(
        query,
        userId,
        meetingId,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const save_speaker_status_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.save_speaker_status_service(
        query,
        userId,
        req.body,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const list_speaker_materials_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    const meetingId = getPositiveInteger(req.query.meetingId);

    if (!userId) return;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "A valid meeting is required.",
        status: 400,
      });
    }

    return ok(
      res,
      await service.list_speaker_materials_service(
        query,
        userId,
        meetingId,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const create_speaker_material_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.create_speaker_material_service(
        query,
        userId,
        req.body,
      ),
      201,
    );
  } catch (error) {
    return fail(res, error);
  }
};

const list_attendee_networking_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.list_attendee_networking_service(query, userId),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const list_certificates_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.list_certificates_service(query, userId),
    );
  } catch (error) {
    return fail(res, error);
  }
};

const generate_certificate_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.generate_certificate_service(
        query,
        userId,
        req.body,
      ),
      201,
    );
  } catch (error) {
    return fail(res, error);
  }
};

const get_billing_overview_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(
      res,
      await service.get_billing_overview_service(query, userId),
    );
  } catch (error) {
    return fail(res, error);
  }
};

module.exports = {
  list_admin_users_controller,
  get_branding_controller,
  save_branding_controller,
  list_meeting_members_controller,
  invite_meeting_member_controller,
  remove_meeting_member_controller,
  respond_to_meeting_invite_controller,
  list_speaker_meetings_controller,
  list_attendee_meetings_controller,
  get_speaker_status_controller,
  save_speaker_status_controller,
  list_speaker_materials_controller,
  create_speaker_material_controller,
  list_attendee_networking_controller,
  list_certificates_controller,
  generate_certificate_controller,
  get_billing_overview_controller,
};