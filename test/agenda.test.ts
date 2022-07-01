import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-missing-import
import { Agenda } from "../typechain";

describe("Agenda", function () {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  let agenda: Agenda;
  const createAppointment = async (_date?: Date, _tomorrow?: Date) => {
    const from = _date ?? new Date();
    const to = _tomorrow ?? new Date();
    to.setDate(from.getDate() + 2);
    from.setDate(from.getDate() + 1);
    const txCreate = await agenda.schedule(
      Math.floor(from.getTime() / 100),
      Math.floor(to.getTime() / 100),
      [],
      false
    );
    return await txCreate.wait();
  };
  beforeEach(async function () {
    const Agenda = await ethers.getContractFactory("Agenda");

    [owner, addr1, addr2] = await ethers.getSigners();
    agenda = await Agenda.deploy();
    await agenda.deployed();
  });
  describe("Schedule", function () {
    it("Should schedule some appointment", async function () {
      const todayDate = new Date();
      const tomorrowDate = new Date();
      tomorrowDate.setDate(todayDate.getDate() + 1);
      const today = todayDate.getTime();
      const tomorrow = tomorrowDate.getTime();

      await expect(
        agenda.schedule(today, tomorrow, [addr1.address, addr2.address], false)
      )
        .to.emit(agenda, "AppointmentCreated")
        .withArgs(1, owner.address, today, tomorrow);
    });
    it("Should fails on schedule from date is bigger than to", async function () {
      const date = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(date.getDate() + 1);
      await expect(
        agenda.schedule(tomorrow.getTime(), date.getTime(), [], false)
      ).to.be.revertedWith("Date From must be bigger than To'");
    });
  });
  describe("Unschedule", function () {
    it("Should unschedule some appointment", async function () {
      const appointment = await createAppointment();
      const appointmentId = appointment.events![0].args!._id;
      await expect(agenda.unschedule(appointmentId))
        .to.emit(agenda, "AppointmentUnscheduled")
        .withArgs(appointmentId, owner.address);
    });
    it("Should fails on unschedule some invalid appointment", async function () {
      await expect(agenda.unschedule(3)).to.be.revertedWith(
        "Appointment does not exist"
      );
    });
    it("Should fails on unschedule some appointment that is not yours", async function () {
      const appointment = await createAppointment();
      const appointmentId = appointment.events![0].args!._id;
      await expect(
        agenda.connect(addr2).unschedule(appointmentId)
      ).to.be.revertedWith("Appointment is not yours");
    });
  });
  describe("Invite", function () {
    it("Should fails on invite more people into appointment that is not yours", async function () {
      const appointment = await createAppointment();
      const appointmentId = appointment.events![0].args!._id;
      await expect(
        agenda.connect(addr1).inviteMembers(appointmentId, [addr1.address])
      ).to.be.revertedWith("Appointment is not yours");
    });
    it("Should fails on invite more people into past appointment", async function () {
      const appointment = await createAppointment();
      const appointmentId = appointment.events![0].args!._id;
      const pastDate = new Date();
      pastDate.setDate(new Date().getDate() + 1);
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        Math.floor(pastDate.getTime() / 100),
      ]);

      await expect(
        agenda.inviteMembers(appointmentId, [addr1.address])
      ).to.be.revertedWith("Edit past appointments is not allowed");
    });
    it("Should fails on invite more people into invalid appointment", async function () {
      await expect(agenda.inviteMembers(3, [addr1.address])).to.be.revertedWith(
        "Appointment does not exist"
      );
    });
  });
  describe("Uninvite", function () {
    it("Should uninvite people from existing appointment", async function () {
      const from = new Date();
      const to = new Date();
      to.setDate(from.getDate() + 1);
      from.setDate(from.getDate() + 1);
      const appointment = await createAppointment(from, to);
      const appointmentId = appointment.events![0].args!._id;

      await expect(agenda.inviteMembers(appointmentId, [addr1.address]))
        .to.emit(agenda, "MemberInvited")
        .withArgs(appointmentId.toString(), 1, addr1.address);

      await expect(agenda.uninviteMembers(appointmentId, 1, [addr1.address]))
        .to.emit(agenda, "MemberUninvited")
        .withArgs(appointmentId.toString(), 1, addr1.address);
    });
    it("Should fails on uninvite people from past appointment", async function () {
      const from = new Date();
      const to = new Date();
      to.setDate(from.getDate() + 1);
      from.setDate(from.getDate() + 1);
      const appointment = await createAppointment(from, to);

      const appointmentId = appointment.events![0].args!._id;

      await expect(agenda.inviteMembers(appointmentId, [addr1.address]))
        .to.emit(agenda, "MemberInvited")
        .withArgs(appointmentId.toString(), 1, addr1.address);
      const pastDate = new Date();
      pastDate.setDate(new Date().getDate() + 10);
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        Math.floor(pastDate.getTime() / 100),
      ]);
      await expect(
        agenda.uninviteMembers(appointmentId, 1, [addr1.address])
      ).to.be.revertedWith("Edit past appointments is not allowed");
    });
    it("Should fails on uninvite people from invalid appointment", async function () {
      await expect(
        agenda.uninviteMembers(3, 1, [addr1.address])
      ).to.be.revertedWith("Appointment does not exist");
    });
  });
  describe("Move appointment", function () {
    it("Should moves to other time", async function () {
      const _from = new Date();
      const _to = new Date();
      _to.setDate(_from.getDate() + 10);
      _from.setDate(_from.getDate() + 10);
      const appointment = await createAppointment(_from, _to);
      const appointmentId = appointment.events![0].args!._id;

      _to.setDate(_from.getDate() + 3);
      _from.setDate(_from.getDate() + 2);
      await expect(
        agenda.move(
          appointmentId,
          Math.floor(_from.getTime() / 100),
          Math.floor(_to.getTime() / 100)
        )
      )
        .to.emit(agenda, "AppointmentMoved")
        .withArgs(
          appointmentId.toString(),
          Math.floor(_from.getTime() / 100),
          Math.floor(_to.getTime() / 100)
        );
    });
    it("Should fails on moves from is bigger than to", async function () {
      const _from = new Date();
      const _to = new Date();
      _to.setDate(_from.getDate() + 10);
      _from.setDate(_from.getDate() + 10);
      const appointment = await createAppointment(_from, _to);
      const appointmentId = appointment.events![0].args!._id;

      _to.setDate(_from.getDate() + 3);
      _from.setDate(_from.getDate() + 2);
      await expect(
        agenda.move(
          appointmentId,
          Math.floor(_to.getTime() / 100),
          Math.floor(_from.getTime() / 100)
        )
      ).to.be.revertedWith("Date To must be bigger than From");
    });
  });
  describe("Approve", function () {
    it("Should approve an invitation for appointment", async function () {
      const _from = new Date();
      const _to = new Date();
      _to.setDate(_from.getDate() + 10);
      _from.setDate(_from.getDate() + 10);
      const appointment = await createAppointment(_from, _to);
      const appointmentId = appointment.events![0].args!._id;
      const _inviteTx = await agenda.inviteMembers(appointmentId, [
        addr1.address,
      ]);
      const inviteTx = await _inviteTx.wait();
      const inviteId = inviteTx.events![0].args!._invitationId;

      await expect(agenda.connect(addr1).approveInvite(appointmentId, inviteId))
        .to.emit(agenda, "InvitationApproved")
        .withArgs(appointmentId, inviteId, addr1.address);
    });

    it("Should fails on approve an invitation for invalid appointment", async function () {
      await expect(
        agenda.connect(addr1).approveInvite(0, 0)
      ).to.be.revertedWith("Appointment does not exist'");
    });
  });
  describe("Deny", function () {
    it("Should deny an invitation for appointment", async function () {
      const _from = new Date();
      const _to = new Date();
      _to.setDate(_from.getDate() + 10);
      _from.setDate(_from.getDate() + 10);
      const appointment = await createAppointment(_from, _to);
      const appointmentId = appointment.events![0].args!._id;
      const _inviteTx = await agenda.inviteMembers(appointmentId, [
        addr1.address,
      ]);
      const inviteTx = await _inviteTx.wait();
      const inviteId = inviteTx.events![0].args!._invitationId;

      await expect(agenda.connect(addr1).denyInvite(appointmentId, inviteId))
        .to.emit(agenda, "InvitationDenied")
        .withArgs(appointmentId, inviteId, addr1.address);
    });

    it("Should fails on deny an invitation for invalid appointment", async function () {
      await expect(agenda.connect(addr1).denyInvite(0, 0)).to.be.revertedWith(
        "Appointment does not exist'"
      );
    });
  });
  describe("Fetch", function () {
    it("Should fetch the appointment by Id ", async function () {
      const from = new Date();
      const to = new Date();
      const appointment = await createAppointment(from, to);
      const appointmentId = appointment.events![0].args!._id;
      const result = await agenda.appointment(appointmentId);
      const expected = {
        owner: owner.address,
        from: Math.floor(from.getTime() / 100),
        to: Math.floor(to.getTime() / 100),
      };
      expect(result.owner).to.equal(expected.owner);
      expect(result.from).to.equal(expected.from);
      expect(result.to).to.equal(expected.to);
    });
    it("Should fails on fetch the appointment by Id and no exist ", async function () {
      await expect(agenda.appointment(1)).to.be.revertedWith(
        "Appointment does not exist"
      );
    });
  });
});
