import SwiftUI

struct PaymentSuccessView: View {
    let tracker: String
    let onViewBookings: () -> Void

    @State private var countdown = 5

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .resizable()
                .frame(width: 80, height: 80)
                .foregroundColor(.green)

            Text("Payment Confirmed")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Your booking has been confirmed successfully.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Spacer()

            Button(action: onViewBookings) {
                Text("View My Bookings")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color.purple)
                    .foregroundColor(.white)
                    .cornerRadius(16)
            }

            Text("Redirecting in \(countdown) seconds...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(24)
        .onAppear {
            startCountdown()
        }
    }

    private func startCountdown() {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
            if countdown > 0 {
                countdown -= 1
            } else {
                timer.invalidate()
                onViewBookings()
            }
        }
    }
}
