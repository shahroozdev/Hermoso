import Foundation

struct CheckoutRequest: Codable {
    let bookingId: String
}

struct CheckoutData: Codable {
    let checkoutUrl: String?
    let tracker: String?
    let alreadyPaid: Bool?
    let message: String?
}

struct PaymentStatusData: Codable {
    let status: String?
    let paidAt: String?
    let amountInPaisa: Int?
    let tracker: String?
    let booking: BookingItemDto?
}

struct RefundRequest: Codable {
    let bookingId: String
    let reason: String
}

struct RefundData: Codable {
    let refundId: String?
    let status: String?
    let amountInPaisa: Int?
    let message: String?
}

struct RefundDto: Codable, Identifiable {
    let _id: String?
    let amountInPaisa: Int?
    let status: String?
    let reason: String?
    let createdAt: String?

    var id: String { _id ?? UUID().uuidString }
}
