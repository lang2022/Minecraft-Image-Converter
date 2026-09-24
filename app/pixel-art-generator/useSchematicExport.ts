'use client';

import { useCallback, useState } from 'react';
import { exportLitematic, exportMcstructure, exportSchem, type PixelGrid } from '@/lib/export';

export type SchematicFormat = 'schem' | 'litematic' | 'mcstructure';

const FORMAT_META: Record<SchematicFormat, { extension: string; mime: string }> = {
  schem: { extension: 'schem', mime: 'application/octet-stream' },
  litematic: { extension: 'litematic', mime: 'application/octet-stream' },
  mcstructure: { extension: 'mcstructure', mime: 'application/octet-stream' },
};

export function useSchematicExport() {
  const [busyFormat, setBusyFormat] = useState<SchematicFormat | null>(null);

  const downloadSchematic = useCallback(
    async (format: SchematicFormat, grid: PixelGrid, baseName: string) => {
      setBusyFormat(format);
      try {
        let bytes: Uint8Array;
        if (format === 'schem') {
          bytes = exportSchem(grid, { name: baseName });
        } else if (format === 'litematic') {
          bytes = exportLitematic(grid, { name: baseName });
        } else {
          bytes = exportMcstructure(grid);
        }

        const meta = FORMAT_META[format];
        const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: meta.mime });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${baseName}.${meta.extension}`;
        anchor.click();
        URL.revokeObjectURL(url);
      } finally {
        setBusyFormat(null);
      }
    },
    [],
  );

  return { downloadSchematic, busyFormat };
}
