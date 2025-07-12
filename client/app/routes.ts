import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	  index('mobile/pages/whereYouAt/whereYouAt.tsx'),
  route('/dashboard', 'web/dashboard/dashboard.tsx'),
  route('/login', 'mobile/pages/login/login.tsx'),
  route('/archive', 'mobile/pages/archive/archive.tsx'),
  route('/calendar', 'mobile/pages/calendar/calendar.tsx'),
  route('/profile', 'mobile/pages/profile/profile.tsx'),
] satisfies RouteConfig;
