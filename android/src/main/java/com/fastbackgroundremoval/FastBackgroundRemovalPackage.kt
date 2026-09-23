package com.fastbackgroundremoval

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.HashMap

class FastBackgroundRemovalPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == FastBackgroundRemovalModule.NAME) {
      FastBackgroundRemovalModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      FastBackgroundRemovalModule.NAME to ReactModuleInfo(
        name = FastBackgroundRemovalModule.NAME,
        className = FastBackgroundRemovalModule.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true
      )
    )
  }
}
