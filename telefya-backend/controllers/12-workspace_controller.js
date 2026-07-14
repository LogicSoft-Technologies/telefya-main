const { query } = require("../config/db");
const service = require("../services/12-workspace_service");

const getUserId = (req) =>
  req.user?.user || req.user?.user_id || req.user?.id || req.user?.email;

const ok = (res, result) => res.status(200).json({ ...result, status: 200 });

const fail = (res, error) =>
  res.status(500).json({
    success: false,
    error: true,
    message: error?.message || "Internal server error",
    status: 500,
  });

const requireUser = (req, res) => {
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

  return userId;
};

const list_admin_users_controller = async (req, res) => {
  try {
    return ok(res, await service.list_admin_users_service(query));
  } catch (error) {
    return fail(res, error);
  }
};

const get_branding_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(res, await service.get_branding_service(query, userId));
  } catch (error) {
    return fail(res, error);
  }
};

const save_branding_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(res, await service.save_branding_service(query, userId, req.body));
  } catch (error) {
    return fail(res, error);
  }
};

const get_speaker_status_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(res, await service.get_speaker_status_service(query, userId));
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
      await service.save_speaker_status_service(query, userId, req.body)
    );
  } catch (error) {
    return fail(res, error);
  }
};

const list_speaker_materials_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(res, await service.list_speaker_materials_service(query, userId));
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
      await service.create_speaker_material_service(query, userId, req.body)
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
      await service.list_attendee_networking_service(query, userId)
    );
  } catch (error) {
    return fail(res, error);
  }
};

const list_certificates_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(res, await service.list_certificates_service(query, userId));
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
      await service.generate_certificate_service(query, userId, req.body)
    );
  } catch (error) {
    return fail(res, error);
  }
};

const get_billing_overview_controller = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    return ok(res, await service.get_billing_overview_service(query, userId));
  } catch (error) {
    return fail(res, error);
  }
};

module.exports = {
  list_admin_users_controller,
  get_branding_controller,
  save_branding_controller,
  get_speaker_status_controller,
  save_speaker_status_controller,
  list_speaker_materials_controller,
  create_speaker_material_controller,
  list_attendee_networking_controller,
  list_certificates_controller,
  generate_certificate_controller,
  get_billing_overview_controller,
};