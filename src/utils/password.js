// Centralized password policy: minimum 8 characters and at least one digit
export const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include at least one number';

export function validatePassword(password) {
  if (!password) return false;
  const pwdRegex = /^(?=.*\d).{8,}$/;
  return pwdRegex.test(password);
}

const passwordUtils = { validatePassword, PASSWORD_POLICY_MESSAGE };

export default passwordUtils;
