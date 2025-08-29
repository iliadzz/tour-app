import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import { getCurrentLocation } from './gpsService';
import { startTour, endTour, markPoiAsPlayed, isPoiPlayed, getTourState } from './tourService';

// --- Type Definitions ---
interface Coordinates { lat: number; lon: number; }
type Language = 'en' | 'es';

interface Poi {
  id: string;
  name: string;
  coordinates: Coordinates;
  radius: number; // in meters
  audio: { [key in Language]: string };
  description: { [key in Language]: string };
  image: string; // Now just the filename, e.g., "poi-1.jpg"
}

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- Load POI Data ---
const pois: Poi[] = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pois.json'), 'utf-8'));
let lastLocation: Coordinates | null = null;

wss.on('connection', (ws) => {
  console.log('✅ Client connected to WebSocket');
  ws.on('close', () => console.log('❌ Client disconnected'));
});

function broadcast(message: object) {
  const messageString = JSON.stringify(message);
  console.log(`Broadcasting message: ${messageString}`);
  wss.clients.forEach((client) => {
    if (client instanceof WebSocket && client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

// --- Geofence Logic (Simplified for Jump Simulation) ---
function checkGeofences() {
  const { isTourActive } = getTourState();
  if (!isTourActive) return;

  const currentLocation = getCurrentLocation();
  console.log(`\nChecking location: Lat ${currentLocation.lat}, Lon ${currentLocation.lon}`);
  lastLocation = currentLocation;
  
  for (const poi of pois) {
    const distance = calculateDistance(currentLocation, poi.coordinates);
    console.log(`- Distance to ${poi.name}: ${distance.toFixed(0)} meters`);

    // If we are inside a POI's radius AND it has not been played yet on this tour...
    if (distance <= poi.radius && !isPoiPlayed(poi.id)) {
      console.log(`>>> TRIGGERED GEOFENCE for ${poi.name}`);
      markPoiAsPlayed(poi.id); // Mark it as played for this tour session

      broadcast({
        type: 'POI_TRIGGER',
        poi: {
          id: poi.id,
          name: poi.name,
          description: poi.description,
          // Construct the full, absolute URLs for media files
          image: `http://localhost:${PORT}/images/${poi.image}`,
          audio: {
            en: `http://localhost:${PORT}/audio/${poi.audio['en']}`,
            es: `http://localhost:${PORT}/audio/${poi.audio['es']}`
          }
        }
      });
      
      // Since we found and triggered a POI, we can stop checking for this interval.
      return; 
    }
  }
}

// Haversine formula for distance calculation
function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coords1.lat * Math.PI/180;
    const φ2 = coords2.lat * Math.PI/180;
    const Δφ = (coords2.lat-coords1.lat) * Math.PI/180;
    const Δλ = (coords2.lon-coords1.lon) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// --- Start the GPS check loop ---
setInterval(checkGeofences, 5000); // Check every 5 seconds

// --- Express Setup ---
app.use(cors());
app.use(express.json());

// --- Static Asset Serving ---
// Serve audio files from the /audio directory
app.use('/audio', express.static(path.join(__dirname, '..', 'audio')));
// Serve image files from the /public/images directory
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', clients: wss.clients.size, lastLocation });
});

// --- API Endpoints for Tour Management ---
app.post('/api/tour/start', (req, res) => {
  startTour('tour1'); 
  // Immediately run a check after starting so the first POI triggers instantly
  checkGeofences(); 
  res.json(getTourState());
});

app.post('/api/tour/end', (req, res) => {
  endTour();
  res.json(getTourState());
});

app.get('/api/tour/state', (req, res) => {
  res.json(getTourState());
});

// --- Start the server ---
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
