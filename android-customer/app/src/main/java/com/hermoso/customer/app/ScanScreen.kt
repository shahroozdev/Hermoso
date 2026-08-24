package com.hermoso.customer.app

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.*
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.camera.core.*

import androidx.camera.core.ExperimentalGetImage
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.navigation.NavHostController
import com.hermoso.customer.ui.theme.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.math.abs

enum class LivenessStep {
    BLINK, SMILE, TURN_LEFT, COMPLETED
}

data class FaceValidationState(
    val isValid: Boolean = false,
    val message: String = "Align your face",
    val faceDetected: Boolean = false,
    val currentStep: LivenessStep = LivenessStep.BLINK
)

@androidx.annotation.OptIn(ExperimentalLayoutApi::class, ExperimentalGetImage::class)
@Composable
fun ScanScreen(navController: NavHostController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var hasPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        hasPermission = it
    }

    var validationState by remember { mutableStateOf(FaceValidationState()) }
    var loading by remember { mutableStateOf(false) }
    var scanResult by remember { mutableStateOf<ScanAnalyzeData?>(null) }
    var capturedBitmap by remember { mutableStateOf<Bitmap?>(null) }
    
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    val imageCapture = remember { ImageCapture.Builder().build() }

    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }

    LaunchedEffect(Unit) {
        if (!hasPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Color(0xFF0A0614))) {
        item {
            Column(Modifier.padding(top = 16.dp, start = 16.dp, end = 16.dp, bottom = 8.dp)) {
                Text("AI Skin Scan", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Text("Professional facial analysis & liveness check", color = Color.White.copy(alpha = 0.5f))
            }
        }

        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(400.dp)
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                if (hasPermission && capturedBitmap == null) {
                    CameraPreviewView(
                        imageCapture = imageCapture,
                        executor = cameraExecutor,
                        onFaceValidated = { state -> validationState = state },
                        currentStep = validationState.currentStep
                    )
                    
                    FaceOverlay(validationState)
                } else if (capturedBitmap != null) {
                    Box(modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(24.dp))) {
                        Image(
                            bitmap = capturedBitmap!!.asImageBitmap(),
                            contentDescription = "Captured",
                            modifier = Modifier.fillMaxSize()
                        )
                        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.4f)))
                        Column(Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = PurpleLight)
                            Spacer(Modifier.height(12.dp))
                            Text("Analyzing Skin...", color = Color.White, fontWeight = FontWeight.Medium)
                        }
                    }
                } else {
                    Box(
                        Modifier.fillMaxSize().background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(24.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Camera Permission Required", color = Color.White.copy(alpha = 0.6f))
                    }
                }
            }
        }

        item {
            Column(Modifier.padding(horizontal = 16.dp)) {
                if (capturedBitmap == null) {
                    ValidationMessageView(validationState)
                    
                    Spacer(Modifier.height(24.dp))
                    
                    Button(
                        onClick = {
                            if (validationState.currentStep == LivenessStep.COMPLETED && !loading) {
                                loading = true
                                captureAndUpload(imageCapture, cameraExecutor, scope) { bitmap, result ->
                                    capturedBitmap = bitmap
                                    scanResult = result
                                    loading = false
                                }
                            }
                        },
                        enabled = validationState.currentStep == LivenessStep.COMPLETED && !loading,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Purple,
                            disabledContainerColor = Color.White.copy(alpha = 0.12f)
                        ),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        if (loading) {
                            CircularProgressIndicator(Modifier.size(24.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("Analyze Now", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }
                } else if (scanResult != null) {
                    ResultContentWrapper(scanResult!!, onReset = {
                        capturedBitmap = null
                        scanResult = null
                        validationState = FaceValidationState()
                    }, navController)
                }
            }
        }
        
        item { Spacer(Modifier.height(32.dp)) }
    }
}

@Composable
fun ValidationMessageView(state: FaceValidationState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = if (state.isValid) Purple.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.05f)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(10.dp).clip(CircleShape)
                    .background(if (state.isValid) Color.Green else Color.Red.copy(alpha = 0.5f))
            )
            Spacer(Modifier.width(12.dp))
            Text(
                text = state.message,
                color = if (state.isValid) Color.White else Color.White.copy(alpha = 0.7f),
                fontWeight = FontWeight.Medium
            )
        }
    }
    
    if (state.faceDetected && state.currentStep != LivenessStep.COMPLETED) {
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            LivenessBadge("Blink", active = state.currentStep == LivenessStep.BLINK, done = state.currentStep > LivenessStep.BLINK)
            LivenessBadge("Smile", active = state.currentStep == LivenessStep.SMILE, done = state.currentStep > LivenessStep.SMILE)
            LivenessBadge("Turn Left", active = state.currentStep == LivenessStep.TURN_LEFT, done = state.currentStep > LivenessStep.TURN_LEFT)
        }
    }
}

@Composable
fun LivenessBadge(label: String, active: Boolean, done: Boolean) {
    val color = when {
        done -> Color.Green
        active -> PurpleLight
        else -> Color.White.copy(alpha = 0.2f)
    }
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(8.dp),
        border = if (active) BorderStroke(1.dp, color) else null
    ) {
        Text(
            label, 
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            color = color,
            fontSize = 12.sp,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Normal
        )
    }
}

@Composable
fun FaceOverlay(state: FaceValidationState) {
    val infiniteTransition = rememberInfiniteTransition(label = "scan")
    val scanAnim by infiniteTransition.animateFloat(
        initialValue = 0.1f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scan"
    )

    val borderColor = if (state.isValid) Color.Green else if (state.faceDetected) Color.Yellow else Color.White.copy(alpha = 0.3f)
    val borderThickness by animateDpAsState(if (state.isValid) 4.dp else 2.dp, label = "border")

    Box(
        modifier = Modifier
            .fillMaxSize()
            .border(borderThickness, borderColor, RoundedCornerShape(24.dp))
            .padding(borderThickness)
    ) {
        if (state.faceDetected && !state.isValid) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val y = size.height * scanAnim
                drawLine(
                    color = borderColor.copy(alpha = 0.5f),
                    start = Offset(0f, y),
                    end = Offset(size.width, y),
                    strokeWidth = 2.dp.toPx()
                )
            }
        }
    }
}

@Composable
@OptIn(ExperimentalGetImage::class)
fun CameraPreviewView(
    imageCapture: ImageCapture,
    executor: ExecutorService,
    onFaceValidated: (FaceValidationState) -> Unit,
    currentStep: LivenessStep
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }
    val currentStepState = rememberUpdatedState(currentStep)
    
    val faceDetector = remember {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .build()
        FaceDetection.getClient(options)
    }

    DisposableEffect(Unit) {
        onDispose {
            faceDetector.close()
        }
    }

    LaunchedEffect(Unit) {
        val cameraProvider = withContext(Dispatchers.IO) {
            ProcessCameraProvider.getInstance(context).get()
        }
        
        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
        }

        val imageAnalysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()

        imageAnalysis.setAnalyzer(executor) { imageProxy ->
            processImageProxy(imageProxy, faceDetector, currentStepState.value, onFaceValidated)
        }

        try {
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                CameraSelector.DEFAULT_FRONT_CAMERA,
                preview,
                imageCapture,
                imageAnalysis
            )
        } catch (e: Exception) {
            Log.e("Camera", "Use case binding failed", e)
        }
    }

    AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(24.dp)))
}

@androidx.annotation.OptIn(ExperimentalGetImage::class)
fun processImageProxy(
    imageProxy: ImageProxy,
    faceDetector: com.google.mlkit.vision.face.FaceDetector,
    currentStep: LivenessStep,
    onFaceValidated: (FaceValidationState) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        faceDetector.process(image)
            .addOnSuccessListener { faces ->
                val state = validateFace(faces, currentStep)
                onFaceValidated(state)
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    } else {
        imageProxy.close()
    }
}

fun validateFace(faces: List<Face>, currentStep: LivenessStep): FaceValidationState {
    if (faces.isEmpty()) return FaceValidationState(message = "No face detected")
    if (faces.size > 1) return FaceValidationState(message = "Only one face allowed")

    val face = faces[0]
    
    val headEulerY = face.headEulerAngleY
    val headEulerZ = face.headEulerAngleZ

    if (abs(headEulerZ) > 10) return FaceValidationState(faceDetected = true, message = "Keep your head straight")
    
    val leftEyeOpen = face.leftEyeOpenProbability ?: 0f
    val rightEyeOpen = face.rightEyeOpenProbability ?: 0f
    val smileProb = face.smilingProbability ?: 0f

    var nextStep = currentStep
    var isValid = false
    val msg: String

    when (currentStep) {
        LivenessStep.BLINK -> {
            msg = "Blink your eyes"
            if (leftEyeOpen < 0.2f && rightEyeOpen < 0.2f) {
                nextStep = LivenessStep.SMILE
            }
        }
        LivenessStep.SMILE -> {
            msg = "Now, give us a smile"
            if (smileProb > 0.7f) {
                nextStep = LivenessStep.TURN_LEFT
            }
        }
        LivenessStep.TURN_LEFT -> {
            msg = "Turn your head slightly left"
            if (headEulerY > 20) {
                nextStep = LivenessStep.COMPLETED
            }
        }
        LivenessStep.COMPLETED -> {
            isValid = true
            msg = "Face Verified! Ready to scan."
        }
    }

    return FaceValidationState(
        isValid = isValid,
        message = msg,
        faceDetected = true,
        currentStep = nextStep
    )
}

fun captureAndUpload(
    imageCapture: ImageCapture,
    executor: ExecutorService,
    scope: CoroutineScope,
    onResult: (Bitmap, ScanAnalyzeData?) -> Unit
) {
    imageCapture.takePicture(executor, object : ImageCapture.OnImageCapturedCallback() {
        override fun onCaptureSuccess(image: ImageProxy) {
            val bitmap = imageProxyToBitmap(image)
            image.close()
            
            if (bitmap != null) {
                scope.launch {
                    try {
                        val part = bitmapToJpegPart(bitmap)
                        val response = AuthApiClient.api.analyzeScan(part)
                        withContext(Dispatchers.Main) {
                            onResult(bitmap, response.data)
                        }
                    } catch (e: Exception) {
                        Log.e("Scan", "Upload failed", e)
                        withContext(Dispatchers.Main) {
                            onResult(bitmap, null)
                        }
                    }
                }
            }
        }

        override fun onError(exception: ImageCaptureException) {
            Log.e("Camera", "Capture failed", exception)
        }
    })
}

fun imageProxyToBitmap(image: ImageProxy): Bitmap? {
    val planes = image.planes
    if (planes.isEmpty()) return null
    
    val buffer = planes[0].buffer
    val bytes = ByteArray(buffer.remaining())
    buffer.get(bytes)
    
    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return null
    
    val matrix = Matrix()
    matrix.postRotate(image.imageInfo.rotationDegrees.toFloat())
    
    // For front camera, mirror the image
    matrix.postScale(-1f, 1f, bitmap.width / 2f, bitmap.height / 2f)
    
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
}

fun bitmapToJpegPart(bitmap: Bitmap): MultipartBody.Part {
    val output = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, output)
    val bytes = output.toByteArray()
    val body = bytes.toRequestBody("image/jpeg".toMediaType())
    return MultipartBody.Part.createFormData("image", "scan.jpg", body)
}

@androidx.annotation.OptIn(ExperimentalLayoutApi::class)
@Composable
fun ResultContentWrapper(data: ScanAnalyzeData, onReset: () -> Unit, navController: NavHostController) {
    ResultContent(data, onReset, navController)
}

@androidx.annotation.OptIn(ExperimentalLayoutApi::class)
@Composable
fun ResultContent(data: ScanAnalyzeData, onReset: () -> Unit, navController: NavHostController) {
    Text("Analysis Results", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
    Spacer(Modifier.height(16.dp))
    
    Text(data.summary ?: "Skin analysis complete", color = Color(0xFFD8B4FE), modifier = Modifier.padding(bottom = 16.dp))

    data.metrics?.forEach { metric ->
        MetricRow(metric.key ?: "", metric.score ?: 0, metric.label ?: "")
    }

    Spacer(Modifier.height(16.dp))
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = PurpleDark.copy(alpha = 0.45f))
    ) {
        Column(Modifier.padding(16.dp)) {
            Text("Recommended Services", color = Color(0xFFE9D5FF), fontWeight = FontWeight.Bold)
            
            @OptIn(ExperimentalLayoutApi::class)
            val flowRowModifier = Modifier.padding(top = 12.dp)
            RecommendedServicesList(data.recommendedServices)
        }
    }
    
    Spacer(Modifier.height(24.dp))
    
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedButton(
            onClick = onReset,
            modifier = Modifier.weight(1f).height(50.dp),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
        ) {
            Text("Retake", color = Color.White)
        }
        Button(
            onClick = { navController.navigate(Dest.Recs) },
            modifier = Modifier.weight(1f).height(50.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PurpleLight)
        ) {
            Text("View Full Plan", fontWeight = FontWeight.Bold)
        }
    }
}

@kotlin.OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun RecommendedServicesList(services: List<ServiceDto>?) {
    FlowRow(
        modifier = Modifier.padding(top = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        services?.forEach { service ->
            Text(
                service.name ?: "",
                modifier = Modifier
                    .background(Purple.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                color = Color(0xFFD8B4FE),
                fontSize = 14.sp
            )
        }
    }
}

@Composable
fun MetricRow(name: String, value: Int, level: String) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(name, color = Color.White, modifier = Modifier.weight(1.2f), fontSize = 14.sp)
            Box(Modifier.weight(2f).height(8.dp).background(Color.White.copy(alpha = 0.1f), CircleShape)) {
                Box(Modifier.fillMaxWidth((value.coerceIn(0, 100)) / 100f).fillMaxSize().background(
                    Brush.horizontalGradient(listOf(PurpleLight, Color.Magenta)), CircleShape
                ))
            }
            Spacer(Modifier.width(12.dp))
            Text(level, color = Color(0xFFD8B4FE), fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}
