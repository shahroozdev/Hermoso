package com.hermoso.customer.app

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.hermoso.customer.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class ServiceBookingCardState(
    val serviceId: String,
    val serviceName: String,
    val staffId: String = "",
    val bookingDate: LocalDate = LocalDate.now(),
    val bookingTime: String = "",
    val slots: List<BookingSlotDto> = emptyList(),
    val loadingSlots: Boolean = false,
    val slotError: String = "",
    val submitting: Boolean = false,
    val message: String = "",
    val error: String = ""
)

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun BookingScreen(
    navController: NavHostController,
    preSelectedSalonId: String? = null,
    preSelectedServiceId: String? = null,
    preSelectedTreatments: List<String>? = null
) {
    var salons by remember { mutableStateOf(listOf<SalonDto>()) }
    var services by remember { mutableStateOf(listOf<ServiceDto>()) }
    var staff by remember { mutableStateOf(listOf<StaffDto>()) }
    var slots by remember { mutableStateOf(listOf<BookingSlotDto>()) }

    var selectedSalonId by rememberSaveable { mutableStateOf(preSelectedSalonId.orEmpty()) }
    var selectedServiceId by rememberSaveable { mutableStateOf(preSelectedServiceId.orEmpty()) }
    var selectedStaffId by rememberSaveable { mutableStateOf("") }
    var selectedBookingTime by rememberSaveable { mutableStateOf("") }
    var selectedDate by rememberSaveable { mutableStateOf(LocalDate.now()) }

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

    // AI multi-service card states
    var cardStates by remember { mutableStateOf(listOf<ServiceBookingCardState>()) }

    val isAiBooking = !preSelectedTreatments.isNullOrEmpty()

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

    LaunchedEffect(selectedSalonId, optionsReloadKey) {
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
                    serviceId = if (isAiBooking) null else selectedServiceId.ifBlank { null }
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

    // Match AI treatment names to actual services and create card states
    LaunchedEffect(services, isAiBooking, preSelectedTreatments) {
        if (isAiBooking && services.isNotEmpty() && cardStates.isEmpty()) {
            val matched = services.filter { svc ->
                preSelectedTreatments.any { treatment ->
                    svc.name?.lowercase()?.contains(treatment.lowercase()) == true ||
                        treatment.lowercase().contains(svc.name?.lowercase() ?: "")
                }
            }
            if (matched.isNotEmpty()) {
                cardStates = matched.map { svc ->
                    ServiceBookingCardState(
                        serviceId = svc._id ?: "",
                        serviceName = svc.name ?: "Service"
                    )
                }
            }
        }
    }

    // Single service slot fetching (non-AI mode)
    LaunchedEffect(selectedSalonId, selectedServiceId, selectedStaffId, selectedDate, slotsReloadKey) {
        if (isAiBooking || selectedSalonId.isBlank() || selectedServiceId.isBlank() || selectedStaffId.isBlank()) {
            if (!isAiBooking) {
                slots = emptyList()
                selectedBookingTime = ""
            }
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

    val canSubmit = !isAiBooking &&
        selectedSalonId.isNotBlank() &&
        selectedServiceId.isNotBlank() &&
        selectedStaffId.isNotBlank() &&
        selectedBookingTime.isNotBlank() &&
        !submitting

    Column(modifier = Modifier.fillMaxSize().background(Cream)) {
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
                    if (isAiBooking) "AI Recommended Treatments" else "Booking Details",
                    color = Color.White,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        if (isAiBooking) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Purple.copy(alpha = 0.08f)),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Star, "AI", tint = Purple, modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(8.dp))
                            Column {
                                Text("AI-Recommended", fontWeight = FontWeight.Bold, color = Purple, fontSize = 14.sp)
                                Text("Book each treatment separately with your preferred staff", color = TextMuted, fontSize = 12.sp)
                            }
                        }
                    }
                }

                if (loadingOptions) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Purple, modifier = Modifier.size(32.dp))
                        }
                    }
                }

                if (error.isNotBlank() && cardStates.isEmpty()) {
                    item { Text(error, color = Color.Red, modifier = Modifier.padding(8.dp)) }
                }

                itemsIndexed(cardStates) { index, card ->
                    ServiceBookingCard(
                        state = card,
                        salonId = selectedSalonId,
                        staffList = staff,
                        staffLoading = loadingOptions,
                        dateFormatter = dateFormatter,
                        onStateChange = { newState ->
                            cardStates = cardStates.toMutableList().also { it[index] = newState }
                        }
                    )
                }

                item { Spacer(Modifier.height(16.dp)) }
            }
        } else {
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
                                    it to "${svc.name ?: "Service"} (${svc.priceInPaisa.toPkr()})"
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
                    Text("5. Available Slots", fontWeight = FontWeight.Bold, color = TextDark)
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
                            Text("No slots available for this date.", color = TextMuted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(vertical = 8.dp))
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
                            SummaryRow("Total Amount", if (selectedService?.priceInPaisa != null) selectedService.priceInPaisa.toPkr() else "-", highlight = true)
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
    }

    LaunchedEffect(services, preSelectedServiceId) {
        if (!isAiBooking && !preSelectedServiceId.isNullOrBlank() && selectedServiceId.isBlank()) {
            val exists = services.any { it._id == preSelectedServiceId }
            if (exists) selectedServiceId = preSelectedServiceId
        }
    }

    LaunchedEffect(submitting) {
        if (isAiBooking || !submitting) return@LaunchedEffect
        try {
            val response = withContext(Dispatchers.IO) {
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
            val bookingId = ((response.data as? Map<*, *>)?.get("booking") as? Map<*, *>)?.get("_id") as? String
            if (bookingId != null) {
                try {
                    val checkoutResponse = withContext(Dispatchers.IO) {
                        AuthApiClient.api.createCheckout(CheckoutRequest(bookingId))
                    }
                    val checkoutUrl = checkoutResponse.data?.checkoutUrl
                    if (checkoutUrl != null) {
                        navController.navigate("payment-webview/${java.net.URLEncoder.encode(checkoutUrl, "UTF-8")}")
                        return@LaunchedEffect
                    }
                } catch (_: Throwable) {
                    // Checkout failed, proceed without payment
                }
            }
            success = "Booking confirmed! You can view it in your appointments."
            selectedBookingTime = ""
        } catch (t: Throwable) {
            error = t.message ?: "Booking failed. Please try again."
        } finally {
            submitting = false
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ServiceBookingCard(
    state: ServiceBookingCardState,
    salonId: String,
    staffList: List<StaffDto>,
    staffLoading: Boolean,
    dateFormatter: DateTimeFormatter,
    onStateChange: (ServiceBookingCardState) -> Unit
) {
    var submitting by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }
    var cardError by remember { mutableStateOf("") }
    var selectedStaffId by rememberSaveable { mutableStateOf(state.staffId) }
    var selectedDate by remember { mutableStateOf(state.bookingDate) }
    var selectedBookingTime by rememberSaveable { mutableStateOf(state.bookingTime) }
    var slots by remember { mutableStateOf(listOf<BookingSlotDto>()) }
    var loadingSlots by remember { mutableStateOf(false) }
    val today = remember { LocalDate.now() }

    val canFetchSlots = salonId.isNotBlank() && state.serviceId.isNotBlank() && selectedStaffId.isNotBlank()

    LaunchedEffect(canFetchSlots, selectedStaffId, selectedDate) {
        if (!canFetchSlots) {
            slots = emptyList()
            selectedBookingTime = ""
            return@LaunchedEffect
        }
        loadingSlots = true
        cardError = ""
        selectedBookingTime = ""
        try {
            val response = withContext(Dispatchers.IO) {
                AuthApiClient.api.getBookingAvailability(
                    salonId = salonId,
                    serviceId = state.serviceId,
                    staffId = selectedStaffId,
                    date = selectedDate.format(dateFormatter)
                )
            }
            slots = response.data?.slots ?: emptyList()
        } catch (t: Throwable) {
            slots = emptyList()
            cardError = t.message ?: "Failed to load slots"
        } finally {
            loadingSlots = false
        }
    }

    LaunchedEffect(submitting) {
        if (!submitting) return@LaunchedEffect
        try {
            val response = withContext(Dispatchers.IO) {
                AuthApiClient.api.createBooking(
                    CreateBookingRequest(
                        salonId = salonId,
                        serviceId = state.serviceId,
                        staffId = selectedStaffId,
                        bookingDate = selectedDate.format(dateFormatter),
                        bookingTime = selectedBookingTime
                    )
                )
            }
            val bookingId = ((response.data as? Map<*, *>)?.get("booking") as? Map<*, *>)?.get("_id") as? String
            if (bookingId != null) {
                try {
                    val checkoutResponse = withContext(Dispatchers.IO) {
                        AuthApiClient.api.createCheckout(CheckoutRequest(bookingId))
                    }
                    val checkoutUrl = checkoutResponse.data?.checkoutUrl
                    if (checkoutUrl != null) {
                        message = "Redirecting to payment..."
                        onStateChange(state.copy(
                            submitting = false,
                            message = "Redirecting to payment...",
                            bookingTime = ""
                        ))
                        return@LaunchedEffect
                    }
                } catch (_: Throwable) {
                    // Checkout failed, proceed without payment
                }
            }
            message = "${state.serviceName} booked successfully!"
            selectedBookingTime = ""
            selectedStaffId = ""
            selectedDate = today
        } catch (t: Throwable) {
            cardError = t.message ?: "Booking failed"
        } finally {
            submitting = false
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(state.serviceName, fontWeight = FontWeight.Bold, color = Purple, fontSize = 16.sp)

            LabeledSelect(
                label = "Select Staff",
                value = selectedStaffId,
                placeholder = "Choose staff member",
                options = staffList.mapNotNull { it._id?.let { id -> id to (it.name ?: "Staff") } },
                enabled = !staffLoading && !submitting
            ) { id ->
                selectedStaffId = id
                selectedBookingTime = ""
                slots = emptyList()
            }

            Text("Select Date", fontWeight = FontWeight.Bold, color = TextDark, fontSize = 13.sp)
            CalendarView(selectedDate = selectedDate) { picked ->
                selectedDate = if (picked.isBefore(today)) today else picked
            }

            Text("Available Slots", fontWeight = FontWeight.Bold, color = TextDark, fontSize = 13.sp)
            if (loadingSlots) {
                Box(Modifier.fillMaxWidth().padding(8.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Purple, modifier = Modifier.size(24.dp))
                }
            } else {
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
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
                                },
                            shape = RoundedCornerShape(10.dp),
                            color = when {
                                !available -> Color.LightGray.copy(alpha = 0.3f)
                                selected -> Purple
                                else -> Color.White
                            },
                            border = if (selected) null else BorderStroke(1.dp, PurplePale)
                        ) {
                            Text(
                                text = slotLabel,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                color = when {
                                    !available -> TextMuted.copy(alpha = 0.5f)
                                    selected -> Color.White
                                    else -> TextDark
                                },
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
                if (slots.isEmpty() && selectedStaffId.isNotBlank()) {
                    Text("No slots available.", color = TextMuted, fontSize = 12.sp)
                }
            }

            if (cardError.isNotBlank()) {
                Text(cardError, color = Color.Red, fontSize = 12.sp)
            }

            Button(
                onClick = {
                    submitting = true
                    message = ""
                    cardError = ""
                },
                enabled = selectedStaffId.isNotBlank() && selectedBookingTime.isNotBlank() && !submitting,
                modifier = Modifier.fillMaxWidth().height(44.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Purple),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (submitting) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                } else {
                    Text("Book ${state.serviceName}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }

            if (message.isNotBlank()) {
                Text(message, color = Color(0xFF0A7D3B), fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
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
