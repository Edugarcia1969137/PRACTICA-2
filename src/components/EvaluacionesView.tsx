import React, { useState } from 'react';
import { Jugador, Evaluacion } from '../types';
import { 
  Star, 
  Plus, 
  Trash2, 
  Calendar, 
  MessageSquare, 
  Award, 
  Sparkles, 
  Search, 
  Filter, 
  X, 
  Activity, 
  User, 
  TrendingUp,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { getPlayerPhotoUrl } from '../lib/supabase';

interface EvaluacionesViewProps {
  players: Jugador[];
  evaluations: Evaluacion[];
  onSaveEvaluation: (evalData: Omit<Evaluacion, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  onDeleteEvaluation: (id: string) => Promise<void>;
  loading: boolean;
}

export const EvaluacionesView: React.FC<EvaluacionesViewProps> = ({
  players,
  evaluations,
  onSaveEvaluation,
  onDeleteEvaluation,
  loading
}) => {
  // Filters
  const [playerFilter, setPlayerFilter] = useState<string>('Todos');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  
  // UI modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluacion | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    jugador_id: '',
    rendimiento_tecnico: 7,
    tactica: 7,
    fisico: 7,
    actitud: 8,
    comentarios: '',
    fecha_evaluacion: new Date().toISOString().split('T')[0]
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Open form for creating
  const handleOpenCreate = () => {
    setSelectedEvaluation(null);
    setFormData({
      jugador_id: players[0]?.id || '',
      rendimiento_tecnico: 7,
      tactica: 7,
      fisico: 7,
      actitud: 8,
      comentarios: '',
      fecha_evaluacion: new Date().toISOString().split('T')[0]
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEdit = (evaluation: Evaluacion) => {
    setSelectedEvaluation(evaluation);
    setFormData({
      jugador_id: evaluation.jugador_id,
      rendimiento_tecnico: evaluation.rendimiento_tecnico,
      tactica: evaluation.tactica,
      fisico: evaluation.fisico,
      actitud: evaluation.actitud,
      comentarios: evaluation.comentarios || '',
      fecha_evaluacion: evaluation.fecha_evaluacion
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.jugador_id) {
      setFormError('Debes seleccionar un jugador de la plantilla.');
      return;
    }

    setSaving(true);
    try {
      // average calculation
      const nota_media = Number(
        ((formData.rendimiento_tecnico + formData.tactica + formData.fisico + formData.actitud) / 4).toFixed(2)
      );

      await onSaveEvaluation({
        ...(selectedEvaluation?.id ? { id: selectedEvaluation.id } : {}),
        jugador_id: formData.jugador_id,
        rendimiento_tecnico: Number(formData.rendimiento_tecnico),
        tactica: Number(formData.tactica),
        fisico: Number(formData.fisico),
        actitud: Number(formData.actitud),
        nota_media,
        comentarios: formData.comentarios.trim(),
        fecha_evaluacion: formData.fecha_evaluacion
      });
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al intentar guardar la evaluación.');
    } finally {
      setSaving(false);
    }
  };

  // Get player details
  const getPlayer = (id: string): Jugador | undefined => {
    return players.find(p => p.id === id);
  };

  // Filtered evaluations
  const filteredEvaluations = evaluations.filter(ev => {
    const matchesPlayer = playerFilter === 'Todos' || ev.jugador_id === playerFilter;
    const matchesScore = ev.nota_media >= minScoreFilter;
    return matchesPlayer && matchesScore;
  });

  // Calculate stats for top evaluations card
  const topEvaluations = [...evaluations]
    .sort((a, b) => b.nota_media - a.nota_media)
    .slice(0, 3);

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 7.0) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    if (score >= 5.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getScoreColorOnlyText = (score: number) => {
    if (score >= 8.5) return 'text-emerald-400';
    if (score >= 7.0) return 'text-sky-400';
    if (score >= 5.0) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6">
      
      {/* Header and top metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Banner with controls */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 shadow-sm lg:col-span-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/25">
                <Award className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Evaluaciones Deportivas</h1>
            </div>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Analiza y registra el rendimiento, preparación física, actitud y táctica de los jugadores del club. Puntúa de 1 a 10 con baremos oficiales.
            </p>
          </div>
          
          <button
            id="btn-add-evaluation-trigger"
            onClick={handleOpenCreate}
            disabled={players.length === 0}
            className="inline-flex items-center justify-center space-x-1 px-4.5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-850 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs transition-colors duration-150 cursor-pointer shadow-md shrink-0 h-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Evaluación</span>
          </button>
        </div>

        {/* Top Performer Card */}
        <div className="bg-[#0b1322]/50 p-5 rounded-2xl border border-slate-900/90 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider flex items-center">
              <Sparkles className="h-3 w-3 text-amber-400 mr-1.5" />
              Top Evaluaciones
            </span>
            <span className="text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full font-mono">MVP</span>
          </div>

          <div className="space-y-2.5">
            {topEvaluations.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic py-4">
                No hay valoraciones registradas aún.
              </div>
            ) : (
              topEvaluations.map((ev, index) => {
                const p = getPlayer(ev.jugador_id);
                if (!p) return null;
                return (
                  <div key={ev.id} className="flex items-center justify-between bg-slate-950/40 p-2 rounded-xl border border-slate-900/40">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="text-xs font-mono font-bold text-slate-500 min-w-[12px]">#{index + 1}</div>
                      <img 
                        src={getPlayerPhotoUrl(p.foto_jugador || '')} 
                        alt={p.nombre}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';
                        }}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-800"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate leading-tight">{p.nombre} {p.apellidos.split(' ')[0]}</p>
                        <p className="text-[9px] text-emerald-400 font-mono">Dorsal {p.dorsal} • {p.demarcacion}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-slate-100 bg-[#16273f] px-2 py-1 rounded-lg border border-[#213a5a]">
                      {ev.nota_media.toFixed(1)} /10
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Control filters dashboard panel */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Filter selection tools */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 flex-1">
          
          <div className="flex flex-col min-w-[200px]">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-1.5 flex items-center">
              <Filter className="h-3 w-3 mr-1" /> Jugador de Plantilla
            </span>
            <select
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-350 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150"
            >
              <option value="Todos">Todos los Jugadores ({players.length})</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.dorsal} {p.nombre} {p.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[170px]">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-1.5 flex items-center">
              <Star className="h-3 w-3 mr-1 text-amber-500" /> Nota Media Mínima
            </span>
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-350 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150"
            >
              <option value="0">Cualquier Puntuación</option>
              <option value="5">Aprobado (&gt;= 5.0)</option>
              <option value="7">Notable (&gt;= 7.0)</option>
              <option value="8.5">Sobresaliente (&gt;= 8.5)</option>
            </select>
          </div>

          {(playerFilter !== 'Todos' || minScoreFilter > 0) && (
            <button
              onClick={() => {
                setPlayerFilter('Todos');
                setMinScoreFilter(0);
              }}
              className="self-end px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-350 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 rounded-xl cursor-pointer h-9 transition mt-auto"
            >
              Restablecer
            </button>
          )}

        </div>

        {/* Dynamic counter details */}
        <div className="bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono shrink-0">
          <span className="text-slate-400">Total Evaluaciones Coincidentes:</span>
          <span className="font-extrabold text-emerald-400 ml-2.5">{filteredEvaluations.length}</span>
        </div>

      </div>

      {/* Main Table view of current evaluations or empty message */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-500 font-mono text-xs">Cargando histórico de evaluaciones...</p>
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-12 text-center text-slate-400 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="h-12 w-12 bg-slate-950 rounded-2xl text-slate-500 border border-slate-800 flex items-center justify-center mx-auto">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-200 text-base">Sin Evaluaciones Registradas</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              No se han encontrado fichas de rendimiento que cumplan los filtros vigentes. Genera una evaluación pulsando "Nueva Evaluación".
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-900 shadow-sm overflow-hidden p-1.5">
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-500 uppercase tracking-widest text-[9px] font-bold font-mono select-none">
                  <th className="py-3.5 px-4 rounded-l-xl">Jugador</th>
                  <th className="py-3.5 px-4 text-center">Fís.</th>
                  <th className="py-3.5 px-4 text-center">Técn.</th>
                  <th className="py-3.5 px-4 text-center">Táct.</th>
                  <th className="py-3.5 px-4 text-center">Act.</th>
                  <th className="py-3.5 px-4 text-center">Nota Media</th>
                  <th className="py-3.5 px-4">Comentarios</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredEvaluations.map((ev) => {
                  const p = getPlayer(ev.jugador_id);
                  if (!p) return null;
                  return (
                    <tr key={ev.id} className="hover:bg-slate-900/20 text-slate-300 font-sans transition-colors duration-100">
                      
                      {/* Player photo / details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={getPlayerPhotoUrl(p.foto_jugador || '')} 
                            alt={p.nombre} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';
                            }}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-800"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-100 text-xs truncate leading-snug">
                              {p.nombre} {p.apellidos}
                            </h4>
                            <p className="text-[9px] text-slate-500 font-mono font-bold">
                              #{p.dorsal} • {p.demarcacion} • {p.equipo}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Scores columns */}
                      <td className="py-3 px-4 text-center text-xs font-mono font-bold text-slate-150">
                        {ev.fisico}/10
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-mono font-bold text-slate-150">
                        {ev.rendimiento_tecnico}/10
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-mono font-bold text-slate-150">
                        {ev.tactica}/10
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-mono font-bold text-slate-150">
                        {ev.actitud}/10
                      </td>

                      {/* Nota Media Badge */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded-xl border ${getScoreColor(ev.nota_media)}`}>
                          {ev.nota_media.toFixed(1)}
                        </span>
                      </td>

                      {/* Observation Comentarios */}
                      <td className="py-3 px-4 max-w-xs transition-all">
                        <div className="flex items-start space-x-1.5 text-xs text-slate-400">
                          {ev.comentarios ? (
                            <>
                              <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
                              <p className="line-clamp-2 leading-relaxed" title={ev.comentarios}>
                                {ev.comentarios}
                              </p>
                            </>
                          ) : (
                            <span className="italic text-slate-600">Sin anotaciones de campo</span>
                          )}
                        </div>
                      </td>

                      {/* Date column */}
                      <td className="py-3 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-600" />
                          <span>{ev.fecha_evaluacion}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(ev)}
                            className="p-1 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent rounded-lg hover:border-emerald-500/10 cursor-pointer transition duration-150"
                            title="Editar valoración"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de que deseas eliminar esta evaluación del historial?`)) {
                                onDeleteEvaluation(ev.id);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent rounded-lg hover:border-red-500/10 cursor-pointer transition duration-150"
                            title="Descartar evaluación"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide Modal to Add/Edit Evaluation */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border border-slate-205">
            
            {/* Modal header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 text-slate-900">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm uppercase font-sans tracking-wide">
                  {selectedEvaluation ? 'Editar Evaluación' : 'Crear Ficha de Evaluación'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition h-8 w-8 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Scroll form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs flex items-center space-x-2">
                  <X className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Player selector dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider mb-1.5" htmlFor="form-player-id">
                  Jugador Seleccionado <span className="text-red-500">*</span>
                </label>
                <select
                  id="form-player-id"
                  disabled={!!selectedEvaluation}
                  value={formData.jugador_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, jugador_id: e.target.value }))}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Selecciona un jugador...</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.dorsal} {p.nombre} {p.apellidos} ({p.demarcacion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scores block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block font-mono">
                  Métricas de Evaluación (1 al 10)
                </span>

                {/* Rendimiento Tecnico */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 font-mono" htmlFor="score-tech">
                      Rendimiento Técnico
                    </label>
                    <span className="text-xs font-black font-mono text-emerald-600 bg-emerald-55 bg-emerald-100/10 px-1.5 rounded">{formData.rendimiento_tecnico}/10</span>
                  </div>
                  <input
                    id="score-tech"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={formData.rendimiento_tecnico}
                    onChange={(e) => setFormData(prev => ({ ...prev, rendimiento_tecnico: Number(e.target.value) }))}
                    className="w-full accent-emerald-550 h-1 bg-slate-205 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Tactica */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 font-mono" htmlFor="score-tact">
                      Disciplina Táctica
                    </label>
                    <span className="text-xs font-black font-mono text-emerald-600 bg-emerald-100/10 px-1.5 rounded">{formData.tactica}/10</span>
                  </div>
                  <input
                    id="score-tact"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={formData.tactica}
                    onChange={(e) => setFormData(prev => ({ ...prev, tactica: Number(e.target.value) }))}
                    className="w-full accent-emerald-550 h-1 bg-slate-202 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Fisico */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 font-mono" htmlFor="score-fis">
                      Condición Física
                    </label>
                    <span className="text-xs font-black font-mono text-emerald-600 bg-emerald-100/10 px-1.5 rounded">{formData.fisico}/10</span>
                  </div>
                  <input
                    id="score-fis"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={formData.fisico}
                    onChange={(e) => setFormData(prev => ({ ...prev, fisico: Number(e.target.value) }))}
                    className="w-full accent-emerald-550 h-1 bg-slate-202 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Actitud */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 font-mono" htmlFor="score-act">
                      Actitud y Esfuerzo
                    </label>
                    <span className="text-xs font-black font-mono text-emerald-600 bg-emerald-100/10 px-1.5 rounded">{formData.actitud}/10</span>
                  </div>
                  <input
                    id="score-act"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={formData.actitud}
                    onChange={(e) => setFormData(prev => ({ ...prev, actitud: Number(e.target.value) }))}
                    className="w-full accent-emerald-550 h-1 bg-slate-20d bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Dynamic Calculated Score */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">Puntaje de Nota Media Estimada:</span>
                  <span className="font-extrabold text-sm text-slate-900 bg-slate-200/50 px-2.5 py-0.5 rounded-lg border border-slate-300">
                    {((formData.rendimiento_tecnico + formData.tactica + formData.fisico + formData.actitud) / 4).toFixed(1)} /10
                  </span>
                </div>

              </div>

              {/* Fecha evaluacion */}
              <div>
                <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider mb-1.5" htmlFor="form-eval-date">
                  Fecha de Registro <span className="text-red-500">*</span>
                </label>
                <input
                  id="form-eval-date"
                  type="date"
                  value={formData.fecha_evaluacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_evaluacion: e.target.value }))}
                  required
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150 cursor-pointer h-10 font-mono"
                />
              </div>

              {/* Comentarios */}
              <div>
                <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider mb-1.5" htmlFor="form-comments">
                  Observaciones Técnicas / Comentario de Campo
                </label>
                <textarea
                  id="form-comments"
                  rows={3}
                  placeholder="Ej: Destaca por su anticipación y pases de seguridad, requiere mejorar control orientado..."
                  value={formData.comentarios}
                  onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150"
                />
              </div>

              {/* Submit panel buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-3.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-250 hover:bg-slate-100 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition duration-150 h-10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-555 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold rounded-xl text-xs shadow-md transition duration-150 cursor-pointer h-10"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{saving ? 'Guardando...' : 'Registrar'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
