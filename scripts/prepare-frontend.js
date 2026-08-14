const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'frontend', 'vendor');
const arquivos = [
  {
    origem: path.join(raiz, 'backend', 'node_modules', 'qrcodejs', 'qrcode.min.js'),
    destino: path.join(destino, 'qrcode.min.js')
  },
  {
    origem: path.join(raiz, 'backend', 'node_modules', 'html5-qrcode', 'html5-qrcode.min.js'),
    destino: path.join(destino, 'html5-qrcode.min.js')
  }
];

fs.mkdirSync(destino, { recursive: true });

for (const arquivo of arquivos) {
  if (!fs.existsSync(arquivo.origem)) {
    throw new Error(`Dependencia nao encontrada: ${arquivo.origem}. Execute npm ci na pasta backend.`);
  }
  fs.copyFileSync(arquivo.origem, arquivo.destino);
}

console.log('Bibliotecas de QR Code preparadas em frontend/vendor.');
