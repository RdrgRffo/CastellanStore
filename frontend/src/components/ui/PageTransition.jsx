import { useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

/**
 * Envuelve el contenido de las páginas con una animación de entrada
 * que se reproduce cada vez que cambia la ruta.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setIsAnimating(true);
      prevPathRef.current = location.pathname;
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div
      key={location.pathname}
      className={isAnimating ? 'animate-fade-in-up' : 'animate-fade-in-up'}
    >
      {children}
    </div>
  );
}
