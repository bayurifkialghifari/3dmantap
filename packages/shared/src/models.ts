import type { ProductTemplate } from './contracts';
export type ModelAsset = {
  file: string;
  source: string;
  author: string;
  license: 'CC0-1.0' | 'CC-BY-4.0';
  mode: 'garment' | 'hat' | 'shoe' | 'bag' | 'panels';
  rotation: [number, number, number];
};
const garments =
  'https://github.com/kblood/CharacterCreator/tree/852e48f316b90a0937234886630e4fb4cdfd1f78/output';
const garment = (file: string): ModelAsset => ({
  file,
  source: garments,
  author: 'MakeHuman community / Kasper Olesen',
  license: 'CC0-1.0',
  mode: 'garment',
  rotation: [0, 0, 0],
});
const panels: ModelAsset = {
  file: 'furniture-parts',
  source: 'https://polyhaven.com/a/modern_wooden_cabinet',
  author: 'Poly Haven',
  license: 'CC0-1.0',
  mode: 'panels',
  rotation: [0, 0, 0],
};
export const productModels: Record<ProductTemplate['modelKind'], ModelAsset> = {
  shirt: garment('tshirt'),
  hoodie: garment('hoodie'),
  jacket: garment('jacket'),
  pants: garment('jeans'),
  cap: {
    file: 'fishermans_hat',
    source: 'https://polyhaven.com/a/fishermans_hat',
    author: 'Poly Haven',
    license: 'CC0-1.0',
    mode: 'hat',
    rotation: [0, 0, 0],
  },
  shoe: {
    file: 'sneaker',
    source:
      'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe',
    author: 'Shopify',
    license: 'CC-BY-4.0',
    mode: 'shoe',
    rotation: [0, -Math.PI / 2, 0],
  },
  bag: {
    file: 'duffel',
    source: 'https://poly.pizza/m/rysPhwuIP4',
    author: 'accidentallyc',
    license: 'CC0-1.0',
    mode: 'bag',
    rotation: [0, 0, 0],
  },
  cabinet: panels,
  shelf: panels,
  sideboard: panels,
  desk: panels,
  door: panels,
  panel: panels,
};
export const modelFile = (template: ProductTemplate) =>
  '/models/' + productModels[template.modelKind].file + '.glb';
