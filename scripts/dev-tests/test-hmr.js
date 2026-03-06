/**
 * Test script to verify AI Eye HMR status
 * Run this in browser DevTools console at http://localhost:5175
 */

// Check if AI Eye bridge is loaded
if (window.__AIEYE__) {
  console.log('✅ AI Eye bridge is loaded');

  // Get HMR status
  const status = window.__AIEYE__.getHMRStatus();

  console.log('\n=== HMR Status ===');
  console.log('Connected:', status.connected);
  console.log('Last Update:', status.lastUpdate ? new Date(status.lastUpdate).toLocaleString() : 'None');
  console.log('Total Updates:', status.totalUpdates);
  console.log('Average Latency:', status.averageLatency + 'ms');
  console.log('Errors:', status.errors.length);

  if (status.updates && status.updates.length > 0) {
    console.log('\n=== Recent Updates ===');
    status.updates.forEach((update, i) => {
      console.log(`${i + 1}. ${update.file} (${update.type}) - ${new Date(update.timestamp).toLocaleTimeString()}`);
    });
  }

  if (status.connected) {
    console.log('\n✅ HMR IS WORKING!');
  } else {
    console.log('\n❌ HMR NOT CONNECTED');
  }
} else {
  console.error('❌ AI Eye bridge not loaded!');
}
