package com.hermoso.business.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import com.hermoso.business.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun OwnerServicesScreen() {
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var services by remember { mutableStateOf(listOf<ServiceDto>()) }

    LaunchedEffect(Unit) {
        loading = true
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getServices(page = 1, limit = 100) }
            services = response.data ?: emptyList()
            error = ""
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load services"
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(PurpleDeeper)) {
        if (loading) item { Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) { CircularProgressIndicator(color = PurpleLight) } }
        if (error.isNotBlank()) item { Text(error, color = Color(0xFFFCA5A5), modifier = Modifier.padding(16.dp)) }
        items(services) { s ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = PurpleDark),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text(s.name ?: "Service", color = Cream, fontWeight = FontWeight.Bold)
                        Text("${s.duration ?: 0} min", color = TextMuted)
                    }
                    Text("PKR ${(s.price ?: 0.0).toInt()}", color = PurpleLight, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
