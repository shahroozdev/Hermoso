package com.hermoso.business.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Status badge with color coding based on booking status
 * @param status The booking status (pending, confirmed, cancelled, expired)
 * @param modifier Optional modifier for customization
 */
@Composable
fun StatusBadge(
    status: String?,
    modifier: Modifier = Modifier
) {
    val normalizedStatus = status?.lowercase()?.trim() ?: "pending"
    
    val (backgroundColor, textColor) = when (normalizedStatus) {
        "confirmed" -> Color(0xFFD1FAE5) to Color(0xFF065F46) // Light green bg, dark green text
        "cancelled" -> Color(0xFFFEE2E2) to Color(0xFF7F1D1D) // Light red bg, dark red text
        "expired" -> Color(0xFFFEF3C7) to Color(0xFF78350F)   // Light amber bg, dark amber text
        else -> Color(0xFFDDD6FE) to Color(0xFF3F0F63)        // Light purple bg, dark purple text (pending)
    }

    Text(
        text = normalizedStatus.replaceFirstChar { it.uppercase() },
        modifier = modifier
            .background(
                color = backgroundColor,
                shape = RoundedCornerShape(6.dp)
            )
            .padding(horizontal = 10.dp, vertical = 4.dp),
        color = textColor,
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp
    )
}
