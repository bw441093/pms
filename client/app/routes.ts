import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('pages/whereYouAt/whereYouAt.tsx'),
	route('/login', 'pages/login/login.tsx'),
	route('/archive', 'pages/archive/archive.tsx'),
] satisfies RouteConfig;
