export {};
const names = [
  'home',
  'accounts',
  'catalog',
  'model-assets',
  'templates',
  'fashion-editor',
  'human-preview',
  'interior-editor',
  'artwork',
  'room-planner',
  'library-sharing',
  'pricing',
  'submissions-whatsapp',
  'consultations-quotes',
  'payments',
  'tracking',
  'cms',
  'production-export',
  'business-settings',
  'pwa',
  'uploads-security',
];
for (const path of [
  'PRD.md',
  'CHANGELOG.md',
  'README.md',
  'AGENTS.md',
  'architecture.md',
  'docs/README.md',
  ...names.map((n) => 'docs/' + n + '.md'),
]) {
  if (!(await Bun.file(path).exists())) throw new Error('Missing required document: ' + path);
  const content = await Bun.file(path).text();
  if (content.length < 100) throw new Error('Empty documentation: ' + path);
}
console.log('Documentation complete: 21 feature documents and required project guides.');
