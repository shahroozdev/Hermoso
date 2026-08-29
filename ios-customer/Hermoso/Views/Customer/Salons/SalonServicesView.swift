import SwiftUI
import UIKit

/// Matches ios/context/SCREENS.md screen 13 / SalonServicesScreen.kt. Sticky
/// bottom booking bar only appears once a service is selected.
struct SalonServicesView: View {
    @StateObject private var viewModel: SalonServicesViewModel
    @Environment(\.dismiss) private var dismiss
    var onBookService: (String) -> Void

    init(salonId: String, onBookService: @escaping (String) -> Void = { _ in }) {
        _viewModel = StateObject(wrappedValue: SalonServicesViewModel(salonId: salonId))
        self.onBookService = onBookService
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    hero
                    servicesList
                    reviewSection
                }
            }
            .background(Color.hermosoCream)

            if viewModel.selectedService != nil {
                bookingBar
            }
        }
        .navigationBarHidden(true)
        .ignoresSafeArea(edges: .top)
        .task { await viewModel.load() }
    }

    /// No Google Maps API key is configured in this project, so instead of an
    /// embedded map, tapping the location opens it in Apple Maps (no key needed).
    private func openInMaps() {
        let addressText = viewModel.salon?.address ?? viewModel.salon?.location?.city ?? ""
        let query = "\(viewModel.salon?.name ?? "") \(addressText)".trimmingCharacters(in: .whitespaces)
        guard
            let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
            let url = URL(string: "https://maps.apple.com/?q=\(encoded)")
        else { return }
        UIApplication.shared.open(url)
    }

    private var hero: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(colors: [Color.hermosoPurpleDeeper, Color.hermosoPurpleDark], startPoint: .top, endPoint: .bottom)
                .frame(height: 300)

            VStack(alignment: .leading, spacing: 6) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .foregroundColor(.white)
                        .padding(10)
                        .background(Circle().fill(Color.white.opacity(0.15)))
                }
                .accessibilityLabel("Back")
                .padding(.bottom, 8)

                Text(viewModel.salon?.name ?? "")
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundColor(.white)

                if let city = viewModel.salon?.location?.city {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.circle.fill").foregroundColor(Color.hermosoPurpleLight)
                        Text(city)
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.85))
                            .underline()
                    }
                    .onTapGesture { openInMaps() }
                }
                if let description = viewModel.salon?.description, !description.isEmpty {
                    Text(description)
                        .font(.system(size: 11.5))
                        .foregroundColor(.white.opacity(0.75))
                        .lineLimit(3)
                }
            }
            .padding(20)
            .padding(.top, 44)
        }
    }

    @ViewBuilder
    private var servicesList: some View {
        if viewModel.isLoading {
            ProgressView()
                .tint(Color.hermosoPurple)
                .padding(.top, 40)
                .frame(maxWidth: .infinity)
        } else if let error = viewModel.errorMessage {
            ErrorRetryView(message: error).padding(20)
        } else {
            VStack(alignment: .leading, spacing: 10) {
                Text("Services").font(.system(size: 14, weight: .bold)).foregroundColor(Color.hermosoTextDark)
                ForEach(viewModel.salon?.services ?? []) { service in
                    serviceRow(service)
                }
            }
            .padding(16)
        }
    }

    private func serviceRow(_ service: ServiceDto) -> some View {
        let isSelected = viewModel.selectedServiceId == service.id
        return Button {
            viewModel.selectedServiceId = service.id
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(service.name ?? "").font(.system(size: 13.5, weight: .bold)).foregroundColor(Color.hermosoTextDark)
                    Text("\(service.duration ?? 0) min").font(.system(size: 11)).foregroundColor(Color.hermosoTextMuted)
                }
                Spacer()
                Text("PKR \(Int(service.price ?? 0))").font(.system(size: 13, weight: .bold)).foregroundColor(Color.hermosoPurple)
            }
            .padding(14)
            .background(isSelected ? Color.hermosoPurple.opacity(0.1) : Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(isSelected ? Color.hermosoPurple : Color.clear, lineWidth: 2)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private var reviewSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Write a Review").font(.system(size: 14, weight: .bold)).foregroundColor(Color.hermosoTextDark)

            HStack(spacing: 4) {
                ForEach(1...5, id: \.self) { star in
                    Image(systemName: star <= viewModel.reviewRating ? "star.fill" : "star")
                        .foregroundColor(star <= viewModel.reviewRating ? Color(hex: "#FBBF24") : Color.hermosoTextMuted.opacity(0.4))
                        .font(.system(size: 24))
                        .onTapGesture {
                            viewModel.reviewRating = star
                            viewModel.reviewSubmitted = false
                        }
                }
            }

            TextField("Share your experience (optional)", text: $viewModel.reviewComment, axis: .vertical)
                .lineLimit(3...6)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.hermosoFieldBorder, lineWidth: 1.4)
                )

            if let reviewError = viewModel.reviewError {
                Text(reviewError).font(.footnote).foregroundColor(Color.hermosoError)
            }
            if viewModel.reviewSubmitted {
                Text("Thanks! Your review has been submitted.").font(.footnote).foregroundColor(Color.hermosoOtpSuccess)
            }

            Button {
                Task { await viewModel.submitReview() }
            } label: {
                if viewModel.isSubmittingReview {
                    ProgressView().tint(.white).frame(maxWidth: .infinity)
                } else {
                    Text("Submit Review").font(.system(size: 14, weight: .bold)).foregroundColor(.white).frame(maxWidth: .infinity)
                }
            }
            .padding(.vertical, 13)
            .background(Color.hermosoPurple)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .disabled(viewModel.isSubmittingReview)
        }
        .padding(16)
        .padding(.bottom, 100)
    }

    private var bookingBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 1) {
                Text("Selected").font(.system(size: 10.5)).foregroundColor(Color.hermosoTextMuted)
                Text(viewModel.selectedService?.name ?? "").font(.system(size: 12.5, weight: .bold)).foregroundColor(Color.hermosoTextDark)
            }
            Spacer()
            Button {
                if let id = viewModel.selectedServiceId {
                    onBookService(id)
                }
            } label: {
                Text("Book Now")
                    .font(.system(size: 13, weight: .bold))
                    .padding(.horizontal, 22)
                    .padding(.vertical, 11)
                    .background(Color.hermosoPurple)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color.white)
        .shadow(color: Color.hermosoPurpleDeeper.opacity(0.12), radius: 16, y: -4)
    }
}

#Preview {
    SalonServicesView(salonId: "preview")
}
