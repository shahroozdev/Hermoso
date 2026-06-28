package com.example.myapplication.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
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
import androidx.navigation.NavHostController
import com.example.myapplication.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun MatchScreen(navController: NavHostController) {
    var loading by rememberSaveable { mutableStateOf(true) }
    var error by rememberSaveable { mutableStateOf("") }
    var matches by rememberSaveable { mutableStateOf(listOf<ScanMatchItemDto>()) }
    var reloadKey by rememberSaveable { mutableIntStateOf(0) }

    LaunchedEffect(reloadKey) {
        loading = true
        error = ""
        try {
            val response = withContext(Dispatchers.IO) { AuthApiClient.api.getScanMatches() }
            matches = response.data?.matches ?: emptyList()
            if (!response.success) {
                error = response.message ?: "Failed to load matches"
            }
        } catch (t: Throwable) {
            error = t.message ?: "Failed to load matches"
        } finally {
            loading = false
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(Cream)) {
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.linearGradient(listOf(TextDark, PurpleDark)))
                    .padding(20.dp)
            ) {
                Text("AI Salon Match", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("Salons matched to your latest scan", color = Color.White.copy(alpha = 0.6f))
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

        if (!loading && error.isBlank() && matches.isEmpty()) {
            item {
                Text("No matched salons found. Try another scan.", color = TextMuted, modifier = Modifier.padding(16.dp))
            }
        }

        items(matches) { match ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(match.name ?: "Salon", fontWeight = FontWeight.Bold)
                    Text("${match.city ?: "Unknown"}", color = TextMuted)
                    Spacer(Modifier.height(8.dp))
                    Text("Match ${(match.matchPercent ?: 0)}%", color = Purple, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        (match.matchedServices ?: emptyList()).forEach { tag ->
                            Text(
                                tag,
                                modifier = Modifier
                                    .background(PurplePale, RoundedCornerShape(8.dp))
                                    .clickable(enabled = false) {}
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                                color = Purple
                            )
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    Button(
                        onClick = {
                            val salonId = match.salonId
                            if (!salonId.isNullOrBlank()) {
                                navController.navigate("salon-services/$salonId")
                            }
                        },
                        enabled = !match.salonId.isNullOrBlank(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Purple)
                    ) { Text("View Services") }
                }
            }
        }
    }
}
