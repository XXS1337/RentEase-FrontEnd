import React, { useState } from 'react';
import { useLoaderData, useNavigate, redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from './../../../api/axiosConfig';
import { FaRegTrashAlt, FaEdit } from 'react-icons/fa';
import styles from './MyFlats.module.css';

// Loader to fetch flats of the logged-in user
export const myFlatsLoader = async () => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  try {
    const { data } = await axios.get('/flats/myFlats', {
      headers: { Authorization: `Bearer ${token}` },
    });

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
  const [myFlats, setMyFlats] = useState<any[]>(initialFlats);
  const navigate = useNavigate();

  const handleDeleteFlat = async (flatId: string) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(`/flats/${flatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyFlats((prevFlats) => prevFlats.filter((flat) => flat.id !== flatId));
    } catch (error) {
      console.error('Error deleting flat:', error);
    }
  };

  return (
    <div className={styles.myFlats}>
      <div className={styles.header}>
        <h2>Manage Your Flats</h2>
        <button className={styles.newFlatButton} onClick={() => navigate('/flats/new')}>
          Insert New Flat
        </button>
      </div>
      {myFlats.length === 0 ? (
        <p className={styles.noResults}>You have not published any flats.</p>
      ) : (
        <div className={styles.gridContainer}>
          {myFlats.map((flat) => (
            <div className={styles.gridItem} key={flat.id}>
              <div className={styles.flatImage} onClick={() => navigate(`/flats/view/${flat.id}`)} style={{ cursor: 'pointer' }}>
                <img src={flat.image} alt={flat.adTitle} />
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
                <FaRegTrashAlt className={styles.deleteFlat} onClick={() => handleDeleteFlat(flat.id)} title="Delete Flat" />
                <FaEdit className={styles.editFlat} onClick={() => navigate(`/flats/edit/${flat.id}`)} title="Edit Flat" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFlats;
