import { Evaluacion } from '../types';

export const INITIAL_EVALUATIONS: Evaluacion[] = [
  {
    id: "eval-1",
    jugador_id: "1", // Iker Casillas
    rendimiento_tecnico: 9,
    tactica: 8,
    fisico: 9,
    actitud: 10,
    nota_media: 9.0,
    comentarios: "Excelente desempeño en situación de uno contra uno. Mostró un liderazgo fantástico y organizó la línea defensiva con autoridad.",
    fecha_evaluacion: "2026-05-15",
    created_at: "2026-05-15T10:00:00Z"
  },
  {
    id: "eval-2",
    jugador_id: "2", // Sergio Ramos
    rendimiento_tecnico: 8,
    tactica: 9,
    fisico: 10,
    actitud: 10,
    nota_media: 9.25,
    comentarios: "Impecable juego aéreo tanto en ataque como en defensa. Gran contundencia física y disciplina en los balones parados.",
    fecha_evaluacion: "2026-05-16",
    created_at: "2026-05-16T11:00:00Z"
  },
  {
    id: "eval-3",
    jugador_id: "3", // Gerard Piqué
    rendimiento_tecnico: 8,
    tactica: 8,
    fisico: 7,
    actitud: 8,
    nota_media: 7.75,
    comentarios: "Buena salida de balón en transición ofensiva. Falta de velocidad en coberturas largas que debe pulir.",
    fecha_evaluacion: "2026-05-17",
    created_at: "2026-05-17T12:00:00Z"
  }
];
