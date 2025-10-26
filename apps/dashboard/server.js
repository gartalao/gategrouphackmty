const express = require('express');
const path = require('path');

const app = express();
const PORT = 3003;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Smart Trolley Dashboard',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Smart Trolley Dashboard');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Dashboard running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket connecting to ws://localhost:3001/ws`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Features:');
  console.log('   • Real-time product detection');
  console.log('   • Sales inventory tracking');
  console.log('   • Product checklist');
  console.log('   • WebSocket integration');
  console.log('');
  console.log('🌐 Open: http://localhost:3003');
  console.log('');
});
