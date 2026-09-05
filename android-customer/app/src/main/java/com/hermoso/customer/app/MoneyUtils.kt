package com.hermoso.customer.app

/**
 * The API returns all money as integer paisa (1 rupee = 100 paisa).
 * This formats it back to the "PKR 4,500" style used throughout the app.
 */
fun Long?.toPkr(): String = "PKR " + String.format("%,d", (this ?: 0L) / 100)
