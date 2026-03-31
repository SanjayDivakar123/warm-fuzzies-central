const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const lower = "abcdefghjkmnpqrstuvwxyz";
const digits = "23456789";
const special = "!@#$%^&*";
const all = upper + lower + digits + special;

const rand = (set: string) => set[Math.floor(Math.random() * set.length)];

export function generateTempPassword(length = 12) {
  const safeLength = Math.max(12, length);
  const required = [rand(upper), rand(lower), rand(digits), rand(special)];
  const rest = Array.from({ length: safeLength - required.length }, () => rand(all));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
}

export function getPasswordStrength(password: string) {
  let score = 0;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function isValidTempPassword(password: string) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
