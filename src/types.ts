export interface Jugador {
  id: string; // We can use string to support both Supabase UUIDs and local demo UUIDs
  nombre: string;
  apellidos: string;
  dorsal: number;
  fecha_nacimiento: string; // YYYY-MM-DD
  demarcacion: 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero';
  talla: number; // Height in cm, value between 160 and 190
  equipo: string;
  foto_jugador?: string;
  observaciones?: string;
  created_at?: string;
}

export type Demarcacion = 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero';

export interface Evaluacion {
  id: string;
  jugador_id: string;
  rendimiento_tecnico: number; // 1 to 10
  tactica: number; // 1 to 10
  fisico: number; // 1 to 10
  actitud: number; // 1 to 10
  nota_media: number; // calculated 1 to 10
  comentarios?: string;
  fecha_evaluacion: string; // YYYY-MM-DD
  created_at?: string;
}
