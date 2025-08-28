// server/src/gpsService.ts

interface GpsPoint {
  lat: number;
  lon: number;
}

// A simple, hardcoded route for our virtual bus
const route: GpsPoint[] = [
  { lat: 14.557, lon: -90.764 }, // Start Point
  { lat: 14.558, lon: -90.765 },
  { lat: 14.559, lon: -90.766 }, // Getting closer to the POI
  { lat: 14.560, lon: -90.767 }, // We are at the POI
  { lat: 14.561, lon: -90.768 }, // Moving away
  { lat: 14.562, lon: -90.769 },
];

let currentIndex = 0;

// This function simulates the bus moving to the next point on the route
export function getCurrentLocation(): GpsPoint {
  const location = route[currentIndex];

  // Move to the next point, or loop back to the start
  currentIndex = (currentIndex + 1) % route.length;

  return location;
}