#!/usr/bin/env node

/**
 * Structured Data Validator for Hugo Theme Karuta
 * Validates JSON-LD structured data using Google's Rich Results Test API
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

// Configuration
const CONFIG = {
  testUrls: [
    'http://localhost:1313',                                    // Home page
    'http://localhost:1313/posts/',                             // Section page
    'http://localhost:1313/posts/hyakunin-isshu-001-tenji/',   // Article page
    'http://localhost:1313/tags/百人一首/',                        // Taxonomy page
  ],
  output: {
    directory: './structured-data-reports',
    format: 'json'
  },
  validation: {
    requiredSchemas: {
      home: ['WebSite', 'Organization'],
      article: ['BlogPosting', 'BreadcrumbList'],
      section: ['CollectionPage', 'BreadcrumbList'],
      taxonomy: ['CollectionPage', 'BreadcrumbList']
    }
  }
};

/**
 * Extract JSON-LD from HTML content
 */
function extractJsonLD(html) {
  const jsonLdBlocks = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    try {
      const jsonString = match[1].trim();
      const jsonData = JSON.parse(jsonString);
      jsonLdBlocks.push(jsonData);
    } catch (error) {
      console.warn('⚠️  Invalid JSON-LD found:', error.message);
    }
  }
  
  return jsonLdBlocks;
}

/**
 * Fetch HTML content from URL
 */
async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'StructuredDataValidator/1.0'
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Validate individual JSON-LD schema
 */
function validateSchema(jsonLD) {
  const errors = [];
  const warnings = [];
  
  // Check required @context
  if (!jsonLD['@context']) {
    errors.push('Missing @context property');
  } else if (jsonLD['@context'] !== 'https://schema.org') {
    warnings.push(`Unexpected @context: ${jsonLD['@context']}`);
  }
  
  // Check required @type
  if (!jsonLD['@type']) {
    errors.push('Missing @type property');
  }
  
  // Type-specific validations
  const type = jsonLD['@type'];
  
  switch (type) {
    case 'WebSite':
      if (!jsonLD.name) errors.push('WebSite: Missing name');
      if (!jsonLD.url) errors.push('WebSite: Missing url');
      break;
      
    case 'Organization':
      if (!jsonLD.name) errors.push('Organization: Missing name');
      if (!jsonLD.url) errors.push('Organization: Missing url');
      break;
      
    case 'BlogPosting':
      if (!jsonLD.headline) errors.push('BlogPosting: Missing headline');
      if (!jsonLD.datePublished) errors.push('BlogPosting: Missing datePublished');
      if (!jsonLD.author) errors.push('BlogPosting: Missing author');
      if (!jsonLD.publisher) errors.push('BlogPosting: Missing publisher');
      if (!jsonLD.image) warnings.push('BlogPosting: Missing image (recommended)');
      break;
      
    case 'BreadcrumbList':
      if (!jsonLD.itemListElement) {
        errors.push('BreadcrumbList: Missing itemListElement');
      } else if (!Array.isArray(jsonLD.itemListElement)) {
        errors.push('BreadcrumbList: itemListElement must be an array');
      }
      break;
      
    case 'CollectionPage':
      if (!jsonLD.name) errors.push('CollectionPage: Missing name');
      if (!jsonLD.url) errors.push('CollectionPage: Missing url');
      break;
      
    case 'FAQPage':
      if (!jsonLD.mainEntity) {
        errors.push('FAQPage: Missing mainEntity');
      } else if (!Array.isArray(jsonLD.mainEntity)) {
        errors.push('FAQPage: mainEntity must be an array');
      }
      break;
  }
  
  return { errors, warnings };
}

/**
 * Analyze structured data for a page
 */
async function analyzePage(url) {
  console.log(`🔍 Analyzing: ${url}`);
  
  try {
    const html = await fetchHTML(url);
    const jsonLdBlocks = extractJsonLD(html);
    
    if (jsonLdBlocks.length === 0) {
      return {
        url,
        success: false,
        error: 'No JSON-LD structured data found',
        schemas: [],
        issues: ['No structured data detected']
      };
    }
    
    const schemas = [];
    const allIssues = [];
    
    for (const jsonLD of jsonLdBlocks) {
      const validation = validateSchema(jsonLD);
      
      schemas.push({
        type: jsonLD['@type'],
        valid: validation.errors.length === 0,
        data: jsonLD,
        errors: validation.errors,
        warnings: validation.warnings
      });
      
      allIssues.push(...validation.errors, ...validation.warnings);
    }
    
    // Determine page type and check required schemas
    const urlPath = new URL(url).pathname;
    let pageType = 'other';
    let requiredSchemas = [];
    
    if (urlPath === '/') {
      pageType = 'home';
      requiredSchemas = CONFIG.validation.requiredSchemas.home;
    } else if (urlPath.includes('/posts/') && !urlPath.endsWith('/')) {
      pageType = 'article';
      requiredSchemas = CONFIG.validation.requiredSchemas.article;
    } else if (urlPath.includes('/posts/')) {
      pageType = 'section';
      requiredSchemas = CONFIG.validation.requiredSchemas.section;
    } else if (urlPath.includes('/tags/') || urlPath.includes('/categories/')) {
      pageType = 'taxonomy';
      requiredSchemas = CONFIG.validation.requiredSchemas.taxonomy;
    }
    
    // Check for missing required schemas
    const foundTypes = schemas.map(s => s.type);
    const missingSchemas = requiredSchemas.filter(required => !foundTypes.includes(required));
    
    if (missingSchemas.length > 0) {
      allIssues.push(`Missing required schemas for ${pageType} page: ${missingSchemas.join(', ')}`);
    }
    
    return {
      url,
      pageType,
      success: allIssues.filter(issue => schemas.some(s => s.errors.includes(issue))).length === 0,
      schemas,
      foundTypes,
      requiredSchemas,
      missingSchemas,
      issues: allIssues
    };
    
  } catch (error) {
    return {
      url,
      success: false,
      error: error.message,
      schemas: [],
      issues: [error.message]
    };
  }
}

/**
 * Generate validation report
 */
function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  console.log('\n📊 Structured Data Validation Report');
  console.log('=' .repeat(50));
  
  let totalSchemas = 0;
  let validSchemas = 0;
  let totalIssues = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`\n${status} ${result.url}`);
    console.log(`   Page Type: ${result.pageType || 'unknown'}`);
    
    if (result.schemas && result.schemas.length > 0) {
      console.log(`   Schemas Found: ${result.foundTypes.join(', ')}`);
      
      result.schemas.forEach(schema => {
        totalSchemas++;
        if (schema.valid) validSchemas++;
        
        const schemaStatus = schema.valid ? '✅' : '❌';
        console.log(`   ${schemaStatus} ${schema.type}`);
        
        if (schema.errors.length > 0) {
          schema.errors.forEach(error => {
            console.log(`      ❌ ${error}`);
            totalIssues++;
          });
        }
        
        if (schema.warnings.length > 0) {
          schema.warnings.forEach(warning => {
            console.log(`      ⚠️  ${warning}`);
            totalIssues++;
          });
        }
      });
    }
    
    if (result.missingSchemas && result.missingSchemas.length > 0) {
      console.log(`   ⚠️  Missing: ${result.missingSchemas.join(', ')}`);
      totalIssues += result.missingSchemas.length;
    }
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
      totalIssues++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 Summary:`);
  console.log(`   Total URLs: ${results.length}`);
  console.log(`   Successful: ${results.filter(r => r.success).length}`);
  console.log(`   Total Schemas: ${totalSchemas}`);
  console.log(`   Valid Schemas: ${validSchemas}`);
  console.log(`   Total Issues: ${totalIssues}`);
  
  const allPassed = results.every(r => r.success) && totalIssues === 0;
  console.log(`\n${allPassed ? '🎉' : '⚠️'} ${allPassed ? 'All validations passed!' : 'Issues found - see details above'}`);
  
  return {
    timestamp,
    results,
    summary: {
      totalUrls: results.length,
      successfulUrls: results.filter(r => r.success).length,
      totalSchemas,
      validSchemas,
      totalIssues,
      allPassed
    }
  };
}

/**
 * Save validation report
 */
async function saveReport(report) {
  try {
    await fs.mkdir(CONFIG.output.directory, { recursive: true });
    
    const filename = `structured-data-${report.timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(CONFIG.output.directory, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Report saved to: ${filepath}`);
    
    // Also save latest report
    const latestPath = path.join(CONFIG.output.directory, 'latest.json');
    await fs.writeFile(latestPath, JSON.stringify(report, null, 2));
    console.log(`💾 Latest report saved to: ${latestPath}`);
    
  } catch (error) {
    console.error('❌ Failed to save report:', error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔍 Starting Structured Data Validation...\n');
  
  try {
    const results = [];
    
    for (const url of CONFIG.testUrls) {
      const result = await analyzePage(url);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const report = generateReport(results);
    await saveReport(report);
    
    // Exit with appropriate code
    process.exit(report.summary.allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Handle CLI arguments
if (process.argv.length > 2) {
  const customUrl = process.argv[2];
  if (customUrl.startsWith('http')) {
    CONFIG.testUrls = [customUrl];
    console.log(`🎯 Running validation for custom URL: ${customUrl}`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { analyzePage, generateReport, CONFIG };