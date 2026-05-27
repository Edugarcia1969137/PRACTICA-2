import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Trash2, 
  Plus, 
  Edit2, 
  Video, 
  Presentation, 
  FileText, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Compass, 
  Activity, 
  ThumbsUp, 
  AlertTriangle, 
  Check, 
  Save, 
  Cpu, 
  X,
  PlusCircle,
  VideoOff,
  Sparkles,
  Tv,
  Calendar,
  Users
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Jugador } from '../types';

// Interfaces for our Partido Module data
export interface RivalTeam {
  id: string;
  name: string;
  shieldUrl: string; // Placeholder or general sport icon
}

export interface RivalReport {
  faseOfensiva: string;
  faseDefensiva: string;
  transiciones: string;
  videoUrl: string;
}

export interface MatchPlan {
  googleSlidesUrl: string;
  videoUrl: string;
}

export interface LiveEvent {
  id: string;
  timestamp: string; // formatted "MM:SS"
  type: 'Gol Favor' | 'Ocasión Favor' | 'Gol Contra' | 'Ocasión Contra';
  createdAt: string; // timestamp for precise sorting
}

export interface PartidoAgenda {
  id: string;
  localId: string;
  visitanteId: string;
  fecha: string;
}

// Initial teams list data to avoid empty screens and make onboarding glorious
const INITIAL_RIVAL_TEAMS: RivalTeam[] = [
  { id: 'rival-1', name: 'Alianza FC (Defensa Fuerte)', shieldUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'rival-2', name: 'C.D. Titanes (Ofensiva Vertical)', shieldUrl: 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'rival-3', name: 'Real Monarca (Posesión / Centro)', shieldUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { id: 'rival-4', name: 'Atlético Deportivo (Presión Alta)', shieldUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' }
];

const INITIAL_SCHEDULED_MATCHES: PartidoAgenda[] = [
  { id: 'match-1', localId: 'rival-1', visitanteId: 'rival-2', fecha: '2026-05-30' },
  { id: 'match-2', localId: 'rival-3', visitanteId: 'rival-4', fecha: '2026-06-05' }
];

export interface TacticalPosition {
  role: string;
  name: string;
  x: number;
  y: number;
}

export const FORMATIONS_DEFINITIONS: { [systemName: string]: TacticalPosition[] } = {
  '1-4-3-3': [
    { role: 'POR', name: 'Portero', x: 50, y: 88 },
    { role: 'LI', name: 'Lateral Izq.', x: 15, y: 68 },
    { role: 'CAI', name: 'Def. Central Izq.', x: 35, y: 72 },
    { role: 'CAD', name: 'Def. Central Der.', x: 65, y: 72 },
    { role: 'LD', name: 'Lateral Der.', x: 85, y: 68 },
    { role: 'MCD', name: 'Pivote Defensivo', x: 50, y: 52 },
    { role: 'MCI', name: 'Interior Izq.', x: 28, y: 42 },
    { role: 'MCD', name: 'Interior Der.', x: 72, y: 42 },
    { role: 'EI', name: 'Extremo Izq.', x: 18, y: 20 },
    { role: 'DC', name: 'Delantero Centro', x: 50, y: 14 },
    { role: 'ED', name: 'Extremo Der.', x: 82, y: 20 }
  ],
  '1-4-4-2': [
    { role: 'POR', name: 'Portero', x: 50, y: 88 },
    { role: 'LI', name: 'Lateral Izq.', x: 15, y: 68 },
    { role: 'CAI', name: 'Def. Central Izq.', x: 35, y: 72 },
    { role: 'CAD', name: 'Def. Central Der.', x: 65, y: 72 },
    { role: 'LD', name: 'Lateral Der.', x: 85, y: 68 },
    { role: 'MI', name: 'Volante Izq.', x: 18, y: 45 },
    { role: 'MCI', name: 'Mediocentro Izq.', x: 38, y: 48 },
    { role: 'MCD', name: 'Mediocentro Der.', x: 62, y: 48 },
    { role: 'MD', name: 'Volante Der.', x: 82, y: 45 },
    { role: 'DCI', name: 'Delantero Izq.', x: 35, y: 15 },
    { role: 'DCD', name: 'Delantero Der.', x: 65, y: 15 }
  ],
  '1-3-5-2': [
    { role: 'POR', name: 'Portero', x: 50, y: 88 },
    { role: 'CDI', name: 'Def. Central Izq.', x: 28, y: 70 },
    { role: 'DFC', name: 'Líbero Central', x: 50, y: 74 },
    { role: 'CDD', name: 'Def. Central Der.', x: 72, y: 70 },
    { role: 'CRI', name: 'Carrilero Izq.', x: 12, y: 46 },
    { role: 'MCI', name: 'Interior Izq.', x: 35, y: 48 },
    { role: 'MC', name: 'Mediocentro', x: 50, y: 56 },
    { role: 'MCD', name: 'Interior Der.', x: 65, y: 48 },
    { role: 'CRD', name: 'Carrilero Der.', x: 88, y: 46 },
    { role: 'DCI', name: 'Delantero Izq.', x: 38, y: 18 },
    { role: 'DCD', name: 'Delantero Der.', x: 62, y: 18 }
  ],
  '1-4-2-3-1': [
    { role: 'POR', name: 'Portero', x: 50, y: 88 },
    { role: 'LI', name: 'Lateral Izq.', x: 15, y: 68 },
    { role: 'CAI', name: 'Def. Central Izq.', x: 35, y: 72 },
    { role: 'CAD', name: 'Def. Central Der.', x: 65, y: 72 },
    { role: 'LD', name: 'Lateral Der.', x: 85, y: 68 },
    { role: 'MCI', name: 'Pivote Izq.', x: 38, y: 56 },
    { role: 'MCD', name: 'Pivote Der.', x: 62, y: 56 },
    { role: 'EI', name: 'Extremo Izq.', x: 18, y: 28 },
    { role: 'MCO', name: 'Mediapunta', x: 50, y: 34 },
    { role: 'ED', name: 'Extremo Der.', x: 82, y: 28 },
    { role: 'DC', name: 'Delantero Centro', x: 50, y: 14 }
  ]
};

// Initial default links of youtube and slides for initial trial
const DEFAULT_SCOUT_VIDEO = 'https://www.youtube.com/watch?v=A88yv90Vclg'; // Football tactics
const DEFAULT_SLIDES_URL = 'https://docs.google.com/presentation/d/1t_7N5U45A5u3B6t1M1d_dE9H4k9WlJ3l0hJ_4tC_Q8k/embed'; // Google slides sample template

interface PartidosViewProps {
  players?: Jugador[];
}

export const PartidosView: React.FC<PartidosViewProps> = ({ players: propPlayers }) => {
  // Navigation active sub-tab inside PARTIDAS module
  const [subTab, setSubTab] = useState<'equipos' | 'alta-partido' | 'informe' | 'alineacion' | 'plan' | 'eventos'>('equipos');

  // Resolve players roster
  const [squadPlayers, setSquadPlayers] = useState<Jugador[]>([]);

  useEffect(() => {
    if (propPlayers && propPlayers.length > 0) {
      setSquadPlayers(propPlayers);
    } else {
      const localStr = localStorage.getItem('sandbox_jugadores');
      if (localStr) {
        setSquadPlayers(JSON.parse(localStr));
      } else {
        import('../data/initialPlayers').then((m) => {
          setSquadPlayers(m.INITIAL_PLAYERS.map(p => ({ ...p, created_at: new Date().toISOString() })) as Jugador[]);
        });
      }
    }
  }, [propPlayers]);

  // Tactical lineup states
  const [lineupSystem, setLineupSystem] = useState<string>('1-4-3-3');
  const [lineupSelections, setLineupSelections] = useState<{ [key: number]: string | null }>({});
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>('');

  // Supabase status flag
  const isSupabaseActive = isSupabaseConfigured();
  const [loading, setLoading] = useState(false);

  const isUUID = (id: string | null): boolean => {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  // Teams list state
  const [teams, setTeams] = useState<RivalTeam[]>(() => {
    const saved = localStorage.getItem('titan_rival_teams');
    return saved ? JSON.parse(saved) : INITIAL_RIVAL_TEAMS;
  });

  // Selected team ID state
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    return localStorage.getItem('titan_selected_rival_team_id') || null;
  });

  // Modals / Form inputs for Teams
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<RivalTeam | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShieldUrl, setNewTeamShieldUrl] = useState('');

  // Agenda de partidos states
  const [scheduledMatches, setScheduledMatches] = useState<PartidoAgenda[]>(() => {
    const saved = localStorage.getItem('titan_scheduled_matches');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULED_MATCHES;
  });

  // Alta partido fields
  const [selLocalId, setSelLocalId] = useState('');
  const [selVisitanteId, setSelVisitanteId] = useState('');
  const [matchDate, setMatchDate] = useState('');


  // -----------------------------------------------------
  // Per-team dynamic configurations
  // -----------------------------------------------------

  // Rival report states (Fase Ofensiva, Fase Defensiva, Transiciones, Video)
  const [rivalReport, setRivalReport] = useState<RivalReport>({
    faseOfensiva: '',
    faseDefensiva: '',
    transiciones: '',
    videoUrl: ''
  });

  // Match plan states (Google Slides Embed, Clip video)
  const [matchPlan, setMatchPlan] = useState<MatchPlan>({
    googleSlidesUrl: '',
    videoUrl: ''
  });

  // Live recording events list state
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  // Live streaming simulator video url for Tab 4
  const [eventsVideoUrl, setEventsVideoUrl] = useState('');

  // Save banner states
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Chronometer state for Live Events
  const [time, setTime] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------------------------------
  // Effects & Listeners
  // -----------------------------------------------------

  // Fetch teams from Supabase or Fallback
  const fetchTeams = async () => {
    if (isSupabaseActive && supabase) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('equipos_rivales')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          const loadedTeams: RivalTeam[] = data.map(item => ({
            id: item.id,
            name: item.nombre,
            shieldUrl: item.escudo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
          }));
          setTeams(loadedTeams);
          
          // Auto-select first or previously active team
          const activeId = localStorage.getItem('titan_selected_rival_team_id');
          if (activeId && loadedTeams.some(t => t.id === activeId)) {
            setSelectedTeamId(activeId);
          } else {
            setSelectedTeamId(loadedTeams[0].id);
          }
        } else {
          // If Supabase table is empty but has schema, initialize with demo teams
          setTeams(INITIAL_RIVAL_TEAMS);
          // Populating remotely with demo data automatically to save user manual input
          for (const demoTeam of INITIAL_RIVAL_TEAMS) {
            try {
              await supabase.from('equipos_rivales').insert({
                id: demoTeam.id.includes('rival-') ? undefined : demoTeam.id, // Let database generate UUID if it wants, or use custom or fallback
                nombre: demoTeam.name,
                escudo_url: demoTeam.shieldUrl
              });
            } catch (err) {
              console.error("Error populating demo data:", err);
            }
          }
          // Fetch again to get exact database IDs
          const { data: refreshed } = await supabase.from('equipos_rivales').select('*').order('nombre', { ascending: true });
          if (refreshed && refreshed.length > 0) {
            const loadedTeams = refreshed.map(t => ({ id: t.id, name: t.nombre, shieldUrl: t.escudo_url }));
            setTeams(loadedTeams);
            setSelectedTeamId(loadedTeams[0].id);
          }
        }
      } catch (err) {
        console.error("Error al revistar equipos de Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isSubTabActiveForSupa()) {
      fetchTeams();
      fetchScheduledMatches();
    }
  }, [isSupabaseActive]);

  // Small helper to prevent scoping issues
  function isSubTabActiveForSupa() {
    return isSupabaseActive;
  }

  const fetchScheduledMatches = async () => {
    if (isSupabaseActive && supabase) {
      try {
        const { data, error } = await supabase
          .from('partidos_agenda')
          .select('*')
          .order('fecha', { ascending: true });
        
        if (error) throw error;
        if (data) {
          const loadedMatches: PartidoAgenda[] = data.map(item => ({
            id: item.id,
            localId: item.local_id,
            visitanteId: item.visitante_id,
            fecha: item.fecha
          }));
          setScheduledMatches(loadedMatches);
          localStorage.setItem('titan_scheduled_matches', JSON.stringify(loadedMatches));
        }
      } catch (err) {
        console.error("Error al cargar agenda de partidos de Supabase:", err);
      }
    }
  };

  const handleSaveScheduledMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selLocalId || !selVisitanteId || !matchDate) {
      alert("Por favor, selecciona el equipo local, el visitante y una fecha válida.");
      return;
    }

    if (selLocalId === selVisitanteId) {
      alert("El equipo local y el visitante no pueden ser el mismo.");
      return;
    }

    const newMatchObj: PartidoAgenda = {
      id: 'match-' + Date.now().toString(),
      localId: selLocalId,
      visitanteId: selVisitanteId,
      fecha: matchDate
    };

    let updatedMatches = [...scheduledMatches];

    if (isSupabaseActive && supabase) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('partidos_agenda')
          .insert({
            local_id: selLocalId,
            visitante_id: selVisitanteId,
            fecha: matchDate
          })
          .select('*');

        if (error) throw error;
        if (data && data.length > 0) {
          const inserted: PartidoAgenda = {
            id: data[0].id,
            localId: data[0].local_id,
            visitanteId: data[0].visitante_id,
            fecha: data[0].fecha
          };
          updatedMatches = [inserted, ...scheduledMatches];
        } else {
          await fetchScheduledMatches();
          return;
        }
      } catch (err) {
        console.error("Error al registrar partido en Supabase:", err);
        alert("Error al registrar el partido en la base de datos.");
      } finally {
        setLoading(false);
      }
    } else {
      updatedMatches = [{ ...newMatchObj, id: 'match-' + Math.random().toString(36).substr(2, 9) }, ...scheduledMatches];
    }

    setScheduledMatches(updatedMatches);
    localStorage.setItem('titan_scheduled_matches', JSON.stringify(updatedMatches));
    
    // Clear form
    setSelLocalId('');
    setSelVisitanteId('');
    setMatchDate('');
    
    // Show success banner
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleDeleteScheduledMatch = async (id: string) => {
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar este partido de la agenda?");
    if (!confirmDelete) return;

    let updated = scheduledMatches.filter(m => m.id !== id);

    if (isSupabaseActive && supabase && isUUID(id)) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('partidos_agenda')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al eliminar partido de Supabase:", err);
        alert("Error al eliminar el partido de la base de datos.");
        return;
      } finally {
        setLoading(false);
      }
    }

    setScheduledMatches(updated);
    localStorage.setItem('titan_scheduled_matches', JSON.stringify(updated));
    
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // -----------------------------------------------------
  // Tactical Lineup (Alineación) Helpers and Effects
  // -----------------------------------------------------
  useEffect(() => {
    if (selectedTeamId) {
      const savedStr = localStorage.getItem('titan_rival_lineups');
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        const savedInstance = parsed[selectedTeamId];
        if (savedInstance) {
          setLineupSystem(savedInstance.system || '1-4-3-3');
          setLineupSelections(savedInstance.selections || {});
        } else {
          setLineupSystem('1-4-3-3');
          setLineupSelections({});
        }
      } else {
        setLineupSystem('1-4-3-3');
        setLineupSelections({});
      }
    }
  }, [selectedTeamId]);

  const handleSaveLineup = () => {
    if (!selectedTeamId) {
      alert("Por favor selecciona un rival en la pestaña principal primero.");
      return;
    }

    const savedStr = localStorage.getItem('titan_rival_lineups') || '{}';
    const parsed = JSON.parse(savedStr);

    parsed[selectedTeamId] = {
      system: lineupSystem,
      selections: lineupSelections
    };

    localStorage.setItem('titan_rival_lineups', JSON.stringify(parsed));
    
    // Toggle floating save indicator banner
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleAssignPlayer = (playerId: string, posIdx: number) => {
    const updated = { ...lineupSelections };

    // Evitar duplicados (quitar de posición anterior si existía)
    Object.keys(updated).forEach((key) => {
      const idx = Number(key);
      if (updated[idx] === playerId) {
        updated[idx] = null;
      }
    });

    updated[posIdx] = playerId;
    setLineupSelections(updated);
  };

  const handleUnassignPlayer = (posIdx: number) => {
    const updated = { ...lineupSelections };
    updated[posIdx] = null;
    setLineupSelections(updated);
  };

  const handleClearLineup = () => {
    setLineupSelections({});
  };

  const handleAutoFillLineup = () => {
    const occupied = new Set<string>();
    const updated: { [key: number]: string | null } = {};
    const systemPositions = FORMATIONS_DEFINITIONS[lineupSystem] || FORMATIONS_DEFINITIONS['1-4-3-3'];

    systemPositions.forEach((pos, idx) => {
      // Intentar buscar jugador ideal para la demarcación o puesto
      const eligible = squadPlayers.find((p) => {
        if (occupied.has(p.id)) return false;
        
        const isKeeperRole = pos.role === 'POR' || pos.role === 'GK';
        if (isKeeperRole && p.demarcacion === 'Portero') return true;
        
        const isDefRole = ['LD', 'LI', 'DFC', 'CAD', 'CAI', 'CDD', 'CDI', 'CRD', 'CRI'].includes(pos.role);
        if (isDefRole && p.demarcacion === 'Defensa') return true;
        
        const isMidRole = ['MC', 'MCD', 'MCO', 'MCI', 'MD', 'MI'].includes(pos.role);
        if (isMidRole && p.demarcacion === 'Centrocampista') return true;
        
        const isFwdRole = ['DC', 'ED', 'EI', 'DCD', 'DCI'].includes(pos.role);
        if (isFwdRole && p.demarcacion === 'Delantero') return true;
        
        return false;
      });

      if (eligible) {
        updated[idx] = eligible.id;
        occupied.add(eligible.id);
      } else {
        // Fallback: siguiente jugador libre
        const fallback = squadPlayers.find((p) => !occupied.has(p.id));
        if (fallback) {
          updated[idx] = fallback.id;
          occupied.add(fallback.id);
        }
      }
    });

    setLineupSelections(updated);
  };
   

  // Persist teams changes locally as standard cache fallback
  useEffect(() => {
    localStorage.setItem('titan_rival_teams', JSON.stringify(teams));
  }, [teams]);

  // Handle team selector switch: load specific team reports, plans and events
  useEffect(() => {
    if (!selectedTeamId) return;

    localStorage.setItem('titan_selected_rival_team_id', selectedTeamId);

    const loadTeamDetails = async () => {
      const isDemoTeam = selectedTeamId.startsWith('rival-');

      // 1. Initial local fallbacks to avoid blank look on select (Cache first approach)
      let reportToSet = {
        faseOfensiva: '',
        faseDefensiva: '',
        transiciones: '',
        videoUrl: ''
      };

      const savedReport = localStorage.getItem(`titan_rival_report_${selectedTeamId}`);
      if (savedReport) {
        reportToSet = JSON.parse(savedReport);
      } else if (isDemoTeam) {
        reportToSet = {
          faseOfensiva: 'Presión orientada a cerrar el carril interno. Buscan salir jugando con el pívot que se descuelga entre centrales.',
          faseDefensiva: 'Repliegue medio-bajo en estructura 1-4-4-2. Vulnerables por banda contraria cuando se realiza el basculamiento defensivo rápido.',
          transiciones: 'Transición ofensiva rápida buscando extremos pies cambiados. Transición defensiva con contrapresión agresiva los primeros 5 segundos de la pérdida.',
          videoUrl: DEFAULT_SCOUT_VIDEO
        };
      }
      setRivalReport(reportToSet);

      let planToSet = {
        googleSlidesUrl: '',
        videoUrl: ''
      };

      const savedPlan = localStorage.getItem(`titan_match_plan_${selectedTeamId}`);
      if (savedPlan) {
        planToSet = JSON.parse(savedPlan);
      } else if (isDemoTeam) {
        planToSet = {
          googleSlidesUrl: DEFAULT_SLIDES_URL,
          videoUrl: 'https://www.youtube.com/watch?v=BqK210Z06H4'
        };
      }
      setMatchPlan(planToSet);

      let eventsToSet: LiveEvent[] = [];

      const savedEvents = localStorage.getItem(`titan_live_events_${selectedTeamId}`);
      if (savedEvents) {
        eventsToSet = JSON.parse(savedEvents);
      } else if (isDemoTeam) {
        eventsToSet = [
          { id: 'ev-1', timestamp: '03:14', type: 'Ocasión Favor', createdAt: new Date(Date.now() - 300000).toISOString() },
          { id: 'ev-2', timestamp: '12:45', type: 'Gol Contra', createdAt: new Date(Date.now() - 200000).toISOString() }
        ];
      }
      setLiveEvents(eventsToSet);

      const savedEvVideo = localStorage.getItem(`titan_events_video_${selectedTeamId}`);
      setEventsVideoUrl(savedEvVideo || (isDemoTeam ? 'https://www.youtube.com/watch?v=vV_TzOfg11I' : ''));

      // 2. Fetch from Supabase if active
      if (isSupabaseActive && supabase && isUUID(selectedTeamId)) {
        try {
          // A. Load qualitative tactical report
          const { data: reportData, error: reportErr } = await supabase
            .from('informes_rivales')
            .select('*')
            .eq('equipo_rival_id', selectedTeamId)
            .maybeSingle();

          if (!reportErr && reportData) {
            setRivalReport({
              faseOfensiva: reportData.fase_ofensiva || '',
              faseDefensiva: reportData.fase_defensiva || '',
              transiciones: reportData.transiciones || '',
              videoUrl: reportData.video_url || ''
            });
          } else if (!reportErr) {
            // Clear or seed blank
            setRivalReport({
              faseOfensiva: '',
              faseDefensiva: '',
              transiciones: '',
              videoUrl: ''
            });
          }

          // B. Load match strategy plan
          const { data: planData, error: planErr } = await supabase
            .from('planes_partido')
            .select('*')
            .eq('equipo_rival_id', selectedTeamId)
            .maybeSingle();

          if (!planErr && planData) {
            setMatchPlan({
              googleSlidesUrl: planData.google_slides_url || '',
              videoUrl: planData.video_url || ''
            });
          } else if (!planErr) {
            setMatchPlan({
              googleSlidesUrl: '',
              videoUrl: ''
            });
          }

          // C. Load live recording events
          const { data: eventsData, error: eventsErr } = await supabase
            .from('eventos_directo')
            .select('*')
            .eq('equipo_rival_id', selectedTeamId)
            .order('created_at', { ascending: false });

          if (!eventsErr && eventsData) {
            setLiveEvents(eventsData.map(ev => ({
              id: ev.id,
              timestamp: ev.cronometro,
              type: ev.tipo_evento,
              createdAt: ev.created_at
            })));
          } else if (!eventsErr) {
            setLiveEvents([]);
          }
        } catch (err) {
          console.error("Error al cargar detalles de equipo de Supabase:", err);
        }
      }
    };

    loadTeamDetails();
  }, [selectedTeamId, isSupabaseActive]);

  // Chronometer tick effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  // -----------------------------------------------------
  // Handlers and helper functions
  // -----------------------------------------------------

  // Helper parser for embedding custom Youtube URL formats
  const parseYouTubeUrl = (url: string) => {
    if (!url) return '';
    try {
      let videoId = '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`;
      }
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
      return '';
    } catch {
      return '';
    }
  };

  // Helper parser for Google Slides embed source url format
  const parseSlidesUrl = (input: string) => {
    if (!input) return '';
    if (input.includes('<iframe')) {
      const match = input.match(/src="([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    }
    if (input.includes('docs.google.com/presentation')) {
      let url = input;
      if (url.includes('/edit')) {
        url = url.split('/edit')[0];
      }
      if (!url.endsWith('/embed')) {
        url = `${url}/embed`;
      }
      return url;
    }
    return input;
  };

  // Switch selected team cleanly
  const handleSelectTeam = (id: string) => {
    setSelectedTeamId(id);
    // Switch preview tab for faster actions
    setSubTab('informe');
  };

  // Add or edit team list entry
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const fallbackShield = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
    const finalShield = newTeamShieldUrl.trim() || fallbackShield;

    if (isSupabaseActive && supabase) {
      setLoading(true);
      try {
        if (editingTeam) {
          // Update Supabase
          const { error } = await supabase
            .from('equipos_rivales')
            .update({ nombre: newTeamName.trim(), escudo_url: finalShield })
            .eq('id', editingTeam.id);

          if (error) throw error;
          
          setTeams(prev => prev.map(t => t.id === editingTeam.id 
            ? { ...t, name: newTeamName.trim(), shieldUrl: finalShield } 
            : t
          ));
        } else {
          // Insert Supabase
          const { data, error } = await supabase
            .from('equipos_rivales')
            .insert({ nombre: newTeamName.trim(), escudo_url: finalShield })
            .select()
            .single();

          if (error) throw error;
          if (data) {
            const created: RivalTeam = {
              id: data.id,
              name: data.nombre,
              shieldUrl: data.escudo_url || fallbackShield
            };
            setTeams(prev => [...prev, created]);
            setSelectedTeamId(data.id);
          }
        }
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      } catch (err: any) {
        console.error("Error al guardar equipo en Supabase:", err);
        alert(`No se pudo persistir en Supabase: ${err.message || err}. Cambios guardados localmente.`);
        // Local Save Rollback
        updateTeamLocally(finalShield);
      } finally {
        setLoading(false);
      }
    } else {
      // Offline fallback
      updateTeamLocally(finalShield);
    }

    setIsTeamModalOpen(false);
    setEditingTeam(null);
    setNewTeamName('');
    setNewTeamShieldUrl('');
  };

  const updateTeamLocally = (finalShield: string) => {
    if (editingTeam) {
      setTeams(prev => prev.map(t => t.id === editingTeam.id 
        ? { ...t, name: newTeamName.trim(), shieldUrl: finalShield } 
        : t
      ));
    } else {
      const newId = `rival-team-${Date.now()}`;
      const created: RivalTeam = {
        id: newId,
        name: newTeamName.trim(),
        shieldUrl: finalShield
      };
      setTeams(prev => [...prev, created]);
      setSelectedTeamId(newId);
    }
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3500);
  };

  const handleEditTeamTrigger = (team: RivalTeam, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering highlight row select
    setEditingTeam(team);
    setNewTeamName(team.name);
    setNewTeamShieldUrl(team.shieldUrl);
    setIsTeamModalOpen(true);
  };

  const handleDeleteTeam = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este equipo rival del listado? Se borrarán sus informes asociados.')) {
      if (isSupabaseActive && supabase) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('equipos_rivales')
            .delete()
            .eq('id', id);

          if (error) throw error;
          
          setTeams(prev => prev.filter(t => t.id !== id));
          if (selectedTeamId === id) {
            setSelectedTeamId(null);
          }
          setShowSaveSuccess(true);
          setTimeout(() => setShowSaveSuccess(false), 3000);
        } catch (err: any) {
          console.error("Error al eliminar de Supabase:", err);
          alert(`No se pudo eliminar en base remota: ${err.message || err}`);
        } finally {
          setLoading(false);
        }
      } else {
        setTeams(prev => prev.filter(t => t.id !== id));
        if (selectedTeamId === id) {
          setSelectedTeamId(null);
        }
        // Cleanup local storage
        localStorage.removeItem(`titan_rival_report_${id}`);
        localStorage.removeItem(`titan_match_plan_${id}`);
        localStorage.removeItem(`titan_live_events_${id}`);
        localStorage.removeItem(`titan_events_video_${id}`);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      }
    }
  };

  // Save tactical qualitative reports
  const handleSaveRivalReport = async () => {
    if (!selectedTeamId) return;
    localStorage.setItem(`titan_rival_report_${selectedTeamId}`, JSON.stringify(rivalReport));
    
    if (isSupabaseActive && supabase && isUUID(selectedTeamId)) {
      setLoading(true);
      try {
        const { data: existing } = await supabase
          .from('informes_rivales')
          .select('id')
          .eq('equipo_rival_id', selectedTeamId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('informes_rivales')
            .update({
              fase_ofensiva: rReport().faseOfensiva,
              fase_defensiva: rReport().faseDefensiva,
              transiciones: rReport().transiciones,
              video_url: rReport().videoUrl,
              updated_at: new Date().toISOString()
            })
            .eq('equipo_rival_id', selectedTeamId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('informes_rivales')
            .insert({
              equipo_rival_id: selectedTeamId,
              fase_ofensiva: rReport().faseOfensiva,
              fase_defensiva: rReport().faseDefensiva,
              transiciones: rReport().transiciones,
              video_url: rReport().videoUrl
            });
          if (error) throw error;
        }
      } catch (err: any) {
        console.error("Error al guardar informe en Supabase:", err);
        alert(`Guardado localmente. Error en base remota: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Small helper to bypass TS scope limitations
  function rReport() {
    return rivalReport;
  }

  // Save strategy slides and matching video clip
  const handleSaveMatchPlan = async () => {
    if (!selectedTeamId) return;
    localStorage.setItem(`titan_match_plan_${selectedTeamId}`, JSON.stringify(matchPlan));
    
    if (isSupabaseActive && supabase && isUUID(selectedTeamId)) {
      setLoading(true);
      try {
        const { data: existing } = await supabase
          .from('planes_partido')
          .select('id')
          .eq('equipo_rival_id', selectedTeamId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('planes_partido')
            .update({
              google_slides_url: mPlan().googleSlidesUrl,
              video_url: mPlan().videoUrl,
              updated_at: new Date().toISOString()
            })
            .eq('equipo_rival_id', selectedTeamId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('planes_partido')
            .insert({
              equipo_rival_id: selectedTeamId,
              google_slides_url: mPlan().googleSlidesUrl,
              video_url: mPlan().videoUrl
            });
          if (error) throw error;
        }
      } catch (err: any) {
        console.error("Error al guardar plan de partido en Supabase:", err);
        alert(`Guardado localmente. Error en base remota: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  function mPlan() {
    return matchPlan;
  }

  // Live Timer utility conversion (seconds -> MM:SS)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clear live events history trace
  const handleClearEvents = async () => {
    if (window.confirm('¿Deseas vaciar la bitácora de eventos del directo de este partido?')) {
      setLiveEvents([]);
      localStorage.removeItem(`titan_live_events_${selectedTeamId}`);

      if (isSupabaseActive && supabase && isUUID(selectedTeamId)) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('eventos_directo')
            .delete()
            .eq('equipo_rival_id', selectedTeamId);
          if (error) throw error;
        } catch (err) {
          console.error("Error al vaciar eventos de Supabase:", err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Click live event buttons trigger logic
  const handleRecordEvent = async (type: 'Gol Favor' | 'Ocasión Favor' | 'Gol Contra' | 'Ocasión Contra') => {
    if (!selectedTeamId) return;

    const timestampStr = formatTime(time);
    const localId = `ev-${Date.now()}`;
    const newEvent: LiveEvent = {
      id: localId,
      timestamp: timestampStr,
      type,
      createdAt: new Date().toISOString()
    };

    const updatedEvents = [newEvent, ...liveEvents];
    setLiveEvents(updatedEvents);
    localSaveEvents(updatedEvents);

    if (isSupabaseActive && supabase && isUUID(selectedTeamId)) {
      try {
        const { data, error } = await supabase
          .from('eventos_directo')
          .insert({
            equipo_rival_id: selectedTeamId,
            cronometro: timestampStr,
            tipo_evento: type,
            created_at: newEvent.createdAt
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          // Reemplazar id local por el id real de base de datos
          setLiveEvents(prev => prev.map(ev => ev.id === localId ? {
            id: data.id,
            timestamp: data.cronometro,
            type: data.tipo_evento,
            createdAt: data.created_at
          } : ev));
        }
      } catch (err) {
        console.error("Error al registrar evento en Supabase:", err);
      }
    }
  };

  const localSaveEvents = (evs: LiveEvent[]) => {
    localStorage.setItem(`titan_live_events_${selectedTeamId}`, JSON.stringify(evs));
  };

  // Delete individual event
  const handleDeleteEvent = async (eventId: string) => {
    const updatedEvents = liveEvents.filter(ev => ev.id !== eventId);
    setLiveEvents(updatedEvents);
    localSaveEvents(updatedEvents);

    if (isSupabaseActive && supabase && isUUID(eventId)) {
      try {
        const { error } = await supabase
          .from('eventos_directo')
          .delete()
          .eq('id', eventId);
        if (error) throw error;
      } catch (err) {
        console.error("Error al eliminar evento de Supabase:", err);
      }
    }
  };

  const handleSaveEventsVideo = (url: string) => {
    setEventsVideoUrl(url);
    if (selectedTeamId) {
      localStorage.setItem(`titan_events_video_${selectedTeamId}`, url);
    }
  };

  // Quick fallback if user asks to automatically fill tactical report demo
  const handleLoadDemoContent = () => {
    if (!selectedTeamId) return;
    setRivalReport({
      faseOfensiva: 'Presión alta orientada a cerrar el carril interior. Juegan con un sistema 1-4-3-3 donde los extremos realizan diagonales de fuera hacia dentro. Los laterales dan profundidad y amplitud constante superando la línea de mediocampistas rivales.',
      faseDefensiva: 'Defienden en bloque bajo posicionando una línea fuerte de 4 mediocentros replegados y organizados. Sufren con balones cruzados a la espalda del lateral derecho que tiende a perder marcas cuando el balón viaja por el sector izquierdo.',
      transiciones: 'Ataque veloz tras recuperación encabezada por su dorsal 9 que destaca por sostener de espaldas. Cuando pierden balón presionan vorazmente al poseedor para retrasar el avance contrario, si fallan la presión arman repliegue retardado instantáneo.',
      videoUrl: DEFAULT_SCOUT_VIDEO
    });
  };

  // Selected team object
  const currentSelectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div className="space-y-6" id="partidos-module-root">
      
      {/* Module Title Banner */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center">
            <Cpu className="h-6 w-6 mr-2.5 text-emerald-400" />
            Módulo de Análisis de Partidos (Anàlisi de Rivals)
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Control de equipos rivales, bitácora de eventos tácticos en directo, y planes tácticos unificados.
          </p>
        </div>

        {/* Selected team status indicator */}
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Rival seleccionado:</span>
          {currentSelectedTeam ? (
            <div className="flex items-center space-x-2">
              <img 
                src={currentSelectedTeam.shieldUrl} 
                alt="Escudo" 
                className="w-5 h-5 rounded-full object-cover border border-slate-800" 
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-emerald-400 font-sans truncate max-w-[130px]" title={currentSelectedTeam.name}>
                {currentSelectedTeam.name}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-amber-400/90 italic font-sans flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              Sin seleccionar
            </span>
          )}
        </div>
      </div>

      {/* Segmented Subnavigation Control for Partidos */}
      <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-900 flex flex-wrap gap-1">
        <button
          onClick={() => setSubTab('equipos')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer ${
            subTab === 'equipos'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>1. Rivales & Equipos</span>
        </button>

        <button
          onClick={() => setSubTab('alta-partido')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer ${
            subTab === 'alta-partido'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
          }`}
          id="tab-alta-partido"
        >
          <Calendar className="h-4 w-4" />
          <span>2. Alta Partido</span>
        </button>

        <button
          onClick={() => setSubTab('informe')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer ${
            subTab === 'informe'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>3. Informe Rival</span>
        </button>

        <button
          onClick={() => setSubTab('alineacion')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer ${
            subTab === 'alineacion'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>4. Alineación</span>
        </button>

        <button
          onClick={() => setSubTab('plan')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer ${
            subTab === 'plan'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
          }`}
        >
          <Presentation className="h-4 w-4" />
          <span>5. Plan de Partido</span>
        </button>

        <button
          onClick={() => setSubTab('eventos')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer ${
            subTab === 'eventos'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-905/40 border border-transparent'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>6. Registro en Directo</span>
        </button>
      </div>

      {/* Floating Save Alerts Indicator */}
      {showSaveSuccess && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 z-50 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Cambios guardados con éxito en la base local</span>
        </div>
      )}

      {/* -----------------------------------------------------
          SUB-TAB 1: LISTADO DE EQUIPOS
          ----------------------------------------------------- */}
      {subTab === 'equipos' && (
        <div className="space-y-6">
          <div className="bg-slate-900/20 p-5 rounded-2xl border border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Listado de Equipos Rivales
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Selecciona de la cuadrícula el contrincante para preparar el planteamiento estratégico.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTeam(null);
                setNewTeamName('');
                setNewTeamShieldUrl('');
                setIsTeamModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition duration-150 shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Equipo Rival</span>
            </button>
          </div>

          {/* Teams Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {teams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              return (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(team.id)}
                  className={`group relative rounded-2xl border bg-slate-950 p-5 transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5 bg-gradient-to-b from-slate-950 to-emerald-950/10'
                      : 'border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/10'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider select-none">
                      ACTIVO
                    </div>
                  )}

                  {/* Team Content Card */}
                  <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    {/* Shield representation */}
                    <div className="relative">
                      <div className={`p-1.5 rounded-full border-2 ${isSelected ? 'border-emerald-400' : 'border-slate-800 group-hover:border-slate-700'} transition duration-150`}>
                        <img 
                          src={team.shieldUrl} 
                          alt={`${team.name} Escudo`}
                          className="w-16 h-16 rounded-full object-cover shadow-inner bg-slate-900"
                          onError={(e) => {
                            // Fallback if URL fails
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-slate-100 group-hover:text-white transition duration-150 tracking-tight leading-tight">
                        {team.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
                        Rojo Rival ID: {team.id.substring(0, 10)}
                      </p>
                    </div>

                    {/* Action buttons on card hover */}
                    <div className="flex items-center space-x-2 pt-2 select-none">
                      <button
                        onClick={(e) => handleEditTeamTrigger(team, e)}
                        className="p-2 bg-slate-900/80 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700/80 rounded-lg text-xs transition duration-150"
                        title="Editar nombre/escudo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteTeam(team.id, e)}
                        className="p-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 border border-red-900/20 hover:border-red-500/30 rounded-lg text-xs transition duration-150"
                        title="Eliminar rival"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-full pt-2">
                      <span className={`inline-flex items-center text-[10px] font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-350'} transition duration-150`}>
                        {isSelected ? 'Gestionando estrategia' : 'Hacer clic para seleccionar'} &rarr;
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}

            {teams.length === 0 && (
              <div className="col-span-full py-16 text-center space-y-4 bg-slate-900/20 border border-slate-900/60 rounded-2xl max-w-lg mx-auto w-full">
                <div className="w-12 h-12 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-500 mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">No hay rivales en tu listado</h4>
                  <p className="text-xs text-slate-500 mt-1">Anímate a dar de alta el primer club rival para cargarlo en el banquillo.</p>
                </div>
                <button
                  onClick={() => setIsTeamModalOpen(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition duration-150 shadow-sm cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Rival Ahora</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -----------------------------------------------------
          SUB-TAB: ALTA PARTIDO
          ----------------------------------------------------- */}
      {subTab === 'alta-partido' && (
        <div className="space-y-6" id="alta-partido-section">
          {/* Section banner */}
          <div className="bg-slate-900/20 p-5 rounded-2xl border border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Alta de Partidos (Agenda & Encuentros)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Registra un nuevo partido en la agenda seleccionando los clubes local y visitante con su fecha programada.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Column (4 cols) */}
            <div className="lg:col-span-4 bg-slate-950 p-6 rounded-2xl border border-slate-900 space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-900 pb-3">
                Registrar Nuevo Encuentro
              </h3>

              <form onSubmit={handleSaveScheduledMatch} className="space-y-4">
                {/* Local */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide font-mono block">
                    Equipo Local
                  </label>
                  <select
                    required
                    value={selLocalId}
                    onChange={(e) => setSelLocalId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-sans font-bold"
                  >
                    <option value="">-- Selecciona Local --</option>
                    {teams.map(team => (
                      <option key={`local-${team.id}`} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visitante */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide font-mono block">
                    Equipo Visitante
                  </label>
                  <select
                    required
                    value={selVisitanteId}
                    onChange={(e) => setSelVisitanteId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-sans font-bold"
                  >
                    <option value="">-- Selecciona Visitante --</option>
                    {teams.map(team => (
                      <option key={`visitante-${team.id}`} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide font-mono block">
                    Fecha del Partido
                  </label>
                  <input
                    type="date"
                    required
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono font-bold"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center space-x-2 px-4.5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition duration-150 shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Partido</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List Column (8 cols) */}
            <div className="lg:col-span-8 bg-slate-950 p-6 rounded-2xl border border-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Agenda de Encuentros Programados
                </h3>
                <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
                  {scheduledMatches.length} partidos
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {scheduledMatches.map((match) => {
                  const localTeam = teams.find(t => t.id === match.localId);
                  const visitanteTeam = teams.find(t => t.id === match.visitanteId);

                  return (
                    <div
                      key={match.id}
                      className="group flex flex-col md:flex-row items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-850 rounded-xl transition duration-150 gap-4"
                    >
                      {/* Match matchup */}
                      <div className="flex items-center space-x-8 flex-1 justify-center md:justify-start">
                        
                        {/* Local */}
                        <div className="flex items-center space-x-3 w-[220px] justify-end">
                          <span className="text-xs font-bold text-slate-200 text-right truncate">
                            {localTeam?.name || match.localId}
                          </span>
                          <img
                            src={localTeam?.shieldUrl || 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
                            alt="Escudo Local"
                            className="w-8 h-8 rounded-full object-cover border border-slate-800 shrink-0 shadow-inner"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
                            }}
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* VS Divider */}
                        <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-black text-emerald-400 tracking-wider">
                          VS
                        </div>

                        {/* Visitante */}
                        <div className="flex items-center space-x-3 w-[220px] justify-start">
                          <img
                            src={visitanteTeam?.shieldUrl || 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
                            alt="Escudo Visitante"
                            className="w-8 h-8 rounded-full object-cover border border-slate-800 shrink-0 shadow-inner"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-xs font-bold text-slate-200 text-left truncate">
                            {visitanteTeam?.name || match.visitanteId}
                          </span>
                        </div>

                      </div>

                      {/* Info & Actions */}
                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{match.fecha}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteScheduledMatch(match.id)}
                          className="p-2 bg-slate-950 hover:bg-red-950/35 border border-slate-900 hover:border-red-900/30 text-slate-500 hover:text-red-400 rounded-xl transition duration-150 cursor-pointer"
                          title="Eliminar este partido registrado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}

                {scheduledMatches.length === 0 && (
                  <div className="py-16 text-center space-y-4 bg-slate-900/10 border border-dashed border-slate-850/60 rounded-2xl max-w-md mx-auto w-full">
                    <div className="w-12 h-12 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-500 mx-auto animate-pulse">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-300 text-xs">No hay encuentros agendados</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Comienza rellenando el formulario de registro de la izquierda para dar de alta el primer encuentro del club.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -----------------------------------------------------
          SUB-TAB 3: INFORME RIVAL
          ----------------------------------------------------- */}
      {subTab === 'informe' && (
        <div className="space-y-6">
          {!selectedTeamId ? (
            <NoTeamSelectedPlaceholder onSelect={() => setSubTab('equipos')} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Qualitative Text Blocks Area (Takes 7 columns of grid) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Análisis Táctico Cualitativo</h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">EDITANDO REGISTRO: {currentSelectedTeam?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleLoadDemoContent}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-850 text-[10px] font-bold text-slate-350 border border-slate-700/60 rounded-lg transition duration-150 cursor-pointer"
                        title="Autorellenar estructura de plantilla técnica"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                        <span>Autocompletar Demo</span>
                      </button>

                      <button
                        onClick={handleSaveRivalReport}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition duration-150 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Informe</span>
                      </button>
                    </div>
                  </div>

                  {/* Textarea 1: Fase Ofensiva */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Fase Ofensiva (Ataque y Creación)
                    </label>
                    <textarea
                      value={rivalReport.faseOfensiva}
                      onChange={(e) => setRivalReport({ ...rivalReport, faseOfensiva: e.target.value })}
                      placeholder="Indique cómo inicia el rival, su estructura táctica en ataque (ej: 1-4-3-3), pasillos preferentes, altura de laterales, etc."
                      className="w-full h-32 p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans leading-relaxed"
                    />
                  </div>

                  {/* Textarea 2: Fase Defensiva */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      Fase Defensiva (Bloque y Estructura)
                    </label>
                    <textarea
                      value={rivalReport.faseDefensiva}
                      onChange={(e) => setRivalReport({ ...rivalReport, faseDefensiva: e.target.value })}
                      placeholder="Indique tipo de bloque (alto, medio, bajo), vulnerabilidades detectadas, debilidades defensivas en transición o juego aéreo."
                      className="w-full h-32 p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans leading-relaxed"
                    />
                  </div>

                  {/* Textarea 3: Transiciones */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Transiciones (Defensa-Ataque / Ataque-Defensa)
                    </label>
                    <textarea
                      value={rivalReport.transiciones}
                      onChange={(e) => setRivalReport({ ...rivalReport, transiciones: e.target.value })}
                      placeholder="Transición ofensiva (velocistas por fuera, pívot de apoyo) y transición defensiva (presión tras pérdida agresiva, repliegues acelerados)."
                      className="w-full h-32 p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Embedded Video Scouting Player (Takes 5 columns) */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-5">
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Video className="w-5 h-5 text-sky-400" />
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Vídeo de Análisis Táctico</h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">MATERIAL AUDIOVISUAL ASOCIADO</p>
                      </div>
                    </div>
                  </div>

                  {/* Inputs field for Youtube Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 font-mono block">Enlace Youtube a Analizar</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={rivalReport.videoUrl}
                        onChange={(e) => setRivalReport({ ...rivalReport, videoUrl: e.target.value })}
                        placeholder="Ej: https://www.youtube.com/watch?v=A88yv90Vclg"
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 transition font-mono"
                      />
                      <button
                        onClick={handleSaveRivalReport}
                        className="px-3.5 py-2 bg-sky-950 border border-sky-800/60 hover:bg-sky-900 text-sky-400 rounded-xl text-xs font-bold transition duration-150 cursor-pointer shrink-0"
                        title="Guardar vídeo"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Embedded Iframe Player Box */}
                  <div className="space-y-2 pt-2">
                    {parseYouTubeUrl(rivalReport.videoUrl) ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-900 shadow-inner bg-slate-950 aspect-video">
                        <iframe
                          src={parseYouTubeUrl(rivalReport.videoUrl)}
                          title="Reproductor de Scouting Táctico"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-850 bg-slate-950/40 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                        <VideoOff className="w-8 h-8 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">Sin vídeo cargado o formato incompatible</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">Pega un enlace limpio de Youtube en el campo superior para reproducir de forma embebida.</p>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-900/60 flex items-start gap-2.5 text-[10.5px] text-slate-400 leading-relaxed font-sans">
                      <span className="text-amber-400">💡</span>
                      <p>
                        Puedes editar el informe directamente en los bloques laterales mientras visualizas el material, optimizando la fatiga cognitiva del análisis deportivo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------
          SUB-TAB 3.5: ALINEACIÓN (TACTICAL LINEUP BOARD)
          ----------------------------------------------------- */}
      {subTab === 'alineacion' && (
        <div className="space-y-6">
          {!selectedTeamId ? (
            <NoTeamSelectedPlaceholder onSelect={() => setSubTab('equipos')} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column: Player Pool (Plantilla) - Takes 4 cols of grid */}
              <div className="xl:col-span-4 bg-slate-900/30 p-5 rounded-2xl border border-slate-900 shadow-sm flex flex-col h-[750px]">
                <div className="border-b border-slate-800 pb-3 mb-4 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-sm font-bold text-slate-100">Plantilla FC Titanes</h2>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Arrastra jugadores al campo de fútbol</p>
                </div>

                {/* Search Bar inside Squad list */}
                <div className="mb-4 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar jugador..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs placeholder-slate-500 text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                  />
                </div>

                {/* Scrollable list of players */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {['Portero', 'Defensa', 'Centrocampista', 'Delantero'].map((demarc) => {
                    const groupPlayers = squadPlayers.filter(
                      p => p.demarcacion === demarc && 
                      (p.nombre.toLowerCase().includes(rosterSearch.toLowerCase()) || 
                       p.apellidos.toLowerCase().includes(rosterSearch.toLowerCase()))
                    );

                    if (groupPlayers.length === 0) return null;

                    return (
                      <div key={demarc} className="space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-500 block px-1">
                          {demarc}s
                        </span>
                        <div className="space-y-1.5">
                          {groupPlayers.map((player) => {
                            const isAssigned = Object.values(lineupSelections).includes(player.id);
                            
                            return (
                              <div
                                key={player.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", player.id);
                                }}
                                className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing ${
                                  isAssigned
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300 animate-fade-in'
                                    : 'bg-slate-950/40 hover:bg-slate-950 border-slate-900/60 hover:border-slate-800 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  {player.foto_jugador ? (
                                    <img
                                      src={player.foto_jugador}
                                      alt=""
                                      className="w-8 h-8 rounded-full object-cover border border-slate-800 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-850 flex items-center justify-center text-slate-500 uppercase shrink-0 text-xs font-bold">
                                      {player.nombre[0]}
                                    </div>
                                  )}
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-semibold truncate leading-tight">
                                      {player.nombre} {player.apellidos}
                                    </p>
                                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                      Dorsal #{player.dorsal} • {player.talla}cm
                                    </p>
                                  </div>
                                </div>

                                {isAssigned ? (
                                  <span className="text-[9px] uppercase font-bold font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full shrink-0">
                                    11 inicial
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      // Buscar primera ranura libre
                                      const systemPositions = FORMATIONS_DEFINITIONS[lineupSystem] || FORMATIONS_DEFINITIONS['1-4-3-3'];
                                      const freeSlotIdx = systemPositions.findIndex((_, sIdx) => !lineupSelections[sIdx]);
                                      if (freeSlotIdx !== -1) {
                                        handleAssignPlayer(player.id, freeSlotIdx);
                                      } else {
                                        alert("El 11 inicial está completo. Quita algún jugador para añadir más.");
                                      }
                                    }}
                                    className="p-1 hover:bg-slate-900 text-slate-500 hover:text-slate-200 rounded-lg transition shrink-0"
                                    title="Añadir a alineación"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right/Middle Column: Tactical Pitch Field and Configuration - Takes 8 cols of grid */}
              <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Football Pitch Stage - Takes 7 cols on md+ */}
                <div className="md:col-span-12 lg:col-span-7 bg-slate-900/20 p-4 rounded-2xl border border-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="w-full flex items-center justify-between mb-4 px-2">
                    <span className="text-xs font-black text-slate-400 font-mono tracking-wide uppercase">PIZARRA TÁCTICA FÚTBOL 11</span>
                    <button
                      onClick={handleClearLineup}
                      className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 font-mono font-bold px-2.5 py-1 rounded-lg transition"
                    >
                      Limpiar Campo
                    </button>
                  </div>

                  {/* Soccer Field View Container */}
                  <div className="relative w-full aspect-[3/4] max-w-[460px] bg-[#123c24] rounded-2xl border-4 border-slate-950 overflow-hidden shadow-2xl shrink-0 select-none">
                    
                    {/* Pitch green stripe styles overlay */}
                    <div className="absolute inset-0 flex flex-col pointer-events-none opacity-10">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={`stripe-${i}`} className={`flex-1 w-full ${i % 2 === 0 ? 'bg-black/25' : 'bg-transparent'}`} />
                      ))}
                    </div>

                    {/* Field Markings */}
                    <div className="absolute inset-3 border border-white/20 pointer-events-none rounded-lg" />
                    <div className="absolute top-1/2 left-3 right-3 h-0 border-t border-white/20 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 w-28 h-28 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    {/* Top Penalty Box */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-48 h-18 border-b border-x border-white/20 pointer-events-none" />
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 border-b border-x border-white/10 pointer-events-none" />
                    <div className="absolute top-21 left-1/2 -translate-x-1/2 w-20 h-10 border-b border-x border-white/20 rounded-b-full pointer-events-none" style={{ clipPath: 'inset(40% 0 0 0)' }} />

                    {/* Bottom Penalty Box */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-48 h-18 border-t border-x border-white/20 pointer-events-none" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-20 h-6 border-t border-x border-white/10 pointer-events-none" />
                    <div className="absolute bottom-21 left-1/2 -translate-x-1/2 w-20 h-10 border-t border-x border-white/20 rounded-t-full pointer-events-none" style={{ clipPath: 'inset(0 0 40% 0)' }} />

                    {/* Player Positions Render */}
                    {(FORMATIONS_DEFINITIONS[lineupSystem] || FORMATIONS_DEFINITIONS['1-4-3-3']).map((pos, idx) => {
                      const assignedPlayerId = lineupSelections[idx];
                      const valPlayer = assignedPlayerId ? squadPlayers.find(p => p.id === assignedPlayerId) : null;
                      const isOver = dragOverSlotIndex === idx;

                      return (
                        <div
                          key={`pos-${idx}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverSlotIndex(idx);
                          }}
                          onDragLeave={() => {
                            setDragOverSlotIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const playerId = e.dataTransfer.getData("text/plain");
                            if (playerId) {
                              handleAssignPlayer(playerId, idx);
                            }
                            setDragOverSlotIndex(null);
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-150"
                          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        >
                          {/* Player Avatar Circle Slot */}
                          <div
                            className={`w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all relative ${
                              valPlayer
                                ? 'bg-slate-900 border-2 border-emerald-400 shadow-xl cursor-pointer hover:scale-110'
                                : isOver
                                ? 'bg-emerald-950 border-2 border-dashed border-emerald-400 scale-110 shadow-lg animate-pulse'
                                : 'bg-slate-950/80 border border-dashed border-slate-700 hover:border-slate-500 cursor-pointer'
                            }`}
                            onClick={() => {
                              if (valPlayer) {
                                handleUnassignPlayer(idx);
                              } else {
                                const inputNode = document.getElementById(`inline-picker-${idx}`);
                                if (inputNode) {
                                  inputNode.classList.toggle('hidden');
                                }
                              }
                            }}
                          >
                            {valPlayer ? (
                              <>
                                {valPlayer.foto_jugador ? (
                                  <img
                                    src={valPlayer.foto_jugador}
                                    alt=""
                                    className="w-full h-full rounded-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="text-xs font-black text-slate-350 uppercase">{valPlayer.nombre[0]}</span>
                                )}
                                <span className="absolute -top-1.5 -right-1.5 bg-red-650 bg-red-600 text-white font-mono text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-950 shadow">
                                  {valPlayer.dorsal}
                                </span>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-500">
                                <Plus className="w-3 h-3 opacity-40" />
                                <span className="text-[7.5px] font-mono font-bold uppercase">{pos.role}</span>
                              </div>
                            )}

                            {/* Direct selector Popover window */}
                            <div
                              id={`inline-picker-${idx}`}
                              className="absolute z-20 top-12 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-slate-250 text-xs rounded-xl shadow-2xl p-2 hidden w-44 max-h-48 overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1.5">
                                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Elegir {pos.role}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const node = document.getElementById(`inline-picker-${idx}`);
                                    if (node) node.classList.add('hidden');
                                  }}
                                  className="text-[9px] text-slate-500 hover:text-slate-300 font-bold font-mono"
                                >
                                  [X]
                                </button>
                              </div>
                              <div className="space-y-1">
                                {squadPlayers.map((sqPlayer) => {
                                  const isUsed = Object.values(lineupSelections).includes(sqPlayer.id);
                                  return (
                                    <button
                                      type="button"
                                      key={sqPlayer.id}
                                      onClick={() => {
                                        handleAssignPlayer(sqPlayer.id, idx);
                                        const node = document.getElementById(`inline-picker-${idx}`);
                                        if (node) node.classList.add('hidden');
                                      }}
                                      className={`w-full text-left p-1 rounded hover:bg-slate-900 font-mono text-[9px] truncate flex items-center justify-between ${
                                        isUsed ? 'text-slate-500 italic' : 'text-slate-300'
                                      }`}
                                    >
                                      <span>#{sqPlayer.dorsal} {sqPlayer.nombre}</span>
                                      {isUsed && <span className="text-[7px] bg-slate-900 text-slate-500 px-1 rounded">ON</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Tag name label */}
                          {valPlayer && (
                            <div className="text-[9px] mt-1 font-bold font-sans text-white text-center tracking-tight truncate max-w-[65px] drop-shadow-md bg-slate-950/85 px-1 py-0.5 rounded border border-slate-800">
                              {valPlayer.nombre}
                            </div>
                          )}
                          {!valPlayer && (
                            <div className="text-[8px] mt-0.5 text-emerald-400/70 font-mono text-center tracking-tight uppercase">
                              {pos.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Parameters configuration column - Takes 5 cols on md+ */}
                <div className="md:col-span-12 lg:col-span-5 bg-slate-900/30 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between space-y-4 h-full">
                  
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-2.5">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">PANEL DE ESPECIFICACIONES</h3>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 font-mono block">Esquema Táctico Seleccionado</label>
                      <select
                        value={lineupSystem}
                        onChange={(e) => {
                          setLineupSystem(e.target.value);
                          // Clear or auto readjust positions appropriately
                        }}
                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-sans"
                      >
                        <option value="1-4-3-3">Fútbol 11 — 1-4-3-3 (Clásico)</option>
                        <option value="1-4-4-2">Fútbol 11 — 1-4-4-2 (Tradicional)</option>
                        <option value="1-3-5-2">Fútbol 11 — 1-3-5-2 (Dominio Total)</option>
                        <option value="1-4-2-3-1">Fútbol 11 — 1-4-2-3-1 (Equilibrado)</option>
                      </select>
                    </div>

                    {/* Suggestions Box */}
                    <div className="p-3.5 bg-slate-955 bg-slate-950/50 rounded-xl border border-slate-900 flex flex-col gap-2">
                      <span className="text-[10px] font-black text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Alineación Automática
                      </span>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        Genera un once titular equilibrado automáticamente cruzando las demarcaciones idóneas con los futbolistas disponibles en plantilla.
                      </p>
                      <button
                        type="button"
                        onClick={handleAutoFillLineup}
                        className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-350 border border-emerald-500/20 rounded-lg text-[10px] font-black tracking-wide uppercase transition duration-150 cursor-pointer shadow-sm"
                      >
                        <span>Completar 11 Titular</span>
                      </button>
                    </div>

                    <div className="p-3.5 bg-slate-950/20 rounded-xl border border-slate-900/45 text-[10px] text-slate-400 space-y-2">
                      <span className="font-bold text-slate-300 uppercase font-mono text-[9px] block">Guía de Atajos UI</span>
                      <ul className="list-disc pl-4 space-y-1 font-mono text-[9.5px] leading-relaxed">
                        <li>Arrastra tarjetas del panel izquierdo al campo.</li>
                        <li>Haz clic en un puesto vacío para elegir de la lista.</li>
                        <li>Pulsa sobre un jugador alineado para devolverlo a banquillo.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Save tactical configuration action button */}
                  <div className="pt-4 border-t border-slate-800 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleSaveLineup}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs tracking-wider uppercase shadow-xl transition duration-150 cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-slate-950" />
                      <span>Guardar Alineación Oficial</span>
                    </button>
                    <p className="text-[8.5px] text-slate-500 text-center font-mono uppercase">
                      PERSISTENCIA VINCULADA A: {currentSelectedTeam?.name || 'RIVAL ACTIVO'}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------
          SUB-TAB 3: PLAN DE PARTIDO
          ----------------------------------------------------- */}
      {subTab === 'plan' && (
        <div className="space-y-6">
          {!selectedTeamId ? (
            <NoTeamSelectedPlaceholder onSelect={() => setSubTab('equipos')} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Google Slides Tactics Container (Takes 7 columns of grid) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Presentation className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Diapositivas de Estrategia Táctica</h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">GOOGLE SLIDES EMBED INTEGRATION</p>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveMatchPlan}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition duration-150 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Diapositivas</span>
                    </button>
                  </div>

                  {/* Slides URL/Embed Input field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 font-mono block">Instrucciones / Presentación URL o iframe código de Google Slides</label>
                    <input
                      type="text"
                      value={matchPlan.googleSlidesUrl}
                      onChange={(e) => setMatchPlan({ ...matchPlan, googleSlidesUrl: e.target.value })}
                      placeholder="Pega la URL para compartir, editar, o el iframe completo"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-mono"
                    />
                    <p className="text-[9.5px] text-slate-500 leading-tight">
                      * Ejemplo: Archivo &rarr; Compartir &rarr; Publicar en la Web &rarr; Insertar embed URL.
                    </p>
                  </div>

                  {/* Beautiful Iframe Container for slides presentation */}
                  <div className="pt-2">
                    {parseSlidesUrl(matchPlan.googleSlidesUrl) ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-900 shadow-inner bg-slate-950 aspect-video">
                        <iframe
                          src={parseSlidesUrl(matchPlan.googleSlidesUrl)}
                          title="Presentación de Diapositivas Tácticas"
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-850 bg-slate-950/40 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                        <Presentation className="w-8 h-8 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">No hay pase de diapositivas enlazadas</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[340px] mx-auto leading-relaxed">Ingresa una presentación válida para exhibir pautas colectivas, marcas asignadas o balones parados.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Sub video / Motivation Clip Player (Takes 5 columns) */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-5">
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Video className="w-5 h-5 text-amber-400" />
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Clip Motivacional / Táctico</h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">ÚLTIMO DETALLE PREVIO AL ENTRAR</p>
                      </div>
                    </div>
                  </div>

                  {/* Inputs field for Motivation clip */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 font-mono block">Enlace Vídeo Auxiliar</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={matchPlan.videoUrl}
                        onChange={(e) => setMatchPlan({ ...matchPlan, videoUrl: e.target.value })}
                        placeholder="Ej: https://www.youtube.com/watch?v=BqK210Z06H4"
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition font-mono"
                      />
                      <button
                        onClick={handleSaveMatchPlan}
                        className="px-3.5 py-2 bg-amber-950 border border-amber-900/45 hover:bg-amber-900 text-amber-400 rounded-xl text-xs font-bold transition duration-150 cursor-pointer shrink-0"
                        title="Guardar vídeo"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Embedded Iframe Player Box */}
                  <div className="space-y-2 pt-2">
                    {parseYouTubeUrl(matchPlan.videoUrl) ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-900 shadow-inner bg-slate-950 aspect-video">
                        <iframe
                          src={parseYouTubeUrl(matchPlan.videoUrl)}
                          title="Reproductor Motivacional"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-850 bg-slate-950/40 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                        <VideoOff className="w-8 h-8 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">Sin clip cargado</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">Carga un clip estratégico o motivacional para proyectar en pantallas durante la charla teórica.</p>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-900/60 flex items-start gap-2.5 text-[10.5px] text-slate-400 leading-relaxed font-sans">
                      <span className="text-emerald-400">💡</span>
                      <p>
                        Este set-up unifica en una sola pestaña el informe técnico y el clip inspiracional, ideal para exponer en tablets durante el calentamiento previos al partido.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------
          SUB-TAB 4: EVENTOS (REGISTRO EN DIRECTO)
          ----------------------------------------------------- */}
      {subTab === 'eventos' && (
        <div className="space-y-6">
          {!selectedTeamId ? (
            <NoTeamSelectedPlaceholder onSelect={() => setSubTab('equipos')} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Recording controls buttoner & Timer (Takes 7 columns of grid) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 shadow-sm space-y-6">
                  
                  {/* Digital Cronometer Box Section */}
                  <div className="border-b border-slate-800 pb-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2.5 self-center sm:self-start">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Scouting y Registro en Directo</h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Controlador de Eventos del Minuto a Minuto</p>
                      </div>
                    </div>

                    {/* Timer digital interface readout */}
                    <div className="flex items-center space-x-4 bg-slate-950 p-2.5 px-4 rounded-xl border border-slate-850">
                      <span className="text-2xl font-black font-mono text-emerald-400 select-all tracking-wider">
                        {formatTime(time)}
                      </span>
                      
                      {/* Control buttons inside crono unit */}
                      <div className="flex items-center space-x-1.5 select-none text-[10px]">
                        <button
                          onClick={() => setIsRunning(!isRunning)}
                          className={`p-1.5 px-2.5 rounded-lg font-bold flex items-center space-x-1 transition duration-150 cursor-pointer ${
                            isRunning 
                              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25' 
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          }`}
                        >
                          {isRunning ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Pausar</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Iniciar</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setIsRunning(false);
                            setTime(0);
                          }}
                          className="p-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                          title="Reiniciar cronómetro"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bouttoniere Event triggers */}
                  <div className="space-y-3.5">
                    <span className="text-xs font-bold text-slate-400 font-mono block uppercase tracking-wider">Botonera de Registro de Incidencias en Vivo</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Favor section (Green/Emerald colors) */}
                      <div className="space-y-3 border border-emerald-500/10 p-4 bg-emerald-500/5 rounded-2xl">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block text-center border-b border-emerald-500/15 pb-1.5">A Favor (+)</span>
                        
                        <div className="flex flex-col gap-2.5">
                          <button
                            onClick={() => handleRecordEvent('Gol Favor')}
                            className="h-14 flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition duration-150 cursor-pointer active:scale-95 shadow-md hover:shadow-emerald-500/10"
                          >
                            <span className="text-lg">⚽</span>
                            <span>GOL FAVOR</span>
                          </button>

                          <button
                            onClick={() => handleRecordEvent('Ocasión Favor')}
                            className="h-12 flex items-center justify-center space-x-2 bg-slate-900 border border-emerald-500/25 hover:bg-emerald-500/10 text-emerald-400 font-bold rounded-xl text-xs transition duration-150 cursor-pointer active:scale-95"
                          >
                            <ThumbsUp className="w-4 h-4 text-emerald-400" />
                            <span>OCASIÓN FAVOR</span>
                          </button>
                        </div>
                      </div>

                      {/* Against section (Red/Rose colors) */}
                      <div className="space-y-3 border border-red-500/10 p-4 bg-red-500/5 rounded-2xl">
                        <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest block text-center border-b border-red-500/15 pb-1.5">En Contra (-)</span>
                        
                        <div className="flex flex-col gap-2.5">
                          <button
                            onClick={() => handleRecordEvent('Gol Contra')}
                            className="h-14 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs transition duration-150 cursor-pointer active:scale-95 shadow-md hover:shadow-red-500/10"
                          >
                            <span className="text-lg">⚽</span>
                            <span>GOL CONTRA</span>
                          </button>

                          <button
                            onClick={() => handleRecordEvent('Ocasión Contra')}
                            className="h-12 flex items-center justify-center space-x-2 bg-slate-900 border border-red-500/25 hover:bg-red-500/10 text-red-400 font-bold rounded-xl text-xs transition duration-150 cursor-pointer active:scale-95"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span>OCASIÓN CONTRA</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Lower Registry list of Live Events */}
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Bitácora de Eventos Registrados ({liveEvents.length})</span>
                      {liveEvents.length > 0 && (
                        <button
                          onClick={handleClearEvents}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Borrar Todo</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {liveEvents.map((ev) => {
                        const isFavor = ev.type === 'Gol Favor' || ev.type === 'Ocasión Favor';
                        const isGol = ev.type === 'Gol Favor' || ev.type === 'Gol Contra';
                        
                        return (
                          <div
                            key={ev.id}
                            className={`flex items-center justify-between p-3.5 rounded-xl border bg-slate-950 font-mono text-xs transition-colors duration-150 group ${
                              isFavor 
                                ? 'border-emerald-500/20 hover:bg-emerald-500/1' 
                                : 'border-red-500/20 hover:bg-red-505/1'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              {/* Digital stamp */}
                              <span className="font-black text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 tracking-wider">
                                {ev.timestamp}
                              </span>

                              {/* Badge label */}
                              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md border font-extrabold text-[10.5px] uppercase ${
                                isFavor
                                  ? isGol 
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                                    : 'bg-emerald-505/10 border-emerald-500/15 text-emerald-400/80'
                                  : isGol 
                                    ? 'bg-red-500/20 border-red-500/40 text-red-500' 
                                    : 'bg-red-505/10 border-red-500/15 text-red-400/80'
                              }`}>
                                {isGol && <span>⚽</span>}
                                <span>{ev.type}</span>
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-90w transition duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Eliminar este evento"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}

                      {liveEvents.length === 0 && (
                        <div className="py-10 text-center text-slate-600 text-xs italic">
                          No se han registrado incidencias en la bitácora aún. Pulsa los botones superiores para registrar los momentos clave del choque.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Embedded YouTube Video for simulation (Takes 5 columns) */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-5">
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Tv className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">Live Stream / Simulador</h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">ANÁLISIS DE PARTIDO EN REPRODUCCIÓN</p>
                      </div>
                    </div>
                  </div>

                  {/* Embed Link Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 font-mono block">Enlace de Vídeo del Partido</label>
                    <input
                      type="text"
                      value={eventsVideoUrl}
                      onChange={(e) => handleSaveEventsVideo(e.target.value)}
                      placeholder="Ej: https://www.youtube.com/watch?v=vV_TzOfg11I"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-505 transition font-mono"
                    />
                    <p className="text-[9.5px] text-slate-500">
                      * Ideal para registrar eventos en diferido revisando la transmisión completa grabada.
                    </p>
                  </div>

                  {/* Simulated screen box */}
                  <div className="pt-2">
                    {parseYouTubeUrl(eventsVideoUrl) ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-900 shadow-inner bg-slate-950 aspect-video">
                        <iframe
                          src={parseYouTubeUrl(eventsVideoUrl)}
                          title="Stream simulador de partido"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-850 bg-slate-950/40 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                        <VideoOff className="w-8 h-8 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">Sin transmisión enlazada</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed font-sans">Introduce el vídeo completo del encuentro para realizar análisis táctico post-partido.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-900/60 flex items-start gap-2.5 text-[10.5px] text-slate-400 leading-relaxed font-sans mt-3">
                    <span className="text-emerald-400">💡</span>
                    <p>
                      <strong>Sugerencia de Flujo:</strong> Pon a reproducir el vídeo del partido en el simulador, presiona "Iniciar" en el cronómetro a la par del silbatazo inicial, y pulsa los botones de registro según ocurran las jugadas.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TEAM CREATION / EDIT MODAL FRAME */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in select-none">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-slide-up">
            
            {/* Modal header */}
            <div className="p-4.5 border-b border-slate-800/85 bg-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Shield className="w-4.5 h-4.5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  {editingTeam ? 'Editar Ficha Rival' : 'Añadir Nuevo Rival'}
                </h3>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-850 transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSaveTeam} className="p-5 space-y-4">
              {/* Field 1: Name */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide font-mono">Nombre del Equipo Colectivo</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ej: Juventus F.C., Chelsea, o Madrid Cadete"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-sans font-bold"
                />
              </div>

              {/* Field 2: Shield Image URL */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide font-mono">Foto de Escudo (URL de imagen)</label>
                <input
                  type="url"
                  value={newTeamShieldUrl}
                  onChange={(e) => setNewTeamShieldUrl(e.target.value)}
                  placeholder="Ej: https://... o dejar en blanco"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-350 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                />
                <p className="text-[10px] text-slate-550 leading-normal">
                  * Deja el campo vacío para asignar una imagen deportiva genérica autogenerada de forma automática.
                </p>
              </div>

              {/* Modal controls actions footer */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-semibold font-sans transition duration-150 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs font-sans transition duration-150 shadow-md cursor-pointer"
                >
                  {editingTeam ? 'Actualizar Ficha' : 'Guardar Rival'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

// Sub-component: Placeholder when no team selected to prevent raw states
interface PlaceholderProps {
  onSelect: () => void;
}

const NoTeamSelectedPlaceholder: React.FC<PlaceholderProps> = ({ onSelect }) => {
  return (
    <div className="py-16 bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center text-center p-8 space-y-4 max-w-xl mx-auto">
      <div className="w-14 h-14 bg-slate-950 rounded-full border border-slate-900 flex items-center justify-center text-amber-500 animate-bounce" style={{ animationDuration: '4s' }}>
        <Shield className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-extrabold text-slate-200 text-sm">Ningún Equipo Rival Seleccionado</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Para acceder a los análisis tácticos cualitativos, planes de partido unificados y bitácora de eventos del banquillo, debes seleccionar un rival de tu listado deportivo primero.
        </p>
      </div>

      <button
        onClick={onSelect}
        className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 font-bold rounded-xl text-xs transition duration-150 cursor-pointer shadow-sm flex items-center space-x-1.5"
      >
        <Compass className="w-4 h-4 text-emerald-400" />
        <span>Ir a Listado de Rivales</span>
      </button>
    </div>
  );
};
