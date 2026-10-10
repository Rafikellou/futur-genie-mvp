import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { colors, fonts, radii, spacing, type } from '@/theme';

// Public route, deliberately outside the (app)/(auth) groups (same pattern
// as src/app/q/[slug].tsx) so it needs no session and no navigation guard —
// required both as the App Store Connect / TestFlight privacy policy URL
// and as an in-app page a signed-out visitor can read. Content describes
// what the product actually does; keep it in sync with CLAUDE.md §29/§31-33
// whenever data handling changes. The redesign changed only the layout
// (numbered cards) — the wording is the reviewed one, keep it as is.
export default function PrivacyScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton onPress={() => router.back()} />

        <View>
          <Text style={styles.title} accessibilityRole="header">
            Politique de confidentialité
          </Text>
          <Text style={styles.updated}>Dernière mise à jour : 28 août 2026</Text>
        </View>

        <Text style={styles.paragraph}>
          Futur Génie aide les enseignants à créer des devoirs à partir d’une photo de leçon.
          Cette page explique simplement quelles données sont utilisées, pourquoi, et pendant
          combien de temps.
        </Text>

        <Section number={1} title="Ce que nous collectons sur l’enseignant">
          <Bullet>Adresse e-mail et mot de passe, pour la connexion au compte.</Bullet>
          <Bullet>
            Civilité, prénom et nom, pour identifier l’enseignant et afficher son nom aux élèves sur
            le devoir partagé.
          </Bullet>
          <Bullet>
            Nom et code postal de l’école, ainsi que le niveau de la classe, pour adapter
            l’application et mieux comprendre qui l’utilise.
          </Bullet>
          <Bullet>
            Les devoirs créés (titre, questions, réponses), rattachés au compte pour pouvoir les
            retrouver et les partager.
          </Bullet>
        </Section>

        <Section number={2} title="La photo de la leçon">
          <Bullet>
            La photo est envoyée de façon sécurisée à notre service pour générer les questions,
            puis n’est jamais conservée : elle n’est ni stockée sur nos serveurs, ni gardée après
            la génération du devoir.
          </Bullet>
          <Bullet>
            Elle est transmise à un prestataire d’intelligence artificielle (OpenAI) uniquement
            le temps de l’analyse, pour produire les questions.
          </Bullet>
        </Section>

        <Section number={3} title="Ce que nous collectons sur les élèves">
          <Bullet>
            Aucun compte, aucune inscription : un élève ouvre le lien du devoir et y répond
            directement.
          </Bullet>
          <Bullet>
            Un prénom (facultatif, jamais vérifié) permet seulement à l’enseignant de distinguer
            les réponses de ses élèves sur un même devoir.
          </Bullet>
          <Bullet>
            Les réponses et le score sont enregistrés, mais uniquement visibles par l’enseignant
            propriétaire du devoir — jamais par un autre enseignant, jamais publiés, jamais
            reliés d’un devoir à l’autre pour suivre un élève dans le temps.
          </Bullet>
        </Section>

        <Section number={4} title="Ce que nous ne faisons pas">
          <Bullet>Pas de publicité, pas de revente de données.</Bullet>
          <Bullet>Pas de suivi publicitaire ni d’outil d’analyse tiers dans l’application.</Bullet>
          <Bullet>
            Pas de collecte de nom de famille, date de naissance ou autre donnée identifiante sur
            les élèves.
          </Bullet>
        </Section>

        <Section number={5} title="Où sont hébergées les données">
          <Bullet>
            Sur des serveurs Supabase situés dans l’Union européenne. Les échanges avec
            l’application sont chiffrés (HTTPS).
          </Bullet>
        </Section>

        <Section number={6} title="Combien de temps sont-elles conservées">
          <Bullet>
            Aussi longtemps que le compte enseignant existe. La photo de leçon n’est, elle,
            jamais conservée au-delà de la génération du devoir (voir ci-dessus).
          </Bullet>
        </Section>

        <Section number={7} title="Vos droits">
          <Bullet>
            Un enseignant peut supprimer définitivement son compte et toutes les données
            associées (devoirs, réponses d’élèves) directement depuis l’écran « Mon profil » de
            l’application.
          </Bullet>
          <Bullet>
            Pour toute question sur vos données, vous pouvez nous écrire à{' '}
            <Text style={styles.emphasis}>contact@futurgenie.com</Text>.
          </Bullet>
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <GlassCard style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>{number}</Text>
        </View>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {children}
    </GlassCard>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return <Text style={styles.bullet}>{children}</Text>;
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
  updated: {
    ...type.meta,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  paragraph: {
    ...type.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textBody,
  },
  section: {
    padding: 18,
    gap: 10,
    borderRadius: radii.chip,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint.blue.background,
  },
  sectionNumberText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.actionText,
  },
  sectionTitle: {
    ...type.sectionTitle,
    fontSize: 17,
    flex: 1,
    color: colors.text,
  },
  bullet: {
    ...type.label,
    fontFamily: fonts.body,
    lineHeight: 21,
    color: colors.textBody,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: colors.tint.blue.background,
  },
  emphasis: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
});
