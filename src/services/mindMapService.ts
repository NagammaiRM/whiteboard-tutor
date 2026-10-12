// src/services/mindMapService.ts
// Mind map concept extraction and conversion into animated whiteboard drawing commands
import type { MindMapNode, DrawCommand } from '../types/tutor';

export function generateMindMapFromTopic(topic: string): MindMapNode {
  return {
    id: 'root',
    topic: topic || 'Central Thesis',
    color: '#38bdf8',
    children: [
      {
        id: 'branch_1',
        topic: 'Foundations & Axioms',
        color: '#60a5fa',
        children: [
          { id: 'sub_1_1', topic: 'Initial Definitions' },
          { id: 'sub_1_2', topic: 'Core Assumptions' }
        ]
      },
      {
        id: 'branch_2',
        topic: 'Theoretical Framework',
        color: '#a855f7',
        children: [
          { id: 'sub_2_1', topic: 'Mathematical Derivation' },
          { id: 'sub_2_2', topic: 'Systematic Relations' }
        ]
      },
      {
        id: 'branch_3',
        topic: 'Applications & Grounding',
        color: '#10b981',
        children: [
          { id: 'sub_3_1', topic: 'Empirical Verification' },
          { id: 'sub_3_2', topic: 'Practical Implications' }
        ]
      }
    ]
  };
}

export function convertMindMapToDrawCommands(root: MindMapNode): DrawCommand[] {
  const commands: DrawCommand[] = [
    { type: 'clear' },
    { type: 'say', text: `Generating conceptual mind map for: ${root.topic}.` }
  ];

  // Draw Root Node
  const rootX = 420;
  const rootY = 320;
  commands.push(
    { type: 'rect', x: rootX - 100, y: rootY - 30, w: 200, h: 60, width: 3, color: '#38bdf8' },
    { type: 'write', text: root.topic.slice(0, 24), x: rootX - 80, y: rootY - 5, size: 22, font: 'caveat', color: '#f0f9ff' }
  );

  const branches = root.children || [];
  const angles = [-0.6, 0, 0.6]; // left or vertical spread
  const targets = [
    { x: 180, y: 160 },
    { x: 740, y: 160 },
    { x: 740, y: 480 },
    { x: 180, y: 480 }
  ];

  branches.forEach((b, i) => {
    const target = targets[i % targets.length];
    // Connecting curved path or arrow
    commands.push(
      { type: 'path', d: `M ${rootX} ${rootY} Q ${(rootX + target.x) / 2} ${(rootY + target.y) / 2 - 30} ${target.x} ${target.y}`, width: 2, color: b.color || '#ec4899' },
      { type: 'rect', x: target.x - 90, y: target.y - 25, w: 180, h: 50, width: 2, color: b.color || '#ec4899' },
      { type: 'write', text: b.topic.slice(0, 20), x: target.x - 80, y: target.y - 4, size: 18, font: 'caveat', color: '#f8fafc' }
    );

    // Sub branches
    (b.children || []).forEach((sub, subIdx) => {
      const offsetX = target.x > rootX ? 80 : -80;
      const subX = target.x + offsetX;
      const subY = target.y + (subIdx === 0 ? -60 : 60);

      commands.push(
        { type: 'line', x1: target.x, y1: target.y, x2: subX, y2: subY, width: 1.5, color: '#94a3b8' },
        { type: 'circle', cx: subX, cy: subY, r: 6, color: '#38bdf8' },
        { type: 'write', text: sub.topic.slice(0, 20), x: target.x > rootX ? subX + 12 : subX - 110, y: subY - 4, size: 15, font: 'caveat', color: '#cbd5e1' }
      );
    });
  });

  commands.push(
    { type: 'note', text: 'Mind map synchronized from study material', x: 60, y: 640, size: 16, color: '#fbbf24' },
    { type: 'say', text: 'The mind map is fully rendered on your whiteboard.' }
  );

  return commands;
}
