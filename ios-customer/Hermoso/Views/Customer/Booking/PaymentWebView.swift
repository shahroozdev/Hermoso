import SwiftUI
import SafariServices

struct PaymentWebView: UIViewControllerRepresentable {
    let checkoutUrl: String
    let onSuccess: (String) -> Void
    let onFailed: (String) -> Void

    func makeUIViewController(context: Context) -> SFSafariViewController {
        let controller = SFSafariViewController(url: URL(string: checkoutUrl) ?? URL(string: "https://example.com")!)
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, SFSafariViewControllerDelegate {
        let parent: PaymentWebView

        init(_ parent: PaymentWebView) {
            self.parent = parent
        }

        func safariViewController(_ controller: SFSafariViewController, didCompleteInitialLoad didLoadSuccessfully: Bool) {
            let url = controller.url.absoluteString
            if url.contains("/external/complete") || url.contains("payment/success") {
                if let components = URLComponents(url: controller.url, resolvingAgainstBaseURL: false),
                   let trackerItem = components.queryItems?.first(where: { $0.name == "tracker" }),
                   let tracker = trackerItem.value {
                    parent.onSuccess(tracker)
                }
            } else if url.contains("/external/error") || url.contains("payment/failed") {
                if let components = URLComponents(url: controller.url, resolvingAgainstBaseURL: false),
                   let trackerItem = components.queryItems?.first(where: { $0.name == "tracker" }),
                   let tracker = trackerItem.value {
                    parent.onFailed(tracker)
                }
            }
        }

        func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
            controller.dismiss(animated: true)
        }
    }
}
