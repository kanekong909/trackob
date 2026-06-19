const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 4200;
const DIST = path.join(__dirname, 'dist/trackob/browser');

app.use(express.static(DIST));

// SPA routing — todas las rutas apuntan al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TrackOb corriendo en puerto ${PORT}`);
});
