const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("StudentStartupFundModule", (m) => {
  const fund = m.contract("StudentStartupFund");
  return { fund };
});
