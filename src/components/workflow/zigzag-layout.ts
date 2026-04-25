export const NODE_WIDTH = 260;
export const NODE_HEIGHT = 76;
export const ROW_HEIGHT = 130;
export const COL_OFFSET = 160;
export const TRIGGER_HEIGHT = 42;
export const END_HEIGHT = 20;
export const CANVAS_PADDING = 60;

// Center X is computed so content fits comfortably
// Total width = padding + NODE_WIDTH/2 + COL_OFFSET + NODE_WIDTH/2 + padding (on each side)
export const CANVAS_CENTER_X = CANVAS_PADDING + NODE_WIDTH / 2 + COL_OFFSET; // 350

export interface LayoutPosition {
  x: number;
  y: number;
}

export interface Layout {
  trigger: LayoutPosition;
  steps: LayoutPosition[];
  end: LayoutPosition;
  totalWidth: number;
  totalHeight: number;
}

export function calcLayout(stepCount: number): Layout {
  const cx = CANVAS_CENTER_X;

  const trigger: LayoutPosition = {
    x: cx - NODE_WIDTH / 2,
    y: CANVAS_PADDING,
  };

  const steps: LayoutPosition[] = Array.from({ length: stepCount }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    return {
      x: cx - NODE_WIDTH / 2 + side * COL_OFFSET,
      y: CANVAS_PADDING + (i + 1) * ROW_HEIGHT,
    };
  });

  const endY = CANVAS_PADDING + (stepCount + 1) * ROW_HEIGHT;
  const end: LayoutPosition = { x: cx - 30, y: endY };

  const totalWidth = cx * 2;
  const totalHeight = endY + 60;

  return { trigger, steps, end, totalWidth, totalHeight };
}

/** Cubic bezier path from bottom-center of node A to top-center of node B */
export function connectorPath(
  ax: number,
  ay: number,
  bx: number,
  by: number
): string {
  const my = (ay + by) / 2;
  return `M ${ax} ${ay} C ${ax} ${my}, ${bx} ${my}, ${bx} ${by}`;
}

/** Midpoint of a cubic bezier (approximate — uses control point average) */
export function connectorMidpoint(
  ax: number,
  ay: number,
  bx: number,
  by: number
): LayoutPosition {
  return { x: (ax + bx) / 2, y: (ay + by) / 2 };
}

/** Build all connector data for a given layout */
export function calcConnectors(layout: Layout) {
  const { trigger, steps, end } = layout;
  const allNodes = [trigger, ...steps];
  const connectors: {
    path: string;
    midpoint: LayoutPosition;
    dashed: boolean;
  }[] = [];

  for (let i = 0; i < allNodes.length; i++) {
    const from = allNodes[i];
    const isLast = i === allNodes.length - 1;
    const to = isLast ? end : allNodes[i + 1];

    // From: bottom-center of current node
    const ax = from.x + NODE_WIDTH / 2;
    const ay = from.y + (i === 0 ? TRIGGER_HEIGHT : NODE_HEIGHT);

    // To: top-center of next node (or center of end node)
    const bx = isLast ? end.x + 30 : to.x + NODE_WIDTH / 2;
    const by = to.y;

    connectors.push({
      path: connectorPath(ax, ay, bx, by),
      midpoint: connectorMidpoint(ax, ay, bx, by),
      dashed: isLast,
    });
  }

  return connectors;
}
