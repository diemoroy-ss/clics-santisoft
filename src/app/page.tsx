'use client';

import SantisoftLogo from '@/components/ui/SantisoftLogo';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import {
  Shield,
  Globe,
  Zap,
  BarChart3,
  Eye,
  Lock,
  ChevronRight,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: Shield,
    title: 'Detección en Tiempo Real',
    desc:  'Motor de reglas que evalúa cada clic en menos de 50ms antes de que impacte tu presupuesto.',
  },
  {
    icon: Globe,
    title: 'GeoIP & Reputación de IP',
    desc:  'Bloqueo automático de VPNs, proxies y datacenters con base de datos actualizada.',
  },
  {
    icon: Zap,
    title: 'Sincronización API Google Ads',
    desc:  'Las IPs fraudulentas se añaden automáticamente a tus exclusiones de campaña.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard en Tiempo Real',
    desc:  'Visualiza clics legítimos vs. fraudulentos y el dinero que estás protegiendo.',
  },
  {
    icon: Eye,
    title: 'Análisis de Comportamiento',
    desc:  'Detección de bots por fingerprint, tiempo de sesión cero e interacción nula.',
  },
  {
    icon: Lock,
    title: 'Plataforma Escalable',
    desc:  'Múltiples sitios, cada uno aislado con sus propias reglas configurables.',
  },
];

const STATS = [
  { value: '99.7%',   label: 'Precisión de detección' },
  { value: '< 50ms',  label: 'Tiempo de análisis' },
  { value: '500+',    label: 'IPs bloqueadas por campaña' },
  { value: '$0',      label: 'Clics fraudulentos cobrados' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

export default function LandingPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Auth error:', err);
      alert(`Error de autenticación: ${err.message}`);
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google Auth error:', err);
      alert(`Error de autenticación con Google: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-navy-deeper font-sans relative overflow-hidden">
      <div className="absolute inset-0 noise mix-blend-overlay z-0 opacity-40 pointer-events-none"></div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-navy/10 bg-white/80 backdrop-blur-md">
        <SantisoftLogo mode="light" size={36} animated={true} />
        <div className="flex items-center gap-5">
          <a
            href="https://clics.santisoft.cl/docs"
            className="text-sm text-navy-dark hover:text-mint-dark font-medium transition-colors"
          >
            Documentación
          </a>
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm px-4 py-2 rounded-lg font-medium bg-mint/10 text-mint-dark hover:bg-mint/20 transition-colors"
          >
            {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Copy */}
          <motion.div 
            className="lg:col-span-7 space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-navy/10 shadow-sm rounded-full text-navy-dark text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
              Protección activa 24/7
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] text-navy-deeper">
              Elimina el <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">fraude</span> de clics en <br/>
              <span className="text-navy">Google Ads</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-navy-dark text-xl leading-relaxed max-w-xl">
              Detectamos y bloqueamos bots, VPNs y competidores antes de que agoten tu presupuesto en Chile y el mundo. Integración directa con la API oficial de Google.
            </motion.p>

            <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4">
              <button
                onClick={() => document.getElementById('auth-panel')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-navy hover:bg-navy-dark text-white px-8 py-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
              >
                Comienza a Protegerte
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-navy-dark font-medium text-sm">
                <TrendingDown className="w-5 h-5 text-mint" />
                Maximiza tu ROI
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-navy/10">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-display font-bold text-navy">{s.value}</div>
                  <div className="text-xs font-medium text-navy-dark mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Auth panel */}
          <motion.div 
            id="auth-panel" 
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {/* Decorative background shape */}
            <div className="absolute -inset-4 bg-gradient-to-br from-mint-pale to-white rounded-3xl -z-10 shadow-sm border border-navy/5 transform rotate-2"></div>
            
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-navy/5">
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold text-navy-deeper">
                  {mode === 'login' ? 'Acceso al Dashboard' : 'Comienza Ahora'}
                </h2>
                <p className="text-navy-dark mt-2">
                  {mode === 'login'
                    ? 'Monitorea tus campañas protegidas.'
                    : 'Regístrate y configura tu primer sitio en minutos.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-navy-deeper mb-2">Correo Corporativo</label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-cream border border-navy/10 rounded-xl px-4 py-3 text-navy-deeper focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent transition-all"
                    placeholder="hola@tuempresa.cl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-deeper mb-2">Contraseña</label>
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-cream border border-navy/10 rounded-xl px-4 py-3 text-navy-deeper focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-mint hover:bg-mint-dark text-navy-deeper font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5 text-navy-deeper" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Cargando...
                    </span>
                  ) : mode === 'login' ? (
                    'Ingresar a mi cuenta'
                  ) : (
                    'Crear mi cuenta'
                  )}
                </button>
              </form>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-navy/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-navy-dark">O continuar con</span>
                </div>
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-navy/20 hover:bg-cream text-navy-deeper font-semibold py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-70"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <div className="mt-6 pt-6 border-t border-navy/5 text-center">
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-sm font-semibold text-navy hover:text-navy-dark transition-colors"
                >
                  {mode === 'login' ? '¿Eres nuevo? Crea una cuenta aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </div>

              {/* Demo alert */}
              <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200/50">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold block mb-1">Entorno de Demostración</span>
                  Puedes registrar una cuenta nueva para explorar el panel de control.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features grid */}
        <motion.div 
          className="mt-32"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-navy-deeper">Tecnología de Protección</h2>
            <p className="text-navy-dark mt-4 text-lg">Nuestro motor evalúa más de 40 puntos de datos por visitante para garantizar que tu inversión publicitaria sea real.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div 
                key={f.title} 
                variants={itemVariants}
                className="bg-white p-8 rounded-2xl shadow-sm border border-navy/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-mint-pale flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6 text-mint-dark" />
                </div>
                <h3 className="text-xl font-bold font-display text-navy-deeper mb-3">{f.title}</h3>
                <p className="text-navy-dark leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
      </div>
      
      {/* Footer minimalista */}
      <footer className="border-t border-navy/10 py-8 bg-white relative z-10 text-center text-sm text-navy-dark font-medium">
        <p>&copy; {new Date().getFullYear()} Clics — Protección contra fraude en Google Ads. Desarrollado en Chile.</p>
      </footer>
    </div>
  );
}
