package com.example.myapplication.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.myapplication.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun OwnerInsightsScreen() {
    var message by remember { mutableStateOf("Loading AI insights...") }

    LaunchedEffect(Unit) {
        message = try {
            val dashboard = withContext(Dispatchers.IO) { AuthApiClient.api.getOwnerDashboard() }
            val upcoming = dashboard.data?.totals?.upcomingAppointments ?: 0
            val net = (dashboard.data?.totals?.netRevenue ?: 0.0).toInt()
            "AI suggests promoting your top service this week. You have $upcoming upcoming bookings and PKR $net net revenue trend."
        } catch (_: Throwable) {
            "Unable to fetch AI insight right now."
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(PurpleDeeper).padding(16.dp)) {
        Card(colors = CardDefaults.cardColors(containerColor = PurpleDark), shape = RoundedCornerShape(14.dp)) {
            Column(Modifier.padding(14.dp)) {
                Text("AI Business Insights", color = PurpleLight, fontWeight = FontWeight.Bold)
                Text(message, color = TextMuted, modifier = Modifier.padding(top = 8.dp))
            }
        }
    }
}
