package com.hermoso.customer.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresPermission
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hermoso.customer.ui.theme.*
import androidx.core.content.ContextCompat
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.hermoso.customer.utils.calculateSalonDistance
import com.hermoso.customer.utils.geocodeSalonAddress
import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.Locale

@RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
private suspend fun getUserLocation(context: Context): Pair<Double, Double>? {
    val fusedClient = LocationServices.getFusedLocationProviderClient(context)
    val location = try {
        fusedClient.lastLocation.await()
    } catch (_: Throwable) {
        null
    } ?: return null

    return location.latitude to location.longitude
}

@RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
private suspend fun resolveCityFromLocation(context: Context): String? {
    val fusedClient = LocationServices.getFusedLocationProviderClient(context)
    val location = try {
        fusedClient.lastLocation.await()
    } catch (_: Throwable) {
        null
    } ?: return null

    val geocoder = Geocoder(context, Locale.getDefault())
    return try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            var city: String? = null
            geocoder.getFromLocation(location.latitude, location.longitude, 1) { results ->
                city = results.firstOrNull()?.locality ?: results.firstOrNull()?.subAdminArea
            }
            city
        } else {
            @Suppress("DEPRECATION")
            geocoder.getFromLocation(location.latitude, location.longitude, 1)
                ?.firstOrNull()
                ?.let { it.locality ?: it.subAdminArea }
        }
    } catch (_: Throwable) {
        null
    }
}

@Composable
fun HomeScreen(navController: NavHostController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var categories by remember { mutableStateOf(listOf("All")) }
    var salons by remember { mutableStateOf(listOf<SalonDto>()) }
    var salonCoordinates by remember { mutableStateOf(mapOf<String, Pair<Double, Double>>()) }
    var events by remember { mutableStateOf(listOf<EventDto>()) }
    var loading by remember { mutableStateOf(true) }
    var salonsError by remember { mutableStateOf("") }
    var eventsError by remember { mutableStateOf("") }
    var detectedCity by rememberSaveable { mutableStateOf<String?>(null) }
    var userLocation by rememberSaveable { mutableStateOf<Pair<Double, Double>?>(null) }
    var locationReady by rememberSaveable { mutableStateOf(false) }

    var selectedCategory by rememberSaveable { mutableStateOf("All") }
    var homeSearchQuery by rememberSaveable { mutableStateOf("") }

    val greeting = remember {
        val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
        when (hour) {
            in 5..11 -> "Good morning"
            in 12..16 -> "Good afternoon"
            in 17..20 -> "Good evening"
            else -> "Good night"
        }
    }
    val firstName = remember { SessionManager.userName?.trim()?.split(" ")?.firstOrNull() ?: "Beautiful" }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        scope.launch {
            locationReady = true
            if (granted) {
                userLocation = getUserLocation(context)
                detectedCity = resolveCityFromLocation(context)
            }
        }
    }

    LaunchedEffect(Unit) {
        val hasFine = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasFine) {
            locationReady = true
            userLocation = getUserLocation(context)
            detectedCity = resolveCityFromLocation(context)
        } else {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    LaunchedEffect(locationReady, detectedCity, homeSearchQuery) {
        if (!locationReady) return@LaunchedEffect
        
        // Small delay to avoid redundant calls if multiple states update rapidly
        delay(300)

        loading = true
        salonsError = ""
        eventsError = ""
        
        // Load categories
        try {
            val categoriesResponse = withContext(Dispatchers.IO) { AuthApiClient.api.getCategories() }
            val categoryNames = categoriesResponse.data
                ?.mapNotNull { it.name?.trim() }
                ?.filter { it.isNotBlank() }
                ?.distinct()
                ?: emptyList()
            categories = listOf("All") + categoryNames
        } catch (t: Throwable) {
            if (t is kotlinx.coroutines.CancellationException) throw t
        }

        // Load salons with city filter
        try {
            val salonsResponse = withContext(Dispatchers.IO) {
                AuthApiClient.api.getSalons(
                    page = 1,
                    limit = 20,
                    city = if (detectedCity.isNullOrBlank()) null else detectedCity,
                    search = if (homeSearchQuery.isBlank()) null else homeSearchQuery
                )
            }
            salons = salonsResponse.data ?: emptyList()

            // Geocode salon addresses
            val coordinates = mutableMapOf<String, Pair<Double, Double>>()
            salons.forEach { salon ->
                val salonId = salon._id
                if (!salonId.isNullOrBlank()) {
                    val coords = geocodeSalonAddress(
                        context,
                        salon.location?.address,
                        salon.location?.city
                    )
                    if (coords != null) {
                        coordinates[salonId] = coords
                    }
                }
            }
            salonCoordinates = coordinates
        } catch (t: Throwable) {
            if (t is kotlinx.coroutines.CancellationException) throw t
            salonsError = "Failed to load salons"
        }

        // Load events
        try {
            val eventsResponse = withContext(Dispatchers.IO) {
                AuthApiClient.api.getEvents(page = 1, limit = 10)
            }
            events = eventsResponse.data ?: emptyList()
        } catch (t: Throwable) {
            if (t is kotlinx.coroutines.CancellationException) throw t
            eventsError = "Events not available (404)"
        }

        loading = false
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Cream)) {
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.linearGradient(listOf(PurpleDeeper, PurpleDark, Purple)))
                    .padding(20.dp)
            ) {
                Column {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "$greeting, $firstName",
                        color = Color.White.copy(alpha = 0.7f)
                    )
                    Text(
                        text = if (detectedCity.isNullOrBlank()) {
                            "Your AI beauty companion is ready"
                        } else {
                            "Showing nearby salons in $detectedCity"
                        },
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleLarge
                    )

                    Spacer(Modifier.height(16.dp))

                    BasicTextField(
                        value = homeSearchQuery,
                        onValueChange = { homeSearchQuery = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        textStyle = TextStyle(fontSize = 14.sp, color = Color.White),
                        singleLine = true,
                        cursorBrush = SolidColor(Color.White),
                        decorationBox = { innerTextField ->
                            Row(
                                modifier = Modifier
                                    .background(Color.White.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                                    .padding(horizontal = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.Search,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(Modifier.width(8.dp))
                                Box(Modifier.weight(1f)) {
                                    if (homeSearchQuery.isEmpty()) {
                                        Text(
                                            "Search salons by name...",
                                            color = Color.White.copy(alpha = 0.7f),
                                            fontSize = 14.sp
                                        )
                                    }
                                    innerTextField()
                                }
                            }
                        }
                    )
                }
            }
        }
        
        // Categories Section
        if (loading && categories.size <= 1) {
            item {
                Text("Browse by Category", modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp), fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    repeat(5) {
                        CategoryChipSkeleton()
                    }
                }
            }
        } else if (categories.size > 1) {
            item {
                Text("Browse by Category", modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp), fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { label ->
                        val selected = label == selectedCategory
                        TextButton(
                            onClick = { selectedCategory = label },
                            colors = ButtonDefaults.textButtonColors(
                                containerColor = if (selected) Purple else PurplePale,
                                contentColor = if (selected) Color.White else Purple
                            ),
                            shape = RoundedCornerShape(24.dp)
                        ) { Text(label) }
                    }
                }
            }
        }

        // Salons Section
        item {
            val heading = if (detectedCity.isNullOrBlank()) "Top Salons Near You" else "Top Salons in $detectedCity"
            SectionHeader(heading, "See all", onLinkClick = { navController.navigate(Dest.SalonsWithCity(detectedCity)) })

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (loading && salons.isEmpty()) {
                    items(5) {
                        SalonCardSkeleton()
                    }
                }

                if (salonsError.isNotBlank() && salons.isEmpty()) {
                    item {
                        Text(
                            text = salonsError,
                            color = Color(0xFFB00020),
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                    }
                }

                if (!loading && salonsError.isBlank() && salons.isEmpty()) {
                    item {
                        Text(
                            text = if (detectedCity.isNullOrBlank()) "No salons found near you" else "No salons found in $detectedCity",
                            color = TextMuted,
                            modifier = Modifier.padding(vertical = 16.dp)
                        )
                    }
                }

                items(salons, key = { it._id ?: it.name ?: "" }) { salon ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.width(160.dp),
                        onClick = {
                            val salonId = salon._id
                            if (!salonId.isNullOrBlank()) {
                                navController.navigate("salon-services/$salonId")
                            } else {
                                navController.navigate(Dest.Booking)
                            }
                        }
                    ) {
                        Column {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(120.dp)
                            ) {
                                // Show image if available, otherwise show gradient background
                                if (!salon.imageUrl.isNullOrBlank()) {
                                    AsyncImage(
                                        model = salon.imageUrl,
                                        contentDescription = salon.name,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(120.dp),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(120.dp)
                                            .background(
                                                Brush.linearGradient(listOf(Purple, PurpleLight)),
                                                RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)
                                            )
                                    )
                                }

                                val rating = salon.avgRating ?: 0.0
                                Surface(
                                    modifier = Modifier
                                        .align(Alignment.BottomStart)
                                        .padding(8.dp),
                                    color = Color.White,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Star,
                                            contentDescription = null,
                                            tint = Color(0xFFFBBF24),
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Text(
                                            text = String.format(Locale.US, "%.1f", rating),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = TextDark
                                        )
                                    }
                                }
                            }
                            
                            Column(Modifier.padding(10.dp)) {
                                Text(
                                    salon.name ?: "Salon",
                                    fontWeight = FontWeight.Bold,
                                    color = TextDark,
                                    fontSize = 14.sp,
                                    maxLines = 1
                                )
                                Spacer(Modifier.height(4.dp))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    val rating = salon.avgRating ?: 0.0
                                    Icon(
                                        imageVector = Icons.Default.Star,
                                        contentDescription = null,
                                        tint = Color(0xFFFBBF24),
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Text(
                                        text = String.format(Locale.US, "%.1f", rating),
                                        fontSize = 12.sp,
                                        color = TextMuted
                                    )
                                    Text(
                                        text = "•",
                                        fontSize = 12.sp,
                                        color = TextMuted
                                    )
                                    
                                    val salonId = salon._id
                                    val salonCoords = if (!salonId.isNullOrBlank()) salonCoordinates[salonId] else null
                                    
                                    val distance = calculateSalonDistance(
                                        userLocation?.first,
                                        userLocation?.second,
                                        salonCoords?.first,
                                        salonCoords?.second
                                    )
                                    
                                    Text(
                                        text = distance ?: "-- km",
                                        fontSize = 12.sp,
                                        color = TextMuted
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Events Section
        item {
            SectionHeader("Book for Events", "See all")
            
            if (loading && events.isEmpty()) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(5) {
                        EventCardSkeleton()
                    }
                }
            } else if (eventsError.isNotBlank() && events.isEmpty()) {
                Text(
                    eventsError,
                    color = Color(0xFFB00020),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            } else if (events.isEmpty() && !loading) {
                Text(
                    "No events available",
                    color = TextMuted,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)
                )
            } else {
                val eventGradients = listOf(
                    listOf(Color(0xFF6B21A8), Color(0xFF9333EA)), // Purple
                    listOf(Color(0xFFBE185D), Color(0xFFEC4899)), // Pink
                    listOf(Color(0xFF1E40AF), Color(0xFF3B82F6)), // Blue
                    listOf(Color(0xFF047857), Color(0xFF10B981)), // Green
                    listOf(Color(0xFFB45309), Color(0xFFF59E0B))  // Amber
                )
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(events.size, key = { events[it]._id ?: events[it].name ?: it.toString() }) { index ->
                        val event = events[index]
                        val eventType = event.category?.uppercase() ?: "EVENT"
                        val gradient = eventGradients[index % eventGradients.size]
                        val categories = event.services
                            ?.mapNotNull { it.serviceId?.category }
                            ?.distinct()
                            ?.joinToString(" · ")
                        Card(
                            modifier = Modifier
                                .width(200.dp)
                                .height(100.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Box(
                                Modifier
                                    .fillMaxSize()
                                    .background(Brush.horizontalGradient(gradient))
                                    .padding(16.dp)
                            ) {
                                Column(
                                    modifier = Modifier.align(Alignment.CenterStart),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Surface(
                                        color = Color.White.copy(alpha = 0.2f),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            text = eventType,
                                            color = Color.White,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                            letterSpacing = 0.5.sp
                                        )
                                    }
                                    Text(
                                        text = event.name ?: "Event",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp,
                                        maxLines = 1
                                    )
                                    Text(
                                            text = categories?:"",
                                            color = Color.White.copy(alpha = 0.9f),
                                            fontSize = 12.sp,
                                            maxLines = 2
                                    )
                                }
                            }
                        }
                    }
                }
            }
            
            Spacer(Modifier.height(12.dp))
        }
    }
}

@Composable
fun SectionHeader(title: String, link: String, onLinkClick: () -> Unit = {}) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(title, fontWeight = FontWeight.Bold, color = TextDark)
        TextButton(onClick = onLinkClick, contentPadding = PaddingValues(0.dp), modifier = Modifier.height(
            IntrinsicSize.Min)) {
            Text(link, color = Purple, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun HomeScreenPreview() {
    HomeScreen(navController = rememberNavController())
}
