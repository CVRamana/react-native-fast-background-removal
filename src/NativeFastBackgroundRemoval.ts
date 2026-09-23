import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  removeBackground(imageUri: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FastBackgroundRemoval');
