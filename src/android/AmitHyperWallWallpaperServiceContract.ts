/**
 * AMIT HYPERWALL — NATIVE ANDROID LIVE WALLPAPER SERVICE CONTRACT
 *
 * App Name: Amit HyperWall
 * Owner: Amit Meena
 * Tagline: Offline 3D Universe Engine
 *
 * ARCHITECTURAL CONTRACT:
 * -----------------------
 * In native Android, system Live Wallpapers are rendered by extending
 * `android.service.wallpaper.WallpaperService`.
 *
 * Architecture Chain:
 * WallpaperService
 *   └── WallpaperService.Engine
 *         └── WebView / Hardware Accelerated Canvas Layer (or Native GLES/Vulkan)
 *               └── Amit HyperWall WebGL/Three.js Engine Configuration
 *
 * IMPORTANT NOTE ON BROWSER SANDBOX:
 * Standard browsers (Chrome, Firefox, Safari) and standard PWAs cannot set the OS
 * wallpaper directly due to Android security restrictions. When compiled or wrapped
 * as an Android APK, this Service Contract manages the wallpaper lifecycle.
 */

export interface AndroidServiceContractInfo {
  serviceName: string;
  packageTarget: string;
  minSdkVersion: number;
  targetSdkVersion: number;
  permissionsRequired: string[];
  supportedLifecycles: string[];
  ipcContractVersion: string;
}

export const AMIT_HYPERWALL_SERVICE_CONTRACT: AndroidServiceContractInfo = {
  serviceName: 'AmitHyperWallWallpaperService',
  packageTarget: 'com.amitmeena.hyperwall',
  minSdkVersion: 26, // Android 8.0 Oreo (Hardware acceleration & modern sensors)
  targetSdkVersion: 34, // Android 14
  permissionsRequired: [
    'android.permission.SET_WALLPAPER',
    'android.permission.INTERNET', // For local loopback webview hosting only
    'android.permission.ACCESS_NETWORK_STATE'
  ],
  supportedLifecycles: [
    'onCreate',
    'onSurfaceCreated',
    'onSurfaceChanged',
    'onVisibilityChanged',
    'onOffsetsChanged',
    'onCommand',
    'onSurfaceDestroyed',
    'onDestroy'
  ],
  ipcContractVersion: '1.5.0'
};

/**
 * Sample Kotlin Implementation Contract for AmitHyperWallWallpaperService:
 */
export const KOTLIN_WALLPAPER_SERVICE_TEMPLATE = `
package com.amitmeena.hyperwall

import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONObject

/**
 * AmitHyperWallWallpaperService
 * Bridges the Amit HyperWall 3D engine into the Android System Live Wallpaper manager.
 */
class AmitHyperWallWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine {
        return HyperWallEngine()
    }

    inner class HyperWallEngine : Engine() {
        private var webView: WebView? = null
        private var isVisible: Boolean = false

        override fun onCreate(surfaceHolder: SurfaceHolder?) {
            super.onCreate(surfaceHolder)
            // Initialize hardware accelerated WebView container
            webView = WebView(this@AmitHyperWallWallpaperService).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false
                settings.cacheMode = WebSettings.LOAD_CACHE_ONLY // 100% Offline
                addJavascriptInterface(AndroidBridgeInterface(), "AmitHyperWallAndroidBridge")
                loadUrl("file:///android_asset/hyperwall/index.html")
            }
        }

        override fun onVisibilityChanged(visible: Boolean) {
            super.onVisibilityChanged(visible)
            this.isVisible = visible
            val cmd = if (visible) "RESUME" else "PAUSE"
            dispatchWebMessage(cmd, JSONObject().put("visible", visible))
        }

        override fun onOffsetsChanged(xOffset: Float, yOffset: Float, xOffsetStep: Float, yOffsetStep: Float, xPixelOffset: Int, yPixelOffset: Int) {
            super.onOffsetsChanged(xOffset, yOffset, xOffsetStep, yOffsetStep, xPixelOffset, yPixelOffset)
            val payload = JSONObject().apply {
                put("xOffset", xOffset)
                put("yOffset", yOffset)
            }
            dispatchWebMessage("DEVICE_STATE", payload)
        }

        override fun onDestroy() {
            super.onDestroy()
            webView?.destroy()
            webView = null
        }

        private fun dispatchWebMessage(type: String, payload: JSONObject) {
            val json = JSONObject().apply {
                put("type", type)
                put("timestamp", System.currentTimeMillis())
                put("payload", payload)
            }
            webView?.post {
                webView?.evaluateJavascript("window.onNativeAndroidMessage(\${json.toString()});", null)
            }
        }

        inner class AndroidBridgeInterface {
            @JavascriptInterface
            fun postMessage(rawJson: String) {
                // Parse validated JSON command from Amit HyperWall engine
                val json = JSONObject(rawJson)
                val type = json.optString("type")
                when (type) {
                    "INIT" -> { /* Sync initial display metrics */ }
                    "SET_WALLPAPER" -> { /* Save active wallpaper preference */ }
                    "SET_QUALITY" -> { /* Update rendering target resolution */ }
                }
            }
        }
    }
}
`;
