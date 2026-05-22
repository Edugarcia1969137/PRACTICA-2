import { useState, useEffect } from 'react';
import { Jugador, Demarcacion, Evaluacion } from './types';
import { INITIAL_PLAYERS } from './data/initialPlayers';
import { INITIAL_EVALUATIONS } from './data/initialEvaluations';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { PlayerCard } from './components/PlayerCard';
import { PlayerTableView } from './components/PlayerTableView';
import { TeamStats } from './components/TeamStats';
import { EvaluacionesView } from './components/EvaluacionesView';
import { SupabaseInstructions } from './components/SupabaseInstructions';
import { PlayerFormModal } from './components/PlayerFormModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Filter, 
  UserPlus, 
  Database, 
  Sparkles, 
  RefreshCw,
  Award,
  AlertCircle,
  LayoutGrid,
  Table,
  ClipboardCheck
} from 'lucide-react';

export default function App() {
  // Auth state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Config check
  const isSupabaseActive = isSupabaseConfigured();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'plantilla' | 'evaluaciones' | 'estadisticas' | 'configuracion'>('plantilla');

  // View mode switcher: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    return (localStorage.getItem('scout_view_mode') as 'grid' | 'table') || 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('scout_view_mode', mode);
  };

  // Players state
  const [players, setPlayers] = useState<Jugador[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Evaluations state
  const [evaluations, setEvaluations] = useState<Evaluacion[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('Todos');
  const [tallaFilter, setTallaFilter] = useState<string>('Todos');

  // Modal edit state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Jugador | null>(null);

  // Modal detail state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailedPlayer, setDetailedPlayer] = useState<Jugador | null>(null);

  // Synchronize Auth Session on Mount
  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseActive && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            setUserEmail(session.user.email);
          }
        } catch (err) {
          console.error("Error al revistar sesión activa:", err);
        }
      } else {
        // Sandbox local storage session fallback
        const savedEmail = localStorage.getItem('sandbox_user_email');
        if (savedEmail) {
          setUserEmail(savedEmail);
        }
      }
      setAuthChecking(false);
    };

    initAuth();

    if (isSupabaseActive && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        } else {
          setUserEmail(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [isSupabaseActive]);

  // Load Players and Evaluations from Database or Sandbox Local Storage
  useEffect(() => {
    if (!userEmail) return;

    const loadData = async () => {
      setLoadingPlayers(true);
      setLoadingEvaluations(true);
      setSyncError(null);

      if (isSupabaseActive && supabase) {
        try {
          const { data, error } = await supabase
            .from('jugadores')
            .select('*')
            .order('dorsal', { ascending: true });

          if (error) throw error;

          if (data && data.length > 0) {
            setPlayers(data);
          } else {
            // Database is empty. Give the option or load 20 initial players automatically to satisfy "20 jugadores"
            setPlayers([]);
          }
        } catch (err: any) {
          setSyncError(`No se pudieron cargar los jugadores de Supabase: ${err?.message || 'Revisa el SQL de estructura.'}`);
        }

        // Load evaluations with error-proofing in case SQL hasn't been run yet
        try {
          const { data: evData, error: evError } = await supabase
            .from('evaluaciones')
            .select('*')
            .order('fecha_evaluacion', { ascending: false });

          if (evError) {
            console.warn("Tabla 'evaluaciones' no detectada aún en Supabase.", evError.message);
          } else if (evData) {
            setEvaluations(evData);
          }
        } catch (err) {
          console.error("No se pudo conectar a la tabla de evaluaciones:", err);
        } finally {
          setLoadingPlayers(false);
          setLoadingEvaluations(false);
        }
      } else {
        // Sandbox Mode Local Storage fetch
        try {
          const localDataStr = localStorage.getItem('sandbox_jugadores');
          if (localDataStr) {
            setPlayers(JSON.parse(localDataStr));
          } else {
            // Seed with 20 players initially
            const seedPlayersWithDate = INITIAL_PLAYERS.map(p => ({
              ...p,
              created_at: new Date().toISOString()
            }));
            localStorage.setItem('sandbox_jugadores', JSON.stringify(seedPlayersWithDate));
            setPlayers(seedPlayersWithDate);
          }

          // Fetch local evaluations
          const localEvStr = localStorage.getItem('sandbox_evaluaciones');
          if (localEvStr) {
            setEvaluations(JSON.parse(localEvStr));
          } else {
            localStorage.setItem('sandbox_evaluaciones', JSON.stringify(INITIAL_EVALUATIONS));
            setEvaluations(INITIAL_EVALUATIONS);
          }
        } catch (err) {
          console.error("Error al cargar sandbox local storage:", err);
        } finally {
          setLoadingPlayers(false);
          setLoadingEvaluations(false);
        }
      }
    };

    loadData();
  }, [userEmail, isSupabaseActive]);

  // Seed Supabase database helper
  const handleSeedDatabaseInSupabase = async () => {
    if (!isSupabaseActive || !supabase) return;
    
    setLoadingPlayers(true);
    setSyncError(null);
    try {
      // Map initial players to omit their ID so Supabase generates proper UUIDs
      const seedData = INITIAL_PLAYERS.map(({ id, ...rest }) => rest);
      
      const { data, error } = await supabase
        .from('jugadores')
        .insert(seedData)
        .select();

      if (error) throw error;

      if (data) {
        setPlayers(data);
      }
    } catch (err: any) {
      setSyncError(`Error al sembrar base de datos: ${err?.message || '¿Has ejecutado el SQL de creación?'}`);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Logout routine
  const handleLogout = async () => {
    if (isSupabaseActive && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('sandbox_user_email');
    }
    setUserEmail(null);
  };

  // Local sandbox auth success trigger
  const handleSandboxLoginSuccess = (email: string) => {
    localStorage.setItem('sandbox_user_email', email);
    setUserEmail(email);
  };

  // Add or edit save routine
  const handleSavePlayer = async (playerData: Omit<Jugador, 'id' | 'created_at'> & { id?: string }) => {
    setSyncError(null);

    if (isSupabaseActive && supabase) {
      try {
        if (playerData.id) {
          // Editing existing row
          const { error } = await supabase
            .from('jugadores')
            .update({
              nombre: playerData.nombre,
              apellidos: playerData.apellidos,
              dorsal: playerData.dorsal,
              fecha_nacimiento: playerData.fecha_nacimiento,
              demarcacion: playerData.demarcacion,
              talla: playerData.talla,
              equipo: playerData.equipo,
              foto_jugador: playerData.foto_jugador,
              observaciones: playerData.observaciones
            })
            .eq('id', playerData.id);

          if (error) throw error;

          // Update local state directly to be lightning fast
          setPlayers(prev => prev.map(p => p.id === playerData.id ? { ...p, ...playerData } : p));
        } else {
          // Adding new row (let Supabase set the UUID and created_at)
          const { data, error } = await supabase
            .from('jugadores')
            .insert([{
              nombre: playerData.nombre,
              apellidos: playerData.apellidos,
              dorsal: playerData.dorsal,
              fecha_nacimiento: playerData.fecha_nacimiento,
              demarcacion: playerData.demarcacion,
              talla: playerData.talla,
              equipo: playerData.equipo,
              foto_jugador: playerData.foto_jugador,
              observaciones: playerData.observaciones
            }])
            .select();

          if (error) throw error;

          if (data && data[0]) {
            setPlayers(prev => [data[0], ...prev]);
          }
        }
      } catch (err: any) {
        setSyncError(`Error al guardar jugador: ${err?.message || 'Fallo de sincronización'}`);
      }
    } else {
      // Sandbox Mode logic
      let updatedList: Jugador[] = [];
      if (playerData.id) {
        // Edit Row
        updatedList = players.map(p => p.id === playerData.id ? { ...p, ...playerData } : p);
      } else {
        // Add Row
        const newPlayer: Jugador = {
          ...playerData,
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString()
        };
        updatedList = [newPlayer, ...players];
      }
      localStorage.setItem('sandbox_jugadores', JSON.stringify(updatedList));
      setPlayers(updatedList);
    }
  };

  // Delete player routine
  const handleDeletePlayer = async (id: string) => {
    setSyncError(null);

    if (isSupabaseActive && supabase) {
      try {
        const { error } = await supabase
          .from('jugadores')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setPlayers(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        setSyncError(`Error al eliminar jugador: ${err?.message || 'Error del servidor'}`);
      }
    } else {
      // Sandbox local storage deletion
      const updatedList = players.filter(p => p.id !== id);
      localStorage.setItem('sandbox_jugadores', JSON.stringify(updatedList));
      setPlayers(updatedList);
    }
  };

  // Save or update evaluation routine
  const handleSaveEvaluation = async (evalData: Omit<Evaluacion, 'id' | 'created_at'> & { id?: string }) => {
    setSyncError(null);

    if (isSupabaseActive && supabase) {
      try {
        if (evalData.id) {
          // Update evaluation row
          const { error } = await supabase
            .from('evaluaciones')
            .update({
              jugador_id: evalData.jugador_id,
              rendimiento_tecnico: evalData.rendimiento_tecnico,
              tactica: evalData.tactica,
              fisico: evalData.fisico,
              actitud: evalData.actitud,
              nota_media: evalData.nota_media,
              comentarios: evalData.comentarios,
              fecha_evaluacion: evalData.fecha_evaluacion
            })
            .eq('id', evalData.id);

          if (error) throw error;

          setEvaluations(prev => prev.map(ev => ev.id === evalData.id ? { ...ev, ...evalData as Evaluacion } : ev));
        } else {
          // Insert evaluation row
          const { data, error } = await supabase
            .from('evaluaciones')
            .insert([{
              jugador_id: evalData.jugador_id,
              rendimiento_tecnico: evalData.rendimiento_tecnico,
              tactica: evalData.tactica,
              fisico: evalData.fisico,
              actitud: evalData.actitud,
              nota_media: evalData.nota_media,
              comentarios: evalData.comentarios,
              fecha_evaluacion: evalData.fecha_evaluacion
            }])
            .select();

          if (error) throw error;

          if (data && data[0]) {
            setEvaluations(prev => [data[0], ...prev]);
          }
        }
      } catch (err: any) {
        setSyncError(`Error al guardar la evaluación en Supabase: ${err?.message || 'Fallo de sincronización'}`);
        throw err;
      }
    } else {
      // Sandbox Mode local persistence
      let updatedList: Evaluacion[] = [];
      if (evalData.id) {
        // Edit
        updatedList = evaluations.map(ev => ev.id === evalData.id ? { ...ev, ...evalData as Evaluacion } : ev);
      } else {
        // Create
        const newEv: Evaluacion = {
          ...evalData,
          id: `eval-${Math.random().toString(36).substring(2, 11)}`,
          created_at: new Date().toISOString()
        };
        updatedList = [newEv, ...evaluations];
      }
      localStorage.setItem('sandbox_evaluaciones', JSON.stringify(updatedList));
      setEvaluations(updatedList);
    }
  };

  // Delete evaluation routine
  const handleDeleteEvaluation = async (id: string) => {
    setSyncError(null);

    if (isSupabaseActive && supabase) {
      try {
        const { error } = await supabase
          .from('evaluaciones')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setEvaluations(prev => prev.filter(ev => ev.id !== id));
      } catch (err: any) {
        setSyncError(`Error al eliminar evaluación de Supabase: ${err?.message || 'Error del servidor'}`);
        throw err;
      }
    } else {
      // Delete in local sandbox mode
      const updatedList = evaluations.filter(ev => ev.id !== id);
      localStorage.setItem('sandbox_evaluaciones', JSON.stringify(updatedList));
      setEvaluations(updatedList);
    }
  };

  // List filtering logic
  const filteredPlayers = players.filter(player => {
    const fullName = `${player.nombre} ${player.apellidos}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          player.dorsal.toString().includes(searchQuery) ||
                          (player.equipo && player.equipo.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPosition = positionFilter === 'Todos' || player.demarcacion === positionFilter;
    const matchesTalla = tallaFilter === 'Todos' || player.talla === Number(tallaFilter);

    return matchesSearch && matchesPosition && matchesTalla;
  });

  // Loading checker
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <span className="animate-spin h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full block mx-auto" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Cargando Gestor de Fútbol...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Render beautiful Auth Screen
  if (!userEmail) {
    return (
      <AuthScreen 
        isSupabaseActive={isSupabaseActive} 
        onLoginSuccess={handleSandboxLoginSuccess} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans transition-all duration-150 selection:bg-emerald-600/30 selection:text-emerald-300">
      
      {/* Top Application Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Title / Identity logo */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-mono shadow-md border border-emerald-400/20">
                <span className="font-bold text-base select-none">TS</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase block leading-none">CRAFTED SCOUT</span>
                <span className="text-base font-extrabold text-white tracking-tight">TITAN<span className="text-emerald-400">SCOUT</span></span>
              </div>
            </div>

            {/* Desktop Navigation Link Tabs */}
            <nav className="hidden md:flex items-center space-x-1.5">
              <button
                id="tab-view-players"
                onClick={() => setActiveTab('plantilla')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  activeTab === 'plantilla' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent'
                }`}
              >
                <Users className="h-4 w-4 text-emerald-400" />
                <span>Plantilla</span>
              </button>

              <button
                id="tab-view-evaluations"
                onClick={() => setActiveTab('evaluaciones')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  activeTab === 'evaluaciones' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent'
                }`}
              >
                <ClipboardCheck className="h-4 w-4 text-emerald-400" />
                <span>Evaluaciones</span>
              </button>
              
              <button
                id="tab-view-stats"
                onClick={() => setActiveTab('estadisticas')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  activeTab === 'estadisticas' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent'
                }`}
              >
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                <span>Estadísticas</span>
              </button>

              <button
                id="tab-view-config"
                onClick={() => setActiveTab('configuracion')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  activeTab === 'configuracion' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent'
                }`}
              >
                <Settings className="h-4 w-4 text-amber-400" />
                <span>Base de Datos</span>
              </button>
            </nav>

            {/* User credentials and logout buttons */}
            <div className="flex items-center space-x-4">
              <div className="hidden lg:block text-right">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase leading-tight">ENTRENADOR</span>
                <span className="text-xs font-medium text-slate-300 block truncate max-w-[150px]" title={userEmail}>
                  {userEmail}
                </span>
              </div>

              <div className="h-px bg-slate-800 w-4 hidden lg:block" />

              <button
                id="btn-app-logout"
                onClick={handleLogout}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors duration-150 cursor-pointer text-xs font-semibold"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
            
          </div>
        </div>

        {/* Mobile Navigation Footer Bar */}
        <div className="md:hidden border-t border-slate-800 flex justify-around py-2.5 bg-slate-950 text-center text-[10px] font-bold tracking-wide uppercase text-slate-400">
          <button
            id="mobile-tab-players"
            onClick={() => setActiveTab('plantilla')}
            className={`flex-1 flex flex-col items-center space-y-1 ${activeTab === 'plantilla' ? 'text-emerald-400 font-extrabold' : 'hover:text-slate-200'}`}
          >
            <Users className="h-4.5 w-4.5" />
            <span>Plantilla</span>
          </button>

          <button
            id="mobile-tab-evaluations"
            onClick={() => setActiveTab('evaluaciones')}
            className={`flex-1 flex flex-col items-center space-y-1 ${activeTab === 'evaluaciones' ? 'text-emerald-400 font-extrabold' : 'hover:text-slate-200'}`}
          >
            <ClipboardCheck className="h-4.5 w-4.5" />
            <span>Eval.</span>
          </button>
          
          <button
            id="mobile-tab-stats"
            onClick={() => setActiveTab('estadisticas')}
            className={`flex-1 flex flex-col items-center space-y-1 ${activeTab === 'estadisticas' ? 'text-emerald-400 font-extrabold' : 'hover:text-slate-200'}`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            <span>Estadísticas</span>
          </button>

          <button
            id="mobile-tab-config"
            onClick={() => setActiveTab('configuracion')}
            className={`flex-1 flex flex-col items-center space-y-1 ${activeTab === 'configuracion' ? 'text-amber-400 font-extrabold' : 'hover:text-slate-200'}`}
          >
            <Settings className="h-4.5 w-4.5" />
            <span>Supabase</span>
          </button>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Sync Status Overlay / Floating Panel */}
        {syncError && (
          <div className="mb-6 p-5 bg-red-950/35 border border-red-900/40 rounded-2xl shadow-xl">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 bg-red-900/45 text-red-400 rounded-xl border border-red-800/20 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-red-300 text-sm tracking-tight">
                  {syncError.includes("public.jugadores") ? 'Tabla "jugadores" no encontrada en tu base de datos' : 'Error de Sincronización'}
                </h4>
                <p className="text-xs text-red-400/90 leading-relaxed mt-1">
                  {syncError}
                </p>

                {syncError.includes("public.jugadores") && (
                  <div className="mt-4 p-4.5 bg-slate-950/60 rounded-xl border border-slate-900 space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      💡 <span className="font-bold text-slate-200">¿Cómo solucionarlo?</span> Tu cliente Supabase está conectado correctamente, pero la tabla <code className="text-emerald-400 font-mono px-1.5 py-0.5 bg-slate-905 bg-slate-900/80 rounded border border-slate-800">public.jugadores</code> todavía no ha sido creada en la base de datos de tu cuenta de Supabase. Sigue estos sencillos pasos:
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1.5">
                      <li>Haz clic en el botón <strong className="text-amber-400 font-bold">Ver Instrucciones SQL</strong> de abajo.</li>
                      <li>Haz clic en el botón <strong className="text-slate-200 font-bold">Copiar SQL</strong> para guardar el comando de creación en tu portapapeles.</li>
                      <li>Entra en tu proyecto de Supabase, ve a <strong className="text-slate-205 text-slate-200">SQL Editor</strong>, crea una nueva consulta vacía, pégalo y haz clic en <strong className="text-emerald-400">Run</strong>.</li>
                    </ol>
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      <button
                        id="btn-error-go-config"
                        onClick={() => setActiveTab('configuracion')}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition duration-150 cursor-pointer shadow-md"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Ver Instrucciones SQL</span>
                      </button>
                      <button
                        id="btn-error-refresh"
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-lg text-xs transition duration-150 border border-slate-800 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Actualizar Aplicación</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sandbox Indicator Banner inside app */}
        {!isSupabaseActive && activeTab === 'plantilla' && (
          <div className="mb-6 p-4 bg-amber-950/20 rounded-2xl border border-amber-900/20 shadow-sm flex flex-col sm:flex-row items-center justify-between text-amber-300 gap-3">
            <div className="flex items-center space-x-3 text-xs">
              <div className="p-2 bg-amber-950/50 text-amber-400 rounded-xl shrink-0 border border-amber-900/30">
                <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="leading-relaxed">
                <span className="font-bold block text-amber-200">Visualizando en Sandbox Local</span>
                <span className="text-amber-400/80">Los datos provienen del LocalStorage de tu navegador. Configura Supabase en <strong>Base de Datos</strong> para activar la nube.</span>
              </div>
            </div>
            
            <button
              id="banner-btn-config"
              onClick={() => setActiveTab('configuracion')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition duration-150 cursor-pointer shadow-sm shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Conectar Supabase</span>
            </button>
          </div>
        )}

        {/* View Switcher Engine */}
        {activeTab === 'plantilla' && (
          <div className="space-y-6">
            
            {/* Visual Title and Filters Card Bar */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 shadow-sm flex flex-col gap-5">
              
              {/* Top Row: Title, Mode View Switcher and Call to Action */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left detail info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-start gap-4 flex-1">
                  <div>
                    <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center">
                      <Users className="h-6 w-6 mr-2 text-emerald-400" />
                      Plantilla de Jugadores
                    </h1>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      {filteredPlayers.length} de {players.length} jugadores coinciden con tu filtro actual.
                    </p>
                  </div>

                  {/* Segmented Control View Mode */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850 self-start sm:self-center shrink-0">
                    <button
                      id="btn-view-grid"
                      onClick={() => handleSetViewMode('grid')}
                      className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition duration-150 cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Vista de Tarjetas / Cuadrícula"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span>Mosaico</span>
                    </button>
                    <button
                      id="btn-view-table"
                      onClick={() => handleSetViewMode('table')}
                      className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition duration-150 cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Vista en Filtro de Tabla"
                    >
                      <Table className="h-3.5 w-3.5" />
                      <span>Tabla</span>
                    </button>
                  </div>
                </div>

                {/* Main Action Register */}
                <button
                  id="btn-trigger-add-player"
                  onClick={() => { setSelectedPlayer(null); setIsFormOpen(true); }}
                  className="inline-flex items-center justify-center space-x-1 px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors duration-150 cursor-pointer shadow-md text-center shrink-0"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Inscribir Jugador</span>
                </button>
              </div>

              {/* Decorative dynamic separator line inside control board */}
              <div className="h-[1px] w-full bg-slate-900/60" />

              {/* Bottom Row: Advanced Filter Board with Instant Filtering Chips */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
                
                {/* Search query box (Takes 4 cols in grid) */}
                <div className="xl:col-span-4 flex flex-col justify-end">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-2 block">
                    Búsqueda de Campo
                  </span>
                  <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Buscar por nombre, dorsal o equipo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-900/90 rounded-xl text-xs placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150 h-10"
                    />
                  </div>
                </div>

                {/* Position pills selector (Takes 4 cols) */}
                <div className="xl:col-span-4 flex flex-col justify-end">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-2 block">
                    Filtrar por Demarcación / Posición
                  </span>
                  <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950 border border-slate-900 rounded-xl max-w-full overflow-hidden h-10 items-center">
                    {[
                      { value: 'Todos', label: 'Todos' },
                      { value: 'Portero', label: 'GK 🧤' },
                      { value: 'Defensa', label: 'DEF 🛡️' },
                      { value: 'Centrocampista', label: 'MID 🧠' },
                      { value: 'Delantero', label: 'FWD ⚡' },
                    ].map((pos) => {
                      const isActive = positionFilter === pos.value;
                      return (
                        <button
                          key={pos.value}
                          onClick={() => setPositionFilter(pos.value)}
                          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold font-mono transition duration-150 cursor-pointer text-center whitespace-nowrap min-w-0 truncate ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                          }`}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Talla selector (Takes 3 cols) */}
                <div className="xl:col-span-3 flex flex-col justify-end">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-2 block">
                    Filtrar por Talla / Estatura
                  </span>
                  <select
                    id="talla-select-filter"
                    value={tallaFilter}
                    onChange={(e) => setTallaFilter(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150 h-10 cursor-pointer font-sans"
                  >
                    <option value="Todos">Cualquier Estatura</option>
                    {Array.from({ length: 31 }, (_, i) => 160 + i).map((val) => (
                      <option key={val} value={val}>
                        {val} cm
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resets controls if any filter is active (Takes 1 col) */}
                <div className="xl:col-span-1 flex flex-col justify-end">
                  {(searchQuery || positionFilter !== 'Todos' || tallaFilter !== 'Todos') ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setPositionFilter('Todos');
                        setTallaFilter('Todos');
                      }}
                      className="w-full h-10 flex items-center justify-center p-2.5 bg-slate-950 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-500/5 rounded-xl text-xs font-bold transition duration-150 cursor-pointer"
                      title="Limpiar todos los filtros"
                    >
                      Limpiar
                    </button>
                  ) : (
                    <div className="w-full h-10 flex items-center justify-center p-2.5 bg-[#0e1626]/25 border border-slate-900 text-slate-600 rounded-xl text-xs font-mono select-none">
                      Activo
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Players Grid / Table switcher list */}
            {loadingPlayers ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs tracking-wider gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
                <span>Cargando plantilla deportiva...</span>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-12 text-center text-slate-400 shadow-sm max-w-xl mx-auto space-y-4">
                <div className="h-12 w-12 bg-slate-950 rounded-2xl text-slate-500 border border-slate-800 flex items-center justify-center mx-auto">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-base">Sin Fichas Deportivas Encontradas</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    No encontramos jugadores con las características o filtros indicados actualmente.
                  </p>
                </div>
                
                {/* Seed button if Supabase is empty to make onboarding glorious */}
                {isSupabaseActive && players.length === 0 && (
                  <button
                    id="btn-seed-supabase-db"
                    onClick={handleSeedDatabaseInSupabase}
                    className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-xl text-xs font-semibold transition-all duration-150 shadow-sm cursor-pointer mx-auto block mt-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Cargar Plantilla Inicial de 20 Jugadores</span>
                  </button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <PlayerTableView
                players={filteredPlayers}
                evaluations={evaluations}
                onEdit={(p) => { setSelectedPlayer(p); setIsFormOpen(true); }}
                onDelete={handleDeletePlayer}
                onDetail={(p) => { setDetailedPlayer(p); setIsDetailOpen(true); }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onEdit={(p) => { setSelectedPlayer(p); setIsFormOpen(true); }}
                    onDelete={handleDeletePlayer}
                    onDetail={(p) => { setDetailedPlayer(p); setIsDetailOpen(true); }}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {activeTab === 'evaluaciones' && (
          <EvaluacionesView 
            players={players}
            evaluations={evaluations}
            onSaveEvaluation={handleSaveEvaluation}
            onDeleteEvaluation={handleDeleteEvaluation}
            loading={loadingEvaluations}
          />
        )}

        {activeTab === 'estadisticas' && (
          <TeamStats players={players} />
        )}

        {activeTab === 'configuracion' && (
          <SupabaseInstructions isConfigured={isSupabaseActive} />
        )}

      </main>

      {/* Footer Banner Info */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-500 text-xs py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-emerald-400 font-bold tracking-tight">TITAN SCOUT</span>
            <span className="text-slate-800">|</span>
            <span>Panel Oficial de Gestión Deportiva</span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono">
            {isSupabaseActive ? 'Modo Producción Activo (Supabase Cloud)' : 'Modo Sandbox Local (Navegador)'}
          </div>
        </div>
      </footer>

      {/* Add / Edit Form Modal Frame */}
      <PlayerFormModal
        player={selectedPlayer}
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedPlayer(null); }}
        onSave={handleSavePlayer}
        isSupabaseActive={isSupabaseActive}
      />

      {/* Technical Scouting Detail Modal Frame */}
      <PlayerDetailModal
        player={detailedPlayer}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailedPlayer(null); }}
        onEdit={(p) => { setSelectedPlayer(p); setIsFormOpen(true); }}
      />

    </div>
  );
}
