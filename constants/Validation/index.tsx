import { isNumeric, isString } from '../Static';
export const ValidateString = (str?: string): str is string => isString(str) && str !== '';
export const ValidateUsername = (username?: string): boolean => ValidateString(username) && /^[a-zA-Z0-9_-]{3,16}$/.test(username);
export const ValidateEmail = (email?: string): boolean => ValidateString(email) && /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,10})+$/.test(email);
export const ValidateEmailPassword = (email: string, pw: string, pw2?: string): boolean => ValidateEmail(email) && ValidatePassword(pw, pw2);
export const ValidateIVA = (iva?: string): boolean => ValidateString(iva) && /^[0-9]{11}$/.test(iva);
export const ValidateIBAN = (ibanStr?: string): boolean => ValidateString(ibanStr) && require('iban').isValid(ibanStr);
export const ValidateName = (name?: string): boolean => ValidateString(name) && /^[A-Za-z][a-zA-Z-]*[a-zA-Z]$/.test(name);
export const ValidateFullName = (name?: string): boolean => {
  if (!name) return false;
  var names = name.trim().split(/\s+/);
  return names.length >= 2 && names.every(ValidateName);
};
export const ScorePassword = (pass: string): number => {
  if (!pass) return 0;
  var score = 0;
  var letters: { [key: string]: number } = {};
  for (var i = 0; i < pass.length; i++) {
    letters[pass[i]] = (letters[pass[i]] || 0) + 1;
    score += 5.0 / letters[pass[i]];
  }
  var variations: { [key: string]: boolean } = {
    digits: /\d/.test(pass),
    lower: /[a-z]/.test(pass),
    upper: /[A-Z]/.test(pass),
    nonWords: /\W/.test(pass),
  };
  var variationCount = 0;
  for (var check in variations) if (variations) variationCount += variations[check] == true ? 1 : 0;
  score += (variationCount - 1) * 10;
  return score;
};
export const ValidatePassword = (pw?: string, pw2?: string, minLength = 8, minScore = 30): boolean => {
  if (!pw) return false;
  let v =
    // /[A-Z]/.test(pw) &&
    ///[a-z]/.test(pw) &&
    /[A-Za-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    // /[^A-Za-z0-9]/.test(pw) &&
    pw.length >= minLength;
  v = ScorePassword(pw) >= minScore;
  if (pw2 || pw2 === '') v = v && pw === pw2;
  return v;
};
export const ValidateWebUrl = (urlStr?: string): boolean => {
  try {
    return require('valid-url').isWebUri(urlStr);
  } catch (err) {}
  return false;
};
export const ValidateUri = (urlStr?: string): boolean => {
  try {
    if (!urlStr) return false;
    if (urlStr.startsWith('file://')) return true;
    const parsed = new URL(urlStr);
    return ['http:', 'https:', 'file:'].includes(parsed.protocol);
  } catch (err) {}
  return false;
};
export const ValidateNumber = (num?: string): boolean => ValidateString(num) && isNumeric(parseFloat(num.toNumber() + ''));
