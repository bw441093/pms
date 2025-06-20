import React from 'react';
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
	useNavigate,
} from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { Route } from './+types/root';
import './app.css';
import { SocketContext } from './contexts/SocketContext';

export const links: Route.LinksFunction = () => [
	{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
	{
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com',
		crossOrigin: 'anonymous',
	},
	{
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
	},
	// PWA manifest
	{ rel: 'manifest', href: '/manifest.json', crossOrigin: 'use-credentials' },
	// Apple touch icon
	{ rel: 'apple-touch-icon', href: '/icon-192x192.png' },
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#1976d2" />
				<meta
					name="description"
					content="Location and status tracking application"
				/>
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="WhereYouAt" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div>
			<main>{children}</main>
		</div>
	);
}

const queryClient = new QueryClient();

export default function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const [socket, setSocket] = React.useState<WebSocket | null>(null);

	React.useEffect(() => {
		const token = localStorage.getItem('login_token');
		if (!token && location.pathname !== '/login') {
			navigate('/login', { replace: true });
		}

		if ('Notification' in window && Notification.permission !== 'granted') {
			Notification.requestPermission();
		}
	}, [location, navigate]);

	React.useEffect(() => {
		const connectionString =
			window.location.hostname === 'localhost'
				? 'ws://localhost:3000'
				: `wss://${window.location.host}`;
		const ws = new WebSocket(connectionString);
		setSocket(ws);

		ws.onopen = () => {
			console.log('connected');
		};

		ws.onmessage = (event) => {
			console.log(JSON.stringify(event));
			const { event: eventName } = JSON.parse(event.data);
			if (eventName === 'alert') {
				new Notification('נכס״ל', {
					body: 'משאן הגדירו מצב נכס״ל, נא לעדכן סטטוס',
				});
			}
		};

		ws.onclose = () => {
			console.log('disconnected');
		};

		return () => {
			ws.close();
		};
	}, []);

	if (location.pathname === '/login') {
		return <Outlet />;
	}
	return (
		<QueryClientProvider client={queryClient}>
			<SocketContext.Provider value={{ socket }}>
				<AppLayout>
					<Outlet />
				</AppLayout>
			</SocketContext.Provider>
		</QueryClientProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!';
	let details = 'An unexpected error occurred.';
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error';
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
