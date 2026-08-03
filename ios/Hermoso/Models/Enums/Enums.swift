import Foundation

enum UserRole: String, Codable {
    case customer
    case salonOwner = "salon_owner"
}

/// State machine is one-directional/sticky — see ScanCameraViewModel (Phase 4).
/// Order matters: ordinal comparisons drive the "done" vs "active" badge styling,
/// matching Android's LivenessStep enum declaration order.
enum LivenessStep: Int, Comparable {
    case blink
    case smile
    case turnLeft
    case completed

    static func < (lhs: LivenessStep, rhs: LivenessStep) -> Bool { lhs.rawValue < rhs.rawValue }
}

enum BookingStatus: String, Codable {
    case pending
    case confirmed
    case completed
    case cancelled
}

enum ScanCategory: String, CaseIterable {
    case skinTone
    case eyebrows
    case hydration
    case darkCircles
    case acne
    case lipPigmentation
    case treatmentPlan
    case dietAnalysis
}
