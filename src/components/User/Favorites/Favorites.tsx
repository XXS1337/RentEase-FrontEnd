import React from 'react';
import { useLoaderData, useNavigate, redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from './../../../api/axiosConfig';
import { IoMdHeart } from 'react-icons/io';
import styles from './Favorites.module.css';

// Loader function to fetch the user's favorite flats
export const favoritesLoader = async () => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  try {
    // Fetch current user and their list of favorite flat IDs
    const { data } = await axios.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const favoriteFlatIds = data.currentUser.favoriteFlats || [];

    // Fetch all flats from database
    const { data: flatsData } = await axios.get('/flats');

    // Filter and format only the favorite flats
    const favorites = flatsData.data
      .filter((flat: any) => favoriteFlatIds.includes(flat._id))
      .map((flat: any) => ({
        ...flat,
        id: flat._id,
        image: flat.image?.url,
      }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { favorites };
  } catch (err) {
    console.error('Failed to load favorite flats:', err);
    return redirect('/login');
  }
};

const Favorites: React.FC = () => {
  const { favorites } = useLoaderData() as { favorites: any[] };
  const navigate = useNavigate();

  // Handle the removal of a flat from user's favorites
  const handleRemoveFavorite = async (flatId: string) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(`/flats/${flatId}/removeFromFavorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reload to reflect updated state
      window.location.reload();
    } catch (error) {
      console.error('Error removing favorite flat:', error);
    }
  };

  return (
    <div className={styles.favorites}>
      <h2>Your Favorite Flats</h2>

      {/* If no favorites, show fallback message */}
      {favorites.length === 0 ? (
        <p className={styles.noResults}>You have no favorite flats.</p>
      ) : (
        <div className={styles.gridContainer}>
          {favorites.map((flat) => (
            <div className={styles.gridItem} key={flat.id}>
              {/* Image section (click navigates to flat details) */}
              <div className={styles.flatImage} onClick={() => navigate(`/flats/view/${flat.id}`)} style={{ cursor: 'pointer' }}>
                <img src={flat.image} alt={flat.adTitle} />
              </div>

              {/* Flat details */}
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
                  <strong>Date available:</strong> {new Date(flat.dateAvailable).toLocaleDateString('en-US')}
                </p>
                {/* Remove from favorites button */}
                <IoMdHeart className={styles.removeFavorite} onClick={() => handleRemoveFavorite(flat.id)} title="Remove from Favorites" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
