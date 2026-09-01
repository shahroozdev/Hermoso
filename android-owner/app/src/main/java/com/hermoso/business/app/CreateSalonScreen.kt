package com.hermoso.business.app

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hermoso.business.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

@Composable
fun CreateSalonScreen(onSalonCreated: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var name by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var address by rememberSaveable { mutableStateOf("") }
    var city by rememberSaveable { mutableStateOf("") }
    var country by rememberSaveable { mutableStateOf("Pakistan") }
    var description by rememberSaveable { mutableStateOf("") }
    var imageUri by rememberSaveable { mutableStateOf<Uri?>(null) }
    var loading by rememberSaveable { mutableStateOf(false) }
    var error by rememberSaveable { mutableStateOf("") }

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        imageUri = uri
    }

    fun validate(): Boolean {
        when {
            name.isBlank() -> { error = "Salon name is required"; return false }
            name.length < 2 -> { error = "Salon name must be at least 2 characters"; return false }
            phone.isBlank() -> { error = "Phone number is required"; return false }
            phone.length < 10 -> { error = "Phone number must be at least 10 digits"; return false }
            address.isBlank() -> { error = "Address is required"; return false }
            address.length < 5 -> { error = "Full address is required"; return false }
            city.isBlank() -> { error = "City is required"; return false }
        }
        return true
    }

    fun submit() {
        error = ""
        if (!validate()) return

        scope.launch {
            loading = true
            try {
                val namePart = name.toRequestBody("text/plain".toMediaTypeOrNull())
                val phonePart = phone.toRequestBody("text/plain".toMediaTypeOrNull())
                val addressPart = address.toRequestBody("text/plain".toMediaTypeOrNull())
                val descPart = description.toRequestBody("text/plain".toMediaTypeOrNull())
                val locationJson = """{"city":"$city","country":"$country"}"""
                val locationPart = locationJson.toRequestBody("text/plain".toMediaTypeOrNull())

                val imagePart = imageUri?.let { uri ->
                    val inputStream = context.contentResolver.openInputStream(uri) ?: return@let null
                    val tempFile = File(context.cacheDir, "salon_image.jpg")
                    tempFile.outputStream().use { out -> inputStream.copyTo(out) }
                    inputStream.close()
                    val requestFile = tempFile.asRequestBody("image/*".toMediaTypeOrNull())
                    MultipartBody.Part.createFormData("imageUrl", tempFile.name, requestFile)
                }

                val response = withContext(Dispatchers.IO) {
                    AuthApiClient.api.createSalon(
                        name = namePart,
                        phone = phonePart,
                        address = addressPart,
                        description = descPart,
                        location = locationPart,
                        workingHours = null,
                        image = imagePart
                    )
                }

                if (response.success) {
                    onSalonCreated()
                } else {
                    error = response.message ?: "Failed to create salon"
                }
            } catch (t: Throwable) {
                error = parseApiError(t).message
            } finally {
                loading = false
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(OwnerNavy, OwnerNavyMid)))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(16.dp))
            Text(
                text = "Create Your Salon",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                text = "Set up your salon profile to get started",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 14.sp,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Salon Name *") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone *") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = { Text("Address *") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = city,
                        onValueChange = { city = it },
                        label = { Text("City *") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = country,
                        onValueChange = { country = it },
                        label = { Text("Country") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Description") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        minLines = 2,
                        maxLines = 4,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { submit() })
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = { imagePicker.launch("image/*") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = OwnerNavyCard)
                    ) {
                        Text(
                            if (imageUri != null) "Image Selected ✓" else "Select Salon Image",
                            color = OwnerGold
                        )
                    }
                    Spacer(modifier = Modifier.height(24.dp))

                    if (error.isNotBlank()) {
                        Text(text = error, color = Color(0xFFB00020), modifier = Modifier.padding(bottom = 12.dp))
                    }

                    Button(
                        onClick = { submit() },
                        enabled = !loading,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = OwnerGold, contentColor = OwnerNavy)
                    ) {
                        if (loading) {
                            CircularProgressIndicator(color = OwnerNavy, modifier = Modifier.height(24.dp))
                        } else {
                            Text("Create Salon", fontSize = 18.sp)
                        }
                    }
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}
