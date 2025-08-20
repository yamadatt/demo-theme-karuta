#!/usr/bin/env node

/**
 * Core Web Vitals monitoring script using Lighthouse
 * Automatically measures LCP, FID, CLS and other performance metrics
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  urls: [
    'http://localhost:1313',
    'http://localhost:1313/posts/',
    'http://localhost:1313/posts/hyakunin-isshu-001-tenji/'
  ],
  output: {
    directory: './performance-reports',
    format: 'json' // json, html, csv
  },
  lighthouse: {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: null, // Will be set by Chrome launcher
    chromeFlags: ['--headless', '--no-sandbox']
  },
  thresholds: {
    performance: 90,
    lcp: 2.5, // seconds
    fid: 100, // milliseconds
    cls: 0.1   // score
  }
};

/**
 * Launch Chrome and get port
 */
async function launchChrome() {
  console.log('🚀 Launching Chrome...');
  const chrome = await chromeLauncher.launch({
    chromeFlags: CONFIG.lighthouse.chromeFlags
  });
  CONFIG.lighthouse.port = chrome.port;
  return chrome;
}

/**
 * Run Lighthouse audit on a single URL
 */
async function runAudit(url) {
  console.log(`📊 Auditing: ${url}`);
  
  try {
    const runnerResult = await lighthouse(url, CONFIG.lighthouse);
    
    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Failed to get audit results');
    }

    const lhr = runnerResult.lhr;
    
    // Extract Core Web Vitals
    const metrics = {
      url: url,
      timestamp: new Date().toISOString(),
      performance: {
        score: Math.round(lhr.categories.performance.score * 100),
        scoreDisplayValue: `${Math.round(lhr.categories.performance.score * 100)}/100`
      },
      coreWebVitals: {
        lcp: {
          value: lhr.audits['largest-contentful-paint']?.numericValue,
          displayValue: lhr.audits['largest-contentful-paint']?.displayValue,
          score: lhr.audits['largest-contentful-paint']?.score
        },
        fid: {
          value: lhr.audits['max-potential-fid']?.numericValue,
          displayValue: lhr.audits['max-potential-fid']?.displayValue,
          score: lhr.audits['max-potential-fid']?.score
        },
        cls: {
          value: lhr.audits['cumulative-layout-shift']?.numericValue,
          displayValue: lhr.audits['cumulative-layout-shift']?.displayValue,
          score: lhr.audits['cumulative-layout-shift']?.score
        }
      },
      otherMetrics: {
        fcp: {
          value: lhr.audits['first-contentful-paint']?.numericValue,
          displayValue: lhr.audits['first-contentful-paint']?.displayValue
        },
        si: {
          value: lhr.audits['speed-index']?.numericValue,
          displayValue: lhr.audits['speed-index']?.displayValue
        },
        tti: {
          value: lhr.audits['interactive']?.numericValue,
          displayValue: lhr.audits['interactive']?.displayValue
        }
      }
    };

    return metrics;
  } catch (error) {
    console.error(`❌ Failed to audit ${url}:`, error.message);
    return null;
  }
}

/**
 * Check if metrics meet thresholds
 */
function checkThresholds(metrics) {
  const issues = [];
  
  if (metrics.performance.score < CONFIG.thresholds.performance) {
    issues.push(`Performance score (${metrics.performance.score}) below threshold (${CONFIG.thresholds.performance})`);
  }
  
  const lcpSeconds = metrics.coreWebVitals.lcp.value / 1000;
  if (lcpSeconds > CONFIG.thresholds.lcp) {
    issues.push(`LCP (${lcpSeconds.toFixed(2)}s) above threshold (${CONFIG.thresholds.lcp}s)`);
  }
  
  const fidMs = metrics.coreWebVitals.fid.value;
  if (fidMs > CONFIG.thresholds.fid) {
    issues.push(`FID (${fidMs}ms) above threshold (${CONFIG.thresholds.fid}ms)`);
  }
  
  if (metrics.coreWebVitals.cls.value > CONFIG.thresholds.cls) {
    issues.push(`CLS (${metrics.coreWebVitals.cls.value}) above threshold (${CONFIG.thresholds.cls})`);
  }
  
  return issues;
}

/**
 * Generate performance report
 */
function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('\n📈 Performance Report');
  console.log('=' .repeat(50));
  
  let allPassed = true;
  
  results.forEach(result => {
    if (!result) return;
    
    console.log(`\n🌐 URL: ${result.url}`);
    console.log(`⚡ Performance Score: ${result.performance.scoreDisplayValue}`);
    console.log(`🎯 LCP: ${result.coreWebVitals.lcp.displayValue}`);
    console.log(`⚡ FID: ${result.coreWebVitals.fid.displayValue}`);
    console.log(`📐 CLS: ${result.coreWebVitals.cls.displayValue}`);
    console.log(`🎨 FCP: ${result.otherMetrics.fcp.displayValue}`);
    console.log(`🚀 Speed Index: ${result.otherMetrics.si.displayValue}`);
    console.log(`🎮 TTI: ${result.otherMetrics.tti.displayValue}`);
    
    const issues = checkThresholds(result);
    if (issues.length > 0) {
      allPassed = false;
      console.log(`\n⚠️  Issues found:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log(`\n✅ All thresholds passed!`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(allPassed ? '🎉 All URLs passed performance thresholds!' : '⚠️  Some URLs need optimization');
  
  return {
    timestamp,
    results,
    allPassed,
    summary: {
      totalUrls: results.filter(r => r).length,
      passedUrls: results.filter(r => r && checkThresholds(r).length === 0).length
    }
  };
}

/**
 * Save report to file
 */
async function saveReport(report) {
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.output.directory, { recursive: true });
    
    const filename = `performance-${report.timestamp}.json`;
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
  console.log('🔍 Starting Core Web Vitals audit...\n');
  
  let chrome;
  
  try {
    // Launch Chrome
    chrome = await launchChrome();
    
    // Run audits for all URLs
    const results = [];
    for (const url of CONFIG.urls) {
      const result = await runAudit(url);
      results.push(result);
      
      // Small delay between audits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate and save report
    const report = generateReport(results);
    await saveReport(report);
    
    // Exit with appropriate code
    process.exit(report.allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
      console.log('🔒 Chrome closed');
    }
  }
}

// Handle CLI arguments
if (process.argv.length > 2) {
  const customUrl = process.argv[2];
  if (customUrl.startsWith('http')) {
    CONFIG.urls = [customUrl];
    console.log(`🎯 Running audit for custom URL: ${customUrl}`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { runAudit, generateReport, CONFIG };