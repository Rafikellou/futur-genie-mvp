import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { OptionChips } from '@/features/exercise-creation/components/OptionChips';
import {
  submitSuggestion,
  type SuggestionCategory,
} from '@/features/feedback/submitSuggestion';
import { COLORS } from '@/theme/colors';

const CATEGORIES: { value: SuggestionCategory; label: string }[] = [
  { value: 'feature', label: 'Idée de fonctionnalité' },
  { value: 'problem', label: 'Problème rencontré' },
  { value: 'other', label: 'Autre' },
];

export default function SuggestionsScreen() {
  const [category, setCategory] = useState<SuggestionCategory>('feature');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const canSend = message.trim().length >= 5 && !isSending;

  async function handleSend() {
    if (!canSend) return;
    setIsSending(true);
    try {
      await submitSuggestion({ category, message: message.trim() });
      setIsSent(true);
      setMessage('');
    } finally {
      setIsSending(false);
    }
  }

  if (isSent) {
    return (
      <Screen style={styles.container}>
        <View style={styles.confirmation}>
          <Text style={styles.confirmationEmoji}>💜</Text>
          <Text style={styles.title}>Merci !</Text>
          <Text style={styles.body}>
            Votre message nous aide à décider quoi améliorer en priorité.
          </Text>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setIsSent(false)}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Envoyer une autre idée</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Vos idées</Text>
          <Text style={styles.body}>
            Futur Génie débute. Dites-nous ce qui vous aiderait le plus : une
            fonctionnalité qui manque, quelque chose de pénible, une idée
            d&apos;amélioration.
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>De quoi s&apos;agit-il ?</Text>
            <OptionChips
              options={CATEGORIES}
              selected={category}
              onSelect={setCategory}
              accessibilityLabelPrefix="Catégorie"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Votre message</Text>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
              placeholder="Écrivez ici…"
              accessibilityLabel="Votre message"
            />
          </View>

          <Pressable
            style={[styles.button, !canSend && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Envoyer</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#444444',
    lineHeight: 21,
  },
  section: {
    gap: 10,
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 140,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmation: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  confirmationEmoji: {
    fontSize: 40,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
