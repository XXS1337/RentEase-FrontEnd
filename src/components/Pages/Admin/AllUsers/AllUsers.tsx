import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useLoaderData, useNavigate, redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from '../../../../api/axiosConfig';
import handleRemoveUser from '../../../../utils/handleRemoveUser';
import Modal from '../../../Shared/Modal/Modal';
import styles from './AllUsers.module.css';
import { useAuth } from '../../../../context/AuthContext';
import { useTranslate } from '../../../../i18n/useTranslate';

// Extended user type with extra fields used in UI
interface AugmentedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  age: number;
  publishedFlatsCount: number;
  role: string;
}

interface LoaderData {
  users: AugmentedUser[];
}

// Loader function to fetch all users
export const allUsersLoader = async () => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  try {
    const { data: response } = await axios.get('/users/allUsers', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return { users: response.data } satisfies LoaderData;
  } catch (err) {
    console.error('Failed to load users:', err);
    return redirect('/');
  }
};

const AllUsers: React.FC = () => {
  const t = useTranslate();
  const { users: initialUsers } = useLoaderData() as LoaderData;
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useAuth();

  // State for user list, filters, sort options, modal, and actions
  const [users, setUsers] = useState<AugmentedUser[]>(initialUsers);
  const [filters, setFilters] = useState({
    userType: '',
    minAge: '',
    maxAge: '',
    minFlats: '',
    maxFlats: '',
  });
  const [sortOption, setSortOption] = useState('');
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [showModal, setShowModal] = useState({ isVisible: false, message: '' });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Fetch filtered and sorted users
  const fetchUsers = async (appliedFilters = filters, sort = sortOption) => {
    const token = Cookies.get('token');
    const params: Record<string, string> = {};

    // Apply role filter
    if (appliedFilters.userType === 'admin') params.role = 'admin';
    else if (appliedFilters.userType === 'regular') params.role = 'user';

    // Apply age and flats count range filters
    if (appliedFilters.minAge || appliedFilters.maxAge) params.age = `${appliedFilters.minAge || 0}-${appliedFilters.maxAge || 120}`;
    if (appliedFilters.minFlats || appliedFilters.maxFlats) params.flatsCount = `${appliedFilters.minFlats || 0}-${appliedFilters.maxFlats || 1000}`;

    if (sort) params.sort = sort;

    try {
      const { data } = await axios.get('/users/allUsers', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setUsers(data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Refetch users when filters or sort change
  useEffect(() => {
    fetchUsers(filters, sortOption);
  }, [filters, sortOption]);

  // Update pending filter values
  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPendingFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Update sort value
  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  // Apply filters from pending state
  const applyFilters = () => {
    setFilters(pendingFilters);
  };

  // Reset filters and sorting
  const resetFilters = () => {
    const empty = { userType: '', minAge: '', maxAge: '', minFlats: '', maxFlats: '' };
    setPendingFilters(empty);
    setFilters(empty);
    setSortOption('');
  };

  // Keyboard shortcut: Enter to apply, Escape to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') applyFilters();
      else if (e.key === 'Escape') resetFilters();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingFilters]);

  // Toggle admin role for a specific user
  const handleAdminToggle = async (userId: string, isAdmin: boolean) => {
    setUpdatingUserId(userId);
    try {
      const token = Cookies.get('token');
      const newRole = isAdmin ? 'user' : 'admin';

      await axios.patch(
        `/users/updateRole/${userId}`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // If current user removed their own admin role, update context and redirect
      if (currentUser?.id === userId && newRole === 'user') {
        setUser({ ...currentUser, role: 'user' });
        navigate('/');
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Show confirmation modal for user deletion
  const confirmDeleteUser = (userId: string) => {
    setDeleteTargetId(userId);
    setShowModal({ isVisible: true, message: t('confirmDeleteUser') });
  };

  // Execute user deletion
  const handleDeleteUser = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await handleRemoveUser(deleteTargetId);
      fetchUsers();
      setDeleteTargetId(null);
      setShowModal({ isVisible: false, message: '' });
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(t('userDeleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete modal
  const cancelDelete = () => {
    setShowModal({ isVisible: false, message: '' });
    setDeleteTargetId(null);
  };

  return (
    <div className={styles.allUsers}>
      <h2>{t('allUsersTitle')}</h2>

      {/* Filter Section */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>{t('userType')}:</label>
          <select name="userType" value={pendingFilters.userType} onChange={handleFilterChange}>
            <option value="">{t('all')}</option>
            <option value="admin">{t('admin')}</option>
            <option value="regular">{t('regular')}</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>{t('ageRange')}</label>
          <input name="minAge" type="number" value={pendingFilters.minAge} onChange={handleFilterChange} placeholder={t('min')} />
          <input name="maxAge" type="number" value={pendingFilters.maxAge} onChange={handleFilterChange} placeholder={t('max')} />
        </div>
        <div className={styles.filterGroup}>
          <label>{t('flatsCount')}:</label>
          <input name="minFlats" type="number" value={pendingFilters.minFlats} onChange={handleFilterChange} placeholder={t('min')} />
          <input name="maxFlats" type="number" value={pendingFilters.maxFlats} onChange={handleFilterChange} placeholder={t('max')} />
        </div>
        <button onClick={applyFilters} className={styles.applyButton}>
          {t('applyFilters')}
        </button>
        <button onClick={resetFilters} className={styles.resetButton}>
          {t('resetFilters')}
        </button>
      </div>

      {/* Sort Section */}
      <div className={styles.sort}>
        <div className={styles.sortContainer}>
          <label>{t('sortBy')}</label>
          <select value={sortOption} onChange={handleSortChange}>
            <option value="">{t('none')}</option>
            <option value="firstName">{t('firstNameAZ')}</option>
            <option value="-firstName">{t('firstNameZA')}</option>
            <option value="lastName">{t('lastNameAZ')}</option>
            <option value="-lastName">{t('lastNameZA')}</option>
            <option value="publishedFlatsCount">{t('flatsAsc')}</option>
            <option value="-publishedFlatsCount">{t('flatsDesc')}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <table className={styles.userTable}>
        <thead>
          <tr>
            <th>{t('firstName')}</th>
            <th>{t('lastName')}</th>
            <th>{t('email')}</th>
            <th>{t('birthDate')}</th>
            <th>{t('age')}</th>
            <th>{t('flatsCount')}</th>
            <th>{t('isAdmin')}</th>
            <th>{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={8}>{t('noUsersFound')}</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.birthDate ? new Date(user.birthDate).toLocaleDateString('en-US') : 'N/A'}</td>
                <td>{user.age}</td>
                <td>{user.publishedFlatsCount}</td>
                <td>{user.role === 'admin' ? t('yes') : t('no')}</td>
                <td>
                  {/* Edit button redirects to self or admin edit page */}
                  <button
                    onClick={() => {
                      if (currentUser?.id === user.id) navigate('/profile');
                      else navigate(`/admin/edit-user/${user.id}`);
                    }}
                  >
                    {t('edit')}
                  </button>
                  {/* Toggle admin status */}
                  <button onClick={() => handleAdminToggle(user.id, user.role === 'admin')} disabled={updatingUserId === user.id}>
                    {updatingUserId === user.id ? t('updating') : user.role === 'admin' ? t('removeAdmin') : t('grantAdmin')}
                  </button>
                  {/* Trigger delete confirmation */}
                  <button onClick={() => confirmDeleteUser(user.id)}>{t('delete')}</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal for confirming user deletion */}
      {showModal.isVisible && <Modal message={showModal.message} onYes={handleDeleteUser} onNo={cancelDelete} yesDisabled={isDeleting} yesText={isDeleting ? t('deleting') : t('yes')} />}
    </div>
  );
};

export default AllUsers;
