import React, { useState, useEffect } from 'react';
import { Form, useActionData, useNavigation } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import styles from './Auth.module.css';

// Tip pentru erori
type ForgotPasswordErrors = Partial<Record<'email' | 'general', string>>;

export const forgotPasswordAction = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  const errors: ForgotPasswordErrors = {};

  if (Object.keys(errors).length > 0) return { errors };

  try {
    const res = await axios.post('/users/forgotPassword', { email });
    return { success: true, message: res.data.message };
  } catch (err: any) {
    return {
      errors: {
        general: err?.response?.data?.message || 'Failed to send reset email',
      },
    };
  }
};

const ForgotPassword: React.FC = () => {
  const actionData = useActionData() as { success?: boolean; message?: string; errors?: ForgotPasswordErrors };
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setEmail('');
        setFieldErrors({});
        setGeneralError(null);
        setWasSubmitted(true);
      }
      if (actionData.errors) {
        setFieldErrors(actionData.errors);
        setGeneralError(actionData.errors.general || null);
      }
    }
  }, [actionData]);

  const handleBlur = () => {
    if (!email) {
      setFieldErrors((prev) => ({ ...prev, email: 'Email is required' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Email must be in a valid format' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (wasSubmitted) setWasSubmitted(false);
    setEmail(e.target.value);
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
    setGeneralError(null);
  };

  return (
    <div className={styles.auth}>
      <h2>Forgot Password</h2>
      <Form method="post" className={styles.form}>
        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" value={email} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.email && <p className={styles.error}>{fieldErrors.email}</p>}
        </div>

        {generalError && <p className={styles.error}>{generalError}</p>}
        {wasSubmitted && <p className={styles.success}>If this email is registered, a reset link has been sent.</p>}

        <button type="submit" disabled={isSubmitting || !email || !!fieldErrors.email} className={styles.saveButton}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </Form>
    </div>
  );
};

export default ForgotPassword;
