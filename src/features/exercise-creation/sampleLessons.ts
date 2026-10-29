import { Asset } from 'expo-asset';
import type { ImageSourcePropType } from 'react-native';

import type { Grade } from '@shared/domain/grade';
import type { Subject } from '@shared/domain/subject';

import { compressLessonImage, type LessonImage } from './lessonImage';

// « Essayer avec une leçon d'exemple » (docs/design README §7.3): one original
// math lesson page per grade, written for Futur Génie and bundled with the
// app (sources in assets/sample-lessons/source). Lets a new teacher try the
// golden path without a textbook at hand.
export const SAMPLE_LESSON_SUBJECT: Subject = 'mathematiques';

type SampleLesson = {
  title: string;
  image: ImageSourcePropType;
};

// Every page is rendered at the same size by render.sh.
const PAGE_WIDTH = 1600;
const PAGE_HEIGHT = 2200;

export const SAMPLE_LESSONS: Record<Grade, SampleLesson> = {
  CP: {
    title: 'Les nombres jusqu’à 20 : la dizaine',
    image: require('../../../assets/sample-lessons/cp.png'),
  },
  CE1: {
    title: 'Comparer et ranger les nombres jusqu’à 1 000',
    image: require('../../../assets/sample-lessons/ce1.png'),
  },
  CE2: {
    title: 'Mesurer des longueurs : km, m, cm, mm',
    image: require('../../../assets/sample-lessons/ce2.png'),
  },
  CM1: { title: 'Les fractions', image: require('../../../assets/sample-lessons/cm1.png') },
  CM2: { title: 'Les nombres décimaux', image: require('../../../assets/sample-lessons/cm2.png') },
};

// Turns the bundled page into the same compressed JPEG a camera photo becomes,
// so it goes through the exact same generation pipeline (README §7.3).
export async function loadSampleLesson(grade: Grade): Promise<LessonImage> {
  const asset = Asset.fromModule(SAMPLE_LESSONS[grade].image as number);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  return compressLessonImage({ uri, width: PAGE_WIDTH, height: PAGE_HEIGHT });
}
