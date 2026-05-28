import { io } from 'socket.io-client';

// In production the client is served from the same Express server,
// so we connect to the same origin. In dev, proxy to localhost:3001.
const URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001';

const socket = io(URL, { autoConnect: true });
export default socket;
