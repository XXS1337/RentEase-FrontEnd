import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout/AppLayout';
import Home, { homeLoader } from './components/Pages/Flats/Home/Home';
import Login, { loginAction } from './components/Auth/Login';
import ErrorPage from './components/ErrorPage/ErrorPage';
import GuestRoute from './components/Shared/GuestRoute/GuestRoute';
import Register, { registerAction } from './components/Auth/Register';
// import NewFlat, { newFlatAction } from './components/Pages/Flats/NewFlat/NewFlat';
// import ViewFlat, { viewFlatLoader } from './components/Pages/Flats/ViewFlat/ViewFlat';
// import Messages, { messagesLoader, messagesAction } from './components/Pages/Flats/Messages/Messages';
// import EditFlat, { editFlatLoader, editFlatAction } from './components/Pages/Flats/EditFlat/EditFlat';
// import MyProfile, { myProfileAction } from './components/User/MyProfile/MyProfile';
// import MyFlats, { myFlatsLoader } from './components/User/MyFlats/MyFlats';
// import Favorites, { favoritesLoader } from './components/User/Favorites/Favorites';
// import AllUsers, { allUsersLoader } from './components/Pages/Admin/AllUsers/AllUsers';
// import ProtectedRoute from './components/Shared/ProtectedRoute/ProtectedRoute';

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: homeLoader,
      },
      {
        element: <GuestRoute />,
        children: [
          {
            path: 'login',
            element: <Login />,
            action: loginAction,
          },
          {
            path: 'register',
            element: <Register />,
            action: registerAction,
          },
        ],
      },
      // {
      //   path: 'myFlats',
      //   element: <ProtectedRoute />,
      //   children: [
      //     {
      //       index: true,
      //       element: <MyFlats />,
      //       loader: myFlatsLoader,
      //     },
      //   ],
      // },
      // {
      //   path: 'favorites',
      //   element: <ProtectedRoute />,
      //   children: [
      //     {
      //       index: true,
      //       element: <Favorites />,
      //       loader: favoritesLoader,
      //     },
      //   ],
      // },
      // {
      //   path: 'flats',
      //   element: <ProtectedRoute />,
      //   children: [
      //     {
      //       path: 'new',
      //       element: <NewFlat />,
      //       action: newFlatAction,
      //     },
      //     // etc...
      //   ],
      // },
      // {
      //   path: 'users/:userID',
      //   element: <ProtectedRoute />,
      //   children: [
      //     {
      //       index: true,
      //       element: <MyProfile />,
      //       action: myProfileAction,
      //     },
      //   ],
      // },
      // {
      //   path: 'admin',
      //   element: <ProtectedRoute adminOnly={true} />,
      //   children: [
      //     {
      //       path: 'all-users',
      //       element: <AllUsers />,
      //       loader: allUsersLoader,
      //     },
      //   ],
      // },
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
]);

const App: React.FC = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

export default App;
