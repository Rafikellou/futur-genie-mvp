// Teacher profile, mirroring the `public.profiles` table.
// Row creation is handled entirely by a database trigger (see
// supabase/migrations) — the app only ever reads and updates this row.
//
// The structured identity fields (title..classGrade) are collected by the
// mandatory onboarding screen (src/app/(app)/onboarding.tsx) after the first
// sign-in. Until every one is filled, `isProfileComplete` is false and the
// app routes to that screen instead of the tabs.
import type { Grade } from './grade';
import type { TeacherTitle } from './title';

export type Profile = {
  id: string;
  displayName: string | null;
  title: TeacherTitle | null;
  firstName: string | null;
  lastName: string | null;
  schoolName: string | null;
  schoolPostalCode: string | null;
  classGrade: Grade | null;
  createdAt: string;
  updatedAt: string;
};

// Row shape as returned by Supabase (snake_case columns).
type ProfileRow = {
  id: string;
  display_name: string | null;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  school_name: string | null;
  school_postal_code: string | null;
  class_grade: string | null;
  created_at: string;
  updated_at: string;
};

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    // Stored values are constrained by DB CHECKs to the same sets these
    // types allow, so the cast is safe; a legacy/unexpected value would
    // simply fail `isProfileComplete` and send the teacher back to onboarding.
    title: row.title as TeacherTitle | null,
    firstName: row.first_name,
    lastName: row.last_name,
    schoolName: row.school_name,
    schoolPostalCode: row.school_postal_code,
    classGrade: row.class_grade as Grade | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// What the onboarding screen collects. All fields required.
export type TeacherDetails = {
  title: TeacherTitle;
  firstName: string;
  lastName: string;
  schoolName: string;
  schoolPostalCode: string;
  classGrade: Grade;
};

export function isProfileComplete(profile: Profile | null): boolean {
  return Boolean(
    profile &&
      profile.title &&
      profile.firstName?.trim() &&
      profile.lastName?.trim() &&
      profile.schoolName?.trim() &&
      /^[0-9]{5}$/.test(profile.schoolPostalCode ?? '') &&
      profile.classGrade,
  );
}

// Student-facing name shown on the public quiz ("Ton enseignant·e Mme Dupont
// te propose ce quiz…") and the Home greeting. Composed from the structured
// fields so the teacher never types a free-form display name.
export function composeDisplayName(title: TeacherTitle, lastName: string): string {
  return `${title} ${lastName.trim()}`.trim();
}
