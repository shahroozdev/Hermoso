package com.example.myapplication.app

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.example.myapplication.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun BookingScreen(
    navController: NavHostController,
    preSelectedSalonId: String? = null,
    preSelectedServiceId: String? = null
) {
    var salons by remember { mutableStateOf(listOf<SalonDto>()) }
    var services by remember { mutableStateOf(listOf<ServiceDto>()) }
    var staff by remember { mutableStateOf(listOf<StaffDto>()) }
    var slots by remember { mutableStateOf(listOf<BookingSlotDto>()) }

    var selectedSalonId by rememberSaveable { mutableStateOf(preSelectedSalonId.orEmpty()) }
    var selectedServiceId by rememberSaveable { mutableStateOf(preSelectedServiceId.orEmpty()) }
    var selectedStaffId by rememberSaveable { mutableStateOf("") }
    var selectedBookingTime by rememberSaveable { mutableStateOf("") }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }

    var loadingSalons by remember { mutableStateOf(false) }
    var loadingOptions by remember { mutableStateOf(false) }
    var loadingSlots by remember { mutableStateOf(false) }
    var submitting by remember { mutableStateOf(false) }

    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }
    var salonsReloadKey by remember { mutableIntStateOf(0) }
    var optionsReloadKey by remember { mutableIntStateOf(0) }
    var slotsReloadKey by remember { mutableIntStateOf(0) }

    val today = remember { LocalDate.now() }
    val dateFormatter = remember { DateTimeFormatter.ofPattern("yyyy-MM-dd") }

    LaunchedEffect(salonsReloadKey) {
        loadingSalons = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) {
                AuthApiClient.api.getSalons(page = 1, limit = 50)
            }
            salons = response.data ?: emptyList()
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load salons"
        } finally {
            loadingSalons = false
        }
    }

    LaunchedEffect(selectedSalonId, selectedServiceId, optionsReloadKey) {
        if (selectedSalonId.isBlank()) {
            services = emptyList()
            staff = emptyList()
            return@LaunchedEffect
        }
        loadingOptions = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) {
                AuthApiClient.api.getBookingOptions(
                    salonId = selectedSalonId,
                    serviceId = selectedServiceId.ifBlank { null }
                )
            }
            services = response.data?.services ?: emptyList()
            staff = response.data?.staff ?: emptyList()
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load booking options"
        } finally {
            loadingOptions = false
        }
    }

    LaunchedEffect(selectedSalonId, selectedServiceId, selectedStaffId, selectedDate, slotsReloadKey) {
        if (selectedSalonId.isBlank() || selectedServiceId.isBlank() || selectedStaffId.isBlank()) {
            slots = emptyList()
            selectedBookingTime = ""
            return@LaunchedEffect
        }
        loadingSlots = true
        error = ""
        selectedBookingTime = ""
        try {
            val response = withContext(Dispatchers.IO) {
                AuthApiClient.api.getBookingAvailability(
                    salonId = selectedSalonId,
                    serviceId = selectedServiceId,
                    staffId = selectedStaffId,
                    date = selectedDate.format(dateFormatter)
                )
            }
            slots = response.data?.slots ?: emptyList()
        } catch (t: Throwable) {
            slots = emptyList()
            error = t.message ?: "Failed to load slots"
        } finally {
            loadingSlots = false
        }
    }

    val selectedSalon = salons.firstOrNull { it._id == selectedSalonId }
    val selectedService = services.firstOrNull { it._id == selectedServiceId }
    val selectedStaff = staff.firstOrNull { it._id == selectedStaffId }

    val canSubmit = selectedSalonId.isNotBlank() &&
            selectedServiceId.isNotBlank() &&
            selectedStaffId.isNotBlank() &&
            selectedBookingTime.isNotBlank() &&
            !submitting

    Column(modifier = Modifier.fillMaxSize().background(Cream)) {
        // Updated Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(PurpleDeeper, PurpleDark, Purple)))
                .statusBarsPadding()
                .padding(vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White)
                }
                Text(
                    "Booking Details",
                    color = Color.White,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    LabeledSelect(
                        label = "1. Select Salon",
                        value = selectedSalonId,
                        placeholder = "Choose a salon",
                        options = salons.mapNotNull { salon -> salon._id?.let { it to (salon.name ?: "Salon") } },
                        enabled = !loadingSalons && !submitting && preSelectedSalonId == null
                    ) { newSalonId ->
                        selectedSalonId = newSalonId
                        selectedServiceId = ""
                        selectedStaffId = ""
                        selectedBookingTime = ""
                        services = emptyList()
                        staff = emptyList()
                        slots = emptyList()
                        success = ""
                    }

                    LabeledSelect(
                        label = "2. Select Service",
                        value = selectedServiceId,
                        placeholder = "Choose a service",
                        options = services.mapNotNull { svc ->
                            svc._id?.let {
                                val price = svc.price?.toInt() ?: 0
                                it to "${svc.name ?: "Service"} (PKR $price)"
                            }
                        },
                        enabled = selectedSalonId.isNotBlank() && !loadingOptions && !submitting
                    ) { newServiceId ->
                        selectedServiceId = newServiceId
                        selectedStaffId = ""
                        selectedBookingTime = ""
                        slots = emptyList()
                        success = ""
                    }

                    LabeledSelect(
                        label = "3. Select Specialist",
                        value = selectedStaffId,
                        placeholder = "Choose staff member",
                        options = staff.mapNotNull { member -> member._id?.let { it to (member.name ?: "Staff") } },
                        enabled = selectedSalonId.isNotBlank() && !loadingOptions && !submitting
                    ) { newStaffId ->
                        selectedStaffId = newStaffId
                        selectedBookingTime = ""
                        success = ""
                    }
                }
            }

            item {
                Text("4. Select Date", fontWeight = FontWeight.Bold, color = TextDark)
                Spacer(Modifier.height(8.dp))
                CalendarView(selectedDate = selectedDate) { picked ->
                    selectedDate = if (picked.isBefore(today)) today else picked
                    success = ""
                }
            }

            item {
                Text(
                    "5. Available Slots",
                    fontWeight = FontWeight.Bold,
                    color = TextDark
                )
                Spacer(Modifier.height(8.dp))

                if (loadingSlots) {
                    Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Purple, modifier = Modifier.size(32.dp))
                    }
                } else {
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        slots.forEach { slot ->
                            val slotTime = slot.time.orEmpty()
                            val slotLabel = slot.label ?: slot.time.orEmpty()
                            val available = slot.available == true
                            val selected = selectedBookingTime == slotTime
                            
                            Surface(
                                modifier = Modifier
                                    .clickable(enabled = available && slotTime.isNotBlank()) {
                                        selectedBookingTime = slotTime
                                        success = ""
                                    },
                                shape = RoundedCornerShape(12.dp),
                                color = when {
                                    !available -> Color.LightGray.copy(alpha = 0.3f)
                                    selected -> Purple
                                    else -> Color.White
                                },
                                border = if (selected) null else BorderStroke(1.dp, PurplePale)
                            ) {
                                Text(
                                    text = slotLabel,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                                    color = when {
                                        !available -> TextMuted.copy(alpha = 0.5f)
                                        selected -> Color.White
                                        else -> TextDark
                                    },
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                    if (slots.isEmpty() && selectedSalonId.isNotBlank() && selectedServiceId.isNotBlank() && selectedStaffId.isNotBlank()) {
                        Text(
                            "No slots available for this date.",
                            color = TextMuted,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Booking Summary", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        HorizontalDivider(color = Cream, thickness = 1.dp)
                        SummaryRow("Salon", selectedSalon?.name ?: "-")
                        SummaryRow("Service", selectedService?.name ?: "-")
                        SummaryRow("Specialist", selectedStaff?.name ?: "-")
                        SummaryRow("Date", selectedDate.format(DateTimeFormatter.ofPattern("EEE, d MMM yyyy")))
                        SummaryRow("Time", if (selectedBookingTime.isBlank()) "-" else selectedBookingTime)
                        HorizontalDivider(color = Cream, thickness = 1.dp)
                        SummaryRow(
                            "Total Amount",
                            if (selectedService?.price != null) "PKR ${selectedService.price.toInt()}" else "-",
                            highlight = true
                        )
                    }
                }
            }

            item {
                if (error.isNotBlank()) {
                    Text(error, color = Color.Red, style = MaterialTheme.typography.bodySmall, modifier = Modifier.fillMaxWidth())
                }
                if (success.isNotBlank()) {
                    Text(success, color = Color(0xFF0A7D3B), fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth())
                }

                Button(
                    onClick = {
                        success = ""
                        error = ""
                        submitting = true
                    },
                    enabled = canSubmit,
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Purple),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (submitting) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Text("Confirm Booking", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }

    LaunchedEffect(services, preSelectedServiceId) {
        if (!preSelectedServiceId.isNullOrBlank() && selectedServiceId.isBlank()) {
            val exists = services.any { it._id == preSelectedServiceId }
            if (exists) selectedServiceId = preSelectedServiceId
        }
    }

    LaunchedEffect(submitting) {
        if (!submitting) return@LaunchedEffect
        try {
            withContext(Dispatchers.IO) {
                AuthApiClient.api.createBooking(
                    CreateBookingRequest(
                        salonId = selectedSalonId,
                        serviceId = selectedServiceId,
                        staffId = selectedStaffId,
                        bookingDate = selectedDate.format(dateFormatter),
                        bookingTime = selectedBookingTime
                    )
                )
            }
            success = "Booking confirmed! You can view it in your appointments."
            selectedBookingTime = ""
            // Optional: Auto-navigate back or to bookings list after delay
        } catch (t: Throwable) {
            error = t.message ?: "Booking failed. Please try again."
        } finally {
            submitting = false
        }
    }
}

@Composable
private fun LabeledSelect(
    label: String,
    value: String,
    placeholder: String,
    options: List<Pair<String, String>>,
    enabled: Boolean,
    onSelect: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    Column {
        Text(label, fontWeight = FontWeight.Bold, color = TextDark, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(6.dp))
        Box {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = enabled) { expanded = true },
                shape = RoundedCornerShape(12.dp),
                color = if (enabled) Color.White else Color(0xFFF5F5F5),
                border = BorderStroke(1.dp, if (enabled) PurplePale else Color.Transparent)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = options.firstOrNull { it.first == value }?.second ?: placeholder,
                        color = if (value.isBlank()) TextMuted else TextDark,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text("▼", color = Purple, fontSize = 10.sp)
                }
            }
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.fillMaxWidth(0.9f).background(Color.White)
            ) {
                options.forEach { opt ->
                    DropdownMenuItem(
                        text = { Text(opt.second) },
                        onClick = {
                            onSelect(opt.first)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun SummaryRow(key: String, value: String, highlight: Boolean = false) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(key, color = TextMuted, style = MaterialTheme.typography.bodyMedium)
        Text(
            value,
            color = if (highlight) Purple else TextDark,
            fontWeight = if (highlight) FontWeight.Bold else FontWeight.Medium,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun BookingScreenPreview() {
    BookingScreen(navController = rememberNavController())
}
