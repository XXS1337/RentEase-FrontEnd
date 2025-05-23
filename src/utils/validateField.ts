import calculateAge from './calculateAge';
import { normalizeDateUTC, getOneYearFromToday } from './dateUtils';
import axios from '../api/axiosConfig';

// Context type for additional validation context
type ValidationContext = {
  checkEmail?: boolean;
  originalEmail?: string;
  allowEmptyPassword?: boolean;
  password?: string;
  originalDate?: Date;
};

export const validateField = async (name: string, value: string | number | Date | undefined, context: ValidationContext = {}): Promise<string> => {
  let error = '';

  switch (name) {
    case 'firstName':
    case 'lastName':
      if (!value || typeof value !== 'string' || value.trim().length < 2) {
        error = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters.`;
      } else if (value.length > 50) {
        error = `${name === 'firstName' ? 'First' : 'Last'} name must be at most 50 characters.`;
      } else if (!/^[a-zA-ZăâîșțĂÂÎȘȚ -]+$/.test(value)) {
        error = `${name === 'firstName' ? 'First' : 'Last'} name can only contain letters and spaces.`;
      }
      break;
    case 'email':
      if (!value || (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
        error = 'Email must be in a valid format.';
      } else if (context.checkEmail && value !== context.originalEmail) {
        try {
          const res = await axios.post('/users/checkEmail', { email: value });
          if (res.data.exists) {
            error = 'This email is not available. Please try another or log in if you already have an account.';
          }
        } catch (err) {
          console.error('Error checking email availability:', err);
          error = 'Failed to check email availability. Please try again.';
        }
      }
      break;
    case 'password':
      if (!value && context.allowEmptyPassword) {
        error = '';
      } else if (!value || (typeof value === 'string' && value.length < 6)) {
        error = 'Password must be at least 6 characters long.';
      } else if (typeof value === 'string' && (!/[a-zA-Z]/.test(value) || !/\d/.test(value) || !/[^\w\s]/.test(value))) {
        error = 'Password must include letters, numbers, and a special character.';
      }
      break;
    case 'confirmPassword':
      if (value !== context.password) {
        error = 'Passwords do not match.';
      }
      break;
    case 'birthDate':
      if (!value || isNaN(new Date(value as Date).getTime())) {
        error = 'Birth date is required.';
      } else {
        const age = calculateAge(value as Date);
        if (age < 18 || age > 120) {
          error = 'Age must be between 18 and 120.';
        }
      }
      break;
    case 'adTitle':
      if (!value || (typeof value === 'string' && (value.length < 5 || value.length > 60))) {
        error = 'Ad title must be between 5 and 60 characters.';
      }
      break;
    case 'city':
      if (!value || (typeof value === 'string' && value.length < 2)) {
        error = 'City name must be at least 2 characters.';
      }
      break;
    case 'streetName':
      if (!value || (typeof value === 'string' && value.length < 2)) {
        error = 'Street name must be at least 2 characters.';
      }
      break;
    case 'streetNumber':
      if (!value || isNaN(Number(value)) || Number(value) < 1) {
        error = 'Street number must be at least 1.';
      }
      break;
    case 'areaSize':
      if (!value || isNaN(Number(value)) || Number(value) <= 0) {
        error = 'Area size must be a valid positive number.';
      }
      break;
    case 'yearBuilt': {
      const currentYear = new Date().getFullYear();
      if (!value || isNaN(Number(value)) || Number(value) < 1900 || Number(value) > currentYear) {
        error = 'Year built must be between 1900 and the current year.';
      }
      break;
    }
    case 'rentPrice':
      if (!value || isNaN(Number(value)) || Number(value) <= 0) {
        error = 'Rent price must be greater than zero.';
      }
      break;
    case 'dateAvailable':
    case 'updatedDateAvailable': {
      if (!value) {
        error = 'Date available is required.';
      } else {
        const today = new Date();
        const todayUTC = normalizeDateUTC(today);
        const selectedUTC = typeof value === 'number' ? value : normalizeDateUTC(value as Date);
        const originalUTC = context.originalDate ? normalizeDateUTC(context.originalDate) : todayUTC;
        const oneYearFromTodayUTC = normalizeDateUTC(getOneYearFromToday(today));

        const isOutOfRange =
          name === 'dateAvailable' ? selectedUTC < todayUTC || selectedUTC > oneYearFromTodayUTC : originalUTC > todayUTC ? selectedUTC < todayUTC || selectedUTC > oneYearFromTodayUTC : selectedUTC < originalUTC || selectedUTC > oneYearFromTodayUTC;

        if (isOutOfRange) {
          const startLabel = originalUTC >= todayUTC ? 'today' : 'the original date';
          const startDate = new Date(originalUTC > todayUTC ? todayUTC : originalUTC).toLocaleDateString('en-US');
          const endDate = new Date(oneYearFromTodayUTC).toLocaleDateString('en-US');

          error = `Date available must be between ${startLabel} (${startDate}) and one year from today (${endDate}).`;
        }
      }
      break;
    }
    case 'image':
      if (!value) {
        error = 'Image file is required.';
      }
      break;
    case 'messageContent':
      if (!value || (typeof value === 'string' && !value.trim())) {
        error = 'Message content cannot be empty.';
      } else if (typeof value === 'string' && value.length > 1000) {
        error = 'Message cannot exceed 1000 characters.';
      }
      break;
    default:
      break;
  }

  return error;
};
