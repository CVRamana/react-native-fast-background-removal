# react-native-fast-background-removal 🚀

Lightning-fast, 100% on-device AI background removal for React Native. **No third-party APIs. No subscriptions. Completely private.**

![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-brightgreen.svg)
![Architecture](<https://img.shields.io/badge/Architecture-TurboModules%20(New%20Arch)-blue.svg>)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 🌟 Why this package?

Most background removal packages in the React Native ecosystem rely on paid third-party cloud APIs (like remove.bg), which require constant internet access, cost money per API call, and compromise user privacy by uploading sensitive images to external servers.

**This package is different.** It leverages the raw power of native on-device AI engines:

- **🤖 Android:** Uses **Google ML Kit (Subject Segmentation)** directly at the Java layer.
- **🍎 iOS:** Uses **Apple Vision Framework** (`VNGenerateForegroundInstanceMaskRequest`) directly at the Objective-C++ layer.

### Key Benefits

- **100% Offline & Free:** No recurring API costs. Works completely without internet (after the initial model download on Android).
- **Privacy First:** Images never leave the user's device.
- **Blazing Fast:** Built with React Native's New Architecture (TurboModules) to ensure zero UI-thread blocking and zero Javascript-bridge bottlenecks.

---

## 📦 Installation

```bash
npm install react-native-fast-background-removal
# or
yarn add react-native-fast-background-removal
```

### iOS Setup

Install the CocoaPods dependencies:

```bash
cd ios && pod install && cd ..
```

### Android Setup

Google ML Kit dynamically downloads the AI model the first time it is needed to keep your initial App size incredibly small. You **must** add this metadata tag to your `AndroidManifest.xml` to allow Google Play Services to download the model seamlessly.

Open `android/app/src/main/AndroidManifest.xml` and add this inside the `<application>` tag:

```xml
<application ...>
    <!-- REQUIRED: Tells ML Kit to download the Subject Segmentation model -->
    <meta-data
        android:name="com.google.mlkit.vision.DEPENDENCIES"
        android:value="subject_segment" />
</application>
```

---

## 💻 Usage

The API is incredibly simple. Pass a local file URI, and it returns a new local file URI pointing to a transparent `.png` image saved in the device's temporary cache.

```tsx
import React, { useState } from 'react';
import { View, Image, Button, Alert } from 'react-native';
import { removeBackground } from 'react-native-fast-background-removal';

export default function App() {
  const [processedUri, setProcessedUri] = useState<string | null>(null);

  const handleRemoveBackground = async (imageUri: string) => {
    try {
      // Pass the original image URI (e.g., from react-native-image-picker)
      const transparentImageUri = await removeBackground(imageUri);

      setProcessedUri(transparentImageUri);
    } catch (error: any) {
      const errorMessage = error?.message || '';

      // Handle the Android first-time download scenario
      if (errorMessage.toLowerCase().includes('download')) {
        Alert.alert(
          'Downloading AI Model',
          'The AI model is downloading in the background. Please wait a minute and try again.'
        );
      } else {
        console.error('Background removal failed:', error);
      }
    }
  };

  return (
    <View 'center' 'center', 1, alignItems: flex: justifyContent: style="{{" }}>
      {processedUri && (
        <Image 300 300, height: processedUri resizeMode="contain" source="{{" style="{{" uri: width: }}/>
      )}
      <Button onPress="{()" title="Remove Background"> handleRemoveBackground('file://path/to/your/image.jpg')}
      />
    </View>
  );
}
```

---

## ⚠️ Important Limitations & Known Behaviors

Because this package relies heavily on device-specific hardware accelerators and OS-level AI models, please note the following platform behaviors:

### 🍎 iOS: The Simulator Neural Engine Limitation

- **Requires iOS 17+:** Apple introduced `VNGenerateForegroundInstanceMaskRequest` in iOS 17. Devices running iOS 16 or below will throw an `UNSUPPORTED_IOS_VERSION` error.
- **Works Best on Physical Devices:** If you test this package on an iOS Simulator, you may encounter a `VISION_ERROR: Could not create inference context`. This is a known Apple Xcode/Simulator bug. The Simulator often fails to emulate the iPhone's Neural Engine (NPU) required for this heavy AI task.
- **Solution:** Always test iOS background removal on a physical iPhone connected via cable. It will run flawlessly and instantly on physical hardware.

### 🤖 Android: The First-Run Download

- **Play Services Dependency:** To keep your app's install size tiny, Google ML Kit does not bundle the ~20MB Subject Segmentation model inside your APK/AAB.
- **Initial Delay:** The very first time a user triggers this function (or installs the app, thanks to the Manifest tag), Google Play Services downloads the model in the background. If the user clicks "Remove Background" before the download finishes, the catch block will throw an error mentioning that the model is still downloading.
- **Solution:** Handle this gracefully in your UI (as shown in the code example above). Once downloaded, the feature works 100% offline forever.
- **Emulator Note:** Android Emulators without Google Play Store configured will fail to download the model. Ensure your AVD has the Google Play Store icon enabled.

---

## 🛠 Under the Hood

- **Android:** Utilizes `com.google.android.gms:play-services-mlkit-subject-segmentation:16.0.0-beta1`. Converts URIs to `Bitmap`, processes via ML Kit, and caches a compressed PNG.
- **iOS:** Utilizes `Vision` and `CoreImage` frameworks. Extracts a `CVPixelBufferRef` mask and applies `CIBlendWithMask` to generate a high-fidelity transparent PNG.
