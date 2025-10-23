export default function getInfoUnit(key) {
  switch (key) {
    case "process_loss":
      return "%";
    case "net_weight":
      return "gm";
    case "foil_weight":
      return "gm";
    case "pouch_weight":
      return "gm";
    case "biscuit_in_packet":
      return "Pcs";
    case "cake_in_packet":
      return "Pcs";
    case "bar_in_packet":
      return "Pcs";
    case "masala_wrapper_weight":
      return "gm";
    case "total_packet_per_carton":
      return "Pcs";
    default:
      break;
  }
}
