import React, { useRef, useState, useMemo, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { STATUS, LEVEL_RADIUS, COLORS } from '../constants.js';

function hasChildren(node, all) {
  return all.some((n) => n.parentId === node.id);
}

export default function GraphView({ graph, collapsed, progress, onSelect, onToggleCollapse }) {
  const fgRef = useRef();
  const wrapRef = useRef();
  const [size, setSize] = useState({ w: 800, h: 600 });

  // 跟随容器尺寸
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // 状态变化后强制重绘（刷新节点颜色）
  useEffect(() => {
    if (fgRef.current && fgRef.current.refresh) fgRef.current.refresh();
  }, [progress]);

  const all = graph.nodes;
  const byId = useMemo(() => Object.fromEntries(all.map((n) => [n.id, n])), [all]);

  // 根据 collapsed 计算可见节点与连线（隐藏被折叠节点的后代）
  const visible = useMemo(() => {
    const colSet = new Set(collapsed);
    const vis = all.filter((n) => {
      let p = n.parentId;
      while (p) {
        if (colSet.has(p)) return false;
        p = byId[p]?.parentId;
      }
      return true;
    });
    const ids = new Set(vis.map((n) => n.id));
    const links = all
      .filter((n) => n.parentId && ids.has(n.id) && ids.has(n.parentId))
      .map((n) => ({ source: n.parentId, target: n.id }));
    return { nodes: vis, links };
  }, [all, collapsed, byId]);

  const handleClick = (node, event) => {
    const fg = fgRef.current;
    if (!fg || !fg.graph2screenCoords) {
      onSelect(node.id);
      return;
    }
    const sp = fg.graph2screenCoords(node.x, node.y);
    const r = LEVEL_RADIUS[node.level];
    const triX = sp.x + r + 10; // 与下方绘制的三角形屏幕位置一致
    const px = event?.offsetX ?? -999;
    const py = event?.offsetY ?? -999;
    if (hasChildren(node, all) && Math.abs(px - triX) < 12 && Math.abs(py - sp.y) < 12) {
      onToggleCollapse(node.id);
      return;
    }
    onSelect(node.id);
  };

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef}
        width={size.w}
        height={size.h}
        graphData={visible}
        backgroundColor={COLORS.bg}
        linkColor={() => COLORS.link}
        linkWidth={1}
        cooldownTicks={120}
        onNodeClick={handleClick}
        nodeLabel={(n) => n.label}
        nodePointerAreaPaint={(node, color, ctx) => {
          const r = LEVEL_RADIUS[node.level];
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fill();
        }}
        nodeCanvasObject={(node, ctx, scale) => {
          const r = LEVEL_RADIUS[node.level];
          const st = progress[node.id] || 'unlearned';
          const color = STATUS[st].color;

          // 节点圆
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = COLORS.border;
          ctx.stroke();

          // 有子节点的绘制折叠小三角（▾ 展开中 / ▸ 已折叠）
          if (hasChildren(node, all)) {
            const collapsedNow = collapsed.includes(node.id);
            const tx = node.x + r + 10 / scale;
            const ty = node.y;
            const s = 5 / scale;
            ctx.beginPath();
            if (collapsedNow) {
              ctx.moveTo(tx - s, ty - s);
              ctx.lineTo(tx - s, ty + s);
              ctx.lineTo(tx + s, ty);
            } else {
              ctx.moveTo(tx - s, ty - s);
              ctx.lineTo(tx + s, ty - s);
              ctx.lineTo(tx, ty + s);
            }
            ctx.closePath();
            ctx.fillStyle = COLORS.textSecondary;
            ctx.fill();
          }

          // 标签
          const fontSize = Math.max(11 / scale, 2);
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = COLORS.textPrimary;
          ctx.fillText(node.label, node.x, node.y + r + 2 / scale);
        }}
      />
    </div>
  );
}
