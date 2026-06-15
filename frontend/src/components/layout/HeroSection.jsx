const SIZE_MAP = {
  sm: 'h-[18vh] min-h-[140px]',
  md: 'h-[24vh] min-h-[200px]',
  lg: 'h-[55vh] min-h-[380px]',
};

export default function HeroSection({
  size = 'sm',
  title,
  subtitle,
  image,
  gradient = true,
  children,
  className = '',
}) {
  return (
    <section className={`relative ${SIZE_MAP[size]} bg-premium-black overflow-hidden ${className}`}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-premium-black/70 to-transparent z-10" />
      )}
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover opacity-50"
      />
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="container-premium">
          {children ? (
            children
          ) : (
            <div>
              <h1 className="text-3xl md:text-5xl font-display uppercase tracking-wider text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-premium-gray text-sm md:text-base mt-4 max-w-xl">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
