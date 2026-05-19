export type IdeaType =
  | 'character-driven'
  | 'vehicle-driven'
  | 'environment-driven'
  | 'product-driven'
  | 'abstract';

export const IDEA_TYPE_LABELS: Record<IdeaType, string> = {
  'character-driven': 'Character-Driven',
  'vehicle-driven': 'Vehicle-Driven',
  'environment-driven': 'Environment-Driven',
  'product-driven': 'Product-Driven',
  'abstract': 'Abstract / Conceptual',
};

const VEHICLE_KEYWORDS = [
  'car', 'truck', 'suv', 'van', 'motorcycle', 'motorbike',
  'jet', 'plane', 'aircraft', 'helicopter', 'spaceship', 'rocket',
  'boat', 'ship', 'yacht', 'submarine', 'train', 'formula',
  'ferrari', 'lamborghini', 'bugatti', 'porsche', 'mclaren',
  'mustang', 'corvette', 'tesla', 'drift', 'race', 'racing',
  'horsepower', 'engine', 'exhaust', 'turbo', 'supercar', 'hypercar',
];

const PRODUCT_KEYWORDS = [
  'product', 'gadget', 'device', 'app', 'brand', 'commercial',
  'advertisement', 'smartphone', 'laptop', 'tablet',
  'invention', 'launch', 'reveal', 'unbox',
  'headphones', 'smartwatch', 'sneaker',
];

const ENVIRONMENT_KEYWORDS = [
  'landscape', 'forest', 'jungle', 'ocean', 'sea', 'underwater',
  'desert', 'mountain', 'valley', 'canyon', 'cave', 'glacier',
  'volcano', 'storm', 'tornado', 'hurricane', 'sunset', 'sunrise',
  'aurora', 'galaxy', 'nebula',
  'metropolis', 'ruins', 'apocalypse', 'wasteland',
  'wildlife', 'fog', 'rain', 'snow',
];

const ABSTRACT_KEYWORDS = [
  'dream', 'concept', 'emotion', 'feeling', 'memory',
  'void', 'infinite', 'infinity', 'surreal',
  'abstract', 'philosophy', 'consciousness',
  'grief', 'loss',
];

export function classifyIdea(idea: string): IdeaType {
  const lower = idea.toLowerCase();
  const has = (kws: string[]) => kws.some((k) => lower.includes(k));

  if (has(VEHICLE_KEYWORDS)) return 'vehicle-driven';
  if (has(PRODUCT_KEYWORDS)) return 'product-driven';
  if (has(ENVIRONMENT_KEYWORDS)) return 'environment-driven';
  if (has(ABSTRACT_KEYWORDS)) return 'abstract';
  return 'character-driven';
}

export function deriveSubjectName(idea: string, type: IdeaType): string {
  const lower = idea.toLowerCase();

  if (type === 'vehicle-driven') {
    const brands = ['ferrari', 'lamborghini', 'bugatti', 'porsche', 'mclaren', 'mustang', 'corvette', 'tesla'];
    for (const b of brands) {
      if (lower.includes(b)) return b.charAt(0).toUpperCase() + b.slice(1);
    }
    const nouns = ['motorcycle', 'motorbike', 'truck', 'jet', 'plane', 'rocket', 'spaceship', 'boat', 'ship', 'train', 'car'];
    for (const n of nouns) {
      if (lower.includes(n)) return 'The ' + n.charAt(0).toUpperCase() + n.slice(1);
    }
    return 'The Vehicle';
  }

  if (type === 'product-driven') {
    const nouns = ['smartphone', 'phone', 'laptop', 'headphones', 'smartwatch', 'watch', 'sneaker', 'camera', 'tablet', 'gadget', 'device'];
    for (const n of nouns) {
      if (lower.includes(n)) return 'The ' + n.charAt(0).toUpperCase() + n.slice(1);
    }
    return 'The Product';
  }

  if (type === 'environment-driven') {
    const nouns = ['desert', 'ocean', 'forest', 'jungle', 'mountain', 'valley', 'canyon', 'glacier', 'volcano', 'ruins', 'galaxy'];
    for (const n of nouns) {
      if (lower.includes(n)) return 'The ' + n.charAt(0).toUpperCase() + n.slice(1);
    }
    return 'The Location';
  }

  return 'Hero';
}
