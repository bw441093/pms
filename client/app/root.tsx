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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider } from '@mui/material/styles';
import { Provider as JotaiProvider } from 'jotai';
import { useAtom } from 'jotai';
import { userAtom } from './atoms/userAtom';
import { getPerson } from './clients/personsClient';
import theme from './theme';

import type { Route } from './+types/root';
import './app.css';
import { SocketContext } from './contexts/SocketContext';
import BottomNavBar from './components/BottomNavBar/BottomNavBar';
import TopBar from './components/TopBar/TopBar';
import AppDrawer from './components/Drawer/AppDrawer';

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
	const location = useLocation();
	const showBars = location.pathname !== '/login';
	const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

	const handleMenuClick = () => {
		setIsDrawerOpen(true);
	};

	const handleDrawerClose = () => {
		setIsDrawerOpen(false);
	};

	const handleNotificationClick = () => {
		// TODO: Implement notification handling
		console.log('Notification clicked');
	};

	return (
		<div style={{ 
			height: '100vh', 
			display: 'flex', 
			flexDirection: 'column' 
		}}>
			{showBars && (
				<>
					<TopBar 
						onMenuClick={handleMenuClick} 
						onNotificationClick={handleNotificationClick} 
					/>
					<AppDrawer 
						open={isDrawerOpen} 
						onClose={handleDrawerClose} 
					/>
				</>
			)}
			<main style={{ 
				flex: 1,
				marginTop: showBars ? '56px' : 0, // Height of TopBar
				marginBottom: showBars ? '56px' : 0, // Height of BottomNavBar
				overflow: 'auto'
			}}>
				{children}
			</main>
			{showBars && <BottomNavBar />}
		</div>
	);
}

const queryClient = new QueryClient();

function AppContent() {
	const location = useLocation();
	const navigate = useNavigate();
	const [socket, setSocket] = React.useState<WebSocket | null>(null);
	const [, setUser] = useAtom(userAtom);

	React.useEffect(() => {
		const token = localStorage.getItem('login_token');
		if (!token && location.pathname !== '/login') {
			navigate('/login', { replace: true });
			return;
		}

		// Fetch user data if logged in
		if (token) {
			getPerson(token).then(setUser);
		}

		if ('Notification' in window && Notification.permission !== 'granted') {
			Notification.requestPermission();
		}
	}, [location, navigate, setUser]);

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
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<ThemeProvider theme={theme}>
				<QueryClientProvider client={queryClient}>
					<SocketContext.Provider value={{ socket }}>
						<AppLayout>
							<Outlet />
						</AppLayout>
					</SocketContext.Provider>
				</QueryClientProvider>
			</ThemeProvider>
		</LocalizationProvider>
	);
}

export default function App() {
	return (
		<JotaiProvider>
			<AppContent />
		</JotaiProvider>
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
