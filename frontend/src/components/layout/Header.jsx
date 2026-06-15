import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { count, setIsOpen } = useCart();
  const { user, logout, isManager } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuario';
  };

  return (
    <header className="bg-premium-black border-b border-premium-gray/10 z-50 relative">
      <div className="container-premium">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-display uppercase tracking-normal text-white">
              Castellan
            </span>
            <span className="hidden sm:block text-xs text-cuero-400 font-medium uppercase tracking-normal">
              Store
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors">
              Inicio
            </Link>
            <Link to="/shop" className="text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors">
              Colección
            </Link>
            <Link to="/sobre-nosotros" className="text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors">
              Sobre Nosotros
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-white hover:text-cuero-400 transition-colors"
                >
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  <span className="font-medium">{getUserDisplayName()}</span>
                  <svg className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-premium-black border border-white/10 shadow-lg z-20">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs text-white/50 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/mis-pedidos"
                        className="block px-4 py-3 text-xs uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Mis Pedidos
                      </Link>
                      <Link
                        to="/perfil"
                        className="block px-4 py-3 text-xs uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                      {isManager && (
                        <Link
                          to="/admin"
                          className="block px-4 py-3 text-xs uppercase tracking-wider text-cuero-400 hover:bg-white/5 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Panel Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-xs uppercase tracking-wider text-white/70 hover:text-red-400 hover:bg-white/5 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/auth" className="bg-cuero-500 text-white px-5 py-2 text-xs uppercase tracking-wider hover:bg-cuero-600 transition-colors font-medium">
                Iniciar Sesión
              </Link>
            )}
          </nav>

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative text-white hover:text-cuero-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-cuero-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-white/10 pt-4 animate-slide-down">
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-sm uppercase tracking-wider text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>
                Inicio
              </Link>
              <Link to="/shop" className="text-sm uppercase tracking-wider text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>
                Colección
              </Link>
              <Link to="/sobre-nosotros" className="text-sm uppercase tracking-wider text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>
                Sobre Nosotros
              </Link>

              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-white/70 border-t border-white/10 pt-3 mt-3">
                    {user.picture ? (
                      <img src={user.picture} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    <span className="font-medium text-white">{getUserDisplayName()}</span>
                  </div>
                  <Link to="/mis-pedidos" className="text-sm uppercase tracking-wider text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>
                    Mis Pedidos
                  </Link>
                  <Link to="/perfil" className="text-sm uppercase tracking-wider text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>
                    Mi Perfil
                  </Link>
                  {isManager && (
                    <Link
                      to="/admin"
                      className="text-sm uppercase tracking-wider text-cuero-400 hover:text-cuero-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      Panel Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="text-sm uppercase tracking-wider text-red-400 hover:text-red-300 text-left"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link to="/auth" className="text-sm uppercase tracking-wider text-cuero-400 hover:text-cuero-300 font-medium" onClick={() => setMenuOpen(false)}>
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
