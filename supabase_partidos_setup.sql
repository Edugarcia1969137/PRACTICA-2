-- SQL para crear las tablas del módulo "PARTIDOS" (Rivales, Informes, Planes de Partido y Eventos en Directo) en Supabase

-- 1. Tabla de Equipos Rivales
CREATE TABLE IF NOT EXISTS public.equipos_rivales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    escudo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexar el nombre para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_equipos_rivales_nombre ON public.equipos_rivales(nombre);


-- 2. Tabla de Informes Tácticos Rivales (Relación 1 a 1 con Equipo Rival)
CREATE TABLE IF NOT EXISTS public.informes_rivales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_rival_id UUID UNIQUE NOT NULL REFERENCES public.equipos_rivales(id) ON DELETE CASCADE,
    fase_ofensiva TEXT,
    fase_defensiva TEXT,
    transiciones TEXT,
    video_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 3. Tabla de Planes de Partido / Estrategias (Relación 1 a 1 con Equipo Rival)
CREATE TABLE IF NOT EXISTS public.planes_partido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_rival_id UUID UNIQUE NOT NULL REFERENCES public.equipos_rivales(id) ON DELETE CASCADE,
    google_slides_url TEXT,
    video_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 4. Tabla de Eventos en Directo (Relación 1 a Varios)
CREATE TABLE IF NOT EXISTS public.eventos_directo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_rival_id UUID NOT NULL REFERENCES public.equipos_rivales(id) ON DELETE CASCADE,
    cronometro VARCHAR(10) NOT NULL, -- Almacena el tiempo formateado "MM:SS"
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('Gol Favor', 'Ocasión Favor', 'Gol Contra', 'Ocasión Contra')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexar por equipo para listado fluido de eventos cronológicos
CREATE INDEX IF NOT EXISTS idx_eventos_directo_equipo ON public.eventos_directo(equipo_rival_id);


-- Habilitar RLS (Row Level Security) en todas las tablas
ALTER TABLE public.equipos_rivales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informes_rivales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_directo ENABLE ROW LEVEL SECURITY;


-- Políticas de Acceso Público / Autenticado (Siguiendo el estilo de la tabla de jugadores)

-- EQUIPOS RIVALES
DROP POLICY IF EXISTS "Permitir lectura pública de equipos rivales" ON public.equipos_rivales;
CREATE POLICY "Permitir lectura pública de equipos rivales" 
ON public.equipos_rivales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserción de equipos rivales a autenticados" ON public.equipos_rivales;
CREATE POLICY "Permitir inserción de equipos rivales a autenticados" 
ON public.equipos_rivales FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir actualización de equipos rivales a autenticados" ON public.equipos_rivales;
CREATE POLICY "Permitir actualización de equipos rivales a autenticados" 
ON public.equipos_rivales FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir eliminación de equipos rivales a autenticados" ON public.equipos_rivales;
CREATE POLICY "Permitir eliminación de equipos rivales a autenticados" 
ON public.equipos_rivales FOR DELETE USING (auth.role() = 'authenticated');


-- INFORMES RIVALES
DROP POLICY IF EXISTS "Permitir lectura pública de informes" ON public.informes_rivales;
CREATE POLICY "Permitir lectura pública de informes" 
ON public.informes_rivales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserción de informes a autenticados" ON public.informes_rivales;
CREATE POLICY "Permitir inserción de informes a autenticados" 
ON public.informes_rivales FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir actualización de informes a autenticados" ON public.informes_rivales;
CREATE POLICY "Permitir actualización de informes a autenticados" 
ON public.informes_rivales FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir eliminación de informes a autenticados" ON public.informes_rivales;
CREATE POLICY "Permitir eliminación de informes a autenticados" 
ON public.informes_rivales FOR DELETE USING (auth.role() = 'authenticated');


-- PLANES DE PARTIDO
DROP POLICY IF EXISTS "Permitir lectura pública de planes" ON public.planes_partido;
CREATE POLICY "Permitir lectura pública de planes" 
ON public.planes_partido FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserción de planes a autenticados" ON public.planes_partido;
CREATE POLICY "Permitir inserción de planes a autenticados" 
ON public.planes_partido FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir actualización de planes a autenticados" ON public.planes_partido;
CREATE POLICY "Permitir actualización de planes a autenticados" 
ON public.planes_partido FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir eliminación de planes a autenticados" ON public.planes_partido;
CREATE POLICY "Permitir eliminación de planes a autenticados" 
ON public.planes_partido FOR DELETE USING (auth.role() = 'authenticated');


-- EVENTOS EN DIRECTO
DROP POLICY IF EXISTS "Permitir lectura pública de eventos" ON public.eventos_directo;
CREATE POLICY "Permitir lectura pública de eventos" 
ON public.eventos_directo FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserción de eventos a autenticados" ON public.eventos_directo;
CREATE POLICY "Permitir inserción de eventos a autenticados" 
ON public.eventos_directo FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir actualización de eventos a autenticados" ON public.eventos_directo;
CREATE POLICY "Permitir actualización de eventos a autenticados" 
ON public.eventos_directo FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir eliminación de eventos a autenticados" ON public.eventos_directo;
CREATE POLICY "Permitir eliminación de eventos a autenticados" 
ON public.eventos_directo FOR DELETE USING (auth.role() = 'authenticated');


-- 5. Tabla de Agenda de Partidos (Alta de Partidos)
CREATE TABLE IF NOT EXISTS public.partidos_agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id VARCHAR(100) NOT NULL,
    visitante_id VARCHAR(100) NOT NULL,
    fecha VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en partidos_agenda
ALTER TABLE public.partidos_agenda ENABLE ROW LEVEL SECURITY;

-- Políticas para partidos_agenda
DROP POLICY IF EXISTS "Permitir lectura pública de partidos_agenda" ON public.partidos_agenda;
CREATE POLICY "Permitir lectura pública de partidos_agenda" 
ON public.partidos_agenda FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserción de partidos_agenda a autenticados" ON public.partidos_agenda;
CREATE POLICY "Permitir inserción de partidos_agenda a autenticados" 
ON public.partidos_agenda FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir actualización de partidos_agenda a autenticados" ON public.partidos_agenda;
CREATE POLICY "Permitir actualización de partidos_agenda a autenticados" 
ON public.partidos_agenda FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir eliminación de partidos_agenda a autenticados" ON public.partidos_agenda;
CREATE POLICY "Permitir eliminación de partidos_agenda a autenticados" 
ON public.partidos_agenda FOR DELETE USING (auth.role() = 'authenticated');

