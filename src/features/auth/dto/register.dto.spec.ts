import { validate } from 'class-validator';
import { RegisterInput } from './register.dto';

describe('RegisterInput', () => {
  let registerInput: RegisterInput;

  beforeEach(() => {
    registerInput = new RegisterInput();
  });

  it('should be valid with all required fields', async () => {
    registerInput.email = 'test@example.com';
    registerInput.username = 'testuser';
    registerInput.password = 'password123';
    registerInput.firstName = 'Test';
    registerInput.lastName = 'User';

    const errors = await validate(registerInput);
    expect(errors).toHaveLength(0);
  });

  it('should be valid without optional fields', async () => {
    registerInput.email = 'test@example.com';
    registerInput.username = 'testuser';
    registerInput.password = 'password123';

    const errors = await validate(registerInput);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid email', async () => {
    registerInput.email = 'invalid-email';
    registerInput.username = 'testuser';
    registerInput.password = 'password123';

    const errors = await validate(registerInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation with short username', async () => {
    registerInput.email = 'test@example.com';
    registerInput.username = 'ab';
    registerInput.password = 'password123';

    const errors = await validate(registerInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
  });

  it('should fail validation with short password', async () => {
    registerInput.email = 'test@example.com';
    registerInput.username = 'testuser';
    registerInput.password = '123';

    const errors = await validate(registerInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation with invalid username characters', async () => {
    registerInput.email = 'test@example.com';
    registerInput.username = 'test-user!';
    registerInput.password = 'password123';

    const errors = await validate(registerInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
  });

  it('should fail validation with long firstName', async () => {
    registerInput.email = 'test@example.com';
    registerInput.username = 'testuser';
    registerInput.password = 'password123';
    registerInput.firstName = 'a'.repeat(51);

    const errors = await validate(registerInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('firstName');
  });

  it('should fail validation with long lastName', async () => {
    registerInput.email = 'test@example.com';
    registerInput.username = 'testuser';
    registerInput.password = 'password123';
    registerInput.lastName = 'a'.repeat(51);

    const errors = await validate(registerInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('lastName');
  });
});
