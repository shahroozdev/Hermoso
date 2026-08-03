import SwiftUI

/// One independent mini booking flow — own staff/date/slots/submit state.
/// Selecting a new staff or date resets only this card's slots, matching
/// BookingScreen.kt's per-card behavior. See ios/context/SCREENS.md screen 7.
struct ServiceBookingCard: View {
    @ObservedObject var viewModel: ServiceBookingCardViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(viewModel.service.name ?? "")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(Color.hermosoPurple)

            LabeledSelect(
                options: viewModel.staff.map { $0.name ?? "" },
                selectedIndex: viewModel.staff.firstIndex(where: { $0.id == viewModel.selectedStaffId }),
                placeholder: "Choose a specialist",
                isDisabled: viewModel.staff.isEmpty
            ) { index in
                viewModel.selectStaff(viewModel.staff[index].id)
            }

            Text("Select Date")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color.hermosoTextMuted)
            CalendarView(
                selectedDate: Binding(get: { viewModel.selectedDate }, set: { viewModel.selectDate($0) }),
                minimumDate: Date()
            )

            if !viewModel.slots.isEmpty {
                Text("Available Slots")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color.hermosoTextMuted)
                slotGrid
            }

            if let error = viewModel.errorMessage {
                Text(error).font(.system(size: 11)).foregroundStyle(Color.hermosoError)
            }
            if let success = viewModel.successMessage {
                Text(success).font(.system(size: 11)).foregroundStyle(Color.hermosoSuccess)
            }

            bookButton
        }
        .padding(14)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .shadow(color: Color.hermosoPurpleDeeper.opacity(0.06), radius: 8, y: 2)
    }

    private var slotGrid: some View {
        FlowLayout(spacing: 6) {
            ForEach(viewModel.slots) { slot in
                let isSelected = viewModel.selectedTime == slot.time
                let isAvailable = slot.available ?? true
                Text(slot.label ?? slot.time ?? "")
                    .font(.system(size: 11.5, weight: isSelected ? .bold : .regular))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(isAvailable ? (isSelected ? Color.hermosoPurple : Color.white) : Color.gray.opacity(0.15))
                    .foregroundStyle(isAvailable ? (isSelected ? Color.white : Color.hermosoTextDark) : Color.hermosoTextMuted.opacity(0.5))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(isAvailable && !isSelected ? Color.hermosoPurplePale : Color.clear, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .onTapGesture {
                        guard isAvailable, let time = slot.time else { return }
                        viewModel.selectedTime = time
                    }
            }
        }
    }

    private var canBook: Bool {
        viewModel.selectedStaffId != nil && viewModel.selectedTime != nil && !viewModel.isSubmitting
    }

    private var bookButton: some View {
        Button {
            Task { await viewModel.book() }
        } label: {
            Text("Book \(viewModel.service.name ?? "")")
                .font(.system(size: 13, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(canBook ? Color.hermosoPurple : Color.hermosoPurple.opacity(0.4))
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .disabled(!canBook)
    }
}
