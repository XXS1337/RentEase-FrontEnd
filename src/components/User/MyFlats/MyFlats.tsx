import React, { useState } from 'react';
import { useLoaderData, useNavigate, redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from './../../../api/axiosConfig';
import { FaRegTrashAlt, FaEdit } from 'react-icons/fa';
import { FaSearchPlus } from 'react-icons/fa';
import ImageHoverPreview from '../../Shared/ImageHoverPreview/ImageHoverPreview';
import { useImageHover } from '../../../utils/useImageHover';
import styles from './MyFlats.module.css';

// Loader to fetch the flats added by the currently logged-in user
export const myFlatsLoader = async () => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  try {
    // Request user's flats from backend
    const { data } = await axios.get('/flats/myFlats', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Format flat data (ensure we use flat.id and flat.image.url)
    const flats = data.data.map((flat: any) => ({
      ...flat,
      id: flat._id,
      image: flat.image?.url,
    }));

    return { flats };
  } catch (err) {
    console.error('Failed to load user flats:', err);
    return redirect('/login');
  }
};

const MyFlats: React.FC = () => {
  const { flats: initialFlats } = useLoaderData() as { flats: any[] };
  const navigate = useNavigate();
  const { previewImage, hoverPosition, onMouseEnter, onMouseLeave, onMouseMove, previewSize } = useImageHover();

  // State to hold the user's flats
  const [myFlats, setMyFlats] = useState<any[]>(initialFlats);

  // Delete a flat and update the UI immediately
  const handleDeleteFlat = async (flatId: string) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(`/flats/${flatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove the flat from local state
      setMyFlats((prevFlats) => prevFlats.filter((flat) => flat.id !== flatId));
    } catch (error) {
      console.error('Error deleting flat:', error);
    }
  };

  return (
    <div className={styles.myFlats}>
      <div className={styles.header}>
        <h2>Manage Your Flats</h2>

        {/* New Flat button */}
        <button className={styles.newFlatButton} onClick={() => navigate('/flats/new')}>
          Insert New Flat
        </button>
      </div>

      {/* Display message if no flats exist */}
      {myFlats.length === 0 ? (
        <p className={styles.noResults}>You have not published any flats.</p>
      ) : (
        <div className={styles.gridContainer}>
          {myFlats.map((flat) => (
            <div className={styles.gridItem} key={flat.id}>
              <div className={styles.flatImage} onClick={() => navigate(`/flats/view/${flat.id}`)} style={{ cursor: 'pointer' }}>
                <img src={flat.image} alt={flat.adTitle} />
                {/* Zoom icon shown on hover */}
                <FaSearchPlus className={styles.zoomIcon} title="Preview Image" onMouseEnter={(e) => onMouseEnter(e, flat.image)} onMouseLeave={onMouseLeave} onMouseMove={onMouseMove} onClick={(e) => e.stopPropagation()} />
              </div>
              <div className={styles.flatDetails}>
                <h3>{flat.adTitle}</h3>
                <p>
                  <strong>City:</strong> {flat.city}
                </p>
                <p>
                  <strong>Street name:</strong> {flat.streetName}
                </p>
                <p>
                  <strong>Street number:</strong> {flat.streetNumber}
                </p>
                <p>
                  <strong>Area size:</strong> {flat.areaSize} m²
                </p>
                <p>
                  <strong>Has AC:</strong> {flat.hasAC ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Year built:</strong> {flat.yearBuilt}
                </p>
                <p>
                  <strong>Rent price:</strong> {flat.rentPrice} €/month
                </p>
                <p>
                  <strong>Date available:</strong> {new Date(flat.dateAvailable).toLocaleDateString('ro-RO', { timeZone: 'UTC' })}
                </p>

                {/* Delete button */}
                <FaRegTrashAlt className={styles.deleteFlat} onClick={() => handleDeleteFlat(flat.id)} title="Delete Flat" />

                {/* Edit button */}
                <FaEdit className={styles.editFlat} onClick={() => navigate(`/flats/edit/${flat.id}`)} title="Edit Flat" />
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal preview */}
      <ImageHoverPreview image={previewImage} position={hoverPosition} size={previewSize} />
    </div>
  );
};

export default MyFlats;
