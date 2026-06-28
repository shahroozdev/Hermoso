package com.example.bussiness.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp

@Composable
fun AppHeader(
    onProfileClick: () -> Unit,
    onLogoutClick: () -> Unit,
    onNotificationsClick: () -> Unit,
    unreadCount: Int
) {
    var menuOpen by remember { mutableStateOf(false) }
    val name = SessionManager.userName?.trim().orEmpty()
    val initial = if (name.isNotBlank()) name.first().uppercaseChar().toString() else "B"

    Row(
        modifier = Modifier
            .background(Brush.linearGradient(listOf(OwnerNavy, OwnerNavyMid)))
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            "Hermoso",
            color = OwnerGold,
            fontWeight = FontWeight.Light,
            style = MaterialTheme.typography.titleLarge
        )
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.12f))
                    .clickable { onNotificationsClick() },
                contentAlignment = Alignment.Center
            ) {
                Text("\uD83D\uDD14", color = OwnerTextLight)
                if (unreadCount > 0) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .offset { IntOffset(6, -6) }
                            .size(16.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFEF4444)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(if (unreadCount > 9) "9+" else unreadCount.toString(), color = Color.White, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
            Box {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(listOf(OwnerGold, OwnerGoldLight)))
                        .clickable { menuOpen = true },
                    contentAlignment = Alignment.Center
                ) {
                    Text(initial, color = OwnerNavy, fontWeight = FontWeight.Bold)
                }
                DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                    DropdownMenuItem(text = { Text("Profile") }, onClick = { menuOpen = false; onProfileClick() })
                    DropdownMenuItem(text = { Text("Logout") }, onClick = { menuOpen = false; onLogoutClick() })
                }
            }
        }
    }
}
