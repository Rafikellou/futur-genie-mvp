import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// A lesson photo prepared for the (future) AI generation call. Never
// persisted — see CLAUDE.md §31.
export type LessonImage = {
  uri: string;
  width: number;
  height: number;
};

// Long edge cap and JPEG quality chosen to keep printed textbook text
// legible for the multimodal model while keeping the upload small (CLAUDE.md
// §31 / §55). Typical phone photos (3000-4000px long edge) are reduced well
// under 1 MB at this setting.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

// Resizes (only if larger than MAX_DIMENSION) and re-encodes a captured or
// picked photo as a compressed JPEG. Runs on-device; nothing is uploaded
// here yet (that lands with AI generation in Milestone 5).
export async function compressLessonImage(
  source: LessonImage
): Promise<LessonImage> {
  const longestEdge = Math.max(source.width, source.height);
  const scale = longestEdge > MAX_DIMENSION ? MAX_DIMENSION / longestEdge : 1;

  const context = ImageManipulator.manipulate(source.uri);
  if (scale < 1) {
    context.resize(
      source.width >= source.height
        ? { width: Math.round(source.width * scale) }
        : { height: Math.round(source.height * scale) }
    );
  }

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  return { uri: result.uri, width: result.width, height: result.height };
}
