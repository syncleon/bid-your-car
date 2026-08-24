package com.oblapleon.bidapi.feature.item.service

import com.fasterxml.jackson.annotation.JsonProperty
import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.feature.item.dto.VinDecodeResult
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import org.springframework.web.client.getForObject
import org.springframework.beans.factory.annotation.Value

@Service
class VinDecoderService {

    @Value("\${app.nhtsa.api-url:https://vpic.nhtsa.dot.gov/api/vehicles/decodevin}")
    private lateinit var nhtsaApiUrl: String

    private val restTemplate = RestTemplate()

    /**
     * Decodes a VIN (Vehicle Identification Number) using the NHTSA API.
     *
     * @param vin The 17-character VIN to decode.
     * @return A [VinDecodeResult] containing parsed vehicle details.
     * @throws BadRequestException if the VIN length is invalid or decoding fails.
     */
    fun decodeVin(vin: String): VinDecodeResult {
        if (vin.length != 17) {
            throw BadRequestException("VIN must be exactly 17 characters.")
        }

        val url = "$nhtsaApiUrl/$vin?format=json"

        try {
            val response = restTemplate.getForObject<NhtsaResponse>(url)
                ?: throw BadRequestException("Failed to decode VIN")

            val variables = response.results

            fun getVar(name: String): String? {
                val value = variables.find { it.variable == name }?.value
                if (value == null || value == "Not Applicable" || value.trim().isEmpty()) {
                    return null
                }
                return value
            }

            val make = getVar("Make")
            val model = getVar("Model")
            val year = getVar("Model Year")?.toIntOrNull()
            
            // Engine could be displacement + cylinders
            val displacementL = getVar("Displacement (L)")
            val cylinders = getVar("Engine Number of Cylinders")
            val engineConfig = getVar("Engine Configuration")
            val engineStr = buildString {
                if (displacementL != null) append("${displacementL}L ")
                if (engineConfig != null) append("$engineConfig ")
                if (cylinders != null) append("$cylinders-Cylinder")
            }.trim().takeIf { it.isNotEmpty() }

            val transmission = getVar("Transmission Style") ?: getVar("Transmission Speeds")
            val bodyStyle = getVar("Body Class")
            val fuelType = getVar("Fuel Type - Primary")

            return VinDecodeResult(
                vin = vin,
                make = make,
                model = model,
                year = year,
                engine = engineStr,
                transmission = transmission,
                bodyStyle = bodyStyle,
                fuelType = fuelType
            )

        } catch (e: Exception) {
            throw BadRequestException("Error decoding VIN: ${e.message}")
        }
    }

    private data class NhtsaResponse(
        @JsonProperty("Results") val results: List<NhtsaVariable>
    )

    private data class NhtsaVariable(
        @JsonProperty("Variable") val variable: String?,
        @JsonProperty("ValueId") val valueId: String?,
        @JsonProperty("Value") val value: String?
    )
}
