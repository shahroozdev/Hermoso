package com.example.myapplication.app

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.mlkit.vision.face.Face
import com.example.myapplication.ui.theme.*

/**
 * CR-01: Face Detection Overlay with 8 Detection Points
 *
 * Displays face landmarks as 8 detection points:
 * 1. Forehead
 * 2. Left Eye
 * 3. Right Eye
 * 4. Nose
 * 5. Left Cheek
 * 6. Right Cheek
 * 7. Chin
 * 8. Lips
 */
@Composable
fun FaceDetectionPointsOverlay(
    faces: List<Face>,
    canvasWidth: Float,
    canvasHeight: Float,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.fillMaxSize()) {
        if (faces.isNotEmpty()) {
            val face = faces[0]

            // Get face landmarks
            val leftEye = face.getLandmark(com.google.mlkit.vision.face.FaceLandmark.LEFT_EYE)
            val rightEye = face.getLandmark(com.google.mlkit.vision.face.FaceLandmark.RIGHT_EYE)
            val nose = face.getLandmark(com.google.mlkit.vision.face.FaceLandmark.NOSE)
            val leftMouth = face.getLandmark(com.google.mlkit.vision.face.FaceLandmark.LEFT_MOUTH)
            val rightMouth = face.getLandmark(com.google.mlkit.vision.face.FaceLandmark.RIGHT_MOUTH)
            val leftEar = face.getLandmark(com.google.mlkit.vision.face.FaceLandmark.LEFT_EAR)
            val rightEar = face.getLandmark(com.google.mlkit.vision.face.FaceLandmark.RIGHT_EAR)

            // Face bounding box
            val boundingBox = face.boundingBox

            // Calculate detection points
            val detectionPoints = listOf(
                // 1. Forehead (top center of face)
                Offset(boundingBox.centerX(), boundingBox.top + 20),
                // 2. Left Eye
                leftEye?.position ?: Offset(boundingBox.left + 30, boundingBox.top + 50),
                // 3. Right Eye
                rightEye?.position ?: Offset(boundingBox.right - 30, boundingBox.top + 50),
                // 4. Nose
                nose?.position ?: Offset(boundingBox.centerX(), boundingBox.centerY()),
                // 5. Left Cheek
                Offset(boundingBox.left + 20, boundingBox.centerY() + 30),
                // 6. Right Cheek
                Offset(boundingBox.right - 20, boundingBox.centerY() + 30),
                // 7. Chin
                Offset(boundingBox.centerX(), boundingBox.bottom - 20),
                // 8. Lips (average of mouth corners)
                Offset(
                    ((leftMouth?.position?.x ?: boundingBox.centerX()) +
                     (rightMouth?.position?.x ?: boundingBox.centerX())) / 2,
                    ((leftMouth?.position?.y ?: boundingBox.centerY()) +
                     (rightMouth?.position?.y ?: boundingBox.centerY())) / 2
                )
            )

            // Draw detection points
            detectionPoints.forEach { point ->
                // Outer circle (glow effect)
                drawCircle(
                    color = PurpleLight.copy(alpha = 0.3f),
                    radius = 12.dp.toPx(),
                    center = point
                )

                // Inner circle (solid point)
                drawCircle(
                    color = PurpleLight,
                    radius = 6.dp.toPx(),
                    center = point
                )

                // Center dot
                drawCircle(
                    color = Color.White,
                    radius = 2.dp.toPx(),
                    center = point
                )
            }

            // Draw connecting lines between points for visualization
            // Eyes line
            drawLine(
                color = PurpleLight.copy(alpha = 0.2f),
                start = detectionPoints[1],
                end = detectionPoints[2],
                strokeWidth = 1.dp.toPx()
            )

            // Left side contour (left eye -> left cheek -> chin)
            drawLine(
                color = PurpleLight.copy(alpha = 0.2f),
                start = detectionPoints[1],
                end = detectionPoints[4],
                strokeWidth = 1.dp.toPx()
            )
            drawLine(
                color = PurpleLight.copy(alpha = 0.2f),
                start = detectionPoints[4],
                end = detectionPoints[6],
                strokeWidth = 1.dp.toPx()
            )

            // Right side contour (right eye -> right cheek -> chin)
            drawLine(
                color = PurpleLight.copy(alpha = 0.2f),
                start = detectionPoints[2],
                end = detectionPoints[5],
                strokeWidth = 1.dp.toPx()
            )
            drawLine(
                color = PurpleLight.copy(alpha = 0.2f),
                start = detectionPoints[5],
                end = detectionPoints[6],
                strokeWidth = 1.dp.toPx()
            )
        }
    }
}

/**
 * CR-02: Live Scan Progress Checklist
 *
 * Shows 8 analysis categories with 3 states:
 * - Waiting (not started)
 * - Scanning (in progress with animation)
 * - Done (completed)
 */
data class AnalysisCategory(
    val id: String,
    val name: String,
    val icon: String,
    val state: AnalysisState // Waiting, Scanning, Done
)

enum class AnalysisState {
    WAITING, SCANNING, DONE
}

@Composable
fun ScanProgressChecklist(
    categories: List<AnalysisCategory>,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "scan_progress")
    val animatedAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "progress_alpha"
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            "Analysis Progress",
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )

        categories.forEach { category ->
            AnalysisCategoryItem(
                category = category,
                animatedAlpha = if (category.state == AnalysisState.SCANNING) animatedAlpha else 1f
            )
        }
    }
}

@Composable
fun AnalysisCategoryItem(
    category: AnalysisCategory,
    animatedAlpha: Float
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = when (category.state) {
                    AnalysisState.DONE -> Color.Green.copy(alpha = 0.1f)
                    AnalysisState.SCANNING -> PurpleLight.copy(alpha = 0.1f * animatedAlpha)
                    AnalysisState.WAITING -> Color.White.copy(alpha = 0.05f)
                },
                shape = RoundedCornerShape(8.dp)
            )
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // State indicator
        Box(
            modifier = Modifier
                .size(24.dp)
                .background(
                    color = when (category.state) {
                        AnalysisState.DONE -> Color.Green
                        AnalysisState.SCANNING -> PurpleLight
                        AnalysisState.WAITING -> Color.White.copy(alpha = 0.2f)
                    },
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            when (category.state) {
                AnalysisState.DONE -> Text("✓", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                AnalysisState.SCANNING -> Text("●", color = Color.White, fontSize = 10.sp)
                AnalysisState.WAITING -> Text("", color = Color.White, fontSize = 10.sp)
            }
        }

        // Category name
        Column(modifier = Modifier.weight(1f)) {
            Text(
                category.name,
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = if (category.state == AnalysisState.SCANNING) FontWeight.Bold else FontWeight.Normal
            )
            if (category.state == AnalysisState.SCANNING) {
                Text(
                    "Analyzing...",
                    color = PurpleLight.copy(alpha = animatedAlpha),
                    fontSize = 11.sp
                )
            }
        }
    }
}

/**
 * CR-04: Real-time Progress Percentage Counter
 */
@Composable
fun ScanProgressPercentage(
    progress: Int, // 0-100
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(
                color = if (progress >= 75) Color.Green.copy(alpha = 0.15f)
                else if (progress >= 50) PurpleLight.copy(alpha = 0.15f)
                else Color.White.copy(alpha = 0.05f),
                shape = CircleShape
            )
            .size(80.dp),
        contentAlignment = Alignment.Center
    ) {
        // Circular progress background
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                color = Color.White.copy(alpha = 0.1f),
                radius = size.minDimension / 2
            )

            // Progress arc
            drawArc(
                color = when {
                    progress >= 75 -> Color.Green
                    progress >= 50 -> PurpleLight
                    else -> Color(0xFFFF9800)
                },
                startAngle = -90f,
                sweepAngle = (progress / 100f) * 360f,
                useCenter = false,
                style = Stroke(width = 4.dp.toPx())
            )
        }

        // Percentage text
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                "$progress%",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Complete",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 10.sp
            )
        }
    }
}

/**
 * CR-03: Scan Beam Animation (Enhanced)
 *
 * Animated gradient sweep from top to bottom across the face overlay
 */
@Composable
fun EnhancedScanBeamAnimation(modifier: Modifier = Modifier) {
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

    Canvas(modifier = modifier.fillMaxSize()) {
        val beamY = size.height * beamPosition
        val beamHeight = 80.dp.toPx()

        // Draw gradient sweep beam
        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(
                    Color.Transparent,
                    PurpleLight.copy(alpha = 0.5f),
                    PurpleLight.copy(alpha = 0.8f),
                    PurpleLight.copy(alpha = 0.5f),
                    Color.Transparent
                ),
                startY = beamY - beamHeight,
                endY = beamY + beamHeight
            ),
            left = 0f,
            top = beamY - beamHeight,
            right = size.width,
            bottom = beamY + beamHeight
        )
    }
}

/**
 * Integrated Camera Screen with All Enhancements
 * CR-01, CR-02, CR-03, CR-04, CR-06
 */
@Composable
fun EnhancedCameraScreenContent(
    faces: List<Face>,
    scanProgress: Int, // 0-100
    analysisCategories: List<AnalysisCategory>,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Camera preview goes here (from existing CameraPreviewView)

        // Face detection overlay with 8 points
        FaceDetectionPointsOverlay(
            faces = faces,
            canvasWidth = 400f,
            canvasHeight = 400f
        )

        // Scan beam animation
        EnhancedScanBeamAnimation()

        // Real-time progress percentage (top-right)
        ScanProgressPercentage(
            progress = scanProgress,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
        )

        // Live scan progress checklist (bottom-left)
        ScanProgressChecklist(
            categories = analysisCategories,
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
                .widthIn(max = 300.dp)
        )
    }
}
