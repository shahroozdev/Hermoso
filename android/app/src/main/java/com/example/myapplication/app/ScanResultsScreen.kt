package com.example.myapplication.app

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.ui.theme.*

// CR-07 through CR-17: Comprehensive scan results screen
@Composable
fun ScanResultsScreen(
    scanResult: ScanResult,
    onViewMatchedSalons: () -> Unit,
    onReScan: () -> Unit,
    onShare: () -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Skin Analysis Report") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    // CR-16: Share button
                    IconButton(onClick = onShare) {
                        Icon(Icons.Default.Share, "Share Report")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // CR-07: Overall skin score ring with animation
            item {
                OverallScoreCard(score = scanResult.overallSkinScore)
            }

            // Summary
            if (scanResult.summary.isNotBlank()) {
                item {
                    SummaryCard(summary = scanResult.summary)
                }
            }

            // CR-08: Skin Tone & Tanning
            item {
                SkinToneCard(skinTone = scanResult.skinTone)
            }

            // CR-09: Eyebrow Assessment
            scanResult.eyebrows?.let { eyebrows ->
                item {
                    EyebrowCard(eyebrows = eyebrows)
                }
            }

            // CR-10: Hydration & Texture
            item {
                HydrationCard(hydration = scanResult.hydration)
            }

            // CR-11: Dark Circles & Under-Eye
            item {
                DarkCirclesCard(darkCircles = scanResult.darkCircles)
            }

            // CR-12: Acne & Breakout Zones
            item {
                AcneCard(acne = scanResult.acne)
            }

            // CR-13: Lip Pigmentation
            item {
                LipPigmentationCard(lipPigmentation = scanResult.lipPigmentation)
            }

            // CR-14: AI Treatment Priority Plan
            if (scanResult.treatmentPlan.isNotEmpty()) {
                item {
                    TreatmentPlanCard(treatmentPlan = scanResult.treatmentPlan)
                }
            }

            // CR-15: Diet & Nutrition Plan
            item {
                DietPlanCard(dietPlan = scanResult.dietPlan)
            }

            // Action buttons
            item {
                ActionButtons(
                    onViewMatchedSalons = onViewMatchedSalons,
                    onReScan = onReScan
                )
            }
        }
    }
}

// CR-07: Overall skin score ring with animation
@Composable
private fun OverallScoreCard(score: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Overall Skin Health Score",
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Animated circular score indicator
            ScoreRing(score = score, size = 140.dp)
        }
    }
}

@Composable
private fun ScoreRing(score: Int, size: androidx.compose.ui.unit.Dp) {
    val animatedScore by animateFloatAsState(
        targetValue = score / 100f,
        animationSpec = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
        label = "score_animation"
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.size(size)
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val strokeWidth = 16.dp.toPx()
            val radius = (size.toPx() - strokeWidth) / 2

            // Background circle
            drawCircle(
                color = Color.Gray.copy(alpha = 0.2f),
                radius = radius,
                style = Stroke(width = strokeWidth)
            )

            // Score arc
            val sweepAngle = 360f * animatedScore
            val color = when {
                score >= 75 -> Color(0xFF10B981)
                score >= 50 -> Color(0xFFF59E0B)
                else -> Color(0xFFEF4444)
            }

            drawArc(
                color = color,
                startAngle = -90f,
                sweepAngle = sweepAngle,
                useCenter = false,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                size = Size(radius * 2, radius * 2),
                topLeft = Offset(
                    (size.toPx() - radius * 2) / 2,
                    (size.toPx() - radius * 2) / 2
                )
            )
        }

        Text(
            text = score.toString(),
            fontSize = 42.sp,
            fontWeight = FontWeight.Bold,
            color = when {
                score >= 75 -> Color(0xFF10B981)
                score >= 50 -> Color(0xFFF59E0B)
                else -> Color(0xFFEF4444)
            }
        )
    }
}

@Composable
private fun SummaryCard(summary: String) {
    ResultCard(title = "Summary") {
        Text(text = summary, fontSize = 14.sp, lineHeight = 20.sp)
    }
}

// CR-08: Skin Tone & Tanning
@Composable
private fun SkinToneCard(skinTone: SkinToneResult) {
    ResultCard(title = "Skin Tone & Tanning") {
        MetricRow(label = "Detected Tone", value = skinTone.tone.capitalize())

        ProgressBar(
            label = "Evenness",
            value = skinTone.evenness,
            color = Color(0xFFA855F7)
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Tanning Pattern",
            fontSize = 12.sp,
            color = Color.Gray
        )
        Text(
            text = skinTone.tanningPattern,
            fontSize = 14.sp,
            modifier = Modifier.padding(top = 4.dp)
        )

        if (skinTone.recommendedTreatments.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            TreatmentTags(treatments = skinTone.recommendedTreatments)
        }
    }
}

// CR-09: Eyebrow Assessment
@Composable
private fun EyebrowCard(eyebrows: EyebrowResult) {
    ResultCard(title = "Eyebrow Assessment") {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                MetricRow(label = "Arch Shape", value = eyebrows.archShape.capitalize())
            }
            Column(modifier = Modifier.weight(1f)) {
                MetricRow(label = "Fullness", value = "${eyebrows.fullness}/5")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                ProgressBar(
                    label = "Symmetry",
                    value = eyebrows.leftRightSymmetry,
                    color = Color(0xFF3B82F6)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                MetricRow(label = "Tail Length", value = eyebrows.tailLength.capitalize())
            }
        }

        if (eyebrows.recommendedTreatments.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            TreatmentTags(treatments = eyebrows.recommendedTreatments)
        }
    }
}

// CR-10: Hydration & Texture
@Composable
private fun HydrationCard(hydration: HydrationResult) {
    ResultCard(title = "Hydration & Texture") {
        ProgressBar(
            label = "Hydration Level",
            value = hydration.hydrationPercent,
            color = Color(0xFF0EA5E9)
        )

        Spacer(modifier = Modifier.height(12.dp))

        ProgressBar(
            label = "Texture Rating",
            value = hydration.textureRating,
            color = Color(0xFF10B981)
        )

        if (hydration.dehydrationZones.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Dehydration Zones: ${hydration.dehydrationZones.joinToString(", ").capitalize()}",
                fontSize = 13.sp
            )
        }

        if (hydration.poreCondition.isNotBlank()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Pores: ${hydration.poreCondition}",
                fontSize = 13.sp
            )
        }

        if (hydration.recommendedTreatments.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            TreatmentTags(treatments = hydration.recommendedTreatments)
        }
    }
}

// CR-11: Dark Circles & Under-Eye
@Composable
private fun DarkCirclesCard(darkCircles: DarkCirclesResult) {
    val typeLabel = when (darkCircles.type) {
        1 -> "Type 1 - Pigmentation (brownish)"
        2 -> "Type 2 - Vascular (bluish/purplish)"
        3 -> "Type 3 - Structural (sunken/hollow)"
        else -> "Unknown"
    }

    val typeColor = when (darkCircles.type) {
        1 -> Color(0xFFA855F7)
        2 -> Color(0xFF3B82F6)
        3 -> Color(0xFFF59E0B)
        else -> Color.Gray
    }

    ResultCard(title = "Dark Circles & Under-Eye") {
        Text(
            text = typeLabel,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = typeColor
        )

        Spacer(modifier = Modifier.height(12.dp))

        MetricRow(label = "Severity", value = darkCircles.severity.capitalize())

        Spacer(modifier = Modifier.height(12.dp))

        ProgressBar(
            label = "Color Delta",
            value = darkCircles.colorDelta.toInt(),
            color = typeColor
        )

        if (darkCircles.recommendedTreatments.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            TreatmentTags(treatments = darkCircles.recommendedTreatments)
        }
    }
}

// CR-12: Acne & Breakout Zones
@Composable
private fun AcneCard(acne: AcneResult) {
    ResultCard(title = "Acne & Breakout Zones") {
        ProgressBar(
            label = "Overall Severity",
            value = acne.overallSeverity,
            color = Color(0xFFEF4444)
        )

        val affectedZones = acne.zones.filter { it.type != "none" }

        if (affectedZones.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Affected Zones",
                fontSize = 13.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(8.dp))

            affectedZones.forEach { zone ->
                AcneZoneItem(zone = zone)
                Spacer(modifier = Modifier.height(8.dp))
            }
        } else {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "No active acne zones detected",
                fontSize = 13.sp,
                color = Color.Gray
            )
        }

        if (acne.recommendedTreatments.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            TreatmentTags(treatments = acne.recommendedTreatments)
        }
    }
}

@Composable
private fun AcneZoneItem(zone: AcneZone) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = zone.area.replace("-", " ").capitalize(),
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "${zone.type.capitalize()} · ${zone.severity}%",
                fontSize = 12.sp,
                color = Color.Gray
            )
        }

        LinearProgressIndicator(
            progress = { zone.severity / 100f },
            modifier = Modifier
                .weight(1f)
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = Color(0xFFEF4444)
        )
    }
}

// CR-13: Lip Pigmentation
@Composable
private fun LipPigmentationCard(lipPigmentation: LipPigmentationResult) {
    ResultCard(title = "Lip Pigmentation") {
        MetricRow(label = "Darkness Level", value = lipPigmentation.darknessLevel.replace("-", " ").capitalize())

        Spacer(modifier = Modifier.height(12.dp))

        ProgressBar(
            label = "Melanin Index",
            value = lipPigmentation.melaninIndex,
            color = Color(0xFFDB2777)
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                ProgressBar(
                    label = "Unevenness",
                    value = lipPigmentation.unevenness,
                    color = Color(0xFFF97316)
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                ProgressBar(
                    label = "Dryness",
                    value = lipPigmentation.drynessLevel,
                    color = Color(0xFFF59E0B)
                )
            }
        }

        if (lipPigmentation.recommendedTreatments.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            TreatmentTags(treatments = lipPigmentation.recommendedTreatments)
        }
    }
}

// CR-14: AI Treatment Priority Plan
@Composable
private fun TreatmentPlanCard(treatmentPlan: List<TreatmentPlanItem>) {
    ResultCard(title = "AI Treatment Priority Plan") {
        treatmentPlan.sortedBy { it.priority }.forEach { item ->
            TreatmentPlanItem(item = item)
            if (item != treatmentPlan.last()) {
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
private fun TreatmentPlanItem(item: TreatmentPlanItem) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Priority badge
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(
                    color = when (item.priority) {
                        1 -> Color(0xFFEF4444)
                        2 -> Color(0xFFF59E0B)
                        else -> Color(0xFF10B981)
                    },
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = item.priority.toString(),
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.treatmentName,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = item.reason,
                fontSize = 13.sp,
                color = Color.Gray,
                modifier = Modifier.padding(top = 4.dp)
            )
            Row(
                modifier = Modifier.padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "PKR ${item.pkrPriceRange}",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
                Text(
                    text = item.estimatedDuration,
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
        }
    }
}

// CR-15: Diet & Nutrition Plan
@Composable
private fun DietPlanCard(dietPlan: DietPlanResult) {
    ResultCard(title = "Diet & Nutrition Plan") {
        // Foods to Eat
        Text(
            text = "Foods to Eat",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF10B981)
        )

        Spacer(modifier = Modifier.height(8.dp))

        dietPlan.foodsToEat.forEach { food ->
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(text = "✓", color = Color(0xFF10B981), fontSize = 14.sp)
                Column {
                    Text(text = food.food, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Text(text = food.reason, fontSize = 12.sp, color = Color.Gray)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Foods to Avoid
        Text(
            text = "Foods to Avoid",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFFEF4444)
        )

        Spacer(modifier = Modifier.height(8.dp))

        dietPlan.foodsToAvoid.forEach { food ->
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(text = "✗", color = Color(0xFFEF4444), fontSize = 14.sp)
                Column {
                    Text(text = food.food, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Text(text = food.reason, fontSize = 12.sp, color = Color.Gray)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Water intake
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            color = Color(0xFF0EA5E9).copy(alpha = 0.1f)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "💧", fontSize = 20.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(text = "Daily Water Intake", fontSize = 12.sp, color = Color.Gray)
                    Text(text = dietPlan.dailyWaterIntake, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

// CR-17: Re-scan button + View matched salons
@Composable
private fun ActionButtons(
    onViewMatchedSalons: () -> Unit,
    onReScan: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Button(
            onClick = onViewMatchedSalons,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = PurpleDark)
        ) {
            Icon(Icons.Default.LocationOn, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("View Matched Salons")
        }

        OutlinedButton(
            onClick = onReScan,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Refresh, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Re-scan")
        }
    }
}

// Reusable components
@Composable
private fun ResultCard(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            content()
        }
    }
}

@Composable
private fun MetricRow(label: String, value: String) {
    Column {
        Text(text = label, fontSize = 12.sp, color = Color.Gray)
        Text(text = value, fontSize = 14.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun ProgressBar(label: String, value: Int, color: Color) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = label, fontSize = 13.sp, color = Color.Gray)
            Text(text = "$value%", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        }
        Spacer(modifier = Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { value / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp)),
            color = color
        )
    }
}

@Composable
private fun TreatmentTags(treatments: List<String>) {
    Column {
        Text(
            text = "Recommended Treatments",
            fontSize = 12.sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        treatments.forEach { treatment ->
            Surface(
                modifier = Modifier.padding(bottom = 6.dp),
                shape = RoundedCornerShape(6.dp),
                color = PurpleDark.copy(alpha = 0.1f)
            ) {
                Text(
                    text = treatment,
                    fontSize = 12.sp,
                    color = PurpleDark,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                )
            }
        }
    }
}

fun String.capitalize() = replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
