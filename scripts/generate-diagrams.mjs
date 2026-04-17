/**
 * Generate hand-drawn (Excalidraw-style) SVG diagrams using rough.js
 * Run: node scripts/generate-diagrams.mjs
 */

import rough from 'roughjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'diagrams');

// Colors matching site dark theme
const C = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  border: '#2e2e2e',
  text: '#ede9e3',
  muted: '#9a9590',
  orange: '#fa520f',
  amber: '#ffa110',
  green: '#3fb950',
  blue: '#58a6ff',
  purple: '#bc8cff',
  yellow: '#d29922',
};

// rough.js SVG generator (no DOM needed - we build SVG strings from path data)
function roughPaths(generator, shape) {
  let d = '';
  for (const set of shape.sets) {
    for (const op of set.ops) {
      if (op.op === 'move') d += `M${op.data[0]} ${op.data[1]} `;
      else if (op.op === 'bcurveTo') d += `C${op.data[0]} ${op.data[1]}, ${op.data[2]} ${op.data[3]}, ${op.data[4]} ${op.data[5]} `;
      else if (op.op === 'lineTo') d += `L${op.data[0]} ${op.data[1]} `;
    }
  }
  return d;
}

function makeSvg(width, height, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:${C.bg}">
  <style>
    text { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    .label { fill: ${C.text}; font-size: 14px; }
    .label-sm { fill: ${C.muted}; font-size: 11px; }
    .label-bold { fill: ${C.text}; font-size: 15px; font-weight: 600; }
  </style>
  ${content}
</svg>`;
}

function box(gen, x, y, w, h, color, fillColor = null) {
  const shape = gen.rectangle(x, y, w, h, {
    stroke: color,
    strokeWidth: 1.5,
    roughness: 1.2,
    fill: fillColor || C.surface,
    fillStyle: 'solid',
    seed: Math.floor(Math.random() * 1000),
  });
  return `<path d="${roughPaths(gen, shape)}" fill="${fillColor || C.surface}" stroke="${color}" stroke-width="1.5"/>`;
}

function arrow(gen, x1, y1, x2, y2, color) {
  const line = gen.line(x1, y1, x2, y2, {
    stroke: color,
    strokeWidth: 1.5,
    roughness: 0.8,
    seed: Math.floor(Math.random() * 1000),
  });
  // Arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 10;
  const ax = x2 - headLen * Math.cos(angle - 0.4);
  const ay = y2 - headLen * Math.sin(angle - 0.4);
  const bx = x2 - headLen * Math.cos(angle + 0.4);
  const by = y2 - headLen * Math.sin(angle + 0.4);
  const head = gen.linearPath([[ax, ay], [x2, y2], [bx, by]], {
    stroke: color,
    strokeWidth: 1.5,
    roughness: 0.5,
    seed: Math.floor(Math.random() * 1000),
  });
  return `<path d="${roughPaths(gen, line)}" fill="none" stroke="${color}" stroke-width="1.5"/>
  <path d="${roughPaths(gen, head)}" fill="none" stroke="${color}" stroke-width="1.5"/>`;
}

function text(x, y, str, cls = 'label', anchor = 'middle') {
  return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${str}</text>`;
}

// ========== DIAGRAM 1: roku-ecp architecture ==========
function ecpArch() {
  const gen = rough.generator({ options: { seed: 42 } });
  const w = 700, h = 280;
  let svg = '';

  // Your Code box
  svg += box(gen, 40, 40, 160, 60, C.orange);
  svg += text(120, 75, 'Your Code', 'label-bold');
  svg += text(120, 95, '(Node.js)', 'label-sm');

  // Arrow
  svg += arrow(gen, 200, 70, 280, 70, C.amber);
  svg += text(240, 60, 'HTTP', 'label-sm');

  // Roku box
  svg += box(gen, 280, 40, 160, 60, C.amber);
  svg += text(360, 75, 'Roku Device', 'label-bold');
  svg += text(360, 95, ':8060', 'label-sm');

  // Output branches
  const targets = [
    [520, 30, 'Remote Control'],
    [520, 90, 'Device State'],
    [520, 150, 'SceneGraph Tree'],
    [520, 210, 'App Lifecycle'],
  ];

  for (const [tx, ty, label] of targets) {
    svg += arrow(gen, 440, 70, tx, ty + 15, C.border);
    svg += box(gen, tx, ty, 150, 35, C.border, C.bg);
    svg += text(tx + 75, ty + 22, label, 'label-sm');
  }

  return makeSvg(w, h, svg);
}

// ========== DIAGRAM 2: roku-ecp XML pipeline ==========
function ecpPipeline() {
  const gen = rough.generator({ options: { seed: 99 } });
  const w = 700, h = 340;
  let svg = '';

  // Top: GET request
  svg += box(gen, 220, 20, 260, 45, C.orange);
  svg += text(350, 48, 'GET /query/app-ui', 'label-bold');

  // Arrow down
  svg += arrow(gen, 350, 65, 350, 100, C.amber);
  svg += text(410, 85, '40KB of XML', 'label-sm');

  // parseUiXml
  svg += box(gen, 220, 100, 260, 45, C.amber);
  svg += text(350, 128, 'parseUiXml()', 'label-bold');

  // Arrow down
  svg += arrow(gen, 350, 145, 350, 180, C.amber);

  // UiNode Tree
  svg += box(gen, 220, 180, 260, 45, C.amber);
  svg += text(350, 208, 'UiNode Tree', 'label-bold');

  // Fan out
  const queries = [
    [40, 275, "findElement(tree, 'Button#play')"],
    [300, 275, 'findFocused(tree)'],
    [500, 275, "findElements(tree, 'Label')"],
  ];

  for (const [qx, qy, label] of queries) {
    svg += arrow(gen, 350, 225, qx + 90, qy, C.border);
    svg += box(gen, qx, qy, 185, 40, C.border, C.bg);
    svg += text(qx + 92, qy + 25, label, 'label-sm');
  }

  return makeSvg(w, h, svg);
}

// ========== DIAGRAM 3: roku-mcp agent loop ==========
function mcpAgentLoop() {
  const gen = rough.generator({ options: { seed: 77 } });
  const w = 700, h = 180;
  let svg = '';

  // Agent
  svg += box(gen, 30, 50, 180, 70, C.orange);
  svg += text(120, 85, 'AI Agent', 'label-bold');
  svg += text(120, 105, '(Claude, Copilot, etc.)', 'label-sm');

  // MCP Server
  svg += box(gen, 270, 50, 160, 70, C.amber);
  svg += text(350, 85, 'roku-mcp', 'label-bold');
  svg += text(350, 105, 'Server', 'label-sm');

  // Roku
  svg += box(gen, 490, 50, 170, 70, C.border);
  svg += text(575, 85, 'Roku Device', 'label-bold');
  svg += text(575, 105, ':8060', 'label-sm');

  // Forward arrows (top)
  svg += arrow(gen, 210, 70, 270, 70, C.orange);
  svg += text(240, 60, '1', 'label-sm');
  svg += arrow(gen, 430, 70, 490, 70, C.amber);
  svg += text(460, 60, '2', 'label-sm');

  // Return arrows (bottom)
  svg += arrow(gen, 490, 100, 430, 100, C.green);
  svg += text(460, 130, '3', 'label-sm');
  svg += arrow(gen, 270, 100, 210, 100, C.green);
  svg += text(240, 130, '4', 'label-sm');

  // Loop arrow back
  svg += arrow(gen, 120, 120, 120, 150, C.muted);
  svg += arrow(gen, 120, 150, 280, 150, C.muted);
  svg += arrow(gen, 280, 150, 280, 120, C.muted);
  svg += text(200, 165, '5. Next action', 'label-sm');

  return makeSvg(w, h, svg);
}

// ========== DIAGRAM 4: roku-mcp before/after ==========
function mcpBeforeAfter() {
  const gen = rough.generator({ options: { seed: 55 } });
  const w = 700, h = 260;
  let svg = '';

  // Before column
  svg += text(160, 25, 'Before', 'label-bold');
  svg += box(gen, 40, 40, 240, 45, C.border, C.bg);
  svg += text(160, 68, 'Manual button pressing', 'label-sm');
  svg += arrow(gen, 160, 85, 160, 110, C.border);
  svg += box(gen, 40, 110, 240, 45, C.border, C.bg);
  svg += text(160, 138, 'Squint at console', 'label-sm');
  svg += arrow(gen, 160, 155, 160, 180, C.border);
  svg += box(gen, 40, 180, 240, 45, C.border, C.bg);
  svg += text(160, 208, 'Hope for the best', 'label-sm');

  // Arrow between
  svg += arrow(gen, 310, 130, 390, 130, C.orange);
  svg += text(350, 120, 'roku-mcp', 'label-sm');

  // After column
  svg += text(530, 25, 'After', 'label-bold');
  svg += box(gen, 410, 40, 250, 45, C.orange);
  svg += text(535, 68, '"Test the browse flow"', 'label-sm');
  svg += arrow(gen, 535, 85, 535, 110, C.amber);
  svg += box(gen, 410, 110, 250, 45, C.amber);
  svg += text(535, 138, 'Agent navigates + verifies', 'label-sm');
  svg += arrow(gen, 535, 155, 535, 180, C.green);
  svg += box(gen, 410, 180, 250, 45, C.green);
  svg += text(535, 208, 'Pass/fail report', 'label');

  return makeSvg(w, h, svg);
}

// ========== DIAGRAM 5: uncle-jesse stack ==========
function ujStack() {
  const gen = rough.generator({ options: { seed: 33 } });
  const w = 500, h = 340;
  let svg = '';

  const layers = [
    [C.purple, 'Your Tests (vitest)', 0],
    [C.blue, 'uncle-jesse-test', 70],
    [C.blue, 'uncle-jesse-core', 140],
    [C.green, 'uncle-jesse-roku', 210],
    [C.yellow, 'Roku ECP (:8060)', 280],
  ];

  const subs = [
    'focusPath, assertions, replay',
    'TVDevice, LiveElement, BasePage',
    'RokuAdapter + roku-ecp',
    'HTTP API on the device',
  ];

  for (let i = 0; i < layers.length; i++) {
    const [color, label, y] = layers[i];
    svg += box(gen, 80, y, 340, 50, color);
    svg += text(250, y + 25, label, 'label-bold');
    if (i > 0 && subs[i - 1]) {
      svg += text(250, y + 42, subs[i - 1], 'label-sm');
    }
    if (i < layers.length - 1) {
      svg += arrow(gen, 250, y + 50, 250, y + 70, color);
    }
  }

  return makeSvg(w, h, svg);
}

// ========== DIAGRAM 6: LiveElement flow ==========
function liveElementFlow() {
  const gen = rough.generator({ options: { seed: 88 } });
  const w = 700, h = 200;
  let svg = '';

  // Three method calls on the left
  const methods = [
    'homeScreen.isDisplayed()',
    'homeScreen.isFocused()',
    'homeScreen.getText()',
  ];

  for (let i = 0; i < methods.length; i++) {
    const y = 30 + i * 60;
    svg += box(gen, 20, y, 230, 40, C.blue);
    svg += text(135, y + 25, methods[i], 'label-sm');
    svg += arrow(gen, 250, y + 20, 340, 95, C.amber);
  }

  // Roku box
  svg += box(gen, 340, 60, 160, 70, C.green);
  svg += text(420, 90, 'Roku :8060', 'label-bold');
  svg += text(420, 110, 'GET /query/app-ui', 'label-sm');

  // Result
  svg += arrow(gen, 500, 95, 560, 95, C.green);
  svg += box(gen, 560, 65, 120, 60, C.border, C.bg);
  svg += text(620, 90, 'Parse →', 'label-sm');
  svg += text(620, 108, 'Find → Check', 'label-sm');

  return makeSvg(w, h, svg);
}

// Generate all
const diagrams = {
  'ecp-arch': ecpArch,
  'ecp-pipeline': ecpPipeline,
  'mcp-agent-loop': mcpAgentLoop,
  'mcp-before-after': mcpBeforeAfter,
  'uj-stack': ujStack,
  'liveelement-flow': liveElementFlow,
};

fs.mkdirSync(OUT, { recursive: true });

for (const [name, fn] of Object.entries(diagrams)) {
  const svg = fn();
  const outPath = path.join(OUT, `${name}.svg`);
  fs.writeFileSync(outPath, svg);
  console.log(`Generated ${outPath}`);
}

console.log('Done!');
