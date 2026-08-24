import Foundation

enum Config {
    /// Android's default is http://10.0.2.2:5000/api/ (emulator loopback alias).
    /// iOS Simulator can reach the Mac host directly via localhost.
    static let apiBaseURL = URL(string: "http://localhost:5000/api/")!
}
