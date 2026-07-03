@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.example.myapplication.app

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
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.ui.theme.*
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import retrofit2.HttpException

object Dest {
    const val Splash = "splash"
    const val Auth = "auth"

    // Customer destinations
    const val Home = "home"
    const val Scan = "scan"
    const val ScanResults = "scan-results"
    const val Recs = "recs"
    const val Match = "match"
    const val Tracker = "tracker"
    const val Booking = "booking"
    const val BookingWithSalon = "booking/{salonId}"
    const val BookingWithSalonService = "booking/{salonId}/{serviceId}"
    const val SalonServices = "salon-services/{salonId}"
    const val BookingsList = "bookings-list"
    const val Salons = "salons?city={city}"

    // Owner/Business destinations
    const val OwnerDashboard = "owner-dashboard"
    const val OwnerCalendar = "owner-calendar"
    const val OwnerServices = "owner-services"
    const val OwnerClients = "owner-clients"
    const val OwnerInsights = "owner-insights"

    // Shared destinations
    const val Profile = "profile"
    const val Notifications = "notifications"

    fun SalonsWithCity(city: String?) = if (city != null) "salons?city=$city" else "salons"
}

@Composable
fun HermosoApp() {
    val context = LocalContext.current

    // Initialize SessionManager and session state synchronously to avoid UI delays.
    // sessionReady is set to true immediately since initialization happens during composition.
    val (initialIsLoggedIn, initialUserRole) = remember(context) {
        SessionManager.init(context)
        SessionManager.hasSession() to SessionManager.userRole
    }

    val scope = rememberCoroutineScope()
    val navController = rememberNavController()
    val current = navController.currentBackStackEntryAsState().value?.destination?.route ?: Dest.Splash
    var isLoggedIn by rememberSaveable { mutableStateOf(initialIsLoggedIn) }
    var userRole by rememberSaveable { mutableStateOf(initialUserRole) }
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
                    userRole = SessionManager.userRole
                } else {
                    SessionManager.clearSession()
                    isLoggedIn = false
                    userRole = null
                }
            } catch (e: Throwable) {
                // Check if it's a 401 error
                if (e is HttpException && e.code() == 401) {
                    SessionManager.clearSession()
                    isLoggedIn = false
                    userRole = null
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
                userRole = null
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
        containerColor = when (userRole) {
            "owner" -> PurpleDeeper
            else -> Cream
        },
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            if (sessionReady && isLoggedIn && current != Dest.Splash) {
                AppHeader(
                    onProfileClick = { navController.navigate(Dest.Profile) },
                    onNotificationsClick = { navController.navigate(Dest.Notifications) },
                    unreadCount = unreadCount,
                    isOwnerTheme = userRole == "owner",
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
                            userRole = null
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
                BottomNav(current = current, navController = navController, userRole = userRole)
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
                        val startDest = when (userRole) {
                            "owner" -> Dest.OwnerDashboard
                            else -> Dest.Home
                        }
                        navController.navigate(startDest) {
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
                AuthScreen(onLoginSuccess = { role ->
                    isLoggedIn = true
                    userRole = role
                    val startDest = when (role) {
                        "owner" -> Dest.OwnerDashboard
                        else -> Dest.Home
                    }
                    navController.navigate(startDest) {
                        popUpTo(Dest.Auth) { inclusive = true }
                    }
                })
            }
            // Customer screens
            composable(Dest.Home) { HomeScreen(navController) }
            composable(Dest.Scan) {
                // CR-01 through CR-06: AI Face Scan Camera Screen
                ScanCameraScreen(
                    onScanComplete = { imageBytes ->
                        // Navigate to results screen after scan
                        navController.navigate(Dest.ScanResults)
                    },
                    onBack = { navController.navigateUp() }
                )
            }
            composable(Dest.ScanResults) {
                // CR-07 through CR-17: Scan Results Screen
                // TODO: Fetch actual scan result from API
                // For now using mock data structure
                val mockResult = ScanResult(
                    scanId = "mock-id",
                    faceValid = true,
                    faceGuidance = emptyList(),
                    overallSkinScore = 78,
                    summary = "Your skin analysis is complete. Overall skin health is good with some areas for improvement.",
                    skinTone = SkinToneResult("Medium", 72, "Even tone with slight variation in cheek areas", 3, listOf("Brightening Facial", "Vitamin C Treatment")),
                    eyebrows = null,
                    hydration = HydrationResult(65, listOf("forehead", "cheeks"), 70, "Slightly enlarged pores in T-zone", listOf("Hydra Facial", "Moisture Boost")),
                    darkCircles = DarkCirclesResult(2, "moderate", 45f, listOf("Under-Eye Treatment", "LED Light Therapy")),
                    acne = AcneResult(emptyList(), 15, listOf("Salicylic Acid Treatment")),
                    lipPigmentation = LipPigmentationResult(52, "medium", 38, 42, listOf("Lip Lightening", "Exfoliation")),
                    treatmentPlan = listOf(
                        TreatmentPlanItem(1, "Hydra Facial", "Boost hydration levels which are below optimal", "PKR 4,000-5,000", "60 min"),
                        TreatmentPlanItem(2, "Under-Eye Treatment", "Address moderate dark circles", "PKR 3,000-4,000", "45 min")
                    ),
                    dietPlan = DietPlanResult(
                        foodsToEat = listOf(
                            DietFood("Almonds & Walnuts", "Rich in vitamin E for skin health"),
                            DietFood("Green Tea", "Antioxidants reduce inflammation")
                        ),
                        foodsToAvoid = listOf(
                            DietFood("Sugary Drinks", "Can trigger breakouts"),
                            DietFood("Processed Foods", "May worsen skin inflammation")
                        ),
                        dailyWaterIntake = "8-10 glasses (2-2.5 liters)",
                        specificToSkinTone = true
                    ),
                    metrics = emptyList()
                )

                ScanResultsScreen(
                    scanResult = mockResult,
                    onViewMatchedSalons = { navController.navigate(Dest.Match) },
                    onReScan = { navController.navigate(Dest.Scan) },
                    onShare = { /* TODO: Implement share functionality */ },
                    onBack = { navController.navigateUp() }
                )
            }
            composable(Dest.Recs) { RecommendationsScreen(navController) }
            composable(Dest.Match) { MatchScreen(navController) }
            composable(Dest.Tracker) { TrackerScreen() }

            // Owner/Business screens
            composable(Dest.OwnerDashboard) { OwnerDashboardScreen() }
            composable(Dest.OwnerCalendar) { OwnerCalendarScreen() }
            composable(Dest.OwnerServices) { OwnerServicesScreen() }
            composable(Dest.OwnerClients) { OwnerClientsScreen() }
            composable(Dest.OwnerInsights) { OwnerInsightsScreen() }

            // Shared screens
            composable(Dest.Profile) { ProfileScreen() }
            composable(Dest.Notifications) { NotificationScreen() }
            composable(
                route = Dest.Salons,
                arguments = listOf(navArgument("city") { nullable = true; defaultValue = null })
            ) { backStackEntry ->
                SalonsScreen(navController, initialCity = backStackEntry.arguments?.getString("city"))
            }
            composable(Dest.Booking) { BookingScreen(navController) }
            composable(Dest.BookingsList) { BookingListScreen() }
            composable(
                route = Dest.BookingWithSalon,
                arguments = listOf(navArgument("salonId") { type = NavType.StringType })
            ) { backStackEntry ->
                BookingScreen(
                    navController = navController,
                    preSelectedSalonId = backStackEntry.arguments?.getString("salonId")
                )
            }
            composable(
                route = Dest.BookingWithSalonService,
                arguments = listOf(
                    navArgument("salonId") { type = NavType.StringType },
                    navArgument("serviceId") { type = NavType.StringType }
                )
            ) { backStackEntry ->
                BookingScreen(
                    navController = navController,
                    preSelectedSalonId = backStackEntry.arguments?.getString("salonId"),
                    preSelectedServiceId = backStackEntry.arguments?.getString("serviceId")
                )
            }
            composable(
                route = Dest.SalonServices,
                arguments = listOf(navArgument("salonId") { type = NavType.StringType })
            ) { backStackEntry ->
                SalonServicesScreen(
                    navController = navController,
                    salonId = backStackEntry.arguments?.getString("salonId").orEmpty()
                )
            }
        }
    }
}

@Composable
private fun BottomNav(current: String, navController: NavHostController, userRole: String?) {
    val configuration = LocalConfiguration.current
    // Using a slightly smaller factor to ensure text fits on all screen widths
    val dynamicFontSize = (configuration.screenWidthDp / 36).sp

    val items = when (userRole) {
        "owner" -> listOf(
            Triple(Dest.OwnerDashboard, "Dashboard", Icons.Default.Home),
            Triple(Dest.OwnerCalendar, "Calendar", Icons.Default.DateRange),
            Triple(Dest.OwnerServices, "Services", Icons.Default.Face),
            Triple(Dest.OwnerInsights, "Insights", Icons.AutoMirrored.Filled.ShowChart)
        )
        else -> listOf(
            Triple(Dest.Home, "Home", Icons.Default.Home),
            Triple(Dest.Scan, "AI Scan", Icons.Default.Face),
            Triple(Dest.BookingsList, "Bookings", Icons.Default.DateRange),
            Triple(Dest.Tracker, "Progress", Icons.AutoMirrored.Filled.ShowChart)
        )
    }

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
                val selected = when (route) {
                    Dest.BookingsList -> current in setOf(
                        Dest.BookingsList,
                        Dest.Booking,
                        Dest.BookingWithSalon,
                        Dest.BookingWithSalonService
                    )
                    Dest.OwnerDashboard, Dest.OwnerCalendar, Dest.OwnerServices,
                    Dest.OwnerClients, Dest.OwnerInsights -> current == route
                    else -> current == route
                }
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    TextButton(
                        onClick = {
                            if (!selected) {
                                // Special handling for BookingsList to always show the list, not restore state
                                if (route == Dest.BookingsList) {
                                    navController.navigate(route) {
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = false  // Don't restore state for Bookings tab
                                    }
                                } else {
                                    navController.navigate(route) {
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
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
