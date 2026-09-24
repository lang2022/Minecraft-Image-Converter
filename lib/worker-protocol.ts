export type ConversionJobRequest = {
  type: 'convert-image';
  width: number;
  height: number;
  dithering: boolean;
  imageData: ImageData;
  excludedCategories?: string[];
};

export type ConversionJobResponse =
  | {
      type: 'progress';
      value: number;
      message: string;
    }
  | {
      type: 'result';
      pixels: Array<{ x: number; y: number; blockId: string; blockName: string; color: string }>;
      materialList: Array<{ id: string; name: string; count: number }>;
      width: number;
      height: number;
    }
  | {
      type: 'error';
      message: string;
    };
