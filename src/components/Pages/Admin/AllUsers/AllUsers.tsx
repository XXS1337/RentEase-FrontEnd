import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useLoaderData, useNavigate, redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from '../../../../api/axiosConfig';
import handleRemoveUser from '../../../../utils/handleRemoveUser';
import Modal from '../../../Shared/Modal/Modal';
import styles from './AllUsers.module.css';
import { useAuth } from '../../../../context/AuthContext';

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
    setShowModal({ isVisible: true, message: 'Are you sure you want to delete this user?' });
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
      alert('Failed to remove user. Please try again later.');
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
      <h2>All Registered Users</h2>

      {/* Filter Section */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>User Type:</label>
          <select name="userType" value={pendingFilters.userType} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="admin">Admin</option>
            <option value="regular">Regular</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Age Range:</label>
          <input name="minAge" type="number" value={pendingFilters.minAge} onChange={handleFilterChange} placeholder="Min" />
          <input name="maxAge" type="number" value={pendingFilters.maxAge} onChange={handleFilterChange} placeholder="Max" />
        </div>
        <div className={styles.filterGroup}>
          <label>Flats Count:</label>
          <input name="minFlats" type="number" value={pendingFilters.minFlats} onChange={handleFilterChange} placeholder="Min" />
          <input name="maxFlats" type="number" value={pendingFilters.maxFlats} onChange={handleFilterChange} placeholder="Max" />
        </div>
        <button onClick={applyFilters} className={styles.applyButton}>
          Apply Filters
        </button>
        <button onClick={resetFilters} className={styles.resetButton}>
          Reset Filters
        </button>
      </div>

      {/* Sort Section */}
      <div className={styles.sort}>
        <div className={styles.sortContainer}>
          <label>Sort By:</label>
          <select value={sortOption} onChange={handleSortChange}>
            <option value="">None</option>
            <option value="firstName">First Name (A-Z)</option>
            <option value="-firstName">First Name (Z-A)</option>
            <option value="lastName">Last Name (A-Z)</option>
            <option value="-lastName">Last Name (Z-A)</option>
            <option value="publishedFlatsCount">Flats Count (Ascending)</option>
            <option value="-publishedFlatsCount">Flats Count (Descending)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
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
                <td>{user.role === 'admin' ? 'Yes' : 'No'}</td>
                <td>
                  {/* Edit button redirects to self or admin edit page */}
                  <button
                    onClick={() => {
                      if (currentUser?.id === user.id) navigate('/profile');
                      else navigate(`/admin/edit-user/${user.id}`);
                    }}
                  >
                    Edit
                  </button>
                  {/* Toggle admin status */}
                  <button onClick={() => handleAdminToggle(user.id, user.role === 'admin')} disabled={updatingUserId === user.id}>
                    {updatingUserId === user.id ? 'Updating...' : user.role === 'admin' ? 'Remove Admin' : 'Grant Admin'}
                  </button>
                  {/* Trigger delete confirmation */}
                  <button onClick={() => confirmDeleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal for confirming user deletion */}
      {showModal.isVisible && <Modal message={showModal.message} onYes={handleDeleteUser} onNo={cancelDelete} yesDisabled={isDeleting} yesText={isDeleting ? 'Deleting...' : 'Yes'} />}
    </div>
  );
};

export default AllUsers;
