const auth_service_register = require('../../services/01-auth_service_register');

describe('auth_service_register', () => {
  const mockDeps = {
    query: jest.fn(),
    bcrypt: { hash: jest.fn() },
    validatePassword: jest.fn(),
    validateEmail: jest.fn(),
    sanitizeInput: jest.fn((input) => input),
    sendEmailWithOTP: jest.fn(),
    generateOTP: jest.fn(() => '123456'),
    responseObject: jest.fn((success, error, payload) => ({
      success,
      error,
      ...payload,
    })),
  };

  const validUser = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '1234567890',
    password: 'StrongPass1!',
    country: 'USA',
    state: 'CA',
    city: 'LA',
    date_of_birth: '1990-01-01'
  };

  beforeEach(() => jest.clearAllMocks());

  test('returns error when required fields are missing', async () => {
    const userData = { ...validUser, first_name: '' };
    const res = await auth_service_register(userData, mockDeps);
    expect(res.error).toBe(true);
    expect(res.status).toBe(400);
    expect(res.message).toMatch(/All fields are required/);
  });

  test('returns error for weak password', async () => {
    mockDeps.validatePassword.mockReturnValue(false);
    validUser.password = "123456"
    const res = await auth_service_register(validUser, mockDeps);
    expect(res.message).toMatch(/Password must be at least 8 characters/);
  });

  test('registers successfully with valid input', async () => {
    mockDeps.validatePassword.mockReturnValue(true);
    mockDeps.validateEmail.mockReturnValue(true);
    mockDeps.query.mockResolvedValueOnce([]); // no existing user
    mockDeps.bcrypt.hash.mockResolvedValue('hashed_password');
    mockDeps.query.mockResolvedValueOnce({ insertId: 1 });

    const res = await auth_service_register(validUser, mockDeps);

    expect(res.success).toBe(true);
    expect(res.message).toMatch(/User registered successfully/);
    expect(mockDeps.sendEmailWithOTP).toHaveBeenCalledWith(validUser.email, '123456');
  });

    
    test('returns error when user already exists', async () => {
        mockDeps.query.mockResolvedValueOnce([{ email: validUser.email }]); // existing user
        const res = await auth_service_register(validUser, mockDeps);
        expect(res.error).toBe(true);
        expect(res.message).toMatch(/Email or phone number already exists./);
    });
    


  
});