package com.example.myapplication.app

import androidx.compose.ui.graphics.Color
import com.example.myapplication.ui.theme.*

data class Salon(val name: String, val rating: Double, val distanceKm: Double, val gradient: List<Color>)
data class Event(val tag: String, val title: String, val desc: String, val gradient: List<Color>)
data class ScanMetric(val name: String, val value: Int, val level: String)
data class Treatment(val icon: String, val name: String, val reason: String, val price: String, val duration: String)
data class Match(val name: String, val location: String, val distanceKm: Double, val matchPercent: Int, val services: List<String>)
data class ProgressMetric(val name: String, val after: Int, val changeLabel: String, val positive: Boolean)

val mockSalons = listOf(
    Salon("Glam Studio Lahore", 4.9, 0.8, listOf(PurpleDark, PurpleLight)),
    Salon("Velvet Beauty Lounge", 4.7, 1.2, listOf(Color(0xFFBE185D), Color(0xFFF472B6))),
    Salon("Serenity Aesthetics", 4.8, 2.1, listOf(Color(0xFF065F46), Color(0xFF34D399)))
)

val mockEvents = listOf(
    Event("Bridal", "Complete Bridal Package", "Hair · Makeup · Skin · Nails", listOf(PurpleDeeper, Color(0xFF6B21A8))),
    Event("Party", "Party Glam Makeover", "Makeup · Hair · Touch-up", listOf(Color(0xFF831843), Color(0xFFDB2777))),
    Event("Eid Special", "Eid Glow Package", "Facial · Waxing · Threading", listOf(Color(0xFF1E3A5F), Color(0xFF3B82F6)))
)

val scanMetrics = listOf(
    ScanMetric("Hydration Level", 62, "62%"),
    ScanMetric("Sun Damage", 28, "Low"),
    ScanMetric("Skin Clarity", 78, "Good"),
    ScanMetric("Pigmentation", 44, "Mild"),
    ScanMetric("Skin Barrier", 70, "Strong")
)

val mockTreatments = listOf(
    Treatment("💧", "Hydra Facial", "Hydration is below optimal. Delivers deep hydration for your skin profile.", "PKR 4,500", "60 min"),
    Treatment("✨", "Vitamin C Glow Treatment", "Targets mild pigmentation and improves glow.", "PKR 3,200", "45 min"),
    Treatment("🌙", "Pigmentation Chemical Peel", "Recommended every 3-4 weeks for visible tone correction.", "PKR 5,000", "50 min"),
    Treatment("💡", "LED Light Therapy", "Supports collagen and reduces inflammation.", "PKR 2,500", "30 min")
)

val mockMatches = listOf(
    Match("Serenity Aesthetics Clinic", "Gulberg III, Lahore", 1.4, 94, listOf("Hydra Facial ✓", "Vitamin C ✓", "LED Therapy ✓", "Chemical Peel ✓")),
    Match("Glam Studio Lahore", "DHA Phase 5, Lahore", 0.8, 87, listOf("Hydra Facial ✓", "Vitamin C ✓", "Hair Care")),
    Match("Velvet Beauty Lounge", "Model Town, Lahore", 2.3, 74, listOf("LED Therapy ✓", "Facial", "Bridal"))
)

val progressMetrics = listOf(
    ProgressMetric("💧 Hydration", 62, "↑ +18%", true),
    ProgressMetric("✨ Clarity", 78, "↑ +22%", true),
    ProgressMetric("🌑 Pigmentation", 44, "↓ -15%", false),
    ProgressMetric("🛡️ Skin Barrier", 70, "↑ +12%", true)
)
