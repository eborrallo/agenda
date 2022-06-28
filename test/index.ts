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
    const date = _date ?? new Date();
    const tomorrow = _tomorrow ?? new Date();
    tomorrow.setDate(date.getDate() + 1);
    const txCreate = await agenda.schedule(
      Math.floor(date.getTime() / 1000),
      Math.floor(tomorrow.getTime() / 1000),
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

      await expect(agenda.schedule(today, tomorrow, [], false))
        .to.emit(agenda, "AppointmentCreated")
        .withArgs(1, owner.address, today, tomorrow);

      const appointments = await agenda.appointments(owner.address);
      expect(appointments[0].owner).to.equal(owner.address);
      expect(appointments[0].from).to.equal(today);
      expect(appointments[0].to).to.equal(tomorrow);
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
  describe("Invite", function () {
    it("Should invite more people into existing appointment", async function () {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 2);
      today.setDate(today.getDate() + 1);

      const appointment = await createAppointment(today, tomorrow);
      const appointmentId = appointment.events![0].args!._id;
      await expect(agenda.invite(appointmentId, [addr1.address]))
        .to.emit(agenda, "MemberInvited")
        .withArgs(appointmentId.toString(), addr1.address);
    });
    it("Should fails on invite more people into past appointment", async function () {
      const appointment = await createAppointment();
      const appointmentId = appointment.events![0].args!._id;
      await expect(
        agenda.invite(appointmentId, [addr1.address])
      ).to.be.revertedWith("Dates must be bigger than now");
    });
    it("Should fails on invite more people into invalid appointment", async function () {
      await expect(agenda.invite(3, [addr1.address])).to.be.revertedWith(
        "Appointment does not exist"
      );
    });
  });
  describe("Unschedule", function () {
    it("Should unschedule some appointment", async function () {});
    it("Should fails on unschedule some invalid appointment", async function () {});
  });
  describe("Uninvite", function () {
    it("Should uninvite people from existing appointment", async function () {});
    it("Should fails on uninvite people from past appointment", async function () {});
    it("Should fails on uninvite people from invalid appointment", async function () {});
  });
  describe("Move appointment", function () {
    it("Should moves to other time", async function () {});
    it("Should fails on moves from is bigger than to", async function () {});
  });
  describe("Fetch appointments from address", function () {
    it("Should returns all the appointment from address", async function () {});
    it("Should returns all the next appointment from address", async function () {});
  });
  describe("Approve", function () {
    it("Should approve an invitation for appointment", async function () {});
    it("Should fails on approve an invitation for invalid appointment", async function () {});
  });
  describe("Deny", function () {
    it("Should deny an invitation for appointment", async function () {});
    it("Should fails on deny an invitation for invalid appointment", async function () {});
  });
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
