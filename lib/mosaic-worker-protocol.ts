export type MosaicJobRequest = {
  type: 'convert-mosaic';
  paletteId: 'lego';
  width: number;
  height: number;
  dithering: boolean;
  imageData: ImageData;
};

export type MosaicJobResponse =
  | {
      type: 'progress';
      value: number;
      message: string;
    }
  | {
      type: 'result';
      width: number;
      height: number;
      pixels: Array<{ x: number; y: number; colorId: string }>;
      colorCounts: Array<{ id: string; name: string; hex: string; count: number }>;
      totalCells: number;
    }
  | {
      type: 'error';
      message: string;
    };
