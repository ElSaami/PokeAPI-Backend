const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

app.get('/api/pokemon/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
    res.json(response.data);
  } catch (error) {
    res.status(404).json({ error: 'Pokémon no encontrado' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});

app.get('/api/evolution/:name', async (req, res) => {
    try {
      const { name } = req.params;
  
      // 1. Obtener species y la URL de evolución
      const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${name.toLowerCase()}`);
      const evolutionUrl = speciesRes.data.evolution_chain.url;
  
      // 2. Obtener la cadena evolutiva completa
      const evolutionRes = await axios.get(evolutionUrl);
      const chain = evolutionRes.data.chain;
  
      // 3. Recorrer todas las ramas evolutivas
      const evolutionNames = [];
  
      const traverseChain = (node) => {
        evolutionNames.push(node.species.name);
        node.evolves_to.forEach((evo) => traverseChain(evo)); // recursividad para todas las ramas
      };
  
      traverseChain(chain);
  
      // 4. Obtener datos de cada evolución
      const evolutionData = await Promise.all(
        evolutionNames.map(async (pokeName) => {
          const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeName}`);
          return {
            name: pokeRes.data.name,
            id: pokeRes.data.id,
            sprite: pokeRes.data.sprites.front_default
          };
        })
      );
  
      // Ordenar por ID (opcional)
      const sortedEvolutionData = evolutionData.sort((a, b) => a.id - b.id);
  
      res.json(sortedEvolutionData);
    } catch (error) {
      console.error('Error al obtener evolución:', error.message);
      res.status(500).json({ error: 'Error al obtener evolución' });
    }
  });

  app.get('/api/pokemon-info/:name', async (req, res) => {
    try {
      const { name } = req.params;
  
      // 1. Obtener datos básicos del Pokémon
      const pokemonRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
      const pokemonData = pokemonRes.data;
  
      // 2. Obtener datos adicionales desde species
      const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${name.toLowerCase()}`);
      const speciesData = speciesRes.data;
  
      // 3. Obtener descripción en español
      const flavorText = speciesData.flavor_text_entries.find(
        (entry) => entry.language.name === 'es'
      );
  
      // 4. Crear respuesta combinada
      const result = {
        id: pokemonData.id,
        name: pokemonData.name,
        types: pokemonData.types,
        height: pokemonData.height,
        weight: pokemonData.weight,
        stats: pokemonData.stats,
        abilities: pokemonData.abilities,
        sprite: pokemonData.sprites.front_default,
        egg_groups: speciesData.egg_groups.map((g) => g.name),
        habitat: speciesData.habitat?.name || 'desconocido',
        color: speciesData.color.name,
        description: flavorText?.flavor_text || 'Descripción no disponible.',
      };
  
      res.json(result);
    } catch (error) {
      console.error('Error al obtener información extendida:', error.message);
      res.status(500).json({ error: 'No se pudo obtener la información del Pokémon' });
    }
  });
  
  