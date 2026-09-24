package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
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
import java.io.InputStream

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
    Log.d("AmitHyperWall", "Active wallpaper switched to: $wallpaperId")
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
          databaseEnabled = true
          allowFileAccess = true
          allowContentAccess = true
          allowFileAccessFromFileURLs = true
          allowUniversalAccessFromFileURLs = true
          cacheMode = WebSettings.LOAD_DEFAULT
          useWideViewPort = true
          loadWithOverviewMode = true
          mediaPlaybackRequiresUserGesture = false
          mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        addJavascriptInterface(bridge, "AndroidBridge")

        webChromeClient = object : WebChromeClient() {
          override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
            Log.d(
              "HyperWallWeb",
              "${consoleMessage?.message()} [${consoleMessage?.sourceId()}:${consoleMessage?.lineNumber()}]"
            )
            return super.onConsoleMessage(consoleMessage)
          }
        }

        webViewClient = object : WebViewClient() {
          override fun shouldInterceptRequest(
            view: WebView?,
            request: WebResourceRequest?
          ): WebResourceResponse? {
            val url = request?.url ?: return null
            val isAppHost = (url.scheme == "https" && url.host == "appassets.local")
            val isAssetFile = (url.scheme == "file" && url.path?.contains("/android_asset/web") == true)

            if (isAppHost || isAssetFile) {
              val relativePath = if (isAppHost) {
                val p = url.path?.trimStart('/') ?: "index.html"
                if (p.isEmpty()) "index.html" else p
              } else {
                url.path?.substringAfter("/android_asset/web/")?.trimStart('/')?.ifEmpty { "index.html" } ?: "index.html"
              }

              val assetPath = "web/$relativePath"
              try {
                val stream: InputStream = ctx.assets.open(assetPath)
                val cleanPath = relativePath.lowercase()
                val mimeType = when {
                  cleanPath.endsWith(".html") || cleanPath.endsWith(".htm") -> "text/html"
                  cleanPath.endsWith(".js") || cleanPath.endsWith(".mjs") -> "application/javascript"
                  cleanPath.endsWith(".css") -> "text/css"
                  cleanPath.endsWith(".json") || cleanPath.endsWith(".webmanifest") -> "application/json"
                  cleanPath.endsWith(".svg") -> "image/svg+xml"
                  cleanPath.endsWith(".png") -> "image/png"
                  cleanPath.endsWith(".jpg") || cleanPath.endsWith(".jpeg") -> "image/jpeg"
                  cleanPath.endsWith(".webp") -> "image/webp"
                  cleanPath.endsWith(".ico") -> "image/x-icon"
                  cleanPath.endsWith(".woff2") -> "font/woff2"
                  cleanPath.endsWith(".woff") -> "font/woff"
                  cleanPath.endsWith(".ttf") -> "font/ttf"
                  else -> "application/octet-stream"
                }

                val headers = mapOf(
                  "Access-Control-Allow-Origin" to "*",
                  "Access-Control-Allow-Methods" to "GET, OPTIONS",
                  "Access-Control-Allow-Headers" to "*",
                  "Cache-Control" to "no-cache"
                )
                return WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, stream)
              } catch (e: Exception) {
                Log.w("HyperWallWeb", "Asset intercept fallback for: $assetPath - ${e.message}")
              }
            }
            return super.shouldInterceptRequest(view, request)
          }

          override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
          ) {
            super.onReceivedError(view, request, error)
            Log.e("HyperWallWeb", "WebView Error on ${request?.url}: ${error?.description}")
          }
        }

        loadUrl("https://appassets.local/index.html")
      }
    }
  )
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
  Text(text = "Hello $name!", modifier = modifier)
}

