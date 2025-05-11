import React, { useState, useEffect } from 'react';
import { Form, useLoaderData, useNavigate, useActionData, redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from '../../../api/axiosConfig';
import handleRemoveUser from '../../../utils/handleRemoveUser';
import Modal from '../../Shared/Modal/Modal';
import { useAuth } from '../../../context/AuthContext';
import { validateField } from '../../../utils/validateField';
import type User from '../../../types/User';
import styles from './MyProfile.module.css';

// State type for modal visibility and message
type ShowModalState = {
  isVisible: boolean;
  message: string;
};

// Form data type
type FormData = Omit<User, 'id' | 'createdAt' | 'isAdmin' | 'password'> & {
  password: string;
  confirmPassword: string;
};

// Field errors type
type FieldErrors = Partial<Record<keyof FormData | 'general', string>>;

export const myProfileLoader = async () => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  try {
    const { data } = await axios.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    console.error('Profile load error:', error);
    return redirect('/login');
  }
};

export const myProfileAction = async ({ request }: { request: Request }) => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  const formData = await request.formData();
  const payload = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    birthDate: formData.get('birthDate') as string,
  };

  const errors: FieldErrors = {};
  errors.firstName = await validateField('firstName', payload.firstName);
  errors.lastName = await validateField('lastName', payload.lastName);
  errors.email = await validateField('email', payload.email, { checkEmail: true });
  errors.password = await validateField('password', payload.password);
  errors.confirmPassword = await validateField('confirmPassword', payload.confirmPassword, { password: payload.password });
  errors.birthDate = await validateField('birthDate', payload.birthDate);

  Object.keys(errors).forEach((key) => {
    if (!errors[key as keyof FieldErrors]) delete errors[key as keyof FieldErrors];
  });

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await axios.patch('/users/updateMyProfile', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    Cookies.remove('token');
    return redirect('/login');
  } catch (error: any) {
    return {
      errors: {
        general: error?.response?.data?.message || 'Failed to update profile.',
      },
    };
  }
};

const MyProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userData = useLoaderData() as User;
  const actionData = useActionData() as { errors?: FieldErrors } | undefined;

  const [formData, setFormData] = useState<FormData>({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: '',
    confirmPassword: '',
    birthDate: userData.birthDate || '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showModal, setShowModal] = useState<ShowModalState>({ isVisible: false, message: '' });

  useEffect(() => {
    if (actionData?.errors) {
      setFieldErrors(actionData.errors);
      if (actionData.errors.general) alert(actionData.errors.general);
    } else {
      setFieldErrors({});
    }
  }, [actionData]);

  const validateFieldLocal = async (name: keyof FormData, value: string) => {
    let error = '';
    if (name === 'email') {
      setIsCheckingEmail(true);
      error = await validateField(name, value, {
        checkEmail: true,
        originalEmail: userData.email,
      });
      setIsCheckingEmail(false);
    } else {
      error = await validateField(name, value, {
        password: formData.password,
        allowEmptyPassword: true,
      });
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    await validateFieldLocal(name as keyof FormData, value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDeleteAccount = async () => {
    try {
      await handleRemoveUser(userData.id);
      if (user?.id === userData.id) {
        logout();
      } else {
        setShowModal({ isVisible: false, message: '' });
        navigate('/admin/all-users');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to remove user. Please try again later.');
    }
  };

  const handleCancelDelete = () => {
    setShowModal({ isVisible: false, message: '' });
  };

  return (
    <div className={styles.profile}>
      <h2>{user?.id === userData.id ? 'My Profile' : `Editing Profile: ${userData.firstName} ${userData.lastName}`}</h2>

      <div className={styles.profileDetails}>
        <h3>User Details</h3>
        <p>
          <strong>First Name:</strong> {userData.firstName}
        </p>
        <p>
          <strong>Last Name:</strong> {userData.lastName}
        </p>
        <p>
          <strong>Email:</strong> {userData.email}
        </p>
        <p>
          <strong>Date of Birth:</strong> {new Date(userData.birthDate || '').toLocaleDateString('en-US')}
        </p>
        <p>
          <strong>Registered at:</strong> {userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : 'Not Available'}
        </p>
      </div>

      <h3 className={styles.formTitle}>Update Profile</h3>
      <Form method="post" className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="firstName">First Name:</label>
          <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} />
          {fieldErrors.firstName && <p className={styles.error}>{fieldErrors.firstName}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastName">Last Name:</label>
          <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} />
          {fieldErrors.lastName && <p className={styles.error}>{fieldErrors.lastName}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} />
          {isCheckingEmail && <p className={styles.duplicateEmail}>Checking email availability...</p>}
          {fieldErrors.email && <p className={styles.error}>{fieldErrors.email}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="birthDate">Date of Birth:</label>
          <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} onBlur={handleBlur} required />
          {fieldErrors.birthDate && <p className={styles.error}>{fieldErrors.birthDate}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} />
          {fieldErrors.password && <p className={styles.error}>{fieldErrors.password}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} />
          {fieldErrors.confirmPassword && <p className={styles.error}>{fieldErrors.confirmPassword}</p>}
        </div>

        <button type="submit" className={styles.updateButton}>
          Update
        </button>
      </Form>

      <button
        className={styles.deleteButton}
        onClick={() =>
          setShowModal({
            isVisible: true,
            message: user?.id === userData.id ? 'Are you sure you want to delete your account?' : 'Are you sure you want to delete this user?',
          })
        }
      >
        Delete Account
      </button>

      {showModal.isVisible && <Modal message={showModal.message} onYes={handleDeleteAccount} onNo={handleCancelDelete} />}
    </div>
  );
};

export default MyProfile;
