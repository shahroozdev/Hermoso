package com.hermoso.business.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hermoso.business.ui.theme.*
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.HttpException

// Hermoso Business (salon owner) — sign-up always registers as "salon_owner".
// After login the role guard rejects any non-owner account and shows a
// message directing the user to download Hermoso App instead.

@Composable
fun AuthScreen(onLoginSuccess: () -> Unit) {
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
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // errorBody() is a one-shot stream, so message + structured code must be read
    // from a single .string() call rather than two separate parse functions.
    data class ApiErrorInfo(val message: String, val code: String?)

    fun parseApiError(throwable: Throwable): ApiErrorInfo {
        if (throwable !is HttpException) {
            return ApiErrorInfo(throwable.message ?: "Something went wrong", null)
        }
        val raw = throwable.response()?.errorBody()?.string()
            ?: return ApiErrorInfo(throwable.message ?: "Request failed", null)
        return try {
            val json = JSONObject(raw)
            ApiErrorInfo(json.optString("message").ifBlank { raw }, json.optString("code").ifBlank { null })
        } catch (e: Exception) {
            ApiErrorInfo(raw, null)
        }
    }

    fun handleSubmit() {
        error = ""
        message = ""

        // Input validation
        when {
            otpMode && otp.isBlank() -> {
                error = "Please enter OTP"
                return
            }
            otpMode && otp.length != 6 -> {
                error = "OTP must be 6 digits"
                return
            }
            !otpMode && email.isBlank() -> {
                error = "Email is required"
                return
            }
            !otpMode && !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> {
                error = "Please enter a valid email address"
                return
            }
            !otpMode && password.isBlank() -> {
                error = "Password is required"
                return
            }
            !otpMode && password.length < 6 -> {
                error = "Password must be at least 6 characters"
                return
            }
            !isLogin && !otpMode && name.isBlank() -> {
                error = "Name is required"
                return
            }
            !isLogin && !otpMode && name.length < 2 -> {
                error = "Name must be at least 2 characters"
                return
            }
            !isLogin && !otpMode && phone.isBlank() -> {
                error = "Phone number is required"
                return
            }
            !isLogin && !otpMode && phone.length < 10 -> {
                error = "Phone number must be at least 10 digits"
                return
            }
        }

        scope.launch {
            loading = true
            try {
                if (otpMode) {
                    val result = AuthApiClient.api.verifyOtp(VerifyOtpRequest(email = email, otp = otp))
                    if (result.success) {
                        message = result.message ?: "OTP verified. Please login."
                        otpMode = false
                        isLogin = true
                        otp = ""
                    } else {
                        error = result.message ?: "OTP verification failed"
                    }
                } else if (isLogin) {
                    val result = AuthApiClient.api.login(LoginRequest(email = email, password = password))
                    if (result.success && !result.accessToken.isNullOrBlank() && !result.refreshToken.isNullOrBlank()) {
                        // ── Role guard ──────────────────────────────────────
                        val role = result.user?.role
                        if (role != null && role != "salon_owner") {
                            error = "This is a customer account — download Hermoso App to sign in."
                            return@launch
                        }
                        // ────────────────────────────────────────────────────
                        SessionManager.saveSession(
                            access = result.accessToken,
                            refresh = result.refreshToken,
                            name = result.user?.name,
                            role = result.user?.role
                        )
                        onLoginSuccess()
                    } else {
                        error = result.message ?: "Login failed"
                    }
                } else {
                    // Sign-up — always "salon_owner"
                    val result = AuthApiClient.api.register(
                        RegisterRequest(
                            name = name,
                            email = email,
                            phone = phone,
                            password = password,
                            role = "salon_owner"
                        )
                    )
                    if (result.success) {
                        otpMode = true
                        message = result.message ?: "OTP sent. Please verify."
                    } else {
                        error = result.message ?: "Registration failed"
                    }
                }
            } catch (t: Throwable) {
                val info = parseApiError(t)
                if (info.code == "ACCOUNT_NOT_VERIFIED") {
                    // Account exists but was never verified (e.g. signed up, then closed
                    // the app before entering the OTP). Route straight into OTP entry
                    // instead of showing a raw "not verified" error on the login form.
                    otpMode = true
                    password = ""
                    message = "Please verify your account. Enter the code sent to your email, or tap Resend OTP."
                } else {
                    error = info.message
                }
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
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Hermoso App",
                color = Color.White,
                fontSize = 42.sp,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                text = "Salon Management",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 16.sp,
                modifier = Modifier.padding(bottom = 40.dp)
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
                    Text(
                        text = if (otpMode) "Verify OTP" else if (isLogin) "Welcome Back" else "Create Account",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextDark
                    )
                    Spacer(modifier = Modifier.height(20.dp))

                    if (!isLogin && !otpMode) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Full Name *") },
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
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Address *") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = if (otpMode) ImeAction.Done else ImeAction.Next),
                        keyboardActions = KeyboardActions(
                            onDone = { if (otpMode) handleSubmit() }
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (otpMode) {
                        OutlinedTextField(
                            value = otp,
                            onValueChange = { otp = it },
                            label = { Text("OTP (6 digits)") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(
                                onDone = { handleSubmit() }
                            )
                        )
                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = { handleSubmit() },
                            enabled = !loading,
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = OwnerGold, contentColor = OwnerNavy)
                        ) {
                            Text(if (loading) "Verifying..." else "Verify OTP", fontSize = 18.sp)
                        }

                        TextButton(
                            onClick = {
                                error = ""
                                message = ""
                                scope.launch {
                                    loading = true
                                    try {
                                        val result = AuthApiClient.api.resendOtp(ResendOtpRequest(email = email))
                                        message = result.message ?: "OTP resent."
                                    } catch (t: Throwable) {
                                        error = parseApiError(t).message
                                    } finally {
                                        loading = false
                                    }
                                }
                            },
                            enabled = !loading,
                            modifier = Modifier.padding(top = 8.dp)
                        ) { Text("Resend OTP", color = OwnerGold) }
                    } else {
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = { Text("Password *") },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Icon(
                                        imageVector = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                                        contentDescription = if (passwordVisible) "Hide password" else "Show password"
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(
                                onDone = { handleSubmit() }
                            )
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = { handleSubmit() },
                            enabled = !loading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = OwnerGold, contentColor = OwnerNavy)
                        ) {
                            val text = when {
                                loading && isLogin -> "Logging in..."
                                loading && !isLogin -> "Signing up..."
                                isLogin -> "Login"
                                else -> "Sign Up"
                            }
                            Text(text, fontSize = 18.sp)
                        }
                    }

                    if (error.isNotBlank()) {
                        Text(
                            text = error,
                            color = Color(0xFFB00020),
                            modifier = Modifier.padding(top = 10.dp)
                        )
                    }
                    if (message.isNotBlank()) {
                        Text(
                            text = message,
                            color = Color(0xFF0F9D58),
                            modifier = Modifier.padding(top = 10.dp)
                        )
                    }

                    TextButton(
                        onClick = {
                            if (otpMode) {
                                otpMode = false
                                isLogin = true
                            } else {
                                isLogin = !isLogin
                            }
                            error = ""
                            message = ""
                        },
                        modifier = Modifier.padding(top = 16.dp)
                    ) {
                        Text(
                            text = if (otpMode) "Back to Login" else if (isLogin) "Don't have an account? Sign Up" else "Already have an account? Login",
                            color = TextDark
                        )
                    }
                }
            }
        }
    }
}
