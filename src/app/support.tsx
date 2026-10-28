import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { colors, fonts, radii, spacing, type } from '@/theme';

const CONTACT_EMAIL = 'contact@futurgenie.fr';

// Public route (same pattern as privacy.tsx): the App Store Connect support
// URL points here, so it must render without a session. Visitors usually
// land on it directly from the App Store, hence the back button only when
// there is somewhere to go back to.
export default function SupportScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {router.canGoBack() && <BackButton onPress={() => router.back()} />}

        <View>
          <Text style={styles.title} accessibilityRole="header">
            Aide et contact
          </Text>
        </View>

        <Text style={styles.paragraph}>
          Futur Génie aide les enseignants du primaire à créer un exercice à partir d’une photo de
          leçon, puis à le partager à leurs élèves par un simple lien.
        </Text>

        <Card title="Nous écrire">
          <Text style={styles.answer}>
            Une question, un problème ou une idée ? Écrivez-nous à{' '}
            <Text
              style={styles.link}
              accessibilityRole="link"
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
              {CONTACT_EMAIL}
            </Text>
            . Nous répondons en général sous 48 heures.
          </Text>
        </Card>

        <Card title="Mes élèves doivent-ils installer l’application ?">
          <Text style={styles.answer}>
            Non. Ils ouvrent le lien du devoir dans le navigateur de n’importe quel téléphone,
            tablette ou ordinateur, sans compte ni inscription.
          </Text>
        </Card>

        <Card title="Les questions ne correspondent pas bien à ma leçon">
          <Text style={styles.answer}>
            Reprenez la photo en cadrant toute la leçon, bien à plat et sans reflet. Vous pouvez
            aussi modifier ou supprimer chaque question avant de publier : rien n’est envoyé aux
            élèves sans votre validation.
          </Text>
        </Card>

        <Card title="Combien de devoirs puis-je créer ?">
          <Text style={styles.answer}>
            Jusqu’à 10 devoirs par période de 24 heures. Les devoirs déjà publiés restent
            accessibles sans limite.
          </Text>
        </Card>

        <Card title="Comment supprimer mon compte ?">
          <Text style={styles.answer}>
            Depuis l’écran « Mon profil » de l’application. La suppression est définitive et
            efface aussi vos devoirs et les réponses de vos élèves.
          </Text>
        </Card>

        <Text
          style={[styles.answer, styles.link]}
          accessibilityRole="link"
          onPress={() => router.push('/privacy')}>
          Politique de confidentialité
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: 40,
    gap: spacing.lg,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...type.heroTitle,
    color: colors.text,
  },
  paragraph: {
    ...type.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textBody,
  },
  card: {
    padding: 18,
    gap: 10,
    borderRadius: radii.chip,
  },
  cardTitle: {
    ...type.sectionTitle,
    fontSize: 17,
    color: colors.text,
  },
  answer: {
    ...type.label,
    fontFamily: fonts.body,
    lineHeight: 21,
    color: colors.textBody,
  },
  link: {
    fontFamily: fonts.bodySemiBold,
    color: colors.actionText,
    textDecorationLine: 'underline',
  },
});
