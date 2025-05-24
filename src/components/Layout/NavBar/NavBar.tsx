import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../Shared/Modal/Modal';
import styles from './NavBar.module.css';
import my_logo from './../../../assets/logo/logo-no-background.png';

// State type for modal visibility and message
type ShowModalState = {
  isVisible: boolean;
  message: string;
};

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState<ShowModalState>({ isVisible: false, message: '' });

  const logOut = () => {
    setShowModal({ isVisible: true, message: 'Are you sure you want to log out?' });
  };

  const onYes = () => {
    setShowModal({ isVisible: false, message: '' });
    logout();
  };

  const onNo = () => {
    setShowModal({ isVisible: false, message: '' });
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.navbarLeftSide}>
        <div className={styles.navbarLogo}>
          <a href="/" className={styles.navbarLink}>
            <img src={my_logo} alt="Logo" />
          </a>
          <h2 className={styles.navbarHeading}>Unlock the Door to Your Dream Flat!</h2>
        </div>

        <div className={styles.userGreeting}>
          Hello, {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
          {user?.role === 'admin' && ' (Admin)'}!
        </div>
      </div>

      <nav>
        {!user ? (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? styles.active : '')}>
              Login
            </NavLink>
            <NavLink to="/forgot-password" className={({ isActive }) => (isActive ? styles.active : '')}>
              Forgot Password
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? styles.active : '')}>
              Register
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/myFlats" className={({ isActive }) => (isActive ? styles.active : '')}>
              My Flats
            </NavLink>
            <NavLink to="/favorites" className={({ isActive }) => (isActive ? styles.active : '')}>
              Favorites
            </NavLink>
            <NavLink to="/flats/new" className={({ isActive }) => (isActive ? styles.active : '')}>
              New Flat
            </NavLink>
            <NavLink to={`/profile`} className={({ isActive }) => (isActive ? styles.active : '')}>
              My Profile
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin/all-users" className={({ isActive }) => (isActive ? styles.active : '')}>
                All Users
              </NavLink>
            )}
            <button onClick={logOut} className={styles.logoutButton}>
              Logout
            </button>
          </>
        )}
      </nav>

      {showModal.isVisible && <Modal message={showModal.message} onYes={onYes} onNo={onNo} />}
    </div>
  );
};

export default NavBar;
