package com.hermoso.business

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.hermoso.business.app.HermosoApp
import com.hermoso.business.ui.theme.HermosoTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HermosoTheme {
                HermosoApp()
            }
        }
    }
}