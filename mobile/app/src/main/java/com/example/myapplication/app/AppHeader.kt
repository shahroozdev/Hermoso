package com.example.myapplication.app

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.R
import com.example.myapplication.ui.theme.*

@Composable
fun AppHeader(
    onProfileClick: () -> Unit,
    onLogoutClick: () -> Unit,
    onNotificationsClick: () -> Unit,
    unreadCount: Int,
    isOwnerTheme: Boolean = false
) {
    var menuOpen by remember { mutableStateOf(false) }
    val name = SessionManager.userName?.trim().orEmpty()
    val initial = if (name.isNotBlank()) name.first().uppercaseChar().toString() else "U"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isOwnerTheme) Brush.linearGradient(listOf(OwnerNavy, OwnerNavyMid))
                else Brush.linearGradient(listOf(PurpleDeeper, PurpleDark, Purple))
            )
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                painter = painterResource(id = R.drawable.ic_logo),
                contentDescription = "Logo",
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "Hermoso",
                color = if (isOwnerTheme) OwnerGold else Color.White,
                fontWeight = FontWeight.Light,
                fontFamily = CormorantFontFamily,
                fontSize = 28.sp
            )
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            BadgedBox(
                badge = {
                    if (unreadCount > 0) {
                        Badge(
                            containerColor = Color(0xFFEF4444),
                            contentColor = Color.White
                        ) {
                            Text(
                                text = if (unreadCount > 9) "9+" else unreadCount.toString(),
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.15f))
                        .clickable { onNotificationsClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Text("\uD83D\uDD14", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
            Box {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(listOf(Color(0xFFEC4899), PurpleLight)))
                        .clickable { menuOpen = true },
                    contentAlignment = Alignment.Center
                ) {
                    Text(initial, color = Color.White, fontWeight = FontWeight.Bold)
                }
                DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                    DropdownMenuItem(
                        text = { Text("Profile") },
                        onClick = {
                            menuOpen = false
                            onProfileClick()
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Logout") },
                        onClick = {
                            menuOpen = false
                            onLogoutClick()
                        }
                    )
                }
            }
        }
    }
}
