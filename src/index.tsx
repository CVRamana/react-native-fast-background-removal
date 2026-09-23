import FastBackgroundRemoval from './NativeFastBackgroundRemoval';

export async function removeBackground(imageUri: string): Promise<string> {
  if (!imageUri || typeof imageUri !== 'string') {
    throw new Error(
      '[react-native-fast-background-removal] Valid imageUri must be provided.'
    );
  }

  // File URI वैलिडेशन (file:// या content://)
  return FastBackgroundRemoval.removeBackground(imageUri);
}
