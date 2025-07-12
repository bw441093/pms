import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
	Container,
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
					setError('.לא נמצא משתמש עם המייל הזה');
				} else if (err.response?.status === 400) {
					setError('.פורמט מייל אינו תקין');
				} else {
					setError('התרחשה שגיאה. נסה שוב');
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
