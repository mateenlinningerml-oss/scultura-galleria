const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'data/content.json'), 'utf8'));
const block = content.pages.about.blocks.find((b) => b.type === 'pageHero');
if (!block) throw new Error('About pageHero block missing');
const image = String(block.data?.image || '').replace(/^\//, '');
if (!image) throw new Error('Artist hero image is empty');
if (!fs.existsSync(path.join(root, image))) throw new Error(`Artist hero image file missing: ${image}`);
const sandbox = {
  window: { GS_BLOCKS: { resolveBi: (value) => value?.en || value?.it || value || '' } },
  getLang: () => 'en',
  console
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/page-renderer.js'), 'utf8'), sandbox);
const html = sandbox.window.GS_PAGE_RENDERER.renderBlock(block);
if (!html.includes('page-hero--has-image')) throw new Error('Image modifier class missing');
if (!html.includes('/uploads/artist-hero-background-test.png')) throw new Error('Rendered image URL missing');
if (!html.includes('--page-hero-image')) throw new Error('CSS variable missing');
const admin = fs.readFileSync(path.join(root, 'admin/js/admin.js'), 'utf8');
if (!admin.includes('data-pagehero-file') || !admin.includes('d.image = await uploadImage(file)')) {
  throw new Error('Admin pageHero upload binding missing');
}
console.log('PASS: artist background exists, renders into pageHero, and admin upload binding is present.');
