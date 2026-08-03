import SwiftUI

@main
struct HermosoApp: App {
    var body: some Scene {
        WindowGroup {
            // Android's HermosoTheme always renders light (darkTheme param is
            // never set true at any call site), and none of the hardcoded
            // hermoso* colors have dark variants — match that, don't half-support it.
            ContentView()
                .preferredColorScheme(.light)
        }
    }
}
