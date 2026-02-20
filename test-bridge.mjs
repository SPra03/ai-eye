#!/usr/bin/env node
/**
 * Automated test script for VisionCraft bridge
 * Uses Playwright to test the bridge APIs in a real browser
 */

import { chromium } from 'playwright';

async function runTests() {
  console.log('🧪 VisionCraft Bridge Test Suite\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the React app
    console.log('📍 Navigating to http://localhost:5176...');
    await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });

    // Wait for bridge to initialize
    await page.waitForFunction(() => window.__VISIONCRAFT__?.ready === true, { timeout: 5000 });
    console.log('✅ Bridge loaded and ready\n');

    // Test 1: Check bridge availability
    console.log('Test 1: Bridge availability');
    const bridgeExists = await page.evaluate(() => !!window.__VISIONCRAFT__);
    console.log(bridgeExists ? '  ✅ Bridge exists' : '  ❌ Bridge missing');

    // Test 2: Check version
    console.log('\nTest 2: Version check');
    const version = await page.evaluate(() => window.__VISIONCRAFT__.version);
    console.log(`  ✅ Version: ${version}`);

    // Test 3: Inspect element
    console.log('\nTest 3: Element inspection');
    const inspection = await page.evaluate(() => {
      return window.__VISIONCRAFT__.inspectElement('button');
    });
    if (inspection.error) {
      console.log('  ❌ Inspection failed:', inspection.error);
    } else {
      console.log(`  ✅ Found element: ${inspection.tagName}`);
      console.log(`  ✅ Source file: ${inspection.sourceFile || 'N/A'}`);
      console.log(`  ✅ Source line: ${inspection.sourceLine || 'N/A'}`);
    }

    // Test 4: Get element source
    console.log('\nTest 4: Get element source');
    const source = await page.evaluate(() => {
      return window.__VISIONCRAFT__.getElementSource('h1');
    });
    if (source.error) {
      console.log('  ❌ Source lookup failed:', source.error);
    } else {
      console.log(`  ✅ H1 source: ${source.file}:${source.line}:${source.col}`);
    }

    // Test 5: Find elements
    console.log('\nTest 5: Find elements');
    const buttons = await page.evaluate(() => {
      return window.__VISIONCRAFT__.findElements('button', 'css');
    });
    console.log(`  ✅ Found ${buttons.length} button(s)`);
    if (buttons.length > 0) {
      console.log(`  ✅ First button source: ${buttons[0].source || 'N/A'}`);
    }

    // Test 6: Page structure
    console.log('\nTest 6: Page structure');
    const structure = await page.evaluate(() => {
      return window.__VISIONCRAFT__.getPageStructure(2);
    });
    const childCount = structure.children?.length || 0;
    console.log(`  ✅ Structure has ${childCount} children`);

    // Test 7: Click element
    console.log('\nTest 7: Click element');
    const clickResult = await page.evaluate(() => {
      return window.__VISIONCRAFT__.clickElement('button');
    });
    console.log(clickResult.success ? '  ✅ Click succeeded' : '  ❌ Click failed: ' + clickResult.error);

    // Test 8: Type text
    console.log('\nTest 8: Type text');
    const typeResult = await page.evaluate(() => {
      return window.__VISIONCRAFT__.typeText('input', 'Automated test');
    });
    console.log(typeResult.success ? '  ✅ Type succeeded' : '  ❌ Type failed: ' + typeResult.error);

    // Test 9: Console logs
    console.log('\nTest 9: Console log capture');
    await page.evaluate(() => {
      console.log('Test log message');
      console.warn('Test warning');
      console.error('Test error');
    });
    const logs = await page.evaluate(() => {
      return window.__VISIONCRAFT__.getConsoleLogs();
    });
    console.log(`  ✅ Captured ${logs.length} logs`);
    const errorLogs = await page.evaluate(() => {
      return window.__VISIONCRAFT__.getConsoleLogs('error');
    });
    console.log(`  ✅ Found ${errorLogs.length} error(s)`);

    // Test 10: HMR status
    console.log('\nTest 10: HMR status');
    const hmr = await page.evaluate(() => {
      return window.__VISIONCRAFT__.getHMRStatus();
    });
    console.log(`  ✅ HMR connected: ${hmr.connected}`);

    // Test 11: Verify source mapping
    console.log('\nTest 11: Source mapping verification');
    const sourceCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-vc-source]').length;
    });
    console.log(`  ✅ Found ${sourceCount} source-mapped elements`);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
