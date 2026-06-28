package com.example.bussiness.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun SalonServicesScreen(navController: NavHostController, salonId: String) {
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var salon by remember { mutableStateOf<SalonDto?>(null) }
    var services by remember { mutableStateOf(listOf<ServiceDto>()) }
    var selectedServiceId by remember { mutableStateOf("") }

    LaunchedEffect(salonId) {
        loading = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getBookingOptions(salonId = salonId) }
            if (response.success) {
                salon = response.data?.salon
                services = response.data?.services ?: emptyList()
            } else {
                error = response.message ?: "Failed to load salon services"
            }
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load salon services"
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Cream)) {
        item {
            Column(Modifier.fillMaxWidth().background(Color.White).padding(20.dp)) {
                Text(salon?.name ?: "Salon Services", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("Select a service then continue to booking", color = TextMuted)
            }
        }

        if (loading) {
            item {
                Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = Purple)
                }
            }
        }

        if (error.isNotBlank()) {
            item { Text(error, color = Color(0xFFB00020), modifier = Modifier.padding(16.dp)) }
        }

        items(services) { service ->
            val id = service._id.orEmpty()
            val selected = id == selectedServiceId
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
                    .clickable { selectedServiceId = id },
                colors = CardDefaults.cardColors(containerColor = if (selected) PurplePale else Color.White),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(service.name ?: "Service", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text("PKR ${(service.price ?: 0.0).toInt()} · ${service.duration ?: 0} min", color = TextMuted)
                }
            }
        }

        item {
            Button(
                onClick = {
                    if (selectedServiceId.isNotBlank()) {
                        navController.navigate("booking/$salonId/$selectedServiceId")
                    }
                },
                enabled = selectedServiceId.isNotBlank(),
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Purple)
            ) {
                Text("Book Appointment")
            }
        }
    }
}
