export async function GET() {
  return Response.json({ ok: true, service: 'minecraft-image-converter', stage: 'M1' });
}
