export function convert12HoursSystem(date) {
  // getting the time part from the date by splitting on space
  // then splitting the time to convert the first part
  let time = date.toString().split(" ")[1].split(":");
  if (time[0] > 12) {
    time[0] -= 12;
    time[1].padStart(2, "0");
    return `${time.join(":")} pm`;
  } else {
    return `${time.join(":")} am`;
  }
}
