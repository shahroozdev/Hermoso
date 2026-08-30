import SwiftUI

struct RefundSheetView: View {
    let bookingId: String
    let onDismiss: () -> Void

    @State private var reason = ""
    @State private var customReason = ""
    @State private var selectedReasonIndex = -1
    @State private var submitting = false
    @State private var message = ""
    @State private var errorMessage = ""

    private let reasons = [
        "Change of plan",
        "Salon cancelled the booking",
        "Duplicate charge",
        "Technical error - charged but not confirmed",
        "Other"
    ]

    private let api: AuthApiProtocol

    init(bookingId: String, onDismiss: @escaping () -> Void, api: AuthApiProtocol = AuthApi()) {
        self.bookingId = bookingId
        self.onDismiss = onDismiss
        self.api = api
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Request Refund")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("Please select a reason for your refund request. Refunds are processed within 3-5 business days and reflected in 7-14 business days.")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Reason for refund")
                            .font(.subheadline)
                            .fontWeight(.medium)

                        ForEach(Array(reasons.enumerated()), id: \.offset) { index, reasonText in
                            Button(action: {
                                selectedReasonIndex = index
                                reason = reasonText
                            }) {
                                HStack {
                                    Image(systemName: selectedReasonIndex == index ? "checkmark.circle.fill" : "circle")
                                        .foregroundColor(selectedReasonIndex == index ? .purple : .gray)
                                    Text(reasonText)
                                        .foregroundColor(.primary)
                                    Spacer()
                                }
                                .padding(12)
                                .background(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(selectedReasonIndex == index ? Color.purple : Color.gray.opacity(0.3), lineWidth: 1)
                                )
                            }
                        }

                        if selectedReasonIndex == reasons.count - 1 {
                            TextField("Describe your reason", text: $customReason)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                    }

                    if !message.isEmpty {
                        Text(message)
                            .foregroundColor(.green)
                            .font(.caption)
                    }

                    if !errorMessage.isEmpty {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }

                    Button(action: submitRefund) {
                        if submitting {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                        } else {
                            Text("Submit Refund Request")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(canSubmit ? Color.purple : Color.gray)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    .disabled(!canSubmit || submitting)
                }
                .padding()
            }
            .navigationBarItems(trailing: Button("Cancel") { onDismiss() })
        }
    }

    private var canSubmit: Bool {
        selectedReasonIndex >= 0 && (selectedReasonIndex != reasons.count - 1 || !customReason.isEmpty)
    }

    private func submitRefund() {
        guard canSubmit else { return }
        submitting = true
        errorMessage = ""

        let finalReason = selectedReasonIndex == reasons.count - 1 ? customReason : reason

        Task {
            do {
                let response = try await api.requestRefund(bookingId: bookingId, reason: finalReason)
                if response.success {
                    message = "Your refund request has been submitted."
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        onDismiss()
                    }
                } else {
                    errorMessage = response.message ?? "Failed to submit refund request"
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            submitting = false
        }
    }
}
