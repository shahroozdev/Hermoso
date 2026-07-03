package com.example.myapplication.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.myapplication.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun TrackerScreen() {
    var loading by rememberSaveable { mutableStateOf(true) }
    var error by rememberSaveable { mutableStateOf("") }
    var data by rememberSaveable { mutableStateOf<ScanImprovementsData?>(null) }
    var reloadKey by rememberSaveable { mutableIntStateOf(0) }

    LaunchedEffect(reloadKey) {
        loading = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getScanImprovements() }
            data = response.data
            if (!response.success) {
                error = response.message ?: "Failed to load progress"
            }
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load progress"
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Cream)) {
        item {
            Column(
                Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(Color(0xFF0F0A1A), PurpleDeeper))).padding(20.dp)
            ) {
                Text("Skin Progress Tracker", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("Based on your first and latest valid scans", color = Color.White.copy(alpha = 0.55f))
            }
        }

        if (loading) {
            item {
                Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = Purple)
                }
            }
        }

        if (error.isNotBlank()) {
            item {
                Column(Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(error, color = Color(0xFFB00020))
                    Spacer(Modifier.height(10.dp))
                    Button(onClick = { reloadKey++ }, colors = ButtonDefaults.buttonColors(containerColor = Purple)) {
                        Text("Retry")
                    }
                }
            }
        }

        item {
            val d = data
            if (!loading && error.isBlank() && d != null) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = PurpleDark)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Scans: ${d.scansCount ?: 0}", color = Color.White, fontWeight = FontWeight.Bold)
                        Text("First: ${d.firstScanAt ?: "-"}", color = Color.White.copy(alpha = 0.7f))
                        Text("Latest: ${d.latestScanAt ?: "-"}", color = Color.White.copy(alpha = 0.7f))
                    }
                }
                Text("Metric Improvements", modifier = Modifier.padding(horizontal = 16.dp), fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
            }
        }

        items(data?.improvements ?: emptyList()) { m ->
            val afterValue = m.after ?: 0
            val afterPct = (afterValue.coerceIn(0, 100)) / 100f
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(m.key ?: "Metric", fontWeight = FontWeight.SemiBold)
                        val deltaValue = m.delta ?: 0
                        Text(
                            text = "${if (deltaValue >= 0) "+" else ""}$deltaValue",
                            color = if (m.positive == false) Color(0xFFEF4444) else Color(0xFF10B981),
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Before: ${m.before ?: 0}", color = TextMuted)
                        Text("After: $afterValue", color = TextMuted)
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().height(8.dp).background(PurplePale, RoundedCornerShape(8.dp))
                    ) {
                        Spacer(
                            modifier = Modifier
                                .fillMaxWidth(afterPct)
                                .height(8.dp)
                                .background(Purple, RoundedCornerShape(8.dp))
                        )
                    }
                }
            }
        }

        item {
            val d = data
            if (!loading && error.isBlank() && (d == null || d.improvements.isNullOrEmpty())) {
                Text("Need at least two successful scans to show progress.", color = TextMuted, modifier = Modifier.padding(16.dp))
            }
        }
    }
}
