import type { CameraState, HeatmapSceneNode } from './model'

export function drawTilesLayer(ctx: CanvasRenderingContext2D, nodes: HeatmapSceneNode[], camera: CameraState, viewportWidth: number, viewportHeight: number, dpr: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, viewportWidth * dpr, viewportHeight * dpr)
  ctx.save()
  ctx.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.tx * dpr, camera.ty * dpr)
  for (const node of nodes) {
    ctx.fillStyle = node.momentum > 0.02 ? 'rgba(16,185,129,0.78)' : node.momentum < -0.02 ? 'rgba(244,63,94,0.78)' : 'rgba(51,65,85,0.92)'
    ctx.strokeStyle = node.momentum > 0.02 ? 'rgba(167,243,208,0.8)' : node.momentum < -0.02 ? 'rgba(254,205,211,0.8)' : 'rgba(148,163,184,0.4)'
    ctx.lineWidth = Math.max(1 / camera.scale, 1.25)
    ctx.fillRect(node.x, node.y, node.width, node.height)
    ctx.strokeRect(node.x, node.y, node.width, node.height)
  }
  ctx.restore()
}
