import React, { useState, useEffect } from 'react';
import { Form, useActionData } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import { validateField } from '../../utils/validateField';
import styles from './Auth.module.css';

// Define possible error types for the reset password form
type ResetPasswordErrors = Partial<Record<'password' | 'confirmPassword' | 'general', string>>;

// Action function for handling password reset form submission
export const resetPasswordAction = async ({ request, params }: { request: Request; params: any }) => {
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const token = params.token;

  const errors: ResetPasswordErrors = {};

  // Validate both fields
  errors.password = await validateField('password', password);
  errors.confirmPassword = await validateField('confirmPassword', confirmPassword, { password });

  // Ensure the token exists
  if (!token) errors.general = 'Invalid or missing token.';

  // Remove empty error fields
  Object.keys(errors).forEach((key) => {
    if (!errors[key as keyof ResetPasswordErrors]) delete errors[key as keyof ResetPasswordErrors];
  });

  // If any errors, return early
  if (Object.keys(errors).length > 0) return { errors };

  try {
    // Send password reset request to the server
    await axios.patch(`/users/resetPassword/${token}`, { password });
    return { success: true };
  } catch (err: any) {
    return {
      errors: {
        general: err?.response?.data?.message || 'Failed to reset password',
      },
    };
  }
};

const ResetPassword: React.FC = () => {
  const actionData = useActionData() as { success?: boolean; errors?: ResetPasswordErrors };

  // Local form state
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // Redirect countdown logic if token is invalid/expired
  const [showRedirectNotice, setShowRedirectNotice] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (actionData) {
      setIsSubmitting(false);
      if (actionData.success) {
        alert('Password has been reset! You can now log in.');
        window.location.href = '/login';
      } else if (actionData.errors) {
        setFieldErrors(actionData.errors);
        // Auto-redirect if token is invalid/expired
        if (actionData.errors.general?.toLowerCase().includes('token')) {
          setShowRedirectNotice(true);
          const interval = setInterval(() => {
            setCountdown((prev) => {
              if (prev === 1) {
                clearInterval(interval);
                window.location.href = '/forgot-password';
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    }
  }, [actionData]);

  // Handle input change and reset field errors
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setTouched(true);
  };

  // Validate field on blur
  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = await validateField(name, value, { password: formData.password });
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Enable submit only if touched, fields filled, and no errors
  const isFormValid = touched && formData.password.trim() !== '' && formData.confirmPassword.trim() !== '' && Object.values(fieldErrors).every((err) => !err);

  return (
    <div className={styles.auth}>
      <h2>Reset Password</h2>
      <Form method="post" className={styles.form} onSubmit={() => setIsSubmitting(true)}>
        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="password">New Password:</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.password && <p className={styles.error}>{fieldErrors.password}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.confirmPassword && <p className={styles.error}>{fieldErrors.confirmPassword}</p>}
        </div>

        {/* General error or redirect countdown message */}
        {fieldErrors.general && <p className={styles.error}>{fieldErrors.general}</p>}
        {showRedirectNotice && <p className={styles.error}>Redirecting to Forgot Password in {countdown}...</p>}

        <button type="submit" disabled={isSubmitting || !isFormValid} className={styles.saveButton}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </Form>
    </div>
  );
};

export default ResetPassword;
