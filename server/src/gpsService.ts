// server/src/gpsService.ts
import fs from 'fs';
import path from 'path';

interface Coordinates { lat: number; lon: number; }

// Load the POIs directly to use their coordinates as the route
const pois: { coordinates: Coordinates }[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'pois.json'), 'utf-8')
);

let currentPoiIndex = 0;

/**
 * This function now simply returns the coordinates of the current POI in our list.
 * The simulation of "movement" is handled by advancing the index at a set interval.
 */
export function getCurrentLocation(): Coordinates {
  // Make sure we have POIs to avoid errors
  if (pois.length === 0) {
    return { lat: 0, lon: 0 };
  }
  
  const currentLocation = pois[currentPoiIndex].coordinates;
  console.log(`📍 Currently at POI #${currentPoiIndex + 1}: ${JSON.stringify(currentLocation)}`);
  return currentLocation;
}

/**
 * Advances the simulation to the next Point of Interest in the list.
 * This function will be called by a setInterval in the main index.ts file.
 */
function advanceToNextPoi() {
  currentPoiIndex = (currentPoiIndex + 1) % pois.length; // Loop back to the start
  console.log(`\n⏭️  Advancing to next POI... (#${currentPoiIndex + 1})`);
}

// Set an interval to automatically advance to the next POI every 2 minutes.
// 2 * 60 * 1000 = 120000 milliseconds
setInterval(advanceToNextPoi, 120000);
