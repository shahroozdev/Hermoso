import SwiftUI

/// Matches ios/context/SCREENS.md screen 8 / BookingListScreen.kt.
struct BookingsListView: View {
    @StateObject private var viewModel = BookingsListViewModel()

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
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("My Bookings")
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(Color.hermosoTextDark)
            Text("Your upcoming and recent appointments")
                .font(.caption)
                .foregroundStyle(Color.hermosoTextMuted)
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
            VStack(spacing: 12) {
                Text(error).foregroundStyle(Color.hermosoError)
                Button("Retry") { Task { await viewModel.load() } }
                    .foregroundStyle(Color.hermosoPurple)
            }
            .padding(20)
            .frame(maxWidth: .infinity)
        } else if viewModel.bookings.isEmpty {
            Text("No bookings yet.")
                .foregroundStyle(Color.hermosoTextMuted)
                .padding(.top, 60)
                .frame(maxWidth: .infinity)
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
                .foregroundStyle(Color.hermosoTextDark)
            Text(booking.salonId?.name ?? "")
                .font(.system(size: 12))
                .foregroundStyle(Color.hermosoTextMuted)
            if let date = booking.bookingDate, let time = booking.bookingTime {
                let formatted = HermosoDateFormat.date(date)
                Text("\(formatted.isEmpty ? date : formatted) - \(time)")
                    .font(.system(size: 11.5))
                    .foregroundStyle(Color.hermosoTextMuted)
            }
            HStack {
                StatusBadgeView(status: booking.status)
                Spacer()
                Text("PKR \(Int(booking.price ?? 0))")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.hermosoPurple)
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
