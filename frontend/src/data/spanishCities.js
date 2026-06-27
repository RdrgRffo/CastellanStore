// Datos de ciudades españolas con provincia y código postal
// Formato: { ciudad, provincia, codigoPostal }

const spanishCities = [
  // Madrid
  { ciudad: 'Madrid', provincia: 'Madrid', codigoPostal: '28001' },
  { ciudad: 'Alcalá de Henares', provincia: 'Madrid', codigoPostal: '28801' },
  { ciudad: 'Alcobendas', provincia: 'Madrid', codigoPostal: '28100' },
  { ciudad: 'Alcorcón', provincia: 'Madrid', codigoPostal: '28921' },
  { ciudad: 'Boadilla del Monte', provincia: 'Madrid', codigoPostal: '28660' },
  { ciudad: 'Coslada', provincia: 'Madrid', codigoPostal: '28820' },
  { ciudad: 'Fuenlabrada', provincia: 'Madrid', codigoPostal: '28940' },
  { ciudad: 'Getafe', provincia: 'Madrid', codigoPostal: '28901' },
  { ciudad: 'Leganés', provincia: 'Madrid', codigoPostal: '28910' },
  { ciudad: 'Majadahonda', provincia: 'Madrid', codigoPostal: '28220' },
  { ciudad: 'Móstoles', provincia: 'Madrid', codigoPostal: '28930' },
  { ciudad: 'Pozuelo de Alarcón', provincia: 'Madrid', codigoPostal: '28223' },
  { ciudad: 'Rivas-Vaciamadrid', provincia: 'Madrid', codigoPostal: '28521' },
  { ciudad: 'San Sebastián de los Reyes', provincia: 'Madrid', codigoPostal: '28701' },
  { ciudad: 'Torrejón de Ardoz', provincia: 'Madrid', codigoPostal: '28850' },
  { ciudad: 'Tres Cantos', provincia: 'Madrid', codigoPostal: '28760' },

  // Barcelona
  { ciudad: 'Barcelona', provincia: 'Barcelona', codigoPostal: '08001' },
  { ciudad: 'Badalona', provincia: 'Barcelona', codigoPostal: '08910' },
  { ciudad: 'Cornellà de Llobregat', provincia: 'Barcelona', codigoPostal: '08940' },
  { ciudad: 'Esplugues de Llobregat', provincia: 'Barcelona', codigoPostal: '08950' },
  { ciudad: 'Gavà', provincia: 'Barcelona', codigoPostal: '08850' },
  { ciudad: 'Hospitalet de Llobregat', provincia: 'Barcelona', codigoPostal: '08901' },
  { ciudad: 'Mataró', provincia: 'Barcelona', codigoPostal: '08301' },
  { ciudad: 'Sabadell', provincia: 'Barcelona', codigoPostal: '08201' },
  { ciudad: 'Sant Cugat del Vallès', provincia: 'Barcelona', codigoPostal: '08172' },
  { ciudad: 'Santa Coloma de Gramenet', provincia: 'Barcelona', codigoPostal: '08920' },
  { ciudad: 'Terrassa', provincia: 'Barcelona', codigoPostal: '08221' },

  // Valencia
  { ciudad: 'Valencia', provincia: 'Valencia', codigoPostal: '46001' },
  { ciudad: 'Alzira', provincia: 'Valencia', codigoPostal: '46600' },
  { ciudad: 'Gandía', provincia: 'Valencia', codigoPostal: '46700' },
  { ciudad: 'Paterna', provincia: 'Valencia', codigoPostal: '46980' },
  { ciudad: 'Sagunto', provincia: 'Valencia', codigoPostal: '46500' },
  { ciudad: 'Torrent', provincia: 'Valencia', codigoPostal: '46900' },

  // Sevilla
  { ciudad: 'Sevilla', provincia: 'Sevilla', codigoPostal: '41001' },
  { ciudad: 'Alcalá de Guadaíra', provincia: 'Sevilla', codigoPostal: '41500' },
  { ciudad: 'Dos Hermanas', provincia: 'Sevilla', codigoPostal: '41700' },
  { ciudad: 'Mairena del Aljarafe', provincia: 'Sevilla', codigoPostal: '41927' },

  // Bilbao
  { ciudad: 'Bilbao', provincia: 'Vizcaya', codigoPostal: '48001' },
  { ciudad: 'Barakaldo', provincia: 'Vizcaya', codigoPostal: '48901' },
  { ciudad: 'Getxo', provincia: 'Vizcaya', codigoPostal: '48990' },

  // Málaga
  { ciudad: 'Málaga', provincia: 'Málaga', codigoPostal: '29001' },
  { ciudad: 'Marbella', provincia: 'Málaga', codigoPostal: '29600' },
  { ciudad: 'Fuengirola', provincia: 'Málaga', codigoPostal: '29640' },

  // Zaragoza
  { ciudad: 'Zaragoza', provincia: 'Zaragoza', codigoPostal: '50001' },

  // Murcia
  { ciudad: 'Murcia', provincia: 'Murcia', codigoPostal: '30001' },
  { ciudad: 'Cartagena', provincia: 'Murcia', codigoPostal: '30201' },

  // Palma de Mallorca
  { ciudad: 'Palma de Mallorca', provincia: 'Islas Baleares', codigoPostal: '07001' },

  // Las Palmas (Gran Canaria)
  { ciudad: 'Las Palmas de Gran Canaria', provincia: 'Las Palmas', codigoPostal: '35001' },
  { ciudad: 'Telde', provincia: 'Las Palmas', codigoPostal: '35200' },
  { ciudad: 'Santa Lucía de Tirajana', provincia: 'Las Palmas', codigoPostal: '35110' },
  { ciudad: 'San Bartolomé de Tirajana', provincia: 'Las Palmas', codigoPostal: '35100' },
  { ciudad: 'Arucas', provincia: 'Las Palmas', codigoPostal: '35400' },
  { ciudad: 'Gáldar', provincia: 'Las Palmas', codigoPostal: '35460' },
  { ciudad: 'Ingenio', provincia: 'Las Palmas', codigoPostal: '35250' },
  { ciudad: 'Agüimes', provincia: 'Las Palmas', codigoPostal: '35260' },

  // Santa Cruz de Tenerife
  { ciudad: 'Santa Cruz de Tenerife', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38001' },
  { ciudad: 'San Cristóbal de La Laguna', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38201' },
  { ciudad: 'Arona', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38640' },
  { ciudad: 'Adeje', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38670' },
  { ciudad: 'La Orotava', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38300' },
  { ciudad: 'Los Realejos', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38410' },
  { ciudad: 'Puerto de la Cruz', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38400' },
  { ciudad: 'Granadilla de Abona', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38600' },
  { ciudad: 'San Miguel de Abona', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38620' },

  // Lanzarote (Las Palmas)
  { ciudad: 'Arrecife', provincia: 'Las Palmas', codigoPostal: '35500' },
  { ciudad: 'Tías', provincia: 'Las Palmas', codigoPostal: '35572' },
  { ciudad: 'Yaiza', provincia: 'Las Palmas', codigoPostal: '35570' },

  // Fuerteventura (Las Palmas)
  { ciudad: 'Puerto del Rosario', provincia: 'Las Palmas', codigoPostal: '35600' },
  { ciudad: 'Corralejo', provincia: 'Las Palmas', codigoPostal: '35660' },

  // La Palma (Santa Cruz de Tenerife)
  { ciudad: 'Santa Cruz de La Palma', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38700' },
  { ciudad: 'Los Llanos de Aridane', provincia: 'Santa Cruz de Tenerife', codigoPostal: '38760' },

  // Alicante
  { ciudad: 'Alicante', provincia: 'Alicante', codigoPostal: '03001' },
  { ciudad: 'Elche', provincia: 'Alicante', codigoPostal: '03201' },
  { ciudad: 'Benidorm', provincia: 'Alicante', codigoPostal: '03501' },

  // Granada
  { ciudad: 'Granada', provincia: 'Granada', codigoPostal: '18001' },

  // Valladolid
  { ciudad: 'Valladolid', provincia: 'Valladolid', codigoPostal: '47001' },

  // Córdoba
  { ciudad: 'Córdoba', provincia: 'Córdoba', codigoPostal: '14001' },

  // San Sebastián
  { ciudad: 'San Sebastián', provincia: 'Guipúzcoa', codigoPostal: '20001' },

  // Oviedo
  { ciudad: 'Oviedo', provincia: 'Asturias', codigoPostal: '33001' },
  { ciudad: 'Gijón', provincia: 'Asturias', codigoPostal: '33201' },

  // Pamplona
  { ciudad: 'Pamplona', provincia: 'Navarra', codigoPostal: '31001' },

  // Santander
  { ciudad: 'Santander', provincia: 'Cantabria', codigoPostal: '39001' },

  // Toledo
  { ciudad: 'Toledo', provincia: 'Toledo', codigoPostal: '45001' },

  // Salamanca
  { ciudad: 'Salamanca', provincia: 'Salamanca', codigoPostal: '37001' },

  // Vigo
  { ciudad: 'Vigo', provincia: 'Pontevedra', codigoPostal: '36201' },
  { ciudad: 'Santiago de Compostela', provincia: 'La Coruña', codigoPostal: '15701' },
  { ciudad: 'La Coruña', provincia: 'La Coruña', codigoPostal: '15001' },
];

export default spanishCities;

export function getCityData(ciudad) {
  return spanishCities.find(c => c.ciudad === ciudad) || null;
}

export function getProvincias() {
  const provincias = [...new Set(spanishCities.map(c => c.provincia))];
  return provincias.sort();
}

export function getCiudadesByProvincia(provincia) {
  return spanishCities.filter(c => c.provincia === provincia).map(c => c.ciudad);
}
