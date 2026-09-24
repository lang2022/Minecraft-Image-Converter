import { serializeMaterialList } from '@/lib/conversion';
import { demoPaletteManifest } from '@/lib/palette';

export async function GET() {
  return Response.json({
    ok: true,
    formats: ['png', 'csv', '.schem', '.litematic', '.mcstructure'],
    paletteVersion: demoPaletteManifest.version,
    materialListExample: serializeMaterialList({
      width: 1,
      height: 1,
      pixels: [],
      materialList: [{ id: 'minecraft:stone', name: 'Stone', count: 1 }],
    }),
  });
}
