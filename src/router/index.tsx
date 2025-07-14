import { createHashRouter, RouterProvider } from 'react-router-dom';
import ControlPage from '../pages/control';
import DisplayPage from '../pages/display';

const router = createHashRouter([
  {
    path: '/',
    element: <ControlPage />,
  },
  {
    path: '/control',
    element: <ControlPage />,
  },
  {
    path: '/display',
    element: <DisplayPage />,
  },
]);

export const Router = () => <RouterProvider router={router} />;
