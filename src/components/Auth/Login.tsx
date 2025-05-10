import React, { useState, useEffect } from 'react';
import { Form, useActionData, useNavigate } from 'react-router-dom';
import { validateField } from '../../utils/validateField';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axiosConfig';
import styles from './Auth.module.css';

// Define the structure for the login form data
type LoginFormData = {
  email: string;
  password: string;
};

// Define the structure for field errors
type LoginFieldErrors = Partial<Record<keyof LoginFormData | 'general', string>>;

export const loginAction = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const errors: LoginFieldErrors = {};
  errors.email = await validateField('email', email);
  errors.password = await validateField('password', password);

  Object.keys(errors).forEach((key) => {
    if (!errors[key as keyof LoginFormData]) delete errors[key as keyof LoginFormData];
  });

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const res = await axios.post('/users/login', { email, password });
    const { userDB: user, token } = res.data;

    return { success: true, user, token };
  } catch (err: any) {
    const message = err?.response?.data?.message || 'Login failed. Please try again.';
    return { errors: { general: message } };
  }
};

const Login: React.FC = () => {
  const actionData = useActionData<{ success?: boolean; errors?: LoginFieldErrors; user?: any; token?: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (actionData?.success && actionData.user && actionData.token) {
      setGeneralError(null);
      login(actionData.user, actionData.token);
      alert('Login successful! Redirecting to home page.');
      navigate('/');
    }

    if (actionData?.errors?.general) {
      setGeneralError(actionData.errors.general);
    }
  }, [actionData, navigate, login]);

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = await validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
    setGeneralError(null);
  };

  return (
    <div className={styles.auth}>
      <h2>Login</h2>
      <Form method="post" className={styles.form}>
        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" placeholder="Email" value={formData.email} onBlur={handleBlur} onChange={handleChange} required />
          </div>
          {fieldErrors.email && <p className={styles.error}>{fieldErrors.email}</p>}
          {actionData?.errors?.email && <p className={styles.error}>{actionData.errors.email}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" placeholder="Password" value={formData.password} onBlur={handleBlur} onChange={handleChange} required />
          </div>
          {fieldErrors.password && <p className={styles.error}>{fieldErrors.password}</p>}
          {actionData?.errors?.password && <p className={styles.error}>{actionData.errors.password}</p>}
        </div>

        {generalError && <p className={styles.error}>{generalError}</p>}

        <button type="submit">Login</button>
      </Form>
    </div>
  );
};

export default Login;
