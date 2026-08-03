import SwiftUI

/// Matches ios/context/SCREENS.md screen 14 / OwnerDashboardScreen.kt.
/// ⚠️ "Bookings by Month" is a plain list, NOT an actual chart — no charting
/// library is used in Android, and none is added here either.
struct OwnerDashboardView: View {
    @StateObject private var viewModel = OwnerDashboardViewModel()

    var body: some View {
        ScrollView {
            content
                .padding(16)
        }
        .background(Color.hermosoPurpleDeeper)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .tint(Color.hermosoPurpleLight)
                .padding(.top, 60)
                .frame(maxWidth: .infinity)
        } else if let error = viewModel.errorMessage {
            VStack(spacing: 12) {
                Text(error).foregroundColor(Color(hex: "#FCA5A5"))
                Button("Retry") { Task { await viewModel.load() } }
                    .foregroundColor(Color.hermosoPurpleLight)
            }
            .padding(.top, 60)
            .frame(maxWidth: .infinity)
        } else {
            VStack(alignment: .leading, spacing: 14) {
                Text("Dashboard")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(Color.hermosoCream)

                HStack(spacing: 10) {
                    statCard("Today's Bookings", "\(viewModel.totals?.dailyBookings ?? 0)")
                    statCard("Upcoming", "\(viewModel.totals?.upcomingAppointments ?? 0)")
                }
                HStack(spacing: 10) {
                    statCard("Gross Revenue", "PKR \(Int(viewModel.totals?.grossRevenue ?? 0))")
                    statCard("Net Revenue", "PKR \(Int(viewModel.totals?.netRevenue ?? 0))")
                }

                if viewModel.showAiReferrals {
                    aiReferralsCard
                }

                Text("Bookings by Month")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(Color.hermosoCream)

                ForEach(viewModel.bookingsByMonth) { month in
                    monthRow(month)
                }
            }
        }
    }

    private func statCard(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(Color.hermosoTextMuted)
            Text(value)
                .font(.system(size: value.count > 10 ? 15 : 20, weight: .heavy))
                .foregroundColor(Color.hermosoPurpleLight)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.hermosoPurpleDark)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private var aiReferralsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("✨ AI Scan Referrals")
                .font(.system(size: 12.5, weight: .bold))
                .foregroundColor(Color(hex: "#10B981"))
            HStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(viewModel.totals?.aiScanBookings ?? 0)")
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundColor(Color(hex: "#10B981"))
                    Text("Bookings").font(.system(size: 10.5)).foregroundColor(Color.hermosoTextMuted)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("PKR \(Int(viewModel.totals?.aiScanRevenue ?? 0))")
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundColor(Color(hex: "#10B981"))
                    Text("Revenue").font(.system(size: 10.5)).foregroundColor(Color.hermosoTextMuted)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "#065F46").opacity(0.2))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func monthRow(_ month: MonthBookingChartDto) -> some View {
        HStack {
            Text(month.month ?? "").foregroundColor(Color.hermosoCream)
            Spacer()
            Text("\(month.totalBookings ?? 0) bookings")
                .foregroundColor(Color.hermosoPurpleLight)
                .fontWeight(.bold)
        }
        .font(.system(size: 12.5))
        .padding(14)
        .background(Color.hermosoPurpleDark)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#Preview {
    OwnerDashboardView()
}
