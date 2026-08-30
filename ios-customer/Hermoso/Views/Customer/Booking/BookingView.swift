import SwiftUI

/// Standard 5-step flow. Matches BookingScreen.kt: cascading resets, salon
/// locked when preselected, slots load only once salon+service+staff+date are
/// all set. See ios/context/SCREENS.md screen 7.
struct BookingView: View {
    @StateObject private var viewModel: BookingViewModel

    init(preselectedSalonId: String? = nil, preselectedServiceId: String? = nil) {
        _viewModel = StateObject(
            wrappedValue: BookingViewModel(preselectedSalonId: preselectedSalonId, preselectedServiceId: preselectedServiceId)
        )
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                // Split across two Groups: SwiftUI's ViewBuilder caps a single
                // block at 10 direct children.
                VStack(alignment: .leading, spacing: 16) {
                    Group {
                        stepLabel("1. Select Salon")
                        salonSelect
                        stepLabel("2. Select Service")
                        serviceSelect
                        stepLabel("3. Select Specialist")
                        staffSelect
                    }
                    Group {
                        stepLabel("4. Select Date")
                        CalendarView(
                            selectedDate: Binding(get: { viewModel.selectedDate }, set: { viewModel.selectDate($0) }),
                            minimumDate: Date()
                        )
                        stepLabel("5. Available Slots")
                        slotGrid
                        messages
                        summaryCard
                        confirmButton
                    }
                }
                .padding(16)
            }
        }
        .background(Color.hermosoCream)
        .task { await viewModel.start() }
        .sheet(isPresented: $viewModel.showCheckout) {
            if let checkoutUrl = viewModel.checkoutUrl {
                PaymentWebView(
                    checkoutUrl: checkoutUrl,
                    onSuccess: { tracker in
                        viewModel.showCheckout = false
                        viewModel.checkoutTracker = tracker
                    },
                    onFailed: { tracker in
                        viewModel.showCheckout = false
                        viewModel.checkoutTracker = tracker
                    }
                )
            }
        }
        .navigationDestination(isPresented: Binding(
            get: { viewModel.checkoutTracker != nil && !viewModel.showCheckout },
            set: { if !$0 { viewModel.checkoutTracker = nil } }
        )) {
            if let tracker = viewModel.checkoutTracker {
                PaymentSuccessView(
                    tracker: tracker,
                    onViewBookings: {
                        viewModel.checkoutTracker = nil
                    }
                )
            }
        }
    }

    private var header: some View {
        Text("Booking Details")
            .font(.system(size: 16, weight: .heavy))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(
                LinearGradient(
                    colors: [Color.hermosoPurpleDeeper, Color.hermosoPurpleDark, Color.hermosoPurple],
                    startPoint: .leading, endPoint: .trailing
                )
            )
    }

    private func stepLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 12.5, weight: .bold))
            .foregroundColor(Color.hermosoTextDark)
    }

    private var salonSelect: some View {
        LabeledSelect(
            options: viewModel.salons.map { $0.name ?? "" },
            selectedIndex: viewModel.salons.firstIndex(where: { $0.id == viewModel.selectedSalonId }),
            placeholder: "Choose a salon",
            isDisabled: viewModel.isSalonLocked
        ) { index in
            viewModel.selectSalon(viewModel.salons[index].id)
        }
    }

    private var serviceSelect: some View {
        LabeledSelect(
            options: viewModel.services.map { "\($0.name ?? "") (PKR \(Int($0.price ?? 0)))" },
            selectedIndex: viewModel.services.firstIndex(where: { $0.id == viewModel.selectedServiceId }),
            placeholder: "Choose a service",
            isDisabled: viewModel.services.isEmpty
        ) { index in
            viewModel.selectService(viewModel.services[index].id)
        }
    }

    private var staffSelect: some View {
        LabeledSelect(
            options: viewModel.staff.map { $0.name ?? "" },
            selectedIndex: viewModel.staff.firstIndex(where: { $0.id == viewModel.selectedStaffId }),
            placeholder: "Choose a specialist",
            isDisabled: viewModel.staff.isEmpty
        ) { index in
            viewModel.selectStaff(viewModel.staff[index].id)
        }
    }

    private var slotGrid: some View {
        FlowLayout(spacing: 8) {
            ForEach(viewModel.slots) { slot in
                slotChip(slot)
            }
        }
    }

    private func slotChip(_ slot: BookingSlotDto) -> some View {
        let isSelected = viewModel.selectedTime == slot.time
        let isAvailable = slot.available ?? true
        return Text(slot.label ?? slot.time ?? "")
            .font(.system(size: 12.5, weight: isSelected ? .bold : .regular))
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(isAvailable ? (isSelected ? Color.hermosoPurple : Color.white) : Color.gray.opacity(0.15))
            .foregroundColor(isAvailable ? (isSelected ? Color.white : Color.hermosoTextDark) : Color.hermosoTextMuted.opacity(0.5))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(isAvailable && !isSelected ? Color.hermosoPurplePale : Color.clear, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .onTapGesture {
                guard isAvailable, let time = slot.time else { return }
                viewModel.selectedTime = time
            }
    }

    @ViewBuilder
    private var messages: some View {
        if let error = viewModel.errorMessage {
            Text(error).font(.footnote).foregroundColor(Color.hermosoError)
        }
        if let success = viewModel.successMessage {
            Text(success).font(.footnote).foregroundColor(Color.hermosoSuccess)
        }
    }

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Booking Summary")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(Color.hermosoTextDark)
            SummaryRowView(label: "Salon", value: viewModel.selectedSalonName ?? "—")
            SummaryRowView(label: "Service", value: viewModel.selectedServiceName ?? "—")
            SummaryRowView(label: "Specialist", value: viewModel.selectedStaffName ?? "—")
            SummaryRowView(label: "Date", value: Self.summaryDateFormatter.string(from: viewModel.selectedDate))
            SummaryRowView(label: "Time", value: viewModel.selectedTime ?? "—")
            Divider()
            HStack {
                Text("Total").font(.system(size: 14, weight: .heavy))
                Spacer()
                Text("PKR \(Int(viewModel.selectedServicePrice ?? 0))").font(.system(size: 14, weight: .heavy))
            }
            .foregroundColor(Color.hermosoPurple)
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var confirmButton: some View {
        Button {
            Task { await viewModel.submitBooking() }
        } label: {
            Text(viewModel.isSubmitting ? "Booking..." : "Confirm Booking")
                .font(.system(size: 15, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(viewModel.canSubmit ? Color.hermosoPurple : Color.hermosoPurple.opacity(0.4))
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .disabled(!viewModel.canSubmit)
    }

    private static let summaryDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, d MMM yyyy"
        return formatter
    }()
}

#Preview {
    BookingView()
}
