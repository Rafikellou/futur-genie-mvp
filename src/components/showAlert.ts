import { Alert, Platform, type AlertButton, type AlertOptions } from 'react-native';

// Drop-in for Alert.alert. On iOS/Android it is exactly Alert.alert. On web,
// react-native-web's Alert.alert does nothing at all, which silently hid
// errors and swallowed confirmations; the browser's own dialogs stand in:
// - a destructive button → window.confirm, OK runs that button's action;
// - otherwise → window.alert, then the action of a lone button, if any.
// Menus with several non-destructive choices have no browser equivalent and
// only show the message on web.
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons, options);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const destructive = buttons?.find((button) => button.style === 'destructive');
  if (destructive) {
    if (window.confirm(text)) destructive.onPress?.();
    return;
  }

  window.alert(text);
  if (buttons?.length === 1) buttons[0].onPress?.();
}
