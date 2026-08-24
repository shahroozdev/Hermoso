@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.hermoso.business.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hermoso.business.ui.theme.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import retrofit2.HttpException

// Hermoso Business (salon owner). This app only ever handles the "salon_owner" role —
// see AuthScreen.kt's login-role guard, which rejects a customer login before it ever
// reaches here. There is no role branching in this nav graph.
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

    // Initialize SessionManager and session state synchronously to avoid UI delays.
    // sessionReady is set to true immediately since initialization happens during composition.
    val (initialIsLoggedIn, _) = remember(context) {
        SessionManager.init(context)
        SessionManager.hasSession() to SessionManager.userRole
    }

    val scope = rememberCoroutineScope()
    val navController = rememberNavController()
    val current = navController.currentBackStackEntryAsState().value?.destination?.route ?: Dest.Splash
    var isLoggedIn by rememberSaveable { mutableStateOf(initialIsLoggedIn) }
    var sessionReady by remember { mutableStateOf(true) }
    var unreadCount by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        if (SessionManager.hasSession() && !SessionManager.refreshToken.isNullOrBlank()) {
            try {
                val refreshed = withContext(Dispatchers.IO) {
                    AuthApiClient.api.refresh(RefreshRequest(SessionManager.refreshToken.orEmpty()))
                }
                if (refreshed.success && !refreshed.accessToken.isNullOrBlank() && !refreshed.refreshToken.isNullOrBlank()) {
                    SessionManager.saveSession(
                        refreshed.accessToken,
                        refreshed.refreshToken,
                        refreshed.user?.name ?: SessionManager.userName,
                        refreshed.user?.role ?: SessionManager.userRole
                    )
                    isLoggedIn = true
                } else {
                    SessionManager.clearSession()
                    isLoggedIn = false
                }
            } catch (e: Throwable) {
                // Check if it's a 401 error
                if (e is HttpException && e.code() == 401) {
                    SessionManager.clearSession()
                    isLoggedIn = false
                }
            }
        }
    }

    LaunchedEffect(current, isLoggedIn, sessionReady) {
        if (!sessionReady || !isLoggedIn || current == Dest.Splash) return@LaunchedEffect
        try {
            val unreadResponse = withContext(Dispatchers.IO) {
                AuthApiClient.api.getNotifications(page = 1, limit = 1, unreadOnly = "true")
            }
            unreadCount = unreadResponse.meta?.total ?: (unreadResponse.data?.size ?: 0)
        } catch (e: Throwable) {
            // Check if it's a 401 error
            if (e is HttpException && e.code() == 401) {
                SessionManager.clearSession()
                isLoggedIn = false
                unreadCount = 0
                navController.navigate(Dest.Auth) {
                    popUpTo(navController.graph.id) { inclusive = true }
                }
            } else {
                unreadCount = 0
            }
        }
    }

    Scaffold(
        containerColor = PurpleDeeper,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            if (sessionReady && isLoggedIn && current != Dest.Splash) {
                AppHeader(
                    onProfileClick = { navController.navigate(Dest.Profile) },
                    onNotificationsClick = { navController.navigate(Dest.Notifications) },
                    unreadCount = unreadCount,
                    onLogoutClick = {
                        scope.launch {
                            val token = SessionManager.refreshToken
                            if (!token.isNullOrBlank()) {
                                try {
                                    withContext(Dispatchers.IO) { AuthApiClient.api.logout(LogoutRequest(token)) }
                                } catch (_: Throwable) {
                                }
                            }
                            SessionManager.clearSession()
                            isLoggedIn = false
                            unreadCount = 0
                            navController.navigate(Dest.Auth) {
                                popUpTo(navController.graph.id) { inclusive = true }
                            }
                        }
                    }
                )
            }
        },
        bottomBar = {
            if (sessionReady && isLoggedIn && current != Dest.Splash) {
                BottomNav(current = current, navController = navController)
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Dest.Splash,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Dest.Splash) {
                SplashScreen(onNext = {
                    if (isLoggedIn) {
                        navController.navigate(Dest.OwnerDashboard) {
                            popUpTo(Dest.Splash) { inclusive = true }
                        }
                    } else {
                        navController.navigate(Dest.Auth) {
                            popUpTo(Dest.Splash) { inclusive = true }
                        }
                    }
                })
            }
            composable(Dest.Auth) {
                AuthScreen(onLoginSuccess = {
                    isLoggedIn = true
                    navController.navigate(Dest.OwnerDashboard) {
                        popUpTo(Dest.Auth) { inclusive = true }
                    }
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
private fun BottomNav(current: String, navController: NavHostController) {
    val configuration = LocalConfiguration.current
    // Using a slightly smaller factor to ensure text fits on all screen widths
    val dynamicFontSize = (configuration.screenWidthDp / 36).sp

    val items = listOf(
        Triple(Dest.OwnerDashboard, "Dashboard", Icons.Default.Home),
        Triple(Dest.OwnerCalendar, "Calendar", Icons.Default.DateRange),
        Triple(Dest.OwnerServices, "Services", Icons.Default.Face),
        Triple(Dest.OwnerInsights, "Insights", Icons.AutoMirrored.Filled.ShowChart)
    )

    Surface(
        color = Color.White,
        tonalElevation = 8.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                val (route, label, icon) = item
                val selected = current == route
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    TextButton(
                        onClick = {
                            if (!selected) {
                                navController.navigate(route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        shape = RectangleShape,
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = label,
                                tint = if (selected) Purple else TextMuted,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = label,
                                color = if (selected) Purple else TextMuted,
                                fontSize = dynamicFontSize,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }
                }
            }
        }
    }
}
