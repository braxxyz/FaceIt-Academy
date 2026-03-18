const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/data', (req, res) => {
    res.json({ mensaje: "Servidor funcionando 🔥" });
});

app.listen(3000, () => {
    console.log('Servidor en http://localhost:3000');
});