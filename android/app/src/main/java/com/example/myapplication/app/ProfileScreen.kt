package com.example.myapplication.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.example.myapplication.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun ProfileScreen() {
    var loading by remember { mutableStateOf(true) }
    var saving by remember { mutableStateOf(false) }
    var changingPassword by remember { mutableStateOf(false) }

    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var city by rememberSaveable { mutableStateOf("") }
    var country by rememberSaveable { mutableStateOf("") }
    var bankAccount by rememberSaveable { mutableStateOf("") }

    var currentPassword by rememberSaveable { mutableStateOf("") }
    var newPassword by rememberSaveable { mutableStateOf("") }
    var scanAlerts by rememberSaveable { mutableStateOf(true) }
    var bookingReminders by rememberSaveable { mutableStateOf(true) }

    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }

    suspend fun loadProfile() {
        loading = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getMyProfile() }
            if (response.success) {
                val profile = response.data
                name = profile?.name.orEmpty()
                email = profile?.email.orEmpty()
                phone = profile?.phone.orEmpty()
                city = profile?.location?.city.orEmpty()
                country = profile?.location?.country.orEmpty()
                bankAccount = profile?.bankAccount.orEmpty()
                SessionManager.saveSession(SessionManager.accessToken, SessionManager.refreshToken, profile?.name, profile?.role ?: SessionManager.userRole)
            } else {
                error = response.message ?: "Failed to load profile"
            }
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load profile"
        } finally {
            loading = false
        }
    }

    LaunchedEffect(Unit) {
        loadProfile()
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Cream)) {
        if (loading) {
            item {
                Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Purple)
                }
            }
        } else {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Profile", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = email, onValueChange = {}, enabled = false, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = country, onValueChange = { country = it }, label = { Text("Country") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = bankAccount, onValueChange = { bankAccount = it }, label = { Text("Bank Account") }, modifier = Modifier.fillMaxWidth())

                        Button(
                            onClick = {
                                // Validate inputs
                                when {
                                    name.isBlank() -> error = "Name is required"
                                    name.length < 2 -> error = "Name must be at least 2 characters"
                                    phone.isNotBlank() && phone.length < 10 -> error = "Phone number must be at least 10 digits"
                                    else -> {
                                        saving = true
                                        success = ""
                                        error = ""
                                    }
                                }
                            },
                            enabled = !saving,
                            colors = ButtonDefaults.buttonColors(containerColor = Purple),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(if (saving) "Saving..." else "Update Profile")
                        }
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Settings", fontWeight = FontWeight.Bold)
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Scan Result Alerts", color = TextDark)
                            Switch(checked = scanAlerts, onCheckedChange = { scanAlerts = it })
                        }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Booking Reminders", color = TextDark)
                            Switch(checked = bookingReminders, onCheckedChange = { bookingReminders = it })
                        }
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Change Password", fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = currentPassword,
                            onValueChange = { currentPassword = it },
                            label = { Text("Current Password") },
                            visualTransformation = PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = newPassword,
                            onValueChange = { newPassword = it },
                            label = { Text("New Password") },
                            visualTransformation = PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Button(
                            onClick = {
                                // Validate password inputs
                                when {
                                    currentPassword.isBlank() -> error = "Current password is required"
                                    newPassword.isBlank() -> error = "New password is required"
                                    newPassword.length < 6 -> error = "New password must be at least 6 characters"
                                    currentPassword == newPassword -> error = "New password must be different from current password"
                                    else -> {
                                        changingPassword = true
                                        success = ""
                                        error = ""
                                    }
                                }
                            },
                            enabled = !changingPassword,
                            colors = ButtonDefaults.buttonColors(containerColor = PurpleDark),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(if (changingPassword) "Updating..." else "Update Password")
                        }
                    }
                }
            }

            item {
                if (error.isNotBlank()) {
                    Text(error, color = Color(0xFFB00020), modifier = Modifier.padding(16.dp))
                }
                if (success.isNotBlank()) {
                    Text(success, color = Color(0xFF0A7D3B), modifier = Modifier.padding(16.dp))
                }
                Spacer(Modifier.height(20.dp))
            }
        }
    }

    LaunchedEffect(saving) {
        if (!saving) return@LaunchedEffect
        try {
            val response = withContext(Dispatchers.IO) {
                AuthApiClient.api.updateMyProfile(
                    UpdateProfileRequest(
                        name = name,
                        phone = phone,
                        city = city,
                        country = country,
                        bankAccount = bankAccount
                    )
                )
            }
            if (response.success) {
                success = "Profile updated"
                SessionManager.saveSession(SessionManager.accessToken, SessionManager.refreshToken, name, SessionManager.userRole)
            } else {
                error = response.message ?: "Profile update failed"
            }
        } catch (t: Throwable) {
            error = t.message ?: "Profile update failed"
        } finally {
            saving = false
        }
    }

    LaunchedEffect(changingPassword) {
        if (!changingPassword) return@LaunchedEffect
        try {
            val response = withContext(Dispatchers.IO) {
                AuthApiClient.api.changePassword(
                    ChangePasswordRequest(
                        currentPassword = currentPassword,
                        newPassword = newPassword
                    )
                )
            }
            if (response.success) {
                success = response.message ?: "Password updated"
                currentPassword = ""
                newPassword = ""
            } else {
                error = response.message ?: "Password update failed"
            }
        } catch (t: Throwable) {
            error = t.message ?: "Password update failed"
        } finally {
            changingPassword = false
        }
    }
}
