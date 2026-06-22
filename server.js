const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos desde la carpeta de distribución
app.use(express.static(path.join(__dirname, 'dist')));

// Manejar todas las rutas - el comodín debe tener un nombre
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
