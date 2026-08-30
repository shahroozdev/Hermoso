package com.hermoso.business.app

import org.json.JSONObject
import retrofit2.HttpException

data class ApiErrorInfo(val status: Int, val message: String, val code: String?)

// errorBody() is a one-shot stream, so status + message + structured code must be read
// from a single .string() call rather than separate parse functions.
fun parseApiError(throwable: Throwable): ApiErrorInfo {
    if (throwable !is HttpException) {
        return ApiErrorInfo(-1, throwable.message ?: "Something went wrong", null)
    }
    val raw = throwable.response()?.errorBody()?.string()
        ?: return ApiErrorInfo(throwable.code(), throwable.message ?: "Request failed", null)
    return try {
        val json = JSONObject(raw)
        ApiErrorInfo(
            throwable.code(),
            json.optString("message").ifBlank { raw },
            json.optString("code").ifBlank { null },
        )
    } catch (e: Exception) {
        ApiErrorInfo(throwable.code(), raw, null)
    }
}
