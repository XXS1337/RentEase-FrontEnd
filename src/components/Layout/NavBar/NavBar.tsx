import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Modal from '../../Shared/Modal/Modal';
import styles from './NavBar.module.css';
import my_logo from './../../../assets/logo/logo-no-background.png';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

// State type for modal visibility and message
type ShowModalState = {
  isVisible: boolean;
  message: string;
};

const NavBar: React.FC = () => {
  const { user, logout } = useAuth(); // Access current user and logout function from auth context
  const [showModal, setShowModal] = useState<ShowModalState>({ isVisible: false, message: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Toggle state for mobile menu
  const { theme, toggleTheme } = useTheme();

  // Function to close menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Trigger logout confirmation modal
  const logOut = () => {
    setShowModal({ isVisible: true, message: 'Are you sure you want to log out?' });
    closeMenu();
  };

  // Handle confirmation: perform logout and close modal
  const onYes = () => {
    setShowModal({ isVisible: false, message: '' });
    logout();
  };

  // Handle cancel: just close the modal
  const onNo = () => {
    setShowModal({ isVisible: false, message: '' });
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.navbarLeftSide}>
          <div className={styles.navbarLogo}>
            <a href="/" className={styles.navbarLink}>
              <img src={my_logo} alt="Logo" />
            </a>
            <h2 className={styles.navbarHeading}>Unlock the Door to Your Dream Flat!</h2>
          </div>

          <div className={styles.navbarLeftSideGreetingTheme}>
            <div className={styles.userGreeting}>
              Hello, {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
              {user?.role === 'admin' && ' (Admin)'}!
            </div>

            <button onClick={toggleTheme} className={styles.themeToggle} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'dark' ? <MdLightMode className={styles.sunIcon} /> : <MdDarkMode className={styles.moonIcon} />}
            </button>
          </div>
        </div>

        <button className={styles.hamburger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <GiHamburgerMenu />
        </button>

        <nav className={`${styles.navLinks} ${isMenuOpen ? styles.showMenu : ''}`}>
          {!user ? (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? styles.active : '')} onClick={closeMenu}>
                Login
              </NavLink>
              <NavLink to="/forgot-password" className={({ isActive }) => (isActive ? styles.active : '')} onClick={closeMenu}>
                Forgot Password
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => (isActive ? styles.active : '')} onClick={closeMenu}>
                Register
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/myFlats" className={({ isActive }) => (isActive ? styles.active : '')} onClick={closeMenu}>
                My Flats
              </NavLink>
              <NavLink to="/favorites" className={({ isActive }) => (isActive ? styles.active : '')} onClick={closeMenu}>
                Favorites
              </NavLink>
              <NavLink to="/flats/new" className={({ isActive }) => (isActive ? styles.active : '')} onClick={closeMenu}>
                New Flat
              </NavLink>
              <NavLink to={`/profile`} className={({ isActive }) => (isActive ? styles.active : '')} onClick={closeMenu}>
                My Profile
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin/all-users" className={({ isActive }) => (isActive ? styles.active : '')} onClick={closeMenu}>
                  All Users
                </NavLink>
              )}
              <button onClick={logOut} className={styles.logoutButton}>
                Logout
              </button>
            </>
          )}
        </nav>
      </div>

      {showModal.isVisible && <Modal message={showModal.message} onYes={onYes} onNo={onNo} />}
    </div>
  );
};

export default NavBar;
