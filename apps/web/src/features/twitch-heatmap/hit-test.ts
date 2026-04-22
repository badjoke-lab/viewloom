import type { HeatmapSceneNode, WorldPoint } from './model'

export function pickSceneNode(point: WorldPoint, nodes: HeatmapSceneNode[]): HeatmapSceneNode | null {
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index]
    if (
      point.x >= node.x &&
      point.x <= node.x + node.width &&
      point.y >= node.y &&
      point.y <= node.y + node.height
    ) {
      return node
    }
  }

  return null
}
