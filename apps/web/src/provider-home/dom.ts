export function setText(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}
