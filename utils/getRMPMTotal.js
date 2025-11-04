export default function getRMPMTotal(days){
    return days.reduce((acc, day) => acc + (Number(day.qty) || 0), 0) || 0;
}