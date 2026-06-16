import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { loginUser, registerUser, loginWithGoogle } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { FormValidator, Validator } from '../../utils/FormValidator';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AuthForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', birthDate: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validator = useMemo(() => {
    const v = new FormValidator()
      .field('email', [
        Validator.required('El email es obligatorio'),
        Validator.email('Introduce un email válido'),
      ])
      .field('password', [
        Validator.required('La contraseña es obligatoria'),
        Validator.minLength(6, 'Mínimo 6 caracteres'),
      ]);
    return v;
  }, []);

  const registerValidator = useMemo(() => {
    const v = new FormValidator()
      .field('name', [
        Validator.required('El nombre es obligatorio'),
      ])
      .field('email', [
        Validator.required('El email es obligatorio'),
        Validator.email('Introduce un email válido'),
      ])
      .field('password', [
        Validator.required('La contraseña es obligatoria'),
        Validator.minLength(6, 'Mínimo 6 caracteres'),
      ])
      .field('birthDate', [
        Validator.required('La fecha de nacimiento es obligatoria'),
        Validator.adult('Debes ser mayor de 18 años'),
      ]);
    return v;
  }, []);

  const activeValidator = mode === 'register' ? registerValidator : validator;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    activeValidator.validateField(field, value, { ...form, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeValidator.validateAll(form)) {
      return;
    }

    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await loginUser(form.email, form.password);
      } else {
        result = await registerUser(form.email, form.password, form.birthDate, form.name);
      }
      login(result.token, result.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      login(result.token, result.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
  };

  return (
    <main>
      <div className="container-premium py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="section-title">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="section-subtitle mt-2">
              {mode === 'login'
                ? 'Accede a tu cuenta para gestionar tus pedidos'
                : 'Regístrate para disfrutar de ventajas exclusivas'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-premium-gray mb-8">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3 text-xs uppercase tracking-wider transition-colors border-b-2 -mb-[1px]
                ${mode === 'login'
                  ? 'border-premium-black text-premium-black'
                  : 'border-transparent text-premium-gray-dark hover:text-premium-black'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-3 text-xs uppercase tracking-wider transition-colors border-b-2 -mb-[1px]
                ${mode === 'register'
                  ? 'border-premium-black text-premium-black'
                  : 'border-transparent text-premium-gray-dark hover:text-premium-black'}`}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className={activeValidator.inputClass('name')}
                />
                {activeValidator.error('name') && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activeValidator.error('name')}
                  </p>
                )}
              </div>
            )}
            <div>
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                className={activeValidator.inputClass('email')}
              />
              {activeValidator.error('email') && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {activeValidator.error('email')}
                </p>
              )}
            </div>
            <div>
              <input
                type="password"
                placeholder="Contraseña *"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                className={activeValidator.inputClass('password')}
              />
              {activeValidator.error('password') && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {activeValidator.error('password')}
                </p>
              )}
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-premium-gray-dark uppercase tracking-wider mb-2">
                  Fecha de nacimiento *
                </label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={e => handleChange('birthDate', e.target.value)}
                  className={activeValidator.inputClass('birthDate')}
                />
                {activeValidator.error('birthDate') && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activeValidator.error('birthDate')}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 p-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-premium-gray" />
            <span className="text-xs text-premium-gray-dark uppercase tracking-wider">o</span>
            <div className="flex-1 h-px bg-premium-gray" />
          </div>

          {/* Google Button */}
          {GOOGLE_CLIENT_ID ? (
            <div className="w-full" style={{ minHeight: '48px' }}>
              <div className="flex justify-center" style={{ transform: 'scale(1.15)', transformOrigin: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text={mode === 'register' ? 'signup_with' : 'continue_with'}
                  shape="rectangular"
                  width="340"
                />
              </div>
            </div>
          ) : (
            <button
              disabled
              className="w-full py-3 border-2 border-premium-gray text-sm font-medium tracking-wider uppercase
                         bg-premium-gray-light text-premium-gray-dark cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google (no configurado)
            </button>
          )}

          <p className="text-center text-xs text-premium-gray-dark mt-6">
            {mode === 'login' ? (
              <>¿No tienes cuenta?{' '}
                <button onClick={() => { setMode('register'); setError(''); }} className="text-cuero-500 hover:underline">
                  Regístrate
                </button>
              </>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} className="text-cuero-500 hover:underline">
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  if (!GOOGLE_CLIENT_ID) {
    return <AuthForm />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthForm />
    </GoogleOAuthProvider>
  );
}
