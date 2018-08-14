import { GUI } from 'dat.gui'
declare var dat: any;
interface Dict<T> {
  [key: string]: T;
}

class AsciiArtGenerator {
  settings = {
    charSet: ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    charRegions: 1,
  };
  debug = false;
  charRegions: Dict<number[]> = {};

  constructor() {
    const gui: GUI = new dat.GUI();
    gui.add(this.settings, 'charSet').onChange(() => this.analyzeCharSet());
    gui.add(this.settings, 'charRegions', 1, 4, 1).onChange(() => this.analyzeCharSet());
    this.analyzeCharSet();
  }

  analyzeChar(char: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw 'context creation failed';
    ctx.font = '12px monospace';
    ctx.fillText(char, 2, 10);
    const data = ctx.getImageData(0, 0, 12, 12).data;
    const values: number[] = [];
    const size = 12 / this.settings.charRegions;
    for (let cellY = 0; cellY < this.settings.charRegions; cellY += 1) {
      for (let cellX = 0; cellX < this.settings.charRegions; cellX += 1) {
        let value = 0;
        for (let posX = 0; posX < size; posX += 1) {
          for (let posY = 0; posY < size; posY += 1) {
            value += data[(cellX * size + posX + (cellY * size + posY) * 12) * 4 + 3];
          }
        }
        values.push(value / (size * size) / 255);
      }
    }
    if (this.debug) {
      document.body.appendChild(canvas);
      for (let cellX = 0; cellX < this.settings.charRegions; cellX += 1) {
        for (let cellY = 0; cellY < this.settings.charRegions; cellY += 1) {
          ctx.fillStyle = `rgba(255, 0, 255, ${values[cellX + cellY * this.settings.charRegions]})`;
          ctx.fillRect(cellX * size, cellY * size, size, size);
        }
      }
      console.log(char, values);
    }
    this.charRegions[char] = values;
  }

  analyzeCharSet() {
    console.log('Tough work');
    for (const char of this.settings.charSet) {
      this.analyzeChar(char);
    }
  }
}

const generator = new AsciiArtGenerator();
console.log(generator);

