import fs from 'fs';
import path from 'path';

interface Coordinates { lat: number; lon: number; }

// Define a simple POI type for this service's needs
interface MinimalPoi {
  id: string;
  coordinates: Coordinates;
}

// Load the POIs directly to use their coordinates
const pois: MinimalPoi[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'pois.json'), 'utf-8')
);

let currentPoiIndex = 0;

/**
 * Gets the full data for the current POI in the simulation.
 * @returns The current POI object or null if none exist.
 */
export function getCurrentPoi(): MinimalPoi | null {
  if (pois.length === 0) {
    return null;
  }
  return pois[currentPoiIndex];
}

/**
 * Advances the simulation to the next Point of Interest in the list.
 */
export function advanceToNextPoi() {
  currentPoiIndex = (currentPoiIndex + 1) % pois.length; // Loop back to the start
  console.log(`\n⏭️  Advancing simulation to next POI... (#${currentPoiIndex + 1})`);
}

/**
 * Resets the simulation back to the first POI.
 */
export function resetSimulation() {
  console.log('🔄 Resetting GPS simulation to the start.');
  currentPoiIndex = 0;
}
