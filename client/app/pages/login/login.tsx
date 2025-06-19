import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
	Box,
	Button,
	TextField,
	Typography,
	Container,
	Paper,
	Alert,
	CircularProgress,
} from '@mui/material';
import axios from 'axios';

export default function Login() {
	const [error, setError] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		const identifyUser = async () => {
			setError('');

			try {
				const response = await axios.post('/api/auth/identify');

				const id = response.data;
				localStorage.setItem('login_token', id);
				navigate('/', { replace: true });
			} catch (err: any) {
				if (err.response?.status === 404) {
					setError('User not found with this email');
				} else if (err.response?.status === 400) {
					setError('Invalid email format');
				} else {
					setError('An error occurred. Please try again.');
				}
			}
		};

		identifyUser();
	}, [navigate]);

	return (
		<Container component="main" maxWidth="xs">
			{!error && <CircularProgress />}
			{error && <Alert severity="error">{error}</Alert>}
		</Container>
	);
}
