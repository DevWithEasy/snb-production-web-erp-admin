export default function getPercenteage(key,type=true) {
  const percents = {
    rm: "0%",
    carton: "0.2%",
    wrapper: "2%",
    pouch: "0.5%",
    tray: "0.2%",
    atc: "0.2%",
    jar: "0.2%",
    gum_tape: "0%",
    poly: "0.5%",
    paper: "0.5%",
    alloy_paper: "2%",
    board: "0.2%",
    sticker: "0.2%",
    print: "100%",
  };
  const percentsValue = {
    rm: 0,
    carton: 0.005,
    wrapper: 0.02,
    pouch:0.005,
    tray: 0.005,
    atc: 0.005,
    jar: 0.005,
    gum_tape: 0,
    poly: 0.005,
    paper: 0.005,
    alloy_paper: 0.02,
    board: 0.005,
    sticker: 0.005,
    print: 1,
  };

  return type ? percentsValue[key] : percents[key]
}
