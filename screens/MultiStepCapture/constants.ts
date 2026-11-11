import { Cube, Flower, Leaf, Sparkles, ThemeIconProps, Tree } from '@/components/basic/Icons';
import { STEP_PLACEHOLDER_IMAGES } from '@/constants/Assets/stepPlaceholders';
import type { FC } from 'react';

export interface StepConfig {
  title: string;
  info: string;
  note?: string;
  placeholder?: number;
  icon: FC<ThemeIconProps>;
}

export const STEPS: StepConfig[] = [
  {
    title: 'Whole Plant - Side View',
    info: 'Take a photo of the whole plant from the side to show its height and surroundings.',
    placeholder: STEP_PLACEHOLDER_IMAGES[0],
    icon: Tree,
  },
  {
    title: 'Whole Plant - Top View',
    info: 'Take a photo of the whole plant from above.',
    placeholder: STEP_PLACEHOLDER_IMAGES[1],
    icon: Tree,
  },
  {
    title: 'Stem / Bark - Base',
    info: 'Take a close-up photo of the stem near the base.',
    placeholder: STEP_PLACEHOLDER_IMAGES[2],
    icon: Cube,
  },
  {
    title: 'Stem / Bark - Branch',
    info: 'Take a close-up photo of a young branch growing from the main stem.',
    placeholder: STEP_PLACEHOLDER_IMAGES[3],
    icon: Cube,
  },
  {
    title: 'Leaf - Top Surface',
    info: 'Take a close-up photo of the top side of a leaf.',
    note: '📌 Choose one leaf and bring the camera closer to capture its details clearly.',
    placeholder: STEP_PLACEHOLDER_IMAGES[4],
    icon: Leaf,
  },
  {
    title: 'Leaf - Bottom Surface',
    info: 'Take a close-up photo of the bottom side of a leaf.',
    note: '📌 Choose one leaf and bring the camera closer to capture its details clearly.\n💡 Switch to selfie mode, place your phone under the leaf, and take a photo.',
    placeholder: STEP_PLACEHOLDER_IMAGES[5],
    icon: Leaf,
  },
  {
    title: 'Leaf Arrangement - Top View',
    info: 'Take a photo from above showing the leaves along the stem.',
    placeholder: STEP_PLACEHOLDER_IMAGES[6],
    icon: Leaf,
  },
  {
    title: 'Leaf Arrangement - Bottom View',
    info: 'Take a photo from below showing the leaves along the stem.',
    note: '💡 Switch to selfie mode, place your phone under the leaf, and take a photo.',
    placeholder: STEP_PLACEHOLDER_IMAGES[7],
    icon: Leaf,
  },
  {
    title: 'Flower - Top View',
    info: 'Take a close-up photo of the flower from above.',
    note: '📌 Choose one flower and bring the camera closer to capture its details clearly.',
    placeholder: STEP_PLACEHOLDER_IMAGES[8],
    icon: Flower,
  },
  {
    title: 'Flower - Side View',
    info: 'Take a close-up photo of the flower from the side.',
    note: '📌 Choose one flower and bring the camera closer to capture its details clearly.',
    placeholder: STEP_PLACEHOLDER_IMAGES[9],
    icon: Flower,
  },
  {
    title: 'Fruit - Top View',
    info: 'Take a close-up photo of the fruit from above.',
    note: '📌 Choose one fruit and bring the camera closer to capture its details clearly.\n💡 Fruits can look very different! They may appear as berries, pods, fluffy or feathery heads, dry capsules, or even changing colors as they grow.',
    placeholder: STEP_PLACEHOLDER_IMAGES[10],
    icon: Cube,
  },
  {
    title: 'Fruit - Side View',
    info: 'Take a close-up photo of the fruit from the side.',
    note: '📌 Choose one fruit and bring the camera closer to capture its details clearly.',
    placeholder: STEP_PLACEHOLDER_IMAGES[11],
    icon: Cube,
  },
  {
    title: 'Special Features',
    info: 'Take close-up photos of any special features, such as thorns, hairs, bumps, patterns, or unusual textures.',
    note: '💡 Feel free to take more than one photo if the plant has several interesting features.',
    placeholder: STEP_PLACEHOLDER_IMAGES[12],
    icon: Sparkles,
  },
  {
    title: 'Group of Plants',
    info: 'Take a photo showing how the same plant grow in group.',
    placeholder: STEP_PLACEHOLDER_IMAGES[13],
    icon: Tree,
  },
];

export const TOTAL_STEPS = STEPS.length;
export const SPECIAL_FEATURES_INDEX = 12;
