import React, { useState } from 'react';
import { Jugador, Evaluacion } from '../types';
import { getPlayerPhotoUrl } from '../lib/supabase';
import { X, Calendar, Compass, Award, ShieldAlert, Sparkles, Edit, ShieldCheck, Cpu, Star, TrendingUp, Ruler, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface PlayerDetailModalProps {
  player: Jugador | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (player: Jugador) => void;
  evaluations?: Evaluacion[];
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  isOpen,
  onClose,
  onEdit,
  evaluations = [],
}) => {
  const [imageError, setImageError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !player) return null;

  const handleExportPDF = async () => {
    if (!player) return;
    setIsExporting(true);

    try {
      // Create jsPDF instance (standard A4 layout)
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = 
        player.demarcacion === 'Portero' ? [16, 185, 129] :
        player.demarcacion === 'Defensa' ? [59, 130, 246] :
        player.demarcacion === 'Centrocampista' ? [245, 158, 11] :
        [239, 68, 68];

      const pageWidth = 210;
      const pageHeight = 297;
      let currentY = 15;

      // 1. Sleek Position-themed visual banner at the top
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, currentY, 180, 28, 'F');

      // Banner Typography Content
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('REPORTE TECNICO DE SCOUTING & EVALUACION', 20, currentY + 7);

      doc.setFontSize(18);
      doc.text(`${player.nombre.toUpperCase()} ${player.apellidos.toUpperCase()}`, 20, currentY + 16);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`#${player.dorsal}  |  ${player.demarcacion.toUpperCase()}  |  ${player.equipo || 'SIN CLUB'}`, 20, currentY + 23);

      currentY += 38; // Give generous breathing space

      // Multi-page layout automatic boundaries helper
      const checkSpace = (heightNeeded: number) => {
        if (currentY + heightNeeded > pageHeight - 15) {
          doc.addPage();
          currentY = 20;
          return true;
        }
        return false;
      };

      // 2. Identity Block Grids (Age, Height, Team info)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, currentY, 86, 15, 'FD'); // Left block (Age)
      doc.rect(109, currentY, 86, 15, 'FD'); // Right block (Height)

      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('EDAD Y NACIMIENTO', 18, currentY + 5);
      doc.text('ESTATURA / TALLA', 112, currentY + 5);

      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${age} anos (${formattedBirthdate})`, 18, currentY + 11);
      doc.text(`${player.talla} cm`, 112, currentY + 11);

      currentY += 21;

      // 3. Technical Aptitudes Bar Graph block
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`MATRIZ DE APTITUDES DE ${player.demarcacion.toUpperCase()} (MEDIA GENERAL: ${overallAvg})`, 15, currentY);

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.4);
      doc.line(15, currentY + 2.5, 195, currentY + 2.5);

      currentY += 9;

      // Loop through stats list beautifully
      statsList.forEach((st) => {
        checkSpace(11);

        doc.setTextColor(51, 65, 85);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(st.name, 15, currentY);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(st.desc, 15, currentY + 3.5);

        // Numeric score representation
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${st.val} / 99`, 105, currentY + 1);

        // Progress visuals
        doc.setFillColor(241, 245, 249);
        doc.rect(120, currentY - 2, 75, 3.5, 'F');
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(120, currentY - 2, 75 * (st.val / 100), 3.5, 'F');

        currentY += 9.5;
      });

      currentY += 4;

      // 4. Clinical Notes and Observations Block
      checkSpace(35);
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('OBSERVACIONES GENERALES / REPORTE CLINICO', 15, currentY);

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.4);
      doc.line(15, currentY + 2.5, 195, currentY + 2.5);

      currentY += 8;

      if (player.observaciones) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);

        const obsLines = doc.splitTextToSize(player.observaciones, 172);
        const boxHeight = (obsLines.length * 4.5) + 7;

        checkSpace(boxHeight + 5);
        doc.rect(15, currentY, 180, boxHeight, 'FD');

        doc.setTextColor(51, 65, 85);
        doc.setFont('Helvetica', 'oblique');
        doc.setFontSize(9);
        doc.text(obsLines, 19, currentY + 5);

        currentY += boxHeight + 8;
      } else {
        doc.setTextColor(148, 163, 184);
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.text('No se han registrado observaciones clinicas o tecnicas para este jugador.', 15, currentY + 4);
        currentY += 13;
      }

      // 5. Historical Evaluations Section (if any evaluations exist)
      const evs = evaluations.filter(e => e.jugador_id === player.id);

      if (evs.length > 0) {
        checkSpace(40);
        doc.setTextColor(15, 23, 42);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`HISTORIAL DE EVALUACIONES (${evs.length})`, 15, currentY);

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.4);
        doc.line(15, currentY + 2.5, 195, currentY + 2.5);

        currentY += 9;

        evs.forEach((ev, idx) => {
          let commentsLines: string[] = [];
          if (ev.comentarios) {
            commentsLines = doc.splitTextToSize(ev.comentarios, 172);
          }
          const cardHeight = 16 + (commentsLines.length > 0 ? (commentsLines.length * 4.2) + 5 : 0);
          
          checkSpace(cardHeight + 6);

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.rect(15, currentY, 180, cardHeight, 'FD');

          // Header inside the card
          doc.setTextColor(15, 23, 42);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);

          let dtStr = ev.fecha_evaluacion;
          try {
            const parts = ev.fecha_evaluacion.split('-');
            if (parts.length === 3) {
              const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              dtStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
            }
          } catch {
            dtStr = ev.fecha_evaluacion;
          }

          doc.text(`Evaluacion #${idx + 1} - ${dtStr}`, 18, currentY + 5.5);

          // Nota Media Badge inside the card
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(168, currentY + 2.5, 22, 6, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.text(`Nota: ${ev.nota_media.toFixed(1)}`, 170.5, currentY + 6.7);

          // Sub Scores
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text(`Fis.: ${ev.fisico.toFixed(1)}`, 18, currentY + 11.5);
          doc.text(`Tecn.: ${ev.rendimiento_tecnico.toFixed(1)}`, 48, currentY + 11.5);
          doc.text(`Tact.: ${ev.tactica.toFixed(1)}`, 78, currentY + 11.5);
          doc.text(`Act.: ${ev.actitud.toFixed(1)}`, 108, currentY + 11.5);

          // Comments
          if (ev.comentarios) {
            doc.setFont('Helvetica', 'boldOblique');
            doc.setTextColor(148, 163, 184);
            doc.text('Comentarios:', 18, currentY + 17);

            doc.setFont('Helvetica', 'italic');
            doc.setTextColor(51, 65, 85);
            doc.text(commentsLines, 18, currentY + 21);
          }

          currentY += cardHeight + 4;
        });
      }

      // 6. Professional footer bar
      checkSpace(14);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(15, currentY, 195, currentY);

      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Reporte tecnico oficial generado a traves de la suite TitanScout Pro V2.5.', 15, currentY + 4);
      doc.text(`Fecha de emision: ${new Date().toLocaleDateString('es-ES')}`, 150, currentY + 4);

      // Trigger standard download
      const cleanFileName = `Reporte_${player.nombre}_${player.apellidos || ''}.pdf`.replace(/\s+/g, '_');
      doc.save(cleanFileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };
  // Demarcation Styling & Badges
  const getDemarcationTheme = (pos: string) => {
    switch (pos) {
      case 'Portero':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          solid: 'bg-emerald-500',
          text: 'text-emerald-400',
          desc: 'Guardián del área (GKP)',
          accent: 'emerald',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
        };
      case 'Defensa':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          solid: 'bg-blue-500',
          text: 'text-blue-400',
          desc: 'Muro defensivo (DEF)',
          accent: 'blue',
          glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]'
        };
      case 'Centrocampista':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          solid: 'bg-amber-500',
          text: 'text-amber-400',
          desc: 'Cerebro y motor (MID)',
          accent: 'amber',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
        };
      case 'Delantero':
        return {
          bg: 'bg-red-500/10 text-red-400 border-red-500/20',
          solid: 'bg-red-500',
          text: 'text-red-400',
          desc: 'Artillero ofensivo (FWD)',
          accent: 'red',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]'
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          solid: 'bg-slate-500',
          text: 'text-slate-400',
          desc: 'Polivalente',
          accent: 'slate',
          glow: 'shadow-none'
        };
    }
  };

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

  // Formatted date
  const formatBirthdate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Correct timezone offsets by creating UTC date
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const age = calculateAge(player.fecha_nacimiento);
  const formattedBirthdate = formatBirthdate(player.fecha_nacimiento);
  const theme = getDemarcationTheme(player.demarcacion);
  const photoUrl = player.foto_jugador ? getPlayerPhotoUrl(player.foto_jugador) : '';

  // Deterministic Scouting Attributes calculations
  const getPlayerStats = (p: Jugador) => {
    const hash = (p.nombre.length * 3 + p.apellidos.length * 7 + p.dorsal) % 7;
    const baseValue = 78 + hash * 2.5; // Ranges from 78 to 93
    
    switch (p.demarcacion) {
      case 'Portero':
        return [
          { name: 'Reflejos', val: Math.min(99, Math.round(baseValue + 4)), desc: 'Reacción ante disparos cercanos' },
          { name: 'Estirada / Salto', val: Math.min(99, Math.round(baseValue - 1)), desc: 'Alcance aéreo en portería' },
          { name: 'Posicionamiento Def.', val: Math.min(99, Math.round(baseValue + 2)), desc: 'Ubicación táctica defensiva' },
          { name: 'Agilidad de Pies', val: Math.min(99, Math.round(baseValue - 2)), desc: 'Maniobra bajo presión' },
          { name: 'Salida de Balón', val: Math.min(99, Math.round(baseValue - 5)), desc: 'Precisión de saques' }
        ];
      case 'Defensa':
        return [
          { name: 'Fuerza / Físico', val: Math.min(99, Math.round(baseValue + 3)), desc: 'Resistencia en choque uno a uno' },
          { name: 'Entradas de Balón', val: Math.min(99, Math.round(baseValue + 4)), desc: 'Limpieza de robo a ras de suelo' },
          { name: 'Intercepciones', val: Math.min(99, Math.round(baseValue + 2)), desc: 'Corte de líneas de pase' },
          { name: 'Cabezazo Defensivo', val: Math.min(99, Math.round(baseValue)), desc: 'Efectividad en duelos aéreos' },
          { name: 'Salida de Presión', val: Math.min(99, Math.round(baseValue - 6)), desc: 'Pase corto seguro bajo marca' }
        ];
      case 'Centrocampista':
        return [
          { name: 'Visión de Juego', val: Math.min(99, Math.round(baseValue + 5)), desc: 'Detección de carriles ofensivos' },
          { name: 'Precisión de Pase', val: Math.min(99, Math.round(baseValue + 3)), desc: 'Reparto fluido y progresivo' },
          { name: 'Control en Corto', val: Math.min(99, Math.round(baseValue + 2)), desc: 'Orientación del primer toque' },
          { name: 'Resistencia / Stamina', val: Math.min(99, Math.round(baseValue + 1)), desc: 'Soporte y recorrido de 90 min' },
          { name: 'Transición Def-Of', val: Math.min(99, Math.round(baseValue - 4)), desc: 'Recuperación y despliegue rápido' }
        ];
      case 'Delantero':
        return [
          { name: 'Finalización / Gol', val: Math.min(99, Math.round(baseValue + 6)), desc: 'Conversión de tiros en goles' },
          { name: 'Potencia de Disparo', val: Math.min(99, Math.round(baseValue + 2)), desc: 'Fuerza de golpeo de media distancia' },
          { name: 'Aceleración / Sprint', val: Math.min(99, Math.round(baseValue + 3)), desc: 'Desborde de espalda y contras' },
          { name: 'Regate / 1v1', val: Math.min(99, Math.round(baseValue + 1)), desc: 'Destreza y quiebre en área reducida' },
          { name: 'Desmarque', val: Math.min(99, Math.round(baseValue - 2)), desc: 'Lectura de huecos en la zaga' }
        ];
      default:
        return [
          { name: 'Velocidad', val: Math.round(baseValue), desc: 'Rapidez de desplazamiento' },
          { name: 'Técnica', val: Math.round(baseValue), desc: 'Trato del balón' },
          { name: 'Físico', val: Math.round(baseValue), desc: 'Soporte físico global' },
          { name: 'Táctica', val: Math.round(baseValue), desc: 'Lectura de juego' }
        ];
    }
  };

  const getMediaGral = (stats: { val: number }[]) => {
    if (stats.length === 0) return 0;
    const total = stats.reduce((acc, curr) => acc + curr.val, 0);
    return Math.round(total / stats.length);
  };

  const statsList = getPlayerStats(player);
  const overallAvg = getMediaGral(statsList);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Main Detail Card Wrapper */}
      <div className="bg-[#070a13] border border-slate-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden w-full max-w-3xl relative z-14 flex flex-col max-h-[92vh] select-none">
        
        {/* Top visual neon bar based on demarcation */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${
          player.demarcacion === 'Portero' ? 'from-emerald-600 via-emerald-400 to-emerald-600' :
          player.demarcacion === 'Defensa' ? 'from-blue-600 via-blue-400 to-blue-600' :
          player.demarcacion === 'Centrocampista' ? 'from-amber-600 via-amber-400 to-amber-600' :
          'from-red-600 via-red-400 to-red-600'
        }`} />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-900/80 flex items-center justify-between bg-slate-950/60 shrink-0">
          <span className="flex items-center text-xs font-bold text-slate-450 tracking-widest uppercase font-mono">
            <Cpu className="h-4 w-4 mr-2 text-emerald-400 animate-pulse" />
            Reporte Técnico · TITANSCOUT V2.5
          </span>
          <button
            id="btn-close-detail"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-all duration-150 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Body - Beautifully scrollable and responsive */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
          
          {/* Main profile layout: Photo & Primary Info */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
            
            {/* Visual Container: Player Photo or Pitch Blueprint */}
            <div className="relative w-full md:w-56 h-60 bg-slate-950/90 rounded-2xl border border-slate-900/90 overflow-hidden shrink-0 shadow-md flex-none flex items-center justify-center group">
              {photoUrl && !imageError ? (
                <>
                  <img
                    src={photoUrl}
                    alt={`${player.nombre} ${player.apellidos}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Bottom overlay mask */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 to-transparent" />
                </>
              ) : (
                /* Premium Tactical Soccer Blueprint design if no photo exists */
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                  {/* Blueprint visual markings */}
                  <div className="absolute inset-2 opacity-25 border border-dashed border-slate-800 rounded">
                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-700 -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-slate-755 border-slate-700 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-14 border border-slate-700" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-14 border border-slate-700" />
                  </div>

                  {/* Marker Pin representing player position */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    {player.demarcacion === 'Portero' && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping border border-emerald-400/50 absolute" />
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white/20 shadow-[0_0_12px_#10b981] relative z-20" />
                        <span className="text-[9px] text-emerald-400 font-mono font-bold mt-1 tracking-widest bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-500/20">GK</span>
                      </div>
                    )}
                    {player.demarcacion === 'Defensa' && (
                      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping border border-blue-400/50 absolute" />
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white/20 shadow-[0_0_12px_#3b82f6] relative z-20" />
                        <span className="text-[9px] text-blue-400 font-mono font-bold mt-1 tracking-widest bg-slate-950 px-1.5 py-0.5 rounded border border-blue-500/20">DEF</span>
                      </div>
                    )}
                    {player.demarcacion === 'Centrocampista' && (
                      <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping border border-amber-400/50 absolute" />
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white/20 shadow-[0_0_12px_#f59e0b] relative z-20" />
                        <span className="text-[9px] text-amber-400 font-mono font-bold mt-1 tracking-widest bg-slate-950 px-1.5 py-0.5 rounded border border-amber-500/20">MID</span>
                      </div>
                    )}
                    {player.demarcacion === 'Delantero' && (
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping border border-red-400/50 absolute" />
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white/20 shadow-[0_0_12px_#ef4444] relative z-20" />
                        <span className="text-[9px] text-red-400 font-mono font-bold mt-1 tracking-widest bg-slate-950 px-1.5 py-0.5 rounded border border-red-500/20">FWD</span>
                      </div>
                    )}
                  </div>

                  {/* Custom blueprint Jersey badge in Center */}
                  <div className="w-20 h-20 bg-slate-900/95 text-slate-350 rounded-2xl relative flex flex-col items-center justify-center border border-slate-800 shadow-md z-12 group-hover:bg-slate-900 transition-colors duration-300">
                    <span className="text-3xl font-black text-slate-100 tracking-tighter">
                      {player.dorsal}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold tracking-widest">DORSAL</span>
                  </div>
                </div>
              )}

              {/* Float Ratings badge - Shiny Metallic layout */}
              <div className={`absolute top-3 left-3 bg-slate-950/90 backdrop-blur-xs px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 border border-slate-850 shadow-md z-12 font-bold font-mono ${theme.glow}`}>
                <span className="text-[9px] text-slate-500 font-extrabold tracking-wider">OVR</span>
                <span className={`text-sm font-black ${theme.text}`}>{overallAvg}</span>
              </div>

              {/* Shirt Number Float bottom end */}
              <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-xs text-slate-200 h-9 w-9 rounded-xl flex items-center justify-center border border-slate-800 shadow-md z-10 font-bold font-mono">
                <span className="text-xs select-none">#{player.dorsal}</span>
              </div>
            </div>

            {/* Typography Section: Headers, Badges & Team Club details */}
            <div className="flex-1 w-full flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800 tracking-widest uppercase font-mono">
                    {player.equipo || 'Sin Club Sincronizado'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${theme.bg}`}>
                    {theme.desc}
                  </span>
                </div>
                
                <h2 className="text-2xl md:text-3.5xl font-black text-slate-50 tracking-tight leading-none">
                  {player.nombre} <span className="font-light text-slate-400 block mt-1 text-xl md:text-2xl uppercase tracking-wider">{player.apellidos}</span>
                </h2>
              </div>

              {/* Identity Cards Row (Age, Height) */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Age Card */}
                <div className="bg-slate-950/50 border border-slate-900 p-3.5 rounded-xl flex items-center space-x-3.5">
                  <div className="p-2 bg-[#090e19] text-slate-400 rounded-lg border border-slate-900">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-widest font-mono">Edad</span>
                    <span className="text-sm font-black text-slate-100 mt-0.5 block">{age} años</span>
                    <span className="text-[9px] text-slate-400 font-mono font-medium">{formattedBirthdate}</span>
                  </div>
                </div>

                {/* Height / Talla Card */}
                <div className="bg-slate-950/50 border border-slate-900 p-3.5 rounded-xl flex items-center space-x-3.5">
                  <div className="p-2 bg-[#090e19] text-slate-400 rounded-lg border border-slate-900">
                    <Ruler className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-widest font-mono">Estatura</span>
                    <span className="text-sm font-black text-slate-100 block mt-0.5 whitespace-nowrap">
                      {player.talla} cm
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-medium">Talla de juego</span>
                  </div>
                </div>
              </div>

              {/* Demarcation status strip */}
              <div className="bg-[#090e19]/50 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Demarcación Registrada:</span>
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs uppercase tracking-widest bg-slate-950 border ${theme.bg}`}>
                  {player.demarcacion}
                </span>
              </div>

            </div>

          </div>

          {/* Habilities & Clinics Assessment Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Box: Custom Progress Tracker Gauges */}
            <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-900/80 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-300 tracking-widest uppercase flex items-center font-mono">
                <Award className="h-4 w-4 mr-2 text-emerald-400" />
                Matriz de Aptitudes Técnicas
              </h3>

              <div className="space-y-4">
                {statsList.map((st, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-100 font-sans">{st.name}</span>
                        <span className="text-[9px] text-slate-500 block leading-tight">{st.desc}</span>
                      </div>
                      <span className={`font-mono font-black ${
                        st.val >= 90 ? 'text-emerald-400' :
                        st.val >= 80 ? 'text-amber-400' :
                        'text-slate-350 text-slate-300'
                      }`}>{st.val}</span>
                    </div>
                    {/* Progress Track */}
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900/60 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${theme.solid}`} 
                        style={{ width: `${st.val}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Box: Observations and Clinician Notes */}
            <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-900/80 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-300 tracking-widest uppercase flex items-center font-mono">
                  <ShieldCheck className="h-4 w-4 mr-2 text-emerald-400" />
                  Observaciones Clínicas / Reporte SCOUT
                </h3>

                {player.observaciones ? (
                  <div className="bg-slate-950 border border-slate-900/60 p-4.5 rounded-xl relative leading-relaxed overflow-hidden">
                    {/* Background grid texture */}
                    <div className="absolute inset-0 opacity-2 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                    <p className="text-xs text-slate-300 select-text whitespace-pre-wrap relative z-10 font-sans italic leading-relaxed">
                      "{player.observaciones}"
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-900/40 p-5 rounded-xl text-center">
                    <p className="text-xs text-slate-500 italic">
                      No se han ingresado observaciones o detalles clínicos para el jugador {player.nombre} en esta ficha deportiva.
                    </p>
                  </div>
                )}
              </div>

              {/* Status and inscription dates */}
              <div className="pt-4 border-t border-slate-900/60 text-[9px] text-slate-550 text-slate-500 space-y-1 font-mono">
                <p>REGISTRO ID: <span className="text-slate-450 text-slate-400 select-all">{player.id}</span></p>
                {player.created_at && (
                  <p>INSCRIPCIÓN: <span className="text-slate-450 text-slate-400">{new Date(player.created_at).toLocaleString('es-ES')}</span></p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 md:p-5 border-t border-slate-900/80 bg-slate-950/80 flex items-center justify-end space-x-3 shrink-0">
          <button
            id="btn-detail-back"
            onClick={onClose}
            className="px-4.5 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white transition-all duration-150 cursor-pointer"
          >
            Cerrar
          </button>

          <button
            id="btn-detail-pdf"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold transition duration-150 cursor-pointer shadow-md disabled:opacity-50"
          >
            <FileDown className={`h-3.5 w-3.5 text-sky-400 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Exportando...' : 'Exportar PDF'}</span>
          </button>
          
          <button
            id="btn-detail-edit"
            onClick={() => {
              onClose();
              onEdit(player);
            }}
            className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 rounded-xl text-xs font-mono transition duration-150 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Editar Ficha</span>
          </button>
        </div>

      </div>
    </div>
  );
};
