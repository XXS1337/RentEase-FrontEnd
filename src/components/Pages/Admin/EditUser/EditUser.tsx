import React, { useEffect, useState } from 'react';
import { Form, useLoaderData, useActionData, redirect, useNavigate, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from '../../../../api/axiosConfig';
import handleRemoveUser from '../../../../utils/handleRemoveUser';
import { validateField } from '../../../../utils/validateField';
import Modal from '../../../Shared/Modal/Modal';
import type User from '../../../../types/User';
import styles from './../../../User/MyProfile/MyProfile.module.css';

export type FormData = Omit<User, 'id' | 'createdAt' | 'isAdmin' | 'role'> & {
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormData | 'general', string>>;

type ShowModalState = {
  isVisible: boolean;
  message: string;
};

export const editUserLoader = async ({ params }: LoaderFunctionArgs) => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  try {
    const { data } = await axios.get(`/users/getUserById/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    return redirect('/admin/all-users');
  }
};

export const editUserAction = async ({ request, params }: ActionFunctionArgs) => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  const formData = await request.formData();
  const rawData = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    birthDate: formData.get('birthDate') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const errors: FieldErrors = {};
  errors.firstName = await validateField('firstName', rawData.firstName);
  errors.lastName = await validateField('lastName', rawData.lastName);
  errors.email = await validateField('email', rawData.email, { checkEmail: true });
  errors.birthDate = await validateField('birthDate', rawData.birthDate);

  const payload: Record<string, string> = {
    firstName: rawData.firstName,
    lastName: rawData.lastName,
    email: rawData.email,
    birthDate: rawData.birthDate,
  };

  const isPasswordChanged = rawData.password.trim() !== '';

  if (isPasswordChanged) {
    errors.password = await validateField('password', rawData.password);
    errors.confirmPassword = await validateField('confirmPassword', rawData.confirmPassword, { password: rawData.password });
    payload.newPassword = rawData.password;
  }

  Object.keys(errors).forEach((key) => {
    if (!errors[key as keyof FieldErrors]) delete errors[key as keyof FieldErrors];
  });

  if (Object.keys(errors).length > 0) return { errors };

  try {
    await axios.patch(`/users/editProfile/${params.id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true };
  } catch (error: any) {
    return {
      errors: {
        general: error?.response?.data?.message || 'Failed to update user.',
      },
    };
  }
};

const EditUser: React.FC = () => {
  const userData = useLoaderData() as User;
  const actionData = useActionData() as { errors?: FieldErrors; success?: boolean } | undefined;
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showModal, setShowModal] = useState<ShowModalState>({ isVisible: false, message: '' });

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        birthDate: userData.birthDate?.split('T')[0] || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [userData]);

  useEffect(() => {
    if (actionData?.success) {
      alert('User updated successfully!');
      navigate('/admin/all-users');
    }
    if (actionData?.errors?.general) {
      alert(actionData.errors.general);
    }
  }, [actionData]);

  const validateFieldLocal = async (name: keyof FormData, value: string) => {
    let error = '';

    if (name === 'email') {
      setIsCheckingEmail(true);
      try {
        if (value !== userData.email) {
          const res = await axios.post('/users/checkEmail', { email: value });
          const available = res.data?.available;
          error = available ? '' : 'This email is already taken. Please use another.';
        }
      } catch (err) {
        error = 'Failed to check email availability. Please try again.';
      } finally {
        setIsCheckingEmail(false);
      }
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

  const isFormValid = () => {
    const hasErrors = Object.values(fieldErrors).some((error) => error);
    const hasChanges =
      formData.firstName !== userData.firstName ||
      formData.lastName !== userData.lastName ||
      formData.email !== userData.email ||
      formData.birthDate !== (userData.birthDate?.split('T')[0] || '') ||
      formData.password.trim() !== '' ||
      formData.confirmPassword.trim() !== '';

    return !hasErrors && hasChanges && !isCheckingEmail;
  };

  const handleDeleteUser = async () => {
    try {
      await handleRemoveUser(userData.id);
      alert('User deleted successfully!');
      navigate('/admin/all-users');
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
      <h2 className={styles.profileTitle}>Edit User</h2>

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

      <Form method="post" className={styles.form}>
        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="firstName">First Name:</label>
            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} />
          </div>
          {fieldErrors.firstName && <p className={styles.error}>{fieldErrors.firstName}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="lastName">Last Name:</label>
            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} />
          </div>
          {fieldErrors.lastName && <p className={styles.error}>{fieldErrors.lastName}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} />
          </div>
          {isCheckingEmail && <p className={styles.duplicateEmail}>Checking email availability...</p>}
          {fieldErrors.email && <p className={styles.error}>{fieldErrors.email}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="birthDate">Date of Birth:</label>
            <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.birthDate && <p className={styles.error}>{fieldErrors.birthDate}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} />
          </div>
          {fieldErrors.password && <p className={styles.error}>{fieldErrors.password}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} />
          </div>
          {fieldErrors.confirmPassword && <p className={styles.error}>{fieldErrors.confirmPassword}</p>}
        </div>

        <button type="submit" className={styles.updateButton} disabled={!isFormValid()}>
          Update
        </button>
      </Form>

      <button className={styles.deleteButton} onClick={() => setShowModal({ isVisible: true, message: 'Are you sure you want to delete this user?' })}>
        Delete User
      </button>

      <button className={styles.backButton} onClick={() => navigate('/admin/all-users')}>
        Back to All Users
      </button>

      {showModal.isVisible && <Modal message={showModal.message} onYes={handleDeleteUser} onNo={handleCancelDelete} />}
    </div>
  );
};

export default EditUser;
