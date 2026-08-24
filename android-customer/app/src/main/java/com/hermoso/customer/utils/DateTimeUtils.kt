package com.hermoso.customer.utils

import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Formats an ISO 8601 timestamp string into a readable format
 * @param timestampString ISO 8601 formatted timestamp string (nullable)
 * @return Formatted string like "12 May, 2026 2:00 PM", or empty string if parsing fails
 */
fun formatTimestamp(timestampString: String?): String {
    if (timestampString.isNullOrEmpty()) return ""

    return try {
        // Parse the incoming ISO string
        val parsedDate = ZonedDateTime.parse(timestampString)

        // Define your desired output format
        val formatter = DateTimeFormatter.ofPattern("dd MMM, yyyy h:mm a", Locale.ENGLISH)

        parsedDate.format(formatter) // Returns "12 May, 2026 2:00 PM"
    } catch (e: Exception) {
        "" // Fallback if parsing fails
    }
}

/**
 * Extracts and formats only the date from an ISO 8601 timestamp string
 * @param timestampString ISO 8601 formatted timestamp string (nullable)
 * @return Formatted string like "12 May, 2026", or empty string if parsing fails
 */
fun formatDate(timestampString: String?): String {
    if (timestampString.isNullOrEmpty()) return ""

    return try {
        val parsedDate = ZonedDateTime.parse(timestampString)
        val formatter = DateTimeFormatter.ofPattern("dd MMM, yyyy", Locale.ENGLISH)
        parsedDate.format(formatter) // Returns "12 May, 2026"
    } catch (e: Exception) {
        "" // Fallback if parsing fails
    }
}

/**
 * Extracts and formats only the time from an ISO 8601 timestamp string
 * @param timestampString ISO 8601 formatted timestamp string (nullable)
 * @return Formatted string like "2:00 PM", or empty string if parsing fails
 */
fun formatTime(timestampString: String?): String {
    if (timestampString.isNullOrEmpty()) return ""

    return try {
        val parsedDate = ZonedDateTime.parse(timestampString)
        val formatter = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH)
        parsedDate.format(formatter) // Returns "2:00 PM"
    } catch (e: Exception) {
        "" // Fallback if parsing fails
    }
}
