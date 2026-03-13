const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("FundModule", (m) => {
  const fund = m.contract("StudentStartupFund");
  return { fund };
});
