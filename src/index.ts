import { GUI } from 'dat.gui'
declare var dat: any;

class AsciiArtGenerator {
  settings = {
    charSet: ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    charRegions: 1,
  };

  constructor() {
    const gui: GUI = new dat.GUI();
    gui.add(this.settings, 'charSet').onChange(this.analyzeCharSet);
    gui.add(this.settings, 'charRegions').onChange(this.analyzeCharSet);
    this.analyzeCharSet();
  }

  analyzeCharSet() {
    console.log('Tough work');
  }
}

const generator = new AsciiArtGenerator();
console.log(generator);

