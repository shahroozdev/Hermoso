import CoreLocation
import SwiftUI

/// Matches ios/context/SCREENS.md screen 12 / SalonsScreen.kt.
///
/// ⚠️ Deliberate improvement over Android: real per-salon distance is
/// computed via LocationService (like HomeView already does), instead of
/// Android's hardcoded fake "0.8 km" on every single row — an explicit mock
/// left in the Kotlin source (code comment: "Mock distance matching image
/// design"). Replicating a known-fake value felt worse than fixing it here.
struct SalonsListView: View {
    @StateObject private var viewModel: SalonsListViewModel
    @ObservedObject private var location = LocationService.shared
    @State private var distances: [String: String] = [:]
    var onSelectSalon: (String) -> Void

    init(initialCity: String? = nil, onSelectSalon: @escaping (String) -> Void = { _ in }) {
        _viewModel = StateObject(wrappedValue: SalonsListViewModel(initialCity: initialCity))
        self.onSelectSalon = onSelectSalon
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                content
            }
        }
        .background(Color.hermosoCream)
        .refreshable {
            await viewModel.load()
            await computeDistances()
        }
        .task {
            await viewModel.load()
            await computeDistances()
        }
        .onChange(of: viewModel.searchQuery) { _ in Task { await viewModel.load(); await computeDistances() } }
        .onChange(of: viewModel.cityQuery) { _ in Task { await viewModel.load(); await computeDistances() } }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Explore Salons")
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(.white)
            searchField("Search by name...", text: $viewModel.searchQuery)
            searchField("Filter by city...", text: $viewModel.cityQuery)
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [Color.hermosoPurpleDeeper, Color.hermosoPurpleDark, Color.hermosoPurple],
                startPoint: .leading, endPoint: .trailing
            )
        )
    }

    private func searchField(_ placeholder: String, text: Binding<String>) -> some View {
        TextField("", text: text, prompt: Text(placeholder).foregroundStyle(.white.opacity(0.6)))
            .foregroundStyle(.white)
            .padding(.horizontal, 12)
            .frame(height: 40)
            .background(Color.white.opacity(0.15))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .tint(Color.hermosoPurple)
                .padding(.top, 40)
                .frame(maxWidth: .infinity)
        } else if let error = viewModel.errorMessage {
            Text(error).foregroundStyle(Color.hermosoError).padding(20)
        } else {
            VStack(spacing: 12) {
                ForEach(viewModel.salons) { salon in
                    salonRow(salon)
                }
            }
            .padding(16)
        }
    }

    private func salonRow(_ salon: SalonDto) -> some View {
        let rating = salon.avgRating ?? 0
        return Button {
            onSelectSalon(salon.id)
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                LinearGradient(colors: [Color.hermosoPurple, Color.hermosoPurpleLight], startPoint: .topLeading, endPoint: .bottomTrailing)
                    .frame(height: 130)
                VStack(alignment: .leading, spacing: 4) {
                    Text(salon.name ?? "")
                        .font(.system(size: 14.5, weight: .bold))
                        .foregroundStyle(Color.hermosoTextDark)
                    HStack(spacing: 2) {
                        ForEach(0..<5, id: \.self) { index in
                            Image(systemName: index < Int(rating.rounded()) ? "star.fill" : "star")
                                .font(.system(size: 11))
                                .foregroundStyle(Color(hex: "#FFB800"))
                        }
                        Text("· \(distances[salon.id] ?? "-- km")")
                            .font(.system(size: 11.5))
                            .foregroundStyle(Color.hermosoTextMuted)
                    }
                }
                .padding(12)
            }
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func computeDistances() async {
        guard let userLocation = location.currentLocation else { return }
        for salon in viewModel.salons {
            guard let address = salon.location?.address, !address.isEmpty else { continue }
            if let coordinate = await location.geocode(address: address, city: salon.location?.city) {
                let salonLocation = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
                distances[salon.id] = LocationFormat.distanceString(fromKilometers: userLocation.distanceKm(to: salonLocation))
            }
        }
    }
}

#Preview {
    SalonsListView(onSelectSalon: { _ in })
}
