import SwiftUI

/// AI-recommended flow: each matched treatment is an independent mini
/// booking flow with its own staff/date/slots/submit — matches
/// BookingScreen.kt's isAiBooking mode exactly (N separate cards, not shared
/// steps). See ios/context/SCREENS.md screen 7.
struct AiBookingView: View {
    @StateObject private var viewModel: AiBookingViewModel

    init(salonId: String, treatments: [String]) {
        _viewModel = StateObject(wrappedValue: AiBookingViewModel(salonId: salonId, treatments: treatments))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                VStack(alignment: .leading, spacing: 16) {
                    infoBanner
                    content
                }
                .padding(16)
            }
        }
        .background(Color.hermosoCream)
        .task { await viewModel.start() }
    }

    private var header: some View {
        Text("AI Recommended Treatments")
            .font(.system(size: 16, weight: .heavy))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(
                LinearGradient(
                    colors: [Color.hermosoPurpleDeeper, Color.hermosoPurpleDark, Color.hermosoPurple],
                    startPoint: .leading, endPoint: .trailing
                )
            )
    }

    private var infoBanner: some View {
        HStack(alignment: .top, spacing: 10) {
            Text("★").foregroundColor(Color.hermosoPurple)
            VStack(alignment: .leading, spacing: 2) {
                Text("AI-Recommended")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(Color.hermosoPurple)
                Text("Book each treatment separately with your preferred staff")
                    .font(.system(size: 11.5))
                    .foregroundColor(Color.hermosoTextMuted)
            }
        }
        .padding(14)
        .background(Color.hermosoPurple.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .tint(Color.hermosoPurple)
                .frame(maxWidth: .infinity)
                .padding(.top, 30)
        } else if let error = viewModel.errorMessage {
            Text(error).foregroundColor(Color.hermosoError)
        } else {
            ForEach(viewModel.cardViewModels) { cardViewModel in
                ServiceBookingCard(viewModel: cardViewModel)
            }
        }
    }
}

#Preview {
    AiBookingView(salonId: "preview", treatments: ["Hydrafacial"])
}
