@file:OptIn(ExperimentalPermissionsApi::class)

package com.example.myapplication.app

import android.Manifest
import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonChecked
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.accompanist.permissions.shouldShowRationale
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import kotlin.math.cos
import kotlin.math.sin

// CR-01: Face Detection Overlay with 8 detection points
@Composable
fun ScanCameraScreen(
    onScanComplete: (ByteArray) -> Unit,
    onBack: () -> Unit
) {
    // CR-06: Camera permission handling
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)

    LaunchedEffect(Unit) {
        if (!cameraPermissionState.status.isGranted) {
            cameraPermissionState.launchPermissionRequest()
        }
    }

    when {
        cameraPermissionState.status.isGranted -> {
            CameraScreenContent(onScanComplete = onScanComplete, onBack = onBack)
        }
        cameraPermissionState.status.shouldShowRationale -> {
            CameraPermissionRationale(onRequestPermission = { cameraPermissionState.launchPermissionRequest() })
        }
        else -> {
            CameraPermissionDenied(onBack = onBack)
        }
    }
}

@Composable
private fun CameraScreenContent(
    onScanComplete: (ByteArray) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()

    // State for face detection and scan progress
    var isFaceDetected by remember { mutableStateOf(false) }
    var faceInFrame by remember { mutableStateOf(false) }
    var isScanning by remember { mutableStateOf(false) }
    var scanProgress by remember { mutableFloatStateOf(0f) }

    // CR-02: Live scan progress checklist with 8 categories
    var progressList by remember {
        mutableStateOf(ScanCategory.entries.map { ScanProgress(it, ScanState.PENDING) })
    }

    // CR-03: Scan beam animation
    val infiniteTransition = rememberInfiniteTransition(label = "scan_beam")
    val beamPosition by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "beam_position"
    )

    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    // Face detector
    val faceDetector = remember {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .build()
        FaceDetection.getClient(options)
    }

    // Start scanning when face is detected
    LaunchedEffect(faceInFrame) {
        if (faceInFrame && !isScanning) {
            isScanning = true
            // Simulate scan progress
            for (i in 0..100) {
                delay(50)
                scanProgress = i / 100f

                // Update progress list as scan progresses
                val categoryIndex = (i / 12.5f).toInt().coerceIn(0, 7)
                progressList = progressList.mapIndexed { index, item ->
                    when {
                        index < categoryIndex -> item.copy(state = ScanState.COMPLETED)
                        index == categoryIndex -> item.copy(state = ScanState.IN_PROGRESS)
                        else -> item
                    }
                }
            }

            // Mark all as completed
            progressList = progressList.map { it.copy(state = ScanState.COMPLETED) }

            // Capture and send image
            delay(500)
            // TODO: Capture actual image from camera
            val dummyBytes = ByteArray(0)
            onScanComplete(dummyBytes)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        // Camera preview
        AndroidView(
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val cameraProvider = cameraProviderFuture.get()

                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { analysis ->
                        analysis.setAnalyzer(ContextCompat.getMainExecutor(ctx)) { imageProxy ->
                            processImageForFaceDetection(imageProxy, faceDetector) { detected ->
                                isFaceDetected = detected
                                faceInFrame = detected
                            }
                        }
                    }

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_FRONT_CAMERA,
                        preview,
                        imageAnalysis
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                }

                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // CR-01: Face oval overlay with 8 detection points
        Canvas(modifier = Modifier.fillMaxSize()) {
            val centerX = size.width / 2
            val centerY = size.height / 2.5f
            val ovalWidth = size.width * 0.7f
            val ovalHeight = size.height * 0.5f

            // Draw oval guide
            drawOval(
                color = if (faceInFrame) Color.Green else Color.White,
                topLeft = Offset(centerX - ovalWidth / 2, centerY - ovalHeight / 2),
                size = Size(ovalWidth, ovalHeight),
                style = Stroke(width = 3f)
            )

            // Draw 8 detection points around the oval
            val points = listOf(
                Pair(0f, "Top"), // Top
                Pair(45f, "Top Right"), // Top right
                Pair(90f, "Right"), // Right
                Pair(135f, "Bottom Right"), // Bottom right
                Pair(180f, "Bottom"), // Bottom
                Pair(225f, "Bottom Left"), // Bottom left
                Pair(270f, "Left"), // Left
                Pair(315f, "Top Left") // Top left
            )

            points.forEach { (angle, _) ->
                val radian = Math.toRadians(angle.toDouble())
                val x = centerX + (ovalWidth / 2 * cos(radian)).toFloat()
                val y = centerY + (ovalHeight / 2 * sin(radian)).toFloat()

                drawCircle(
                    color = if (faceInFrame) Color.Green else Color.White,
                    radius = 8f,
                    center = Offset(x, y)
                )
            }

            // CR-03: Scan beam animation (only when scanning)
            if (isScanning) {
                val beamY = centerY - ovalHeight / 2 + (ovalHeight * beamPosition)
                val gradient = Brush.verticalGradient(
                    colors = listOf(
                        Color.Transparent,
                        Color.Cyan.copy(alpha = 0.5f),
                        Color.Transparent
                    ),
                    startY = beamY - 20f,
                    endY = beamY + 20f
                )

                drawRect(
                    brush = gradient,
                    topLeft = Offset(centerX - ovalWidth / 2, beamY - 20f),
                    size = Size(ovalWidth, 40f)
                )
            }
        }

        // Top instruction text
        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 48.dp)
                .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = if (!faceInFrame) "Position your face in the oval" else if (isScanning) "Scanning..." else "Hold still",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold
            )

            // CR-04: Real-time progress percentage
            if (isScanning) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${(scanProgress * 100).toInt()}%",
                    color = Color.Cyan,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // CR-02: Live scan progress checklist
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(Color.Black.copy(alpha = 0.8f))
                .padding(16.dp)
        ) {
            Text(
                text = "Scan Progress",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            progressList.take(4).forEach { item ->
                ScanProgressItem(item)
                Spacer(modifier = Modifier.height(6.dp))
            }
        }

        // Back button
        IconButton(
            onClick = onBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp)
                .background(Color.Black.copy(alpha = 0.5f), CircleShape)
        ) {
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = "Back",
                tint = Color.White
            )
        }
    }
}

@Composable
private fun ScanProgressItem(progress: ScanProgress) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Icon(
            imageVector = when (progress.state) {
                ScanState.COMPLETED -> Icons.Default.CheckCircle
                ScanState.IN_PROGRESS -> Icons.Default.RadioButtonChecked
                ScanState.PENDING -> Icons.Default.RadioButtonUnchecked
            },
            contentDescription = null,
            tint = when (progress.state) {
                ScanState.COMPLETED -> Color.Green
                ScanState.IN_PROGRESS -> Color.Cyan
                ScanState.PENDING -> Color.Gray
            },
            modifier = Modifier.size(20.dp)
        )

        Spacer(modifier = Modifier.width(8.dp))

        Text(
            text = progress.category.displayName,
            color = when (progress.state) {
                ScanState.COMPLETED -> Color.White
                ScanState.IN_PROGRESS -> Color.Cyan
                ScanState.PENDING -> Color.Gray
            },
            fontSize = 13.sp
        )
    }
}

// CR-06: Camera permission rationale
@Composable
private fun CameraPermissionRationale(onRequestPermission: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Camera Access Required",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "The AI Skin Scan feature needs camera access to analyze your skin. Your photo is processed securely and deleted after analysis.",
            fontSize = 16.sp,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onRequestPermission,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Grant Camera Permission")
        }
    }
}

@Composable
private fun CameraPermissionDenied(onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Camera Permission Denied",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Please enable camera permission in your device settings to use the AI Skin Scan feature.",
            fontSize = 16.sp,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Go Back")
        }
    }
}

private fun processImageForFaceDetection(
    imageProxy: ImageProxy,
    detector: com.google.mlkit.vision.face.FaceDetector,
    onResult: (Boolean) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        detector.process(image)
            .addOnSuccessListener { faces ->
                onResult(faces.isNotEmpty())
            }
            .addOnFailureListener { e ->
                e.printStackTrace()
                onResult(false)
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    } else {
        imageProxy.close()
    }
}
