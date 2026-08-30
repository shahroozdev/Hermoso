package com.hermoso.customer.app

import android.annotation.SuppressLint
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.hermoso.customer.ui.theme.Purple

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PaymentWebViewScreen(
    checkoutUrl: String,
    onSuccess: (String) -> Unit,
    onFailed: (String) -> Unit
) {
    var isLoading by remember { mutableStateOf(true) }

    Box(modifier = Modifier.fillMaxSize().background(androidx.compose.ui.graphics.Color.White)) {
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.allowFileAccess = true

                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                            val url = request?.url?.toString() ?: return false

                            if (url.contains("/external/complete")) {
                                val tracker = Uri.parse(url).getQueryParameter("tracker")
                                if (tracker != null) {
                                    onSuccess(tracker)
                                    return true
                                }
                            }

                            if (url.contains("/external/error")) {
                                val tracker = Uri.parse(url).getQueryParameter("tracker")
                                if (tracker != null) {
                                    onFailed(tracker)
                                    return true
                                }
                            }

                            if (url.contains("hermoso://payment/success")) {
                                val tracker = Uri.parse(url).lastPathSegment
                                if (tracker != null) {
                                    onSuccess(tracker)
                                    return true
                                }
                            }

                            if (url.contains("hermoso://payment/failed")) {
                                val tracker = Uri.parse(url).lastPathSegment
                                if (tracker != null) {
                                    onFailed(tracker)
                                    return true
                                }
                            }

                            return false
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            isLoading = false
                        }
                    }

                    loadUrl(checkoutUrl)
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize().background(androidx.compose.ui.graphics.Color.White),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Purple, modifier = Modifier.size(48.dp))
            }
        }
    }
}
