import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Sparkles, CheckCircle, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  isSupabaseActive: boolean;
  onLoginSuccess: (userEmail: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isSupabaseActive, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isSupabaseActive) {
      // Sandbox mode demo loading simulation
      setTimeout(() => {
        setLoading(false);
        if (isSignUp) {
          setSuccess('Cuenta de Sandbox creada correctamente. Procede a iniciar sesión.');
          setIsSignUp(false);
        } else {
          onLoginSuccess(email);
        }
      }, 800);
      return;
    }

    try {
      if (!supabase) throw new Error('Supabase no está disponible');

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSuccess('¡Registro exitoso! Por favor, verifica tu correo electrónico (o inicia sesión directamente si el auto-confirm está activado).');
        setIsSignUp(false);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data?.user?.email) {
          onLoginSuccess(data.user.email);
        } else {
          throw new Error('No se pudo recuperar los datos de usuario.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Ha ocurrido un error inesperado al procesar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSandboxLogin = () => {
    setError(null);
    setSuccess(null);
    setEmail('entrenador@fctitanes.com');
    setPassword('titanes123');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess('entrenador@fctitanes.com');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo / visual with gorgeous emerald accents */}
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-md mb-4 ring-4 ring-emerald-500/10">
          <Database className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          TITAN<span className="text-emerald-400">SCOUT</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Inicia sesión para gestionar el equipo, añadir fichajes y editar estadísticas
        </p>

        {/* Sandbox Indicator */}
        {!isSupabaseActive && (
          <div className="mt-4 mx-4 sm:mx-0 p-3 bg-amber-950/20 rounded-xl border border-amber-800/20 flex items-center justify-center space-x-2 text-amber-300 text-xs shadow-md">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
            <span>Ejecutando en <strong className="text-amber-200">Modo Sandbox</strong>. Usa acceso rápido instantáneo.</span>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/40 py-8 px-6 shadow-md border border-slate-900/80 rounded-2xl space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              id="tab-login"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors duration-150 cursor-pointer ${!isSignUp ? 'border-b-2 border-emerald-500 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Iniciar Sesión
            </button>
            <button
              id="tab-signup"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors duration-150 cursor-pointer ${isSignUp ? 'border-b-2 border-emerald-500 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 bg-red-950/30 rounded-xl border border-red-900/30 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-red-200 leading-relaxed font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-900/30 flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs text-emerald-200 leading-relaxed font-semibold">{success}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="auth-email">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="ejemplo@club.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="auth-password">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="auth-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500 leading-tight">Mínimo 6 caracteres</p>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full relative flex items-center justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-all duration-150 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                  <span>Procesando...</span>
                </span>
              ) : isSignUp ? (
                <span className="flex items-center space-x-1">
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span>Registrar nuevo perfil</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1">
                  <LogIn className="h-4 w-4 mr-1" />
                  <span>Acceder al panel</span>
                </span>
              )}
            </button>
          </form>

          {/* Quick Access Sandbox Tool */}
          {!isSupabaseActive && (
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0d1320] text-slate-500 font-semibold uppercase tracking-wider">Demostración Rápida</span>
              </div>
              
              <button
                id="btn-sandbox-quick"
                onClick={handleQuickSandboxLogin}
                className="mt-4 w-full flex items-center justify-center py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 hover:text-white transition-all duration-150 shadow-sm cursor-pointer"
              >
                <Sparkles className="h-4.5 w-4.5 mr-1.5 text-amber-500 animate-pulse" />
                Acceso Directo con Cuenta Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
