import { Link } from 'react-router-dom';

export default function Breadcrumb({ items, className = '' }) {
  return (
    <nav className={`py-10 md:py-12 ${className}`}>
      <ol className="flex items-center gap-2 text-xs uppercase tracking-wider">
        <li>
          <Link to="/" className="text-premium-gray-dark hover:text-premium-black transition-colors">
            Inicio
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-premium-gray">/</span>
            {item.path ? (
              <Link to={item.path} className="text-premium-gray-dark hover:text-premium-black transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-premium-black">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
