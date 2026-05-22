-- SQL para crear la tabla 'jugadores' en Supabase

-- 1. Crear la tabla 'jugadores'
CREATE TABLE IF NOT EXISTS public.jugadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    dorsal INTEGER NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    demarcacion VARCHAR(50) NOT NULL CHECK (demarcacion IN ('Portero', 'Defensa', 'Centrocampista', 'Delantero')),
    lateralidad VARCHAR(50) NOT NULL CHECK (lateralidad IN ('Diestro', 'Zurdo', 'Ambidiestro')),
    equipo VARCHAR(100) NOT NULL,
    foto_jugador TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas de acceso para jugadores (Acceso Público o Autenticado)
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
-- Nota: En Supabase, puedes crear el bucket desde la interfaz de Storage llamado `jugadores` (asegúrate de marcarlo como PUBLIC)
-- O puedes ejecutar este bloque SQL para insertar el bucket en la tabla de storage de supabase:

INSERT INTO storage.buckets (id, name, public) 
VALUES ('jugadores', 'jugadores', true)
ON CONFLICT (id) DO NOTHING;

-- políticas para el bucket de storage 'jugadores'
-- Permitir lectura de imágenes públicamente
CREATE POLICY "Imágenes públicas para cualquiera" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'jugadores');

-- Permitir subida y modificación solo a usuarios autenticados
CREATE POLICY "Subida de imágenes para autenticados" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'jugadores' AND auth.role() = 'authenticated');

CREATE POLICY "Modificación de imágenes de autenticados" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'jugadores' AND auth.role() = 'authenticated');

CREATE POLICY "Eliminación de imágenes de autenticados" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'jugadores' AND auth.role() = 'authenticated');
