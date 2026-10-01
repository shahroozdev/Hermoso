import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const normalizePakistanPhone = (value?: string): string | undefined => {
  if (!value) return undefined;
  const phone = parsePhoneNumberFromString(value, 'PK');
  return phone?.country === 'PK' && phone.isValid() ? phone.number : undefined;
};
