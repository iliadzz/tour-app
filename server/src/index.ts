import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws'; // Import WebSocket type
import fs from 'fs';
import { getCurrentLocation } from './gpsService';

// --- Type Definitions ---
interface Coordinates { lat: number; lon: number; }
interface Poi {
  id: string;
  name: string;
  coordinates: Coordinates;
  radius: number; // in meters
  audio: { [lang: string]: string };
}

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- Load POI Data ---
const pois: Poi[] = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pois.json'), 'utf-8'));
let lastTriggeredPoiId: string | null = null;
let lastLocation: Coordinates | null = null;
const playedPoiIds = new Set<string>(); // Keeps track of all POIs played in this session

wss.on('connection', (ws) => {
  console.log('✅ Client connected to WebSocket');
  ws.on('close', () => console.log('❌ Client disconnected'));
});

function broadcast(message: object) {
  const messageString = JSON.stringify(message);
  console.log(`Broadcasting message: ${messageString}`);
  wss.clients.forEach((client) => {
    // Check if the client is a valid WebSocket and is open
    if (client instanceof WebSocket && client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

// --- Geofence Logic ---
function checkGeofences() {
  const currentLocation = getCurrentLocation();
  console.log(`\nChecking location: Lat ${currentLocation.lat}, Lon ${currentLocation.lon}`);
  lastLocation = currentLocation;
  
  let triggeredPoi: Poi | null = null;

  for (const poi of pois) {
    const distance = calculateDistance(currentLocation, poi.coordinates);
    console.log(`- Distance to ${poi.name}: ${distance.toFixed(0)} meters`);

    if (distance <= poi.radius) {
      triggeredPoi = poi;
      break; 
    }
  }

// Modify the "if" statement to look like this
if (triggeredPoi.id !== lastTriggeredPoiId && !playedPoiIds.has(triggeredPoi.id)) {
  console.log(`>>> ENTERED GEOFENCE for ${triggeredPoi.name}`);
  lastTriggeredPoiId = triggeredPoi.id;
  playedPoiIds.add(triggeredPoi.id); // Add the ID to our "played" list
  broadcast({
    type: 'POI_TRIGGER',
    poi: {
      id: triggeredPoi.id,
      name: triggeredPoi.name,
      audioUrl: `http://localhost:${PORT}/audio/${triggeredPoi.audio['en']}`
    }
  });
}
  } else {
    if (lastTriggeredPoiId !== null) {
      console.log(`<<< EXITED GEOFENCE`);
      lastTriggeredPoiId = null; 
    }
  }
}

// Haversine formula
function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
    const R = 6371e3; // meters
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

// --- Start the GPS simulation loop ---
setInterval(checkGeofences, 5000);

// --- Express Setup ---
app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, '..', 'audio')));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', clients: wss.clients.size, lastLocation });
});

// --- Start the server ---
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});