export default function getInfoUnit(key) {
  const units = {
    foil_weight: "gm",
    inner_poly_weight: "gm",
    process_loss: "%",
    net_weight: "gm",
    pouch_weight: "gm",
    biscuit_in_packet: "pcs",
    paper_per_packet: "gm",
    cake_in_packet: "pcs",
    bar_in_packet: "pcs",
    masala_wrapper_weight: "gm",
    total_packet_per_carton: "pcs",
    alluminium_paper_weight: "gm",
    box_per_carton: "pcs",
    packet_per_box: "pcs",
    inner_per_master: "pcs",
    inner_size: "",
    inner_weight: "gm",
    master_size: "",
    master_weight: "gm",
    packet_per_inner: "pcs",
  };

  return units[key] || "";
}
