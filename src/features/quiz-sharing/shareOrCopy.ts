import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Single place wiring the two ways a teacher gets a quiz link (or a batch of
// them) out of the app: the OS share sheet and clipboard copy. Reused by the
// single-quiz share (quiz-published.tsx) and the multi-quiz compose modal
// (my-quizzes.tsx) so there's one implementation of this gesture, not two
// (CLAUDE.md §57).
export async function shareText(message: string): Promise<boolean> {
  // React Native's Share module has no web implementation — the web build
  // (CLAUDE.md §8) falls back to clipboard copy as its "share" action.
  if (Platform.OS === 'web') {
    return copyText(message);
  }

  try {
    await Share.share({ message });
    return true;
  } catch {
    return false;
  }
}

export async function copyText(message: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(message);
    return true;
  } catch {
    return false;
  }
}
