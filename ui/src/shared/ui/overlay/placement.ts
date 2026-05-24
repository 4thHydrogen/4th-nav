export interface PlacementRect {
  left: number;
  top: number;
}

export interface PlacementOptions {
  anchorRect: DOMRectReadOnly;
  viewportWidth?: number;
  viewportHeight?: number;
  /** Desired panel width */
  panelWidth: number;
  /** Desired panel height (used for clamping) */
  panelHeight: number;
  /** Margin from viewport edges */
  margin?: number;
  /** Placement preference: 'right-start', 'bottom-start', 'bottom-end', 'center' */
  placement?: string;
}

/**
 * Calculate a viewport-constrained position for a floating panel.
 */
export function computePlacement(opts: PlacementOptions): PlacementRect {
  const {
    anchorRect,
    panelWidth,
    panelHeight,
    margin = 12,
    placement = "center",
  } = opts;
  const vw = opts.viewportWidth ?? window.innerWidth;
  const vh = opts.viewportHeight ?? window.innerHeight;

  if (placement === "right-start") {
    let left = anchorRect.right + 4;
    let top = anchorRect.top;

    // Fallback to bottom-end if not enough space on right
    if (left + panelWidth > vw - margin) {
      left = anchorRect.right - panelWidth;
      if (left < margin) left = anchorRect.left;
      top = anchorRect.bottom + 4;
    }

    // Clamp to viewport
    if (left < margin) left = margin;
    if (left + panelWidth > vw - margin) left = vw - panelWidth - margin;
    if (top < margin) top = margin;
    if (top + panelHeight > vh - margin) top = vh - panelHeight - margin;

    return { left, top };
  }

  if (placement === "bottom-start") {
    let left = anchorRect.left;
    let top = anchorRect.bottom + 4;

    if (left + panelWidth > vw - margin) left = vw - panelWidth - margin;
    if (left < margin) left = margin;
    if (top + panelHeight > vh - margin) {
      top = anchorRect.top - panelHeight - 4;
    }
    if (top < margin) top = margin;

    return { left, top };
  }

  if (placement === "bottom-end") {
    let left = anchorRect.right - panelWidth;
    let top = anchorRect.bottom + 4;

    if (left < margin) left = margin;
    if (top + panelHeight > vh - margin) {
      top = anchorRect.top - panelHeight - 4;
    }
    if (top < margin) top = margin;

    return { left, top };
  }

  // Default: center on anchor, clamped to viewport
  let left = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
  let top = anchorRect.top - 20;

  if (left < margin) left = margin;
  if (left + panelWidth > vw - margin) left = vw - panelWidth - margin;
  if (top < margin) top = margin;
  if (top + panelHeight > vh - margin) top = vh - panelHeight - margin;

  return { left, top };
}
