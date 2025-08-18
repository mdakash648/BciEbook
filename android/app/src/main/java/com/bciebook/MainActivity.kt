package com.bciebook

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "BciEbook"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Override onCreate to implement screenshot blocking
   * This prevents screenshots and screen recordings using FLAG_SECURE
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    // Initialize splash screen if you have it
    // RNBootSplash.init(this, R.style.BootTheme)
    
    super.onCreate(savedInstanceState) // super with react-native-screens
    
    // Set FLAG_SECURE to prevent screenshots and screen recordings
    window.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )
    
    // Additional security flags for enhanced protection
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE or 
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
        WindowManager.LayoutParams.FLAG_SECURE or 
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      )
    }
  }
}
