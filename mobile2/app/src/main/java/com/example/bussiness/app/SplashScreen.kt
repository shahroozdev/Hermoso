package com.example.bussiness.app

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onNext: () -> Unit) {
    val scale = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        scale.animateTo(1f, spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow))
        delay(1600)
        onNext()
    }
    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(OwnerNavy, OwnerNavyMid))), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Hermoso", color = OwnerGold, fontSize = 48.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.scale(scale.value))
            Spacer(modifier = Modifier.height(8.dp))
            Text("Business Suite", color = OwnerTextMuted, fontSize = 18.sp, modifier = Modifier.scale(scale.value))
        }
    }
}
