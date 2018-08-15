import { GUI } from 'dat.gui'
declare var dat: any;
interface Dict<T> {
  [key: string]: T;
}

class AsciiArtGenerator {
  settings = {
    charSet: ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    url: '/avatar.png',
    charSamples: 1,
    size: 100,
  };
  debug = true;
  charRegions: Dict<number[]> = {};

  constructor() {
    const gui: GUI = new dat.GUI();
    gui.add(this.settings, 'charSet').onChange(() => this.analyzeCharRegions());
    gui.add(this.settings, 'charSamples', 1, 4, 1).onChange(() => this.analyzeCharRegions());
    this.analyzeCharRegions();
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
    const size = 12 / this.settings.charSamples;
    for (let cellY = 0; cellY < this.settings.charSamples; cellY += 1) {
      for (let cellX = 0; cellX < this.settings.charSamples; cellX += 1) {
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
      for (let cellX = 0; cellX < this.settings.charSamples; cellX += 1) {
        for (let cellY = 0; cellY < this.settings.charSamples; cellY += 1) {
          ctx.fillStyle = `rgba(255, 0, 255, ${values[cellX + cellY * this.settings.charSamples]})`;
          ctx.fillRect(cellX * size, cellY * size, size, size);
        }
      }
      console.log(char, values);
    }
    this.charRegions[char] = values;
  }

  normalizeCharRegions() {
    let min = 1;
    let max = 0;
    for (const char in this.charRegions) {
      for (const region of this.charRegions[char]) {
        if (min > region) min = region;
        if (max < region) max = region;
      }
    }
    if (max > 0 && min != max) {
      const diff = max - min;
      for (const char in this.charRegions) {
        const region = this.charRegions[char];
        for (let index = 0; index < region.length; index += 1) {
          region[index] = (region[index] - min) * (1 / diff);
        }
      }
    }
    if (this.debug) {
      console.log({ min, max, charRegions: this.charRegions });
      console.log(this.charRegions);
    }
  }

  analyzeCharRegions() {
    this.charRegions = {};
    for (const char of this.settings.charSet) {
      this.analyzeChar(char);
    }
    this.normalizeCharRegions();
  }
}

const generator = new AsciiArtGenerator();
console.log(generator);

