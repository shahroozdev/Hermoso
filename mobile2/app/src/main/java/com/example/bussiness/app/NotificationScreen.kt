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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun NotificationScreen() {
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var notifications by remember { mutableStateOf(listOf<NotificationDto>()) }
    var reloadKey by remember { mutableIntStateOf(0) }

    LaunchedEffect(reloadKey) {
        loading = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getNotifications(page = 1, limit = 50) }
            notifications = response.data ?: emptyList()
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load notifications"
            notifications = emptyList()
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(OwnerNavy)) {
        if (loading) item { Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) { CircularProgressIndicator(color = OwnerGold) } }
        if (error.isNotBlank()) item {
            Column(Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(error, color = Color(0xFFFCA5A5))
                Spacer(Modifier.height(10.dp))
                Button(onClick = { reloadKey++ }, colors = ButtonDefaults.buttonColors(containerColor = OwnerGold)) { Text("Retry", color = OwnerNavy) }
            }
        }
        if (!loading && error.isBlank() && notifications.isEmpty()) item { Text("No notifications yet.", color = OwnerTextMuted, modifier = Modifier.padding(16.dp)) }
        items(notifications) { n ->
            val id = n._id.orEmpty()
            val read = n.isRead == true
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).clickable(enabled = id.isNotBlank() && !read) {
                    notifications = notifications.map { if (it._id == id) it.copy(isRead = true) else it }
                    scope.launch { try { withContext(Dispatchers.IO) { AuthApiClient.api.markNotificationRead(id) } } catch (_: Throwable) {} }
                },
                colors = CardDefaults.cardColors(containerColor = if (read) OwnerNavyCard else Color(0x332A3A4A)),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(n.title ?: "Notification", fontWeight = FontWeight.Bold, color = OwnerTextLight)
                    Spacer(Modifier.height(4.dp))
                    Text(n.message ?: "", color = OwnerTextMuted)
                    Spacer(Modifier.height(6.dp))
                    Text(n.createdAt ?: "", color = OwnerTextMuted)
                }
            }
        }
        item { Spacer(Modifier.height(12.dp)) }
    }
}
