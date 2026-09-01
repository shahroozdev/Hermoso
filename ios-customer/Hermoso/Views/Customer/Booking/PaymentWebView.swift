import SwiftUI
import WebKit

/// Uses WKWebView rather than SFSafariViewController because we need to
/// inspect each navigation's URL to detect the payment gateway's redirect
/// back to our success/failure routes — SFSafariViewController deliberately
/// never exposes the URL it's displaying.
struct PaymentWebView: UIViewRepresentable {
    let checkoutUrl: String
    let onSuccess: (String) -> Void
    let onFailed: (String) -> Void

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        if let url = URL(string: checkoutUrl) {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        let parent: PaymentWebView

        init(_ parent: PaymentWebView) {
            self.parent = parent
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }

            let urlString = url.absoluteString
            let tracker = URLComponents(url: url, resolvingAgainstBaseURL: false)?
                .queryItems?.first(where: { $0.name == "tracker" })?.value

            if urlString.contains("/external/complete") || urlString.contains("payment/success") {
                if let tracker { parent.onSuccess(tracker) }
                decisionHandler(.cancel)
            } else if urlString.contains("/external/error") || urlString.contains("payment/failed") {
                if let tracker { parent.onFailed(tracker) }
                decisionHandler(.cancel)
            } else {
                decisionHandler(.allow)
            }
        }
    }
}
