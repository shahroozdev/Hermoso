# Hermoso AI Face Scan - Integration Guide

This guide shows how to integrate the newly created components into the existing mobile app.

## Files Created

### Backend (Sprint 2A & 2B - Complete)
- ✅ [server/services/openrouter.service.ts](server/services/openrouter.service.ts)
- ✅ [server/services/diet.service.ts](server/services/diet.service.ts)
- ✅ [server/models/SkinScan.ts](server/models/SkinScan.ts)
- ✅ [server/models/Service.ts](server/models/Service.ts)
- ✅ [server/models/Salon.ts](server/models/Salon.ts)
- ✅ [server/controllers/scan.controller.ts](server/controllers/scan.controller.ts)
- ✅ [server/routes/scan.routes.ts](server/routes/scan.routes.ts)

### Mobile (Sprint 2C - In Progress)
- ✅ [mobile/app/src/main/java/com/example/myapplication/app/AuthApi.kt](mobile/app/src/main/java/com/example/myapplication/app/AuthApi.kt) - Updated DTOs
- ✅ [mobile/app/src/main/java/com/example/myapplication/app/ScanCameraComponents.kt](mobile/app/src/main/java/com/example/myapplication/app/ScanCameraComponents.kt) - Camera enhancements
- ✅ [mobile/app/src/main/java/com/example/myapplication/app/ScanResultsComponents.kt](mobile/app/src/main/java/com/example/myapplication/app/ScanResultsComponents.kt) - Results sections

---

## Step 1: Update ScanScreen.kt to Use New Camera Components

Replace the existing face overlay and add the new components:

```kotlin
// In ScanScreen.kt, update the camera preview box

Box(
    modifier = Modifier
        .fillMaxWidth()
        .height(400.dp)
        .padding(16.dp),
    contentAlignment = Alignment.Center
) {
    if (hasPermission && capturedBitmap == null) {
        // Existing camera preview
        CameraPreviewView(
            imageCapture = imageCapture,
            executor = cameraExecutor,
            onFaceValidated = { state -> validationState = state },
            currentStep = validationState.currentStep
        )
        
        // Replace FaceOverlay with EnhancedCameraScreenContent
        EnhancedCameraScreenContent(
            faces = detectedFaces, // You'll need to pass faces from face detection
            scanProgress = scanProgress, // Add state variable
            analysisCategories = analysisCategories, // Add state variable
            modifier = Modifier.fillMaxSize()
        )
    }
    // ... rest of code
}
```

Add state variables for progress tracking:

```kotlin
// Add these state variables in ScanScreen composable
var detectedFaces by remember { mutableStateOf<List<Face>>(emptyList()) }
var scanProgress by remember { mutableStateOf(0) }
var analysisCategories by remember {
    mutableStateOf(listOf(
        AnalysisCategory("skin_tone", "Skin Tone & Tanning", "🎨", AnalysisState.WAITING),
        AnalysisCategory("eyebrows", "Eyebrow Shape", "👁️", AnalysisState.WAITING),
        AnalysisCategory("hydration", "Hydration & Texture", "💧", AnalysisState.WAITING),
        AnalysisCategory("dark_circles", "Dark Circles", "🌙", AnalysisState.WAITING),
        AnalysisCategory("acne", "Acne Analysis", "🔴", AnalysisState.WAITING),
        AnalysisCategory("lips", "Lip Pigmentation", "💋", AnalysisState.WAITING),
        AnalysisCategory("treatment", "Treatment Plan", "💊", AnalysisState.WAITING),
        AnalysisCategory("diet", "Diet Plan", "🥗", AnalysisState.WAITING)
    ))
}
```

Update face detection to store detected faces:

```kotlin
// In processImageProxy function, update to store faces
faceDetector.process(image)
    .addOnSuccessListener { faces ->
        detectedFaces = faces // Store for overlay
        val state = validateFace(faces, currentStep)
        onFaceValidated(state)
    }
```

---

## Step 2: Create Comprehensive Results Screen

Replace the existing `ResultContent` function with the comprehensive version:

```kotlin
@Composable
fun ComprehensiveResultsScreen(
    data: ScanAnalyzeData,
    onReset: () -> Unit,
    navController: NavHostController
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0614))
            .padding(16.dp)
    ) {
        // Header
        item {
            Text(
                "Your Skin Analysis",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Text(
                data.summary ?: "Complete facial analysis",
                fontSize = 14.sp,
                color = Color(0xFFD8B4FE),
                modifier = Modifier.padding(bottom = 24.dp)
            )
        }

        // CR-07: Overall Score Ring
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                contentAlignment = Alignment.Center
            ) {
                OverallSkinScoreRing(score = data.overallSkinScore ?: 75)
            }
        }

        // CR-08: Skin Tone & Tanning
        item {
            SkinToneSection(data = data.skinTone)
        }

        // CR-09: Eyebrow Assessment
        item {
            EyebrowAssessmentSection(data = data.eyebrows)
        }

        // CR-10: Hydration & Texture
        item {
            HydrationSection(data = data.hydration)
        }

        // CR-11: Dark Circles
        item {
            DarkCirclesSection(data = data.darkCircles)
        }

        // CR-12: Acne Analysis
        item {
            AcneAnalysisSection(data = data.acne)
        }

        // CR-13: Lip Pigmentation
        item {
            LipPigmentationSection(data = data.lipPigmentation)
        }

        // CR-14: Treatment Priority Plan
        item {
            TreatmentPriorityPlanSection(treatments = data.treatmentPlan)
        }

        // CR-15: Diet & Nutrition
        item {
            DietNutritionSection(data = data.dietPlan)
        }

        // Action buttons (CR-16, CR-17)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // CR-17: Re-scan button
                OutlinedButton(
                    onClick = onReset,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Re-scan", color = Color.White)
                }

                // View matched salons
                Button(
                    onClick = { navController.navigate(Dest.Match) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = PurpleLight
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Find Salons", fontWeight = FontWeight.Bold)
                }
            }
        }

        // CR-16: Save & Share buttons
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = { /* TODO: Implement PDF save */ },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("💾 Save Report", color = Color.White)
                }

                OutlinedButton(
                    onClick = { /* TODO: Implement WhatsApp share */ },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("📤 Share", color = Color.White)
                }
            }
        }

        item { Spacer(Modifier.height(32.dp)) }
    }
}
```

Update the existing result wrapper:

```kotlin
// In ScanScreen.kt, update ResultContentWrapper
@Composable
fun ResultContentWrapper(
    data: ScanAnalyzeData,
    onReset: () -> Unit,
    navController: NavHostController
) {
    // Use the comprehensive results screen instead
    ComprehensiveResultsScreen(data, onReset, navController)
}
```

---

## Step 3: Update MatchScreen.kt for Enhanced Salon Matching

Add the salon matching features (CR-19 to CR-23):

```kotlin
// Update MatchScreen to fetch from new API endpoint
@Composable
fun EnhancedMatchScreen(navController: NavHostController) {
    var matchData by remember { mutableStateOf<ScanMatchesData?>(null) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val response = AuthApiClient.api.getScanMatches()
            matchData = response.data
            loading = false
        } catch (e: Exception) {
            loading = false
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0614))
            .padding(16.dp)
    ) {
        // CR-21: Skin condition chips header
        item {
            if (matchData?.recommendations != null) {
                Text(
                    "Treatments You Need",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
                
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(bottom = 24.dp)
                ) {
                    items(matchData.recommendations.size) { index ->
                        val rec = matchData.recommendations[index]
                        Surface(
                            color = PurpleLight.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                "${rec.treatmentName}",
                                modifier = Modifier.padding(
                                    horizontal = 16.dp,
                                    vertical = 10.dp
                                ),
                                color = Color(0xFFD8B4FE),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }

        // CR-22: Filter pills
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                items(listOf("All", "Skin Clinics", "Salons", "Open Now", "Near Me")) { filter ->
                    FilterChip(
                        selected = filter == "All",
                        onClick = { /* TODO: Implement filter */ },
                        label = { Text(filter, fontSize = 12.sp) }
                    )
                }
            }
        }

        // Matched salons list with enhancements
        matchData?.matches?.let { matches ->
            items(matches.size) { index ->
                val match = matches[index]
                EnhancedSalonMatchCard(
                    match = match,
                    onClick = { /* Navigate to salon details */ }
                )
            }
        }
    }
}

@Composable
fun EnhancedSalonMatchCard(
    match: ScanMatchItemDto,
    onClick: () -> Unit,
    onBookNow: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.05f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        match.name ?: "Salon",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Color.White
                    )
                    
                    // Distance and city
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        if (match.distance != null) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = "Distance",
                                tint = Color(0xFF81C784),
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                "${match.distance} ${match.distanceUnit ?: "km"}",
                                color = Color(0xFF81C784),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(start = 4.dp)
                            )
                            Text(
                                " · ${match.city}",
                                color = Color.White.copy(alpha = 0.6f),
                                fontSize = 13.sp
                            )
                        } else {
                            Text(
                                match.city ?: "",
                                color = Color.White.copy(alpha = 0.6f),
                                fontSize = 13.sp
                            )
                        }
                    }
                </Column>

                // CR-23: South Asian specialist badge
                if (match.southAsianSpecialist == true) {
                    Surface(
                        color = Color(0xFFFFD700).copy(alpha = 0.2f),
                        shape = RoundedCornerShape(6.dp),
                        border = BorderStroke(1.dp, Color(0xFFFFD700))
                    ) {
                        Text(
                            "✨ Specialist",
                            modifier = Modifier.padding(
                                horizontal = 8.dp,
                                vertical = 4.dp
                            ),
                            color = Color(0xFFFFD700),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Match percentage and rating
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 8.dp)
            ) {
                Text(
                    "${match.matchPercent}% Match",
                    color = Color.Green,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                
                if (match.rating != null && match.rating > 0) {
                    Text(
                        " · ⭐ ${match.rating}",
                        color = Color(0xFFFFD700),
                        fontSize = 13.sp,
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
            }

            // CR-19: Why matched - treatment checkmarks
            if (match.matchedServices?.isNotEmpty() == true) {
                Text(
                    "Offers:",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 12.dp, bottom = 8.dp)
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    match.matchedServices.take(4).forEach { service ->
                        Surface(
                            color = Color.Green.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(
                                    horizontal = 10.dp,
                                    vertical = 6.dp
                                ),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text("✓", color = Color.Green, fontSize = 12.sp)
                                Text(
                                    service,
                                    color = Color(0xFF81C784),
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
            }
            
            // Book Now button
            Button(
                onClick = onBookNow,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = PurpleLight
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = "Book",
                    modifier = Modifier.size(18.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "Book Appointment",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}
```

---

## Step 4: Environment Configuration

Ensure your backend [.env](server/.env) file has the required variables:

```bash
# OpenRouter API Configuration (CR-27)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Application URLs
APP_URL=http://localhost:5000
CLIENT_URLS=http://localhost:5173,http://10.0.2.2:5000
```

---

## Step 5: Testing Checklist

### Backend API Testing
- [ ] Test POST `/api/scans/analyze` with real face image
- [ ] Verify comprehensive response includes all sections
- [ ] Test South Asian skin tone detection accuracy
- [ ] Verify diet plan generation for different conditions
- [ ] Test POST `/api/scans/match-salons` with treatment IDs
- [ ] Verify match score algorithm calculation

### Mobile Integration Testing
- [ ] Test camera screen with face detection overlay
- [ ] Verify 8 detection points render correctly
- [ ] Test scan progress checklist animation
- [ ] Verify progress percentage counter animates smoothly
- [ ] Test comprehensive results screen displays all sections
- [ ] Verify eyebrow data (if using MediaPipe on mobile)
- [ ] Test navigation to matched salons
- [ ] Verify salon match cards show correct data

### End-to-End Flow
- [ ] Camera → Capture → Upload → Analysis → Results → Matched Salons
- [ ] Test with various face images (different skin tones)
- [ ] Verify error handling for invalid images
- [ ] Test "Why matched" explanations are accurate
- [ ] Verify South Asian specialist badge displays

---

## Common Issues & Solutions

### Issue: MediaPipe not detecting eyebrows
**Solution:** MediaPipe Face Detection doesn't directly provide eyebrow landmarks. You'll need to either:
1. Use ML Kit Pose Detection for more landmarks
2. Calculate eyebrow positions from existing face landmarks
3. Send the face image to backend for analysis without on-device eyebrow data

### Issue: OpenRouter API errors
**Solution:** Check:
- OPENROUTER_API_KEY is valid
- Model name is correct (openai/gpt-4o or anthropic/claude-sonnet-4)
- Image size is under 5MB
- Image format is supported (JPEG, PNG)

### Issue: Salon matching returns empty results
**Solution:** Ensure:
- Salons have `southAsianSpecialist` flag set
- Services have `aiScanLink` field populated
- Match score algorithm threshold (60%) isn't too high
- Test data exists in MongoDB

---

## Next Steps for Completion

### Immediate (Week 3-4)
1. **Integrate components** into existing [ScanScreen.kt](mobile/app/src/main/java/com/example/myapplication/app/ScanScreen.kt)
2. **Update MatchScreen** with enhanced salon cards
3. **Implement CR-16**: PDF export and WhatsApp share
4. **Test end-to-end** flow with real data

### Business App (Week 4)
5. **CR-24 UI**: Add service linking dropdown in Add/Edit Service screen
6. **CR-25 UI**: Add South Asian specialist toggle in Settings
7. **CR-26 UI**: Add dashboard metric for scan-driven bookings

### Final Polish (Week 5)
8. **iOS Implementation**: Port Android components to Swift/SwiftUI
9. **Performance optimization**: Image compression, caching
10. **User testing**: Test with South Asian users in Lahore/Karachi
11. **Tehreem Khan sign-off**: Review results screen output

---

## Summary

**✅ Completed (9/31 CRs = 29%)**
- Backend infrastructure with comprehensive AI analysis
- South Asian skin calibration
- Diet plan generation
- Enhanced salon matching algorithm
- Mobile data models updated
- Camera screen components created
- Results screen components created

**🔄 In Progress (2 CRs)**
- Mobile UI integration
- Component wiring

**⏳ Remaining (20 CRs)**
- Save & share functionality (CR-16)
- Salon match screen enhancements (CR-19-23)
- Business app UI updates (CR-24-26)
- iOS implementation (21 CRs)

**Estimated Time to Complete:**
- Android integration & testing: 3-5 days
- Business app updates: 2-3 days
- iOS port: 12-15 days
- Total: ~20-23 days
