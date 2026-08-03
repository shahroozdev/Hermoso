import Combine
import SwiftUI

/// Matches ios/context/SCREENS.md screen 3 exactly: greeting computed from
/// device hour, live per-card salon distance, category chips, events row.
struct HomeView: View {
    @ObservedObject var viewModel: HomeViewModel
    @ObservedObject private var location = LocationService.shared
    var onSelectSalon: (String) -> Void = { _ in }
    var onSeeAllSalons: () -> Void = {}

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                heroHeader
                categoriesRow
                salonsSection
                eventsSection
            }
        }
        .background(Color.hermosoCream)
        .onAppear {
            location.requestLocation()
            viewModel.scheduleLoad()
        }
        .onChange(of: viewModel.searchQuery) { _ in viewModel.scheduleLoad() }
        .onReceive(location.$detectedCity) { _ in viewModel.scheduleLoad() }
        .refreshable { await viewModel.refresh() }
    }

    private var heroHeader: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text("\(viewModel.greeting), \(viewModel.firstName)")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.75))
            }
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.white.opacity(0.75))
                TextField(
                    "",
                    text: $viewModel.searchQuery,
                    prompt: Text("Search salons by name...").foregroundColor(.white.opacity(0.6))
                )
                .foregroundColor(.white)
            }
            .padding(.horizontal, 14)
            .frame(height: 44)
            .background(Color.white.opacity(0.15))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [Color.hermosoPurpleDeeper, Color.hermosoPurpleDark, Color.hermosoPurple],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
    }

    private var subtitle: String {
        if let city = location.detectedCity, !city.isEmpty {
            return "Showing nearby salons in \(city)"
        }
        return "Your AI beauty companion is ready"
    }

    private var categoriesRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(viewModel.categories) { category in
                    let isSelected = (viewModel.selectedCategoryId ?? viewModel.categories.first?.id) == category.id
                    Text(category.name ?? "")
                        .font(.system(size: 12.5, weight: .semibold))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(isSelected ? Color.hermosoPurple : Color.hermosoPurplePale)
                        .foregroundColor(isSelected ? .white : Color.hermosoPurple)
                        .clipShape(Capsule())
                        .onTapGesture { viewModel.selectedCategoryId = category.id }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
        }
    }

    private var salonsSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Top Salons")
                    .font(.system(size: 15.5, weight: .bold))
                    .foregroundColor(Color.hermosoTextDark)
                Spacer()
                Button(action: onSeeAllSalons) {
                    Text("See all")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color.hermosoPurple)
                }
            }
            .padding(.horizontal, 20)

            if let error = viewModel.salonsError {
                Text(error)
                    .font(.footnote)
                    .foregroundColor(Color.hermosoError)
                    .padding(.horizontal, 20)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(viewModel.salons) { card in
                            Button {
                                onSelectSalon(card.salon.id)
                            } label: {
                                SalonCardView(card: card)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 6)
                }
            }
        }
        .padding(.top, 4)
    }

    private var eventsSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Events")
                .font(.system(size: 15.5, weight: .bold))
                .foregroundColor(Color.hermosoTextDark)
                .padding(.horizontal, 20)

            if let error = viewModel.eventsError {
                Text(error)
                    .font(.footnote)
                    .foregroundColor(Color.hermosoError)
                    .padding(.horizontal, 20)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(Array(viewModel.events.enumerated()), id: \.element.id) { index, event in
                            EventCardView(event: event, gradientIndex: index % 5)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 6)
                }
            }
        }
        .padding(.top, 8)
        .padding(.bottom, 90)
    }
}

#Preview {
    HomeView(viewModel: HomeViewModel())
}
