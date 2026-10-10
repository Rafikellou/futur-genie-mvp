import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { useTabBarSpace } from '@/components/TabBar';
import { TextField } from '@/components/TextField';
import { OptionChips } from '@/features/exercise-creation/components/OptionChips';
import {
  submitSuggestion,
  type SuggestionCategory,
} from '@/features/feedback/submitSuggestion';
import { colors, gradients, radii, shadows, spacing, type } from '@/theme';

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
  const tabBarSpace = useTabBarSpace();

  const canSend = message.trim().length >= 5 && !isSending;

  async function handleSend() {
    if (!canSend) return;
    setIsSending(true);
    try {
      await submitSuggestion({ category, message: message.trim() });
      setIsSent(true);
      setMessage('');
    } catch {
      // The teacher's text is preserved (not cleared) so "Réessayer" costs
      // nothing to type again — same principle as CLAUDE.md §39.
      Alert.alert(
        'Message non envoyé',
        "Nous n'avons pas pu envoyer votre message. Vérifiez votre connexion et réessayez.",
        [{ text: 'Réessayer' }]
      );
    } finally {
      setIsSending(false);
    }
  }

  if (isSent) {
    return (
      <Screen>
        <View style={[styles.confirmation, { paddingBottom: tabBarSpace }]}>
          <LinearGradient {...gradients.warmHero} style={styles.thanksTile}>
            <Ionicons name="heart" size={48} color={colors.textOnBrand} />
          </LinearGradient>
          <Text style={styles.thanksTitle} accessibilityRole="header">
            Merci !
          </Text>
          <Text style={styles.thanksBody}>
            Votre message nous aide à décider quoi améliorer en priorité.
          </Text>
          <SecondaryButton
            label="Envoyer une autre idée"
            onPress={() => setIsSent(false)}
            style={styles.anotherButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <LinearGradient {...gradients.warm} style={styles.headerTile}>
              <Ionicons name="bulb-outline" size={24} color={colors.textOnBrand} />
            </LinearGradient>
            <Text style={styles.title} accessibilityRole="header">
              Vos idées
            </Text>
          </View>
          <Text style={styles.body}>
            Futur Génie débute. Dites-nous ce qui vous aiderait le plus : une
            fonctionnalité qui manque, quelque chose de pénible, une idée
            d&apos;amélioration.
          </Text>

          <GlassCard style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.label}>De quoi s’agit-il ?</Text>
              <OptionChips
                options={CATEGORIES}
                selected={category}
                onSelect={setCategory}
                accessibilityLabelPrefix="Catégorie"
              />
            </View>

            <TextField
              label="Votre message"
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder="Écrivez ici…"
              inputStyle={styles.messageInput}
            />

            <PrimaryButton
              label="Envoyer"
              onPress={handleSend}
              disabled={!canSend && !isSending}
              loading={isSending}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTile: {
    width: 48,
    height: 48,
    borderRadius: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.warmTile,
  },
  title: {
    ...type.title,
    color: colors.text,
  },
  body: {
    ...type.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textBody,
  },
  formCard: {
    padding: spacing.xl,
    gap: 18,
    borderRadius: 26,
    boxShadow: shadows.panel,
  },
  field: {
    gap: 10,
  },
  label: {
    ...type.labelStrong,
    color: colors.text,
  },
  messageInput: {
    minHeight: 150,
    borderRadius: radii.row,
  },
  confirmation: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: 30,
  },
  thanksTile: {
    width: 104,
    height: 104,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.warmHero,
  },
  thanksTitle: {
    ...type.display,
    fontSize: 34,
    lineHeight: 38,
    color: colors.text,
    marginTop: spacing.sm,
  },
  thanksBody: {
    ...type.body,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  anotherButton: {
    marginTop: 10,
    minHeight: 52,
  },
});
