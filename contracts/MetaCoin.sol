pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/token/ERC20/CappedToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract MetaCoin is CappedToken(MetaCoin.CAP), PausableToken {
    // constants
    uint256 public constant CAP = 12*10**6;
    uint256 public constant OWNER_MINT_CAP = 6*10**6;
    uint256 public constant OWNER_MINT_TOKEN_LIMIT = 10**5;
    uint256 public constant USER_MINT_TOKEN_LIMIT = 10**4;
    string public name;
    string public symbol;


    mapping(address => uint) userMintedBalances;
    function MetaCoin() public {
        name = "NAME OF YOUR TOKEN HERE";
        symbol = "META";
    }

    modifier whenNotPaused() {
        require(totalSupply_ == CAP);
        _;
    }

    /**
    * @dev Function to mint tokens
    * @param _to The address that will receive the minted tokens.
    * @param _amount The amount of tokens to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(address _to, uint256 _amount) canMint public returns (bool) {
        require(totalSupply_.add(_amount) <= cap);
        require(
            (msg.sender == owner && totalSupply_.add(_amount) <= OWNER_MINT_CAP && balances[_to].add(_amount) <= OWNER_MINT_TOKEN_LIMIT) ||
            (msg.sender == _to && totalSupply_.add(_amount) > OWNER_MINT_CAP && userMintedBalances[_to].add(_amount) <= USER_MINT_TOKEN_LIMIT)
        );
        return modifiedMint(_to, _amount);
    }

    /**
    * @dev Function to mint tokens
    * @param _to The address that will receive the minted tokens.
    * @param _amount The amount of tokens to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function modifiedMint(address _to, uint256 _amount) canMint private returns (bool) {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        if (msg.sender == _to){
            userMintedBalances[_to] = userMintedBalances[_to].add(_amount);
        }
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }
}
