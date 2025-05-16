import React, { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useLoaderData, useNavigate, redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from '../../../../api/axiosConfig';
import calculateAge from '../../../../utils/calculateAge';
import Modal from '../../../Shared/Modal/Modal';
import type User from '../../../../types/User';
import styles from './AllUsers.module.css';

// Augmented types for enriched user data
export type AugmentedUser = User & {
  age: number;
  publishedFlatsCount: number;
  isAdmin: boolean;
};

interface LoaderData {
  users: AugmentedUser[];
}

export const allUsersLoader = async () => {
  const token = Cookies.get('token');
  if (!token) return redirect('/login');

  try {
    const { data: response } = await axios.get('/users/allUsers', {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(response);
    const users: AugmentedUser[] = response.data.map((user: any) => ({
      ...user,
      id: user._id,
      age: user.birthDate ? calculateAge(new Date(user.birthDate)) : 0,
      publishedFlatsCount: user.addedFlats?.length || 0,
      isAdmin: user.role === 'admin',
    }));

    return { users } satisfies LoaderData;
  } catch (err) {
    console.error('Failed to load users:', err);
    return redirect('/');
  }
};

const AllUsers: React.FC = () => {
  const loaderData = useLoaderData() as LoaderData;
  const navigate = useNavigate();
  const [allUsersState, setAllUsersState] = useState<AugmentedUser[]>(loaderData.users);
  const [users, setUsers] = useState<AugmentedUser[]>(loaderData.users);
  const [filters, setFilters] = useState({
    userType: '',
    minAge: '',
    maxAge: '',
    minFlats: '',
    maxFlats: '',
  });
  const [sortOption, setSortOption] = useState('');
  const [showModal, setShowModal] = useState({ isVisible: false, message: '' });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleAdminToggle = async (userId: string, isAdmin: boolean) => {
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

      setAllUsersState((prev) => prev.map((user) => (user.id === userId ? { ...user, isAdmin: !isAdmin } : user)));
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isAdmin: !isAdmin } : user)));
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const confirmDeleteUser = (userId: string) => {
    setDeleteTargetId(userId);
    setShowModal({ isVisible: true, message: 'Are you sure you want to delete this user?' });
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetId) return;
    try {
      const token = Cookies.get('token');
      await axios.delete(`/users/deleteProfile/${deleteTargetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUsers = allUsersState.filter((user) => user.id !== deleteTargetId);
      setAllUsersState(updatedUsers);
      setUsers(updatedUsers);
      setDeleteTargetId(null);
      setShowModal({ isVisible: false, message: '' });
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const cancelDelete = () => {
    setShowModal({ isVisible: false, message: '' });
    setDeleteTargetId(null);
  };

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allUsersState];
    const minAge = parseInt(filters.minAge);
    const maxAge = parseInt(filters.maxAge);
    const minFlats = parseInt(filters.minFlats);
    const maxFlats = parseInt(filters.maxFlats);

    if (filters.userType === 'admin') filtered = filtered.filter((u) => u.isAdmin);
    else if (filters.userType === 'regular') filtered = filtered.filter((u) => !u.isAdmin);

    if (!isNaN(minAge)) filtered = filtered.filter((u) => u.age >= minAge);
    if (!isNaN(maxAge)) filtered = filtered.filter((u) => u.age <= maxAge);
    if (!isNaN(minFlats)) filtered = filtered.filter((u) => u.publishedFlatsCount >= minFlats);
    if (!isNaN(maxFlats)) filtered = filtered.filter((u) => u.publishedFlatsCount <= maxFlats);

    setUsers(sortUsers(filtered, sortOption));
  }, [filters, sortOption, allUsersState]);

  const sortUsers = (list: AugmentedUser[], option: string) => {
    const sorted = [...list];
    switch (option) {
      case 'firstNameAsc':
        sorted.sort((a, b) => a.firstName.localeCompare(b.firstName));
        break;
      case 'firstNameDesc':
        sorted.sort((a, b) => b.firstName.localeCompare(a.firstName));
        break;
      case 'lastNameAsc':
        sorted.sort((a, b) => a.lastName.localeCompare(b.lastName));
        break;
      case 'lastNameDesc':
        sorted.sort((a, b) => b.lastName.localeCompare(a.lastName));
        break;
      case 'flatsCountAsc':
        sorted.sort((a, b) => a.publishedFlatsCount - b.publishedFlatsCount);
        break;
      case 'flatsCountDesc':
        sorted.sort((a, b) => b.publishedFlatsCount - a.publishedFlatsCount);
        break;
    }
    return sorted;
  };

  const resetFilters = () => {
    const empty = { userType: '', minAge: '', maxAge: '', minFlats: '', maxFlats: '' };
    setFilters(empty);
    setSortOption('');
    setUsers(allUsersState);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSortOption(value);
    setUsers(sortUsers(users, value));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') applyFilters();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applyFilters]);

  return (
    <div className={styles.allUsers}>
      <h2>All Registered Users</h2>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="userType">User Type:</label>
          <select id="userType" name="userType" value={filters.userType} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="admin">Admin</option>
            <option value="regular">Regular</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Age Range:</label>
          <input name="minAge" type="number" value={filters.minAge} onChange={handleFilterChange} placeholder="Min" />
          <input name="maxAge" type="number" value={filters.maxAge} onChange={handleFilterChange} placeholder="Max" />
        </div>
        <div className={styles.filterGroup}>
          <label>Flats Count:</label>
          <input name="minFlats" type="number" value={filters.minFlats} onChange={handleFilterChange} placeholder="Min" />
          <input name="maxFlats" type="number" value={filters.maxFlats} onChange={handleFilterChange} placeholder="Max" />
        </div>
        <button onClick={applyFilters} className={styles.applyButton}>
          Apply Filters
        </button>
        <button onClick={resetFilters} className={styles.resetButton}>
          Reset Filters
        </button>
      </div>

      <div className={styles.sort}>
        <div className={styles.sortContainer}>
          <label htmlFor="sortOptions">Sort By:</label>
          <select id="sortOptions" value={sortOption} onChange={handleSortChange}>
            <option value="">None</option>
            <option value="firstNameAsc">First Name (A-Z)</option>
            <option value="firstNameDesc">First Name (Z-A)</option>
            <option value="lastNameAsc">Last Name (A-Z)</option>
            <option value="lastNameDesc">Last Name (Z-A)</option>
            <option value="flatsCountAsc">Flats Count (Asc)</option>
            <option value="flatsCountDesc">Flats Count (Desc)</option>
          </select>
        </div>
      </div>

      <table className={styles.userTable}>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Date of Birth</th>
            <th>Age</th>
            <th>Flats Count</th>
            <th>Is Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={8}>No users match the criteria.</td>
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
                <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => navigate(`/admin/edit-user/${user.id}`)}>Edit</button>
                  <button onClick={() => handleAdminToggle(user.id, user.isAdmin)}>{user.isAdmin ? 'Remove Admin' : 'Grant Admin'}</button>
                  <button onClick={() => confirmDeleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal.isVisible && <Modal message={showModal.message} onYes={handleDeleteUser} onNo={cancelDelete} />}
    </div>
  );
};

export default AllUsers;
