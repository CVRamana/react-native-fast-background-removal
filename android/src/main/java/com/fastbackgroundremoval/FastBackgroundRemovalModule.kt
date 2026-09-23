package com.fastbackgroundremoval

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.IOException

class FastBackgroundRemovalModule(reactContext: ReactApplicationContext) :
  NativeFastBackgroundRemovalSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  override fun removeBackground(imageUri: String, promise: Promise) {
    try {
      val uri = Uri.parse(imageUri)
      
      // ContentResolver से इनपुट स्ट्रीम खोलकर Bitmap लोड करें (100% reliable)
      val inputStream: InputStream? = reactApplicationContext.contentResolver.openInputStream(uri)
      val inputBitmap = BitmapFactory.decodeStream(inputStream)
      inputStream?.close()

      if (inputBitmap == null) {
        promise.reject("IMAGE_DECODE_ERROR", "Failed to decode bitmap from URI: $imageUri")
        return
      }

      // Bitmap से InputImage बनाएं
      val image = InputImage.fromBitmap(inputBitmap, 0)

      val options = SubjectSegmenterOptions.Builder()
        .enableForegroundBitmap()
        .build()

      val segmenter = SubjectSegmentation.getClient(options)

      segmenter.process(image)
        .addOnSuccessListener { result ->
          val foregroundBitmap = result.foregroundBitmap
          if (foregroundBitmap != null) {
            try {
              val outputPath = saveBitmapToCache(foregroundBitmap)
              promise.resolve(outputPath)
            } catch (e: IOException) {
              promise.reject("SAVE_ERROR", "Failed to save transparent image", e)
            }
          } else {
            promise.reject("SEGMENTATION_ERROR", "Could not extract foreground subject")
          }
        }
        .addOnFailureListener { e ->
          promise.reject("ML_KIT_ERROR", "Background removal failed: ${e.localizedMessage}", e)
        }

    } catch (e: Exception) {
      promise.reject("IMAGE_LOAD_ERROR", "Error processing image URI: ${e.localizedMessage}", e)
    }
  }

  private fun saveBitmapToCache(bitmap: Bitmap): String {
    val cacheDir = reactApplicationContext.cacheDir
    val outputFile = File.createTempFile("bg_removed_", ".png", cacheDir)

    FileOutputStream(outputFile).use { out ->
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
      out.flush()
    }

    return "file://${outputFile.absolutePath}"
  }

  companion object {
    const val NAME = "FastBackgroundRemoval"
  }
}