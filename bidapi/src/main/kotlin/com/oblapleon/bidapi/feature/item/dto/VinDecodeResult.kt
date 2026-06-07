package com.oblapleon.bidapi.feature.item.dto

data class VinDecodeResult(
    val vin: String,
    val make: String?,
    val model: String?,
    val year: Int?,
    val engine: String?,
    val transmission: String?,
    val bodyStyle: String?,
    val fuelType: String?
)
