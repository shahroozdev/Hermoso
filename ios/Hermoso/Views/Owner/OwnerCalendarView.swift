import SwiftUI

/// Matches ios/context/SCREENS.md screen 15 / OwnerCalendarScreen.kt.
/// ⚠️ Despite the name, this is NOT a real calendar UI — just today's
/// bookings, no date picker or month grid, matching Android exactly. A real
/// calendar/date-picker here would be a deliberate improvement beyond
/// Android, not a straight port — flag that as a scope decision if wanted.
struct OwnerCalendarView: View {
    @StateObject private var viewModel = OwnerCalendarViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Today's Bookings")
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundColor(Color.hermosoCream)
                    Text(Self.headerDateFormatter.string(from: Date()))
                        .font(.caption)
                        .foregroundColor(Color.hermosoTextMuted)
                }

                if viewModel.isLoading {
                    ProgressView()
                        .tint(Color.hermosoPurpleLight)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 30)
                } else if let error = viewModel.errorMessage {
                    Text(error).foregroundColor(Color(hex: "#FCA5A5"))
                } else if viewModel.bookings.isEmpty {
                    Text("No bookings today.").foregroundColor(Color.hermosoTextMuted)
                } else {
                    ForEach(viewModel.bookings) { booking in
                        bookingRow(booking)
                    }
                }
            }
            .padding(16)
        }
        .background(Color.hermosoPurpleDeeper)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }

    private func bookingRow(_ booking: BookingItemDto) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("\(booking.bookingTime ?? "") — \(booking.userId?.name ?? "")")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(Color.hermosoCream)
            Text(booking.serviceId?.name ?? "")
                .font(.system(size: 11.5))
                .foregroundColor(Color.hermosoTextMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.hermosoPurpleDark)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private static let headerDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, d MMM yyyy"
        return formatter
    }()
}

#Preview {
    OwnerCalendarView()
}
