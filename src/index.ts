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
    size: 50,
  };
  debug = true;
  charRegions: Dict<number[]> = {};
  valueMap: number[][] = [];
  width: number = 0;
  height: number = 0;
  cachedUrls: Dict<HTMLImageElement> = {};
  asciiElement: HTMLElement;

  constructor() {
    const gui: GUI = new dat.GUI();
    const asciiElement = document.getElementById('ascii');
    if (!asciiElement) throw '#ascii Element is missing';
    this.asciiElement = asciiElement;

    gui.add(this.settings, 'charSet').onChange(() => {
      this.analyzeCharRegions();
      this.generate();
    });
    gui.add(this.settings, 'url').onChange(() => this.loadFromUrl());
    gui.add(this.settings, 'charSamples', 1, 4, 1).onChange(() => {
      this.analyzeCharRegions();
      this.loadFromUrl();
    });
    gui.add(this.settings, 'size', 10, 300, 1).onChange(() => this.loadFromUrl());
    this.analyzeCharRegions();
    this.loadFromUrl();
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
        for (let posY = 0; posY < size; posY += 1) {
          for (let posX = 0; posX < size; posX += 1) {
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
      console.log({ char, values });
    }
    this.charRegions[char] = values;
  }

  normalizeCharRegions() {
    let min = 1;
    let max = 0;
    for (const char in this.charRegions) {
      // let value = 0;
      for (const region of this.charRegions[char]) {
        if (min > region) min = region;
        if (max < region) max = region;
        // value += region;
      }
      // value /= this.settings.charSamples * this.settings.charSamples;
      // if (min > value) min = value;
      // if (max < value) max = value;
    }
    if (max > 0 && min != max) {
      const diff = max - min;
      for (const char in this.charRegions) {
        const regions = this.charRegions[char];
        for (let index = 0; index < regions.length; index += 1) {
          regions[index] = (regions[index] - min) * (1 / diff);
        }
      }
    }
    if (this.debug) {
      console.log({ min, max, charRegions: this.charRegions });
    }
  }

  analyzeCharRegions() {
    this.charRegions = {};
    for (const char of this.settings.charSet) {
      this.analyzeChar(char);
    }
    this.normalizeCharRegions();
  }

  loadFromUrl() {
    if (this.cachedUrls[this.settings.url]) {
      this.onImageLoaded(this.cachedUrls[this.settings.url]);
    } else {
      const img = document.createElement('img');
      img.crossOrigin = 'Anonymous';
      img.src = this.settings.url;
      img.addEventListener('load', () => {
        this.cachedUrls[this.settings.url] = img;
        this.onImageLoaded(img);
      });
    }
  }

  onImageLoaded(img: HTMLImageElement) {
    console.log(img);
    this.width = this.settings.size;
    this.height = ~~((img.height / img.width) * this.width / 1.9);
    const canvas = document.createElement('canvas');
    canvas.width = this.width * this.settings.charSamples;
    canvas.height = this.height * this.settings.charSamples;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw 'context creation failed';
    ctx.drawImage(img, 0, 0, this.width * this.settings.charSamples, this.height * this.settings.charSamples);
    if (this.debug) {
      document.body.appendChild(canvas);
      console.log({ width: this.width, height: this.height });
    }
    this.generateValueMap(ctx);
  }

  generateValueMap(ctx: CanvasRenderingContext2D) {
    this.valueMap = [];
    const data = Array.from(ctx.getImageData(0, 0, this.width * this.settings.charSamples, this.height * this.settings.charSamples).data);
    const rowLength = this.width * this.settings.charSamples * 4;
    for (let cellY = 0; cellY < this.height; cellY += 1) {
      for (let cellX = 0; cellX < this.width; cellX += 1) {
        const cell = [];
        for (let posY = 0; posY < this.settings.charSamples; posY += 1) {
          for (let posX = 0; posX < this.settings.charSamples; posX += 1) {
            const pos = (cellX * this.settings.charSamples + posX) * 4 + (cellY * this.settings.charSamples + posY) * rowLength;
            const alpha = data[pos + 2] / 255;
            const values = data.slice(pos, pos + 3);
            const value = 1 - ((Math.max(...values) + Math.min(...values)) / 510 * (alpha) + 1 - alpha);
            if (this.debug) {
              ctx.fillStyle = `rgba(255, 0, 255, ${value})`;
              ctx.fillRect(cellX * this.settings.charSamples + posX, cellY * this.settings.charSamples + posY, 1, 1);
            }
            cell.push(value);
          }
        }
        this.valueMap.push(cell);
      }
    }
    if (this.debug) {
      console.log({ valueMap: this.valueMap });
    }
    this.normalizeValueMap();
  }

  normalizeValueMap() {
    let min = 1;
    let max = 0;
    for (const regions of this.valueMap) {
      // const value = 0;
      for (const region of regions) {
        if (min > region) min = region;
        if (max < region) max = region;
        // value += region;
      }
      // value /= this.settings.charSamples * this.settings.charSamples;
      // if (min > value) min = value;
      // if (max < value) max = value;
    }
    if (max > 0 && min != max) {
      const diff = max - min;
      for (const regions of this.valueMap) {
        for (let index = 0; index < regions.length; index += 1) {
          regions[index] = (regions[index] - min) * (1 / diff);
        }
      }
    }
    if (this.debug) {
      console.log({ min, max, valueMap: this.valueMap });
    }
  }
    }
    this.generate(ctx, width, height);
  }

  generate(ctx: CanvasRenderingContext2D, width: number, height: number) {
  }
}

const generator = new AsciiArtGenerator();
console.log(generator);

