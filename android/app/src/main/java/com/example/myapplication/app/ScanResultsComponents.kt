package com.example.myapplication.app

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.ui.theme.*

/**
 * CR-07: Overall Skin Score Ring
 * Circular animated score display (0-100)
 */
@Composable
fun OverallSkinScoreRing(
    score: Int,
    modifier: Modifier = Modifier
) {
    val animatedScore by animateIntAsState(
        targetValue = score,
        animationSpec = tween(1500, easing = EaseOutQuad),
        label = "score_animation"
    )

    val density = LocalDensity.current
    val radialRadius = with(density) { 120.dp.toPx() }

    Box(
        modifier = modifier
            .size(200.dp)
            .background(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.1f),
                        Color.White.copy(alpha = 0.05f)
                    ),
                    radius = radialRadius
                ),
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val radius = size.minDimension / 2 - 8.dp.toPx()

            // Background circle
            drawCircle(
                color = Color.White.copy(alpha = 0.1f),
                radius = radius
            )

            // Progress arc
            val sweepAngle = (animatedScore / 100f) * 360f
            val scoreColor = when {
                animatedScore >= 80 -> Color.Green
                animatedScore >= 60 -> Color(0xFF4CAF50)
                animatedScore >= 40 -> Color(0xFFFF9800)
                else -> Color(0xFFFF5722)
            }

            drawArc(
                color = scoreColor,
                startAngle = -90f,
                sweepAngle = sweepAngle,
                useCenter = false,
                style = Stroke(width = 8.dp.toPx())
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                "$animatedScore",
                fontSize = 64.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                "Overall Score",
                fontSize = 12.sp,
                color = Color.White.copy(alpha = 0.6f)
            )
        }
    }
}

/**
 * CR-08: Skin Tone & Tanning Section
 */
@Composable
fun SkinToneSection(data: SkinToneDto?) {
    if (data == null) return

    AnalysisSection(title = "Skin Tone & Tanning") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricRow(
                label = "Detected Tone",
                value = data.tone ?: "Unknown",
                isText = true
            )
            MetricRow(
                label = "Evenness",
                value = "${data.evenness}%"
            )
            MetricRow(
                label = "Severity",
                value = "${data.severity}%"
            )

            if (!data.tanningPattern.isNullOrEmpty()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Color.White.copy(alpha = 0.05f),
                            RoundedCornerShape(8.dp)
                        ),
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent)
                ) {
                    Column(Modifier.padding(12.dp)) {
                        Text(
                            "Tanning Pattern",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 12.sp
                        )
                        Text(
                            data.tanningPattern,
                            color = Color.White,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            }

            TreatmentRecommendations(treatments = data.recommendedTreatments)
        }
    }
}

/**
 * CR-09: Eyebrow Assessment
 */
@Composable
fun EyebrowAssessmentSection(data: EyebrowAssessmentDto?) {
    if (data == null) return

    AnalysisSection(title = "Eyebrow Assessment") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricRow(
                label = "Arch Shape",
                value = data.archShape ?: "Natural",
                isText = true
            )
            MetricRow(
                label = "Fullness",
                value = "${data.fullness}/5"
            )
            MetricRow(
                label = "Left-Right Symmetry",
                value = "${data.leftRightSymmetry}%"
            )
            MetricRow(
                label = "Tail Length",
                value = data.tailLength ?: "Medium",
                isText = true
            )

            TreatmentRecommendations(treatments = data.recommendedTreatments)
        }
    }
}

/**
 * CR-10: Hydration & Texture
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HydrationSection(data: HydrationDto?) {
    if (data == null) return

    AnalysisSection(title = "Hydration & Texture") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricRow(
                label = "Hydration Level",
                value = "${data.hydrationPercent}%"
            )
            MetricRow(
                label = "Texture Rating",
                value = "${data.textureRating}%"
            )

            if (!data.dehydrationZones.isNullOrEmpty()) {
                Text(
                    "Dehydration Zones",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                FlowRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    data.dehydrationZones.forEach { zone ->
                        Surface(
                            color = Color.Yellow.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                zone,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                color = Color(0xFFFFD700),
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            if (!data.poreCondition.isNullOrEmpty()) {
                Text(
                    data.poreCondition,
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 13.sp,
                    modifier = Modifier
                        .background(
                            Color.White.copy(alpha = 0.05f),
                            RoundedCornerShape(8.dp)
                        )
                        .padding(12.dp)
                )
            }

            TreatmentRecommendations(treatments = data.recommendedTreatments)
        }
    }
}

/**
 * CR-11: Dark Circles & Under-Eye
 */
@Composable
fun DarkCirclesSection(data: DarkCirclesDto?) {
    if (data == null) return

    AnalysisSection(title = "Dark Circles & Under-Eye") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            // Type classification
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = when (data.type) {
                        1 -> Color(0xFF8B4513).copy(alpha = 0.15f)
                        2 -> Color(0xFF4169E1).copy(alpha = 0.15f)
                        3 -> Color(0xFF2F4F4F).copy(alpha = 0.15f)
                        else -> Color.White.copy(alpha = 0.05f)
                    }
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Column(Modifier.padding(12.dp)) {
                    Text(
                        "Type Classification",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 12.sp
                    )
                    Text(
                        when (data.type) {
                            1 -> "Type 1: Pigmentation (Brownish)"
                            2 -> "Type 2: Vascular (Bluish/Purplish)"
                            3 -> "Type 3: Structural (Sunken)"
                            else -> "Unknown Type"
                        },
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            MetricRow(
                label = "Severity",
                value = data.severity?.uppercase() ?: "Unknown"
            )
            MetricRow(
                label = "Color Delta",
                value = "${data.colorDelta}",
                isText = true
            )

            TreatmentRecommendations(treatments = data.recommendedTreatments)
        }
    }
}

/**
 * CR-12: Acne & Breakout Zones
 */
@Composable
fun AcneAnalysisSection(data: AcneAnalysisDto?) {
    if (data == null) return

    AnalysisSection(title = "Acne & Breakout Zones") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricRow(
                label = "Overall Severity",
                value = "${data.overallSeverity}%"
            )

            if (!data.zones.isNullOrEmpty()) {
                Text(
                    "Affected Zones",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                data.zones.forEach { zone ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Color.Red.copy(alpha = 0.1f),
                                RoundedCornerShape(8.dp)
                            ),
                        color = Color.Transparent
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(
                                    zone.area?.uppercase() ?: "Unknown",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                                Text(
                                    "${zone.type?.capitalize()} · Severity ${zone.severity}%",
                                    color = Color.White.copy(alpha = 0.6f),
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }

            TreatmentRecommendations(treatments = data.recommendedTreatments)
        }
    }
}

/**
 * CR-13: Lip Pigmentation
 */
@Composable
fun LipPigmentationSection(data: LipPigmentationDto?) {
    if (data == null) return

    AnalysisSection(title = "Lip Pigmentation") {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricRow(
                label = "Melanin Index",
                value = "${data.melaninIndex}%"
            )
            MetricRow(
                label = "Darkness Level",
                value = data.darknessLevel?.uppercase() ?: "Unknown"
            )
            MetricRow(
                label = "Unevenness",
                value = "${data.unevenness}%"
            )
            MetricRow(
                label = "Dryness Level",
                value = "${data.drynessLevel}%"
            )

            TreatmentRecommendations(treatments = data.recommendedTreatments)
        }
    }
}

/**
 * CR-14: AI Treatment Priority Plan (3-step)
 */
@Composable
fun TreatmentPriorityPlanSection(treatments: List<TreatmentPlanDto>?) {
    if (treatments.isNullOrEmpty()) return

    AnalysisSection(title = "Treatment Priority Plan") {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            treatments.take(3).forEachIndexed { index, treatment ->
                TreatmentPriorityCard(
                    priority = index + 1,
                    treatment = treatment
                )
            }
        }
    }
}

@Composable
fun TreatmentPriorityCard(priority: Int, treatment: TreatmentPlanDto?) {
    if (treatment == null) return

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when (priority) {
                1 -> Color(0xFFFFD700).copy(alpha = 0.1f)
                2 -> Color(0xFFC0C0C0).copy(alpha = 0.1f)
                else -> Color(0xFFCD7F32).copy(alpha = 0.1f)
            }
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Priority ${priority.toRoman()}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = when (priority) {
                        1 -> Color(0xFFFFD700)
                        2 -> Color(0xFFC0C0C0)
                        else -> Color(0xFFCD7F32)
                    }
                )
                Text(
                    treatment.treatmentName ?: "Treatment",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Color.White,
                    modifier = Modifier.weight(1f).padding(start = 12.dp)
                )
            }

            Text(
                treatment.reason ?: "",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 8.dp)
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "PKR ${treatment.pkrPriceRange ?: "N/A"}",
                    color = Color(0xFF81C784),
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
                Text(
                    "${treatment.estimatedDuration ?: "N/A"}",
                    color = Color.White.copy(alpha = 0.6f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

/**
 * CR-15: Diet & Nutrition Plan
 */
@Composable
fun DietNutritionSection(data: DietPlanDto?) {
    if (data == null) return

    AnalysisSection(title = "Diet & Nutrition Plan") {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Daily water intake
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF1976D2).copy(alpha = 0.15f)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("💧", fontSize = 24.sp)
                    Column {
                        Text(
                            "Daily Water Intake",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 12.sp
                        )
                        Text(
                            data.dailyWaterIntake ?: "8-10 glasses",
                            color = Color(0xFF81D4FA),
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // Foods to eat
            if (!data.foodsToEat.isNullOrEmpty()) {
                Text(
                    "Foods to Eat",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color.White
                )
                data.foodsToEat.forEach { item ->
                    DietItemRow(
                        food = item.food ?: "",
                        reason = item.reason ?: "",
                        isRecommended = true
                    )
                }
            }

            // Foods to avoid
            if (!data.foodsToAvoid.isNullOrEmpty()) {
                Text(
                    "Foods to Avoid",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color.White,
                    modifier = Modifier.padding(top = 12.dp)
                )
                data.foodsToAvoid.forEach { item ->
                    DietItemRow(
                        food = item.food ?: "",
                        reason = item.reason ?: "",
                        isRecommended = false
                    )
                }
            }
        }
    }
}

@Composable
fun DietItemRow(food: String, reason: String, isRecommended: Boolean) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        color = if (isRecommended) Color.Green.copy(alpha = 0.1f) else Color.Red.copy(alpha = 0.1f),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(
                food,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = if (isRecommended) Color(0xFF81C784) else Color(0xFFE57373)
            )
            Text(
                reason,
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.6f),
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

/**
 * Helper Components
 */
@Composable
fun AnalysisSection(
    title: String,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.05f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                title,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = Color.White,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            content()
        }
    }
}

@Composable
fun MetricRow(label: String, value: String, isText: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Color.White.copy(alpha = 0.02f),
                RoundedCornerShape(8.dp)
            )
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            label,
            color = Color.White.copy(alpha = 0.7f),
            fontSize = 13.sp
        )
        if (isText) {
            Text(
                value,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
        } else {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(6.dp)
                    .background(
                        Color.White.copy(alpha = 0.1f),
                        RoundedCornerShape(3.dp)
                    )
                    .padding(horizontal = 12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(value.replace("%", "").toFloatOrNull()?.div(100f) ?: 0.5f)
                        .fillMaxHeight()
                        .background(
                            Brush.horizontalGradient(
                                listOf(PurpleLight, Color(0xFFBB86FC))
                            ),
                            RoundedCornerShape(3.dp)
                        )
                )
            }
            Text(
                value,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                modifier = Modifier.width(50.dp)
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TreatmentRecommendations(treatments: List<String>?) {
    if (treatments.isNullOrEmpty()) return

    Text(
        "Recommended Treatments",
        color = Color.White.copy(alpha = 0.7f),
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold
    )

    FlowRow(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        treatments.forEach { treatment ->
            Surface(
                color = PurpleLight.copy(alpha = 0.15f),
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    treatment,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    color = Color(0xFFD8B4FE),
                    fontSize = 12.sp
                )
            }
        }
    }
}

// Helper function to convert number to Roman numerals
fun Int.toRoman(): String = when (this) {
    1 -> "I"
    2 -> "II"
    3 -> "III"
    else -> "$this"
}
