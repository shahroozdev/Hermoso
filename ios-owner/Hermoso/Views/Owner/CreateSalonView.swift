import SwiftUI
import PhotosUI

/// Salon creation form shown after OTP verification. The owner fills in their
/// salon details and submits — on success the salon is created (status: pending)
/// and the user is taken to the dashboard.
struct CreateSalonView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = CreateSalonViewModel()

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.hermosoOwnerNavy, Color.hermosoOwnerNavyMid],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    header
                    formCard
                }
                .padding(.horizontal, 24)
                .padding(.top, 40)
                .padding(.bottom, 24)
            }
        }
    }

    private var header: some View {
        VStack(spacing: 4) {
            Text("Create Your Salon")
                .font(.custom("CormorantGaramond-Light", size: 28))
                .foregroundColor(.white)
            Text("Set up your salon profile to get started")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))
        }
        .padding(.bottom, 24)
    }

    private var formCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Salon Details")
                .font(.title3.bold())
                .foregroundColor(Color.hermosoTextDark)

            labeledField("Salon Name", text: $viewModel.name)
            labeledField("Phone", text: $viewModel.phone, keyboard: .phonePad)
            labeledField("Address", text: $viewModel.address)
            labeledField("City", text: $viewModel.city)
            labeledField("Country", text: $viewModel.country)

            VStack(alignment: .leading, spacing: 5) {
                Text("Description")
                    .font(.caption.weight(.semibold))
                    .foregroundColor(Color.hermosoTextMuted)
                TextEditor(text: $viewModel.description)
                    .frame(minHeight: 60)
                    .padding(8)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.hermosoFieldBorder, lineWidth: 1.4)
                    )
            }

            imagePicker

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.footnote)
                    .foregroundColor(Color.hermosoError)
            }

            Button {
                Task { await viewModel.submit() }
            } label: {
                Text(viewModel.isSubmitting ? "Creating Salon..." : "Create Salon")
                    .font(.headline)
                    .foregroundColor(Color.hermosoOwnerNavy)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.hermosoOwnerGold)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .disabled(viewModel.isSubmitting)
        }
        .padding(24)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private var imagePicker: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("Salon Image")
                .font(.caption.weight(.semibold))
                .foregroundColor(Color.hermosoTextMuted)

            if let imageData = viewModel.imageData, let uiImage = UIImage(data: imageData) {
                HStack {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 120)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    Button {
                        viewModel.imageData = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(Color.hermosoError)
                    }
                }
            } else {
                PhotosPicker(selection: $viewModel.imageSelection, matching: .images) {
                    HStack {
                        Image(systemName: "photo.on.rectangle")
                        Text("Select Salon Image")
                    }
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(Color.hermosoOwnerGold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.hermosoOwnerNavyCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
            }
        }
    }

    private func labeledField(_ label: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundColor(Color.hermosoTextMuted)
            TextField("", text: text)
                .keyboardType(keyboard)
                .autocapitalization(.none)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.hermosoFieldBorder, lineWidth: 1.4)
                )
        }
    }
}

@MainActor
final class CreateSalonViewModel: ObservableObject {
    @Published var name = ""
    @Published var phone = ""
    @Published var address = ""
    @Published var city = ""
    @Published var country = "Pakistan"
    @Published var description = ""
    @Published var imageData: Data?
    @Published var imageSelection: PhotosPickerItem? {
        didSet { Task { await loadImage() } }
    }
    @Published var isSubmitting = false
    @Published var errorMessage: String?

    var onSalonCreated: (() -> Void)?

    private let api: AuthApiProtocol

    init(api: AuthApiProtocol = AuthApi()) {
        self.api = api
    }

    private func loadImage() async {
        guard let item = imageSelection else { return }
        guard let data = try? await item.loadTransferable(type: Data.self) else { return }
        imageData = data
    }

    func submit() async {
        errorMessage = nil
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Salon name is required"
            return
        }
        guard name.count >= 2 else {
            errorMessage = "Salon name must be at least 2 characters"
            return
        }
        guard !phone.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Phone number is required"
            return
        }
        guard phone.count >= 10 else {
            errorMessage = "Phone number must be at least 10 digits"
            return
        }
        guard !address.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Address is required"
            return
        }
        guard address.count >= 5 else {
            errorMessage = "Full address is required"
            return
        }
        guard !city.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "City is required"
            return
        }

        isSubmitting = true
        defer { isSubmitting = false }

        do {
            let defaultHours: [String: DayScheduleDto] = [
                "monday": DayScheduleDto(open: "09:00", close: "18:00", off: false),
                "tuesday": DayScheduleDto(open: "09:00", close: "18:00", off: false),
                "wednesday": DayScheduleDto(open: "09:00", close: "18:00", off: false),
                "thursday": DayScheduleDto(open: "09:00", close: "18:00", off: false),
                "friday": DayScheduleDto(open: "09:00", close: "18:00", off: false),
                "saturday": DayScheduleDto(open: "09:00", close: "18:00", off: false),
                "sunday": DayScheduleDto(open: "09:00", close: "18:00", off: true),
            ]
            _ = try await api.createSalon(
                name: name,
                phone: phone,
                address: address,
                description: description.isEmpty ? nil : description,
                city: city,
                country: country,
                workingHours: defaultHours,
                imageData: imageData
            )
            onSalonCreated?()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    CreateSalonView()
}
