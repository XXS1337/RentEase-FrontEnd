import React, { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { IoMdHeartEmpty, IoMdHeart } from 'react-icons/io';
import axios from './../../../../api/axiosConfig';
import Spinner from '../../../Shared/Spinner/Spinner';
import styles from './Home.module.css';

export const homeLoader = async () => {
  const token = Cookies.get('token');
  if (!token) return { flats: [], userId: null };

  let userData;
  try {
    const res = await axios.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    userData = res.data;
  } catch (err) {
    console.warn('Unauthorized or invalid token');
    return { flats: [], userId: null };
  }

  const { data: flatsData } = await axios.get('/flats');

  const favoriteFlatIds = userData?.currentUser?.favoriteFlats || [];

  const flats = flatsData.data.map((flat: any) => ({
    ...flat,
    id: flat._id,
    favorite: favoriteFlatIds.includes(flat._id),
    image: flat.image?.url,
  }));

  return { flats, userId: userData.currentUser._id };
};

const Home: React.FC = () => {
  const { flats: initialFlats, userId } = useLoaderData() as { flats: any[]; userId: string };
  const [flats, setFlats] = useState<any[]>(initialFlats);
  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
  });
  const [pendingFilters, setPendingFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
  });
  const [sortOption, setSortOption] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ price?: string; area?: string }>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const mapSortToQuery = (option: string) => {
    switch (option) {
      case 'cityAsc':
        return 'city';
      case 'cityDesc':
        return '-city';
      case 'priceAsc':
        return 'rentPrice';
      case 'priceDesc':
        return '-rentPrice';
      case 'areaAsc':
        return 'areaSize';
      case 'areaDesc':
        return '-areaSize';
      default:
        return '';
    }
  };

  const fetchFlatsFromServer = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.city) params.city = filters.city;
      if (filters.minPrice || filters.maxPrice) params.rentPrice = `${filters.minPrice || 0}-${filters.maxPrice || 10000}`;
      if (filters.minArea || filters.maxArea) params.areaSize = `${filters.minArea || 0}-${filters.maxArea || 1000}`;
      if (sortOption) params.sort = mapSortToQuery(sortOption);

      const { data } = await axios.get('/flats', { params });
      const token = Cookies.get('token');
      let favoriteFlatIds: string[] = [];
      if (token) {
        try {
          const res = await axios.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          favoriteFlatIds = res.data?.currentUser?.favoriteFlats || [];
        } catch (err) {
          console.warn('Could not fetch favorites');
        }
      }

      const enriched = data.data.map((flat: any) => ({
        ...flat,
        id: flat._id,
        favorite: favoriteFlatIds.includes(flat._id),
        image: flat.image?.url,
      }));
      setFlats(enriched);
    } catch (err) {
      console.error('Failed to fetch flats:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sortOption, userId]);

  useEffect(() => {
    const errors: typeof validationErrors = {};
    const minPrice = parseFloat(pendingFilters.minPrice);
    const maxPrice = parseFloat(pendingFilters.maxPrice);
    if (pendingFilters.minPrice && pendingFilters.maxPrice && minPrice > maxPrice) {
      errors.price = 'Min price must be less than max price';
    }
    const minArea = parseFloat(pendingFilters.minArea);
    const maxArea = parseFloat(pendingFilters.maxArea);
    if (pendingFilters.minArea && pendingFilters.maxArea && minArea > maxArea) {
      errors.area = 'Min area must be less than max area';
    }
    setValidationErrors(errors);
  }, [pendingFilters]);

  useEffect(() => {
    fetchFlatsFromServer();
  }, [sortOption, fetchFlatsFromServer]);

  const handleFavorite = async (flat: any) => {
    console.log('handleFavorite called for flat:', flat.id);
    if (!userId) {
      navigate('/login');
      return;
    }
    try {
      if (flat.favorite) {
        await axios.delete(`/flats/${flat.id}/removeFromFavorites`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        });
      } else {
        await axios.post(
          `/flats/${flat.id}/addToFavorites`,
          {},
          {
            headers: { Authorization: `Bearer ${Cookies.get('token')}` },
          }
        );
      }
      setFlats((prev) => prev.map((f) => (f.id === flat.id ? { ...f, favorite: !flat.favorite } : f)));
    } catch (err) {
      console.error('Favorite update failed', err);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPendingFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  const applyFilters = () => {
    setFilters(pendingFilters);
  };

  const resetFilters = () => {
    const reset = { city: '', minPrice: '', maxPrice: '', minArea: '', maxArea: '' };
    setPendingFilters(reset);
    setFilters(reset);
    setSortOption('');
  };

  return (
    <div className={styles.home}>
      <h2>Available Flats</h2>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="city">City:</label>
          <input type="text" id="city" name="city" value={pendingFilters.city} onChange={handleFilterChange} placeholder="Enter city" />
        </div>
        <div className={styles.filterGroup}>
          <label>Price Range:</label>
          <input type="number" name="minPrice" value={pendingFilters.minPrice} onChange={handleFilterChange} placeholder="Min (€)" />
          <input type="number" name="maxPrice" value={pendingFilters.maxPrice} onChange={handleFilterChange} placeholder="Max (€)" />
        </div>
        <div className={styles.filterGroup}>
          <label>Area Size (m²):</label>
          <input type="number" name="minArea" value={pendingFilters.minArea} onChange={handleFilterChange} placeholder="Min" />
          <input type="number" name="maxArea" value={pendingFilters.maxArea} onChange={handleFilterChange} placeholder="Max" />
        </div>
        <button onClick={applyFilters} className={styles.applyButton} disabled={Object.keys(validationErrors).length > 0}>
          Apply Filters
        </button>
        <button onClick={resetFilters} className={styles.resetButton}>
          Reset Filters
        </button>
      </div>
      <div className={styles.filterErrors}>
        {validationErrors.price && <p className={styles.error}>{validationErrors.price}</p>}
        {validationErrors.area && <p className={styles.error}>{validationErrors.area}</p>}
      </div>

      <div className={styles.sort}>
        <div className={styles.sortContainer}>
          <label htmlFor="sortOptions">Sort By:</label>
          <select id="sortOptions" value={sortOption} onChange={handleSortChange}>
            <option value="">None</option>
            <option value="cityAsc">City (A-Z)</option>
            <option value="cityDesc">City (Z-A)</option>
            <option value="priceAsc">Price (Low to High)</option>
            <option value="priceDesc">Price (High to Low)</option>
            <option value="areaAsc">Area Size (Small to Large)</option>
            <option value="areaDesc">Area Size (Large to Small)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className={styles.gridContainer}>
          {flats.length === 0 ? (
            <p className={styles.noResults}>No flats match your search criteria.</p>
          ) : (
            flats.map((flat) => (
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
                    <strong>Date available:</strong> {new Date(flat.dateAvailable).toLocaleDateString('en-US')}
                  </p>
                  {flat.favorite ? (
                    <IoMdHeart
                      className={styles.filledHeart}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFavorite(flat);
                      }}
                    />
                  ) : (
                    <IoMdHeartEmpty
                      className={styles.emptyHeart}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFavorite(flat);
                      }}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
