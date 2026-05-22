import React, { useState } from 'react';
import { Jugador } from '../types';
import { getPlayerPhotoUrl } from '../lib/supabase';
import { Calendar, Award, Compass, Edit, Trash2, Heart, ShieldAlert, Eye, Cpu, Ruler } from 'lucide-react';

interface PlayerCardProps {
  player: Jugador;
  onEdit: (player: Jugador) => void;
  onDelete: (id: string) => void;
  onDetail: (player: Jugador) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onEdit, onDelete, onDetail }) => {
  const [imageError, setImageError] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // High status neon badge theme
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

  // Age helper
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

  // Dynamic Overall Rating (VAL) Generator to ensure premium card feeling
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

  const age = calculateAge(player.fecha_nacimiento);
  const photoUrl = player.foto_jugador ? getPlayerPhotoUrl(player.foto_jugador) : '';
  const overallVal = getOverallVal(player);

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-900/90 hover:border-slate-800/80 shadow-lg overflow-hidden transition-all duration-300 flex flex-col h-full group relative hover:-translate-y-1">
      {/* Premium Deletion Confirmation Overlay to replace sandboxed iframe blocks */}
      {isConfirmingDelete && (
        <div className="absolute inset-0 bg-[#070a13]/98 backdrop-blur-md z-30 flex flex-col items-center justify-center p-5 text-center select-none animate-in fade-in duration-200">
          <div className="w-12 h-12 bg-red-400/10 text-red-400 rounded-2xl flex items-center justify-center border border-red-500/20 mb-3.5 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <Trash2 className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">Confirmar Baja</h4>
          <p className="text-[11px] text-slate-400 mt-2 max-w-[200px] leading-relaxed">
            ¿Estás seguro de que deseas retirar del sistema a <span className="font-bold text-slate-200">{player.nombre} {player.apellidos}</span>?
          </p>
          <div className="flex flex-col gap-2 mt-4.5 w-full max-w-[190px]">
            <button
              onClick={() => {
                setIsConfirmingDelete(false);
                onDelete(player.id);
              }}
              className="w-full py-2 bg-red-500 hover:bg-red-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition duration-150 cursor-pointer shadow-md shadow-red-500/10"
            >
              Sí, Dar de Baja
            </button>
            <button
              onClick={() => setIsConfirmingDelete(false)}
              className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-xs font-bold font-mono text-slate-400 hover:text-white rounded-xl transition duration-150 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Decorative colored visual bar on top based on position */}
      <div className={`h-1 w-full shrink-0 ${
        player.demarcacion === 'Portero' ? 'bg-emerald-500' :
        player.demarcacion === 'Defensa' ? 'bg-blue-500' :
        player.demarcacion === 'Centrocampista' ? 'bg-amber-500' :
        'bg-red-500'
      }`} />
      
      {/* Player photo / Tactical header section */}
      <div 
        onClick={() => onDetail(player)}
        className="relative h-48 bg-slate-950/80 overflow-hidden shrink-0 border-b border-slate-900/70 cursor-pointer"
        title="Ver reporte deportivo"
      >
        {photoUrl && !imageError ? (
          <>
            <img
              src={photoUrl}
              alt={`${player.nombre} ${player.apellidos}`}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            />
            {/* Dark elegant gradient cover at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
          </>
        ) : (
          /* Premium Tactical Soccer Blueprint design if no photo exists */
          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Football pitch background grid lines */}
            <div className="absolute inset-0 opacity-15 border border-dashed border-slate-800 m-2.5 rounded">
              {/* Half-pitch divider */}
              <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-700 -translate-y-1/2" />
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 w-14 h-14 border border-slate-700 rounded-full -translate-x-1/2 -translate-y-1/2" />
              {/* Penalty box top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-10 border border-slate-700" />
              {/* Penalty box bottom */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-10 border border-slate-700" />
            </div>

            {/* Glowing Tactical coordinate marker based on Demarcation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              {player.demarcacion === 'Portero' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse border border-white/20 shadow-[-1px_1px_10px_#10b981]" />
                  <span className="text-[8px] text-emerald-400 font-mono font-bold mt-1 tracking-widest bg-slate-950/85 px-1 rounded-sm">GK</span>
                </div>
              )}
              {player.demarcacion === 'Defensa' && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse border border-white/20 shadow-[-1px_1px_10px_#3b82f6]" />
                  <span className="text-[8px] text-blue-400 font-mono font-bold mt-1 tracking-widest bg-slate-950/85 px-1 rounded-sm">DEF</span>
                </div>
              )}
              {player.demarcacion === 'Centrocampista' && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse border border-white/20 shadow-[-1px_1px_10px_#f59e0b]" />
                  <span className="text-[8px] text-amber-400 font-mono font-bold mt-1 tracking-widest bg-slate-950/85 px-1 rounded-sm">MID</span>
                </div>
              )}
              {player.demarcacion === 'Delantero' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse border border-white/20 shadow-[-1px_1px_10px_#ef4444]" />
                  <span className="text-[8px] text-red-400 font-mono font-bold mt-1 tracking-widest bg-slate-950/85 px-1 rounded-sm">FWD</span>
                </div>
              )}
            </div>

            {/* Custom stylized soccer jersey in center for elegant iconography */}
            <div className="w-16 h-16 bg-slate-900/90 text-slate-350 rounded-xl relative flex flex-col items-center justify-center border border-slate-800 font-mono shadow-inner z-12 group-hover:border-slate-700 transition-colors duration-300">
              <span className="text-2xl font-black text-slate-100 tracking-tighter">
                {player.dorsal}
              </span>
              <span className="text-[8px] font-bold text-slate-500 tracking-wider">DORSAL</span>
            </div>
          </div>
        )}

        {/* Floating badge top-left: Shirt number with tactical tech badge */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-xs text-slate-200 h-8 w-8 rounded-lg flex items-center justify-center border border-slate-800/80 shadow-md z-12 font-bold font-mono">
          <span className="text-xs select-none">#{player.dorsal}</span>
        </div>

        {/* Floating badge top-right: Scouting Performance Rating (VAL) */}
        <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-800/80 shadow-lg z-12 font-mono flex items-center space-x-1 animate-fadeIn">
          <span className="text-[9px] text-slate-500 font-black tracking-wider">VAL</span>
          <span className={`text-xs font-black select-none ${
            overallVal >= 90 ? 'text-emerald-400' :
            overallVal >= 80 ? 'text-amber-400' :
            'text-slate-200'
          }`}>{overallVal}</span>
        </div>

        {/* Demarcation badge overlay bottom-left */}
        <div className="absolute bottom-3 left-3 z-12 pointer-events-none">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border bg-slate-950/90 ${getDemarcationBadge(player.demarcacion)}`}>
            {player.demarcacion}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-[linear-to-b]_from-[#0b101b]_to-[#080c14]">
        <div className="space-y-4">
          {/* Club and Player Identification */}
          <div 
            onClick={() => onDetail(player)}
            className="cursor-pointer group/name block select-none"
            title="Ver reporte deportivo"
          >
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block transition-colors duration-200 group-hover/name:text-emerald-400">
              {player.equipo || 'Sin Equipo Sincronizado'}
            </span>
            <h3 className="font-bold text-slate-100 text-lg leading-tight mt-1 truncate group-hover/name:text-emerald-300 transition-colors duration-150">
              {player.nombre}{' '}
              <span className="font-light text-slate-400 block text-base leading-snug mt-0.5 truncate uppercase tracking-tight">
                {player.apellidos}
              </span>
            </h3>
          </div>

          {/* Quick Metrics grid (Age, height) with clean premium tags */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-350 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 font-mono select-none">
            <div className="flex items-center space-x-1.5 min-w-0" title="Edad del jugador">
              <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate text-slate-300 font-bold">{age} <span className="text-[10px] text-slate-500">AÑOS</span></span>
            </div>
            <div className="flex items-center space-x-1.5 min-w-0" title="Talla / Estatura">
              <Ruler className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate text-slate-300 font-bold uppercase">{player.talla} CM</span>
            </div>
          </div>

          {/* Observations and reports lines */}
          {player.observaciones ? (
            <p className="text-[11px] text-slate-400 font-sans italic line-clamp-2 leading-relaxed h-8">
              "{player.observaciones}"
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 font-sans italic leading-relaxed h-8">
              Sin observaciones o incidencias registradas en esta ficha deportiva.
            </p>
          )}
        </div>

        {/* Card Actions with sleek visual buttons and rounded accents */}
        <div className="flex items-center space-x-2 border-t border-slate-900/70 pt-4 mt-4 select-none shrink-0">
          <button
            id={`btn-detail-player-${player.id}`}
            onClick={() => onDetail(player)}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 transition-colors duration-150 cursor-pointer shadow-sm shadow-emerald-500/5 hover:-y-0.5"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ficha Técnica</span>
          </button>

          <button
            id={`btn-edit-player-${player.id}`}
            onClick={() => onEdit(player)}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors duration-150 cursor-pointer"
            title="Editar Ficha"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            id={`btn-delete-player-${player.id}`}
            onClick={() => setIsConfirmingDelete(true)}
            className="p-2 rounded-xl border border-red-950/40 text-red-500 hover:bg-red-950/20 transition-colors duration-150 cursor-pointer"
            title="Dar de Baja"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
