package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    window.decorView.setBackgroundColor(Color.parseColor("#05070E"))
    setContent {
      MyApplicationTheme {
        Box(
          modifier = Modifier
            .fillMaxSize()
            .background(androidx.compose.ui.graphics.Color(0xFF05070E))
            .testTag("hyperwall_root_container")
        ) {
          HyperWallWebView()
        }
      }
    }
  }
}

class AndroidWallpaperBridge(private val context: Context) {
  @JavascriptInterface
  fun getPlatform(): String = "Android-AmitHyperWall"

  @JavascriptInterface
  fun isLiveWallpaperReady(): Boolean = true

  @JavascriptInterface
  fun onWallpaperChanged(wallpaperId: String) {
    android.util.Log.d("AmitHyperWall", "Active wallpaper switched to: $wallpaperId")
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun HyperWallWebView(modifier: Modifier = Modifier) {
  val context = LocalContext.current
  val bridge = remember { AndroidWallpaperBridge(context) }

  AndroidView(
    modifier = modifier
      .fillMaxSize()
      .testTag("hyperwall_web_view"),
    factory = { ctx ->
      WebView(ctx).apply {
        setBackgroundColor(Color.parseColor("#05070E"))
        setLayerType(View.LAYER_TYPE_HARDWARE, null)

        settings.apply {
          javaScriptEnabled = true
          domStorageEnabled = true
          allowFileAccess = true
          allowContentAccess = true
          databaseEnabled = true
          cacheMode = WebSettings.LOAD_DEFAULT
          useWideViewPort = true
          loadWithOverviewMode = true
          mediaPlaybackRequiresUserGesture = false
        }

        addJavascriptInterface(bridge, "AndroidBridge")

        webChromeClient = WebChromeClient()
        webViewClient = object : WebViewClient() {
          override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
          }
        }

        loadUrl("file:///android_asset/web/index.html")
      }
    }
  )
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
  Text(text = "Hello $name!", modifier = modifier)
}
