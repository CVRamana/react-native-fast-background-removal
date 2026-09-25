import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { removeBackground } from 'react-native-fast-background-removal';

export default function App() {
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. select image from gallery
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });

    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      setOriginalUri(result.assets[0].uri);
      setProcessedUri(null); // reset old result
    }
  };

  // 2. remove background
  const handleRemoveBackground = async () => {
    if (!originalUri) {
      Alert.alert('Attention', 'Please select a photo from the gallery first!');
      return;
    }

    try {
      setLoading(true);
      const startTime = Date.now();

      // Call the native module to remove background
      const transparentImageUri = await removeBackground(originalUri);

      const duration = Date.now() - startTime;
      console.log(`Processing time: ${duration}ms`);

      setProcessedUri(transparentImageUri);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'बैकग्राउंड रिमूव नहीं हो पाया');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Fast Background Removal</Text>
        <Text style={styles.subheading}>100% On-Device AI Engine</Text>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Choose Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.actionButton, !originalUri && styles.disabledButton]}
            onPress={handleRemoveBackground}
            disabled={!originalUri || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Processing...' : 'Remove Background'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>AI model is running...</Text>
          </View>
        )}

        {/* Display Images */}
        <View style={styles.previewContainer}>
          {originalUri && (
            <View style={styles.imageCard}>
              <Text style={styles.imageLabel}>Original Photo</Text>
              <Image source={{ uri: originalUri }} style={styles.previewImage} />
            </View>
          )}

          {processedUri && (
            <View style={[styles.imageCard, styles.checkerboardBg]}>
              <Text style={styles.imageLabel}>Background Removed (PNG)</Text>
              <Image source={{ uri: processedUri }} style={styles.previewImage} resizeMode="contain" />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 10,
  },
  subheading: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  actionButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#A0C4FF',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  loaderContainer: {
    marginVertical: 15,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#555',
    fontSize: 13,
  },
  previewContainer: {
    width: '100%',
    gap: 20,
  },
  imageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  checkerboardBg: {
    backgroundColor: '#E0E0E0', // ट्रांसपेरेंसी देखने के लिए लाइट बैकग्राउंड
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  previewImage: {
    width: 260,
    height: 260,
    borderRadius: 8,
  },
});