@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.example.bussiness.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

object Dest {
    const val Splash = "splash"
    const val Auth = "auth"
    const val OwnerDashboard = "owner-dashboard"
    const val OwnerCalendar = "owner-calendar"
    const val OwnerServices = "owner-services"
    const val OwnerClients = "owner-clients"
    const val OwnerInsights = "owner-insights"
    const val Profile = "profile"
    const val Notifications = "notifications"
}

@Composable
fun HermosoApp() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val navController = rememberNavController()
    val current = navController.currentBackStackEntryAsState().value?.destination?.route ?: Dest.Splash
    var isLoggedIn by rememberSaveable { mutableStateOf(false) }
    var sessionReady by remember { mutableStateOf(false) }
    var unreadCount by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        SessionManager.init(context)
        isLoggedIn = SessionManager.hasSession()
        sessionReady = true
    }

    LaunchedEffect(current, isLoggedIn, sessionReady) {
        if (!sessionReady || !isLoggedIn || current == Dest.Auth || current == Dest.Splash) return@LaunchedEffect
        try {
            val unreadResponse = withContext(Dispatchers.IO) { AuthApiClient.api.getNotifications(page = 1, limit = 1, unreadOnly = "true") }
            unreadCount = unreadResponse.meta?.total ?: (unreadResponse.data?.size ?: 0)
        } catch (_: Throwable) {
            unreadCount = 0
        }
    }

    Scaffold(
        containerColor = OwnerNavy,
        topBar = {
            if (current != Dest.Auth && current != Dest.Splash && sessionReady) {
                AppHeader(
                    onProfileClick = { navController.navigate(Dest.Profile) },
                    onNotificationsClick = { navController.navigate(Dest.Notifications) },
                    unreadCount = unreadCount,
                    onLogoutClick = {
                        scope.launch {
                            val token = SessionManager.refreshToken
                            if (!token.isNullOrBlank()) {
                                try { withContext(Dispatchers.IO) { AuthApiClient.api.logout(LogoutRequest(token)) } } catch (_: Throwable) {}
                            }
                            SessionManager.clearSession()
                            isLoggedIn = false
                            unreadCount = 0
                            navController.navigate(Dest.Auth) { popUpTo(navController.graph.id) { inclusive = true } }
                        }
                    }
                )
            }
        },
        bottomBar = {
            if (current in setOf(Dest.OwnerDashboard, Dest.OwnerCalendar, Dest.OwnerServices, Dest.OwnerClients, Dest.OwnerInsights, Dest.Profile, Dest.Notifications)) {
                OwnerBottomNav(current = current, navController = navController)
            }
        }
    ) { innerPadding ->
        NavHost(navController = navController, startDestination = Dest.Splash, modifier = Modifier.padding(innerPadding)) {
            composable(Dest.Splash) {
                SplashScreen(onNext = {
                    navController.navigate(if (isLoggedIn) Dest.OwnerDashboard else Dest.Auth) { popUpTo(Dest.Splash) { inclusive = true } }
                })
            }
            composable(Dest.Auth) {
                AuthScreen(onLoginSuccess = {
                    isLoggedIn = true
                    navController.navigate(Dest.OwnerDashboard) { popUpTo(Dest.Auth) { inclusive = true } }
                })
            }
            composable(Dest.OwnerDashboard) { OwnerDashboardScreen() }
            composable(Dest.OwnerCalendar) { OwnerCalendarScreen() }
            composable(Dest.OwnerServices) { OwnerServicesScreen() }
            composable(Dest.OwnerClients) { OwnerClientsScreen() }
            composable(Dest.OwnerInsights) { OwnerInsightsScreen() }
            composable(Dest.Profile) { ProfileScreen() }
            composable(Dest.Notifications) { NotificationScreen() }
        }
    }
}

@Composable
private fun OwnerBottomNav(current: String, navController: NavHostController) {
    val items = listOf(
        Triple(Dest.OwnerDashboard, "Dash", "Dashboard"),
        Triple(Dest.OwnerCalendar, "Cal", "Calendar"),
        Triple(Dest.OwnerServices, "Svc", "Services"),
        Triple(Dest.OwnerClients, "CRM", "Clients"),
        Triple(Dest.OwnerInsights, "AI", "Insights")
    )
    Row(modifier = Modifier.fillMaxWidth().background(OwnerNavyMid).padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
        items.forEach { item ->
            val selected = current == item.first
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clip(RoundedCornerShape(12.dp)).padding(horizontal = 8.dp)) {
                TextButton(onClick = { navController.navigate(item.first) }) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(item.second, color = if (selected) OwnerGold else OwnerTextMuted)
                        Text(item.third, color = if (selected) OwnerGoldLight else OwnerTextMuted)
                    }
                }
            }
        }
    }
}
