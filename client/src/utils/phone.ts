import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const normalizePakistanPhone = (value: string): string | null => {
  const phone = parsePhoneNumberFromString(value, 'PK');
  return phone?.country === 'PK' && phone.isValid() ? phone.number : null;
};
