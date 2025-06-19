import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { Download } from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: 'accepted' | 'dismissed';
		platform: string;
	}>;
	prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showInstallPrompt, setShowInstallPrompt] = useState(false);

	useEffect(() => {
		const handleBeforeInstallPrompt = (e: Event) => {
			// Prevent the mini-infobar from appearing on mobile
			e.preventDefault();
			// Stash the event so it can be triggered later
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setShowInstallPrompt(true);
		};

		const handleAppInstalled = () => {
			// Hide the app-provided install promotion
			setShowInstallPrompt(false);
			setDeferredPrompt(null);
			console.log('PWA was installed');
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.addEventListener('appinstalled', handleAppInstalled);

		return () => {
			window.removeEventListener(
				'beforeinstallprompt',
				handleBeforeInstallPrompt
			);
			window.removeEventListener('appinstalled', handleAppInstalled);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		// Show the install prompt
		deferredPrompt.prompt();

		// Wait for the user to respond to the prompt
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			console.log('User accepted the install prompt');
		} else {
			console.log('User dismissed the install prompt');
		}

		// Clear the deferredPrompt
		setDeferredPrompt(null);
		setShowInstallPrompt(false);
	};

	const handleClose = () => {
		setShowInstallPrompt(false);
	};

	if (!showInstallPrompt) return null;

	return (
		<Snackbar
			open={showInstallPrompt}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			onClose={handleClose}
		>
			<Alert
				onClose={handleClose}
				severity="info"
				action={
					<Button
						color="inherit"
						size="small"
						startIcon={<Download />}
						onClick={handleInstallClick}
					>
						Install App
					</Button>
				}
			>
				Install WhereYouAt for a better experience!
			</Alert>
		</Snackbar>
	);
};

export default PWAInstallPrompt;
