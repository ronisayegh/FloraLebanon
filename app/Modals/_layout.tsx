import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Stack } from 'expo-router';

const modalOptions: NativeStackNavigationOptions = {
  presentation: 'fullScreenModal',
  headerShown: false,
  gestureEnabled: false,
  animation: 'slide_from_bottom',
};
export default function () {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CameraRoll" options={modalOptions} />
      <Stack.Screen name="MultiStepCapture" options={modalOptions} />
      <Stack.Screen name="Submissions" options={modalOptions} />
      <Stack.Screen name="SubmissionDetail" options={modalOptions} />
      <Stack.Screen name="MissionMissingPlants" options={modalOptions} />
      <Stack.Screen name="PlantDetail" options={modalOptions} />
      <Stack.Screen name="MissionFewVillages" options={modalOptions} />
      <Stack.Screen name="OrganizationMembers" options={modalOptions} />
      <Stack.Screen name="RequestOrganization" options={modalOptions} />
      <Stack.Screen name="RequestVillage" options={modalOptions} />
    </Stack>
  );
}
