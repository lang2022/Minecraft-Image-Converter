'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { parseSchematicFile, type ParsedSchematic } from '@/lib/schematic-view';
import { demoPaletteManifest } from '@/lib/palette';

const MAX_INSTANCES = 200_000;

function colorFor(blockId: string | null): THREE.Color | null {
  if (!blockId) return null;
  const block = demoPaletteManifest.blocks.find((entry) => entry.id === blockId);
  if (!block) return null;
  return new THREE.Color(block.avgColor);
}

function buildMesh(parsed: ParsedSchematic) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial();
  const positions = [];
  const colors = [];

  const { width, height, depth, blockIds } = parsed;
  const total = width * height * depth;
  if (total > MAX_INSTANCES) throw new Error(`Too large to render (${total.toLocaleString()} blocks, limit ${MAX_INSTANCES.toLocaleString()})`);

  for (let y = 0; y < height; y += 1) {
    for (let z = 0; z < depth; z += 1) {
      for (let x = 0; x < width; x += 1) {
        const id = blockIds[x + z * width + y * width * depth];
        if (!id) continue;
        const color = colorFor(id);
        if (!color) continue;
        positions.push(x + 0.5, y + 0.5, z + 0.5);
        colors.push(color.r, color.g, color.b);
      }
    }
  }

  if (!positions.length) throw new Error('No renderable blocks found in this file.');

  const instanceMesh = new THREE.InstancedMesh(geometry, material, positions.length / 3);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < positions.length / 3; i += 1) {
    matrix.makeTranslation(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    instanceMesh.setMatrixAt(i, matrix);
    instanceMesh.setColorAt(i, new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]));
  }
  instanceMesh.instanceMatrix.needsUpdate = true;
  if (instanceMesh.instanceColor) instanceMesh.instanceColor.needsUpdate = true;
  return instanceMesh;
}

type Orbit = { azimuth: number; elevation: number; radius: number; target: THREE.Vector3 };

export function ViewerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<{ scene: THREE.Scene; renderer: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera; mesh: THREE.InstancedMesh | null; grid: THREE.GridHelper } | null>(null);
  const controlsRef = useRef<Orbit | null>(null);
  const frameRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [info, setInfo] = useState<ParsedSchematic | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState('Drop a .litematic, .schem or .mcstructure file to inspect it in 3D.');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 4000);

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(12, 24, 16);
    scene.add(ambient, directional);

    const grid = new THREE.GridHelper(32, 32, 0x33507a, 0x1d2c47);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    scene.add(grid);

    sceneRef.current = { scene, renderer, camera, mesh: null, grid };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = Math.max(420, Math.min(660, Math.round(w * 0.58)));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    const controls: Orbit = {
      azimuth: Math.PI / 4,
      elevation: Math.PI / 5,
      radius: 34,
      target: new THREE.Vector3(0, 0, 0),
    };
    controlsRef.current = controls;

    const applyCamera = () => {
      camera.position.set(
        controls.target.x + controls.radius * Math.sin(controls.elevation) * Math.cos(controls.azimuth),
        controls.target.y + controls.radius * Math.cos(controls.elevation),
        controls.target.z + controls.radius * Math.sin(controls.elevation) * Math.sin(controls.azimuth),
      );
      camera.lookAt(controls.target);
    };
    applyCamera();

    // Pointer events cover mouse, touch and pen. Two active pointers pinch.
    const activePointers = new Map<number, { x: number; y: number }>();
    let pinchStartDistance = 0;
    let pinchStartRadius = 0;

    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size === 2) {
        const [a, b] = [...activePointers.values()];
        pinchStartDistance = Math.hypot(a.x - b.x, a.y - b.y);
        pinchStartRadius = controls.radius;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = activePointers.get(event.pointerId);
      if (!previous) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (activePointers.size === 2 && pinchStartDistance > 0) {
        const [a, b] = [...activePointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        controls.radius = Math.max(4, Math.min(400, (pinchStartRadius * pinchStartDistance) / Math.max(1, distance)));
        applyCamera();
        return;
      }

      if (activePointers.size === 1) {
        // Right-drag (or Ctrl+drag) pans the target instead of rotating.
        if (event.buttons === 2 || event.ctrlKey) {
          const panScale = controls.radius / 500;
          const right = new THREE.Vector3(Math.cos(controls.azimuth), 0, -Math.sin(controls.azimuth));
          const up = new THREE.Vector3(0, 1, 0);
          controls.target
            .addScaledVector(right, -(event.clientX - previous.x) * panScale)
            .addScaledVector(up, (event.clientY - previous.y) * panScale);
          applyCamera();
          return;
        }
        controls.azimuth -= (event.clientX - previous.x) * 0.008;
        controls.elevation = Math.max(0.08, Math.min(1.52, controls.elevation - (event.clientY - previous.y) * 0.006));
        applyCamera();
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      if (activePointers.size < 2) pinchStartDistance = 0;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      controls.radius = Math.max(4, Math.min(400, controls.radius + event.deltaY * 0.03));
      applyCamera();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    const onContextMenu = (event: Event) => event.preventDefault();
    canvas.addEventListener('contextmenu', onContextMenu);    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
      sceneRef.current = null;
    };
  }, []);

  const loadFile = async (file: File) => {
    setError(null);
    setMessage('Parsing file...');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parsed = parseSchematicFile(file.name, bytes);
      const mesh = buildMesh(parsed);

      const context = sceneRef.current;
      if (!context) throw new Error('3D scene is not ready yet.');
      if (context.mesh) {
        context.scene.remove(context.mesh);
        context.mesh.geometry.dispose();
      }
      mesh.position.set(-parsed.width / 2, 0, -parsed.depth / 2);
      context.scene.add(mesh);
      context.mesh = mesh;

      // Fit the ground grid to the model so large schematics keep their floor.
      const footprint = Math.max(parsed.width, parsed.depth);
      const gridSpan = Math.max(32, footprint * 2.5);
      context.grid.scale.setScalar(gridSpan / 32);

      const controls = controlsRef.current;
      if (controls) {
        const maxDim = Math.max(parsed.width, parsed.height, parsed.depth);
        controls.radius = Math.max(12, maxDim * 2.1);
        controls.target.set(0, parsed.height / 2, 0);
      }

      setInfo(parsed);
      setFileName(file.name);
      setMessage(
        `${parsed.format.toUpperCase()} · ${parsed.width}×${parsed.height}×${parsed.depth} · ` +
          `${parsed.totalBlocks.toLocaleString()} blocks · ${parsed.paletteUsed.length} block types`,
      );
    } catch (err) {
      setInfo(null);
      setError(err instanceof Error ? err.message : 'Failed to parse this file.');
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const resetView = () => {
    const controls = controlsRef.current;
    const context = sceneRef.current;
    if (!controls || !context?.mesh) return;
    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(context.mesh).getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    controls.radius = Math.max(12, maxDim * 2.1);
    controls.target.set(0, size.y / 2, 0);
    controls.azimuth = Math.PI / 4;
    controls.elevation = Math.PI / 5;
  };

  const paletteSummary = info
    ? info.paletteUsed
        .map((id) => ({
          id,
          name: demoPaletteManifest.blocks.find((entry) => entry.id === id)?.name ?? id.replace('minecraft:', ''),
          color: demoPaletteManifest.blocks.find((entry) => entry.id === id)?.avgColor ?? '#000000',
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="order-2 space-y-6 lg:order-none">
        <div className="card p-5">
          <p className="eyebrow">Viewer</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-100">Online Litematic Viewer</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Inspect .litematic, .schem and .mcstructure files in your browser — no game, no mods, nothing uploaded.
          </p>
        </div>

        <div className="card p-5">
          <label
            className={`flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed p-4 text-sm transition ${
              dragActive ? 'border-[#2c4419] bg-[#57a82a]/10 text-neutral-100' : 'border-[#2a2e2a] bg-[#101210] text-neutral-400 hover:bg-transparent'
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void loadFile(file);
            }}
          >
            <span className="font-semibold text-neutral-100">Upload or drop file</span>
            <span>.litematic / .schem / .mcstructure — parsed locally.</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".litematic,.schem,.mcstructure"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = '';
                if (file) void loadFile(file);
              }}
            />
          </label>

          {fileName && (
            <button
              type="button"
              onClick={openFilePicker}
              className="mt-4 w-full rounded-full bg-[#57a82a] px-5 py-3 text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
            >
              Open another file
            </button>
          )}
        </div>

        {info && (
          <div className="card p-5">
            <h2 className="eyebrow">File details</h2>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ['File', fileName ?? '—'],
                ['Format', info.format.toUpperCase()],
                ['Internal name', info.name],
                ['Size', `${info.width} × ${info.height} × ${info.depth}`],
                ['Blocks', info.totalBlocks.toLocaleString()],
                ['Block types', String(info.paletteUsed.length)],
                ['Data version', info.dataVersion ? String(info.dataVersion) : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3">
                  <dt className="shrink-0 text-neutral-500">{label}</dt>
                  <dd className="truncate text-right text-neutral-300">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-sm font-semibold text-neutral-100">Blocks used</p>
            <ul className="legend-scroll mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1 text-sm">
              {paletteSummary.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 rounded-xl border border-[#2a2e2a] bg-[#101210] px-3 py-2">
                  <span className="h-5 w-5 shrink-0 rounded-md border border-[#2a2e2a]" style={{ backgroundColor: entry.color }} />
                  <span className="truncate text-neutral-300">{entry.name}</span>
                  <span className="ml-auto shrink-0 text-[11px] uppercase tracking-wide text-neutral-600">{entry.id.replace('minecraft:', '')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!info && (
          <div className="card p-5">
            <h2 className="eyebrow">Controls</h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-400">
              <li>Drag — rotate · Right-drag — pan · Scroll/pinch — zoom</li>
              <li>Everything renders locally in WebGL</li>
              <li>No file handy? <Link href="/pixel-art-generator" className="font-semibold text-[#7cbe4e] hover:text-[#a3d47e]">Convert an image</Link> and export a structure to inspect here.</li>
            </ul>
          </div>
        )}

        <div className="card p-5">
          <h2 className="eyebrow">Next step</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Want to make a schematic like this? Build one from any image, then export it in any format.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/pixel-art-generator"
              className="rounded-full bg-[#57a82a] px-5 py-3 text-center text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
            >
              Open the pixel art generator
            </Link>
            <Link
              href="/guides/minecraft-map-art-guide"
              className="rounded-full border border-[#2a2e2a] bg-transparent px-5 py-3 text-center text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a]"
            >
              Read the map art guide
            </Link>
          </div>
        </div>
      </aside>

      <section className="order-1 space-y-4 lg:order-none">
        <div className="card p-5">
          <div className="viewer-sky relative overflow-hidden rounded-lg border border-[#2a2e2a]">
            <canvas ref={canvasRef} className="block h-auto w-full touch-none" />
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-[#0e100e] px-3 py-1 text-xs text-slate-100">
              {message}
            </div>
            {info && (
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  type="button"
                  onClick={resetView}
                  className="rounded-full bg-[#0e100e] px-4 py-1.5 text-xs font-semibold text-neutral-100 transition hover:bg-black/75"
                >
                  Reset view
                </button>
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="rounded-full bg-[#0e100e] px-4 py-1.5 text-xs font-semibold text-neutral-100 transition hover:bg-black/75"
                >
                  Load different file
                </button>
              </div>
            )}
            {info && (
              <button
                type="button"
                onClick={resetView}
                className="absolute bottom-4 right-4 rounded-full bg-[#0e100e] px-4 py-1.5 text-xs font-semibold text-neutral-100 transition hover:bg-black/75"
              >
                Reset view
              </button>
            )}
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>
          )}
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['No upload', 'Files are parsed in your browser with our own NBT reader.'],
            ['All formats', 'Litematica, Sponge .schem and Bedrock .mcstructure in one tool.'],
            ['Palette accurate', 'Rendered with the same block colors the generator uses.'],
          ].map(([title, body]) => (
            <article key={title} className="card p-5">
              <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{body}</p>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}