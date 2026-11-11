import type { ProductTemplate } from '@3dmantap/shared';
export function ProductIllustration({
  template,
  className = '',
}: {
  template: ProductTemplate;
  className?: string;
}) {
  return (
    <img
      className={'product-photo ' + className}
      src={'/models/previews/' + template.modelKind + '.webp'}
      alt={template.name}
      loading="lazy"
      decoding="async"
    />
  );
}
