import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function ScrollReveal({ children, className = '', as: Tag = 'div' }) {
  const ref = useScrollReveal();

  return (
    <Tag ref={ref} className={`scroll-reveal ${className}`}>
      {children}
    </Tag>
  );
}
