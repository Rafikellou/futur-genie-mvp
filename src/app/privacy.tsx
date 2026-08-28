import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { COLORS } from '@/theme/colors';

// Public route, deliberately outside the (app)/(auth) groups (same pattern
// as src/app/q/[slug].tsx) so it needs no session and no navigation guard —
// required both as the App Store Connect / TestFlight privacy policy URL
// and as an in-app page a signed-out visitor can read. Content describes
// what the product actually does; keep it in sync with CLAUDE.md §29/§31-33
// whenever data handling changes.
export default function PrivacyScreen() {
  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>

        <Text style={styles.title}>Politique de confidentialité</Text>
        <Text style={styles.updated}>Dernière mise à jour : 28 août 2026</Text>

        <Text style={styles.paragraph}>
          Futur Génie aide les enseignants à créer des devoirs à partir d’une photo de leçon.
          Cette page explique simplement quelles données sont utilisées, pourquoi, et pendant
          combien de temps.
        </Text>

        <Section title="Ce que nous collectons sur l’enseignant">
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

        <Section title="La photo de la leçon">
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

        <Section title="Ce que nous collectons sur les élèves">
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

        <Section title="Ce que nous ne faisons pas">
          <Bullet>Pas de publicité, pas de revente de données.</Bullet>
          <Bullet>Pas de suivi publicitaire ni d’outil d’analyse tiers dans l’application.</Bullet>
          <Bullet>
            Pas de collecte de nom de famille, date de naissance ou autre donnée identifiante sur
            les élèves.
          </Bullet>
        </Section>

        <Section title="Où sont hébergées les données">
          <Bullet>
            Sur des serveurs Supabase situés dans l’Union européenne. Les échanges avec
            l’application sont chiffrés (HTTPS).
          </Bullet>
        </Section>

        <Section title="Combien de temps sont-elles conservées">
          <Bullet>
            Aussi longtemps que le compte enseignant existe. La photo de leçon n’est, elle,
            jamais conservée au-delà de la génération du devoir (voir ci-dessus).
          </Bullet>
        </Section>

        <Section title="Vos droits">
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  updated: {
    fontSize: 13,
    color: '#98A2B3',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    color: '#101828',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  bulletMark: {
    fontSize: 15,
    color: COLORS.primary,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  },
  emphasis: {
    fontWeight: '600',
    color: '#101828',
  },
});
