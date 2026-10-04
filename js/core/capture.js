// Match CSS object-fit: cover for the video and its tracking overlay.
export function getCoverBounds(sourceWidth, sourceHeight, width, height) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawnWidth = sourceWidth * scale;
  const drawnHeight = sourceHeight * scale;
  return [(width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight];
}

export function captureTrackingFrame(video, overlay, width, height) {
  const image = document.createElement("canvas");
  image.width = width;
  image.height = height;
  const context = image.getContext("2d");
  const bounds = getCoverBounds(video.videoWidth, video.videoHeight, width, height);
  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.filter = getComputedStyle(video).filter;
  context.drawImage(video, ...bounds);
  context.restore();
  // Tracking coordinates are already mirrored by CAM-005.
  context.drawImage(overlay, ...getCoverBounds(overlay.width, overlay.height, width, height));
  return image;
}
