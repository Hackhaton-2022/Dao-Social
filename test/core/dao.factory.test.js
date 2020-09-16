const Web3 = require('web3-utils');
const FlagHelperLib = artifacts.require('./v3/helpers/FlagHelper');
const DaoFactory = artifacts.require('./v3/core/DaoFactory');
const Registry = artifacts.require('./v3/core/Registry');
const MemberContract = artifacts.require('./v3/core/MemberContract');
const VotingContract = artifacts.require('./v3/core/VotingContract');
const ProposalContract = artifacts.require('./v3/core/ProposalContract');

contract('Registry', async (accounts) => {

  const numberOfShares = Web3.toBN('1000000000000000');
  const sharePrice = Web3.toBN(Web3.toWei("120", 'finney'));
  const zeroedAddr = "0x0000000000000000000000000000000000000000";
  const allowedTokens = [zeroedAddr];

  prepareSmartContracts = async () => {
    let lib = await FlagHelperLib.new();
    await MemberContract.link("FlagHelper", lib.address);
    await ProposalContract.link("FlagHelper", lib.address);
    let member = await MemberContract.new();
    let proposal = await ProposalContract.new();
    let voting = await VotingContract.new();
    return { voting, proposal, member };
  }

  assertRegiteredModule = async (dao, moduleId) => {
    let moduleAddr = await dao.getAddress(Web3.sha3(moduleId));
    assert.notEqual(moduleAddr, zeroedAddr);
    assert(Web3.isAddress(moduleAddr), "invalid address for module " + moduleId);
  }

  it("should be possible to create a DAO with all adapters and core modules", async () => {
    const myAccount = accounts[0];
    const { voting, member, proposal } = await prepareSmartContracts();

    //New factory
    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address,
      { from: myAccount, gasPrice: Web3.toBN("0") });

    //Create the DAO and get the DAO Address
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, allowedTokens, { from: myAccount, gasPrice: Web3.toBN("0") });
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    
    //Get the Registry
    let dao = await Registry.at(daoAddress);

    //Check if all Adapters are registered
    await assertRegiteredModule(dao, 'onboarding');
    await assertRegiteredModule(dao, 'financing');
    await assertRegiteredModule(dao, 'managing');

    //Check if all core modules are registered
    await assertRegiteredModule(dao, 'bank');
    await assertRegiteredModule(dao, 'member');
    await assertRegiteredModule(dao, 'proposal');
    await assertRegiteredModule(dao, 'voting');
  });

});