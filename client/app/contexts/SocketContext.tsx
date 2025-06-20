import { createContext, useContext } from 'react';

export interface SocketContextProps {
	socket: WebSocket | null;
}

export const SocketContext = createContext<SocketContextProps | null>(null);

export const useSocket = () => {
	const context = useContext(SocketContext);
	if (!context) {
		throw new Error('useSocket must be used within a SocketProvider');
	}
	return context;
};
