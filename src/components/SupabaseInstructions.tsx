import React, { useState } from 'react';
import { Database, Key, CheckCircle, AlertTriangle, Copy, Check, FileCode, Github, ExternalLink } from 'lucide-react';

interface SupabaseInstructionsProps {
  isConfigured: boolean;
}

export const SupabaseInstructions: React.FC<SupabaseInstructionsProps> = ({ isConfigured }) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const sqlCode = `-- SQL para crear la tabla 'jugadores' en Supabase

-- 1. Crear la tabla 'jugadores'
CREATE TABLE IF NOT EXISTS public.jugadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    dorsal INTEGER NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    demarcacion VARCHAR(50) NOT NULL CHECK (demarcacion IN ('Portero', 'Defensa', 'Centrocampista', 'Delantero')),
    talla INTEGER NOT NULL CHECK (talla >= 160 AND talla <= 190),
    equipo VARCHAR(100) NOT NULL,
    foto_jugador TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas de acceso para jugadores
-- Permitir lectura pública a cualquiera
CREATE POLICY "Permitir lectura pública de jugadores" 
ON public.jugadores FOR SELECT 
USING (true);

-- Permitir inserción/actualización/borrado solo a usuarios autenticados
CREATE POLICY "Permitir inserción a usuarios autenticados" 
ON public.jugadores FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON public.jugadores FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
ON public.jugadores FOR DELETE 
USING (auth.role() = 'authenticated');

-- 3. Crear el bucket 'jugadores' en Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('jugadores', 'jugadores', true)
ON CONFLICT (id) DO NOTHING;

-- políticas para el bucket de storage 'jugadores'
CREATE POLICY "Imágenes públicas para cualquiera" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'jugadores');

CREATE POLICY "Subida de imágenes para autenticados" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'jugadores' AND auth.role() = 'authenticated');

CREATE POLICY "Modificación de imágenes de autenticados" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'jugadores' AND auth.role() = 'authenticated');

CREATE POLICY "Eliminación de imágenes de autenticados" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'jugadores' AND auth.role() = 'authenticated');

-- 4. Crear la tabla de 'evaluaciones'
CREATE TABLE IF NOT EXISTS public.evaluaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jugador_id UUID NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
    rendimiento_tecnico INTEGER NOT NULL CHECK (rendimiento_tecnico >= 1 AND rendimiento_tecnico <= 10),
    tactica INTEGER NOT NULL CHECK (tactica >= 1 AND tactica <= 10),
    fisico INTEGER NOT NULL CHECK (fisico >= 1 AND fisico <= 10),
    actitud INTEGER NOT NULL CHECK (actitud >= 1 AND actitud <= 10),
    nota_media NUMERIC(4,2) NOT NULL CHECK (nota_media >= 1.00 AND nota_media <= 10.00),
    comentarios TEXT,
    fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para evaluaciones
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para evaluaciones
CREATE POLICY "Permitir lectura pública de evaluaciones" 
ON public.evaluaciones FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserción de evaluaciones a autenticados" 
ON public.evaluaciones FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización de evaluaciones a autenticados" 
ON public.evaluaciones FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminación de evaluaciones a autenticados" 
ON public.evaluaciones FOR DELETE 
USING (auth.role() = 'authenticated');`;

  const envCode = `VITE_SUPABASE_URL="TU_URL_DE_SUPABASE"
VITE_SUPABASE_ANON_KEY="TU_ANON_KEY_DE_SUPABASE"`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envCode);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="bg-slate-900/40 rounded-2xl shadow-md border border-slate-900/80 overflow-hidden text-slate-300">
      {/* Estado Conexión */}
      <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isConfigured ? 'bg-emerald-950/20 border-emerald-950/30' : 'bg-amber-950/20 border-amber-950/30'}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${isConfigured ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}`}>
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Estado de Base de Datos</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {isConfigured 
                ? 'Conectado de forma activa a tu base de datos de Supabase.' 
                : 'Ejecutando en Modo Sandbox local (los datos se persistirán en tu navegador).'}
            </p>
          </div>
        </div>

        <span className={`inline-flex items-center self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${
          isConfigured 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {isConfigured ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Supabase Activo
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Sandbox Local
            </>
          )}
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Supabase Paso a Paso */}
        <div>
          <h4 className="flex items-center font-bold text-slate-100 mb-3 text-xs tracking-wider uppercase">
            <Key className="w-4 h-4 mr-2 text-emerald-400" />
            Vincular tu base de datos Supabase
          </h4>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Para almacenar de forma permanente los jugadores, las fotos subidas y permitir un login de equipo auténtico, sigue estos sencillos pasos:
          </p>

          <ol className="space-y-4 text-sm text-slate-400">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 font-mono text-xs font-bold text-slate-400 border border-slate-800">1</span>
              <div>
                <p className="font-semibold text-slate-200">Crea un proyecto en Supabase</p>
                <p className="text-xs text-slate-500 mt-0.5">Regístrate en <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center underline">supabase.com <ExternalLink className="w-3 h-3 ml-0.5" /></a> y crea un proyecto nuevo.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 font-mono text-xs font-bold text-slate-400 border border-slate-800">2</span>
              <div>
                <p className="font-semibold text-slate-200">Ejecuta el script SQL</p>
                <p className="text-xs text-slate-500 mt-0.5">Ve al menú <strong>SQL Editor</strong> en Supabase, crea una nueva consulta, pega el siguiente bloque SQL y haz clic en <strong>RUN</strong>.</p>
                
                <div className="mt-2.5 relative">
                  <div className="flex items-center justify-between text-xs bg-slate-950 text-slate-400 py-1.5 px-3 rounded-t-lg font-mono border border-b-0 border-slate-850">
                    <span>tabla_jugadores_y_storage.sql</span>
                    <button 
                      onClick={handleCopySql} 
                      className="flex items-center text-slate-400 hover:text-white transition-colors duration-150 cursor-pointer"
                      id="btn-copy-sql"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          <span>Copiar SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs bg-slate-950/80 text-emerald-300/80 p-3 rounded-b-lg overflow-x-auto max-h-48 font-mono border border-slate-850">
                    {sqlCode}
                  </pre>
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 font-mono text-xs font-bold text-slate-400 border border-slate-800">3</span>
              <div>
                <p className="font-semibold text-slate-200">Configura tus variables de entorno en AI Studio</p>
                <p className="text-xs text-slate-500 mt-0.5">Ve al menú de <strong>Secrets</strong> de Google AI Studio y añade las siguientes claves o crea tu archivo <code>.env</code> si exportas el proyecto:</p>
                
                <div className="mt-2.5 relative">
                  <div className="flex items-center justify-between text-xs bg-slate-950 text-slate-400 py-1.5 px-3 rounded-t-lg font-mono border border-b-0 border-slate-850">
                    <span>Variables de Entorno .env</span>
                    <button 
                      onClick={handleCopyEnv} 
                      className="flex items-center text-slate-400 hover:text-white transition-colors duration-150 cursor-pointer"
                      id="btn-copy-env"
                    >
                      {copiedEnv ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs bg-slate-950/80 text-emerald-300/80 p-3 rounded-b-lg overflow-x-auto font-mono border border-slate-850">
                    {envCode}
                  </pre>
                </div>
              </div>
            </li>
          </ol>
        </div>

        {/* GitHub & Vercel Prep */}
        <div className="border-t border-slate-800/80 pt-6">
          <h4 className="flex items-center font-bold text-slate-100 mb-3 text-xs tracking-wider uppercase">
            <Github className="w-4 h-4 mr-2 text-emerald-400" />
            Despliegue en GitHub y Vercel
          </h4>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            La estructura del proyecto está completamente optimizada para subir el código a un repositorio y desplegarlo en producción:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-905 border-slate-900/80 text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-200 block mb-1">Pasos para GitHub</span>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Ejecuta <code className="text-emerald-405 text-emerald-400">git init</code> en la carpeta de tu ordenador.</li>
                <li>Crea un repositorio en GitHub libre y vincúlalo.</li>
                <li>Añade tus archivos, haz commit y empuja hacia la rama <code>main</code>.</li>
                <li>La carpeta tiene ya configurado el <code>.gitignore</code> para ignorar credenciales privadas.</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-905 border-slate-900/80 text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-200 block mb-1">Pasos para Vercel</span>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Ve a <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-450 text-emerald-400 underline">vercel.com</a> e importa tu repositorio.</li>
                <li>En <strong>Environment Variables</strong> añade tus variables de Supabase (las mismas del paso 3).</li>
                <li>Presiona <strong>Deploy</strong> y la app estará lista y completamente sincronizada con tu base de datos en minutos.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
