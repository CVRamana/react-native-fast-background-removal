#import "FastBackgroundRemoval.h"
#import <Vision/Vision.h>
#import <CoreImage/CoreImage.h>
#import <CoreImage/CIFilterBuiltins.h>
#import <UIKit/UIKit.h>

@implementation FastBackgroundRemoval

RCT_EXPORT_MODULE(FastBackgroundRemoval)

RCT_EXPORT_METHOD(removeBackground:(NSString *)imageUri
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  // 1. URI से Path क्लीन करें
  NSString *cleanPath = [imageUri stringByReplacingOccurrencesOfString:@"file://" withString:@""];
  cleanPath = [cleanPath stringByRemovingPercentEncoding];
  NSURL *fileURL = [NSURL fileURLWithPath:cleanPath];

  CIImage *inputImage = [CIImage imageWithContentsOfURL:fileURL];
  if (!inputImage) {
    reject(@"LOAD_ERROR", [NSString stringWithFormat:@"Failed to load image from URI: %@", imageUri], nil);
    return;
  }

  // 2. iOS 17+ Vision Framework Check
  if (@available(iOS 17.0, *)) {
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
      NSError *error = nil;
      VNGenerateForegroundInstanceMaskRequest *request = [[VNGenerateForegroundInstanceMaskRequest alloc] init];
      VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:inputImage options:@{}];

      BOOL success = [handler performRequests:@[request] error:&error];
      if (!success || error) {
        reject(@"VISION_ERROR", error.localizedDescription, error);
        return;
      }

      VNInstanceMaskObservation *result = request.results.firstObject;
      if (!result) {
        reject(@"SEGMENTATION_ERROR", @"No foreground subject found", nil);
        return;
      }

      // मास्क पिक्सेल बफर निकालें
     
      CVPixelBufferRef maskPixelBuffer = [result generateScaledMaskForImageForInstances:result.allInstances fromRequestHandler:handler error:&error];
      if (error || !maskPixelBuffer) {
        reject(@"MASK_ERROR", @"Failed to create subject mask", error);
        return;
      }

      CIImage *maskImage = [CIImage imageWithCVPixelBuffer:maskPixelBuffer];

      // 3. Core Image Filter: ओरिजिनल इमेज पर मास्क लगाकर ट्रांसपेरेंट बैकग्राउंड दें
      CIFilter<CIBlendWithMask> *filter = (CIFilter<CIBlendWithMask> *)[CIFilter filterWithName:@"CIBlendWithMask"];
      [filter setValue:inputImage forKey:kCIInputImageKey];
      [filter setValue:maskImage forKey:kCIInputMaskImageKey];
      [filter setValue:[CIImage emptyImage] forKey:kCIInputBackgroundImageKey];

      CIImage *outputCIImage = filter.outputImage;
      if (!outputCIImage) {
        reject(@"FILTER_ERROR", @"Failed to blend subject with mask", nil);
        return;
      }

      // 4. CGImage रेंडर करके Cache में PNG सेव करें
      CIContext *context = [CIContext contextWithOptions:nil];
      CGImageRef cgImage = [context createCGImage:outputCIImage fromRect:outputCIImage.extent];
      if (!cgImage) {
        reject(@"RENDER_ERROR", @"Failed to render final CGImage", nil);
        return;
      }

      UIImage *transparentImage = [UIImage imageWithCGImage:cgImage];
      CGImageRelease(cgImage);

      NSData *pngData = UIImagePNGRepresentation(transparentImage);
      if (!pngData) {
        reject(@"PNG_ERROR", @"Failed to convert to PNG", nil);
        return;
      }

      NSString *filename = [NSString stringWithFormat:@"bg_removed_%@.png", [[NSUUID UUID] UUIDString]];
      NSURL *tempDir = [NSURL fileURLWithPath:NSTemporaryDirectory()];
      NSURL *fileOutputURL = [tempDir URLByAppendingPathComponent:filename];

      BOOL writeSuccess = [pngData writeToURL:fileOutputURL atomically:YES];
      if (writeSuccess) {
        resolve(fileOutputURL.absoluteString);
      } else {
        reject(@"SAVE_ERROR", @"Failed to write PNG to disk", nil);
      }
    });
  } else {
    reject(@"UNSUPPORTED_IOS_VERSION", @"Native background removal requires iOS 17 or higher", nil);
  }
}

// TurboModule Codegen Compatibility
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeFastBackgroundRemovalSpecJSI>(params);
}
#endif

@end
