// server/src/tourService.ts

interface TourState {
  isTourActive: boolean;
  currentTourId: string | null;
  playedPoiIds: Set<string>;
}

// This is the central state for our tour
let tourState: TourState = {
  isTourActive: false,
  currentTourId: null,
  playedPoiIds: new Set(),
};

export function startTour(tourId: string) {
  console.log(`Starting tour ${tourId}...`);
  tourState = {
    isTourActive: true,
    currentTourId: tourId,
    playedPoiIds: new Set(), // Reset the played list for the new tour
  };
  return tourState;
}

export function endTour() {
  console.log('Ending tour...');
  tourState.isTourActive = false;
  return tourState;
}

export function markPoiAsPlayed(poiId: string) {
  tourState.playedPoiIds.add(poiId);
}

export function isPoiPlayed(poiId: string): boolean {
  return tourState.playedPoiIds.has(poiId);
}

export function getTourState() {
  // Return a copy, converting Set to Array for JSON compatibility
  return { ...tourState, playedPoiIds: Array.from(tourState.playedPoiIds) };
}