import { formatPrice } from '../../utils/formatPrice';

export default function PriceTag({ price, originalPrice, size = 'default' }) {
  const sizes = {
    small: 'text-sm',
    default: 'text-lg',
    large: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`font-sans font-semibold tracking-tight ${sizes[size]} ${originalPrice ? 'text-red-600' : 'text-premium-black'}`}>
        {formatPrice(price)}
      </span>
      {originalPrice && (
        <span className={`text-premium-gray-dark line-through ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
}
