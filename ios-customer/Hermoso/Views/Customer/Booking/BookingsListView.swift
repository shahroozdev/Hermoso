import SwiftUI

/// Matches ios/context/SCREENS.md screen 8 / BookingListScreen.kt.
struct BookingsListView: View {
    @StateObject private var viewModel = BookingsListViewModel()
    @State private var showRefundSheet = false
    @State private var selectedBookingForRefund: BookingItemDto?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                content
            }
        }
        .background(Color.hermosoCream)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
        .sheet(isPresented: $showRefundSheet) {
            RefundSheetView(
                bookingId: selectedBookingForRefund?._id ?? "",
                onDismiss: {
                    showRefundSheet = false
                    selectedBookingForRefund = nil
                }
            )
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("My Bookings")
                .font(.system(size: 19, weight: .heavy))
                .foregroundColor(Color.hermosoTextDark)
            Text("Your upcoming and recent appointments")
                .font(.caption)
                .foregroundColor(Color.hermosoTextMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .tint(Color.hermosoPurple)
                .padding(.top, 60)
                .frame(maxWidth: .infinity)
        } else if let error = viewModel.errorMessage {
            ErrorRetryView(message: error) { Task { await viewModel.load() } }
                .padding(20)
                .frame(maxWidth: .infinity)
        } else if viewModel.bookings.isEmpty {
            EmptyStateView(message: "No bookings yet.", topPadding: 60, centered: true)
        } else {
            VStack(spacing: 8) {
                ForEach(viewModel.bookings) { booking in
                    bookingCard(booking)
                }
            }
            .padding(16)
            .padding(.bottom, 90)
        }
    }

    private func bookingCard(_ booking: BookingItemDto) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(booking.serviceId?.name ?? "")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(Color.hermosoTextDark)
            Text(booking.salonId?.name ?? "")
                .font(.system(size: 12))
                .foregroundColor(Color.hermosoTextMuted)
            if let date = booking.bookingDate, let time = booking.bookingTime {
                let formatted = HermosoDateFormat.date(date)
                Text("\(formatted.isEmpty ? date : formatted) - \(time)")
                    .font(.system(size: 11.5))
                    .foregroundColor(Color.hermosoTextMuted)
            }
            HStack {
                StatusBadgeView(status: booking.status)
                Spacer()
                if booking.status == "confirmed" {
                    Button("Refund") {
                        selectedBookingForRefund = booking
                        showRefundSheet = true
                    }
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.red)
                }
                Text(booking.priceInPaisa.asPkr())
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color.hermosoPurple)
            }
            .padding(.top, 4)
        }
        .padding(14)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

#Preview {
    BookingsListView()
}
