import { Link } from 'react-router-dom';

export default function HelpPageCTA({ text = '¿Tienes alguna duda?', buttonText = 'Contactar', href = '/contacto' }) {
  return (
    <div className="text-center border-t border-premium-gray pt-8 mb-16">
      <p className="text-sm text-premium-gray-dark mb-4">{text}</p>
      <Link to={href} className="btn-primary inline-block">{buttonText}</Link>
    </div>
  );
}
