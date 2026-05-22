import React, { useState, useEffect, useRef } from 'react';
import { Jugador, Demarcacion } from '../types';
import { uploadPlayerPhoto } from '../lib/supabase';
import { X, Upload, User, UserPlus, Save, AlertCircle } from 'lucide-react';

interface PlayerFormModalProps {
  player: Jugador | null; // If not null, we are editing. If null, we are adding new.
  isOpen: boolean;
  onClose: () => void;
  onSave: (playerData: Omit<Jugador, 'id' | 'created_at'> & { id?: string }) => void;
  isSupabaseActive: boolean;
}

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  player,
  isOpen,
  onClose,
  onSave,
  isSupabaseActive
}) => {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dorsal, setDorsal] = useState<number | ''>('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [demarcacion, setDemarcacion] = useState<Demarcacion>('Centrocampista');
  const [talla, setTalla] = useState<number>(175);
  const [equipo, setEquipo] = useState('FC Titanes');
  const [observaciones, setObservaciones] = useState('');
  const [fotoJugador, setFotoJugador] = useState('');
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if editing a player
  useEffect(() => {
    if (player) {
      setNombre(player.nombre);
      setApellidos(player.apellidos);
      setDorsal(player.dorsal);
      setFechaNacimiento(player.fecha_nacimiento);
      setDemarcacion(player.demarcacion);
      setTalla(player.talla || 175);
      setEquipo(player.equipo || 'FC Titanes');
      setObservaciones(player.observaciones || '');
      setFotoJugador(player.foto_jugador || '');
      setLocalPhotoPreview(player.foto_jugador || null);
    } else {
      // Clear out fields for a new player
      setNombre('');
      setApellidos('');
      setDorsal('');
      setFechaNacimiento('');
      setDemarcacion('Centrocampista');
      setTalla(175);
      setEquipo('FC Titanes');
      setObservaciones('');
      setFotoJugador('');
      setLocalPhotoPreview(null);
    }
    setUploadError(null);
  }, [player, isOpen]);

  if (!isOpen) return null;

  // File selection / drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    // Create a local base64 preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLocalPhotoPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    try {
      if (isSupabaseActive) {
        // Upload to real Supabase Storage bucket 'jugadores'
        const uploadedPath = await uploadPlayerPhoto(file);
        setFotoJugador(uploadedPath);
      } else {
        // In Sandbox mode, we save the Base64 representation or use a high quality mock Unsplash photo
        // For local storage limits, we can mock a photo path or use the base64 if small. Let's use the local base64 preview directly!
        const b64 = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.readAsDataURL(file);
          r.onload = () => resolve(r.result as string);
        });
        setFotoJugador(b64);
      }
    } catch (err: any) {
      setUploadError(`Error al subir la imagen: ${err?.message || 'Revisa la configuración del Storage de Supabase.'}`);
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellidos.trim() || dorsal === '' || !fechaNacimiento || !equipo.trim()) {
      setUploadError('Por favor, completa todos los campos obligatorios (*).');
      return;
    }

    onSave({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      dorsal: Number(dorsal),
      fecha_nacimiento: fechaNacimiento,
      demarcacion,
      talla: Number(talla),
      equipo: equipo.trim(),
      observaciones: observaciones.trim(),
      foto_jugador: fotoJugador,
      ...(player?.id ? { id: player.id } : {})
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-150" onClick={onClose} />

      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-full max-w-2xl relative z-14 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {player ? 'Editar Ficha de Jugador' : 'Inscribir Nuevo Jugador'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rellena el perfil deportivo oficial y asigna dorsal
              </p>
            </div>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-150 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {uploadError && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-xs text-red-700 leading-relaxed font-semibold">{uploadError}</span>
            </div>
          )}

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-600">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 font-sans" htmlFor="player-name">
                Nombre <span className="text-indigo-500">*</span>
              </label>
              <input
                id="player-name"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Andrés"
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="player-lastname">
                Apellidos <span className="text-indigo-500">*</span>
              </label>
              <input
                id="player-lastname"
                type="text"
                required
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Ej. Iniesta Luján"
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
              />
            </div>

            {/* Dorsal */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="player-dorsal">
                Dorsal (Camiseta) <span className="text-indigo-500">*</span>
              </label>
              <input
                id="player-dorsal"
                type="number"
                required
                min="1"
                max="99"
                value={dorsal}
                onChange={(e) => setDorsal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej. 8"
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
              />
            </div>

            {/* Fecha Nacimiento */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="player-dob">
                Fecha de Nacimiento <span className="text-indigo-500">*</span>
              </label>
              <input
                id="player-dob"
                type="date"
                required
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
              />
            </div>

            {/* Demarcacion */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="player-position">
                Demarcación <span className="text-indigo-500">*</span>
              </label>
              <select
                id="player-position"
                value={demarcacion}
                onChange={(e) => setDemarcacion(e.target.value as Demarcacion)}
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
              >
                <option value="Portero">Portero</option>
                <option value="Defensa">Defensa</option>
                <option value="Centrocampista">Centrocampista</option>
                <option value="Delantero">Delantero</option>
              </select>
            </div>

            {/* Talla / Estatura */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="player-height">
                Estatura / Talla <span className="text-indigo-500">*</span>
              </label>
              <select
                id="player-height"
                value={talla}
                onChange={(e) => setTalla(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
              >
                {Array.from({ length: 31 }, (_, i) => 160 + i).map((val) => (
                  <option key={val} value={val}>
                    {val} cm
                  </option>
                ))}
              </select>
            </div>

            {/* Equipo */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="player-team">
                Equipo / Club <span className="text-indigo-500">*</span>
              </label>
              <input
                id="player-team"
                type="text"
                required
                value={equipo}
                onChange={(e) => setEquipo(e.target.value)}
                placeholder="Ej. FC Titanes"
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
              />
            </div>
          </div>

          {/* Photo upload Drag & Drop */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Fotografía Oficial del Jugador
            </label>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleBoxClick}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 text-center ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50/50' 
                  : localPhotoPreview 
                    ? 'border-slate-200 bg-slate-50/20' 
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              <input
                id="photo-file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {uploading ? (
                <div className="space-y-2 text-slate-500 py-3">
                  <span className="animate-spin h-7 w-7 border-3 border-indigo-600 border-t-transparent rounded-full block mx-auto" />
                  <p className="text-xs font-medium">Subiendo fotografía a Supabase...</p>
                </div>
              ) : localPhotoPreview ? (
                <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4 py-1">
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-200">
                    <img
                      src={localPhotoPreview}
                      alt="Miniatura"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800">¡Imagen cargada correctamente!</p>
                    <p className="text-[10px] text-slate-400 mt-1">Haz clic o arrastra otra imagen para reemplazarla</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="mx-auto h-10 w-10 text-indigo-500 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700">Arrastra tu fotografía aquí o <span className="text-indigo-600 underline">búscala en tu ordenador</span></p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Formatos soportados: JPG, PNG o WebP</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="player-notes">
              Observaciones / Historial Clínico o Táctico
            </label>
            <textarea
              id="player-notes"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Jugador con gran proyección. Recientemente recuperado de fatiga muscular ligera. Destaca por su compañerismo."
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
          <button
            id="btn-cancel-form"
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all duration-150 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="btn-save-player"
            onClick={handleSubmit}
            disabled={uploading}
            className="inline-flex items-center space-x-1.5 px-4.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all duration-150 disabled:bg-indigo-400 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{player ? 'Guardar Cambios' : 'Completar Registro'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
