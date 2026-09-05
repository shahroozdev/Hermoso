package com.hermoso.customer.app

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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hermoso.customer.ui.theme.*
import com.hermoso.customer.ui.components.StatusBadge
import com.hermoso.customer.utils.formatDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun BookingListScreen() {
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var bookings by remember { mutableStateOf(listOf<BookingItemDto>()) }
    var reloadKey by remember { mutableIntStateOf(0) }

    LaunchedEffect(reloadKey) {
        loading = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getBookings(page = 1, limit = 50) }
            bookings = response.data ?: emptyList()
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load bookings"
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Cream)) {
        item {
            Column(Modifier.fillMaxWidth().background(Color.White).padding(20.dp)) {
                Text("My Bookings", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("Your upcoming and recent appointments", color = TextMuted)
            }
        }

        if (loading) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(color = Purple)
                }
            }
        }

        if (error.isNotBlank()) {
            item {
                Column(Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(error, color = Color(0xFFB00020))
                    Spacer(Modifier.height(10.dp))
                    Button(onClick = { reloadKey++ }, colors = ButtonDefaults.buttonColors(containerColor = Purple)) {
                        Text("Retry")
                    }
                }
            }
        }

        if (!loading && error.isBlank() && bookings.isEmpty()) {
            item {
                Text("No bookings yet.", color = TextMuted, modifier = Modifier.padding(16.dp))
            }
        }

        items(bookings) { booking ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(booking.serviceId?.name ?: "Service", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text(booking.salonId?.name ?: "Salon", color = TextMuted)
                    Text("${formatDate(booking.bookingDate) ?: "-"} - ${booking.bookingTime ?: "-"}", color = TextMuted)
                    Spacer(Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        StatusBadge(status = booking.status)
                        Text(
                            text = booking.priceInPaisa.toPkr(),
                            color = Purple,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
        item { Spacer(Modifier.height(10.dp)) }
    }
}
