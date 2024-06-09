var TreasuryContract = artifacts.require("Treasury");
var LendingLogicContract = artifacts.require("Lending");
var LoanOperationContract = artifacts.require("LoanOperations");
module.exports = function (deployer) {
  // deployment steps
  deployer.deploy(TreasuryContract);
  deployer.deploy( LendingLogicContract);
  deployer.deploy(LoanOperationContract);
};