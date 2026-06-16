export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-premium-black text-white',
    cuero: 'bg-cuero-500 text-white',
    sale: 'bg-red-600 text-white',
    outline: 'border border-premium-black text-premium-black',
  };

  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase ${variants[variant]}`}>
      {children}
    </span>
  );
}
