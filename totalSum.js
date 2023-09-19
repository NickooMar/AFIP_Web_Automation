import fs from "fs";


function sumarNumerosPorBloque(data) {
    const bloques = data.split('----').filter(item => item.trim() !== '');
  
    for (let i = 0; i < bloques.length; i++) {
      const bloque = bloques[i].trim();
      const lines = bloque.split('\n').filter(line => line.trim() !== '');
  
      // Skip if lines are less than 2 (name and amount line)
      if (lines.length < 2) {
        console.log(`Skipping block ${i + 1} due to incorrect format.`);
        continue;
      }
  
      const nombre = lines[0];
      const montoInicial = parseFloat(lines[1].split(' ')[4]);
      let suma = montoInicial;
  
      for (let j = 2; j < lines.length; j++) {
        const monto = parseFloat(lines[j]);
        if (!isNaN(monto)) {
          suma += monto;
        }
      }
  
      console.log(`Nombre: ${nombre}`);
      console.log(`Suma del bloque ${i + 1}: ${suma.toFixed(2)}`);
      console.log('---');
    }
  }
  
  function leerArchivo(nombreArchivo) {
    fs.readFile(nombreArchivo, 'utf8', (err, data) => {
      if (err) {
        console.error('Error al leer el archivo:', err);
        return;
      }
  
      sumarNumerosPorBloque(data);
    });
  }
  
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Por favor, proporciona la ruta del archivo como argumento.');
    process.exit(1);
  }
  
  const nombreArchivo = args[0];
  leerArchivo(nombreArchivo);