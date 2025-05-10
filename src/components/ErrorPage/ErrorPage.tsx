import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ErrorPage.module.css';

// ErrorPage component to display when a route is not found or an error occurs
const ErrorPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.errorPage}>
      <h1>Oops! Something went wrong</h1>
      <p>We couldn’t find the page you were looking for.</p>
      <button className={styles.goBackButton} onClick={handleGoBack}>
        Go to Home page
      </button>
    </div>
  );
};

export default ErrorPage;
