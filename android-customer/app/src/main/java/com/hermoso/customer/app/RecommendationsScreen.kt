package com.hermoso.customer.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.hermoso.customer.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun RecommendationsScreen(navController: NavHostController) {
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var summary by remember { mutableStateOf("") }
    var services by remember { mutableStateOf(listOf<ServiceDto>()) }
    var reloadKey by remember { mutableIntStateOf(0) }

    LaunchedEffect(reloadKey) {
        loading = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getLatestScan() }
            if (response.success) {
                summary = response.data?.summary ?: "Based on your latest skin scan"
                services = response.data?.recommendedServices ?: emptyList()
            } else {
                error = response.message ?: "No recommendations found"
                services = emptyList()
            }
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load recommendations"
            services = emptyList()
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Cream)) {
        item {
            Box(Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(PurpleDark, Purple))).padding(20.dp)) {
                Column {
                    Text("AI Recommendations", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text(if (summary.isNotBlank()) summary else "Based on your skin scan", color = Color.White.copy(alpha = 0.7f))
                }
            }
        }
        if (loading) {
            item {
                Row(
                    Modifier.fillMaxWidth().padding(24.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(color = Purple)
                    Spacer(Modifier.width(12.dp))
                    Text("Loading recommendations...")
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

        if (!loading && error.isBlank()) {
            item {
                Card(modifier = Modifier.padding(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(64.dp).clip(CircleShape).background(PurplePale), contentAlignment = Alignment.Center) {
                            Text(services.size.toString(), color = Purple, fontWeight = FontWeight.ExtraBold)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Recommended Treatments", fontWeight = FontWeight.Bold)
                            Text("${services.size} service options", color = TextMuted)
                        }
                    }
                }
            }
        }

        if (!loading && error.isBlank() && services.isEmpty()) {
            item {
                Text("No recommendations available yet. Please run AI scan first.", color = TextMuted, modifier = Modifier.padding(16.dp))
            }
        }

        items(services) { treatment ->
            val serviceId = treatment._id.orEmpty()
            Card(
                onClick = {
                    if (serviceId.isNotBlank()) {
                        navController.navigate(Dest.Booking)
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                    Text("S", modifier = Modifier.size(42.dp))
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text(treatment.name ?: "Service", fontWeight = FontWeight.Bold)
                        Text("Recommended from your latest scan", color = TextMuted)
                        Text("PKR ${treatment.price ?: 0.0} - ${treatment.duration ?: 0} min", color = Purple, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
        item { Spacer(Modifier.height(12.dp)) }
    }
}
