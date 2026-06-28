package com.example.bussiness

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.bussiness.app.HermosoApp
import com.example.bussiness.ui.theme.Mobile2Theme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Mobile2Theme {
                HermosoApp()
            }
        }
    }
}
