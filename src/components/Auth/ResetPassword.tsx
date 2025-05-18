import React, { useState, useEffect } from 'react';
import { Form, useActionData } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import { validateField } from '../../utils/validateField';
import styles from './Auth.module.css';

// Tipuri pentru erori
type ResetPasswordErrors = Partial<Record<'password' | 'confirmPassword' | 'general', string>>;

// Acțiune de resetare
export const resetPasswordAction = async ({ request, params }: { request: Request; params: any }) => {
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const token = params.token;

  const errors: ResetPasswordErrors = {};

  errors.password = await validateField('password', password);
  errors.confirmPassword = await validateField('confirmPassword', confirmPassword, { password });
  if (!token) errors.general = 'Invalid or missing token.';

  Object.keys(errors).forEach((key) => {
    if (!errors[key as keyof ResetPasswordErrors]) delete errors[key as keyof ResetPasswordErrors];
  });

  if (Object.keys(errors).length > 0) return { errors };

  try {
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
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setTouched(true);
  };

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = await validateField(name, value, { password: formData.password });
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

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
