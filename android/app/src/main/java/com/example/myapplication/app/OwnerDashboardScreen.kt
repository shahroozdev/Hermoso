package com.example.myapplication.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.myapplication.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun OwnerDashboardScreen() {
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var dashboard by remember { mutableStateOf<OwnerDashboardDataDto?>(null) }

    LaunchedEffect(Unit) {
        loading = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getOwnerDashboard() }
            dashboard = response.data
            if (!response.success) error = response.message ?: "Failed to load dashboard"
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load dashboard"
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(PurpleDeeper)) {
        if (loading) {
            item { Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) { CircularProgressIndicator(color = PurpleLight) } }
        }
        if (error.isNotBlank()) {
            item { Text(error, color = Color(0xFFFCA5A5), modifier = Modifier.padding(16.dp)) }
        }
        item {
            val totals = dashboard?.totals
            Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OwnerStatCard("Today", "${totals?.dailyBookings ?: 0}", Modifier.weight(1f))
                OwnerStatCard("Upcoming", "${totals?.upcomingAppointments ?: 0}", Modifier.weight(1f))
            }
        }
        item {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OwnerStatCard("Gross", "PKR ${(dashboard?.totals?.grossRevenue ?: 0.0).toInt()}", Modifier.weight(1f))
                OwnerStatCard("Net", "PKR ${(dashboard?.totals?.netRevenue ?: 0.0).toInt()}", Modifier.weight(1f))
            }
        }
        item { Text("Bookings by month", color = PurpleLight, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp)) }
        items(dashboard?.charts?.bookingsByMonth ?: emptyList()) { row ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp),
                colors = CardDefaults.cardColors(containerColor = PurpleDark),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(row.month ?: "-", color = Cream)
                    Text("${row.totalBookings ?: 0}", color = PurpleLight, fontWeight = FontWeight.Bold)
                }
            }
        }
        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun OwnerStatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = PurpleDark),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(label, color = TextMuted)
            Spacer(Modifier.height(4.dp))
            Text(value, color = PurpleLight, fontWeight = FontWeight.Bold)
        }
    }
}
