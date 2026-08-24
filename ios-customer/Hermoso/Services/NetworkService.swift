import Foundation

enum NetworkError: Error, LocalizedError {
    case invalidResponse
    case server(status: Int, message: String?)
    case decoding(Error)
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The server returned an unexpected response."
        case .server(_, let message):
            return message ?? "Something went wrong. Please try again."
        case .decoding:
            return "Couldn't read the server's response."
        case .unauthorized:
            return "Your session has expired. Please log in again."
        }
    }
}

/// URLSession async/await wrapper. Mirrors Android's OkHttp setup: attaches
/// `Authorization: Bearer <accessToken>` to every authenticated request, and on a
/// 401 makes a single silent `/auth/refresh` attempt before retrying the original
/// request exactly once (Android's TokenAuthenticator gives up after 2 total
/// attempts). Concurrent 401s share one in-flight refresh via `refreshWaiters`
/// rather than firing multiple parallel refresh calls.
actor NetworkService {
    static let shared = NetworkService()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private var isRefreshing = false
    private var refreshWaiters: [CheckedContinuation<Bool, Never>] = []

    private init() {
        session = URLSession(configuration: .default)
        decoder = JSONDecoder()
        encoder = JSONEncoder()
    }

    func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        query: [String: String]? = nil,
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        let data = try await rawRequest(path, method: method, query: query, body: body, requiresAuth: requiresAuth, retry: true)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decoding(error)
        }
    }

    /// Multipart upload. The field name must be literally "image" to match the
    /// backend contract (see ios/context/API_REFERENCE.md, /scans/analyze).
    func upload<T: Decodable>(
        _ path: String,
        fieldName: String,
        fileName: String,
        mimeType: String,
        data fileData: Data
    ) async throws -> T {
        var request = try buildRequest(path: path, method: "POST", query: nil, requiresAuth: true)
        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let responseData = try await send(request, retry: true)
        do {
            return try decoder.decode(T.self, from: responseData)
        } catch {
            throw NetworkError.decoding(error)
        }
    }

    private func rawRequest(
        _ path: String,
        method: String,
        query: [String: String]?,
        body: Encodable?,
        requiresAuth: Bool,
        retry: Bool
    ) async throws -> Data {
        var request = try buildRequest(path: path, method: method, query: query, requiresAuth: requiresAuth)
        if let body {
            request.httpBody = try encoder.encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        return try await send(request, retry: retry)
    }

    private func buildRequest(path: String, method: String, query: [String: String]?, requiresAuth: Bool) throws -> URLRequest {
        var url = Config.apiBaseURL.appendingPathComponent(path)
        if let query, !query.isEmpty {
            guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
                throw NetworkError.invalidResponse
            }
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
            guard let composed = components.url else { throw NetworkError.invalidResponse }
            url = composed
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        if requiresAuth, let token = SessionManager.shared.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func send(_ request: URLRequest, retry: Bool) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NetworkError.invalidResponse }

        if http.statusCode == 401, retry {
            let refreshed = await refreshTokenIfNeeded()
            if refreshed {
                var retried = request
                if let token = SessionManager.shared.accessToken {
                    retried.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                }
                return try await send(retried, retry: false)
            }
            SessionManager.shared.clearSession()
            throw NetworkError.unauthorized
        }

        guard (200...299).contains(http.statusCode) else {
            let message = try? decoder.decode(ApiResponse<EmptyCodable>.self, from: data).message
            throw NetworkError.server(status: http.statusCode, message: message)
        }
        return data
    }

    private func refreshTokenIfNeeded() async -> Bool {
        if isRefreshing {
            return await withCheckedContinuation { continuation in
                refreshWaiters.append(continuation)
            }
        }
        isRefreshing = true
        defer { isRefreshing = false }

        guard let refreshToken = SessionManager.shared.refreshToken, !refreshToken.isEmpty else {
            resumeWaiters(with: false)
            return false
        }

        do {
            var request = URLRequest(url: Config.apiBaseURL.appendingPathComponent("auth/refresh"))
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(RefreshRequest(refreshToken: refreshToken))

            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                resumeWaiters(with: false)
                return false
            }
            let loginResponse = try decoder.decode(LoginResponse.self, from: data)
            SessionManager.shared.saveSession(
                accessToken: loginResponse.accessToken,
                refreshToken: loginResponse.refreshToken,
                name: loginResponse.user?.name,
                role: loginResponse.user?.role
            )
            resumeWaiters(with: true)
            return true
        } catch {
            resumeWaiters(with: false)
            return false
        }
    }

    private func resumeWaiters(with result: Bool) {
        let waiters = refreshWaiters
        refreshWaiters.removeAll()
        for waiter in waiters {
            waiter.resume(returning: result)
        }
    }
}
