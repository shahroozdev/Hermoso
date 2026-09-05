import Foundation

/// The API returns all money as integer paisa (1 rupee = 100 paisa).
/// This formats it back to the "PKR 4,500" style used throughout the app.
extension Optional where Wrapped == Int {
    func asPkr() -> String {
        let paisa = self ?? 0
        let rupees = paisa / 100
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = ","
        let formatted = formatter.string(from: NSNumber(value: rupees)) ?? "\(rupees)"
        return "PKR \(formatted)"
    }
}
