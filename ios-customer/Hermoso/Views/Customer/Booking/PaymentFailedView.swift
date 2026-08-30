import SwiftUI

struct PaymentFailedView: View {
    let tracker: String
    let onRetry: () -> Void
    let onViewBookings: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "xmark.circle.fill")
                .resizable()
                .frame(width: 80, height: 80)
                .foregroundColor(.red)

            Text("Payment Failed")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Your payment could not be processed.\nThis could be due to insufficient funds, a declined card, or a timeout.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            if !tracker.isEmpty {
                VStack(spacing: 4) {
                    Text("Transaction Reference")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(tracker)
                        .font(.caption)
                        .foregroundColor(.primary)
                }
            }

            Spacer()

            Button(action: onRetry) {
                Text("Try Again")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color.purple)
                    .foregroundColor(.white)
                    .cornerRadius(16)
            }

            Button(action: onViewBookings) {
                Text("View Bookings")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.gray, lineWidth: 1)
                    )
                    .foregroundColor(.primary)
            }
        }
        .padding(24)
    }
}
