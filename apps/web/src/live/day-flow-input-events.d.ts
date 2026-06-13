interface HTMLInputElement {
  addEventListener(
    type: 'change',
    listener: (event: Event & { currentTarget: HTMLInputElement }) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
}
