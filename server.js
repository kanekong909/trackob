const express = require('express');
const path = require('path');
const app = express();

// Puerto - Railway asigna el puerto automáticamente
const port = process.env.PORT || 8080;

// Servir archivos estáticos de Angular
const distPath = path.join(__dirname, 'dist/trackob/browser');
app.use(express.static(distPath));

// Redirigir todas las rutas a index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📁 Serving from: ${distPath}`);
});
