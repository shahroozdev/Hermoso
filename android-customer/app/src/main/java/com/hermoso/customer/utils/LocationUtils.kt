package com.hermoso.customer.utils

import android.content.Context
import android.location.Geocoder
import android.location.Location
import android.os.Build
import kotlin.math.roundToInt
import java.util.Locale

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @return Distance in kilometers, formatted as string (e.g., "2.5 km")
 */
fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): String {
    val results = FloatArray(1)
    Location.distanceBetween(lat1, lon1, lat2, lon2, results)
    val distanceInMeters = results[0]
    val distanceInKm = distanceInMeters / 1000.0
    
    return when {
        distanceInKm < 0.1 -> "${(distanceInMeters).roundToInt()} m"
        distanceInKm < 10 -> String.format(Locale.US, "%.1f km", distanceInKm)
        else -> "${distanceInKm.roundToInt()} km"
    }
}

/**
 * Calculates distance between user's location and a salon
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param salonLat Salon's latitude
 * @param salonLon Salon's longitude
 * @return Formatted distance string or null if coordinates are invalid
 */
fun calculateSalonDistance(
    userLat: Double?,
    userLon: Double?,
    salonLat: Double?,
    salonLon: Double?
): String? {
    if (userLat == null || userLon == null || salonLat == null || salonLon == null) {
        return null
    }
    
    return try {
        calculateDistance(userLat, userLon, salonLat, salonLon)
    } catch (e: Exception) {
        null
    }
}

/**
 * Geocodes a salon address string to latitude and longitude coordinates
 * @param context Android context for Geocoder
 * @param address The salon address (e.g., "near farid gate, house #123")
 * @param city The city where the salon is located
 * @return Pair of latitude and longitude, or null if geocoding fails
 */
suspend fun geocodeSalonAddress(
    context: Context,
    address: String?,
    city: String?
): Pair<Double, Double>? {
    if (address.isNullOrBlank()) return null
    
    return try {
        val geocoder = Geocoder(context, Locale.getDefault())
        
        // Combine address and city for better geocoding accuracy
        val fullAddress = if (city.isNullOrBlank()) address else "$address, $city"
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // New API for Android 13+
            var result: Pair<Double, Double>? = null
            geocoder.getFromLocationName(fullAddress, 1) { addresses ->
                if (addresses.isNotEmpty()) {
                    val location = addresses[0]
                    result = location.latitude to location.longitude
                }
            }
            result
        } else {
            // Deprecated API for older versions
            @Suppress("DEPRECATION")
            geocoder.getFromLocationName(fullAddress, 1)?.firstOrNull()?.let {
                it.latitude to it.longitude
            }
        }
    } catch (e: Exception) {
        null
    }
}
