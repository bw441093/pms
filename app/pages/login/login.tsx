import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ADMINS, PEOPLE, MANAGERS } from '../../consts';

export default function Login() {
	const [userId, setUserId] = useState('');
	const [error, setError] = useState('');
	const navigate = useNavigate();

	function isValidUser(id: string) {
		return (
			ADMINS.includes(id) ||
			PEOPLE.includes(id) ||
			MANAGERS.some((m) => m.id === id)
		);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!userId.trim()) return;
		if (!isValidUser(userId.trim())) {
			setError('Invalid user ID');
			return;
		}
		localStorage.setItem('login_token', userId.trim());
		navigate('/', { replace: true });
	}

	return (
		<main className="flex flex-col items-center justify-center min-h-screen">
			<h1 className="text-2xl mb-4">Login</h1>
			<form onSubmit={handleSubmit} className="flex flex-col gap-2 w-64">
				<input
					type="text"
					placeholder="Enter your ID"
					value={userId}
					onChange={(e) => {
						setUserId(e.target.value);
						setError('');
					}}
					className="border p-2 rounded"
				/>
				<button type="submit" className="bg-blue-500 text-white p-2 rounded">
					Login
				</button>
				{error && <div className="text-red-500 text-sm mt-2">{error}</div>}
			</form>
		</main>
	);
}
