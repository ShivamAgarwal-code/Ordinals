// SPDX-License-Identifier: OrdinalDAO
pragma solidity ^0.8.10;
import {IVault} from "../Interfaces/IVault.sol";
import {LToken} from "../tokens/LToken.sol";
import {LoanOperations} from "./LoanOperations.sol";
import {Lending} from "./LendingLogic.sol";
contract Vault is IVault
{
    LoanOperations loanoperations = new LoanOperations();
    Lending lendinglogic = new Lending();

    uint private _totalAmount;
    uint private _totalBorrow;
    uint private _totalReserve=0;
    LToken token; 

    uint private _setupFee = 5; // 0.5% *10

    address private constant loanPoolAddress = 0xd9145CCE52D386f254917e481eB44e9943F39138;// this address needs to be replaced
    address private constant _owner= 0xA5e9aF622d49C94B497fa9F51bB77525189C36cf;

    //stores the amount of liquidity given to the pool and the liquidator
    mapping(address=>uint) private _addressToAmountofLiquidator;
    //stores the amount of fund borrowd by and the address 
    mapping(address=>uint) private _addressToAmountofBorrower;
    constructor(address LtokenAddress) 
    {
    token = LToken(LtokenAddress);
    }


    modifier onlyPool
    {
        require(msg.sender == loanPoolAddress);
        _;
    } 
    modifier onlyOwner
    {
        require(msg.sender ==_owner);
        _;
    } 

    function addLiquidity(address liquidator) external virtual override payable returns(uint)
    {
        _addressToAmountofLiquidator[liquidator]=_addressToAmountofLiquidator[liquidator]+msg.value;
        _totalAmount = _totalAmount+msg.value;
        uint tokenAmt=calculateMintableToken(msg.value);
        token.mint(liquidator,tokenAmt);
        return tokenAmt;

    }
    function removeLiquidity(address withdrawer,uint amount) external virtual override
    {
        require(_addressToAmountofLiquidator[withdrawer]!=0,"NOT_ELIGIBLE_TO_WITHDRAW");
        require(_addressToAmountofLiquidator[withdrawer]>=amount,"AMOUNT_MUST_BE_LESS");
        _addressToAmountofLiquidator[withdrawer]=_addressToAmountofLiquidator[withdrawer]-amount;
        _totalAmount = _totalAmount-amount;
        token.burnFrom(withdrawer,amount);
        payable(withdrawer).transfer(amount);

    }
    /* 
    amount before -
    amount-
    token before-
    mintable token-
    */ 
    function calculateMintableToken(uint amount) public view returns(uint)
    {
        // (amount/amount before)*token before = mintable token 
        uint token_present = token.totalSupply(); 
        uint mintable_token;
        uint ratio=amount/_totalAmount;
        mintable_token = ratio*token_present; 
        return mintable_token;
    }

    function _withdraw(address borrower , uint amount) external onlyPool
    {
        _addressToAmountofBorrower[borrower] =  _addressToAmountofBorrower[borrower] + amount;
        _totalBorrow = _totalBorrow + amount;
        payable(borrower).transfer(amount);

    }
    function _repay(uint loanId) payable external onlyPool
    {
        _addressToAmountofBorrower[msg.sender] =  _addressToAmountofBorrower[msg.sender] - msg.value;
        _totalBorrow = _totalBorrow - msg.value;
        uint borrowedAmt = loanoperations.getLoanInfo(loanId).borrowedAmount;
        uint sf = calculateSetupFee(borrowedAmt);
        uint interest = lendinglogic.calculateInterest();
        // fetch the interest amount and store interest + setup fee in reserve 
        // A part of the interest also goes as supply interest to the liquidator
    }

    function getSetupFee () internal view returns(uint)
    {
        return _setupFee;
    }

    function calculateSetupFee (uint amount) internal view returns(uint)
    {
        uint sfr = getSetupFee();
        uint num = amount * sfr;
        uint denom = 100;
        uint ratio = num/denom;
        uint sf = ratio/10;

        return sf;

    }

    function withdrawReserve() external onlyOwner
    {
        payable(_owner).transfer(_totalReserve);
        _totalReserve=0;
        
    }

}