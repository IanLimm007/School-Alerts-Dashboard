import { createBrowserRouter } from 'react-router';
import { Root } from './components/Root';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { SubmitAlert } from './components/SubmitAlert';
import { IncidentLog } from './components/IncidentLog';
import { IncidentDetail } from './components/IncidentDetail';
import { Analytics } from './components/Analytics';
import { Notifications } from './components/Notifications';
import { UserManagement } from './components/UserManagement';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: 'submit', Component: SubmitAlert },
      { path: 'incidents', Component: IncidentLog },
      { path: 'incidents/:id', Component: IncidentDetail },
      { path: 'analytics', Component: Analytics },
      { path: 'notifications', Component: Notifications },
      { path: 'users', Component: UserManagement },
    ],
  },
]);
