// client/src/types.ts

export type ConnectionStatus = 'Connecting' | 'Connected' | 'Disconnected';

export type Language = 'en' | 'es';

export interface Poi {
  id: string;
  name: string;
  description: { [key in Language]: string };
  image: string;
  audio: { [key in Language]: string };
}
