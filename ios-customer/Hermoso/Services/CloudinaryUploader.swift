import Foundation

enum CloudinaryUploadError: Error, LocalizedError {
    case invalidResponse
    case uploadFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Couldn't reach the upload service."
        case .uploadFailed(let message):
            return message
        }
    }
}

/// Uploads scan photos directly to Cloudinary using a short-lived signature minted
/// by our backend (see AuthApi.getScanUploadSignature). The image binary never
/// passes through our own API, which avoids Vercel serverless functions' 4.5MB
/// request body cap — the backend only ever receives the resulting URL.
enum CloudinaryUploader {
    static func upload(imageData: Data, signature: ScanUploadSignatureData) async throws -> String {
        guard
            let cloudName = signature.cloudName,
            let timestamp = signature.timestamp,
            let apiKey = signature.apiKey,
            let sig = signature.signature,
            let folder = signature.folder,
            let url = URL(string: "https://api.cloudinary.com/v1_1/\(cloudName)/image/upload")
        else {
            throw CloudinaryUploadError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        func appendField(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }
        appendField("api_key", apiKey)
        appendField("timestamp", String(timestamp))
        appendField("signature", sig)
        appendField("folder", folder)

        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"scan.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw CloudinaryUploadError.invalidResponse }

        guard (200...299).contains(http.statusCode) else {
            throw CloudinaryUploadError.uploadFailed("Couldn't upload photo. Please try again.")
        }

        guard
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let secureUrl = json["secure_url"] as? String
        else {
            throw CloudinaryUploadError.uploadFailed("Couldn't upload photo. Please try again.")
        }

        return secureUrl
    }
}
