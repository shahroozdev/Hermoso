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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import com.hermoso.customer.ui.theme.*
import com.hermoso.customer.utils.formatTimestamp
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
            if (t is kotlinx.coroutines.CancellationException) throw t
            error = t.message ?: "Failed to load notifications"
            notifications = emptyList()
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Cream)) {
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

        if (!loading && error.isBlank() && notifications.isEmpty()) {
            item { Text("No notifications yet.", color = TextMuted, modifier = Modifier.padding(16.dp)) }
        }

        items(notifications) { n ->
            val id = n._id.orEmpty()
            val read = n.isRead == true
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = if (read) Color.White else PurplePale),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(n.title ?: "Notification", fontWeight = FontWeight.Bold, color = TextDark)
                        Spacer(Modifier.height(4.dp))
                        Text(n.message ?: "", color = TextMuted)
                        Spacer(Modifier.height(6.dp))
                        Text(text = formatTimestamp(n.createdAt), color = TextMuted)
                    }

                    if (!read && id.isNotBlank()) {
                        IconButton(
                            onClick = {
                                notifications = notifications.map {
                                    if (it._id == id) it.copy(isRead = true) else it
                                }
                                scope.launch {
                                    try {
                                        withContext(Dispatchers.IO) { AuthApiClient.api.markNotificationRead(id) }
                                    } catch (_: Throwable) {
                                        // Optional: Handle error by reverting local state
                                    }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Mark as Read",
                                tint = Purple
                            )
                        }
                    }
                }
            }
        }

        item { Spacer(Modifier.height(12.dp)) }
    }
}
