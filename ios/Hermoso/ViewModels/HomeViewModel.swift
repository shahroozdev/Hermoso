import CoreLocation
import Foundation

@MainActor
final class HomeViewModel: ObservableObject {
    struct SalonCardModel: Identifiable {
        let salon: SalonDto
        var distanceText: String?
        var id: String { salon.id }
    }

    @Published var categories: [CategoryDto] = []
    @Published var salons: [SalonCardModel] = []
    @Published var events: [EventDto] = []
    @Published var selectedCategoryId: String?
    @Published var searchQuery = ""

    @Published var isLoadingSalons = false
    @Published var salonsError: String?
    @Published var eventsError: String?

    private let api: AuthApiProtocol
    private let location: LocationService
    private var loadTask: Task<Void, Never>?

    init(api: AuthApiProtocol = AuthApi(), location: LocationService = .shared) {
        self.api = api
        self.location = location
    }

    var greeting: String {
        switch Calendar.current.component(.hour, from: Date()) {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        case 17..<21: return "Good evening"
        default: return "Good night"
        }
    }

    var firstName: String {
        let name = SessionManager.shared.userName ?? ""
        return name.split(separator: " ").first.map(String.init) ?? "Beautiful"
    }

    /// Debounces on city/search changes exactly like HomeScreen.kt (300ms), then
    /// fires three independent, independently-erroring loads — a failure in one
    /// doesn't block the others (see ios/context/SCREENS.md screen 3).
    func scheduleLoad() {
        loadTask?.cancel()
        loadTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 300_000_000)
            guard let self, !Task.isCancelled else { return }
            await self.loadAll()
        }
    }

    /// Pull-to-refresh entry point — bypasses the debounce so the refresh
    /// spinner resolves immediately instead of waiting 300ms.
    func refresh() async {
        await loadAll()
    }

    private func loadAll() async {
        async let categoriesTask: Void = loadCategories()
        async let salonsTask: Void = loadSalons()
        async let eventsTask: Void = loadEvents()
        _ = await (categoriesTask, salonsTask, eventsTask)
    }

    private func loadCategories() async {
        do {
            let response = try await api.getCategories()
            var all = [CategoryDto(_id: nil, name: "All")]
            all.append(contentsOf: response.data ?? [])
            categories = all
        } catch {
            // Matches Android: no dedicated error banner for categories, just stays empty.
        }
    }

    private func loadSalons() async {
        isLoadingSalons = true
        salonsError = nil
        defer { isLoadingSalons = false }
        do {
            let response = try await api.getSalons(
                page: 1, limit: 20,
                city: location.detectedCity,
                search: searchQuery.isEmpty ? nil : searchQuery
            )
            let list = response.data ?? []
            var cards: [SalonCardModel] = []
            for salon in list {
                var card = SalonCardModel(salon: salon)
                if let userLocation = location.currentLocation,
                   let address = salon.location?.address, !address.isEmpty,
                   let coordinate = await location.geocode(address: address, city: salon.location?.city) {
                    let salonLocation = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
                    card.distanceText = LocationFormat.distanceString(fromKilometers: userLocation.distanceKm(to: salonLocation))
                }
                cards.append(card)
            }
            salons = cards
        } catch {
            salonsError = error.localizedDescription
        }
    }

    private func loadEvents() async {
        eventsError = nil
        do {
            let response = try await api.getEvents(page: 1, limit: 10)
            events = response.data ?? []
        } catch {
            eventsError = error.localizedDescription
        }
    }
}
