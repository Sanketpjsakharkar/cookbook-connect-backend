import { validate } from 'class-validator';
import { LoginInput } from './login.dto';

describe('LoginInput', () => {
  let loginInput: LoginInput;

  beforeEach(() => {
    loginInput = new LoginInput();
  });

  it('should be valid with email and password', async () => {
    loginInput.emailOrUsername = 'test@example.com';
    loginInput.password = 'password123';

    const errors = await validate(loginInput);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with username and password', async () => {
    loginInput.emailOrUsername = 'testuser';
    loginInput.password = 'password123';

    const errors = await validate(loginInput);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation without emailOrUsername', async () => {
    loginInput.password = 'password123';

    const errors = await validate(loginInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('emailOrUsername');
  });

  it('should fail validation without password', async () => {
    loginInput.emailOrUsername = 'test@example.com';

    const errors = await validate(loginInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation with empty emailOrUsername', async () => {
    loginInput.emailOrUsername = '';
    loginInput.password = 'password123';

    const errors = await validate(loginInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('emailOrUsername');
  });

  it('should fail validation with empty password', async () => {
    loginInput.emailOrUsername = 'test@example.com';
    loginInput.password = '';

    const errors = await validate(loginInput);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });
});
