package com.hermoso.customer.app

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.hermoso.customer.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun SalonServicesScreen(navController: NavHostController, salonId: String) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var salon by remember { mutableStateOf<SalonDetailDto?>(null) }
    var services by remember { mutableStateOf(listOf<ServiceDto>()) }
    var selectedServiceId by remember { mutableStateOf("") }

    var reviewRating by remember { mutableStateOf(0) }
    var reviewComment by remember { mutableStateOf("") }
    var reviewSubmitting by remember { mutableStateOf(false) }
    var reviewError by remember { mutableStateOf("") }
    var reviewSubmitted by remember { mutableStateOf(false) }

    LaunchedEffect(salonId) {
        loading = true
        error = ""

        try {
            val response = withContext(Dispatchers.IO) {
                AuthApiClient.api.getSalonById(id = salonId)
            }

            if (response.success) {
                val data = response.data

                salon = data
                services = data?.services ?: emptyList()
            } else {
                error = "Failed to load salon details"
            }

        } catch (t: Throwable) {
            error = t.message ?: "Failed to load salon details"
        } finally {
            loading = false
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Cream)) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                ) {
                    // Show image if available, otherwise show gradient background
                    val imageToShow = salon?.imageUrl ?: salon?.images?.firstOrNull()
                    if (!imageToShow.isNullOrBlank()) {
                        AsyncImage(
                            model = imageToShow,
                            contentDescription = salon?.name,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(300.dp),
                            contentScale = ContentScale.Crop
                        )
                        // Add gradient overlay for better text readability
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(300.dp)
                                .background(
                                    Brush.verticalGradient(
                                        listOf(
                                            Color.Black.copy(alpha = 0.3f),
                                            Color.Black.copy(alpha = 0.6f)
                                        )
                                    )
                                )
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Brush.verticalGradient(listOf(PurpleDeeper, PurpleDark)))
                        )
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 24.dp)
                    ) {
                        // 1. Back Arrow and Title Row
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 12.dp)
                        ) {
                            IconButton(
                                onClick = { navController.popBackStack() },
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(Color.White.copy(alpha = 0.1f), CircleShape)
                            ) {
                                Icon(
                                    Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = "Back",
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Text(
                                text = salon?.name ?: "Salon Profile",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                maxLines = 1
                            )
                        }

                        // Details Section
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(start = 24.dp, end = 24.dp, top = 8.dp)
                        ) {
                            // 2. Location Row — no Google Maps API key is configured in this
                            // project, so instead of an embedded map, tapping opens the
                            // address in whatever maps app is installed on the device.
                            val addressText = salon?.address ?: "${salon?.location?.city ?: "Lahore"}, Pakistan"
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.clickable {
                                    val query = Uri.encode("${salon?.name.orEmpty()} $addressText".trim())
                                    val intent = Intent(
                                        Intent.ACTION_VIEW,
                                        Uri.parse("geo:0,0?q=$query")
                                    )
                                    try {
                                        context.startActivity(intent)
                                    } catch (_: ActivityNotFoundException) {
                                        context.startActivity(
                                            Intent(
                                                Intent.ACTION_VIEW,
                                                Uri.parse("https://www.google.com/maps/search/?api=1&query=$query")
                                            )
                                        )
                                    }
                                }
                            ) {
                                Icon(
                                    Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = PurpleLight,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    text = addressText,
                                    color = Color.White.copy(alpha = 0.9f),
                                    style = MaterialTheme.typography.bodyMedium,
                                    textDecoration = TextDecoration.Underline
                                )
                            }

                            Spacer(Modifier.height(12.dp))

                            // 3. Description Text
                            Text(
                                text = salon?.description ?: "",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.White.copy(alpha = 0.8f),
                                lineHeight = 22.sp
                            )

                            Spacer(Modifier.height(20.dp))

                            // 4. Rating Badge
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color.White
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Star,
                                        contentDescription = null,
                                        tint = Color(0xFFFFB800),
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(Modifier.width(4.dp))
                                    Text(
                                        text = String.format(java.util.Locale.US, "%.1f", salon?.avgRating ?: 0.0),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = TextDark
                                    )
                                }
                            }
                        }
                    }
                }
            }

            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Text(
                        "Available Services",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = TextDark
                    )
                }
            }

            if (loading) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Purple)
                    }
                }
            } else if (error.isNotBlank()) {
                item {
                    Text(error, color = Color.Red, modifier = Modifier.padding(16.dp))
                }
            } else if (services.isEmpty()) {
                item {
                    Text("No services available for this salon.", color = TextMuted, modifier = Modifier.padding(16.dp))
                }
            } else {
                items(services) { service ->
                    val id = service._id.orEmpty()
                    val selected = id == selectedServiceId
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clickable { selectedServiceId = id },
                        colors = CardDefaults.cardColors(
                            containerColor = if (selected) Purple.copy(alpha = 0.1f) else Color.White
                        ),
                        shape = RoundedCornerShape(16.dp),
                        border = if (selected) androidx.compose.foundation.BorderStroke(2.dp, Purple) else null,
                        elevation = CardDefaults.cardElevation(defaultElevation = if (selected) 0.dp else 2.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    service.name ?: "Service",
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = TextDark,
                                    maxLines = 1
                                )
                                Text(
                                    service.description?:"",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMuted,
                                    maxLines = 2
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    "${service.duration ?: 0} min",
                                    color = TextMuted,
                                    style = MaterialTheme.typography.bodySmall
                                )
                                Text(
                                    "PKR ${(service.price ?: 0.0).toInt()}",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Purple,
                                    style = MaterialTheme.typography.titleMedium
                                )
                            }
                        }
                    }
                }
            }

            item {
                Column(modifier = Modifier.fillMaxWidth().padding(20.dp)) {
                    Text(
                        "Write a Review",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = TextDark
                    )
                    Spacer(Modifier.height(12.dp))

                    Row {
                        (1..5).forEach { star ->
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = "Rate $star star${if (star > 1) "s" else ""}",
                                tint = if (star <= reviewRating) Color(0xFFFBBF24) else TextMuted.copy(alpha = 0.3f),
                                modifier = Modifier
                                    .size(32.dp)
                                    .clickable {
                                        reviewRating = star
                                        reviewSubmitted = false
                                    }
                            )
                            Spacer(Modifier.width(4.dp))
                        }
                    }
                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = reviewComment,
                        onValueChange = { reviewComment = it },
                        label = { Text("Share your experience (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        shape = RoundedCornerShape(12.dp)
                    )
                    Spacer(Modifier.height(12.dp))

                    if (reviewError.isNotBlank()) {
                        Text(reviewError, color = Color(0xFFB00020), modifier = Modifier.padding(bottom = 8.dp))
                    }
                    if (reviewSubmitted) {
                        Text(
                            "Thanks! Your review has been submitted.",
                            color = Color(0xFF0F9D58),
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }

                    Button(
                        onClick = {
                            if (reviewRating == 0) {
                                reviewError = "Please select a star rating"
                                return@Button
                            }
                            reviewError = ""
                            reviewSubmitting = true
                            scope.launch {
                                try {
                                    AuthApiClient.api.createReview(
                                        CreateReviewRequest(salonId = salonId, rating = reviewRating, comment = reviewComment)
                                    )
                                    reviewSubmitted = true
                                    reviewRating = 0
                                    reviewComment = ""
                                } catch (t: Throwable) {
                                    reviewError = t.message ?: "Failed to submit review"
                                } finally {
                                    reviewSubmitting = false
                                }
                            }
                        },
                        enabled = !reviewSubmitting,
                        colors = ButtonDefaults.buttonColors(containerColor = Purple),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().height(48.dp)
                    ) {
                        if (reviewSubmitting) {
                            CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("Submit Review", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Fixed Bottom Booking Bar
        if (selectedServiceId.isNotBlank()) {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth(),
                color = Color.White,
                tonalElevation = 8.dp,
                shadowElevation = 16.dp
            ) {
                Row(
                    modifier = Modifier
                        .navigationBarsPadding()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val selectedService = services.find { it._id == selectedServiceId }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Selected Service", style = MaterialTheme.typography.labelMedium, color = TextMuted)
                        Text(
                            selectedService?.name ?: "",
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            color = TextDark
                        )
                    }
                    Button(
                        onClick = {
                            navController.navigate("booking/$salonId/$selectedServiceId")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Purple),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.height(48.dp)
                    ) {
                        Text("Book Now", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
