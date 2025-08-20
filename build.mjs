#!/usr/bin/env node
import { transform } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jsDir = resolve(__dirname, 'themes/karuta/static/js');
const distDir = resolve(__dirname, 'themes/karuta/static/js/dist');

// Ensure dist directory exists
mkdirSync(distDir, { recursive: true });

// Build configurations
const buildConfigs = [
  {
    name: 'critical',
    description: 'Critical JavaScript (theme, navigation)',
    sourceFiles: [
      `${jsDir}/theme.js`,
      `${jsDir}/nav.js`
    ],
    outfile: `${distDir}/critical.min.js`
  },
  {
    name: 'main',
    description: 'Main JavaScript bundle (search, interactions)',
    sourceFiles: [
      `${jsDir}/search.js`,
      `${jsDir}/keyboard-nav.js`,
      `${jsDir}/ui-enhancements.js`
    ],
    outfile: `${distDir}/main.min.js`
  },
  {
    name: 'lazy',
    description: 'Lazy-loaded features',
    sourceFiles: [
      `${jsDir}/lazy-load.js`,
      `${jsDir}/sw-register.js`
    ],
    outfile: `${distDir}/lazy.min.js`
  }
];

// Size formatter
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Get file size
function getFileSize(filepath) {
  try {
    return readFileSync(filepath).length;
  } catch {
    return 0;
  }
}

// Minify a single JavaScript file
async function minifyFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const result = await transform(content, {
    minify: true,
    target: 'es2018',
    loader: 'js'
  });
  return result.code;
}

// Build function
async function buildBundle(config) {
  console.log(`\n🔨 Building ${config.name} bundle...`);
  console.log(`   Description: ${config.description}`);
  
  try {
    // Process each file and combine
    let combinedContent = '';
    
    for (const filePath of config.sourceFiles) {
      console.log(`   📄 Processing: ${filePath.split('/').pop()}`);
      const minifiedCode = await minifyFile(filePath);
      combinedContent += minifiedCode + '\n';
    }
    
    // Add build info comment
    const buildInfo = `/*! ${config.description} | Built: ${new Date().toISOString()} */\n`;
    const finalContent = buildInfo + combinedContent;
    
    // Write the file
    writeFileSync(config.outfile, finalContent);
    
    const outputSize = finalContent.length;
    console.log(`   ✅ Output: ${config.outfile}`);
    console.log(`   📦 Size: ${formatBytes(outputSize)}`);
    
    return { name: config.name, size: outputSize, path: config.outfile };
    
  } catch (error) {
    console.error(`   ❌ Error building ${config.name}:`, error.message);
    throw error;
  }
}

// Calculate original sizes
function calculateOriginalSizes() {
  const originalFiles = [
    'theme.js', 'nav.js', 'search.js', 'keyboard-nav.js', 
    'ui-enhancements.js', 'lazy-load.js', 'sw-register.js'
  ];
  
  let totalSize = 0;
  const fileSizes = {};
  
  for (const file of originalFiles) {
    const size = getFileSize(`${jsDir}/${file}`);
    fileSizes[file] = size;
    totalSize += size;
  }
  
  return { fileSizes, totalSize };
}

// Main build process
async function buildAll() {
  console.log('🚀 Starting JavaScript optimization build...\n');
  
  // Calculate original sizes
  const originalStats = calculateOriginalSizes();
  console.log('📊 Original file sizes:');
  Object.entries(originalStats.fileSizes).forEach(([file, size]) => {
    console.log(`   ${file}: ${formatBytes(size)}`);
  });
  console.log(`   Total: ${formatBytes(originalStats.totalSize)}\n`);
  
  // Build all bundles
  const results = [];
  for (const config of buildConfigs) {
    const result = await buildBundle(config);
    results.push(result);
  }
  
  // Calculate savings
  const totalBundleSize = results.reduce((sum, result) => sum + result.size, 0);
  const savings = originalStats.totalSize - totalBundleSize;
  const savingsPercent = Math.round((savings / originalStats.totalSize) * 100);
  
  console.log('\n📈 Build Summary:');
  console.log('================');
  results.forEach(result => {
    console.log(`${result.name}: ${formatBytes(result.size)}`);
  });
  console.log(`Total bundled: ${formatBytes(totalBundleSize)}`);
  console.log(`Original total: ${formatBytes(originalStats.totalSize)}`);
  console.log(`Savings: ${formatBytes(savings)} (${savingsPercent}%)`);
  
  console.log('\n✨ JavaScript optimization complete!');
}

// Already created above with mkdirSync

// Run the build
buildAll().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});