const Joi = require("joi");
const { query } = require("../config/db");
const sanitizeInput = require("../lib/sanitize");

const schema = Joi.object({
  first_name: Joi.string().trim().min(2).max(80).optional().allow(""),
  last_name: Joi.string().trim().min(2).max(80).optional().allow(""),
  phone_number: Joi.string().trim().min(5).max(30).optional().allow(""),
  country_code: Joi.string()
    .trim()
    .pattern(/^\+\d{1,4}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Country code must look like +234.",
    }),
  country: Joi.string().trim().min(2).max(120).optional().allow(""),
  state: Joi.string().trim().min(1).max(120).optional().allow(""),
  city: Joi.string().trim().min(1).max(120).optional().allow(""),
  date_of_birth: Joi.string().trim().optional().allow(""),
});

function getAuthenticatedUserId(req) {
  return (
    req.user?.user ||
    req.user?.user_id ||
    req.user?.id ||
    req.userId ||
    req.auth?.user_id
  );
}

function normalizePhoneNumber(countryCode, phoneNumber) {
  const cleanPhone = String(phoneNumber || "").replace(/[^\d]/g, "");
  const cleanCode = String(countryCode || "").replace(/[^\d+]/g, "");

  if (!cleanPhone) return "";

  if (!cleanCode) return cleanPhone;

  if (cleanCode.startsWith("+")) {
    return `${cleanCode}${cleanPhone}`;
  }

  return `+${cleanCode}${cleanPhone}`;
}

function inferCountryCode(phoneNumber = "") {
  const value = String(phoneNumber);

  if (value.startsWith("+234")) return "+234";
  if (value.startsWith("+1")) return "+1";
  if (value.startsWith("+44")) return "+44";
  if (value.startsWith("+233")) return "+233";
  if (value.startsWith("+27")) return "+27";

  const match = value.match(/^(\+\d{1,4})/);
  return match?.[1] || "";
}

function normalizeUser(row) {
  if (!row) return null;

  return {
    ...row,
    country_code: inferCountryCode(row.phone_number),
  };
}

async function getUserById(userId) {
  const rows = await query(
    `SELECT
      id,
      user_id,
      first_name,
      last_name,
      email,
      phone_number,
      country,
      state,
      city,
      date_of_birth,
      is_verified,
      profile_image,
      created_at
    FROM users
    WHERE user_id = ? OR id = ?
    LIMIT 1`,
    [userId, userId],
  );

  return normalizeUser(rows[0] || null);
}

const update_user_profile_controller = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized user.",
        status: 401,
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.details[0].message,
        status: 400,
      });
    }

    const existingUser = await getUserById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "User not found.",
        status: 404,
      });
    }

    const updates = {};
    const allowedFields = [
      "first_name",
      "last_name",
      "country",
      "state",
      "city",
      "date_of_birth",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(value, field)) {
        updates[field] = sanitizeInput(String(value[field] || "").trim());
      }
    }

    if (Object.prototype.hasOwnProperty.call(value, "phone_number")) {
      updates.phone_number = sanitizeInput(
        normalizePhoneNumber(value.country_code, value.phone_number),
      );
    }

    const entries = Object.entries(updates);

    if (!entries.length) {
      return res.status(200).json({
        success: true,
        error: false,
        message: "No profile changes submitted.",
        status: 200,
        data: existingUser,
      });
    }

    const setClause = entries.map(([field]) => `${field} = ?`).join(", ");
    const params = entries.map(([, fieldValue]) => fieldValue);

    await query(
      `UPDATE users SET ${setClause} WHERE user_id = ? OR id = ?`,
      [...params, userId, userId],
    );

    const updatedUser = await getUserById(userId);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Profile updated successfully.",
      status: 200,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Unable to update profile.",
      status: 500,
    });
  }
};

module.exports = update_user_profile_controller;