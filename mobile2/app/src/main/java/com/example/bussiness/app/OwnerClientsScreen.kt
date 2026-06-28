package com.example.bussiness.app

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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun OwnerClientsScreen() {
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var clients by remember { mutableStateOf(listOf<UserProfileDto>()) }

    LaunchedEffect(Unit) {
        loading = true
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getCustomers(page = 1, limit = 100) }
            clients = response.data ?: emptyList()
            error = ""
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load clients"
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(OwnerNavy)) {
        if (loading) item { Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) { CircularProgressIndicator(color = OwnerGold) } }
        if (error.isNotBlank()) item { Text(error, color = Color(0xFFFCA5A5), modifier = Modifier.padding(16.dp)) }
        items(clients) { c ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = OwnerNavyCard),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(Modifier.padding(12.dp)) {
                    Text(c.name ?: "Client", color = OwnerTextLight, fontWeight = FontWeight.Bold)
                    Text(c.email ?: "", color = Color(0xFF6B84A0))
                    Text(c.phone ?: "", color = Color(0xFF6B84A0))
                }
            }
        }
    }
}
