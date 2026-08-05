import SwiftUI

/// Matches CalendarComponent.kt exactly: Sunday-first grid, header arrows
/// only (no swipe gesture, no week-view). See ios/context/SCREENS.md.
struct CalendarView: View {
    @Binding var selectedDate: Date
    var minimumDate: Date?

    @State private var displayedMonth: Date

    init(selectedDate: Binding<Date>, minimumDate: Date? = nil) {
        self._selectedDate = selectedDate
        self.minimumDate = minimumDate
        self._displayedMonth = State(initialValue: selectedDate.wrappedValue)
    }

    private var calendar: Calendar {
        var cal = Calendar(identifier: .gregorian)
        cal.firstWeekday = 1 // Sunday
        return cal
    }

    var body: some View {
        VStack(spacing: 10) {
            HStack {
                Button {
                    changeMonth(by: -1)
                } label: {
                    Text("‹").font(.system(size: 18, weight: .bold)).foregroundColor(Color.hermosoPurple)
                }
                .accessibilityLabel("Previous month")
                Spacer()
                Text(monthYearLabel)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(Color.hermosoTextDark)
                Spacer()
                Button {
                    changeMonth(by: 1)
                } label: {
                    Text("›").font(.system(size: 18, weight: .bold)).foregroundColor(Color.hermosoPurple)
                }
                .accessibilityLabel("Next month")
            }

            HStack {
                ForEach(Array(["S", "M", "T", "W", "T", "F", "S"].enumerated()), id: \.offset) { _, day in
                    Text(day)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(Color.hermosoTextMuted)
                        .frame(maxWidth: .infinity)
                }
            }

            let days = daysInMonth()
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 8) {
                ForEach(days.indices, id: \.self) { index in
                    if let date = days[index] {
                        dayCell(date)
                    } else {
                        Color.clear.frame(height: 32)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func dayCell(_ date: Date) -> some View {
        let isSelected = calendar.isDate(date, inSameDayAs: selectedDate)
        let isToday = calendar.isDateInToday(date)
        let isDisabled = minimumDate.map { date < calendar.startOfDay(for: $0) } ?? false
        let textColor: Color = isSelected
            ? Color.white
            : (isDisabled ? Color.hermosoTextMuted.opacity(0.4) : (isToday ? Color.hermosoPurple : Color.hermosoTextDark))

        return Text("\(calendar.component(.day, from: date))")
            .font(.system(size: 14, weight: (isSelected || isToday) ? .bold : .regular))
            .foregroundColor(textColor)
            .frame(width: 32, height: 32)
            .background(isSelected ? Color.hermosoPurple : Color.clear)
            .clipShape(Circle())
            .contentShape(Circle())
            .onTapGesture {
                guard !isDisabled else { return }
                selectedDate = date
            }
    }

    private var monthYearLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: displayedMonth)
    }

    private func changeMonth(by delta: Int) {
        if let newMonth = calendar.date(byAdding: .month, value: delta, to: displayedMonth) {
            displayedMonth = newMonth
        }
    }

    private func daysInMonth() -> [Date?] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: displayedMonth),
              let firstWeekday = calendar.dateComponents([.weekday], from: monthInterval.start).weekday else {
            return []
        }
        let leadingBlanks = (firstWeekday - calendar.firstWeekday + 7) % 7
        var days: [Date?] = Array(repeating: nil, count: leadingBlanks)

        var current = monthInterval.start
        while current < monthInterval.end {
            days.append(current)
            guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }
            current = next
        }
        return days
    }
}

#Preview {
    CalendarView(selectedDate: .constant(Date()))
}
