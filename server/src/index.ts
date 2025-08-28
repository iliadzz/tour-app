// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Allow requests from the client
app.use(express.json()); // Parse JSON bodies

// Serve static audio files
app.use('/audio', express.static(path.join(__dirname, '..', 'audio')));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});