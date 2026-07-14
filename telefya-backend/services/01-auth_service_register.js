const normalizePhoneNumber = (countryCode, phoneNumber) => {
  const cleanCode = String(countryCode || "").replace(/[^\d+]/g, "");
  const cleanPhone = String(phoneNumber || "").replace(/[^\d]/g, "");

  if (!cleanCode.startsWith("+")) {
    return `+${cleanCode}${cleanPhone}`;
  }

  return `${cleanCode}${cleanPhone}`;
};

const auth_service_register = async (
  userData,
  {
    query,
    bcrypt,
    validatePassword,
    validateEmail,
    sanitizeInput,
    sendEmailWithOTP,
    generateOTP,
    responseObject,
  }
) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      password,
      country,
      state,
      city,
      date_of_birth,
      country_code,
    } = userData;

    if (
      !first_name ||
      !last_name ||
      !email ||
      !phone_number ||
      !password ||
      !country ||
      !state ||
      !city ||
      !date_of_birth ||
      !country_code
    ) {
      return responseObject(false, true, {
        message: "All fields are required.",
        status: 400,
      });
    }

    if (!validatePassword(password)) {
      return responseObject(false, true, {
        message:
          "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.",
        status: 400,
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      return responseObject(false, true, {
        message: "Invalid email format.",
        status: 400,
      });
    }

    const sanitized = {
      user_id: generateOTP(12),
      first_name: sanitizeInput(String(first_name).trim()),
      last_name: sanitizeInput(String(last_name).trim()),
      email: sanitizeInput(normalizedEmail),
      phone_number: sanitizeInput(normalizePhoneNumber(country_code, phone_number)),
      country: sanitizeInput(String(country).trim()),
      state: sanitizeInput(String(state).trim()),
      city: sanitizeInput(String(city).trim()),
      date_of_birth: sanitizeInput(String(date_of_birth).trim()),
    };

    const existing = await query(
      "SELECT id FROM users WHERE email = ? OR phone_number = ? LIMIT 1",
      [sanitized.email, sanitized.phone_number]
    );

    if (existing.length > 0) {
      return responseObject(false, true, {
        message: "Email or phone number already exists.",
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP(6, true);

    const insertQuery = `
      INSERT INTO users
      (user_id, first_name, last_name, email, phone_number, password, country, state, city, date_of_birth, is_verified, verification_otp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `;

    const result = await query(insertQuery, [
      sanitized.user_id,
      sanitized.first_name,
      sanitized.last_name,
      sanitized.email,
      sanitized.phone_number,
      hashedPassword,
      sanitized.country,
      sanitized.state,
      sanitized.city,
      sanitized.date_of_birth,
      otp,
    ]);

    if (!result.insertId) {
      return responseObject(false, true, {
        message: "User registration failed.",
        status: 400,
      });
    }

    await sendEmailWithOTP(sanitized.email, otp, {
      firstName: sanitized.first_name,
    });

    return responseObject(true, false, {
      message: "User registered successfully. Please verify your email.",
      status: 200,
      data: {
        user_id: sanitized.user_id,
        email: sanitized.email,
        first_name: sanitized.first_name,
        last_name: sanitized.last_name,
        phone_number: sanitized.phone_number,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);

    return responseObject(false, true, {
      message: error?.message || "Registration failed. Please try again.",
      status: 500,
    });
  }
};

module.exports = auth_service_register;