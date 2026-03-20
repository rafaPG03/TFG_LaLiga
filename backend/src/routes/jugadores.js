const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/', async (req, res) => {
    try{
        const idEquipo = req.query.id_equipo;

        const query = `
        SELECT j.nombre, j.edad, j.altura, j.peso, j.foto_url
        FROM dim_jugador j
        
        `;
    }
})