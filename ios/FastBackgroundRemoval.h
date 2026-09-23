#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "FastBackgroundRemovalSpec.h"

@interface FastBackgroundRemoval : NSObject <NativeFastBackgroundRemovalSpec>
#else
@interface FastBackgroundRemoval : NSObject <RCTBridgeModule>
#endif

@end