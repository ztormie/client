export function generateTimeSlots(date) {
  const day = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  let startHour = 0;
  let endHour = 0;

  if (day >= 1 && day <= 4) {
    // Mon–Thu
    startHour = 16;
    endHour = 20;
  } else {
    // Fri–Sun
    startHour = 9;
    endHour = 20;
  }

  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
    slots.push(`${String(hour).padStart(2, '0')}:30`);
  }

  return slots;
}
