package com.hermoso.business.app

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hermoso.business.R
import com.hermoso.business.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onNext: () -> Unit) {
    val scale = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        scale.animateTo(
            targetValue = 1f,
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        )
        delay(2000)
        onNext()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(PurpleDark, PurpleDeeper))),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Image(
                painter = painterResource(id = R.drawable.ic_logo),
                contentDescription = "Logo",
                modifier = Modifier
                    .size(120.dp)
                    .scale(scale.value)
            )
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "Hermoso",
                color = Color.White,
                fontSize = 56.sp,
                fontWeight = FontWeight.Light,
                fontFamily = CormorantFontFamily,
                modifier = Modifier.scale(scale.value)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "AI Aesthetics",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 18.sp,
                modifier = Modifier.scale(scale.value)
            )
        }
    }
}
