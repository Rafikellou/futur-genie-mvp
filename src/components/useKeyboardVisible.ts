import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

// Bottom-anchored bars (tab bar, sticky footer button) hide while the
// keyboard is open: otherwise Android lifts them above the keyboard, on top
// of the text field being edited.
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
