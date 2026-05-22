import React, { useState } from 'react';
import { Jugador, Evaluacion } from '../types';
import { getPlayerPhotoUrl } from '../lib/supabase';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Compass, 
  Calendar, 
  ChevronUp, 
  ChevronDown, 
  ShieldAlert,
  SlidersHorizontal 
} from 'lucide-react';

interface PlayerTableViewProps {
  players: Jugador[];
  onEdit: (player: Jugador) => void;
  onDelete: (id: string) => void;
  onDetail: (player: Jugador) => void;
  evaluations: Evaluacion[];
}

type SortField = 'dorsal' | 'nombre' | 'demarcacion' | 'talla' | 'edad' | 'equipo' | 'val' | 'eval';
type SortOrder = 'asc' | 'desc';

export const PlayerTableView: React.FC<PlayerTableViewProps> = ({
  players,
  onEdit,
  onDelete,
  onDetail,
  evaluations = [],
}) => {
  const [sortField, setSortField] = useState<SortField>('dorsal');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);

  // Age calculation
  const calculateAge = (birthdate: string) => {
    if (!birthdate) return 0;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Dynamic Overall Rating (VAL) Generator
  const getOverallVal = (p: Jugador) => {
    const hash = (p.nombre.length * 3 + p.apellidos.length * 7 + p.dorsal) % 7;
    const baseValue = 78 + hash * 2.5;
    let stats = [];
    switch (p.demarcacion) {
      case 'Portero':
        stats = [baseValue + 4, baseValue - 1, baseValue + 2, baseValue - 2, baseValue - 5];
        break;
      case 'Defensa':
        stats = [baseValue + 3, baseValue + 4, baseValue + 2, baseValue, baseValue - 6];
        break;
      case 'Centrocampista':
        stats = [baseValue + 5, baseValue + 3, baseValue + 2, baseValue + 1, baseValue - 4];
        break;
      case 'Delantero':
        stats = [baseValue + 6, baseValue + 2, baseValue + 3, baseValue + 1, baseValue - 2];
        break;
      default:
        stats = [baseValue, baseValue, baseValue, baseValue];
    }
    const sum = stats.reduce((acc, v) => acc + Math.min(99, Math.round(v)), 0);
    return Math.round(sum / stats.length);
  };

  const getDemarcationBadge = (pos: string) => {
    switch (pos) {
      case 'Portero':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Defensa':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Centrocampista':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Delantero':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getPlayerEvaluations = (playerId: string) => {
    return evaluations.filter(ev => ev.jugador_id === playerId);
  };

  const getPlayerAvgEvaluation = (playerId: string) => {
    const evs = getPlayerEvaluations(playerId);
    if (evs.length === 0) return null;
    const sum = evs.reduce((acc, ev) => acc + ev.nota_media, 0);
    return Number((sum / evs.length).toFixed(1));
  };

  // Sort logic handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedPlayers = () => {
    const sorted = [...players];
    sorted.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'dorsal':
          valA = a.dorsal;
          valB = b.dorsal;
          break;
        case 'nombre':
          valA = `${a.nombre} ${a.apellidos}`.toLowerCase();
          valB = `${b.nombre} ${b.apellidos}`.toLowerCase();
          break;
        case 'demarcacion':
          valA = a.demarcacion.toLowerCase();
          valB = b.demarcacion.toLowerCase();
          break;
        case 'talla':
          valA = a.talla || 0;
          valB = b.talla || 0;
          break;
        case 'edad':
          valA = calculateAge(a.fecha_nacimiento);
          valB = calculateAge(b.fecha_nacimiento);
          break;
        case 'equipo':
          valA = (a.equipo || '').toLowerCase();
          valB = (b.equipo || '').toLowerCase();
          break;
        case 'val':
          valA = getOverallVal(a);
          valB = getOverallVal(b);
          break;
        case 'eval':
          valA = getPlayerAvgEvaluation(a.id) || 0;
          valB = getPlayerAvgEvaluation(b.id) || 0;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const sortedList = getSortedPlayers();

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-3.5 w-3.5 ml-1 inline text-emerald-400" /> : 
      <ChevronDown className="h-3.5 w-3.5 ml-1 inline text-emerald-400" />;
  };

  const sortedHeaderClass = "py-3.5 px-4 text-left text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase cursor-pointer select-none hover:text-slate-200 transition-colors duration-150";

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-900 shadow-xl overflow-hidden relative">
      
      {/* Delete Confirmation Overlay inside Table row focus */}
      {isConfirmingDelete && (
        <div className="absolute inset-0 bg-[#070a13]/98 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
          <div className="w-12 h-12 bg-red-400/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 mb-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <Trash2 className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">Confirmar Baja en Tabla</h4>
          <p className="text-xs text-slate-450 text-slate-400 mt-2 max-w-sm leading-relaxed">
            ¿Confirmas que deseas retirar del sistema al jugador seleccionado?
          </p>
          <div className="flex gap-3 mt-5 w-full max-w-[280px]">
            <button
              onClick={() => setIsConfirmingDelete(null)}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold font-mono text-slate-400 hover:text-white rounded-xl transition duration-155 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const id = isConfirmingDelete;
                setIsConfirmingDelete(null);
                onDelete(id);
              }}
              className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition duration-155 cursor-pointer shadow-md shadow-red-500/10"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Responsive horizontal scrollable table wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-950/70">
              <th 
                onClick={() => handleSort('dorsal')} 
                className={`${sortedHeaderClass} w-20 text-center`}
              >
                Dorsal <SortIndicator field="dorsal" />
              </th>
              <th 
                onClick={() => handleSort('nombre')} 
                className={sortedHeaderClass}
              >
                Jugador <SortIndicator field="nombre" />
              </th>
              <th 
                onClick={() => handleSort('demarcacion')} 
                className={sortedHeaderClass}
              >
                Posición <SortIndicator field="demarcacion" />
              </th>
              <th 
                onClick={() => handleSort('edad')} 
                className={sortedHeaderClass}
              >
                Edad <SortIndicator field="edad" />
              </th>
              <th 
                onClick={() => handleSort('talla')} 
                className={sortedHeaderClass}
              >
                Talla <SortIndicator field="talla" />
              </th>
              <th 
                onClick={() => handleSort('equipo')} 
                className={sortedHeaderClass}
              >
                Equipo / Club <SortIndicator field="equipo" />
              </th>
              <th 
                onClick={() => handleSort('val')} 
                className={`${sortedHeaderClass} text-center`}
              >
                VAL <SortIndicator field="val" />
              </th>
              <th 
                onClick={() => handleSort('eval')} 
                className={`${sortedHeaderClass} text-center`}
              >
                Evaluación <SortIndicator field="eval" />
              </th>
              <th className="py-3.5 px-4 text-center text-[10px] font-bold text-slate-500 tracking-wider font-mono uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/40">
            {sortedList.map((player) => {
              const age = calculateAge(player.fecha_nacimiento);
              const overallVal = getOverallVal(player);
              const photoUrl = player.foto_jugador ? getPlayerPhotoUrl(player.foto_jugador) : '';
              const isImageError = imageErrors[player.id] || false;
              const demarcationBadge = getDemarcationBadge(player.demarcacion);

              return (
                <tr 
                  key={player.id} 
                  className="hover:bg-slate-900/15 transition-all duration-150 group"
                >
                  {/* Dorsal Cell */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-350 select-none">
                    <span className="inline-flex items-center justify-center bg-slate-950/80 border border-slate-850 h-7.5 w-7.5 rounded text-xs">
                      #{player.dorsal}
                    </span>
                  </td>

                  {/* Player Name and Avatar Cell */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      {/* Avatar preview */}
                      <div className="h-10 w-10 bg-slate-950 rounded-xl overflow-hidden border border-slate-900 flex-none flex items-center justify-center bg-radial-to-t from-slate-900 to-slate-950">
                        {photoUrl && !isImageError ? (
                          <img
                            src={photoUrl}
                            alt={player.nombre}
                            referrerPolicy="no-referrer"
                            onError={() => setImageErrors(prev => ({ ...prev, [player.id]: true }))}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <span className="font-mono text-[10px] text-emerald-500 font-extrabold">
                            ⚽
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span 
                          onClick={() => onDetail(player)}
                          className="font-bold text-slate-200 text-sm hover:text-emerald-400 cursor-pointer block truncate transition-colors duration-150"
                        >
                          {player.nombre} <span className="text-slate-400 capitalize">{player.apellidos.toLowerCase()}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 block font-mono truncate">
                          {player.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Position Badge Cell */}
                  <td className="py-3 px-4 text-xs font-semibold">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border bg-slate-950/90 ${demarcationBadge}`}>
                      {player.demarcacion}
                    </span>
                  </td>

                  {/* Age Cell */}
                  <td className="py-3 px-4 text-xs font-mono font-semibold text-slate-300">
                    {age} <span className="text-[9px] text-slate-500">años</span>
                  </td>

                  {/* Talla Height Cell */}
                  <td className="py-3 px-4 text-xs font-mono font-bold select-none text-slate-300">
                    {player.talla || 175} <span className="text-[9px] text-slate-500 font-normal">cm</span>
                  </td>

                  {/* Club cell */}
                  <td className="py-3 px-4 text-xs text-slate-300 font-medium truncate max-w-[140px]">
                    {player.equipo || <span className="text-slate-600 italic">Libre</span>}
                  </td>

                  {/* Overall Rating VAL Cell */}
                  <td className="py-3 px-4 text-center font-mono font-black text-xs select-none">
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-slate-950 text-xs border border-slate-900 ${
                      overallVal >= 90 ? 'text-emerald-400 font-black' :
                      overallVal >= 80 ? 'text-amber-400 font-bold' :
                      'text-slate-350 text-slate-300'
                    }`}>
                      {overallVal}
                    </span>
                  </td>

                  {/* Evaluations Cell */}
                  <td className="py-3 px-4 text-center select-none font-mono">
                    {(() => {
                      const evs = getPlayerEvaluations(player.id);
                      const avg = getPlayerAvgEvaluation(player.id);
                      if (avg === null) {
                        return (
                          <span className="text-[10px] text-slate-650 italic">
                            Sin evaluar
                          </span>
                        );
                      }
                      
                      let badgeColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20';
                      if (avg >= 8.5) badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                      else if (avg >= 7.0) badgeColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
                      else if (avg >= 5.0) badgeColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                      else badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                      return (
                        <div className="flex flex-col items-center justify-center space-y-0.5">
                          <span className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-lg border text-xs font-extrabold ${badgeColor}`}>
                            <span>★</span>
                            <span>{avg.toFixed(1)}</span>
                          </span>
                          <span className="text-[9px] text-slate-500 leading-none">
                            {evs.length} {evs.length === 1 ? 'eval.' : 'evals.'}
                          </span>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Actions column */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5 select-none">
                      <button
                        id={`btn-table-detail-${player.id}`}
                        onClick={() => onDetail(player)}
                        className="p-1 px-2 rounded-lg border border-slate-900/80 bg-slate-950 hover:bg-slate-900 text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-colors duration-150 cursor-pointer flex items-center gap-1"
                        title="Ver Ficha Técnica"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400" />
                        <span className="hidden xl:inline">Reporte</span>
                      </button>

                      <button
                        id={`btn-table-edit-${player.id}`}
                        onClick={() => onEdit(player)}
                        className="p-1.5 rounded-lg border border-slate-900 bg-slate-950 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors duration-150 cursor-pointer"
                        title="Editar Ficha"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        id={`btn-table-delete-${player.id}`}
                        onClick={() => setIsConfirmingDelete(player.id)}
                        className="p-1.5 rounded-lg border border-red-950/20 text-red-550 text-red-500 hover:bg-red-950/20 transition-colors duration-150 cursor-pointer"
                        title="Dar de Baja"
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
  );
};
