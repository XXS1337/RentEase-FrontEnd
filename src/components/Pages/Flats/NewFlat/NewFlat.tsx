import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import { useActionData, Form, useNavigate } from 'react-router-dom';
import { validateField } from '../../../../utils/validateField';
import type { FieldErrors, FormData } from '../../../../types/Flat';
import styles from './NewFlat.module.css';
import axios from '../../../../api/axiosConfig';
import Cookies from 'js-cookie';

export const newFlatAction = async ({ request }: { request: Request }) => {
  const token = Cookies.get('token');
  if (!token) return { errors: { general: 'Not authenticated' } };

  const formData = await request.formData();

  const adTitle = formData.get('adTitle') as string;
  const city = formData.get('city') as string;
  const streetName = formData.get('streetName') as string;
  const streetNumber = formData.get('streetNumber') as string;
  const areaSize = formData.get('areaSize') as string;
  const hasAC = formData.get('hasAC') === 'on';
  const yearBuilt = formData.get('yearBuilt') as string;
  const rentPrice = formData.get('rentPrice') as string;
  const imageFile = formData.get('image') as File;

  const dateAvailableRaw = formData.get('dateAvailable') as string;
  const [y, m, d] = dateAvailableRaw.split('-').map(Number);
  const dateAvailable = Date.UTC(y, m - 1, d);

  const errors: FieldErrors = {};
  errors.adTitle = await validateField('adTitle', adTitle);
  errors.city = await validateField('city', city);
  errors.streetName = await validateField('streetName', streetName);
  errors.streetNumber = await validateField('streetNumber', streetNumber);
  errors.areaSize = await validateField('areaSize', areaSize);
  errors.yearBuilt = await validateField('yearBuilt', yearBuilt);
  errors.rentPrice = await validateField('rentPrice', rentPrice);
  errors.dateAvailable = await validateField('dateAvailable', dateAvailable);
  errors.image = imageFile?.name ? await validateField('image', imageFile.name) : 'Image is required';

  Object.keys(errors).forEach((key) => {
    if (!errors[key as keyof FieldErrors]) delete errors[key as keyof FieldErrors];
  });

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const uploadData = new FormData();
    uploadData.append('adTitle', adTitle);
    uploadData.append('city', city);
    uploadData.append('streetName', streetName);
    uploadData.append('streetNumber', streetNumber);
    uploadData.append('areaSize', areaSize);
    uploadData.append('hasAC', String(hasAC));
    uploadData.append('yearBuilt', yearBuilt);
    uploadData.append('rentPrice', rentPrice);
    uploadData.append('dateAvailable', dateAvailable.toString());
    uploadData.append('image', imageFile);

    await axios.post('/flats', uploadData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding flat:', error);
    return { errors: { general: 'Failed to add flat. Please try again.' } };
  }
};

const NewFlat: React.FC = () => {
  const actionData = useActionData<{ success?: boolean; errors?: FieldErrors }>();
  const navigate = useNavigate();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormData>({
    adTitle: '',
    city: '',
    streetName: '',
    streetNumber: '',
    areaSize: '',
    yearBuilt: '',
    rentPrice: '',
    dateAvailable: '',
    image: null,
    hasAC: false,
  });
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (actionData?.success && !formSubmitted) {
      alert('Flat added successfully!');
      setFormSubmitted(true);
      setIsSubmitting(false);
      navigate('/myFlats');
    }
    if (actionData?.errors?.general) {
      setGeneralError(actionData.errors.general);
      setIsSubmitting(false);
    }
  }, [actionData, formSubmitted, navigate]);

  const handleBlur = async (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, files } = target;
    const fieldValue = name === 'image' ? files?.[0]?.name || '' : value;
    const error = await validateField(name, fieldValue);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
    setGeneralError(null);
  };

  const isFormValid = () => {
    const isValid = Object.values(fieldErrors).every((error) => !error) && Object.values(formData).every((value) => value !== '' && value !== null);
    return isValid;
  };

  return (
    <div className={styles.newFlat}>
      <h2>Add New Flat</h2>

      <Form method="post" encType="multipart/form-data" className={styles.form} onSubmit={() => setIsSubmitting(true)}>
        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="adTitle">Ad Title:</label>
            <input id="adTitle" name="adTitle" type="text" value={formData.adTitle} minLength={5} maxLength={60} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.adTitle && <p className={styles.error}>{fieldErrors.adTitle}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="city">City:</label>
            <input id="city" name="city" type="text" value={formData.city} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.city && <p className={styles.error}>{fieldErrors.city}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="streetName">Street Name:</label>
            <input id="streetName" name="streetName" type="text" value={formData.streetName} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.streetName && <p className={styles.error}>{fieldErrors.streetName}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="streetNumber">Street Number:</label>
            <input id="streetNumber" name="streetNumber" type="text" value={formData.streetNumber} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.streetNumber && <p className={styles.error}>{fieldErrors.streetNumber}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="areaSize">Area Size (m²):</label>
            <input id="areaSize" name="areaSize" type="number" value={formData.areaSize} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.areaSize && <p className={styles.error}>{fieldErrors.areaSize}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="yearBuilt">Year Built:</label>
            <input id="yearBuilt" name="yearBuilt" type="number" value={formData.yearBuilt} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.yearBuilt && <p className={styles.error}>{fieldErrors.yearBuilt}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="rentPrice">Rent Price (€):</label>
            <input id="rentPrice" name="rentPrice" type="number" value={formData.rentPrice} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.rentPrice && <p className={styles.error}>{fieldErrors.rentPrice}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="dateAvailable">Date Available:</label>
            <input id="dateAvailable" name="dateAvailable" type="date" value={formData.dateAvailable} onChange={handleChange} onBlur={handleBlur} required />
          </div>
          {fieldErrors.dateAvailable && <p className={styles.error}>{fieldErrors.dateAvailable}</p>}
        </div>

        <div className={styles.formGroup}>
          <div className={`${styles.inputContainer} ${styles.inputContainerCheckbox}`}>
            <label htmlFor="hasAC">Has AC:</label>
            <input id="hasAC" name="hasAC" type="checkbox" checked={formData.hasAC || false} onChange={handleChange} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="image">Flat Image:</label>
            <input id="image" name="image" type="file" accept="image/*" onChange={handleChange} onBlur={handleBlur} />
          </div>
          {formData.image && typeof formData.image === 'object' && (
            <div className={styles.imagePreview}>
              <p>Image Preview:</p>
              <img src={URL.createObjectURL(formData.image)} alt="Flat Preview" style={{ width: '200px' }} />
            </div>
          )}
          {fieldErrors.image && <p className={styles.error}>{fieldErrors.image}</p>}
        </div>

        {generalError && <p className={styles.error}>{generalError}</p>}

        <button type="submit" className={styles.saveButton} disabled={isSubmitting || !isFormValid()}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </Form>
    </div>
  );
};

export default NewFlat;
