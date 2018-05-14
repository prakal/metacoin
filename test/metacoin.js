var MetaCoin = artifacts.require("./MetaCoin.sol");

// NOTE: to run tests, run `ganache-cli -a 700 -i 21` in a separate terminal

// cap, ownership, basic limit checks
contract('MetaCoin', function(accounts) {
  it("should have the correct owner", async function() {
    let instance = await MetaCoin.deployed();
    let address = await instance.owner.call();
    return assert.equal(address.valueOf(), accounts[0], "Contract owner is the first account");
  });
  it("total cap of tokens should be correct", async function() {
    let instance = await MetaCoin.deployed();
    let cap = await instance.cap.call();
    return assert.equal(cap.valueOf(), 12*10**6, "Total cap of tokens should be 12 million");
  });
  it("can mint to an address with no tokens", async function() {
    let instance = await MetaCoin.deployed();
    await instance.mint(accounts[1], 10**5, {from : accounts[0]});
    let balance = await instance.balanceOf(accounts[1])
    return assert.equal(balance.valueOf(), 10**5, "Balance of account 1 should be 10000");
  });
  it("should not mint to an address with more tokens than the limit", async function() {
    let instance = await MetaCoin.deployed();
    try {
      await instance.mint(accounts[1], 10**5 + 1, {from : accounts[0]});
    }
    catch (error){
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead`);
    }
  });
});
// before 6 million tokens minted checks
contract('MetaCoin', function(accounts) {
  it("should not mint more tokens than limit to an address with existing tokens", async function() {
    let instance = await MetaCoin.deployed();
    await instance.mint(accounts[1], 10**5 - 1, {from : accounts[0]});
    try {
      await instance.mint(accounts[1], 10, {from : accounts[0]});
    }
    catch (error){
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead`);
    }
  });
  it("should be able to mint additional tokens to an address as long as it is under the limit", async function() {
    let instance = await MetaCoin.deployed();
    await instance.mint(accounts[2], 10**4, {from : accounts[0]});
    await instance.mint(accounts[2], 10**4, {from : accounts[0]});
    let balance = await instance.balanceOf(accounts[2])
    return assert.equal(balance.valueOf(), 2*10**4, "Balance of account 2 should be 10000");
  });
  it("users should not be able to mint tokens while total supply is below 6 million", async function() {
    let instance = await MetaCoin.deployed();
    await instance.mint(accounts[3], 10**4, {from : accounts[0]});
    try {
      await instance.mint(accounts[3], 10**4, {from : accounts[3]});
    }
    catch (error){
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead`);
    }
  });
});
//until 6 million tokens minted by owner check
contract('MetaCoin', function(accounts) {
  it("should be able to mint several tokens to addresses as long as it is under the limit", async function() {
    let instance = await MetaCoin.deployed();
    let totalSupply = await instance.totalSupply()
    for (let i = 1; i < 61; i++){
      await instance.mint(accounts[i], 10**5, {from : accounts[0]});
    }
    totalSupply = await instance.totalSupply()
    return assert.equal(totalSupply.valueOf(), 6*10**6, "Total Supply should be 1 million");
  });
});
// right after 6 million tokens minted check
contract('MetaCoin', function(accounts) {
  it("should not let owner mint tokens to addresses after totalSupply exceeds limit", async function() {
    let instance = await MetaCoin.deployed();
    let dummyAddress = accounts[7];
    for (let i = 1; i < 61; i++){
      await instance.mint(dummyAddress+i, 10**5, {from : accounts[0]});
    }
    try {
      await instance.mint(accounts[63], 10**5, {from : accounts[0]});
    }
    catch (error){
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead. Total Supply exceeded 6 million, so owner should not be able to mint any more tokens`);
    }
  });
});
// user mint tokens after 6 million owner minted check
contract('MetaCoin', function(accounts) {
  it("should let a user mint tokens to their address after totalSupply exceeds 6 million", async function() {
    let instance = await MetaCoin.deployed();
    let dummyAddress = accounts[1];
    // contract owner initial mine of 6 million tokens
    for (let i = 1; i < 61; i++){
      await instance.mint(dummyAddress+i, 10**5, {from : accounts[0]});
    }
    await instance.mint(accounts[2], 10**3, {from : accounts[2]});
    let balance = await instance.balanceOf(accounts[2])
    return assert.equal(balance.valueOf(), 10**3, "Balance of account 2 should be 1000");
  });
});
// user mint tokens after 6 million owner minted further check
contract('MetaCoin', function(accounts) {
  it("should let a user mint tokens to their address after totalSupply exceeds 6 million and their limit has not been reached", async function() {
    let instance = await MetaCoin.deployed();
    let dummyAddress = accounts[1];
    // contract owner initial mine of 6 million tokens
    await instance.mint(dummyAddress, 10**5, {from : accounts[0]});
    for (let i = 1; i < 60; i++){
      await instance.mint(dummyAddress+i, 10**5, {from : accounts[0]});
    }
    await instance.mint(accounts[1], 10**3, {from : accounts[1]});
    let balance = await instance.balanceOf(accounts[1])
    return assert.equal(balance.valueOf(), 10**5 + 10**3, "Balance of account 1 should be 101000");
  });
});
// user minting excess tokens check
contract('MetaCoin', function(accounts) {
  it("should not let a user mint tokens to their address after totalSupply exceeds 6 million and their limit has been reached", async function() {
    let instance = await MetaCoin.deployed();
    let dummyAddress = accounts[1];
    // contract owner initial mine of 6 million tokens
    await instance.mint(dummyAddress, 10**5, {from : accounts[0]});
    for (let i = 1; i < 60; i++){
      await instance.mint(dummyAddress+i, 10**5, {from : accounts[0]});
    }
    try {
      await instance.mint(accounts[1], 2*10**4, {from : accounts[1]});
    }
    catch (error){
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead. User self-minting more than 10,000 tokens is not permitted.`);
    }
  });
});
// user transfer check before totalSupply reaches cap check
contract('MetaCoin', function(accounts) {
  it("should not let a user transfer tokens before 12 million token cap is reached", async function() {
    let instance = await MetaCoin.deployed();
    let dummyAddress = accounts[1];
    // contract owner initial mine of 6 million tokens
    await instance.mint(dummyAddress, 10**5, {from : accounts[0]});
    for (let i = 1; i < 60; i++){
      await instance.mint(dummyAddress+i, 10**5, {from : accounts[0]});
    }
    for (let i = 1; i < 30; i++){
      await instance.mint(accounts[i], 10**4, {from : accounts[i]});
    }
    try {
      await instance.transfer(accounts[2], 10**3, {from : accounts[1]});
    }
    catch (error){
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead. Should not let user transfer until totalSupply reaches 12 million.`);
    }
  });
});
// user transfer after totalSupply meets cap check
contract('MetaCoin', function(accounts) {
  it("should let a user transfer tokens after 12 million token cap is reached", async function() {
    let instance = await MetaCoin.deployed();
    let dummyAddress = accounts[2];
    // contract owner initial mine of 6 million tokens
    await instance.mint(dummyAddress, 10**5, {from : accounts[0]});
    for (let i = 1; i < 60; i++){
      await instance.mint(dummyAddress+i, 10**5, {from : accounts[0]});
    }
    for (let i = 1; i < 601; i++){
      await instance.mint(accounts[i], 10**4, {from : accounts[i]});
    }
    await instance.transfer(accounts[2], 10**3, {from : accounts[1]});
    let balance = await instance.balanceOf(accounts[2])
    return assert.equal(balance.valueOf(), 10**5 + 10**4 + 10**3, "Balance of account 2 should be 111000");
  });
});
// user mint before totalSupply exceeds limit check
contract('MetaCoin', function(accounts) {
  it("should not let a user mint tokens before 6 million token cap is reached", async function() {
    let instance = await MetaCoin.deployed();
    let dummyAddress = accounts[2];
    await instance.mint(dummyAddress, 10**5, {from : accounts[0]});
    try {
      await instance.mint(accounts[1], 10**4, {from : accounts[1]});
    }
    catch (error){
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead. Should not let user mint tokens before totalSupply reaches 6 million.`);
    }
  });
});
