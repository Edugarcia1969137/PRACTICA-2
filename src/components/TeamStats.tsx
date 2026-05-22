import React from 'react';
import { Jugador } from '../types';
import { 
  Users, 
  Sparkles, 
  Ruler, 
  Calendar,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface TeamStatsProps {
  players: Jugador[];
}

export const TeamStats: React.FC<TeamStatsProps> = ({ players }) => {
  const totalPlayers = players.length;

  // Calculate age from birthdate
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

  const ages = players.map(p => calculateAge(p.fecha_nacimiento)).filter(age => age > 0);
  const averageAge = ages.length > 0 
    ? (ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1) 
    : '0';

  // Compute heights metrics (talla)
  const tallas = players.map(p => p.talla || 175).filter(t => t > 0);
  const averageTalla = tallas.length > 0
    ? (tallas.reduce((sum, t) => sum + t, 0) / tallas.length).toFixed(1)
    : '0';
  const maxTalla = tallas.length > 0 ? Math.max(...tallas) : 0;

  // Count tallas brackets (160-170, 171-180, 181-190)
  const countShort = tallas.filter(t => t >= 160 && t <= 170).length;
  const countMedium = tallas.filter(t => t >= 171 && t <= 180).length;
  const countTall = tallas.filter(t => t >= 181 && t <= 190).length;

  // Count demarcations
  const demarcationsCount = players.reduce((acc, p) => {
    acc[p.demarcacion] = (acc[p.demarcacion] || 0) + 1;
    return acc;
  }, { Portero: 0, Defensa: 0, Centrocampista: 0, Delantero: 0 } as Record<string, number>);

  // Data for Recharts BarChart (positions)
  const positionData = [
    { name: 'Porteros', cantidad: demarcationsCount.Portero, fill: '#10b981' }, // Emerald
    { name: 'Defensas', cantidad: demarcationsCount.Defensa, fill: '#3b82f6' }, // Blue
    { name: 'Centrocampistas', cantidad: demarcationsCount.Centrocampista, fill: '#f59e0b' }, // Amber
    { name: 'Delanteros', cantidad: demarcationsCount.Delantero, fill: '#ef4444' } // Red
  ];

  // Data for Recharts PieChart (talla intervals)
  const heightData = [
    { name: '160 - 170 cm', value: countShort, color: '#ec4899' }, // Pink
    { name: '171 - 180 cm', value: countMedium, color: '#14b8a6' }, // Teal
    { name: '181 - 190 cm', value: countTall, color: '#6366f1' } // Indigo
  ];

  return (
    <div className="space-y-6">
      {/* Cards Metricas Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Plantilla */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/25">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Total Plantilla</span>
            <span className="text-2xl font-black text-slate-100 block mt-0.5">{totalPlayers}</span>
            <span className="text-[10px] text-slate-400 block font-medium">Jugadores activos</span>
          </div>
        </div>

        {/* Edad Promedio */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Edad Promedio</span>
            <span className="text-2xl font-black text-slate-100 block mt-0.5">{averageAge}</span>
            <span className="text-[10px] text-slate-400 block font-medium">Años de media</span>
          </div>
        </div>

        {/* Estatura Media */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Ruler className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Estatura Media</span>
            <span className="text-2xl font-black text-slate-100 block mt-0.5">{averageTalla} <span className="text-xs text-slate-400 font-normal">cm</span></span>
            <span className="text-[10px] text-slate-400 block font-medium">Media de plantilla</span>
          </div>
        </div>

        {/* Estatura Máxima */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Estatura Max</span>
            <span className="text-2xl font-black text-slate-100 block mt-0.5">{maxTalla} <span className="text-xs text-slate-400 font-normal">cm</span></span>
            <span className="text-[10px] text-slate-400 block font-medium">Límite superior</span>
          </div>
        </div>
      </div>

      {/* Visualizaciones en fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Demarcación */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-900 shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-4.5 w-4.5 text-emerald-400" />
            <span className="font-bold text-slate-200 text-xs tracking-wider uppercase">Distribución por Demarcación</span>
          </div>
          
          <div className="h-64 w-full">
            {totalPlayers === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">
                Sin datos suficientes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }}
                    labelStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                  />
                  <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                    {positionData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Distribución por Tallas */}
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-900 shadow-md flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-1/2 space-y-4">
            <div className="flex items-center space-x-2">
              <Ruler className="h-4.5 w-4.5 text-emerald-400" />
              <span className="font-bold text-slate-200 text-xs tracking-wider uppercase">Frecuencia de Tallas</span>
            </div>
            
            <div className="space-y-3 pt-2">
              {heightData.map((item, idx) => {
                const percent = totalPlayers > 0 ? ((item.value / totalPlayers) * 100).toFixed(0) : '0';
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                       <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-xs font-medium text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200">{item.value} ({percent}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full md:w-1/2 h-52 flex items-center justify-center relative mt-4 md:mt-0">
            {totalPlayers === 0 ? (
              <div className="text-slate-500 text-xs font-medium">Sin datos de estatura</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={heightData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {heightData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }}
                      itemStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-150 text-slate-100">{totalPlayers}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Jugadores</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
