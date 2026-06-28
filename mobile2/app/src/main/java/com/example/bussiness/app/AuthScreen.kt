package com.example.bussiness.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(onLoginSuccess: (String?) -> Unit) {
    var isLogin by rememberSaveable { mutableStateOf(true) }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var name by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var otp by rememberSaveable { mutableStateOf("") }
    var otpMode by rememberSaveable { mutableStateOf(false) }
    var loading by rememberSaveable { mutableStateOf(false) }
    var error by rememberSaveable { mutableStateOf("") }
    var message by rememberSaveable { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(OwnerNavy, OwnerNavyMid)))) {
        Column(modifier = Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text("Hermoso", color = OwnerGold, fontSize = 42.sp, fontWeight = FontWeight.ExtraBold)
            Text("Business Console", color = OwnerTextMuted, fontSize = 16.sp, modifier = Modifier.padding(bottom = 40.dp))
            Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = OwnerNavyCard), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(if (otpMode) "Verify OTP" else if (isLogin) "Owner Login" else "Create Owner Account", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = OwnerTextLight)
                    Spacer(modifier = Modifier.height(20.dp))
                    if (!isLogin && !otpMode) {
                        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full Name") }, modifier = Modifier.fillMaxWidth())
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone") }, modifier = Modifier.fillMaxWidth())
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                    OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(12.dp))
                    if (otpMode) {
                        OutlinedTextField(value = otp, onValueChange = { otp = it }, label = { Text("OTP") }, modifier = Modifier.fillMaxWidth())
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(onClick = {
                            error = ""; message = ""
                            scope.launch {
                                loading = true
                                try {
                                    val result = AuthApiClient.api.verifyOtp(VerifyOtpRequest(email = email, otp = otp))
                                    if (result.success) { message = result.message ?: "OTP verified"; otpMode = false; isLogin = true; otp = "" } else error = result.message ?: "OTP verification failed"
                                } catch (t: Throwable) { error = t.message ?: "Something went wrong" } finally { loading = false }
                            }
                        }, enabled = !loading, modifier = Modifier.fillMaxWidth().height(56.dp), colors = ButtonDefaults.buttonColors(containerColor = OwnerGold)) { Text(if (loading) "Verifying..." else "Verify OTP", color = OwnerNavy) }
                    } else {
                        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(onClick = {
                            error = ""; message = ""
                            scope.launch {
                                loading = true
                                try {
                                    if (isLogin) {
                                        val result = AuthApiClient.api.login(LoginRequest(email = email, password = password))
                                        if (result.success && !result.accessToken.isNullOrBlank() && !result.refreshToken.isNullOrBlank()) {
                                            SessionManager.saveSession(result.accessToken, result.refreshToken, result.user?.name, result.user?.role)
                                            onLoginSuccess(result.user?.role)
                                        } else error = result.message ?: "Login failed"
                                    } else {
                                        val result = AuthApiClient.api.register(RegisterRequest(name = name, email = email, phone = phone, password = password, role = "salon_owner"))
                                        if (result.success) { otpMode = true; message = result.message ?: "OTP sent" } else error = result.message ?: "Registration failed"
                                    }
                                } catch (t: Throwable) { error = t.message ?: "Something went wrong" } finally { loading = false }
                            }
                        }, enabled = !loading, modifier = Modifier.fillMaxWidth().height(56.dp), colors = ButtonDefaults.buttonColors(containerColor = OwnerGold)) {
                            Text(if (loading && isLogin) "Logging in..." else if (loading) "Signing up..." else if (isLogin) "Login" else "Sign Up", color = OwnerNavy)
                        }
                    }
                    if (error.isNotBlank()) Text(error, color = Color(0xFFFCA5A5), modifier = Modifier.padding(top = 10.dp))
                    if (message.isNotBlank()) Text(message, color = Color(0xFF86EFAC), modifier = Modifier.padding(top = 10.dp))
                    TextButton(onClick = { if (otpMode) { otpMode = false; isLogin = true } else isLogin = !isLogin; error = ""; message = "" }, modifier = Modifier.padding(top = 16.dp)) {
                        Text(if (otpMode) "Back to Login" else if (isLogin) "Create owner account" else "Already have an account? Login", color = OwnerGold)
                    }
                }
            }
        }
    }
}
