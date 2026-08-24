import CoreLocation
import Foundation

/// Matches Android's utils/LocationUtils.kt distance formatting exactly.
enum LocationFormat {
    static func distanceString(fromKilometers km: Double) -> String {
        if km < 0.1 {
            let meters = Int((km * 1000).rounded())
            return "\(meters) m"
        } else if km < 10 {
            return String(format: "%.1f km", km)
        } else {
            return "\(Int(km.rounded())) km"
        }
    }
}

extension CLLocation {
    /// iOS equivalent of Android's `Location.distanceBetween` (both are
    /// great-circle distance, not a hand-rolled Haversine formula — see
    /// ios/context/ARCHITECTURE.md). Returns kilometers.
    func distanceKm(to other: CLLocation) -> Double {
        distance(from: other) / 1000
    }
}

/// Not marked @MainActor: CLLocationManager delivers delegate callbacks on the
/// thread it was started from, which in practice is main since `.shared` is
/// first touched from SwiftUI. Keeping this off @MainActor avoids an isolation
/// mismatch with the un-isolated CLLocationManagerDelegate requirements.
final class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    static let shared = LocationService()

    private let manager = CLLocationManager()
    private let geocoder = CLGeocoder()

    @Published var currentLocation: CLLocation?
    @Published var detectedCity: String?
    @Published var authorizationStatus: CLAuthorizationStatus

    override init() {
        authorizationStatus = manager.authorizationStatus
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func requestLocation() {
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        default:
            break
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        currentLocation = location
        reverseGeocode(location)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Silently ignored — Android likewise relies on cached last location with no hard error UI.
    }

    private func reverseGeocode(_ location: CLLocation) {
        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, _ in
            guard let self, let placemark = placemarks?.first else { return }
            self.detectedCity = placemark.locality ?? placemark.subAdministrativeArea
        }
    }

    /// Geocodes a salon's address string to a coordinate, for per-card distance display.
    func geocode(address: String, city: String?) async -> CLLocationCoordinate2D? {
        guard !address.isEmpty else { return nil }
        let query = city.map { "\(address), \($0)" } ?? address
        return await withCheckedContinuation { continuation in
            geocoder.geocodeAddressString(query) { placemarks, _ in
                continuation.resume(returning: placemarks?.first?.location?.coordinate)
            }
        }
    }
}
