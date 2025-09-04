import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import { getCurrentPoi, advanceToNextPoi, resetSimulation } from './gpsService';
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

interface Ad {
  id: string;
  name: string;
  description: { [key in Language]: string };
  image: string;
  audio: { [key in Language]: string };
}

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- Load POI and Ad Data ---
const pois: Poi[] = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pois.json'), 'utf-8'));
const ads: Ad[] = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'ads.json'), 'utf-8'));
let tourTimer: NodeJS.Timeout | null = null;
let adTimer: NodeJS.Timeout | null = null;

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

/**
 * Finds a POI by its ID and sends the trigger message to the client.
 * @param poiId The ID of the POI to trigger.
 */
function triggerPoiById(poiId: string) {
    const poi = pois.find(p => p.id === poiId);
    
    // Do nothing if the POI doesn't exist or has already been played in this session
    if (!poi || isPoiPlayed(poi.id)) return;

    console.log(`>>> TRIGGERING POI for ${poi.name}`);
    markPoiAsPlayed(poi.id);

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
}

/**
 * Selects a random ad and sends it to the client.
 */
function triggerRandomAd() {
  if (ads.length === 0) return;
  const ad = ads[Math.floor(Math.random() * ads.length)];
  console.log(`>>> TRIGGERING AD for ${ad.name}`);
  
  // We re-use the 'POI_TRIGGER' message type on the client for simplicity.
  // A more robust app might have a dedicated 'AD_TRIGGER' type.
  broadcast({
    type: 'POI_TRIGGER',
    poi: {
      id: ad.id,
      name: ad.name,
      description: ad.description,
      image: `http://localhost:${PORT}/images/${ad.image}`,
      audio: {
        en: `http://localhost:${PORT}/audio/${ad.audio['en']}`,
        es: `http://localhost:${PORT}/audio/${ad.audio['es']}`
      }
    }
  });
}


// --- Express Setup ---
app.use(cors());
app.use(express.json());

// --- Static Asset Serving ---
app.use('/audio', express.static(path.join(__dirname, '..', 'audio')));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', clients: wss.clients.size });
});

// --- API Endpoints for Tour Management ---
app.post('/api/tour/start', (req, res) => {
  console.log('--- Tour Start Request Received ---');
  startTour('tour1');
  resetSimulation();

  // Clear any old timers to prevent duplicates
  if (tourTimer) clearInterval(tourTimer);
  if (adTimer) clearTimeout(adTimer);

  // Trigger the first POI immediately
  const firstPoi = getCurrentPoi();
  if (firstPoi) {
    triggerPoiById(firstPoi.id);
  }

  // Set a new timer to advance and trigger subsequent POIs every 2 minutes
  tourTimer = setInterval(() => {
    advanceToNextPoi();
    const nextPoi = getCurrentPoi();
    if (nextPoi) {
      triggerPoiById(nextPoi.id);
    }
    
    // Schedule an ad to play 1 minute from now (halfway through the pause)
    adTimer = setTimeout(triggerRandomAd, 60000); // 60000ms = 1 minute
  }, 120000); // 120000ms = 2 minutes

  // Schedule the very first ad to play after 1 minute
  adTimer = setTimeout(triggerRandomAd, 60000);

  res.json(getTourState());
});

app.post('/api/tour/end', (req, res) => {
  console.log('--- Tour End Request Received ---');
  endTour();
  // Stop and clear all timers when the tour ends
  if (tourTimer) {
    clearInterval(tourTimer);
    tourTimer = null;
  }
  if (adTimer) {
    clearTimeout(adTimer);
    adTimer = null;
  }
  res.json(getTourState());
});

app.get('/api/tour/state', (req, res) => {
  res.json(getTourState());
});

// --- Start the server ---
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
