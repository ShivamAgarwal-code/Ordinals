// SPDX-License-Identifier: OrdinalDAO
pragma solidity ^0.8.10;
import {Vault} from "./Vault.sol";
import {LoanOperations} from "./LoanOperations.sol";
import {Lending} from "./LendingLogic.sol";
contract LendingPool
{
    event receiveFundEvent(
     uint  indexed  amount 
   );
   event withdrawEvent(
       address  indexed borrower,
       uint indexed amount
   );

    LoanOperations loanOperation= new LoanOperations();
    Lending lendingLogic= new Lending();
    function withdraw (uint256  _collateralVal,uint _collId,string memory _collName , uint _borrowAmt) public returns(uint)
   {  
    uint eligibleAmt = lendingLogic.calculateLoanAmt( _collateralVal);
    require(_borrowAmt<=eligibleAmt,"Cannot Borrow this amount");
    uint loanId=loanOperation.createLoan(msg.sender,_borrowAmt);
    loanId=loanOperation.addcollateral(_collId,_collName,_collateralVal,msg.sender);
    lendingLogic.requestForLoan(_collateralVal);
    payable(msg.sender).transfer(eligibleAmt);
    emit withdrawEvent(msg.sender,eligibleAmt);
    return loanId;
   }  

    function rePay(uint _loanId) payable public 
   {
    uint amt = lendingLogic.calculateTotalPayable();
    require(msg.value>=amt,"Repay_The_correct_amount");
    loanOperation.repayLoan(_loanId,msg.sender);
    lendingLogic.resetValue();
    emit receiveFundEvent(msg.value);
   }
}