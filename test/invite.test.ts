import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-missing-import
import { Agenda, Invite } from "../typechain";

describe("Invite", function () {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  let manager: Invite;
  let agenda: Agenda;

  beforeEach(async function () {
    const Agenda = await ethers.getContractFactory("Agenda");
    const Invite = await ethers.getContractFactory("Invite");
    [owner, addr1, addr2] = await ethers.getSigners();
    manager = await Invite.deploy();
    await manager.deployed();
    agenda = await Agenda.deploy();
    await agenda.deployed();
  });
  describe("Invite", function () {
    it("Should invite more people into existing appointment", async function () {
      const appointmentId = 24;

      await expect(manager.invite(appointmentId, [addr1.address]))
        .to.emit(manager, "MemberInvited")
        .withArgs(appointmentId, 1, addr1.address);
    });
  });
  describe("Uninvite", function () {});
  describe("Approve", function () {
    it("Should approve an invitation for appointment", async function () {
      const appointmentId = 25;
      const _inviteTx = await manager.invite(appointmentId, [addr1.address]);
      const inviteTx = await _inviteTx.wait();
      const inviteId = inviteTx.events![0].args!._invitationId;

      await expect(manager.connect(addr1).approve(appointmentId, inviteId))
        .to.emit(manager, "InvitationApproved")
        .withArgs(appointmentId, inviteId, addr1.address);
    });
    it("Should fails on deny an invitation when is not yours", async function () {
      const appointmentId = 25;
      const _inviteTx = await manager.invite(appointmentId, [addr1.address]);
      const inviteTx = await _inviteTx.wait();
      const inviteId = inviteTx.events![0].args!._invitationId;

      await expect(manager.deny(appointmentId, inviteId)).to.be.revertedWith(
        "This is not your invitation"
      );
    });
  });
  describe("Deny", function () {
    it("Should deny an invitation for appointment", async function () {
      const appointmentId = 25;
      const _inviteTx = await manager.invite(appointmentId, [addr1.address]);
      const inviteTx = await _inviteTx.wait();
      const inviteId = inviteTx.events![0].args!._invitationId;

      await expect(manager.connect(addr1).deny(appointmentId, inviteId))
        .to.emit(manager, "InvitationDenied")
        .withArgs(appointmentId, inviteId, addr1.address);
    });
    it("Should fails on approve an invitation when is not yours", async function () {
      const appointmentId = 25;
      const _inviteTx = await manager.invite(appointmentId, [addr1.address]);
      const inviteTx = await _inviteTx.wait();
      const inviteId = inviteTx.events![0].args!._invitationId;

      await expect(manager.approve(inviteId, appointmentId)).to.be.revertedWith(
        "This is not your invitation"
      );
    });
  });
});
