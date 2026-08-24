package com.hermoso.customer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.hermoso.customer.app.HermosoApp
import com.hermoso.customer.ui.theme.HermosoTheme

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